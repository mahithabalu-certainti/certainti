/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import FinancialWorking from './financial-working';
import { useSelector } from 'react-redux';
import {
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
} from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
// import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '../../../../../../../store/store';
import { useToast } from '../../../../../../../hooks';
import { useFetchState } from '../../../../../../services/account';
import { AllPermissions } from '../../../../../../../common-service';
import { COMMON_MENU_PROPS, getSelectStyles } from '../rd-form/helper';
import {
  CaseDetails,
  FinancialHighlightsResponse,
  RDCreditStatusResponse,
} from '../../../../../../types';
import TextButton from '../../../../../../../components/button/text-button';
import {
  useFinancialHighlights,
  useInitiateRDCreditProcess,
  useRDCreditStatus,
} from '../../../../../../services/case-dossier/cases-financial-services';

interface FinancialWorkingFormProps {
  caseDetails?: CaseDetails;
  setDossierFinancialStatus: (status: string) => void;
  dossierFinancialStatus: string;
}

interface FormErrors {
  country?: string;
  region?: string;
}

const FinancialWorkingForm: React.FC<FinancialWorkingFormProps> = ({
  caseDetails,
  setDossierFinancialStatus,
  dossierFinancialStatus,
}) => {
  const [isFederal, setIsFederal] = useState<string>('yes');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showFinancialValue, setShowFinancialValues] = useState<boolean>(false);
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { permission } = useSelector((state: RootState) => state.permission);
  const { successToast, errorToast } = useToast();
  // const queryClient = useQueryClient();

  const { mutate: initiateProcess, isPending: isInitiating } =
    useInitiateRDCreditProcess();
  const { mutate: financialHighlights, isPending: isFinancialHighlights } =
    useFinancialHighlights();

  // Fetch Status
  const {
    data: statusData,
    refetch: refetchRDCreditStatus,
    isRefetching,
  } = useRDCreditStatus(accountid, caseId ?? '', false);

  const caseCountryDetails = {
    country_name: caseDetails?.country_name || '',
    country_code: caseDetails?.country_code || '',
    country_id: caseDetails?.country_rid || '',
    isFederal: true,
  };

  const region = useFetchState((caseDetails?.country_rid ?? '') as string);

  const regionListOptions = useMemo(
    () =>
      region.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [region.data?.data.states]
  );

  // Permission
  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  const handleFederalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setIsFederal(value);
    setShowFinancialValues(false);
    setSelectedRegion('');
    setErrors((prev) => ({ ...prev, region: '' }));
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setErrors((prev) => ({ ...prev, region: '' }));

    // Reset PDF when region changes (but not shown yet)
    if (showFinancialValue) {
      setShowFinancialValues(false);
    }
  };

  const [financialData, setFinancialData] =
    useState<FinancialHighlightsResponse | null>(null);

  const handleViewFinancialHighlights = async () => {
    // const { data, isLoading, isError } = await fetchRDCreditPreview(
    //     accountid,
    //     caseId,
    //     selectedRegion
    //   );

    // // Validate region if federal is "No"
    // if (isFederal === 'no' && !selectedRegion) {
    //     setErrors((prev) => ({ ...prev, region: 'Please select a region' }));
    //     return;
    // }
    // // Show PDF viewer - React Query hook will automatically fetch the data
    // setShowPdfViewer(true);
    const payload = {
      account_rid: accountid,
      case_rid: caseId ?? '',
    };

    financialHighlights(payload, {
      onSuccess: (data) => {
        console.log('Initiated successfully', data);
        // Type guard: ensure the data is FinancialHighlightsResponse before setting state
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          typeof data.data === 'object' &&
          data.data !== null &&
          !Array.isArray(data.data)
        ) {
          setFinancialData(data as FinancialHighlightsResponse);
        } else {
          setFinancialData(null);
        }
        setShowFinancialValues(true);
      },
      onError: (error) => {
        console.error('Error initiating', error);
        errorToast('Failed to initiate');
      },
    });
  };

  const handleStatusUpdate = (
    statusData: RDCreditStatusResponse,
    actionType?: 'initiate' | 'regenerate' | 'refresh'
  ) => {
    const message = statusData?.data ?? statusData?.statusMessage ?? '';
    setDossierFinancialStatus(message);

    if (statusData?.data === 'COMPLETED') {
      if (actionType === 'initiate') {
        successToast('Initiated successfully');
      } else if (actionType === 'regenerate') {
        successToast('Re-Generated successfully');
      } else {
        successToast(message || 'Process Completed');
      }
    } else if (message) {
      // If there is a message but not completed, it might be an info or error
      // depending on business logic. User used errorToast in useEffect.
      errorToast(message);
    }
  };

  const handleInitiateFinancialHighlights = async () => {
    setDossierFinancialStatus('');
    const actionType =
      statusData?.data === 'COMPLETED' ? 'regenerate' : 'initiate';
    const payload = {
      account_rid: accountid,
      case_rid: caseId ?? '',
      fiscal_year: Number(caseDetails?.fiscal_year || 0),
    };
    if (dossierFinancialStatus === 'COMPLETED') {
      setShowFinancialValues(false);
      setFinancialData(null);
    }
    initiateProcess(payload, {
      onSuccess: async (data) => {
        console.log('Initiated successfully', data);
        // successToast('Initiated successfully');
        // Refetch and handle status
        const result = await refetchRDCreditStatus();
        if (result.data) {
          handleStatusUpdate(result.data, actionType);
        }
      },
      onError: (error) => {
        console.error('Error initiating', error);
        errorToast('Failed to initiate');
      },
    });
  };
  const isViewButtonEnabled = () => {
    const isStatusCompleted = statusData?.data === 'COMPLETED';
    if (!isStatusCompleted) return false;

    if (isFederal === 'yes') {
      return true;
    } else if (isFederal === 'no') {
      return selectedRegion !== '';
    }
    return false;
  };

  const handleRefreshStatus = async () => {
    const result = await refetchRDCreditStatus();
    if (result.data) {
      handleStatusUpdate(result.data, 'refresh');
    }
  };

  return (
    <div className='w-full'>
      {/* Federal Level Radio Buttons */}
      <div className='pb-2'>
        <div className='flex items-center justify-between capitalize h-[30px] border-b border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
          <div>Jurisdiction Information</div>
          <div>
            <TextButton // icon={<RefreshIcon />}
              label={'Refresh'}
              // loading={isRefetching}
              onClick={handleRefreshStatus}
              disabled={
                !dossierFinancialStatus ||
                dossierFinancialStatus === 'COMPLETED' ||
                isRefetching
              }
              sx={{
                width: 'auto',
                minWidth: '55px',
                fontSize: '13px',
                fontWeight: 400,
                marginRight: '10px',
              }}
            />
            <TextButton
              label={'View'}
              loading={isFinancialHighlights}
              onClick={handleViewFinancialHighlights}
              disabled={!isViewButtonEnabled() || isFinancialHighlights}
              sx={{
                width: '55px',
                minWidth: '55px',
                fontSize: '13px',
                fontWeight: 400,
                marginRight: '10px',
              }}
            />
            <TextButton
              label={
                statusData?.data === 'COMPLETED' ? 'Re-Generate' : 'Initiate'
              }
              loading={isInitiating}
              onClick={handleInitiateFinancialHighlights}
              disabled={
                isInitiating ||
                (!!dossierFinancialStatus &&
                  dossierFinancialStatus !== 'COMPLETED')
              }
              sx={{
                width: statusData?.data === 'COMPLETED' ? '95px' : '55px',
                minWidth: statusData?.data === 'COMPLETED' ? '95px' : '55px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
        </div>
        <div className='px-4 pt-3'>
          <FormControl component='fieldset' disabled={!caseDetails?.is_state_available}>
            <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] mb-2 block'>
              Federal Level
            </label>
            <RadioGroup
              row
              value={isFederal}
              onChange={handleFederalChange}
              className='gap-6'
            >
              <FormControlLabel
                value='yes'
                control={
                  <Radio
                    disableRipple
                    sx={{
                      color: '#CBD6E2',
                      '&.Mui-checked': {
                        color: '#3B82F6',
                      },
                      padding: '4px 8px',
                    }}
                  />
                }
                label={
                  <span className='text-[13px] text-[#2D3E4F] font-medium'>
                    Yes
                  </span>
                }
              />
              <FormControlLabel
                value='no'
                control={
                  <Radio
                    disableRipple
                    sx={{
                      color: '#CBD6E2',
                      '&.Mui-checked': {
                        color: '#3B82F6',
                      },
                      padding: '4px 8px',
                    }}
                  />
                }
                label={
                  <span className='text-[13px] text-[#2D3E4F] font-medium'>
                    No
                  </span>
                }
              />
            </RadioGroup>
          </FormControl>
        </div>
        {/* Country and Region Fields */}
        <div className='grid md:grid-cols-2 gap-x-4 gap-y-3 px-4 py-3'>
          <div
            style={{
              display:
                !accountPermissionMap?.['country_rid']?.read &&
                !accountPermissionMap?.['country_rid']?.edit
                  ? 'none'
                  : 'block',
            }}
          >
            <label
              className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1'
              htmlFor='country_name'
            >
              Country <span className='text-red-500'> *</span>
            </label>
            <input
              type='text'
              name='country_name'
              placeholder='-'
              autoComplete='off'
              className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${
                errors?.country &&
                'border-red-500 disabled:!bg-[#FEF2F2] bg-[#FEF2F2]'
              }`}
              disabled={true}
              value={caseCountryDetails.country_name}
            />
            {errors?.country && (
              <span className='text-[12px] text-red-400 col-span-full'>
                {errors.country}
              </span>
            )}
          </div>

          {isFederal === 'no' && (
            <div
              style={{
                display:
                  !accountPermissionMap?.['region_rid']?.read &&
                  !accountPermissionMap?.['region_rid']?.edit
                    ? 'none'
                    : 'block',
              }}
            >
              <label
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1'
                htmlFor='region'
              >
                Region
              </label>

              <Select
                name='region'
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                displayEmpty
                fullWidth
                size='small'
                className={`custom-select-no-arrow sm:text-sm ${
                  selectedRegion === '' ? 'text-[#7D98B6]' : 'text-black'
                } ${errors?.region ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                MenuProps={COMMON_MENU_PROPS}
                sx={getSelectStyles(!!errors?.region, selectedRegion === '')}
                disabled={
                  accountPermissionMap?.['region_rid']?.read &&
                  !accountPermissionMap?.['region_rid']?.edit
                }
              >
                <MenuItem
                  value=''
                  sx={{
                    color: '#7D98B6',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  Choose Region
                </MenuItem>
                {regionListOptions?.map((option, i) => (
                  <MenuItem
                    key={`${option.value}-${i}`}
                    value={option.value}
                    title={option.label}
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              {errors?.region && (
                <span className='text-[12px] text-red-400 col-span-full'>
                  {errors.region}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial Working Section - Only shown after clicking View button */}
      {showFinancialValue && (
        <div>
          <div className='capitalize h-[30px] border-b border-t border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
            Federal R&D Credit
          </div>
          <div>
            <FinancialWorking data={financialData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialWorkingForm;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import FinancialWorking from './financial-working';
import FinancialWorkingAustralia from './financial-working-australia';
import FinancialWorkingUSA from './financial-working-usa';
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
import { FinancialWorkingCountries } from '../../../../../../types/interactions';
import TextButton from '../../../../../../../components/button/text-button';
import { costDisplay } from '../../../../../../../common-utils';
import {
  fetchRDCreditPreview,
  useFinancialHighlights,
  useInitiateRDCreditProcess,
  useRDCreditStatus,
} from '../../../../../../services/case-dossier/cases-financial-services';
import SignOffModal from './sign-off-modal';

interface FinancialWorkingFormProps {
  caseDetails?: CaseDetails;
  setDossierFinancialStatus: (status: string) => void;
  dossierFinancialStatus: string;
  financialData: FinancialHighlightsResponse | null;
  setFinancialData: (data: FinancialHighlightsResponse | null) => void;
}

interface FormErrors {
  country?: string;
  region?: string;
}

const FinancialWorkingUKTable = ({
  data,
  currencySymbol,
}: {
  data: FinancialHighlightsResponse | null;
  currencySymbol?: string;
}) => {
  const computedFields = data?.data?.computed_fields as any;
  const submissions =
    computedFields?.[
      'Technical Submissions by Cost that are 50% or more of Total QRE'
    ] || [];
  const hmrcTotal =
    computedFields?.['Total Project to be shared with HMRC']?.Total;

  return (
    <div className='pb-4'>
      <table className='w-full border-collapse border border-[#CBD6E2]'>
        <thead>
          <tr className='bg-[#ECECEC]'>
            <th className='border border-[#CBD6E2] px-3 py-2 text-left text-[13px] font-bold text-[#2D3E4F]'>
              Technical Submissions by Cost that are 50% or more of Total QRE
            </th>
            <th className='border border-[#CBD6E2] px-3 py-2 text-right text-[13px] font-bold text-[#2D3E4F] w-[200px]'>
              Total Project Value/Labor
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.length > 0 ? (
            submissions.map((project: any, index: number) => (
              <tr key={index} className='border-b border-[#CBD6E2]'>
                <td className='border border-[#CBD6E2] px-3 py-2 text-[13px] text-[#425A76]'>
                  {project['Project Name']}
                </td>
                <td className='border border-[#CBD6E2] px-3 py-2 text-right text-[13px] text-[#425A76]'>
                  {costDisplay(
                    project['Total Project Value/Labor'] || 0,
                    currencySymbol || '$'
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr className='border-b border-[#CBD6E2]'>
              <td
                colSpan={2}
                className='border border-[#CBD6E2] px-3 py-4 text-center text-[13px] text-[#425A76] italic'
              >
                No data available
              </td>
            </tr>
          )}
          {hmrcTotal !== undefined && hmrcTotal !== null && (
            <tr className='bg-[#F9FAFB]'>
              <td className='border border-[#CBD6E2] px-3 py-2 text-[13px] font-bold text-[#2D3E4F]'>
                Total Project to be shared with HMRC
              </td>
              <td className='border border-[#CBD6E2] px-3 py-2 text-right text-[13px] font-bold text-[#2D3E4F]'>
                {costDisplay(hmrcTotal || 0, currencySymbol || '$')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const FinancialWorkingUKPercentageTable = ({
  data,
  currencySymbol,
}: {
  data: FinancialHighlightsResponse | null;
  currencySymbol?: string;
}) => {
  const computedFields = data?.data?.computed_fields as any;
  const percentageCalc = computedFields?.['Percentage Calculation'];

  if (!percentageCalc) return null;

  return (
    <div className='pb-4'>
      <table className='w-full border-collapse border border-[#CBD6E2]'>
        {/* <thead>
          <tr className='bg-[#ECECEC]'>
            <th className='border border-[#CBD6E2] px-3 py-2 text-left text-[13px] font-bold text-[#2D3E4F]'>
              Percentage Calculation
            </th>
            <th className='border border-[#CBD6E2] px-3 py-2 text-right text-[13px] font-bold text-[#2D3E4F] w-[200px]'>
              Value
            </th>
          </tr>
        </thead> */}
        <tbody>
          {Object.entries(percentageCalc).map(([key, value], index) => (
            <tr key={index} className='border-b border-[#CBD6E2]'>
              <td className='border border-[#CBD6E2] px-3 py-2 text-[13px] text-[#425A76]'>
                {key}
              </td>
              <td className='border border-[#CBD6E2] px-3 py-2 text-right text-[13px] text-[#425A76]'>
                {typeof value === 'number' && key !== 'Total Customer Groups'
                  ? costDisplay(value as number, currencySymbol || '$')
                  : (value as React.ReactNode)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FinancialWorkingForm: React.FC<FinancialWorkingFormProps> = ({
  caseDetails,
  setDossierFinancialStatus,
  dossierFinancialStatus,
  financialData,
  setFinancialData,
}) => {
  const [isFederal, setIsFederal] = useState<string>('yes');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showFinancialValue, setShowFinancialValues] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { permission } = useSelector((state: RootState) => state.permission);
  const { successToast, errorToast } = useToast();
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState<boolean>(false);
  // const queryClient = useQueryClient();

  // Restore showFinancialValues and form states if data exists
  React.useEffect(() => {
    if (financialData) {
      setShowFinancialValues(true);
      
      // Restore region/federal state from payload if available
      const stateRid = (financialData.data as any)?.state_rid;
      if (stateRid) {
        setIsFederal('no');
        setSelectedRegion(stateRid);
      } else if (financialData.data) {
        setIsFederal('yes');
      }
    }
  }, [financialData]);

  const isFinancialWorkingSignoff = caseDetails?.financial_working_signoff;

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

  const region = useFetchState(
    (caseDetails?.country_rid ?? '') as string,
    'active'
  );

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
    setFinancialData(null);
    setSelectedRegion('');
    setErrors((prev) => ({ ...prev, region: '' }));
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setErrors((prev) => ({ ...prev, region: '' }));
    setFinancialData(null);

    // Reset PDF when region changes (but not shown yet)
    if (showFinancialValue) {
      setShowFinancialValues(false);
    }
  };

  const responseCurrencySymbol = caseDetails?.currency_symbol || '$';


  const handleViewFinancialHighlightsForRegion = async () => {
    try {
      setIsPreviewLoading(true);
      const response = await fetchRDCreditPreview(
        accountid,
        caseId ?? '',
        selectedRegion
      );
      if (response) {
        setFinancialData(response as unknown as FinancialHighlightsResponse);
        setShowFinancialValues(true);
      }
    } catch (error) {
      console.error(error);
      errorToast('Failed to initiate');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleViewFinancialHighlights = async () => {
    if (isFederal === 'no' && selectedRegion) {
      await handleViewFinancialHighlightsForRegion();
      return;
    }

    const payload = {
      account_rid: accountid,
      case_rid: caseId ?? '',
    };

    financialHighlights(payload, {
      onSuccess: (data) => {
        setFinancialData(data as FinancialHighlightsResponse);
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
      if (actionType === 'initiate' || actionType === 'refresh') {
        successToast('Initiated successfully');
      } else if (actionType === 'regenerate') {
        successToast('Re-Generated successfully');
      }
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
      onError: (error:any) => {
        errorToast(error?.response.data.statusMessage || 'Failed to initiate');
      },
    });
  };

  const handleRefreshStatus = async () => {
    const result = await refetchRDCreditStatus();
    if (result.data) {
      handleStatusUpdate(result.data, 'refresh');
    }
  };

  if (
    !caseDetails?.case_total_projects ||
    caseDetails?.case_total_projects === 0 ||
    caseDetails?.case_total_projects === '0'
  ) {
    return (
      <div className='w-full p-8 flex flex-col items-center justify-center text-center'>
        <div className='bg-[#FEF8F0] border border-[#FFC77B] rounded-md p-6 max-w-md'>
          <p className='text-[15px] font-semibold text-[#2D3E4F] mb-2'>
            No projects assigned to this case.
          </p>
          <p className='text-[13px] text-[#425A76]'>
            Please assign projects to the case to view financial highlights and
            calculations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {/* Federal Level Radio Buttons */}
      <div className='pb-2'>
        <div className='flex items-center justify-between capitalize h-[30px] border-b border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
          <div>{caseDetails?.country_name} Financial Information</div>
          <div>
            <TextButton
              label={'Sign off'}
              onClick={() => setIsSignOffModalOpen(true)}
              disabled={ dossierFinancialStatus === 'COMPLETED' || isFinancialWorkingSignoff}
              sx={{
                width: 'auto',
                minWidth: '65px',
                fontSize: '13px',
                fontWeight: 400,
                marginRight: '10px',
              }}
            />
            <TextButton 
              label={'Refresh'}
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
              loading={isFinancialHighlights || isPreviewLoading}
              onClick={handleViewFinancialHighlights}
              disabled={
              dossierFinancialStatus === 'COMPLETED' ||
                isFinancialHighlights ||
                isPreviewLoading ||
                showFinancialValue
              }
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
                dossierFinancialStatus === 'COMPLETED'
                  ? 'Re-Generate'
                  : 'Initiate'
              }
              loading={isInitiating}
              onClick={handleInitiateFinancialHighlights}
              disabled={
                isInitiating ||
                isRefetching ||
                (!!dossierFinancialStatus &&
                  dossierFinancialStatus !== 'COMPLETED')
              }
              sx={{
                width: dossierFinancialStatus === 'COMPLETED' ? '95px' : '55px',
                minWidth:
                  dossierFinancialStatus === 'COMPLETED' ? '95px' : '55px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
        </div>
        <div className='px-4 pt-3'>
          <FormControl
            component='fieldset'
            disabled={!caseDetails?.is_state_available}
          >
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

      {showFinancialValue && (
        <div className=''>
          {/* Dynamic Title Header based on Country */}
          {(() => {
            const title =
              (financialData?.data?.computed_fields as any)?.Title || {};
            const countryName = caseDetails?.country_name;

            if (countryName === FinancialWorkingCountries.Ireland) {
              return (
                <div className='flex flex-col items-center justify-center py-1 text-[#2D3E4F] '>
                  <div className='text-[14px] font-semibold'>
                    Expleo - {title['Expleo'] || ''}
                  </div>
                  <div className='text-[14px] font-semibold mt-1'>
                    {title['Description'] || 'Summary of R&D Expenditures'}
                  </div>
                </div>
              );
            }

            if (countryName === FinancialWorkingCountries.UK) {
              return (
                <div className='flex flex-col items-start justify-start py-1 text-[#2D3E4F] px-4'>
                  <div className='text-[14px] font-semibold'>
                    {title['Account Name'] || ''}
                  </div>
                  <div className='text-[14px] font-semibold mt-1'>
                    {title['Description'] || 'Summary of SR&ED Expenditures'}
                  </div>
                  <div className='text-[14px] mt-1'>
                    <span className='font-semibold'>Fiscal Year:</span>{' '}
                    {title['Fiscal Year'] || ''}
                  </div>
                </div>
              );
            }
            if (countryName === FinancialWorkingCountries.Australia) {
              return (
                <div className='flex flex-col items-start justify-start py-1 text-[#2D3E4F] px-4'>
                  <div className='text-[14px] font-semibold'>
                    {title['Account Name'] || ''}
                  </div>
                  <div className='text-[14px] font-semibold mt-1'>
                    {title['Description'] || 'Summary of SR&ED Expenditures'}
                  </div>
                </div>
              );
            }

            if (countryName === FinancialWorkingCountries.Canada) {
              return (
                <div className='flex items-center justify-start py-1 text-[#2D3E4F] px-4'>
                  <div className='text-[14px] font-semibold'>
                    Ref - {title['Fiscal Year'] || ''} -{' '}
                    {title['Descriptions'] || ''}
                  </div>
                </div>
              );
            }

            // Default fallback or no title
            return null;
          })()}

          <div className='capitalize h-[30px] border-b border-t border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
            {(financialData?.data?.input_params?.credit_type as string) ||
              'Federal R&D Credit'}
          </div>
          <div>
            {caseDetails?.country_name ===
            FinancialWorkingCountries.Australia ? (
              <FinancialWorkingAustralia data={financialData} />
            ) : caseDetails?.country_name === FinancialWorkingCountries.US ? (
              <FinancialWorkingUSA data={financialData} />
            ) : (
              <FinancialWorking
                data={financialData}
                currencySymbol={responseCurrencySymbol}
              />
            )}
          </div>
          {caseDetails?.country_name === FinancialWorkingCountries.UK && (
            <div className='flex flex-wrap md:flex-nowrap gap-4 px-4 pt-4'>
              <div className='w-full md:w-1/2'>
                <FinancialWorkingUKTable
                  data={financialData}
                  currencySymbol={responseCurrencySymbol}
                />
              </div>
              <div className='w-full md:w-1/2'>
                <FinancialWorkingUKPercentageTable
                  data={financialData}
                  currencySymbol={responseCurrencySymbol}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <SignOffModal
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        caseId={caseId ?? ''}
        accountId={accountid}
      />
    </div>
  );
};

export default FinancialWorkingForm;

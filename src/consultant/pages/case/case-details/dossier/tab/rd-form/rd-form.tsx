import React, { useState, useMemo } from 'react';
import {
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import { CaseDetails } from '../../../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { useFetchState } from '../../../../../../services/account';
import { AllPermissions } from '../../../../../../../common-service';
import TextButton from '../../../../../../../components/button/text-button';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';
import PdfViewer from './pdf-viewer';
import { useParams, useSearchParams } from 'react-router';
import { useToast } from '../../../../../../../hooks';
import { useRDFormMapper, useRDFormMapperPreviewMutation } from '../../../../../../services/case-dossier/cases-financial-services';

interface RDFormProps {
  caseDetails?: CaseDetails;
}

interface FormErrors {
  country?: string;
  region?: string;
}

const RDForm: React.FC<RDFormProps> = ({ caseDetails }) => {
  const [isFederal, setIsFederal] = useState<string>('yes');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPdfViewer, setShowPdfViewer] = useState<boolean>(false);
  const [rdFormData, setRdFormData] = useState<string>('');
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { permission } = useSelector((state: RootState) => state.permission);
  const { successToast, errorToast } = useToast();
  const { mutate: rdFormInitiate, isPending: isRDFormInitiate } =
    useRDFormMapper();
  const { mutate: previewRDCredit, isPending: isPreviewLoading, isError: isPreviewError } =
    useRDFormMapperPreviewMutation();

  const caseCountryDetails = {
    country_name: caseDetails?.country_name || '',
    country_code: caseDetails?.country_code || '',
    country_id: caseDetails?.country_rid || '',
  };

  const region = useFetchState(caseDetails?.country_rid || '');

  const regionListOptions = useMemo(
    () =>
      region.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [region.data?.data.states]
  );

  // const {
  //   data: rdFormData,
  //   isLoading: isLoadingPdf,
  //   isError: isPdfError,
  // } = useGetRDFormData(
  //   caseDetails?.account_rid || '',
  //   caseCountryDetails.country_id,
  //   isFederal === 'no' ? selectedRegion : undefined,
  //   showPdfViewer // Only fetch when viewer is shown
  // );

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
    setShowPdfViewer(false);
    setSelectedRegion('');
    setErrors((prev) => ({ ...prev, region: '' }));
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setErrors((prev) => ({ ...prev, region: '' }));

    // Reset PDF when region changes (but not shown yet)
    if (showPdfViewer) {
      setShowPdfViewer(false);
    }
  };

  const handleViewFinancialHighlightsForRegion = async () => {
    if (isFederal === 'no' && !selectedRegion) {
      setErrors((prev) => ({ ...prev, region: 'Please select a region' }));
      return;
    }
    previewRDCredit(
      {
        accountrid: accountid,
        caseId: caseId ?? '',
        stateRid: selectedRegion,
        isFederal: isFederal === 'yes',
      },
      {
        onSuccess: (response) => {
          if (response?.data) {
            setRdFormData(response?.data);
            setShowPdfViewer(true);
          } else {
            errorToast('No data available');
          }
        },
        onError: (error) => {
          console.error(error);
          setRdFormData(null);
          errorToast('Failed to fetch financial highlights');
        },
      }
    );
  };

  const handleViewRdFormsData = async () => {
    // if (isFederal === 'no' && !selectedRegion) {
    //   setErrors((prev) => ({ ...prev, region: 'Please select a region' }));
    //   return;
    // }
    // if (isFederal === 'no' && selectedRegion) {
    //   await handleViewFinancialHighlightsForRegion();
    //   return;
    // }

    const payload = {
      account_rid: accountid,
      case_rid: caseId ?? '',
      fiscal_year: Number(caseDetails?.fiscal_year || 0),
    };

    rdFormInitiate(payload, {
      onSuccess: (data) => {
        setRdFormData(data as FinancialHighlightsResponse);
        setShowPdfViewer(true);
      },
      onError: (error) => {
        console.error('Error initiating', error);
        errorToast('Failed to initiate');
      },
    });
  };

  const handleViewPdf = () => {
    // Validate region if federal is "No"
    if (isFederal === 'no' && !selectedRegion) {
      setErrors((prev) => ({ ...prev, region: 'Please select a region' }));
      return;
    }

    // Show PDF viewer - React Query hook will automatically fetch the data
    setShowPdfViewer(true);
  };

  const isViewButtonEnabled = () => {
    if (isFederal === 'yes') {
      return true;
    } else if (isFederal === 'no') {
      return selectedRegion !== '';
    }
    return false;
  };

  return (
    <div className='w-full'>
      {/* Federal Level Radio Buttons */}
      <div className='pb-2'>
        <div className='flex items-center justify-between capitalize h-[30px] border-b border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
          <div>Jurisdiction Information</div>
          <TextButton
            label={'View'}
            loading={isPreviewLoading}
            onClick={handleViewFinancialHighlightsForRegion}
            disabled={!isViewButtonEnabled() || isPreviewLoading}
            sx={{
              width: '55px',
              minWidth: '55px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label={'Initiate'}
            loading={isRDFormInitiate}
            onClick={handleViewRdFormsData}
            disabled={!isViewButtonEnabled() || isRDFormInitiate}
            sx={{
              width: '55px',
              minWidth: '55px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
        <div className='px-4 pt-3'>
          <FormControl component='fieldset'>
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
              className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.country &&
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
                className={`custom-select-no-arrow sm:text-sm ${selectedRegion === '' ? 'text-[#7D98B6]' : 'text-black'
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

      {/* PDF Viewer Section - Only shown after clicking View button */}
      {showPdfViewer && (
        <div>
          <div className='capitalize h-[30px] border-b border-t border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
            PDF Viewer
          </div>
          <div className='max-h-[600px] overflow-auto p-3'>
            <PdfViewer
              pdfUrl={rdFormData || ''}
              isLoadingPdf={isPreviewLoading}
              isPdfError={isPreviewError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RDForm;

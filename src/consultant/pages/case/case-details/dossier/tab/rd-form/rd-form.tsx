import React, { useState, useMemo, useEffect } from 'react';
import { Select, MenuItem } from '@mui/material';
import { CaseDetails } from '../../../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { useFetchState } from '../../../../../../services/account';
import { AllPermissions } from '../../../../../../../common-service';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';
import PdfViewer from './pdf-viewer';
import { useParams, useSearchParams } from 'react-router';
import { SectionHeaderTab } from '../../../../../../../components';
import {
  useRDFormMapperGenerate,
  useRDFormMapperPreview,
} from '../../../../../../services/case-dossier/case-dossier-service';

interface RDFormProps {
  caseDetails?: CaseDetails;
  isFinancialWorkingSignoff?: boolean;
}

interface FormErrors {
  country?: string;
  region?: string;
}

const RDForm: React.FC<RDFormProps> = ({
  caseDetails,
  isFinancialWorkingSignoff,
}) => {
  const [activeTab, setActiveTab] = useState<string>('federal');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { permission } = useSelector((state: RootState) => state.permission);

  const caseCountryDetails = {
    country_name: caseDetails?.country_name || '',
    country_code: caseDetails?.country_code || '',
    country_id: caseDetails?.country_rid || '',
  };

  const { isSuccess: isGenerateSuccess } = useRDFormMapperGenerate(
    accountid,
    caseId ?? '',
    caseDetails?.fiscal_year,
    !!isFinancialWorkingSignoff
  );

  const isFederal = activeTab === 'federal';
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
  } = useRDFormMapperPreview(
    accountid,
    caseId ?? '',
    caseCountryDetails.country_id,
    isFederal,
    selectedRegion || undefined,
    isGenerateSuccess
  );

  const region = useFetchState(caseDetails?.country_rid || '');

  const regionListOptions = useMemo(
    () =>
      region.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [region.data?.data.states]
  );

  // Auto-select first region when switching to state-wise tab
  useEffect(() => {
    if (
      activeTab === 'state_wise' &&
      regionListOptions.length > 0 &&
      !selectedRegion
    ) {
      setSelectedRegion(regionListOptions[0].value);
    }
  }, [activeTab, regionListOptions, selectedRegion]);

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

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setErrors((prev) => ({ ...prev, region: '' }));
  };

  const tabs = [
    {
      label: 'Federal',
      value: 'federal',
      hide: false,
    },
    {
      label: 'State-wise',
      value: 'state_wise',
      hide: false,
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'federal') {
      setSelectedRegion('');
    }
  };

  if (!isFinancialWorkingSignoff)
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='text-[14px] text-[#2D3E4F] font-semibold mb-2'>
            Financial Working Sign-off Required
          </div>
          <div className='text-[13px] text-[#7D98B6]'>
            Please complete the financial working sign-off to view the RD form
          </div>
        </div>
      </div>
    );

  return (
    <div className='w-full'>
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={activeTab}
        className='flex flex-col gap-0 border-b border-[#CBD6E2] pl-3'
      />
      <div className='pb-2'>
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
              Country <span className='text-red-500'>*</span>
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

          {activeTab === 'state_wise' && (
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
      {previewData?.data && (
        <div>
          <div className='capitalize h-[30px] border-b border-t border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
            PDF Viewer
          </div>
          <div className='max-h-[600px] overflow-auto p-3'>
            <PdfViewer
              pdfUrl={previewData.data.rdformUrl}
              base64={previewData.data.base64}
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import FinancialWorking from './financial-working';
import FinancialWorkingAustralia from './financial-working-australia';
import FinancialWorkingUSA from './financial-working-usa';
import { useSelector } from 'react-redux';
import { Box, MenuItem, Select, Tab, Tabs } from '@mui/material';
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
} from '../../../../../../types';
import { FinancialWorkingCountries } from '../../../../../../types/interactions';
import TextButton from '../../../../../../../components/button/text-button';
import {
  checkPermission,
  costDisplay,
} from '../../../../../../../common-utils';
import {
  useFinancialHighlights,
  useInitiateRDCreditProcess,
  useRDCreditPreviewMutation,
} from '../../../../../../services/case-dossier/cases-financial-services';
import SignOffModal from './sign-off-modal';
import { useFetchCasesConfigFields } from '../../../../../../services/case-team';
import DetailsSectionSkeleton from '../../../../../../../components/skeleton-component/detailsskeleton';
import { DetailsKeyContactErrorIcon } from '../../../../../../../assets';

interface FinancialWorkingFormProps {
  caseDetails?: CaseDetails;
  setDossierFinancialStatus: (status: boolean) => void;
  dossierFinancialStatus: boolean;
  financialData: FinancialHighlightsResponse | null;
  setFinancialData: (data: FinancialHighlightsResponse | null) => void;
  refetchCaseDetails: () => void;
  isDetailLoading?: boolean;
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
  financialData,
  setFinancialData,
  refetchCaseDetails,
  dossierFinancialStatus,
  setDossierFinancialStatus,
  isDetailLoading,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0); // 0 for Federal, 1 for Non-Federal
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showFinancialValue, setShowFinancialValues] = useState<boolean>(false);
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { permission } = useSelector((state: RootState) => state.permission);
  const { errorToast } = useToast();
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState<boolean>(false);

  const { data, isLoading } = useFetchCasesConfigFields(
    accountid as string,
    'case',
    caseId as string
  );
  const configDetails = data?.data.states;
  const configFedral = data?.data;

  useEffect(() => {
    if (configFedral) {
      if (configFedral.is_federal_level) {
        setActiveTab(0);
      } else {
        setActiveTab(1);
      }
    }
  }, [configFedral]);

  // Restore showFinancialValues and form states if data exists
  useEffect(() => {
    if (financialData) {
      setShowFinancialValues(true);

      // Restore region/federal state from payload if available
      const stateRid = (financialData.data as any)?.state_rid;
      if (stateRid) {
        setActiveTab(1); // Non-Federal tab
        setSelectedRegion(stateRid);
      }
    }
  }, [financialData]);

  const isFinancialWorkingSignoff = caseDetails?.financial_working_signoff;

  // Auto-initiate on component mount (only once)
  useEffect(() => {
    if (
      !dossierFinancialStatus &&
      caseDetails?.case_total_projects &&
      caseDetails?.case_total_projects !== 0 &&
      caseDetails?.case_total_projects !== '0' &&
      !caseDetails?.financial_working_signoff
    ) {
      setDossierFinancialStatus(true);
      handleInitiateFinancialHighlights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseDetails]);

  // Call appropriate API when federal tab changes

  useEffect(() => {
    if (!dossierFinancialStatus) return; // Wait for initiate to complete first

    if (activeTab === 0) {
      // Federal Yes: Call handleViewFinancialHighlights
      handleViewFinancialHighlights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dossierFinancialStatus]);

  // Call region API when region changes in Federal No mode (activeTab === 1)
  useEffect(() => {
    if (activeTab === 1 && dossierFinancialStatus) {
      handleViewFinancialHighlightsForRegion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, activeTab, dossierFinancialStatus]);

  const isSignoffVisible = checkPermission(
    permission,
    AllPermissions.DOSSIER_FINANCIAL_SIGNOFF
  );

  const { mutate: initiateProcess, isPending: isInitiating } =
    useInitiateRDCreditProcess();
  const { mutate: financialHighlights, isPending: isFinancialHighlights } =
    useFinancialHighlights();
  const { mutate: previewRDCredit, isPending: isPreviewLoading } =
    useRDCreditPreviewMutation();

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

  const regionListOptions = useMemo(() => {
    const states = region.data?.data.states || [];
    if (Array.isArray(configDetails) && configDetails.length > 0) {
      return states
        .filter((state) => configDetails.includes(state.rid))
        .map((state) => ({
          label: state.state_name,
          value: state.rid,
        }));
    }
    return (
      states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || []
    );
  }, [region.data?.data.states, configDetails]);

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setShowFinancialValues(false);
    setFinancialData(null);
    setSelectedRegion('');
    setErrors((prev) => ({ ...prev, region: '' }));
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setErrors((prev) => ({ ...prev, region: '' }));
    setFinancialData(null);
    setShowFinancialValues(false);
    // API will be called by the useEffect watching selectedRegion
  };

  const responseCurrencySymbol = caseDetails?.currency_symbol || '$';

  const handleViewFinancialHighlightsForRegion = async () => {
    previewRDCredit(
      {
        accountrid: accountid,
        caseId: caseId ?? '',
        type: selectedRegion ? 'state' : 'summary',
        ...(selectedRegion && { stateRid: selectedRegion }),
      },
      {
        onSuccess: (response) => {
          if (response?.data) {
            setFinancialData(
              response as unknown as FinancialHighlightsResponse
            );
            setShowFinancialValues(true);
          } else {
            errorToast('No data available');
          }
        },
        onError: (error) => {
          console.error(error);
          setFinancialData(null);
          errorToast('Failed to fetch financial highlights');
        },
      }
    );
  };

  const handleViewFinancialHighlights = async () => {
    const payload = {
      account_rid: accountid,
      case_rid: caseId ?? '',
    };

    financialHighlights(payload, {
      onSuccess: (data) => {
        setFinancialData(data as FinancialHighlightsResponse);
        setShowFinancialValues(true);
        refetchCaseDetails();
      },
      onError: (error) => {
        console.error('Error initiating', error);
        errorToast('Failed to initiate');
      },
    });
  };

  const handleInitiateFinancialHighlights = async () => {
    setShowFinancialValues(false);
    const payload = {
      account_rid: accountid,
      case_rid: caseId ?? '',
      fiscal_year: Number(caseDetails?.fiscal_year || 0),
    };

    initiateProcess(payload, {
      onSuccess: () => {
        handleViewFinancialHighlights();
      },
      onError: (error: any) => {
        errorToast(
          error?.response?.data?.statusMessage || 'Failed to initiate'
        );
      },
    });
  };

  if (isDetailLoading || isLoading) {
    return <DetailsSectionSkeleton sectionCount={2} />;
  }

  if (
    (!isDetailLoading && !caseDetails?.case_total_projects) ||
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
  if (
    !isDetailLoading &&
    !isLoading &&
    !configFedral?.is_federal_level &&
    !configFedral?.is_state_level
  ) {
    return (
      <div className='h-32 flex flex-col'>
        <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
          <div>
            <React.Suspense fallback={null}>
              <DetailsKeyContactErrorIcon alt='key-contact' />
            </React.Suspense>
          </div>
          <div>
            <span className='font-bold mr-1 capitalize'>
              Jurisdiction Configuration
            </span>
            -
            <span className='ml-1 font-medium'>
              Jurisdiction configuration is not updated. Please update it in
              Settings to proceed with Financial Workings.
            </span>
          </div>
        </div>
        <div className='text-[13px] text-[#425A76] w-full text-center h-20 flex items-center justify-center'>
          No preview available.
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
              label={'Approve'}
              onClick={() => setIsSignOffModalOpen(true)}
              disabled={!financialData || isFinancialWorkingSignoff}
              hide={!isSignoffVisible}
              sx={{
                width: 'auto',
                minWidth: '65px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
        </div>
        <div className='px-4'>
          <Box>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              TabIndicatorProps={{
                style: {
                  backgroundColor: '#1565C0',
                  height: '2px',
                },
              }}
              sx={{
                minHeight: '38px',
                borderBottom: '1px solid #CBD6E2',
                '& .MuiTab-root': {
                  minHeight: '38px',
                  textTransform: 'none',
                  fontWeight: 'normal',
                  color: '#5F6B7C',
                  fontSize: '14px',
                  paddingX: '16px',
                },
                '& .Mui-selected': {
                  color: '#172B4D',
                  fontWeight: 600,
                },
                '& .Mui-disabled': {
                  opacity: 0.5,
                },
              }}
            >
              <Tab
                label='Federal'
                disabled={
                  !caseDetails?.is_state_available ||
                  !configFedral?.is_federal_level
                }
              />
              <Tab
                label='State-wise'
                disabled={
                  !caseDetails?.is_state_available ||
                  !configFedral?.is_state_level
                }
              />
            </Tabs>
          </Box>
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

          {activeTab === 1 && (
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
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  All
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

      {/* Loading State */}
      {(isInitiating || isFinancialHighlights || isPreviewLoading) &&
        !showFinancialValue && <DetailsSectionSkeleton />}

      {showFinancialValue && (
        <div className=''>
          <div>
            {caseDetails?.country_name ===
            FinancialWorkingCountries.Australia ? (
              <FinancialWorkingAustralia data={financialData} />
            ) : caseDetails?.country_name === FinancialWorkingCountries.US ? (
              <FinancialWorkingUSA
                data={financialData}
                onSuccess={handleInitiateFinancialHighlights}
              />
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
        refetchCaseDetails={refetchCaseDetails}
      />
    </div>
  );
};

export default FinancialWorkingForm;

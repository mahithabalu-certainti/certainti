import React, { useEffect, useMemo, useState } from 'react';
import {
  AllPermissions,
  useGetAllCountries,
} from '../../../../../common-service';
import {
  ActivityDropdownItem,
  AuditTimelineListExportParams,
  CaseAssignedExportParams,
  CaseDetails,
  ColorCode,
  ExportType,
  FinancialHighlightsResponse,
  TechnicalSummaryExportListParams,
} from '../../../../types';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { DetailsKeyContactErrorIcon, DossierIcon } from '../../../../../assets';
import {
  DossierSummary,
  FinancialWorkingForm,
  ProjectDocuments,
  TechnicalSummary,
  QualifiedProjects,
  RDForm,
  ResourceSummary,
} from './tab';
import {
  getProjectDocumentsFilterFields,
  getQualifiedProjectsFilterFields,
} from './helper';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission } from '../../../../../common-utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import {
  useDossierInitiate,
  useDossierSheetStatus,
  useRDCreditStatus,
} from '../../../../services/case-dossier/cases-financial-services';
import { caseProjectResourceFilterFields } from '../case-project-resource/utils';
import { useFetchState } from '../../../../services/account';
import {
  useGetResourceStatus,
  useGetResourceType,
} from '../../../../services/resource-list';
import { FilterValue } from '../../../../types/account-filter';
import ClosingRemarks from './tab/close-remarks/closing-remarks';
import { AttachmentsListExportParams } from '../../../../types/attachment';
import { ReviewProjectListURLParams } from '../../../../types/assign-projects';
import { getTechnicalSummaryFilterFields } from '../technical-summary/helpers';

const DossierTabs = [
  {
    id: AllPermissions.DOSSIER_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.DOSSIER_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface DossierProps {
  activityMenuItems: ActivityDropdownItem[];
  caseDetails?: CaseDetails;
  setDossierFinancialStatus: (status: boolean) => void;
  dossierFinancialStatus: boolean;
  financialData: FinancialHighlightsResponse | null;
  setFinancialData: (data: FinancialHighlightsResponse | null) => void;
  refetchCaseDetails: () => void;
  isDetailLoading?: boolean;
  isFinancialWorkingSignoff?: boolean;
  dossierCreditStatus: string;
  setDossierCreditStatus: (status: string) => void;
  setExportType: (type: ExportType) => void;
  setQualifiedProjectsParams?: React.Dispatch<
    React.SetStateAction<CaseAssignedExportParams>
  >;
  setProjectDocumentsParams?: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
  setResourceSummaryParams?: React.Dispatch<
    React.SetStateAction<ReviewProjectListURLParams>
  >;
  setTechnicalSummaryParams?: (
    params: TechnicalSummaryExportListParams
  ) => void;
  setAuditTimelineParams?: React.Dispatch<
    React.SetStateAction<AuditTimelineListExportParams>
  >;
}

const Dossier: React.FC<DossierProps> = ({
  activityMenuItems,
  caseDetails,
  setDossierFinancialStatus,
  dossierFinancialStatus,
  financialData,
  setFinancialData,
  refetchCaseDetails,
  isDetailLoading,
  isFinancialWorkingSignoff,
  dossierCreditStatus,
  setDossierCreditStatus,
  setExportType,
  setQualifiedProjectsParams,
  setProjectDocumentsParams,
  setResourceSummaryParams,
  setTechnicalSummaryParams,
  setAuditTimelineParams,
}) => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [count, setCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());
  const [resetSearch, setResetSearch] = useState<boolean>(false);
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const { permission } = useSelector((state: RootState) => state.permission);

  const isFinancialView = checkPermission(
    permission,
    AllPermissions.DOSSIER_FINANCIAL_VIEW_EDIT
  );
  const isQualifiedProjectsView = checkPermission(
    permission,
    AllPermissions.DOSSIER_QUALIFIED_PROJECTS_VIEW
  );
  const isTechnicalSummaryView = checkPermission(
    permission,
    AllPermissions.DOSSIER_TECHNICAL_SUMMARY_VIEW
  );
  const isProjectDocumentsView = checkPermission(
    permission,
    AllPermissions.DOSSIER_PROJECT_DOCUMENTS_VIEW
  );
  const isResourceSummaryView = checkPermission(
    permission,
    AllPermissions.DOSSIER_RESOURCE_SUMMARY_VIEW
  );
  const isRdFormsView = checkPermission(
    permission,
    AllPermissions.DOSSIER_RD_FORMS_VIEW
  );
  const isAuditTimelineView = checkPermission(
    permission,
    AllPermissions.DOSSIER_AUDIT_TIMELINE_VIEW
  );
  const isSummaryView = checkPermission(
    permission,
    AllPermissions.DOSSIER_SUMMARY_VIEW
  );
  // const iscaseClose = checkPermission(
  //   permission,
  //   AllPermissions.DOSSIER_CLOSE_CASE
  // );  // need to add close case btn
  const isPackagesDownload = checkPermission(
    permission,
    AllPermissions.DOSSIER_PACKAGES
  );

  // Permission Management
  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const projectListViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectListViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectListViewEditFields]);

  // const initialTab = useMemo(() => {
  //   if (isFinancialView) return 'financial_workings';
  //   return 'summary';
  // }, [isFinancialView]);

  const initialTab = 'summary';
  useEffect(() => {
    if (searchParams.get('list') === 'dossier' && !searchParams.get('tab')) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    navigate({ search: searchParams.toString() }, { replace: true });
    setCount(0);
    setAppliedFilters({});
    setCurrentPage(0);
    setSearchText('');
    setResetSearch(true);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };
  const { refetch: refetchRDCreditStatus } = useRDCreditStatus(
    accountid,
    caseId ?? '',
    false
  );
  const { mutate: refetchDossierInitiate } = useDossierInitiate();
  const { mutate: refetchDossierSheetStatus } = useDossierSheetStatus();
  const handleRefresh = async () => {
    // Skip API call for COMPLETED or any empty/undefined value
    if (
      dossierCreditStatus === 'COMPLETED' ||
      dossierCreditStatus === null ||
      dossierCreditStatus === undefined ||
      dossierCreditStatus === ''
    ) {
      setRefreshTrigger(Date.now());
      return;
    }

    // Call API only for valid status values (e.g., 'PENDING', 'PROCESSING', etc.)
    const result = await refetchRDCreditStatus();
    if (result.data) {
      setDossierCreditStatus(result.data?.data);
    }
  };
  const handleFilter = () => setShowFilter(!showFilter);

  const handleFilterChange = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'country_rid' && value) {
      setCurrentCountry(String(value));
    }
  };

  const allCountries = useGetAllCountries();
  const regions = useFetchState(currentCountry?.toString() || '');
  const resourceTypeOptions = useGetResourceType();
  const resourceStatusOptions = useGetResourceStatus();

  const countryOptions = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        option: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const regionOptions = useMemo(
    () =>
      regions.data?.data.states.map((state) => ({
        option: state.state_name,
        value: state.rid,
      })) || [],
    [regions.data?.data.states]
  );

  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        option: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );

  const memoizedResourceStatus = useMemo(
    () =>
      resourceStatusOptions?.data?.data?.resourceStatus.map((item) => ({
        option: item.resource_status_name,
        value: item.rid,
      })) || [],
    [resourceStatusOptions?.data?.data?.resourceStatus]
  );

  const handleGenerateDossierSheet = async () => {
    if (dossierCreditStatus === 'COMPLETED') {
      refetchDossierSheetStatus({
        accountRid: accountid,
        caseRid: caseId ?? '',
      });
    } else {
      const payload = {
        account_rid: accountid,
        case_rid: caseId ?? '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      refetchDossierInitiate(payload, {
        onSuccess: () => {
          setDossierCreditStatus(
            'Dossier Package is Inprogress. Refresh the page to check the status'
          );
          // handleStatusUpdate(data);
        },
        onError: (error) => {
          console.error('Error initiating', error);
          // errorToast('Failed to initiate');
        },
      });
    }
  };

  const technicalSummaryViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) =>
          item.name === AllPermissions.PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const technicalSummarypermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    technicalSummaryViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [technicalSummaryViewEditFields]);

  const filterFields = useMemo(() => {
    switch (tabParam) {
      case 'qualified_projects':
        return getQualifiedProjectsFilterFields();
      case 'project_documents':
        return getProjectDocumentsFilterFields();
      case 'technical_summary':
        return getTechnicalSummaryFilterFields(technicalSummarypermissionMap);
      case 'resource_summary':
        return caseProjectResourceFilterFields(
          permissionMap,
          projectPermissionMap,
          countryOptions,
          regionOptions,
          memoizedResourceType,
          memoizedResourceStatus
        );
      default:
        return [];
    }
  }, [
    countryOptions,
    memoizedResourceStatus,
    memoizedResourceType,
    permissionMap,
    projectPermissionMap,
    regionOptions,
    tabParam,
    technicalSummarypermissionMap,
  ]);

  const tabs = [
    {
      label: 'Summary',
      value: 'summary',
      hide: !isSummaryView,
    },
    {
      label: 'Qualified Projects',
      value: 'qualified_projects',
      hide: !isQualifiedProjectsView,
    },
    {
      label: 'Technical Summary',
      value: 'technical_summary',
      hide: !isTechnicalSummaryView,
    },
    {
      label: 'Resource Summary',
      value: 'resource_summary',
      hide: !isResourceSummaryView,
    },
    {
      label: 'Project Documents',
      value: 'project_documents',
      hide: !isProjectDocumentsView,
    },
    {
      label: 'Financial Workings',
      value: 'financial_workings',
      hide: !isFinancialView,
    },
    {
      label: 'RD Form',
      value: 'rd_form',
      hide: !isRdFormsView,
    },
    {
      label: 'Audit Timeline',
      value: 'audit_timeline',
      hide: !isAuditTimelineView,
    },
  ];

  const showTableControls =
    tabParam !== 'summary' &&
    tabParam !== 'rd_form' &&
    tabParam !== 'financial_workings';
  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: !showTableControls,
    },
    {
      label: 'Dossier Package',
      variant: 'outlined' as const,
      disabled:
        !caseDetails?.financial_working_signoff ||
        (dossierCreditStatus !== 'COMPLETED' && dossierCreditStatus !== ''), // need to change rd form sign after rd form complete
      onClick: handleGenerateDossierSheet,
      sx: { width: '125px', minWidth: '125px' },
      hide: !isPackagesDownload,
    },
  ];

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={DossierTabs}
        filterMenu={filterFields}
        filterVisibility={showTableControls && tabParam !== 'audit_timeline'}
        showFilter={showFilter}
        contextKey='case-dossier'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={
          (tabParam !== 'rd_form' && tabParam !== 'financial_workings') ||
          (dossierCreditStatus !== 'COMPLETED' && dossierCreditStatus !== '')
        }
        onRefreshClick={handleRefresh}
        showSearch={
          showTableControls &&
          tabParam !== 'technical_summary' &&
          tabParam !== 'audit_timeline'
        }
        onSearch={(text) => setSearchText(text)}
        searchReset={resetSearch}
        onSearchReset={handleSearchReset}
        showAddActivity={tabParam !== 'technical_summary'}
        activityMenuItems={activityMenuItems}
        onFilterChange={handleFilterChange}
      />

      <SectionHeader
        title='Dossier'
        titleIcon={
          <DossierIcon
            alt='dossier-header-icon'
            className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
          />
        }
        iconBg={ColorCode.caseBgColor}
        bgType='circle'
        count={count}
        showItemCount={showTableControls}
        buttons={headerButtons}
      />

      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />
      {caseDetails?.case_total_qualified_projects === 0 ||
      caseDetails?.case_total_qualified_projects === '0' ? (
        <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
          <div>
            <React.Suspense fallback={null}>
              <DetailsKeyContactErrorIcon alt='key-contact' />
            </React.Suspense>
          </div>
          <div>
            <span className='font-bold mr-1 capitalize'>
              Qualified Projects
            </span>
            -
            <span className='ml-1 font-medium'>
              No Qualified Projects assigned to this case
            </span>
          </div>
        </div>
      ) : (
        <div className='border border-t-0 border-[#CBD6E2]'>
          {tabParam === 'financial_workings' &&
            (!isFinancialView ? (
              <AccessRestricted />
            ) : (
              <FinancialWorkingForm
                caseDetails={caseDetails}
                setDossierFinancialStatus={setDossierFinancialStatus}
                dossierFinancialStatus={dossierFinancialStatus}
                financialData={financialData}
                setFinancialData={setFinancialData}
                refetchCaseDetails={refetchCaseDetails}
                isDetailLoading={isDetailLoading}
              />
            ))}
          {tabParam === 'summary' && <DossierSummary />}

          {tabParam === 'qualified_projects' && (
            <QualifiedProjects
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              setExportParams={setQualifiedProjectsParams}
              setExportType={setExportType}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              fiscalYear={caseDetails?.fiscal_year ?? 0}
            />
          )}
          {tabParam === 'rd_form' && (
            <RDForm
              caseDetails={caseDetails}
              isFinancialWorkingSignoff={isFinancialWorkingSignoff}
              isDetailLoading={isDetailLoading}
              refetchCaseDetails={refetchCaseDetails}
            />
          )}

          {tabParam === 'project_documents' && (
            <ProjectDocuments
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              setExportParams={setProjectDocumentsParams}
              setExportType={setExportType}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
            />
          )}

          {tabParam === 'technical_summary' && (
            <TechnicalSummary
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              setExportParams={setTechnicalSummaryParams}
              setExportType={setExportType}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              fiscalYear={caseDetails?.fiscal_year ?? 0}
            />
          )}

          {tabParam === 'resource_summary' && (
            <ResourceSummary
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              setExportParams={setResourceSummaryParams}
              setExportType={setExportType}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
            />
          )}

          {tabParam === 'audit_timeline' && (
            <ClosingRemarks
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              setExportParams={setAuditTimelineParams}
              setExportType={setExportType}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Dossier;

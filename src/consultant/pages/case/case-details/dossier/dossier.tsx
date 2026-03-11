import React, { useEffect, useMemo, useState } from 'react';
import {
  AllPermissions,
  OverviewTabs,
  useGetAllCountries,
  useGetAllDocumentInfo,
  useGetDocumentCategoryType,
  useGetStatus,
} from '../../../../../common-service';
import {
  ActivityDropdownItem,
  AuditTimelineListExportParams,
  CaseAssignedExportParams,
  CaseDetails,
  ColorCode,
  ExportType,
  FinancialHighlightsResponse,
  SelectOption,
  TechnicalSummaryExportListParams,
} from '../../../../types';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import {
  ComingSoon,
  DetailsKeyContactErrorIcon,
  DossierIcon,
} from '../../../../../assets';
import {
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
import {
  useFetchClassification,
  useFetchState,
} from '../../../../services/account';
import {
  useGetResourceStatus,
  useGetResourceType,
} from '../../../../services/resource-list';
import { FilterValue } from '../../../../types/account-filter';
import ClosingRemarks from './tab/close-remarks/closing-remarks';
import { AttachmentsListExportParams } from '../../../../types/attachment';
import { ReviewProjectListURLParams } from '../../../../types/assign-projects';
import { getTechnicalSummaryFilterFields } from '../technical-summary/helpers';
import CloseCaseModal from './close-case-modal';
import { useGetProjectType } from '../../../../services/project';
import Timeline from '../../../../../pages/timeline/timeline';

const DossierTabs: OverviewTabs[] = [
  {
    id: AllPermissions.DOSSIER_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.DOSSIER_TIMELINE,
    name: 'Timeline',
    hide: false,
    key: 'timeline',
  },
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const { permission } = useSelector((state: RootState) => state.permission);

  const isFinancialView = checkPermission(
    permission,
    AllPermissions.DOSSIER_FINANCIAL_VIEW_EDIT
  );
  const isQualifiedProjectsView = checkPermission(
    permission,
    AllPermissions.PROJECTS_VIEW_EDIT
  );
  const isTechnicalSummaryView = checkPermission(
    permission,
    AllPermissions.PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT
  );
  const isProjectDocumentsView = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );
  const isResourceSummaryView = checkPermission(
    permission,
    AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
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
  const isCaseCloseEnable = checkPermission(
    permission,
    AllPermissions.DOSSIER_CLOSE_CASE
  );
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
  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMapAttachment = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);

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

  const initialTab = useMemo(() => {
    if (isQualifiedProjectsView) return 'qualified_projects';
    if (isTechnicalSummaryView) return 'technical_summary';
    if (isProjectDocumentsView) return 'project_documents';
    if (isResourceSummaryView) return 'resource_summary';
    if (isRdFormsView) return 'rd_forms';
    if (isAuditTimelineView) return 'approval_status';
    if (isSummaryView) return 'summary';
    return 'summary';
  }, [
    isQualifiedProjectsView,
    isTechnicalSummaryView,
    isProjectDocumentsView,
    isResourceSummaryView,
    isRdFormsView,
    isAuditTimelineView,
    isSummaryView,
  ]);

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
  const { refetch: refetchRDCreditStatus, isLoading: isRDCreditStatusLoading } =
    useRDCreditStatus(accountid, caseId ?? '', false);
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
      if (result.data?.data === 'COMPLETED') {
        refetchCaseDetails();
      }
      setDossierCreditStatus(result.data?.data);
    }
  };
  const handleFilter = () => setShowFilter(!showFilter);

  const handleFilterChange = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'country_rid' && value) {
      setCurrentCountry(String(value));
    }
    if (fieldName === 'document_category_rid' && value) {
      setCurrentCategory(String(value));
    }
  };

  const allCountries = useGetAllCountries();
  const regions = useFetchState(currentCountry?.toString() || '');
  const resourceTypeOptions = useGetResourceType();
  const resourceStatusOptions = useGetResourceStatus();
  const Classification = useFetchClassification();
  const statusOptions = useGetStatus();
  const projectTypeOptions = useGetProjectType();
  const allDocumentInfo = useGetAllDocumentInfo();
  const categoryTypes = useGetDocumentCategoryType(currentCategory);

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
    if (caseDetails?.is_initiated) {
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
            'Dossier Packages is In-Progress. Refresh the page to check the status'
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

  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        option: data.classification_name,
        value: data.rid,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );
  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        option: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );
  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      categoryTypes.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [categoryTypes.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fieldOptions = {
    fiscalYears: [],
    docCategories: memoizedDocumentCategories,
    docTypes: memoizedDocumentTypes,
  };

  const filterFields = useMemo(() => {
    switch (tabParam) {
      case 'qualified_projects':
        return getQualifiedProjectsFilterFields(
          memoizedClassification,
          memoizedProjectTypes,
          memoizedStatus,
          projectPermissionMap
        );
      case 'project_documents':
        return getProjectDocumentsFilterFields(
          fieldOptions,
          permissionMapAttachment,
          projectPermissionMap
        );
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
    fieldOptions,
    memoizedClassification,
    memoizedProjectTypes,
    memoizedStatus,
    permissionMapAttachment,
  ]);

  const tabs = [
    {
      label: 'Qualified Projects',
      value: 'qualified_projects',
      hide: !isQualifiedProjectsView,
    },
    {
      label: 'Summary',
      value: 'summary',
      hide: !isSummaryView,
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
      label: 'RD Forms',
      value: 'rd_forms',
      hide: !isRdFormsView,
    },
    {
      label: 'Approval Status',
      value: 'approval_status',
      hide: !isAuditTimelineView,
    },
  ];

  const showTableControls =
    tabParam !== 'summary' &&
    tabParam !== 'rd_forms' &&
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
      label: caseDetails?.is_initiated ? 'Download Dossier' : 'Create Dossier',
      variant: 'outlined' as const,
      disabled:
        !caseDetails?.financial_working_signoff ||
        (dossierCreditStatus !== 'COMPLETED' && dossierCreditStatus !== ''), // need to change rd form sign after rd form complete
      onClick: handleGenerateDossierSheet,
      sx: { width: '125px', minWidth: '125px' },
      hide: !isPackagesDownload,
    },
    {
      label: 'Close Case',
      variant: 'outlined' as const,
      disabled:
        !caseDetails?.financial_working_signoff ||
        caseDetails?.status_name?.toLowerCase() === 'closed' ||
        (dossierCreditStatus !== 'COMPLETED' && dossierCreditStatus !== ''),
      onClick: () => setIsModalOpen(true),
      sx: { width: '90px', minWidth: '90px' },
      hide: !isCaseCloseEnable,
    },
  ];

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={DossierTabs}
        filterMenu={filterFields}
        filterVisibility={showTableControls && tabParam !== 'approval_status'}
        showFilter={showFilter}
        contextKey='case-dossier'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={
          (tabParam !== 'rd_forms' && tabParam !== 'financial_workings') ||
          (dossierCreditStatus !== 'COMPLETED' && dossierCreditStatus !== '')
        }
        onRefreshClick={handleRefresh}
        showSearch={
          showTableControls &&
          tabParam !== 'technical_summary' &&
          tabParam !== 'approval_status'
        }
        onSearch={(text) => setSearchText(text)}
        searchReset={resetSearch}
        onSearchReset={handleSearchReset}
        showAddActivity={tabParam !== 'technical_summary'}
        activityMenuItems={activityMenuItems}
        onFilterChange={handleFilterChange}
      />
      {/* ── Content area with RD Credit Status loading overlay ── */}
      <div style={{ position: 'relative' }}>
        {isRDCreditStatusLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              borderRadius: '2px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #CBD6E2',
                borderTopColor: '#425A76',
                borderRadius: '50%',
                animation: 'dossier-spin 0.75s linear infinite',
              }}
            />
            <style>{`
              @keyframes dossier-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        {isTimeLineView ? (
          <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
            <Timeline entitytype='case' />
          </div>
        ) : (
          <>
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
                {tabParam === 'summary' && (
                  <div className='flex items-center justify-center h-full'>
                    <ComingSoon alt='comingSoon' />
                  </div>
                )}

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
                {tabParam === 'rd_forms' && (
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

                {tabParam === 'approval_status' && (
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
          </>
        )}
      </div>
      <CloseCaseModal
        open={isModalOpen}
        onClose={handleCloseModal}
        caseDetails={{
          country_name: caseDetails?.country_name,
          country_rid: caseDetails?.country_rid,
          country_code: caseDetails?.country_code,
          fiscal_year: caseDetails?.fiscal_year,
          all_task_completed: caseDetails?.all_task_completed,
        }}
        refetchCaseDetails={refetchCaseDetails}
      />
    </div>
  );
};

export default Dossier;

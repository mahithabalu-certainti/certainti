import { useEffect, useMemo, useState } from 'react';
import { ProjectsSideIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import {
  AllPermissions,
  OverviewTabs,
  useGetAllCountries,
  useGetStatus,
} from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import SelectProjects from './select-project/select-projects';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AssignProject,
  ReviewProject,
  ReviewProjectListURLParams,
} from '../../../../types/assign-projects';
import { selectProjectFilterFields } from './select-project/helper';
import {
  useFetchClassification,
  useFetchIndustrys,
  useFetchState,
} from '../../../../services/account';
import {
  ProjectTriggerAI,
  useGetProjectType,
} from '../../../../services/project';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import { ManageColumnsPopover } from '../../../../../components/table';
import { getSelectProjectColumns } from './select-project/column';
import AssignedProjects from './assigned-projects/assigned-projects';
import { getAssignedProjectColumns } from './assigned-projects/column';
import { assignedProjectFilterFields } from './assigned-projects/helper';
import ReviewProjectsList from './review-projects/review-project';
import {
  useAssignProjects,
  useRemoveProjects,
} from '../../../../services/cases-assign-projects/assign-project-service';
import {
  ActivityDropdownItem,
  CaseAssignedExportParams,
  ColorCode,
  ExportType,
} from '../../../../types';
import ProjectTab from './projects-tab';
import { getProjectFinancialResCostFields } from '../../../project/project-details/financial-highlights/helpers';
import { useGetResourceType } from '../../../../services/resource-list';
import { FilterValue } from '../../../../types/account-filter';
import { getReviewdProjectColumns } from './review-projects/column';
import EmailModalTemplate from './review-projects/email-model-template';
import { ProjectTriggerAIPayload } from '../../../../types/project';
import { useToast } from '../../../../../hooks';
import { checkPermission } from '../../../../../common-utils';
import { reviewProjectFilterFields } from './review-projects/helper';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { TabItem } from '../../../../../components/side-menu-panel/section-header-tab';
import Timeline from '../../../../../pages/timeline/timeline';
interface casesProjectProps {
  activeKey?: string;
  fiscalYear: number;
  accountInActive: boolean;
  setTableParams?: React.Dispatch<
    React.SetStateAction<CaseAssignedExportParams>
  >;
  setReviewProjectParams?: React.Dispatch<
    React.SetStateAction<ReviewProjectListURLParams>
  >;
  setExportType?: (type: ExportType) => void;
  refetchCaseDetails: () => void;
  activityMenuItems: ActivityDropdownItem[];
  isCaseTeamCreated: boolean;
  isFinancialWorkingSignoff?: boolean;
}
const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW, // permission need to be change
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.INTERACTIONS_TIMELINE,
    name: 'Timeline',
    hide: false,
    key: 'timeline',
  },
];

const CasesProjects: React.FC<casesProjectProps> = ({
  fiscalYear,
  accountInActive,
  setTableParams,
  setExportType,
  setReviewProjectParams,
  refetchCaseDetails,
  activityMenuItems,
  isCaseTeamCreated,
  isFinancialWorkingSignoff,
}) => {
  const { caseId } = useParams();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [searchReset, setSearchReset] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const [clearSelectedRows, setClearSelectedRows] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<AssignProject[]>([]);
  const [reviewSelectedRows, setReviewSelectedRows] = useState<ReviewProject[]>(
    []
  );
  const [columnAnchorEl, setColumnAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const Classification = useFetchClassification();
  const statusOptions = useGetStatus();
  const projectTypeOptions = useGetProjectType();

  const assignProjectList = useAssignProjects();
  const removeProjectList = useRemoveProjects();
  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };
  const handletoAssignprojects = () => {
    const payload = {
      account_rid: searchParams.get('accountID') ?? '',
      case_rid: caseId ?? '',
      projects: selectedRows.map((item) => ({
        project_rid: item.project_rid,
        project_fiscal_rid: item.rid,
        project_group: item.project_group ?? '',
      })),
    };
    assignProjectList.mutate(payload, {
      onSuccess: (response) => {
        if (response?.statusCode === 200) {
          onRefreshClick();
          setSelectedRows([]);
          setClearSelectedRows((prev) => !prev);
          refetchCaseDetails();
        }
      },
    });
  };

  const handleRemoveProjects = () => {
    const payload = {
      account_rid: searchParams.get('accountID') ?? '',
      case_rid: caseId ?? '',
      projects: selectedRows.map((item) => ({
        project_rid: item.project_rid,
        project_fiscal_rid: item.rid,
        project_group: item.project_group ?? '',
      })),
    };
    removeProjectList.mutate(payload, {
      onSuccess: (response) => {
        if (response?.statusCode === 200) {
          onRefreshClick();
          setSelectedRows([]);
          setClearSelectedRows((prev) => !prev);
          refetchCaseDetails();
        }
      },
    });
  };
  const updateSearchParams = (callback: (params: URLSearchParams) => void) => {
    const newParams = new URLSearchParams(searchParams);
    callback(newParams);
    navigate({ search: newParams.toString() }, { replace: true });
  };
  const handleAssignProject = () => {
    setSearchText('');
    setSearchReset(true);
    updateSearchParams((params) =>
      params.set('assignProject', 'assigned_to_list')
    );
  };

  const handleBackToAssignedProjects = () => {
    setSearchText('');
    setSearchReset(true);
    updateSearchParams((params) => {
      params.delete('assignProject');
      return params;
    });
  };
  useEffect(() => {
    // Reset to default state when entering case projects
    if (searchParams.get('list') === 'caseProjects') {
      const newParams = new URLSearchParams(searchParams);

      // Only reset if we don't have detailstab (meaning we're at the main case projects view)
      if (!newParams.get('detailstab')) {
        newParams.delete('assignProject');
        // Set default tab if not present
        if (!newParams.get('tab')) {
          newParams.set('tab', initialTab);
        }
      }

      navigate({ search: newParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('list')]); // Run when the list parameter changes
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const isAssignProject = searchParams.get('assignProject');
  const projectDetailTab = searchParams.get('detailstab');
  const { permission } = useSelector((state: RootState) => state.permission);

  const TriggerAIEnable = checkPermission(
    permission,
    AllPermissions.TRIGGER_AI_ASSESSMENT
  );
  const isReviewProjectEnable = checkPermission(
    permission,
    AllPermissions.REVIEW_PROJECTS_VIEW_EDIT
  );
  const isProjectEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_VIEW_EDIT
  );

  const initialTab = useMemo(() => {
    if (isProjectEnable) {
      return 'assign_projects';
    }
    if (isReviewProjectEnable) {
      return 'review_projects';
    }
    return 'assign_projects'; // Default tab if both conditions are false
  }, [isProjectEnable, isReviewProjectEnable]);

  useEffect(() => {
    if (setExportType) {
      setExportType('cases_projects');
    }

    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'caseProjects'
    ) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabParam = searchParams.get('tab') || initialTab;
  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    setSearchText('');
    setSearchReset(true);
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  // const handleCloseEmailModal = () => {
  //   setEmailModalOpen(false);
  // };

  const DetailsTabParam = searchParams.get('detailstab');
  const handleDetailsTabChange = (value: string) => {
    searchParams.set('detailstab', value);
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const detailsTabs = [
    { label: 'Project Details', value: 'projects_details' },
    {
      label: 'Project Financial Summary',
      value: 'project_financial_summary',
    },
    { label: 'Resource Cost', value: 'resource_cost' },
  ];
  const handleBackTocasesProjects = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('detailstab');
    newParams.delete('assignProject'); // Also remove assignProject when going back
    navigate({ search: newParams.toString() }, { replace: true });
  };
  const { successToast } = useToast();
  const triggerAIMutation = ProjectTriggerAI();
  const handleTriggerAIBtn = () => {
    const payload: ProjectTriggerAIPayload = {
      data: [
        {
          account_rid: searchParams.get('accountID') ?? '',
          project_fiscal_rid: selectedRows.map((row) => row.rid),
        },
      ],
      type: 'project',
    };
    triggerAIMutation.mutate(payload, {
      onSuccess: (res) => {
        successToast(res.statusMessage);
        // setClearTrigger((prev) => !prev);
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  const headerButtons = [
    {
      label: 'RD Assessment',
      variant: 'outlined' as const,
      disabled:
        accountInActive ||
        selectedRows.length === 0 ||
        !isCaseTeamCreated ||
        isFinancialWorkingSignoff,
      onClick: () => handleTriggerAIBtn(),
      loading: triggerAIMutation.isPending,
      sx: { width: '115px', minWidth: '115px' },
      hide:
        !(tabParam === 'assign_projects' && !isAssignProject) ||
        projectDetailTab ||
        !TriggerAIEnable,
    },
    {
      label: isAssignProject ? 'Assign' : 'Remove',
      variant: 'outlined' as const,
      disabled:
        selectedRows.length === 0 ||
        accountInActive ||
        !isCaseTeamCreated ||
        isFinancialWorkingSignoff,
      onClick: () =>
        isAssignProject ? handletoAssignprojects() : handleRemoveProjects(),
      sx: { width: '80px', minWidth: '80px' },
      hide: projectDetailTab
        ? true
        : tabParam === 'assign_projects'
          ? false
          : true,
      loading: assignProjectList.isPending || removeProjectList.isPending,
    },
    {
      label: isAssignProject ? 'Back to Assigned Projects' : 'Assign Projects',
      variant: 'outlined' as const,
      disabled: !isCaseTeamCreated || isFinancialWorkingSignoff,
      onClick: () =>
        isAssignProject
          ? handleBackToAssignedProjects()
          : handleAssignProject(),
      sx: {
        width: isAssignProject ? '180px' : '130px',
        minWidth: isAssignProject ? '180px' : '130px',
      },
      hide: projectDetailTab
        ? true
        : tabParam === 'assign_projects'
          ? false
          : true,
    },
    {
      label: 'Review ',
      variant: 'outlined' as const,
      disabled: reviewSelectedRows.length === 0 || accountInActive,
      hide: tabParam === 'review_projects' ? false : true,
      onClick: () => setEmailModalOpen(true),
      sx: { width: '70px', minWidth: '70px' },
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      hide: projectDetailTab ? true : false,
      sx: { width: '125px', minWidth: '125px' },
    },
    {
      label: 'Back to Case projects',
      variant: 'outlined' as const,
      disabled: false,
      hide: !projectDetailTab,
      onClick: handleBackTocasesProjects,
      sx: { width: '150px', minWidth: '150px' },
    },
  ];

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const projectViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        option: data.classification_name,
        value: data.rid,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );
  const handleFilterChange = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'country_rid' && value) {
      setCurrentCountry(String(value));
    }
  };
  const countriesList = useGetAllCountries();
  const industry = useFetchIndustrys();
  const region = useFetchState(currentCountry);
  const resourceTypeOptions = useGetResourceType();
  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        option: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );

  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        option: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );

  const memoizedCountry = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        option: item.country_name,
        value: item.rid,
      })) || []
    );
  }, [countriesList]);

  const memoizedRegion = useMemo(
    () =>
      region.data?.data.states.map((state) => ({
        option: state.state_name,
        value: state.rid,
      })) || [],
    [region.data?.data.states]
  );
  const allIndustries = useMemo(
    () =>
      industry.data?.data.industries.map((industry) => ({
        option: industry.industry_name,
        value: industry.industry_name,
      })) || [],
    [industry.data?.data.industries]
  );
  const filterFields = getProjectFinancialResCostFields(
    memoizedCountry,
    memoizedRegion,
    memoizedResourceType
  );
  const assignFilterFields = isAssignProject
    ? selectProjectFilterFields(
        memoizedClassification.map((item) => ({
          label: item.option,
          value: item.value,
        })),
        memoizedProjectTypes,
        memoizedStatus,
        projectPermissionMap
      )
    : assignedProjectFilterFields(
        memoizedClassification.map((item) => ({
          label: item.option,
          value: item.value,
        })),
        memoizedProjectTypes,
        memoizedStatus,
        projectPermissionMap
      );
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const projectViewEditlistFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const reviewProjectViewEditListFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.REVIEW_PROJECTS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditlistFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditlistFields]);
  const permissionMapReview = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    reviewProjectViewEditListFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [reviewProjectViewEditListFields]);

  const handleProjectDetails = (data: AssignProject) => {
    // Create new search params without assignProject
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('assignProject'); // Remove assignProject parameter
    newParams.set('detailstab', 'projects_details');
    newParams.set('projectID', data.rid);

    navigate({ search: newParams.toString() }, { replace: true });
  };

  const caseColumns = isAssignProject
    ? getAssignedProjectColumns(permissionMap)
    : getSelectProjectColumns(permissionMap, handleProjectDetails);
  const reviewProjectColumns = getReviewdProjectColumns(permissionMapReview);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(caseColumns.map((col) => [col.id, !col.hide])));
  const [sortParams, setSortParams] = useState<{
    sortField: string;
    sortBy: 'ASC' | 'DESC';
  }>({
    sortField: 'project_code',
    sortBy: 'ASC',
  });
  const [columnOrder, setColumnOrder] = useState(
    caseColumns.map((col) => col.id)
  );
  const reviewFilterFields = reviewProjectFilterFields(
    memoizedClassification.map((item) => ({
      label: item.option,
      value: item.value,
    })),
    memoizedProjectTypes,
    allIndustries,
    permissionMapReview
  );

  const projectFilterFields =
    tabParam === 'assign_projects' ? assignFilterFields : reviewFilterFields;
  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => caseColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const [reviewColumnVisibility, setReviewColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(reviewProjectColumns.map((col) => [col.id, !col.hide])));

  // State for ordering of review columns
  const [reviewColumnOrder, setReviewColumnOrder] = useState(
    reviewProjectColumns.map((col) => col.id)
  );

  // Handle changes to review columns (from column settings popup)
  const handleReviewColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );

    setReviewColumnVisibility(newVisibility);
    setReviewColumnOrder(updatedColumns.map((col) => col.id));
  };

  // Generate visible review columns
  const visibleReviewColumns = reviewColumnOrder
    .map((id) => reviewProjectColumns.find((col) => col.id === id)!)
    .filter((col) => reviewColumnVisibility[col.id]);

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const RestrictedColumns = [
    {
      id: 'project_code',
      canHide: false,
      canDrag: false,
    },
  ];
  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'case-column-visibility-popover' : undefined;

  const visbleIcons =
    projectDetailTab === 'projects_details'
      ? false
      : projectDetailTab === 'project_financial_summary'
        ? false
        : true;

  const tabs = [
    isProjectEnable && { label: 'Assigned Projects', value: 'assign_projects' },

    isReviewProjectEnable && {
      label: 'Review Projects',
      value: 'review_projects',
    },
  ];

  if (!isProjectEnable && !isReviewProjectEnable) {
    return <AccessRestricted />;
  }

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={
          tabParam === 'assign_projects' ? caseColumns : reviewProjectColumns
        }
        onColumnsChange={
          tabParam === 'assign_projects'
            ? handleColumnsChange
            : handleReviewColumnsChange
        }
        columnRestrictions={RestrictedColumns}
      />
      <SectionTabPanel
        tabs={InteractionsTabs}
        filterMenu={projectDetailTab ? filterFields : projectFilterFields}
        filterVisibility={visbleIcons}
        showFilter={showFilter}
        contextKey={isAssignProject ? 'select-projects' : 'assigned-projects'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={visbleIcons}
        onRefreshClick={onRefreshClick}
        onFilterChange={handleFilterChange}
        showSearch={visbleIcons}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        searchReset={searchReset}
        onSearchReset={() => setSearchReset(false)}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='case' />
        </div>
      ) : (
        <>
          <SectionHeader
            title={isAssignProject ? 'Assign Projects' : 'Case Projects'}
            titleIcon={
              <ProjectsSideIcon
                alt='financial-header-icon'
                className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
              />
            }
            count={count}
            showItemCount={
              DetailsTabParam === 'resource_cost'
                ? true
                : DetailsTabParam
                  ? false
                  : true
            }
            buttons={headerButtons.map((btn) => ({
              ...btn,
              hide: Boolean(btn.hide),
            }))}
            iconBg={ColorCode.caseBgColor}
            bgType='circle'
          />
          {!isAssignProject && !projectDetailTab && (
            <SectionHeaderTab
              tabs={tabs.filter((tab): tab is TabItem => Boolean(tab))}
              onTabChange={handleTabChange}
              defaultValue={tabParam}
            />
          )}
          {projectDetailTab && (
            <SectionHeaderTab
              tabs={detailsTabs}
              onTabChange={handleDetailsTabChange}
              defaultValue={DetailsTabParam ?? 'projects_details'}
            />
          )}
          {projectDetailTab ? (
            <div>
              <ProjectTab
                refreshTrigger={refreshTrigger}
                setCount={setCount}
                searchText={searchText}
                currentPage={currentPage}
                appliedFilters={appliedFilters}
              />
            </div>
          ) : tabParam === 'assign_projects' ? (
            // Only render Assign Projects section if user has PROJECTS_VIEW_EDIT permission

            <div className='border border-[#CBD6E2] border-t-0'>
              {isAssignProject ? (
                <SelectProjects
                  accountInActive={accountInActive}
                  refreshTrigger={refreshTrigger}
                  setSelectedRows={setSelectedRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  visibleColumns={visibleColumns}
                  searchText={searchText}
                  setCount={setCount}
                  clearSelectedRows={clearSelectedRows}
                  fiscalYear={fiscalYear}
                  appliedFilters={appliedFilters}
                />
              ) : (
                <AssignedProjects
                  accountInActive={accountInActive}
                  refreshTrigger={refreshTrigger}
                  setSelectedRows={setSelectedRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  visibleColumns={visibleColumns}
                  searchText={searchText}
                  setTableParams={setTableParams}
                  setCount={setCount}
                  clearSelectedRows={clearSelectedRows}
                  fiscalYear={fiscalYear}
                  setExportType={setExportType}
                  appliedFilters={appliedFilters}
                />
              )}
            </div>
          ) : (
            // Only render Review Projects section if user has REVIEW_PROJECTS_VIEW_EDIT permission

            <div className='border border-[#CBD6E2] border-t-0'>
              <ReviewProjectsList
                accountInActive={accountInActive}
                visibleColumns={visibleReviewColumns}
                searchText={searchText}
                refreshTrigger={refreshTrigger}
                setTableParams={setReviewProjectParams}
                setCount={setCount}
                setExportType={setExportType}
                appliedFilters={appliedFilters}
                setSelectedRows={setReviewSelectedRows}
                setSortParams={setSortParams}
                clearSelectedRows={clearSelectedRows}
              />
              <EmailModalTemplate
                title='Email Template'
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                selectedRows={reviewSelectedRows}
                setSelectedRows={setReviewSelectedRows}
                setClearSelectedRows={setClearSelectedRows}
                appliedFilters={appliedFilters}
                sortBy={sortParams.sortField}
                sortOrder={sortParams.sortBy}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CasesProjects;

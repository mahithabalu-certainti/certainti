/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { InteractionDetailIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import {
  AllPermissions,
  OverviewTabs,
  useGetStatus,
} from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import SelectProjects from './select-project/select-projects';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AssignProject } from '../../../../types/assign-projects';
import { selectProjectFilterFields } from './select-project/helper';
import { useFetchClassification } from '../../../../services/account';
import { useGetProjectType } from '../../../../services/project';
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

const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW, // permission need to be change
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.INTERACTIONS_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

const CasesProjects: React.FC = () => {
  const { caseId } = useParams();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [searchParams] = useSearchParams();
  const handleSorting = () => {
    setSortFilterCount(sortFilterCount + 1);
  };
  const [selectedRows, setSelectedRows] = useState<AssignProject[]>([]);
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
        }
      },
    });
    onRefreshClick();
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
    updateSearchParams((params) =>
      params.set('assignProject', 'assigned_to_list')
    );
  };

  const handleBackToAssignedProjects = () => {
    updateSearchParams((params) => params.delete('assignProject'));
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const isAssignProject = searchParams.get('assignProject');
  const initialTab = 'assign_projects';

  useEffect(() => {
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
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const tabs = [
    { label: 'Assign Projects', value: 'assign_projects' },
    {
      label: 'Review Projects',
      value: 'review_projects',
    },
  ];

  const headerButtons = [
    {
      label: isAssignProject ? 'Assign' : 'Remove',
      variant: 'outlined' as const,
      disabled: selectedRows.length === 0,
      onClick: () =>
        isAssignProject ? handletoAssignprojects() : handleRemoveProjects(),
      sx: { width: '80px', minWidth: '80px' },
      hide: tabParam === 'assign_projects' ? false : true,
      loading: assignProjectList.isPending || removeProjectList.isPending,
    },
    {
      label: isAssignProject ? 'Back to Assigned Projects' : 'Assign Projects',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () =>
        isAssignProject
          ? handleBackToAssignedProjects()
          : handleAssignProject(),
      sx: {
        width: isAssignProject ? '180px' : '130px',
        minWidth: isAssignProject ? '180px' : '130px',
      },
      hide: tabParam === 'assign_projects' ? false : true,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
    },
  ];
  console.log(selectedRows);
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const { permission } = useSelector((state: RootState) => state.permission);
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
        value: data.classification_name,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );

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
  const projectFilterFields = isAssignProject
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

  const projectViewEditlistFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditlistFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditlistFields]);
  const caseColumns = isAssignProject
    ? getAssignedProjectColumns(permissionMap)
    : getSelectProjectColumns(permissionMap);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(caseColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    caseColumns.map((col) => col.id)
  );

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

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];
  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'case-column-visibility-popover' : undefined;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={caseColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <SectionTabPanel
        tabs={InteractionsTabs}
        filterMenu={projectFilterFields}
        filterVisibility={true}
        showFilter={showFilter}
        contextKey={isAssignProject ? 'select-projects' : 'assigned-projects'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        showSearch={true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
      />
      <SectionHeader
        title={isAssignProject ? 'Assign Projects' : 'Assigned Projects'}
        titleIcon={
          <InteractionDetailIcon
            alt='financial-header-icon'
            className={`w-7 h-7 p-1 bg-[#E25A32] 'rounded-[2px]' 'rounded-full'`}
          />
        }
        count={10}
        showItemCount={true}
        buttons={headerButtons}
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />
      {tabParam === 'assign_projects' ? (
        <div className='border border-[#CBD6E2] border-t-0'>
          {isAssignProject ? (
            <SelectProjects
              accountInActive={false}
              refreshTrigger={refreshTrigger}
              setSelectedRows={setSelectedRows}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              visibleColumns={visibleColumns}
              searchText={searchText}
            />
          ) : (
            <AssignedProjects
              accountInActive={false}
              refreshTrigger={refreshTrigger}
              setSelectedRows={setSelectedRows}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              visibleColumns={visibleColumns}
              searchText={searchText}
            />
          )}
        </div>
      ) : (
        <div className='border border-[#CBD6E2] border-t-0'>
          <ReviewProjectsList
            accountInActive={false}
            visibleColumns={visibleColumns}
          />
        </div>
      )}
    </div>
  );
};

export default CasesProjects;

import React, { useEffect, useMemo, useState } from 'react';
import TabPanel from '../../components/tab';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ResourceTableHeader from '../resources/resource-table-header';
import { getProjectColumns } from './columns';
import {
  ProjectTriggerAI,
  useAccountProjects,
  useGetProjectType,
} from '../../../../services/project';
import { PROJECT_CREATE, PROJECT_DETAILS } from '../../../../../routes';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import {
  Project,
  ProjectListParams,
  ProjectTriggerAIPayload,
} from '../../../../types/project';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission, REGEX_PATTERNS } from '../../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';
import {
  CellEditData,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { useFetchClassification } from '../../../../services/account';
import { AccountDetailsResponse, ExportType } from '../../../../types';
import { UPDATE_PROJECT } from '../../../../../api/graphql/queries/project-query';
import { useMutation } from '@apollo/client';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';
import { ProjectsSideIcon } from '../../../../../assets';
const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
};

interface AccountDetailsProps extends AccountDetailsResponse {
  activeKey: string;
}

interface ProjectsProps {
  accountDetails?: AccountDetailsProps;
  activeKey?: string;
  setProjectParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setExportType?: (type: ExportType) => void;
  toggleEnabled: boolean;
  setToggleEnabled: (val: boolean) => void;
}

const projectTabs: ResourceTabs[] = [
  {
    id: AllPermissions.PROJECTS_VIEW_EDIT,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllMenus.TIMESHEETS,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

const Projects: React.FC<ProjectsProps> = ({
  accountDetails,
  setExportType,
  setProjectParams,
  toggleEnabled,
  setToggleEnabled,
}) => {
  const { accountid } = useParams();
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const projectTypeOptions = useGetProjectType();
  const Classification = useFetchClassification();
  const [projectsTabs, setProjectsTabs] = useState(projectTabs);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('project_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  const isModalOpen = Boolean(columnAnchorEl);

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const accountInActive =
    accountDetails?.accountById?.status?.status_name?.toLowerCase() !==
    'active';
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedTableId, setSelectedTableIds] = useState<string[]>([]);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [searchText, setSearchText] = useState('');
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const isProjectFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const projectViewAllIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_VIEW_EDIT
  );

  const projectCreateIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_CREATE
  );
  const projectDownloadIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
  );

  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  // const projectEditIsEnable = checkPermission(
  //   permission,
  //   AllPermissions.ACCOUNT_PROJECTS_EDIT
  // );
  // This functionality will be implemented later
  // const projectDeleteIsEnable = checkPermission(
  //   permission,
  //   AllPermissions.ACCOUNT_PROJECTS_DELETE
  // );
  const projectOverviewIsEnable = !projectsTabs[0].hide;

  const { data, isLoading, error } = useAccountProjects(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountid ?? accountDetails?.accountDetails?.account_rid,
      bothParentAndChild: false,
      search: searchText,
      // bothParentAndChild: toggleEnabled  // Commented for it may use in future
    },
    projectOverviewIsEnable && projectViewAllIsEnable,
    refreshProjectsTrigger
  );
  const [updateProjectMutation] = useMutation(UPDATE_PROJECT, {
    client: resourceClient,
  });

  const totalItems = data?.count || 0;

  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };

  useEffect(() => {
    if (data?.projects) {
      setProjectList(data.projects || []);
    }
  }, [data?.projects]);

  useEffect(() => {
    const isHide = (tab: ResourceTabs) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setProjectsTabs(
      projectTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
  }, [permission]);

  useEffect(() => {
    if (setExportType) {
      setExportType('project');
    }
    setProjectParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountDetails?.accountDetails?.account_rid || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder, appliedFilters, convertedFiscalYear]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(sortBy);
  };
  const handleEdit = (
    account: Project,
    fieldValue?: string | null,
    section?: string
  ) => {
    const sendState = fieldValue || section;
    const accountID = account?.account_rid ?? '';
    const projectID = account?.project_fiscal_rid ?? '';

    const queryParams = new URLSearchParams({
      accountID,
      projectID,
      source: 'account',
    });

    navigate(
      `/project/edit/${projectID}?${queryParams.toString()}`,
      sendState
        ? {
            state: {
              field: fieldValue || '',
              section: fieldValue ? '' : section,
            },
          }
        : undefined
    );
  };

  const getRowId = (row: Project & { _level?: number }) => {
    if (row._level === 1 && 'project_fiscal_rid' in row) {
      return row.project_fiscal_rid || '';
    }
    return row.project_rid || '';
  };

  const TriggerAIEnable = checkPermission(
    permission,
    AllPermissions.TRIGGER_AI_ASSESSMENT
  );

  const handleselectedList = (id: string[]) => {
    console.log(id);
    const childIds = id.filter((_, index) => index % 2 === 0);
    setSelectedTableIds(childIds);
  };
  const triggerAIMutation = ProjectTriggerAI();

  const handleTriggerAIBtn = () => {
    const payload: ProjectTriggerAIPayload = {
      data: [
        {
          account_rid: accountid || '',
          project_fiscal_rid: selectedTableId,
        },
      ],
      type: 'project',
    };
    triggerAIMutation.mutate(payload, {
      onSuccess: (res) => {
        successToast(res.statusMessage);
        setClearTrigger((prev) => !prev);
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };
  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountInActive,
      onClick: (row: Project) => handleEdit(row),
      hide: !isProjectFieldsEditable,
    },
    {
      label: 'Delete',
      disabled: accountInActive,
      onClick: (row: Project) => console.log('Delete', row),
      // hide: !projectDeleteIsEnable,
      hide: true,
    },
    {
      label: 'View Summary',
      onClick: (row: Project) => console.log('Summary', row),
      hide: true,
    },
    {
      label: 'View Activities',
      onClick: (row: Project) => console.log('Activities', row),
      hide: true,
    },
    {
      label: 'View Notes',
      onClick: (row: Project) => console.log('Notes', row),
      hide: true,
    },
  ];

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreateProject(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: !projectCreateIsEnable,
    },
    {
      label: 'RD Assessment',
      variant: 'outlined' as const,
      disabled: accountInActive || selectedTableId.length === 0,
      onClick: () => handleTriggerAIBtn(),
      loading: triggerAIMutation.isPending,
      sx: { ...BUTTON_STYLES, width: '115px', minWidth: '115px' },
      hide: !TriggerAIEnable,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: false,
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: {
        ...BUTTON_STYLES,
        width: '96px',
        minWidth: '96px',
        display: 'none',
      },
      hide: !projectDownloadIsEnable,
    },
  ];

  const handleCreateProject = () => {
    const accountID = accountDetails?.accountById?.rid ?? '';
    const accountName = accountDetails?.accountById?.account_name ?? '';

    const projectSettings = {
      auto_access_rd: accountDetails?.accountDetails?.auto_access_rd
        ? 'Yes'
        : 'No',
      auto_send_interaction: accountDetails?.accountDetails
        ?.autosend_interaction
        ? 'Yes'
        : 'No',
      max_ai_interactions:
        accountDetails?.accountDetails?.max_ai_interactions ?? '',
      currency_rid: accountDetails?.accountById?.currency_rid ?? '',
    };

    const queryParams = new URLSearchParams({
      accountID,
      source: 'createAccount',
      AccountName: accountName,
      settings: JSON.stringify(projectSettings),
    });
    navigate(`${PROJECT_CREATE}?${queryParams.toString()}`);
  };

  const handleProject = (project: Project) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project?.project_fiscal_rid ?? '',
    });
    const queryParams = new URLSearchParams({
      accountID: project?.account_rid ?? '',
      source: 'account',
      currency_rid: project?.currency_rid ?? '',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'project_code';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };

  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        label: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );

  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        label: data.classification_name,
        value: data.rid,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );

  const projectColumns = useMemo(
    () =>
      getProjectColumns(
        handleProject,
        memoizedProjectTypes,
        memoizedClassification,
        handleEdit,
        permissionMap,
        accountInActive
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountInActive]
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<Project>[]
  >(projectColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = projectColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [accountInActive, projectColumns]);

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    // Save the old state to revert if needed
    const previousProject = [...projectList];

    // Find parent project
    const parentProject = projectList.find((project) =>
      project.ProjectFiscal?.some((fiscal) => fiscal.rid === rowId)
    );

    if (!parentProject) return;

    // Find the child fiscal
    const childFiscal = parentProject.ProjectFiscal.find(
      (fiscal) => fiscal.rid === rowId
    );

    if (!childFiscal) return;

    // Prepare update data
    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        return acc;
      },
      {
        account_rid: parentProject.account_rid,
        project_rid: childFiscal.project_rid,
        project_fiscal_rid: childFiscal.project_fiscal_rid,
        global_fiscal_year: convertedFiscalYear || 0,
      }
    );

    const isClassificationUpdated = updates.some(
      (item) => item.columnId === 'classification_name'
    );
    const hasClassificationOther = updates.some(
      (item) => item.columnId === 'project_classification_other'
    );

    if (isClassificationUpdated && !hasClassificationOther) {
      updateData['project_classification_other'] = '';
    }

    // Calculate total_cost if any cost field is updated
    const isCostFieldUpdated = updates.some(
      (item) =>
        item.columnId === 'total_cost_fte' ||
        item.columnId === 'total_cost_subcon' ||
        item.columnId === 'total_cost_nonlabor'
    );

    if (isCostFieldUpdated) {
      // Get current values from childFiscal or updateData
      const fteCost =
        updateData['total_cost_fte'] ?? childFiscal.total_cost_fte ?? 0;
      const subconCost =
        updateData['total_cost_subcon'] ?? childFiscal.total_cost_subcon ?? 0;
      const nonLaborCost =
        updateData['total_cost_nonlabor'] ??
        childFiscal.total_cost_nonlabor ??
        0;

      // Convert to numbers and ensure they are valid
      const fteCostNum = parseFloat(fteCost as string) || 0;
      const subconCostNum = parseFloat(subconCost as string) || 0;
      const nonLaborCostNum = parseFloat(nonLaborCost as string) || 0;

      // Calculate total_cost
      const totalCost = fteCostNum + subconCostNum + nonLaborCostNum;

      // Validate total_cost
      const totalCostString = totalCost.toFixed(2);
      if (!REGEX_PATTERNS.EFFORTS_NUMBER.test(totalCostString)) {
        errorToast(
          'Invalid total cost calculated. Must be a positive number with up to 16 digits and 2 decimal places.'
        );
        return;
      }

      // Add total_cost to updateData
      updateData['total_cost'] = totalCostString;
    }

    try {
      const res = await updateProjectMutation({
        variables: { data: updateData },
      });

      const result = res.data?.updateSpecificProjectDetails;

      if (result?.statusCode === 200 && result.data) {
        const updatedParentData = result.data;

        const newProjects = projectList.map((project) => {
          if (project.project_rid === updatedParentData.project_rid) {
            return updatedParentData;
          }
          return project;
        });

        setProjectList(newProjects);
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setProjectList(previousProject);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setProjectList(previousProject);
    }
  };
  // Commented for it may use in future
  // const isProjectViewEditEnable = checkPermission(
  //   permission,
  //   AllPermissions.PROJECTS_VIEW_EDIT
  // );

  if (!projectIsEnable || !projectViewAllIsEnable) return <AccessRestricted />;

  const RestrictedColumns = [
    {
      id: 'project_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter((col) => !col.hide) as ListTableColumn<Project>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };
  const modalId = isModalOpen
    ? 'account-interaction-attachment-column-visibility-popover'
    : undefined;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <TabPanel
        value='projects'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={projectOverviewIsEnable}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        toggleLabel='Include Parent'
        showToggle={false}
        // showToggle={isProjectViewEditEnable} // Commented for it may use in future
        toggleEnabled={toggleEnabled}
        setToggleEnabled={setToggleEnabled}
        showSearch={true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
      />
      {projectOverviewIsEnable && projectViewAllIsEnable ? (
        <>
          <ResourceTableHeader
            value={'projects'}
            title='Projects'
            count={totalItems}
            titleIcon={
              <ProjectsSideIcon
                alt='project-header-icon'
                className='[&>path]:stroke-[#E54787] w-[14px] h-[14px]'
              />
            }
            headerButtons={headerButtons}
            iconBg='#FFE7F1'
          />
          <div className='border border-[#CBD6E2]'>
            <ManageColumnsPopover
              anchorEl={columnAnchorEl}
              open={isModalOpen}
              popoverId={modalId}
              onClose={handlePopoverClose}
              columns={projectColumns}
              onColumnsChange={handleColumnsChange}
              columnRestrictions={RestrictedColumns}
            />
            <ListTable
              data={projectList as Project[]}
              columns={visibleColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                height: '100%',
                maxHeight: 'calc(100vh - 320px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              expandAllParent={true}
              expandable={true}
              childrenKey='ProjectFiscal'
              maxNestingLevel={2}
              editDisableLevel={[0]}
              stickyColumnsCount={1}
              actionWidth={60}
              actionDisplayMode='dropdown'
              actionMenuItems={actionMenuItems}
              loading={isLoading}
              error={error ? 'Failed to load projects' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage ?? 1}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={setRowsPerPage}
              sortBy={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              selectable={true}
              onSelectionChange={(selectedIds) =>
                handleselectedList(selectedIds)
              }
              component='project'
              onCellEdit={handleCellEdit}
              clearSelectedRows={clearTrigger}
            />
          </div>
        </>
      ) : (
        <AccessRestricted />
      )}
    </div>
  );
};

export default Projects;

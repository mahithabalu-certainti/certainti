import { useEffect, useMemo, useState } from 'react';
import { ProjectHeaderIcon } from '../../../../../assets';
import TabPanel from '../../components/tab';
// import ListTable from '../../components/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ResourceTableHeader from '../resources/resource-table-header';
import { getProjectColumns } from './columns';
import {
  useAccountProjects,
  useGetProjectType,
} from '../../../../services/project';
import { PROJECT_CREATE, PROJECT_DETAILS } from '../../../../../routes';
import { generatePath, useNavigate } from 'react-router-dom';
import { ProjectListParams } from '../../../../types/project';
import { ListTable } from '../../../../../components/table';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission } from '../../../../../common-utils';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';
import { CellEditData, Project } from '../../../../../components/table/types';
import { useFetchClassification } from '../../../../services/account';
import { AccountDetailsResponse } from '../../../../types';
const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
};

interface AccountDetailsProps extends AccountDetailsResponse {
  activeKey: string;
}

interface ProjectsProps {
  accountDetails?: AccountDetailsProps;
  activeKey?: string;
  setProjectParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setExportType?: (type: 'resource' | 'cost' | 'skill' | 'project') => void;
  toggleEnabled: boolean;
  setToggleEnabled: (val: boolean) => void;
}

const projectTabs: ResourceTabs[] = [
  {
    id: AllPermissions.PROJECTS_VIEW_EDIT,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllMenus.TIMESHEETS,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

const Projects: React.FC<ProjectsProps> = ({
  accountDetails,
  setExportType,
  setProjectParams,
  toggleEnabled,
  setToggleEnabled,
}) => {
  const navigate = useNavigate();
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
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const accountInActive =
    accountDetails?.accountById?.status?.status_name?.toLowerCase() !==
    'active';

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const projectViewAllIsEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_VIEW_EDIT
  );

  const projectCreateIsEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_CREATE
  );
  const projectDownloadIsEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_EXPORT
  );
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
      accountNumber: accountDetails?.accountDetails?.account_rid || '',
      bothParentAndChild: toggleEnabled,
    },
    projectOverviewIsEnable && projectViewAllIsEnable,
    refreshProjectsTrigger
  );
  const totalItems = data?.count || 0;
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };
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
  const handleEdit = (account: Project) => {
    const accountID = account?.account_rid ?? '';
    const projectID = account?.project_fiscal_rid ?? '';

    const queryParams = new URLSearchParams({
      accountID,
      projectID,
      source: 'account',
    });

    navigate(`/Project/edit/${projectID}?${queryParams.toString()}`);
  };
  const getRowId = (row: Project & { _level?: number }) => {
    if (row._level === 1 && 'project_fiscal_rid' in row) {
      return row.project_fiscal_rid || '';
    }
    return row.project_rid || '';
  };
  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountInActive,
      onClick: (row: Project) => handleEdit(row),
      hide: true,
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
    console.log(accountName, 'vvvv');
    navigate(`${PROJECT_CREATE}?${queryParams.toString()}`);
  };

  const handleProject = (project: Project) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project?.project_fiscal_rid ?? '',
    });
    const queryParams = new URLSearchParams({
      accountID: project?.account_rid ?? '',
      source: 'account',
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

  const projectColumns = getProjectColumns(
    handleProject,
    memoizedProjectTypes,
    memoizedClassification
  );

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    console.log(rowId, updates);
  };

  if (!projectIsEnable || !projectViewAllIsEnable) return <AccessRestricted />;

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
        toggleEnabled={toggleEnabled}
        setToggleEnabled={setToggleEnabled}
      />
      {projectOverviewIsEnable && projectViewAllIsEnable ? (
        <>
          <ResourceTableHeader
            value={'projects'}
            title='Projects'
            count={totalItems}
            titleIcon={<ProjectHeaderIcon alt='project-header-icon' />}
            headerButtons={headerButtons}
          />
          <div className='border border-[#CBD6E2]'>
            <ListTable
              data={data?.projects as Project[]}
              columns={projectColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                height: '100%',
                maxHeight: 'calc(100vh - 290px)',
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
                console.log('Selected:', selectedIds)
              }
              component='project'
              onCellEdit={handleCellEdit}
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

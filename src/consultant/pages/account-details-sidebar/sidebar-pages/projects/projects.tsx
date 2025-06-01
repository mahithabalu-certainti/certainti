/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { projectHeaderIcon } from '../../../../../assets';
import TabPanel from '../../components/tab';
// import ListTable from '../../components/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ResourceTableHeader from '../resources/resource-table-header';
import { getProjectColumns } from './columns';
import { useAccountProjects } from '../../../../services/project';
import { PROJECT_CREATE, PROJECT_DETAILS } from '../../../../../routes';
import { generatePath, useNavigate } from 'react-router-dom';
import { ProjectList } from '../../../../types/project';
import { ListTable } from '../../../../../components/table';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission } from '../../../../../common-utils';
import { AllModules } from '../../../../../common-service';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
};

interface ProjectsProps {
  accountDetails?: Record<string, any>;
  activeKey?: string;
}

const Projects: React.FC<ProjectsProps> = ({ accountDetails }) => {
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('created_datetime');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, error } = useAccountProjects({
    page: currentPage + 1,
    limit: rowsPerPage,
    sortBy: sortField,
    sortOrder: sortOrder,
    filters: appliedFilters,
    fiscalYear: convertedFiscalYear,
    accountNumber: accountDetails?.data?.accountDetails?.account_rid || '',
  });
  const totalItems = data?.count || 0;

  // Permission Mangement
  const { modules } = useSelector((state: RootState) => state.permission);
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(sortBy);
  };
  const handleEdit = (account: any) => {
    navigate(`/Project/edit/${account?.rid}`, {
      state: {
        accountID: account?.account_rid,
        projectID: account?.rid,
      },
    });
  };
  const getRowId = (row: ProjectList) => row.rid;
  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: any) => handleEdit(row),
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Delete', row),
    },
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
    },
  ];

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      onClick: () => handleCreateProject(),
      sx: { ...BUTTON_STYLES, width: '61px', minWidth: '61px' },
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
    },
  ];

  const handleCreateProject = () => {
    const accountID = accountDetails?.data?.accountById?.rid;
    navigate(`${PROJECT_CREATE}`, {
      state: { accountID },
    });
  };

  const handleProject = (project: ProjectList) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project?.rid,
    });
    navigate(path, {
      state: { accountID: project?.account_rid, projectID: project?.rid },
    });
  };

  const projectColumns = getProjectColumns(handleProject);

  if (!projectIsEnable) return <AccessRestricted />;

  return (
    <div className='w-full py-3 pl-3 pr-4'>
      <TabPanel
        value={'projects'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={true}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
      />
      <ResourceTableHeader
        value={'projects'}
        title='Projects'
        titleIcon={<img src={projectHeaderIcon} alt='project-header-icon' />}
        headerButtons={headerButtons}
      />
      <div className='border border-[#CBD6E2]'>
        <ListTable
          data={data?.projects as any}
          columns={projectColumns}
          getRowId={getRowId}
          hoverHighlight={false}
          stickyHeader={true}
          stickyColumnsCount={1}
          actionWidth={60}
          actionDisplayMode='dropdown'
          actionMenuItems={actionMenuItems}
          loading={isLoading}
          error={error ? 'Failed to load projects' : undefined}
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={rowsPerPage}
          currentPage={(currentPage ?? 1) - 1}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          sortBy={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
    </div>
  );
};

export default Projects;

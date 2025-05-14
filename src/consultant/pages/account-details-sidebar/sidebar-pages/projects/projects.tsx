/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { projectHeaderIcon } from '../../../../../assets';
import TabPanel from '../../components/tab';
import ListTable from '../../components/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ResourceTableHeader from '../resources/resource-table-header';
import { getProjectColumns } from './columns';
import { useAccountProjects } from '../../../../services/project';
import { PROJECT_CREATE, PROJECT_DETAILS } from '../../../../../routes';
import { generatePath, useNavigate } from 'react-router-dom';
import { ProjectList } from '../../../../types/project';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
  color: '#F16137',
  bgcolor: '#FFF8F6',
  borderRadius: '2px',
};

interface ProjectsProps {
  accountDetails?: Record<string, any>;
  activeKey?: string;
}

const Projects: React.FC<ProjectsProps> = ({ accountDetails }) => {
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('created_datetime');
  const [rowsPerPage, setRowsPerPage] = useState(25);
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
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const handleEdit = (account: any) => {
    console.log(account);
    navigate(`/Project/edit/aaf4cdd9-3120-4faa-a2f4-30d0cbb3947f`, {
      state: {
        accountID:account.account_rid,
        projectID:"aaf4cdd9-3120-4faa-a2f4-30d0cbb3947f"
      },
    });
  };
  
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
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      onClick: () => handleCreateProject(),
      sx: { ...BUTTON_STYLES, width: '61px', minWidth: '61px' },
    },
  ];

  const handleCreateProject = () => {
    navigate(`${PROJECT_CREATE}`, {
      state: { accountId: accountDetails?.data?.accountById?.r_number },
    });
  };

  const handleProject = (project: ProjectList) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project.id
    });
    navigate(path, {
      state: { accountId: accountDetails?.data?.accountById?.r_number },
    });
  };

  const projectColumns = getProjectColumns(handleProject);

  return (
    <div className='w-full'>
      <TabPanel
        value={'projects'}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={true}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        setFilterStates={() => {}}
        setSelectedFilters={() => {}}
      />
       <ResourceTableHeader
        value={'projects'}
        title='Projects'
        titleIcon={<img src={projectHeaderIcon} alt='project-header-icon' />}
        headerButtons={headerButtons}
      />
      <ListTable      
        data={data?.projects as any}
        columns={projectColumns}
        actionMenuItems={actionMenuItems}
        pagination={true}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[25, 30, 40, 50, 100]}
        sortable={true}
        isLoading={isLoading}
        error={error}
        rowIdentifier='rid'
        setCurrentPage={setCurrentPage}
        setSortOrder={setSortOrder}
        setSortField={setSortField}
        setRowsPerPage={setRowsPerPage}
        sortField={sortField}
        sortOrder={sortOrder}
        currentPage={currentPage}
        totalCount={data?.count || 0}
      />
    </div>
  );
};

export default Projects;
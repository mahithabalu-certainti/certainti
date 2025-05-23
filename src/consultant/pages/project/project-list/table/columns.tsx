import { Project, ProjectColumn } from '../../../../types/project';

export const getProjectColumns = (
  onClick: (row: Project) => void
): ProjectColumn<Project>[] => [
  {
    id: 'account_number',
    header: 'Account Number',
    sortable: true,
    sort: 'account_number',
    width: '160px',
    render: (row: Project) => (
      <span
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.accountNumber}
      </span>
    ),
  },
  {
    id: 'account_name',
    header: 'Account Name',
    sortable: true,
    sort: 'account_name',
    width: '200px',
  },
  {
    id: 'project_number',
    header: 'Project Number',
    sortable: true,
    sort: 'project_number',
    width: '180px',
  },
  {
    id: 'project_code',
    header: 'Project Code',
    sortable: true,
    sort: 'project_code',
    width: '180px',
  },
  {
    id: 'industry_name',
    header: 'Industry',
    sortable: true,
    sort: 'industry',
    width: '140px',
  },
  {
    id: 'project_startdate',
    header: 'Project Start Date',
    sortable: true,
    sort: 'project_start_date',
    width: '160px',
  },
  {
    id: 'project_enddate',
    header: 'Project End Date',
    sortable: true,
    sort: 'project_end_date',
    width: '160px',
  },
  {
    id: 'project_type',
    header: 'Project Type',
    sortable: true,
    sort: 'project_type',
    width: '140px',
  },
  {
    id: 'classification_name',
    header: 'Project Classification',
    sortable: true,
    sort: 'classification_name',
    width: '180px',
  },
  {
    id: 'project_client_group',
    header: 'Project Client Group',
    sortable: true,
    sort: 'project_client_group',
    width: '180px',
  },
  {
    id: 'project_group',
    header: 'Project Group',
    sortable: true,
    sort: 'project_group',
    width: '160px',
  },
  {
    id: 'project_status',
    header: 'Status',
    sortable: true,
    sort: 'project_status',
    width: '120px',
    render: (row: Project) => (
      <span
        className={`${row.project_status === 'Active' ? '!text-[#199806]' : '!text-[#f44336]'}`}
      >
        {row.project_status || 'NA'}
      </span>
    ),
  },
];

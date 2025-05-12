import { Project, ProjectColumn } from '../../../../types/project';

export const getProjectColumns = (onClick: (row: Project) => void): ProjectColumn<Project>[] => [
    {
        id: 'accountNumber',
        header: 'Account Number',
        sortable: true,
        sort: 'account_number',
        width: '160px',
        render: (row: Project) => (
            <span className='cursor-pointer hover:!text-blue-600 hover:underline'
                onClick={() => onClick(row)}>
                {row.accountNumber}
            </span>
        ),
    },
    { id: 'accountName', header: 'Account Name', sortable: true, sort: 'account_name', width: '200px' },
    { id: 'projectNumber', header: 'Project Number', sortable: true, sort: 'project_number', width: '180px' },
    { id: 'projectRefId', header: 'Project Ref ID', sortable: true, sort: 'project_ref_id', width: '180px' },
    { id: 'industry', header: 'Industry', sortable: true, sort: 'industry', width: '140px' },
    { id: 'projectStartDate', header: 'Project Start Date', sortable: true, sort: 'project_start_date', width: '160px' },
    { id: 'projectEndDate', header: 'Project End Date', sortable: true, sort: 'project_end_date', width: '160px' },
    { id: 'projectType', header: 'Project Type', sortable: true, sort: 'project_type', width: '140px' },
    { id: 'projectClassification', header: 'Project Classification', sortable: true, sort: 'project_classification', width: '180px' },
    { id: 'projectClientGroup', header: 'Project Client Group', sortable: true, sort: 'project_client_group', width: '180px' },
    { id: 'projectGroup', header: 'Project Group', sortable: true, sort: 'project_group', width: '160px' },
    {
        id: 'status',
        header: 'Status',
        sortable: true,
        sort: 'status',
        width: '120px',
        render: (row: Project) => (
            <span className={`${row.status === 'Active' ? '!text-[#199806]' : '!text-[#f44336]'}`}>
                {row.status}
            </span>
        ),
    }
];
  

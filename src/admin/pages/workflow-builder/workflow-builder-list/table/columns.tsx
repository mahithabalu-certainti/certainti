import { Switch, Tooltip } from '@mui/material';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';

export interface WorkflowRule {
  rid: string;
  name: string;
  labels: string[];
  owner: string;
  scope: string;
  updated_datetime: string;
  enabled: boolean;
  created_datetime?: string;
  created_by?: string;
  [key: string]: unknown; // Index signature to satisfy RowData type
}

export const getWorkflowColumns = (
  toggleClick?: (rid: string, enabled: boolean) => void
): ListTableColumn<WorkflowRule>[] => [
  {
    id: 'name',
    editId: 'name',
    sortId: 'name',
    label: 'Name',
    width: '30%',
    sortable: true,
    sticky: true,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: WorkflowRule) => (
      <div className='font-medium text-[#2D3E4F]'>{row.name}</div>
    ),
  },
  {
    id: 'labels',
    sortId: 'labels',
    label: 'Labels',
    width: '20%',
    sortable: false,
    render: (row: WorkflowRule) => (
      <div className='flex flex-wrap gap-1'>
        {row.labels.map((label, index) => (
          <span
            key={index}
            className='px-2 py-1 text-xs bg-[#E3F2FD] text-[#1565C0] rounded-md'
          >
            {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: 'owner',
    sortId: 'owner',
    label: 'Owner',
    width: '20%',
    sortable: true,
    render: (row: WorkflowRule) => (
      <div className='text-[#425A76]'>{row.owner}</div>
    ),
  },
  {
    id: 'scope',
    sortId: 'scope',
    label: 'Scope',
    width: '8%',
    sortable: true,
    render: (row: WorkflowRule) => (
      <span
        className={`px-2 py-1 text-xs rounded-md ${
          row.scope === 'Global'
            ? 'bg-[#E8F5E8] text-[#2E7D32]'
            : row.scope === 'Department'
              ? 'bg-[#FFF3E0] text-[#F57C00]'
              : row.scope === 'Project'
                ? 'bg-[#E3F2FD] text-[#1565C0]'
                : 'bg-[#F3E5F5] text-[#7B1FA2]'
        }`}
      >
        {row.scope}
      </span>
    ),
  },
  {
    id: 'status',
    sortId: 'status',
    label: 'Status',
    width: '7%',
    sortable: false,
    render: (row) => (
      <div className='text-center'>
        <Tooltip
          title={row.enabled ? 'Disable workflow' : 'Enable workflow'}
          arrow
          placement='top'
        >
          <Switch
            size='small'
            color={row.enabled ? 'success' : 'warning'}
            onChange={(_e, checked) =>
              toggleClick && toggleClick(row.rid, checked)
            }
            checked={row.enabled}
          />
        </Tooltip>
      </div>
    ),
  },
  {
    id: 'updated_datetime',
    sortId: 'updated_on',
    label: 'Updated On',
    width: '15%',
    sortable: true,
    render: (row: WorkflowRule) =>
      formatDateToYYYYMMDDWithTime(row.updated_datetime) || '-',
  },
];

import { Switch, Tooltip } from '@mui/material';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { WorkflowRuleListItem } from '../../../../types';

export const getWorkflowColumns = (
  handleToggleStatus: (row: WorkflowRuleListItem, enabled: boolean) => void,
  handleCreateRuleMap: (row: WorkflowRuleListItem) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<WorkflowRuleListItem>[] => [
  {
    id: 'rule_name',
    sortId: 'rule_name',
    label: 'Rule Name',
    width: 180,
    sortable: true,
    sticky: true,
    sx: (row) => ({
      position: 'sticky',
      left: 0,
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
      background: row?.is_rule_mapped ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'scope_type_name',
    sortId: 'scope_type_name',
    label: 'Scope Name',
    width: 140,
    sortable: true,
  },
  {
    id: 'created_user_name',
    sortId: 'created_user_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_user_name']?.edit &&
    //   !permissionMap?.['created_user_name']?.read,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    // hide:
    //   !permissionMap?.['created_datetime']?.edit &&
    //   !permissionMap?.['created_datetime']?.read,
  },
  {
    id: 'modified_user_name',
    sortId: 'modified_user_name',
    label: 'Updated By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['modified_user_name']?.edit &&
    //   !permissionMap?.['modified_user_name']?.read,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.modified_datetime),
    // hide:
    //   !permissionMap?.['modified_datetime']?.edit &&
    //   !permissionMap?.['modified_datetime']?.read,
  },
  {
    id: 'createMap',
    sortId: 'create_map',
    label: 'Assign Rule',
    width: 90,
    sortable: false,
    hide:
      !permissionMap?.['assign_rule']?.edit &&
      !permissionMap?.['assign_rule']?.read,
    render: (row) => {
      const canEditAssignRule = !!permissionMap?.['assign_rule']?.edit;
      return (
        <span
          onClick={() => {
            if (canEditAssignRule) {
              handleCreateRuleMap(row);
            }
          }}
          className={`${
            canEditAssignRule
              ? 'cursor-pointer !text-[#1755E7] underline hover:text-[#1755E7]'
              : 'cursor-default text-gray-500 underline'
          }`}
        >
          Assign
        </span>
      );
    },
  },
  {
    id: 'is_active',
    sortId: 'is_active',
    label: 'Status',
    width: 60,
    sortable: false,
    hide: !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    render: (row) => {
      const canEditStatus = !!permissionMap?.['status']?.edit;
      return (
        <div className='text-center'>
          <Tooltip
            title={row.is_active ? 'Disable Rule' : 'Enable Rule'}
            arrow
            placement='top'
          >
            <Switch
              size='small'
              color={row.is_active ? 'success' : 'warning'}
              onChange={(_e, checked) => handleToggleStatus(row, checked)}
              checked={row.is_active}
              disabled={!canEditStatus}
            />
          </Tooltip>
        </div>
      );
    },
  },
];

import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { WorkflowRuleListItem } from '../../../../types';

export const getWorkflowColumns =
  (): ListTableColumn<WorkflowRuleListItem>[] => [
    {
      id: 'rule_name',
      sortId: 'rule_name',
      label: 'Rule Name',
      width: 180,
      sortable: true,
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
    },
    // {
    //   id: 'labels',
    //   sortId: 'labels',
    //   label: 'Labels',
    //   width: '20%',
    //   sortable: false,
    //   render: (row: WorkflowRule) => (
    //     <div className='flex flex-wrap gap-1'>
    //       {row.labels.map((label, index) => (
    //         <span
    //           key={index}
    //           className='px-2 py-1 text-xs bg-[#E3F2FD] text-[#1565C0] rounded-md'
    //         >
    //           {label}
    //         </span>
    //       ))}
    //     </div>
    //   ),
    // },
    // {
    //   id: 'owner',
    //   sortId: 'owner',
    //   label: 'Owner',
    //   width: '20%',
    //   sortable: true,
    //   render: (row: WorkflowRule) => (
    //     <div className='text-[#425A76]'>{row.owner}</div>
    //   ),
    // },
    // {
    //   id: 'scope',
    //   sortId: 'scope',
    //   label: 'Scope',
    //   width: '8%',
    //   sortable: true,
    //   render: (row: WorkflowRule) => (
    //     <span
    //       className={`px-2 py-1 text-xs rounded-md ${
    //         row.scope === 'Global'
    //           ? 'bg-[#E8F5E8] text-[#2E7D32]'
    //           : row.scope === 'Department'
    //             ? 'bg-[#FFF3E0] text-[#F57C00]'
    //             : row.scope === 'Project'
    //               ? 'bg-[#E3F2FD] text-[#1565C0]'
    //               : 'bg-[#F3E5F5] text-[#7B1FA2]'
    //       }`}
    //     >
    //       {row.scope}
    //     </span>
    //   ),
    // },
    // {
    //   id: 'status',
    //   sortId: 'status',
    //   label: 'Status',
    //   width: '7%',
    //   sortable: false,
    //   render: (row) => (
    //     <div className='text-center'>
    //       <Tooltip
    //         title={row.enabled ? 'Disable workflow' : 'Enable workflow'}
    //         arrow
    //         placement='top'
    //       >
    //         <Switch
    //           size='small'
    //           color={row.enabled ? 'success' : 'warning'}
    //           onChange={(_e, checked) =>
    //             toggleClick && toggleClick(row.rid, checked)
    //           }
    //           checked={row.enabled}
    //         />
    //       </Tooltip>
    //     </div>
    //   ),
    // },
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
      label: 'Modified By',
      width: 180,
      sortable: true,
      // hide:
      //   !permissionMap?.['modified_user_name']?.edit &&
      //   !permissionMap?.['modified_user_name']?.read,
    },
    {
      id: 'modified_datetime',
      sortId: 'modified_datetime',
      label: 'Modified On',
      width: 200,
      sortable: true,
      render: (row) => formatDateToYYYYMMDDWithTime(row.modified_datetime),
      // hide:
      //   !permissionMap?.['modified_datetime']?.edit &&
      //   !permissionMap?.['modified_datetime']?.read,
    },
  ];

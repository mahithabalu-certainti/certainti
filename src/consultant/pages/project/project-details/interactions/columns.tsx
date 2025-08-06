import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionList } from '../../../../types';

export const getInteractionListColumns = (
  handleViewInteraction: (rid: string) => void
  // permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<InteractionList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Interaction ID',
    width: 160,
    sortable: true,
    sticky: true,
    // hide:
    //   !permissionMap?.['r_number']?.edit &&
    //   !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: InteractionList) => (
      <span
        onClick={() => handleViewInteraction(row.rid)}
        className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
      >
        {row.r_number}
      </span>
    ),
  },
  {
    id: 'iteration',
    sortId: 'iteration',
    label: 'Iteration',
    width: 120,
    sortable: true,
    // hide:
    //   !permissionMap?.['iteration']?.edit &&
    //   !permissionMap?.['iteration']?.read,
  },
  {
    id: 'age_days',
    sortId: 'age_days',
    label: 'Age (Days)',
    width: 120,
    sortable: true,
    // hide:
    //   !permissionMap?.['age_days']?.edit && !permissionMap?.['age_days']?.read,
  },
  {
    id: 'status',
    sortId: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    // hide: !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
  },
  {
    id: 'recipient_name',
    sortId: 'recipient_name',
    label: 'Recipient Name',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['recipient_name']?.edit &&
    //   !permissionMap?.['recipient_name']?.read,
  },
  {
    id: 'recipient_email',
    sortId: 'recipient_email',
    label: 'Recipient Email',
    width: 220,
    sortable: true,
    // hide:
    //   !permissionMap?.['recipient_email']?.edit &&
    //   !permissionMap?.['recipient_email']?.read,
  },
  {
    id: 'last_sent_date',
    sortId: 'last_sent_date',
    label: 'Last Sent Date',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_sent_date']?.edit &&
    //   !permissionMap?.['last_sent_date']?.read,
    render: (row: InteractionList) =>
      row.last_sent_date && formatDateToYYYYMMDDWithTime(row.last_sent_date),
  },
  {
    id: 'last_reminder_date',
    sortId: 'last_reminder_date',
    label: 'Last Reminder Date',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_reminder_date']?.edit &&
    //   !permissionMap?.['last_reminder_date']?.read,
    render: (row: InteractionList) =>
      row.last_reminder_date &&
      formatDateToYYYYMMDDWithTime(row.last_reminder_date),
  },
  {
    id: 'response_date',
    sortId: 'response_date',
    label: 'Response Date',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['response_date']?.edit &&
    //   !permissionMap?.['response_date']?.read,
    render: (row: InteractionList) =>
      row.response_date && formatDateToYYYYMMDDWithTime(row.response_date),
  },
  {
    id: 'last_response_update',
    sortId: 'last_response_update',
    label: 'Last Response Update',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_response_update']?.edit &&
    //   !permissionMap?.['last_response_update']?.read,
    render: (row: InteractionList) =>
      row.last_response_update &&
      formatDateToYYYYMMDDWithTime(row.last_response_update),
  },
  {
    id: 'attachments',
    sortId: 'attachments',
    label: 'Attachments',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['attachments']?.edit &&
    //   !permissionMap?.['attachments']?.read,
  },
  {
    id: 'interaction_history',
    sortId: 'interaction_history',
    label: 'Interaction History',
    width: 200,
    sortable: false,
    // hide:
    //   !permissionMap?.['interaction_history']?.edit &&
    //   !permissionMap?.['interaction_history']?.read,
  },
  {
    id: 'interaction_link',
    sortId: 'interaction_link',
    label: 'Interaction Link',
    width: 140,
    sortable: false,
    // hide:
    //   !permissionMap?.['interaction_link']?.edit &&
    //   !permissionMap?.['interaction_link']?.read,
    render: (row: InteractionList) =>
      row.interaction_link ? (
        <a
          href={row.interaction_link}
          target='_blank'
          rel='noopener noreferrer'
          className='text-[#1755E7] hover:underline'
        >
          Link
        </a>
      ) : (
        '-'
      ),
  },
  {
    id: 'parent_interaction_id',
    sortId: 'parent_interaction_id',
    label: 'Parent Interaction ID',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['parent_interaction_id']?.edit &&
    //   !permissionMap?.['parent_interaction_id']?.read,
  },
  {
    id: 'type',
    sortId: 'type',
    label: 'Type',
    width: 140,
    sortable: true,
    // hide: !permissionMap?.['type']?.edit && !permissionMap?.['type']?.read,
  },
  {
    id: 'response_source',
    sortId: 'response_source',
    label: 'Response Source',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['response_source']?.edit &&
    //   !permissionMap?.['response_source']?.read,
  },
  {
    id: 'created_by',
    sortId: 'created_by',
    label: 'Created By',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_by']?.edit &&
    //   !permissionMap?.['created_by']?.read,
  },
  {
    id: 'created_date',
    sortId: 'created_date',
    label: 'Created Date',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_date']?.edit &&
    //   !permissionMap?.['created_date']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.created_date),
  },
  {
    id: 'last_updated_by',
    sortId: 'last_updated_by',
    label: 'Last Updated By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_updated_by']?.edit &&
    //   !permissionMap?.['last_updated_by']?.read,
  },
  {
    id: 'last_updated_date',
    sortId: 'last_updated_date',
    label: 'Last Updated Date',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_updated_date']?.edit &&
    //   !permissionMap?.['last_updated_date']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.last_updated_date),
  },
];

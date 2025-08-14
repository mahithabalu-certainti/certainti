import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionList } from '../../../../types';

export const getInteractionListColumns = (
  handleViewInteraction: (rid: string) => void,
  handleViewInteractionHistory: (interactionHistory: string) => void
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
    id: 'interaction_age',
    sortId: 'interaction_age',
    label: 'Age (Days)',
    width: 120,
    sortable: true,
    // hide:
    //   !permissionMap?.['interaction_age']?.edit && !permissionMap?.['interaction_age']?.read,
  },
  {
    id: 'status',
    sortId: 'status_rid',
    label: 'Status',
    width: 140,
    sortable: true,
    // hide: !permissionMap?.['status_rid']?.edit && !permissionMap?.['status_rid']?.read,
    render: (row: InteractionList) => row.status.status_name || '-',
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
    render: (row: InteractionList) =>
      row.recipient_details.recipient_name || '-',
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
    render: (row: InteractionList) =>
      row.recipient_details.recipient_email || '-',
  },
  {
    id: 'last_sent_on',
    sortId: 'last_sent_on',
    label: 'Last Sent Date',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_sent_on']?.edit &&
    //   !permissionMap?.['last_sent_on']?.read,
    render: (row: InteractionList) =>
      row.last_sent_on && formatDateToYYYYMMDDWithTime(row.last_sent_on),
  },
  {
    id: 'last_reminder_on',
    sortId: 'last_reminder_on',
    label: 'Last Reminder Date',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['last_reminder_on']?.edit &&
    //   !permissionMap?.['last_reminder_on']?.read,
    render: (row: InteractionList) =>
      row.last_reminder_on &&
      formatDateToYYYYMMDDWithTime(row.last_reminder_on),
  },
  {
    id: 'response_submitted_on',
    sortId: 'response_submitted_on',
    label: 'Response Date',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['response_submitted_on']?.edit &&
    //   !permissionMap?.['response_submitted_on']?.read,
    render: (row: InteractionList) =>
      row.response_submitted_on &&
      formatDateToYYYYMMDDWithTime(row.response_submitted_on),
  },
  {
    id: 'response_updated_on',
    sortId: 'response_updated_on',
    label: 'Last Response Update',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['response_updated_on']?.edit &&
    //   !permissionMap?.['response_updated_on']?.read,
    render: (row: InteractionList) =>
      row.response_updated_on &&
      formatDateToYYYYMMDDWithTime(row.response_updated_on),
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
    render: (row: InteractionList) =>
      row.interaction_history ? (
        <span
          onClick={() => handleViewInteractionHistory(row.interaction_history)}
          className='text-[#1755E7] hover:underline'
        >
          {row.interaction_history}
        </span>
      ) : (
        '-'
      ),
  },
  {
    id: 'interaction_url',
    sortId: 'interaction_url',
    label: 'Interaction Link',
    width: 140,
    sortable: false,
    // hide:
    //   !permissionMap?.['interaction_url']?.edit &&
    //   !permissionMap?.['interaction_url']?.read,
    render: (row: InteractionList) =>
      row.interaction_url ? (
        <a
          href={row.interaction_url}
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
    id: 'parent_interaction_rid',
    sortId: 'parent_interaction_rid',
    label: 'Parent Interaction ID',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['parent_interaction_rid']?.edit &&
    //   !permissionMap?.['parent_interaction_rid']?.read,
  },
  {
    id: 'interaction_type',
    sortId: 'interaction_type',
    label: 'Type',
    width: 140,
    sortable: true,
    // hide: !permissionMap?.['interaction_type']?.edit && !permissionMap?.['interaction_type']?.read,
    render: (row: InteractionList) => row.interaction_type.type_name || '-',
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
    render: (row: InteractionList) =>
      row.created_by.created_by_user_name || '-',
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created Date',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_datetime']?.edit &&
    //   !permissionMap?.['created_datetime']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'modified_by',
    sortId: 'modified_by',
    label: 'Last Updated By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['modified_by']?.edit &&
    //   !permissionMap?.['modified_by']?.read,
    render: (row: InteractionList) =>
      row.modified_by.modified_by_user_name || '-',
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Last Updated Date',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['modified_datetime']?.edit &&
    //   !permissionMap?.['modified_datetime']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.modified_datetime),
  },
];

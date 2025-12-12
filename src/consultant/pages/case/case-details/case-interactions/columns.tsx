import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionList } from '../../../../types';

export const getCaseInteractionListColumns = (
  handleViewInteraction: (
    rid: string,
    rNumber: string,
    proFiscalRid: string
  ) => void,
  handleViewInteractionHistory: (interactionHistory: string) => void,
  handleViewInteractionAttachmentCount: (
    interactionAttachmentCount: string | number,
    rid: string,
    rNumber: string
  ) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<InteractionList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Interaction ID',
    width: 130,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
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
        onClick={() =>
          handleViewInteraction(row.rid, row.r_number, row.project_fiscal_rid)
        }
        className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
      >
        {row.r_number}
      </span>
    ),
  },
  // {
  //   id: 'interaction_iteration',
  //   sortId: 'interaction_iteration',
  //   label: 'Iteration',
  //   width: 120,
  //   sortable: true,
  //   sx: { textAlign: 'right' },
  //   hide:
  //     !permissionMap?.['interaction_iteration']?.edit &&
  //     !permissionMap?.['interaction_iteration']?.read,
  // },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 140,
    sortable: true,
    // hide: !permissionMap?.['project_code']?.edit && !permissionMap?.['project_code']?.read,
    render: (row: InteractionList) => row.project_code || '-',
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: 140,
    sortable: true,
    // hide: !permissionMap?.['project_code']?.edit && !permissionMap?.['project_code']?.read,
    render: (row: InteractionList) => row.project_name || '-',
  },
  {
    id: 'interaction_age',
    sortId: 'interaction_age',
    label: 'Age (Days)',
    width: 103,
    sortable: true,
    sx: { textAlign: 'right' },
    hide:
      !permissionMap?.['interaction_age']?.edit &&
      !permissionMap?.['interaction_age']?.read,
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 140,
    sortable: true,
    hide: !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    render: (row: InteractionList) => row.status_name || '-',
  },
  {
    id: 'recipient_name',
    sortId: 'recipient_name',
    label: 'Recipient Name',
    width: 160,
    sortable: true,
    sx: (row) => ({
      background: row?.has_email_recipient ? '#fff' : '#f4ecec !important',
    }),
    hide:
      !permissionMap?.['recipient_name']?.edit &&
      !permissionMap?.['recipient_name']?.read,
    render: (row: InteractionList) => row.recipient_name || '-',
  },
  {
    id: 'recipient_email',
    sortId: 'recipient_email',
    label: 'Recipient Email',
    width: 200,
    sortable: true,
    sx: (row) => ({
      background: row?.has_email_recipient ? '#fff' : '#f4ecec !important',
    }),
    hide:
      !permissionMap?.['recipient_email']?.edit &&
      !permissionMap?.['recipient_email']?.read,
    render: (row: InteractionList) => row.recipient_email || '-',
  },
  {
    id: 'last_resent_on',
    sortId: 'sent_on_datetime',
    label: 'Last Sent Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['last_resent_on']?.edit &&
      !permissionMap?.['last_resent_on']?.read,
    render: (row: InteractionList) =>
      row.last_resent_on && formatDateToYYYYMMDDWithTime(row.last_resent_on),
  },
  {
    id: 'last_reminder_on',
    sortId: 'last_reminder_on',
    label: 'Last Reminder Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['last_reminder_on']?.edit &&
      !permissionMap?.['last_reminder_on']?.read,
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
    hide:
      !permissionMap?.['response_submitted_on']?.edit &&
      !permissionMap?.['response_submitted_on']?.read,
    render: (row: InteractionList) =>
      row.response_submitted_on &&
      formatDateToYYYYMMDDWithTime(row.response_submitted_on),
  },
  {
    id: 'response_updated_on',
    sortId: 'response_updated_on',
    label: 'Last Response Update',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['response_updated_on']?.edit &&
      !permissionMap?.['response_updated_on']?.read,
    render: (row: InteractionList) =>
      row.response_updated_on &&
      formatDateToYYYYMMDDWithTime(row.response_updated_on),
  },
  {
    id: 'attachment_count',
    sortId: 'attachment_count',
    label: 'Number of Attachments',
    width: 185,
    sortable: true,
    sx: { textAlign: 'right' },
    render: (row: InteractionList) =>
      row.attachment_count ? (
        <span
          onClick={() =>
            row.attachment_count &&
            handleViewInteractionAttachmentCount(
              row.attachment_count,
              row.rid,
              row.r_number
            )
          }
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.attachment_count}
        </span>
      ) : (
        '-'
      ),
    hide:
      !permissionMap?.['attachment_count']?.edit &&
      !permissionMap?.['attachment_count']?.read,
  },
  {
    id: 'interaction_history',
    sortId: 'interaction_history',
    label: 'Interaction History',
    width: 135,
    sortable: false,
    hide:
      !permissionMap?.['interaction_history']?.edit &&
      !permissionMap?.['interaction_history']?.read,
    render: (row: InteractionList) =>
      row.interaction_history ? (
        <span
          onClick={() => handleViewInteractionHistory(row.interaction_history)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          View
        </span>
      ) : (
        '-'
      ),
  },
  {
    id: 'interaction_url',
    sortId: 'interaction_url',
    label: 'Interaction Link',
    width: 115,
    sortable: false,
    hide:
      !permissionMap?.['interaction_url']?.edit &&
      !permissionMap?.['interaction_url']?.read,
    render: (row: InteractionList) =>
      row.interaction_url ? (
        <span
          onClick={() =>
            row.interaction_url && window.open(row.interaction_url, '_blank')
          }
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          Link
        </span>
      ) : (
        '-'
      ),
  },
  {
    id: 'interaction_type_name',
    sortId: 'interaction_type_name',
    label: 'Type',
    width: 80,
    sortable: true,
    hide:
      !permissionMap?.['interaction_type_name']?.edit &&
      !permissionMap?.['interaction_type_name']?.read,
  },
  {
    id: 'response_source_name',
    sortId: 'response_source_name',
    label: 'Response Source',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['response_source_name']?.edit &&
      !permissionMap?.['response_source_name']?.read,
  },
  {
    id: 'created_user_name',
    sortId: 'created_user_name',
    label: 'Created By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['created_by']?.edit &&
      !permissionMap?.['created_by']?.read,
    render: (row: InteractionList) => row.created_user_name || '-',
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'updated_user_name',
    sortId: 'updated_user_name',
    label: 'Last Updated By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['modified_by']?.edit &&
      !permissionMap?.['modified_by']?.read,
    render: (row: InteractionList) => row.updated_user_name || '-',
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Last Updated Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['modified_datetime']?.edit &&
      !permissionMap?.['modified_datetime']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.modified_datetime),
  },
];

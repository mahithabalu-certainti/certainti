import { Switch, Tooltip } from '@mui/material';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionList } from '../../../../types';

export const getInteractionListColumns = (
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
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap: Record<string, { read: boolean; edit: boolean }>,
  handleToggleRecordStatus: (row: InteractionList, checked: boolean) => void,
  handleFourPartNavigation?: (row: InteractionList) => void
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
  {
    id: 'interaction_assessment_source_name',
    sortId: 'interaction_assessment_source_name',
    label: 'Assessment Type',
    width: 150,
    sortable: true,
    // hide:
    //   !projectPermissionMap?.['interaction_assessment_source_name']?.edit &&
    //   !projectPermissionMap?.['interaction_assessment_source_name']?.read,
  },
  {
    id: 'four_part_r_number',
    sortId: 'four_part_r_number',
    label: 'Four Part Assessment ID',
    width: 200,
    sortable: true,
    // hide:
    //   !projectPermissionMap?.['four_part_assessment_rid']?.edit &&
    //   !projectPermissionMap?.['four_part_assessment_rid']?.read,
    render: (row: InteractionList) =>
      row.four_part_assessment_rid &&
      row.four_part_r_number &&
      handleFourPartNavigation ? (
        <span
          onClick={() => handleFourPartNavigation(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.four_part_r_number}
        </span>
      ) : (
        <span>{row.four_part_r_number || '-'}</span>
      ),
  },
  {
    id: 'interaction_batch_id',
    sortId: 'interaction_batch_id',
    label: 'Batch ID',
    width: 140,
    sortable: true,
    // hide:
    //   !projectPermissionMap?.['interaction_batch_id']?.edit &&
    //   !projectPermissionMap?.['interaction_batch_id']?.read,
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 120,
    sortable: true,
    hide:
      !projectPermissionMap?.['project_code']?.edit &&
      !projectPermissionMap?.['project_code']?.read,
  },
  {
    id: 'interaction_level_name',
    sortId: 'interaction_level_name',
    label: 'Interaction Level',
    width: 140,
    sortable: true,
  },
  {
    id: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal year',
    width: 100,
    sortable: true,
    hide:
      !permissionMap?.['fiscal_year']?.edit &&
      !permissionMap?.['fiscal_year']?.read,
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
  {
    id: 'sent_on_datetime',
    sortId: 'sent_on_datetime',
    label: 'Last Sent Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['sent_on_datetime']?.edit &&
      !permissionMap?.['sent_on_datetime']?.read,
    render: (row: InteractionList) =>
      row.last_resent_on && formatDateToYYYYMMDDWithTime(row.last_resent_on),
  },
  {
    id: 'record_status',
    sortId: 'record_status',
    label: 'Record Status',
    width: 120,
    sortable: false,
    // hide:
    //   !permissionMap?.['record_status']?.edit &&
    //   !permissionMap?.['record_status']?.read,
    render: (row) => {
      // const canEditStatus = !!permissionMap?.['record_status']?.edit;
      const recordStatus = row.record_status?.toLowerCase() || 'inactive';
      return (
        <div className='text-center'>
          <Tooltip
            title={recordStatus === 'inactive' ? 'In Active' : 'Active'}
            arrow
            placement='top'
          >
            <Switch
              size='small'
              color={recordStatus === 'inactive' ? 'warning' : 'success'}
              onChange={(_e, checked) => handleToggleRecordStatus(row, checked)}
              checked={recordStatus === 'active'}
              // disabled={!canEditStatus}
            />
          </Tooltip>
        </div>
      );
    },
  },
];

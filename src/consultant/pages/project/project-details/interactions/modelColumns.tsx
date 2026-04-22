import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionList } from '../../../../types';

export const getProjectInteractionListModelColumns = (
  //   handleViewInteraction: (
  //     rid: string,
  //     rNumber: string,
  //     proFiscalRid: string
  //   ) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  fourPartPermissionMap: Record<string, { read: boolean; edit: boolean }>
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
  },
  {
    id: 'interaction_assessment_source_name',
    sortId: 'interaction_assessment_source_name',
    label: 'Assessment Type',
    width: 150,
    sortable: true,
    hide:
      !permissionMap?.['interaction_assessment_source_name']?.edit &&
      !permissionMap?.['interaction_assessment_source_name']?.read,
  },
  {
    id: 'four_part_r_number',
    sortId: 'four_part_r_number',
    label: 'Four Part Assessment ID',
    width: 200,
    sortable: true,
    hide:
      !fourPartPermissionMap?.['r_number']?.edit &&
      !fourPartPermissionMap?.['r_number']?.read,
  },
  {
    id: 'interaction_batch_id',
    sortId: 'interaction_batch_id',
    label: 'Batch ID',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['interaction_batch_id']?.edit &&
      !permissionMap?.['interaction_batch_id']?.read,
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
    hide:
      !permissionMap?.['recipient_email']?.edit &&
      !permissionMap?.['recipient_email']?.read,
    render: (row: InteractionList) => row.recipient_email || '-',
  },
  {
    id: 'last_resent_on',
    sortId: 'last_resent_on',
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
];

import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { EmailTemplateList } from '../../../../types';

export const getEmailTemplateColumns =
  () // permissionMap: Record<string, { read: boolean; edit: boolean }>,
  : ListTableColumn<EmailTemplateList>[] => [
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Template ID',
      width: 130,
      sortable: true,
      sticky: true,
      // hide:
      //   !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
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
      id: 'template_name',
      sortId: 'template_name',
      label: 'Template Name',
      width: 140,
      sortable: true,
      // hide:
      //   !permissionMap?.['template_name']?.read &&
      //   !permissionMap?.['template_name']?.edit,
    },
    {
      id: 'description',
      sortId: 'description',
      label: 'Description',
      width: 200,
      sortable: true,
      // hide:
      //   !permissionMap?.['description']?.read &&
      //   !permissionMap?.['description']?.edit,
    },
    {
      id: 'owner',
      sortId: 'owner',
      label: 'Owner',
      width: 140,
      sortable: true,
      // hide:
      //   !permissionMap?.['owner']?.read &&
      //   !permissionMap?.['owner']?.edit,
    },
    {
      id: 'status_name',
      sortId: 'status_rid',
      label: 'Status',
      width: 100,
      sortable: true,
      // hide:
      //   !permissionMap?.['status_rid']?.read &&
      //   !permissionMap?.['status_rid']?.edit,
    },
    {
      id: 'created_user_name',
      sortId: 'created_user_name',
      label: 'Created By',
      width: 160,
      sortable: true,
      // hide:
      //   !permissionMap?.['created_by']?.read &&
      //   !permissionMap?.['created_by']?.edit,
      render: (row) => row.created_user_name || '-',
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Created On',
      width: 190,
      sortable: true,
      // hide:
      //   !permissionMap?.['created_datetime']?.read &&
      //   !permissionMap?.['created_datetime']?.edit,
      render: (row) =>
        row.created_datetime &&
        formatDateToYYYYMMDDWithTime(row.created_datetime),
    },
    {
      id: 'modified_user_name',
      sortId: 'modified_user_name',
      label: 'Updated By',
      width: 160,
      sortable: true,
      // hide:
      //   !permissionMap?.['modified_by']?.read &&
      //   !permissionMap?.['modified_by']?.edit,
      render: (row) => row.modified_user_name || '-',
    },
    {
      id: 'modified_datetime',
      sortId: 'modified_datetime',
      label: 'Updated On',
      width: 190,
      sortable: true,
      // hide:
      //   !permissionMap?.['modified_datetime']?.read &&
      //   !permissionMap?.['modified_datetime']?.edit,
      render: (row) =>
        row.modified_datetime &&
        formatDateToYYYYMMDDWithTime(row.modified_datetime),
    },
  ];

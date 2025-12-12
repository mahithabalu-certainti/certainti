import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { EmailTemplateList } from '../../../../types';

export const getEmailTemplateColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  statusOptions: { label: string; value: string }[]
): ListTableColumn<EmailTemplateList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Template ID',
    width: 140,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
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
    editId: 'template_name',
    sortId: 'template_name',
    label: 'Template Name',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['email_template_name']?.read &&
      !permissionMap?.['email_template_name']?.edit,
    editable:
      permissionMap?.['email_template_name']?.read &&
      permissionMap?.['email_template_name']?.edit,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Task Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Template Name must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Template Name must not exceed 64 characters',
        },
        {
          regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
          errorMessage:
            "Template Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
        },
      ],
    },
  },
  {
    id: 'description',
    editId: 'description',
    sortId: 'description',
    label: 'Description',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['description']?.read &&
      !permissionMap?.['description']?.edit,
    editable:
      permissionMap?.['description']?.read &&
      permissionMap?.['description']?.edit,
    field: {
      type: 'textarea',
      required: false,
      placeholder: 'Enter Description',
      validation: [
        {
          regex: REGEX_PATTERNS.MAX_2000,
          errorMessage: 'Description must be within 2000 characters',
        },
      ],
    },
  },
  {
    id: 'category_name',
    sortId: 'category_rid',
    label: 'Category',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['category_rid']?.read &&
      !permissionMap?.['category_rid']?.edit,
  },
  {
    id: 'created_user_name',
    sortId: 'created_user_name',
    label: 'Created By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['created_by']?.read &&
      !permissionMap?.['created_by']?.edit,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 190,
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
    render: (row) =>
      row.created_datetime
        ? formatDateToYYYYMMDDWithTime(row.created_datetime)
        : '-',
  },
  {
    id: 'modified_user_name',
    sortId: 'modified_user_name',
    label: 'Updated By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['modified_by']?.read &&
      !permissionMap?.['modified_by']?.edit,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 190,
    sortable: true,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
  {
    id: 'status_name',
    editId: 'status_rid',
    sortId: 'status_rid',
    label: 'Status',
    width: 100,
    sortable: true,
    hide:
      !permissionMap?.['status_rid']?.read &&
      !permissionMap?.['status_rid']?.edit,
    editable:
      permissionMap?.['status_rid']?.read &&
      permissionMap?.['status_rid']?.edit,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: statusOptions,
    },
  },
];

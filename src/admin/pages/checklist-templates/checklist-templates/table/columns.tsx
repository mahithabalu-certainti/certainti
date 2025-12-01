import { DownloadIcon } from '../../../../../assets';
import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import {
  ListOption,
  ListTableColumn,
} from '../../../../../components/table/types';
import { ChecklistTemplateList } from '../../../../types';

export const getChecklistTemplateColumns = (
  handleDownload: (row: ChecklistTemplateList) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  statusOptions: ListOption[],
  isTemplateExportEnable?: boolean
): ListTableColumn<ChecklistTemplateList>[] => [
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Checklist ID',
      width: 160,
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
      id: 'checklist_name',
      editId: 'checklist_name',
      sortId: 'checklist_name',
      label: 'Checklist Name',
      width: 200,
      sortable: true,
      editable:
        permissionMap?.['checklist_name']?.read &&
        permissionMap?.['checklist_name']?.edit,
      hide:
        !permissionMap?.['checklist_name']?.read &&
        !permissionMap?.['checklist_name']?.edit,
      field: {
        type: 'text',
        required: true,
        placeholder: 'Enter Checklist Name',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_3,
            errorMessage: 'Checklist Name must be more than 2 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_64,
            errorMessage: 'Checklist Name must not exceed 64 characters',
          },
          {
            regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
            errorMessage:
              "Checklist Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
          },
        ],
      },
    },
    {
      id: 'checklist_description',
      editId: 'checklist_description',
      sortId: 'checklist_description',
      label: 'Description',
      width: 220,
      sortable: true,
      editable:
        permissionMap?.['checklist_description']?.read &&
        permissionMap?.['checklist_description']?.edit,
      hide:
        !permissionMap?.['checklist_description']?.read &&
        !permissionMap?.['checklist_description']?.edit,
      render: (row: ChecklistTemplateList) => row.checklist_description || '-',
      field: {
        type: 'text',
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
      id: 'created_user_name',
      sortId: 'created_user_name',
      label: 'Created By',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['created_by']?.read &&
        !permissionMap?.['created_by']?.edit,
      render: (row: ChecklistTemplateList) => row.created_user_name || '-',
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
      render: (row: ChecklistTemplateList) =>
        row.created_datetime &&
        formatDateToYYYYMMDDWithTime(row.created_datetime),
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
      render: (row: ChecklistTemplateList) => row.modified_user_name || '-',
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
      render: (row: ChecklistTemplateList) =>
        row.modified_datetime &&
        formatDateToYYYYMMDDWithTime(row.modified_datetime),
    },
    {
      id: 'status_name',
      editId: 'status_rid',
      sortId: 'status_rid',
      label: 'Status',
      width: 100,
      sortable: true,
      editable:
        permissionMap?.['status_rid']?.read &&
        permissionMap?.['status_rid']?.edit,
      hide:
        !permissionMap?.['status_rid']?.read &&
        !permissionMap?.['status_rid']?.edit,
      field: {
        type: 'select',
        required: true,
        placeholder: 'Choose Status',
        options: statusOptions,
      },
    },
    {
      id: 'download',
      sortId: 'download',
      label: 'Download',
      width: 80,
      hide: !isTemplateExportEnable,
      render: (row: ChecklistTemplateList) => (
        <button
          className='flex border border-[#CBD6E2] rounded-[2px] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
          onClick={() => handleDownload(row)}
        >
          <DownloadIcon alt='download-icon' className='h-4' />
        </button>
      ),
    },
  ];

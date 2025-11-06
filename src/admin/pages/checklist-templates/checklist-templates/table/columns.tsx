import { DownloadIcon } from '../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { ChecklistTemplateList } from '../../../../types';

export const getChecklistTemplateColumns = (
  handleDownload: (row: ChecklistTemplateList) => void
  // permissionMap: Record<string, { read: boolean; edit: boolean }>,
  // isTemplateExportEnable?: boolean
): ListTableColumn<ChecklistTemplateList>[] => [
  {
    id: 'rid',
    sortId: 'rid',
    label: 'Checklist ID',
    width: 330,
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
    id: 'checklist_name',
    sortId: 'checklist_name',
    label: 'Checklist Name',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['checklist_name']?.read &&
    //   !permissionMap?.['checklist_name']?.edit,
  },
  {
    id: 'checklist_level',
    sortId: 'checklist_level',
    label: 'Checklist Level',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['checklist_level']?.read &&
    //   !permissionMap?.['checklist_level']?.edit,
  },
  {
    id: 'checklist_type',
    sortId: 'checklist_type',
    label: 'Checklist Type',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['checklist_type']?.read &&
    //   !permissionMap?.['checklist_type']?.edit,
  },
  {
    id: 'checklist_description',
    sortId: 'checklist_description',
    label: 'Description',
    width: 220,
    sortable: true,
    // hide:
    //   !permissionMap?.['description']?.read &&
    //   !permissionMap?.['description']?.edit,
    render: (row: ChecklistTemplateList) => row.checklist_description || '-',
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
    render: (row: ChecklistTemplateList) => row.created_user_name || '-',
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
    // hide:
    //   !permissionMap?.['modified_by']?.read &&
    //   !permissionMap?.['modified_by']?.edit,
    render: (row: ChecklistTemplateList) => row.modified_user_name || '-',
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
    render: (row: ChecklistTemplateList) =>
      row.modified_datetime &&
      formatDateToYYYYMMDDWithTime(row.modified_datetime),
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
    id: 'download',
    sortId: 'download',
    label: 'Download',
    width: 80,
    // hide: !isTemplateExportEnable,
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

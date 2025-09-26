import { DownloadIcon } from '../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionTemplateList } from '../../../../types';

export const getInteractionTemplateColumns = (
  handleDownload: (row: InteractionTemplateList) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  isTemplateExportEnable?: boolean
): ListTableColumn<InteractionTemplateList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Template ID',
    width: 130,
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
    sortId: 'template_name',
    label: 'Template Name',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['template_name']?.read &&
      !permissionMap?.['template_name']?.edit,
  },
  {
    id: 'interaction_level_name',
    sortId: 'interaction_level_rid',
    label: 'Interaction Level',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['interaction_level_rid']?.read &&
      !permissionMap?.['interaction_level_rid']?.edit,
  },
  {
    id: 'interaction_type_name',
    sortId: 'interaction_type_rid',
    label: 'Interaction Type',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['interaction_type_rid']?.read &&
      !permissionMap?.['interaction_type_rid']?.edit,
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
    render: (row: InteractionTemplateList) => row.created_user_name || '-',
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
    render: (row: InteractionTemplateList) =>
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
    render: (row: InteractionTemplateList) => row.modified_user_name || '-',
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
    render: (row: InteractionTemplateList) =>
      row.modified_datetime &&
      formatDateToYYYYMMDDWithTime(row.modified_datetime),
  },
  {
    id: 'status_name',
    sortId: 'status_rid',
    label: 'Status',
    width: 100,
    sortable: true,
    hide:
      !permissionMap?.['status_rid']?.read &&
      !permissionMap?.['status_rid']?.edit,
  },
  {
    id: 'download',
    sortId: 'download',
    label: 'Download',
    width: 80,
    hide: !isTemplateExportEnable,
    render: (row: InteractionTemplateList) => (
      <button
        className='flex border border-[#CBD6E2] rounded-[2px] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
        onClick={() => handleDownload(row)}
      >
        <DownloadIcon alt='download-icon' className='h-4' />
      </button>
    ),
  },
];

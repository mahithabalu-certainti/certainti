import { DownloadIcon } from '../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { DataMapperListItem } from '../../../../types';

export const getDataMapperColumns = (
  handleDownload?: (documentUrl: string) => void
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<DataMapperListItem>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Form ID',
    width: 140,
    sortable: true,
    sticky: true,
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    // hide:
    //   !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
  {
    id: 'form_name',
    sortId: 'form_name',
    label: 'Name',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['form_name']?.read &&
    //   !permissionMap?.['form_name']?.edit,
  },
  {
    id: 'document_name',
    sortId: 'document_name',
    label: 'Document Name',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['document_name']?.read &&
    //   !permissionMap?.['document_name']?.edit,
  },
  {
    id: 'format',
    sortId: 'format',
    label: 'Format',
    width: 90,
    sortable: true,
    // hide: !permissionMap?.['format']?.read && !permissionMap?.['format']?.edit,
  },
  {
    id: 'size_in_mb',
    sortId: 'size_in_mb',
    label: 'Size',
    width: 100,
    sortable: true,
    // hide:
    //   !permissionMap?.['size_in_mb']?.read &&
    //   !permissionMap?.['size_in_mb']?.edit,
  },
  {
    id: 'country_name',
    sortId: 'country_name',
    label: 'Country',
    width: 140,
    sortable: true,
    // hide:
    //   !permissionMap?.['country_name']?.read &&
    //   !permissionMap?.['country_name']?.edit,
  },
  {
    id: 'state_name',
    sortId: 'state_name',
    label: 'Region',
    width: 140,
    sortable: true,
    // hide:
    //   !permissionMap?.['state_name']?.read &&
    //   !permissionMap?.['state_name']?.edit,
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 120,
    sortable: true,
    // hide:
    //   !permissionMap?.['status_name']?.read &&
    //   !permissionMap?.['status_name']?.edit,
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_by_name']?.read &&
    //   !permissionMap?.['created_by_name']?.edit,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    // hide:
    //   !permissionMap?.['created_datetime']?.read &&
    //   !permissionMap?.['created_datetime']?.edit,
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Updated By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['modified_by_name']?.read &&
    //   !permissionMap?.['modified_by_name']?.edit,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 200,
    sortable: true,
    render: (row) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
    // hide:
    //   !permissionMap?.['modified_datetime']?.read &&
    //   !permissionMap?.['modified_datetime']?.edit,
  },
  {
    id: 'attachment',
    sortId: 'attachment',
    label: 'Attachment',
    width: 90,
    hide: false,
    render: (row) =>
      row?.browse_file ? (
        <button
          className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
          onClick={() => handleDownload?.(row.browse_file)}
        >
          <DownloadIcon alt='download-icon' className='h-4' />
        </button>
      ) : (
        <div className='text-center'>-</div>
      ),
  },
];

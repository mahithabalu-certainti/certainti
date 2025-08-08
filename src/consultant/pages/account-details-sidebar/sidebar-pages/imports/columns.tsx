import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import TextButton from '../../../../../components/button/text-button';
import { ListTableColumn } from '../../../../../components/table/types';
import { ImportsList } from '../../../../types/imports';

export const getImportsListColumns = (
  handleDocument: (rowId: string) => void,
  handleDownload: (documentUrl: string) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  isImportExportEnable?: boolean
): ListTableColumn<ImportsList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Import ID',
    width: 140,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ImportsList) => (
      <span
        onClick={() => handleDocument(row.rid)}
        className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
      >
        {row.r_number}
      </span>
    ),
  },
  {
    id: 'file_name',
    sortId: 'file_name',
    label: 'File Name',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['file_name']?.edit &&
      !permissionMap?.['file_name']?.read,
  },
  {
    id: 'format',
    sortId: 'format',
    label: 'Format',
    width: 140,
    sortable: true,
    hide: !permissionMap?.['format']?.edit && !permissionMap?.['format']?.read,
  },
  {
    id: 'size',
    sortId: 'size',
    label: 'Size',
    width: 140,
    sortable: true,
    hide: !permissionMap?.['size']?.edit && !permissionMap?.['size']?.read,
  },
  {
    id: 'fiscal',
    editId: 'fiscal_year',
    sortId: 'fiscal',
    label: 'Fiscal Year',
    width: 140,
    sortable: true,
    hide: !permissionMap?.['fiscal']?.edit && !permissionMap?.['fiscal']?.read,
    render: (row: ImportsList) => row.fiscal && `FY-${row.fiscal}`,
  },
  {
    id: 'entity',
    sortId: 'entity',
    label: 'Entity',
    width: 160,
    sortable: true,
    hide: !permissionMap?.['entity']?.edit && !permissionMap?.['entity']?.read,
  },
  {
    id: 'total_records',
    sortId: 'total_records',
    label: 'Total Records',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['total_records']?.edit &&
      !permissionMap?.['total_records']?.read,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'records_loaded_successfully',
    sortId: 'records_loaded_successfully',
    label: 'Records Loaded Successfully',
    width: 220,
    sortable: true,
    hide:
      !permissionMap?.['records_loaded_successfully']?.edit &&
      !permissionMap?.['records_loaded_successfully']?.read,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'records_with_warning',
    sortId: 'records_with_warning',
    label: 'Records with Warning',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['records_with_warning']?.edit &&
      !permissionMap?.['records_with_warning']?.read,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'records_failed_to_load',
    sortId: 'records_failed_to_load',
    label: 'Records Failed to Load',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['records_failed_to_load']?.edit &&
      !permissionMap?.['records_failed_to_load']?.read,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'status',
    sortId: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    hide: !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
  },
  {
    id: 'status_descriptions',
    sortId: 'status_descriptions',
    label: 'Status Description',
    width: 240,
    sortable: true,
    hide:
      !permissionMap?.['status_descriptions']?.edit &&
      !permissionMap?.['status_descriptions']?.read,
  },
  // {
  //   id: 'import_type',
  //   sortId: 'import_type',
  //   label: 'Import Type',
  //   width: 160,
  //   sortable: true,
  // },
  {
    id: 'imported_by',
    sortId: 'imported_by',
    label: 'Imported By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['imported_by']?.edit &&
      !permissionMap?.['imported_by']?.read,
  },
  {
    id: 'imported_on',
    sortId: 'imported_on',
    label: 'Imported On',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['imported_on']?.edit &&
      !permissionMap?.['imported_on']?.read,
    render: (row: ImportsList) => formatDateToYYYYMMDDWithTime(row.imported_on),
  },
  {
    id: 'download',
    sortId: 'download',
    label: 'Download',
    width: 110,
    hide: !isImportExportEnable,
    render: (row: ImportsList) => (
      <TextButton
        label='Download'
        sx={{ width: '80px', minWidth: '80px', maxWidth: '80px', ml: 1 }}
        onClick={() => handleDownload(row.document_url)}
      />
    ),
  },
];

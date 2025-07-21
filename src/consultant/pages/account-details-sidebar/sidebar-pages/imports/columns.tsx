import { ImportsIcon } from '../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { SelectOption } from '../../../../types';
import { ImportsList } from '../../../../types/imports';

export const getImportsListColumns = (
  handleDocument: (rowId: string) => void,
  handleDownload: (rowId: string) => void,
  fiscalYears: SelectOption[]
): ListTableColumn<ImportsList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Import ID',
    width: 140,
    sortable: true,
    sticky: true,
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
  },
  {
    id: 'format',
    sortId: 'format',
    label: 'Format',
    width: 140,
    sortable: true,
  },
  {
    id: 'size',
    sortId: 'size',
    label: 'Size',
    width: 140,
    sortable: true,
  },
  {
    id: 'fiscal',
    editId: 'fiscal_year',
    sortId: 'fiscal',
    label: 'Fiscal Year',
    width: 140,
    sortable: true,
    editable: true,
    render: (row: ImportsList) => row.fiscal && `FY-${row.fiscal}`,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: fiscalYears,
    },
  },
  {
    id: 'entity',
    sortId: 'entity',
    label: 'Entity',
    width: 160,
    sortable: true,
  },
  {
    id: 'total_records',
    sortId: 'total_records',
    label: 'Total Records',
    width: 160,
    sortable: true,
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
  },
  // {
  //   id: 'status_description',
  //   sortId: 'status_description',
  //   label: 'Status Description',
  //   width: 240,
  //   sortable: true,
  // },
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
  },
  {
    id: 'imported_on',
    sortId: 'imported_on',
    label: 'Imported On',
    width: 200,
    sortable: true,
    render: (row: ImportsList) => formatDateToYYYYMMDDWithTime(row.imported_on),
  },
  {
    id: 'download',
    sortId: 'download',
    label: 'Download',
    width: 110,
    render: (row: ImportsList) => (
      <button
        style={{
          border: '1px solid #CBD6E2',
          boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
        }}
        className=' px-1 ml-0.5 py-[1px] rounded-[2px] flex gap-1 items-center cursor-pointer'
        onClick={() => handleDownload(row.rid)}
      >
        <ImportsIcon className='w-3.5 h-3' />
        <span className='text-[#2D3E4F]'>Download</span>
      </button>
    ),
  },
];

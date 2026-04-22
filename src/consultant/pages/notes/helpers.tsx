import { DownloadIcon } from '../../../assets';
import {
  formatDateToYYYYMMDDWithTime,
  getCapitalizeWords,
  getFiscalYears,
  REGEX_PATTERNS,
} from '../../../common-utils';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../components/table/types';
import { NotesList } from '../../types';
import { FieldConfig } from '../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const nonReqTextfieldOptions: { option: string; value: string }[] = [
  { option: 'Contains', value: 'contains' },
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Is Empty', value: 'is_empty' },
];

const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
];

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const getNotesFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  userListOptions: { value: string; label: string }[],
  module?: 'account' | 'project' | 'case' | 'resource'
): FieldConfig[] => {
  const hideFiscalYear = module === 'case' || module === 'project';

  return [
    {
      name: 'Note ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Title',
      value: 'title',
      type: 'text',
      operatorOption: textOptions,
      hide: !permissionMap?.['title']?.edit && !permissionMap?.['title']?.read,
    },
    {
      name: 'Note Owner',
      value: 'notes_owner',
      type: 'enum',
      options: userListOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['notes_owner']?.edit &&
        !permissionMap?.['notes_owner']?.read,
    },
    {
      name: 'Related Entity',
      value: 'attachment_level',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['attachment_level']?.edit &&
        !permissionMap?.['attachment_level']?.read,
    },
    {
      name: 'Related To ID',
      value: 'attach_to',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['attach_to']?.edit &&
        !permissionMap?.['attach_to']?.read,
    },
    {
      name: 'Related To Name',
      value: 'attached_to',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['attached_to']?.edit &&
        !permissionMap?.['attached_to']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOptions,
      hide:
        hideFiscalYear ||
        (!permissionMap?.['fiscal_year']?.edit &&
          !permissionMap?.['fiscal_year']?.read),
    },
    {
      name: 'Document Name',
      value: 'document_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['document_name']?.edit &&
        !permissionMap?.['document_name']?.read,
    },
    {
      name: 'Format',
      value: 'format',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['format']?.edit && !permissionMap?.['format']?.read,
    },
    {
      name: 'Size',
      value: 'size_in_mb',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['size_in_mb']?.edit &&
        !permissionMap?.['size_in_mb']?.read,
    },
    {
      name: 'Created By',
      value: 'created_by_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['created_by_name']?.edit &&
        !permissionMap?.['created_by_name']?.read,
    },
    {
      name: 'Created On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Modified By',
      value: 'modified_by_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
      hide:
        !permissionMap?.['modified_by_name']?.edit &&
        !permissionMap?.['modified_by_name']?.read,
    },
    {
      name: 'Modified On',
      value: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['modified_datetime']?.edit &&
        !permissionMap?.['modified_datetime']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    },
  ];
};

export const getNotesTableColumns = (
  inActiveEntity?: boolean,
  handleNoteView?: (rowId: string) => void,
  handleDownload?: (documentUrl: string) => void,
  isNotesExportEnable?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  userListOptions?: { value: string; label: string }[],
  handleViewGlobalNoteDetails?: (row: NotesList) => void,
  isFromGlobal?: boolean,
  module?: 'account' | 'project' | 'case' | 'resource'
): ListTableColumn<NotesList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Note ID',
    width: 140,
    sortable: true,
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    render: (row) =>
      handleNoteView ? (
        <span
          onClick={() => handleNoteView(row.rid)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : handleViewGlobalNoteDetails ? (
        <span
          onClick={() => handleViewGlobalNoteDetails(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'title',
    sortId: 'title',
    editId: 'title',
    label: 'Title',
    width: 220,
    sortable: true,
    editable:
      permissionMap?.['title']?.edit &&
      permissionMap?.['title']?.read &&
      !inActiveEntity,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Title',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Title must be at least 3 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Title must not exceed 64 characters',
        },
        {
          regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
          errorMessage:
            "Title must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
        },
      ],
    },
    ...(isFromGlobal
      ? { conditionallyEdit: [{ key: 'status_name', matchValue: ['Active'] }] }
      : {}),
    hide: !permissionMap?.['title']?.edit && !permissionMap?.['title']?.read,
  },
  {
    id: 'notes_owner_name',
    sortId: 'notes_owner_name',
    editId: 'notes_owner',
    label: 'Note Owner',
    width: 180,
    sortable: true,
    editable:
      !isFromGlobal &&
      permissionMap?.['notes_owner']?.edit &&
      permissionMap?.['notes_owner']?.read &&
      !inActiveEntity,
    field: {
      type: 'select',
      options: userListOptions || [],
      required: true,
      placeholder: 'Choose Note Owner',
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData?.notes_owner || '');
      },
    },
    ...(isFromGlobal
      ? { conditionallyEdit: [{ key: 'status_name', matchValue: ['Active'] }] }
      : {}),
    hide:
      !permissionMap?.['notes_owner']?.edit &&
      !permissionMap?.['notes_owner']?.read,
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
    render: (row) => getCapitalizeWords(row.attachment_level || ''),
  },
  {
    id: 'attach_to',
    sortId: 'attach_to',
    label: 'Related To ID',
    width: 200,
    sortable: false,
    hide:
      !permissionMap?.['attach_to']?.edit &&
      !permissionMap?.['attach_to']?.read,
  },
  {
    id: 'attached_to',
    sortId: 'attached_to',
    label: 'Related To Name',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal Year',
    width: 110,
    sortable: module !== 'case' && module !== 'project',
    editable:
      permissionMap?.['fiscal_year']?.edit &&
      permissionMap?.['fiscal_year']?.read &&
      !inActiveEntity,
    conditionallyEdit: [
      {
        key: 'attachment_level',
        matchValue: ['account', 'resource', 'resource_cost', 'resource_skill'],
      },
      ...(isFromGlobal
        ? [{ key: 'status_name' as keyof NotesList, matchValue: ['Active'] }]
        : []),
    ],
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: fiscalYears,
    },
    render: (row) => `FY-${row.fiscal_year}`,
    hide:
      module === 'case' ||
      (!permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read),
  },
  {
    id: 'document_name',
    sortId: 'document_name',
    label: 'Document Name',
    width: 160,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['document_name']?.edit &&
      !permissionMap?.['document_name']?.read,
  },
  {
    id: 'format',
    sortId: 'format',
    label: 'Format',
    width: 85,
    sortable: true,
    hide: !permissionMap?.['format']?.edit && !permissionMap?.['format']?.read,
  },
  {
    id: 'size_in_mb',
    sortId: 'size_in_mb',
    label: 'Size',
    width: 80,
    sortable: true,
    hide:
      !permissionMap?.['size_in_mb']?.edit &&
      !permissionMap?.['size_in_mb']?.read,
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['created_by_name']?.edit &&
      !permissionMap?.['created_by_name']?.read,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Modified By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['modified_by_name']?.edit &&
      !permissionMap?.['modified_by_name']?.read,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Modified On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.modified_datetime),
    hide:
      !permissionMap?.['modified_datetime']?.edit &&
      !permissionMap?.['modified_datetime']?.read,
  },
  {
    id: 'attachment',
    sortId: 'attachment',
    label: 'Attachment',
    width: 90,
    hide: !isNotesExportEnable,
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

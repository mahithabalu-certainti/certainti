import { DownloadIcon } from '../../../assets';
import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../common-utils';
import { ListTableColumn } from '../../../components/table/types';
import { NotesList } from '../../types';
import { FieldConfig } from '../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

// const enumOptions: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'In', value: 'in' },
// ];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getNotesFilterFields =
  () // permissionMap?: Record<string, { read: boolean; edit: boolean }>
  : FieldConfig[] => {
    return [
      {
        name: 'Note ID',
        value: 'r_number',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Title',
        value: 'title',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Note Owner',
        value: 'notes_owner',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Related To',
        value: 'attachment_level',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Created By',
        value: 'created_by',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Created On',
        value: 'created_on',
        type: 'date',
        operatorOption: dateOptions,
      },
      {
        name: 'Modified By',
        value: 'modified_by',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Modified On',
        value: 'modified_on',
        type: 'date',
        operatorOption: dateOptions,
      },
      {
        name: 'Sort Options',
        value: 'sort_options',
        type: 'system-sort',
        options: [
          { value: 'created_on_desc', option: 'Recently Created' },
          { value: 'modified_on_desc', option: 'Recently Modified' },
        ],
      },
    ];
  };

export const getNotesTableColumns = (
  handleNoteView?: (rowId: string) => void,
  handleDownload?: (documentUrl: string) => void
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
    render: (row) =>
      handleNoteView ? (
        <span
          onClick={() => handleNoteView(row.rid)}
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
    label: 'Title',
    width: 220,
    sortable: true,
    editable: true,
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
  },
  {
    id: 'notes_owner',
    sortId: 'notes_owner',
    label: 'Note Owner',
    width: 180,
    sortable: true,
    editable: true,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Note Owner',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Note Owner must be at least 3 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Note Owner must not exceed 64 characters',
        },
        {
          regex: REGEX_PATTERNS.NAME_REGEX,
          errorMessage:
            "Note Owner must contain only letters, space( ), apostrophes(') and hyphens(-).",
        },
      ],
    },
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related To',
    width: 160,
    sortable: true,
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Modified By',
    width: 180,
    sortable: true,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Modified On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.modified_datetime),
  },
  {
    id: 'download',
    sortId: 'download',
    label: 'Download',
    width: 80,
    hide: false,
    render: (row) => (
      <button
        className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
        onClick={() => handleDownload?.(row.browse_file)}
      >
        <DownloadIcon alt='download-icon' className='h-4' />
      </button>
    ),
  },
];

import { formatDateToYYYYMMDDWithTime } from '../../../common-utils';
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
        name: 'Title',
        value: 'title',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Note Owner',
        value: 'note_owner',
        type: 'text',
        operatorOption: textOptions,
      },
      {
        name: 'Related To',
        value: 'related_to',
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
        name: 'Note ID',
        value: 'id',
        type: 'text',
        operatorOption: textOptions,
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
  handleNoteView?: (rowId: string) => void
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
  },
  {
    id: 'note_owner',
    sortId: 'note_owner',
    label: 'Note Owner',
    width: 180,
    sortable: true,
  },
  {
    id: 'related_to',
    sortId: 'related_to',
    label: 'Related To',
    width: 200,
    sortable: true,
  },
  {
    id: 'created_by',
    sortId: 'created_by',
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
    id: 'modified_by',
    sortId: 'modified_by',
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
];

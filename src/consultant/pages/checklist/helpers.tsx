import {
  formatDateToYYYYMMDDWithTime,
  getFiscalYears,
  REGEX_PATTERNS,
} from '../../../common-utils';
import { ListTableColumn } from '../../../components/table/types';
import { ChecklistList } from '../../types';
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

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const getChecklistFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Checklist ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
  {
    name: 'Checklist Name',
    value: 'checklist_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['checklist_name']?.read &&
      !permissionMap?.['checklist_name']?.edit,
  },
  {
    name: 'Related Entity',
    value: 'attachment_level',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attachment_level']?.read &&
      !permissionMap?.['attachment_level']?.edit,
  },
  {
    name: 'Related To ID',
    value: 'attach_to',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attach_to']?.read &&
      !permissionMap?.['attach_to']?.edit,
  },
  {
    name: 'Related To Name',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attached_to']?.read &&
      !permissionMap?.['attached_to']?.edit,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
    operatorOption: enumOptions,
    hide:
      !permissionMap?.['fiscal_year']?.read &&
      !permissionMap?.['fiscal_year']?.edit,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['created_by_name']?.read &&
      !permissionMap?.['created_by_name']?.edit,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
  },
  {
    name: 'Updated By',
    value: 'modified_by_name',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
    hide:
      !permissionMap?.['modified_by_name']?.read &&
      !permissionMap?.['modified_by_name']?.edit,
  },
  {
    name: 'Updated On',
    value: 'modified_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
  },
];

export const getChecklistTableColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  inActiveEntity: boolean,
  handleChecklistView?: (rowId: string) => void
): ListTableColumn<ChecklistList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Checklist ID',
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
      handleChecklistView ? (
        <span
          onClick={() => handleChecklistView(row.rid)}
          className='cursor-pointer text-[#1755E7] underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
  {
    id: 'checklist_name',
    editId: 'checklist_name',
    sortId: 'checklist_name',
    label: 'Checklist Name',
    width: 220,
    sortable: true,
    editable:
      !inActiveEntity &&
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
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['attachment_level']?.read &&
      !permissionMap?.['attachment_level']?.edit,
  },
  {
    id: 'attach_to',
    sortId: 'attach_to',
    label: 'Related To ID',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['attach_to']?.read &&
      !permissionMap?.['attach_to']?.edit,
  },
  {
    id: 'attached_to',
    sortId: 'attached_to',
    label: 'Related To Name',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['attached_to']?.read &&
      !permissionMap?.['attached_to']?.edit,
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal Year',
    width: 120,
    sortable: true,
    render: (row) => (row.fiscal_year ? `FY-${row.fiscal_year}` : '-'),
    hide:
      !permissionMap?.['fiscal_year']?.read &&
      !permissionMap?.['fiscal_year']?.edit,
    editable:
      permissionMap?.['fiscal_year']?.edit &&
      permissionMap?.['fiscal_year']?.read &&
      !inActiveEntity,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: fiscalYears,
    },
    conditionallyEdit: [
      {
        key: 'attachment_level',
        matchValue: ['account', 'resource', 'resource_cost', 'resource_skill'],
      },
    ],
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['created_by_name']?.read &&
      !permissionMap?.['created_by_name']?.edit,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Updated By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['modified_by_name']?.read &&
      !permissionMap?.['modified_by_name']?.edit,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.modified_datetime),
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
  },
];

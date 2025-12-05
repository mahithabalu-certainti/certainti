import { DownloadIcon } from '../../assets';
import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../common-utils';
import { FieldConfig } from '../../consultant/pages/account-details-sidebar/components/filter/filterType';
import { OthersEnum, SelectOption } from '../../consultant/types';
import { AttachmentList } from '../../consultant/types/attachment';
import { DependencyRowData, ListTableColumn } from '../table/types';

export interface FieldOptionType {
  fiscalYears: SelectOption[];
  docCategories: SelectOption[];
  docTypes: SelectOption[];
  docTypesLoading?: boolean;
}

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
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

export const getAttachmentsFilterFields = (
  fieldOptions?: FieldOptionType,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  module?: 'account' | 'project' | 'case' | 'resource'
): FieldConfig[] => {
  const {
    fiscalYears = [],
    docCategories = [],
    docTypes = [],
  } = fieldOptions || {};
  const hideFiscalYear = module === 'case' || module === 'project';
  return [
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
      name: 'Document Category',
      value: 'document_category_rid',
      type: 'enum',
      options: docCategories.map((c) => ({ option: c.label, value: c.value })),
      operatorOption: enumOptions,
      onChange: true,
      hide:
        !permissionMap?.['document_category_rid']?.edit &&
        !permissionMap?.['document_category_rid']?.read,
    },
    {
      name: 'Document Type',
      value: 'document_type_rid',
      type: 'enum',
      options: docTypes.map((t) => ({ option: t.label, value: t.value })),
      operatorOption: enumOptions,
      dependsOn: 'document_category_rid',
      hide:
        !permissionMap?.['document_type_rid']?.edit &&
        !permissionMap?.['document_type_rid']?.read,
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
      name: 'Attached By',
      value: 'uploaded_by',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['uploaded_by']?.edit &&
        !permissionMap?.['uploaded_by']?.read,
    },
    {
      name: 'Attached On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Attachment ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    },
  ];
};

export const getAttachmentTableColumns = (
  fiscalYears: SelectOption[],
  docCategories: SelectOption[],
  docTypes: SelectOption[],
  handleDocumentCategory: (rid: string) => void,
  handleDownload: (documentUrl: string) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  isAttachmentExportEnable?: boolean,
  typeLoading?: boolean,
  accountOrProjectInActive?: boolean,
  isFromGlobal?: boolean,
  module?: 'account' | 'project' | 'case' | 'resource'
): ListTableColumn<AttachmentList>[] => [
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
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
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
    id: 'size_in_mb',
    sortId: 'size_in_mb',
    label: 'Size',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['size_in_mb']?.edit &&
      !permissionMap?.['size_in_mb']?.read,
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal Year',
    width: 140,
    sortable: module !== 'case' && module !== 'project',
    editable:
      permissionMap?.['fiscal_year']?.edit &&
      permissionMap?.['fiscal_year']?.read &&
      !accountOrProjectInActive,
    hide:
      module === 'case' ||
      (!permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read),
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: fiscalYears,
    },
    render: (row: AttachmentList) => `FY-${row.fiscal_year}`,
    conditionallyEdit: [
      {
        key: 'attachment_level',
        matchValue: ['account', 'resource', 'resource_cost', 'resource_skill'],
      },
      ...(isFromGlobal
        ? [
            {
              key: 'status_name' as keyof AttachmentList,
              matchValue: ['Active'],
            },
          ]
        : []),
    ],
  },
  {
    id: 'document_category',
    editId: 'document_category_rid',
    sortId: 'document_category',
    label: 'Document Category',
    width: 250,
    sortable: true,
    editable:
      permissionMap?.['document_category_rid']?.edit &&
      permissionMap?.['document_category_rid']?.read &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['document_category_rid']?.edit &&
      !permissionMap?.['document_category_rid']?.read,
    ...(isFromGlobal
      ? { conditionallyEdit: [{ key: 'status_name', matchValue: ['Active'] }] }
      : {}),
    render: (row: AttachmentList) =>
      row.document_category_others
        ? `${row.document_category} - ${row.document_category_others}`
        : row.document_category,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: docCategories,
      onChange: true,
      resetDependentFields: ['document_type'],
      getFieldData: (rowData: DependencyRowData) => {
        handleDocumentCategory(String(rowData.document_category_rid || ''));
        return String(rowData.document_category_rid || '');
      },
      dependencies: [
        {
          dependsOn: 'document_type',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
        {
          dependsOn: ['document_category', 'document_type'],
          condition: (value, rowData) => {
            const docType = rowData.document_type;
            const docCategory = value;
            const bothFieldsHaveValues =
              docCategory && docCategory !== '' && docType && docType !== '';

            if (!bothFieldsHaveValues) {
              return false;
            }

            const categoryFound = docCategories.find(
              (opt) => String(opt.value) === String(docCategory)
            );
            const typeFound = docTypes.find(
              (opt) => String(opt.value) === String(docType)
            );

            // Show modal if either is "Others"
            const shouldShowModal =
              categoryFound?.label.toLowerCase() === OthersEnum.Others ||
              typeFound?.label.toLowerCase() === OthersEnum.Others;
            return shouldShowModal;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'document_category_others',
              editId: 'document_category_others',
              label: 'Document Category-others',
              type: 'text',
              required: true,
              placeholder: 'Enter Document Category-others',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage:
                    'Document Category-others must be more than 2 characters long',
                },
                {
                  regex: REGEX_PATTERNS.MAX_255,
                  errorMessage: 'Max length exceeded',
                },
                {
                  regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                  errorMessage:
                    "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
                },
              ],
            },
            {
              id: 'document_type_others',
              editId: 'document_type_others',
              label: 'Document Type-others',
              type: 'text',
              required: true,
              placeholder: 'Enter Document Type-others',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage:
                    'Document Type-others must be more than 2 characters long',
                },
                {
                  regex: REGEX_PATTERNS.MAX_255,
                  errorMessage: 'Max length exceeded',
                },
                {
                  regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                  errorMessage:
                    "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'document_type',
    editId: 'document_type_rid',
    sortId: 'document_type',
    label: 'Document Type',
    width: 300,
    sortable: true,
    editable:
      permissionMap?.['document_type_rid']?.edit &&
      permissionMap?.['document_type_rid']?.read &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['document_type_rid']?.edit &&
      !permissionMap?.['document_type_rid']?.read,
    ...(isFromGlobal
      ? { conditionallyEdit: [{ key: 'status_name', matchValue: ['Active'] }] }
      : {}),
    render: (row: AttachmentList) =>
      row.document_type_others
        ? `${row.document_type} - ${row.document_type_others}`
        : row.document_type,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Document Type',
      loading: typeLoading,
      options: docTypes,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.document_type_rid || '');
      },
      dependencies: [
        {
          dependsOn: 'document_category',
          condition: (value) => !value,
          action: 'disabled',
          message: '',
        },
        {
          dependsOn: ['document_category', 'document_type'],
          condition: (value, rowData) => {
            const docCategory = rowData.document_category;
            const docType = value;
            const bothFieldsHaveValues =
              docCategory && docCategory !== '' && docType && docType !== '';

            if (!bothFieldsHaveValues) {
              return false;
            }

            const categoryFound = docCategories.find(
              (opt) => String(opt.value) === String(docCategory)
            );
            const typeFound = docTypes.find(
              (opt) => String(opt.value) === String(docType)
            );

            const directlyShowModal =
              String(docCategory).toLowerCase() === OthersEnum.Others ||
              String(docType).toLowerCase() === OthersEnum.Others;

            // Show modal if either is "Others"
            const shouldShowModal =
              categoryFound?.label.toLowerCase() === OthersEnum.Others ||
              typeFound?.label.toLowerCase() === OthersEnum.Others;
            return shouldShowModal || directlyShowModal;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'document_category_others',
              editId: 'document_category_others',
              label: 'Document Category-others',
              type: 'text',
              required: true,
              placeholder: 'Enter Document Category-others',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage:
                    'Document Category-others must be more than 2 characters long',
                },
                {
                  regex: REGEX_PATTERNS.MAX_255,
                  errorMessage: 'Max length exceeded',
                },
                {
                  regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                  errorMessage:
                    "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
                },
              ],
            },
            {
              id: 'document_type_others',
              editId: 'document_type_others',
              label: 'Document Type-others',
              type: 'text',
              required: true,
              placeholder: 'Enter Document Type-others',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage:
                    'Document Type-others must be more than 2 characters long',
                },
                {
                  regex: REGEX_PATTERNS.MAX_255,
                  errorMessage: 'Max length exceeded',
                },
                {
                  regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                  errorMessage:
                    "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
                },
              ],
            },
          ],
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
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
  },
  {
    id: 'attach_to',
    sortId: 'attach_to',
    label: 'Related To ID',
    width: 180,
    sortable: true,
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
    id: 'uploaded_by',
    sortId: 'uploaded_by',
    label: 'Attached By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['uploaded_by']?.edit &&
      !permissionMap?.['uploaded_by']?.read,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Attached On',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
    render: (row: AttachmentList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Attachment ID',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    id: 'download',
    sortId: 'download',
    label: 'Download',
    width: 80,
    hide: !isAttachmentExportEnable,
    render: (row: AttachmentList) => (
      <button
        className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
        onClick={() => handleDownload(row.browse_file)}
      >
        <DownloadIcon alt='download-icon' className='h-4' />
      </button>
    ),
  },
];

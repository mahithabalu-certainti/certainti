import { REGEX_PATTERNS, RESOURCE_REGEX } from '../../../../../common-utils';
import {
  DependencyRowData,
  ListOption,
  ListTableColumn,
} from '../../../../../components/table/types';
import { ResourceList } from '../../../../types/resource';
import { ResourceTypeEnum } from '../../../resource-form/utils';

export const getResourceColumns = (
  statusOptions: ListOption[],
  resourceTypeOptions: ListOption[],
  countryOptions: ListOption[],
  regionOptions: ListOption[],
  onCountryClick: (country: string) => void,
  regionLoading: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  onResourceIdClick?: (row: ResourceList) => void,
  accountInActive?: boolean
): ListTableColumn<ResourceList>[] => [
  {
    id: 'resource_code',
    editId: 'resource_code',
    sortId: 'resource_code',
    label: 'Resource Code',
    width: 150,
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
    render: (row: ResourceList) =>
      onResourceIdClick ? (
        <span
          onClick={() => onResourceIdClick(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.resource_code}
        </span>
      ) : (
        row.resource_code
      ),
    editable:
      permissionMap?.['resource_code']?.edit &&
      permissionMap?.['resource_code']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_code']?.edit &&
      !permissionMap?.['resource_code']?.read,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Resource Code',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Please enter more than 2 characters.',
        },
        {
          regex: REGEX_PATTERNS.MAX_50,
          errorMessage: 'Max length exceeded',
        },
        {
          regex: REGEX_PATTERNS.NO_LEADING_SPECIAL_REGEX,
          errorMessage: 'Cannot start with a number, hyphen, or underscore.',
        },
        {
          regex: REGEX_PATTERNS.ALLOWED_CHARS_REGEX,
          errorMessage:
            'Only letters, numbers, hyphens, and underscores are allowed.',
        },
      ],
    },
  },
  {
    id: 'resource_name',
    editId: 'resource_name',
    sortId: 'resource_name',
    label: 'Name',
    width: 200,
    sortable: true,
    editable:
      permissionMap?.['resource_name']?.edit &&
      permissionMap?.['resource_name']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_name']?.edit &&
      !permissionMap?.['resource_name']?.read,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_2,
          errorMessage: 'Please enter more than 1 characters.',
        },
        {
          regex: REGEX_PATTERNS.CONSECUTIVE_SPECIAL_CHARS,
          errorMessage:
            'Consecutive spaces, hyphens, and apostrophes are not allowed.',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Max length exceeded.',
        },
        {
          regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
          errorMessage:
            'Name cannot start or end with a space, apostrophe, or hyphen.',
        },
        {
          regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
          errorMessage:
            'Only letters, spaces, apostrophes, and hyphens are allowed.',
        },
      ],
    },
  },
  {
    id: 'resource_type_name',
    editId: 'resource_type_rid',
    sortId: 'resource_type_rid',
    label: 'Resource Type',
    width: 140,
    sortable: true,
    editable:
      permissionMap?.['resource_type_rid']?.edit &&
      permissionMap?.['resource_type_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_type_rid']?.edit &&
      !permissionMap?.['resource_type_rid']?.read,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: resourceTypeOptions,
      resetDependentFields: ['resource_orgname'],
      dependencies: [
        {
          dependsOn: ['resource_orgname'],
          action: 'enable',
          condition: (value) => !value,
          message: '',
        },
      ],
    },
  },
  {
    id: 'resource_orgname',
    editId: 'resource_orgname',
    sortId: 'resource_orgname',
    label: 'Org Name',
    width: 160,
    sortable: true,
    editable:
      permissionMap?.['resource_orgname']?.edit &&
      permissionMap?.['resource_orgname']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_orgname']?.edit &&
      !permissionMap?.['resource_orgname']?.read,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Org Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Please enter more than 2 characters.',
        },
        {
          regex: REGEX_PATTERNS.MAX_100,
          errorMessage: 'Max length exceeded.',
        },
        {
          regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
          errorMessage:
            "Only letters, numbers, spaces, ampersands (&), hyphens (-), periods (.), apostrophes (') and commas (,) are allowed.",
        },
        {
          regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
          errorMessage: 'Cannot start or end with a space or special character',
        },
      ],
      dependencies: [
        {
          dependsOn: 'resource_type_name',
          condition: (value) => {
            const found = resourceTypeOptions.find(
              (opt) => String(opt.value) === String(value)
            );
            return found?.label.toLowerCase() === ResourceTypeEnum.FULL_TIME;
          },
          action: 'disabled',
          message:
            'Organization name is not applicable for Full-Time resources',
        },
        {
          dependsOn: 'resource_type_name',
          condition: (value) => {
            const found = resourceTypeOptions.find(
              (opt) => String(opt.value) === String(value)
            );
            return found?.label.toLowerCase() !== ResourceTypeEnum.FULL_TIME;
          },
          action: 'required',
          message:
            'Organization name is required for Non-Labor and Sub-con resources',
        },
      ],
    },
  },
  {
    id: 'resource_designation',
    editId: 'resource_designation',
    sortId: 'resource_designation',
    label: 'Designation',
    width: 200,
    sortable: true,
    editable:
      permissionMap?.['resource_designation']?.edit &&
      permissionMap?.['resource_designation']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_designation']?.edit &&
      !permissionMap?.['resource_designation']?.read,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Designation',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Please enter more than 2 characters.',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Max length exceeded.',
        },
        {
          regex: RESOURCE_REGEX.ROLE,
          errorMessage:
            'Allows only letters, Apostrophe, spaces, hyphens, and Periods.',
        },
        {
          regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
          errorMessage: 'Cannot start or end with a space or special character',
        },
      ],
    },
  },
  {
    id: 'resource_role',
    editId: 'resource_role',
    sortId: 'resource_role',
    label: 'Role',
    width: 200,
    sortable: true,
    editable:
      permissionMap?.['resource_role']?.edit &&
      permissionMap?.['resource_role']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_role']?.edit &&
      !permissionMap?.['resource_role']?.read,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Role',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Please enter more than 2 characters.',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Max length exceeded.',
        },
        {
          regex: RESOURCE_REGEX.ROLE,
          errorMessage:
            'Allows only letters, Apostrophe, spaces, hyphens, and Periods.',
        },
      ],
    },
  },
  {
    id: 'country_name',
    editId: 'country_rid',
    sortId: 'country_rid',
    label: 'Country',
    width: 160,
    sortable: true,
    editable:
      permissionMap?.['country_rid']?.edit &&
      permissionMap?.['country_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['country_rid']?.edit &&
      !permissionMap?.['country_rid']?.read,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Country',
      options: countryOptions,
      // Reset dependent fields when country changes
      resetDependentFields: ['region_name'],
      // Enable onChange callback to fetch regions
      onChange: true,
      getFieldData: (rowData: DependencyRowData) => {
        onCountryClick(String(rowData.country_rid || ''));
        return String(rowData.country_rid || '');
      },
      dependencies: [
        {
          dependsOn: 'region_name',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
      ],
    },
  },
  {
    id: 'region_name',
    editId: 'region_rid',
    sortId: 'region_rid',
    label: 'Region',
    width: 150,
    sortable: true,
    editable:
      permissionMap?.['region_rid']?.edit &&
      permissionMap?.['region_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['region_rid']?.edit &&
      !permissionMap?.['region_rid']?.read,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Region',
      options: regionOptions,
      loading: regionLoading,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.region_rid || '');
      },
      dependencies: [
        {
          dependsOn: 'country_name',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
      ],
    },
  },
  {
    id: 'total_project_hours',
    sortId: 'total_project_hours',
    label: 'Total Project Hours',
    width: 160,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['total_project_hours']?.edit &&
      !permissionMap?.['total_project_hours']?.read,
  },
  {
    id: 'estimated_rd_hours',
    sortId: 'estimated_rd_hours',
    label: 'Estimated R&D Hours',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['estimated_rd_hours']?.edit &&
      !permissionMap?.['estimated_rd_hours']?.read,
  },
  {
    id: 'status_name',
    editId: 'status_rid',
    sortId: 'status_name',
    label: 'Status',
    width: 150,
    sortable: true,
    render: (row: ResourceList) => (
      <span
        className={`${
          row.status_name === 'Active' ? 'text-[#199806]' : 'text-[#f44336]'
        }`}
      >
        {row.status_name || '-'}
      </span>
    ),
    editable:
      permissionMap?.['status_rid']?.edit &&
      permissionMap?.['status_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: statusOptions,
    },
  },
  {
    id: 'comments',
    editId: 'comments',
    sortId: 'comments',
    label: 'Comments',
    width: 160,
    sortable: true,
    editable:
      permissionMap?.['comments']?.edit &&
      permissionMap?.['comments']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['comments']?.edit && !permissionMap?.['comments']?.read,
    field: {
      type: 'textarea',
      required: false,
      placeholder: 'Enter Comments',
      validation: [
        {
          regex: RESOURCE_REGEX.DESCRIPTION,
          errorMessage: 'Max length exceeded.',
        },
      ],
    },
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Resource ID',
    width: 150,
    sortable: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
];

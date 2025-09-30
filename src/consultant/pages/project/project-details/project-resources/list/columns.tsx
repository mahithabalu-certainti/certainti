import {
  costDisplay,
  PROJECT_RESOURCE_REGEX,
  REGEX_PATTERNS,
  RESOURCE_REGEX,
  valueDisplay,
} from '../../../../../../common-utils';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../../../../components/table/types';
import { SelectOption } from '../../../../../types';
import { ProjectResourcesListType } from '../../../../../types/project-resources';

export type TableColumn<T> = {
  id: string;
  label: string;
  width?: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
};

export const getProjectResourcesColumns = (
  onClick: (row: ProjectResourcesListType) => void,
  memoizedProjectResourceCode: SelectOption[],
  // memoizedProjectTypes: SelectOption[],
  countryOptions: SelectOption[],
  memoizedState: SelectOption[],
  handleCountry: (country: string) => void,
  regionLoading: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountOrProjectInActive?: boolean
): ListTableColumn<ProjectResourcesListType>[] => [
  {
    id: 'resource_code',
    label: 'Resource Code',
    editId: 'resource_code',
    sortable: true,
    sortId: 'resource_code',
    width: '160px',
    sticky: true,
    editable:
      permissionMap?.['resource_code']?.read &&
      permissionMap?.['resource_code']?.edit &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['resource_code']?.read &&
      !permissionMap?.['resource_code']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    field: {
      type: 'select',
      options: memoizedProjectResourceCode,
      required: true,
    },
    render: (row: ProjectResourcesListType) => (
      <span
        className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        onClick={() => onClick(row)}
      >
        {row.resource_code}
      </span>
    ),
  },
  {
    id: 'resource_name',
    label: 'Resource Name',
    sortable: true,
    sortId: 'resource_name',
    width: '180px',
    hide:
      !permissionMap?.['resource_name']?.read &&
      !permissionMap?.['resource_name']?.edit,
  },
  {
    id: 'country_name',
    label: 'Resource Country',
    editId: 'country_rid',
    sortable: true,
    sortId: 'country_name',
    width: '150px',
    editable:
      permissionMap?.['country_rid']?.read &&
      permissionMap?.['country_rid']?.edit &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
    field: {
      type: 'select',
      options: countryOptions,
      required: false,
      onChange: true,
      placeholder: 'Choose Country',
      resetDependentFields: ['region_name'],
      getFieldData: (rowData: DependencyRowData) => {
        handleCountry(String(rowData.country_rid || ''));
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
    label: 'Resource Region',
    editId: 'region_rid',
    sortable: true,
    sortId: 'region_name',
    width: '150px',
    editable:
      permissionMap?.['region_rid']?.read &&
      permissionMap?.['region_rid']?.edit &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['region_rid']?.read &&
      !permissionMap?.['region_rid']?.edit,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Region',
      loading: regionLoading,
      options: memoizedState,
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
  // {
  //   id: 'resource_type_name',
  //   label: 'Resource Type',
  //   editId: 'resource_type_rid',
  //   sortable: true,
  //   sortId: 'resource_type_name',
  //   width: '150px',
  //   editable:
  //     permissionMap?.['resource_type_rid']?.read &&
  //     permissionMap?.['resource_type_rid']?.edit,
  //   hide:
  //     !permissionMap?.['resource_type_rid']?.read &&
  //     !permissionMap?.['resource_type_rid']?.edit,
  //   field: {
  //     type: 'select',
  //     options: memoizedProjectTypes,
  //     required: true,
  //   },
  // },
  // {
  //   id: 'resource_orgname',
  //   label: 'Resource Org Name',
  //   sortable: true,
  //   sortId: 'resource_orgname',
  //   width: '180px',
  // },
  {
    id: 'project_resource_role',
    label: 'Project Resource Role',
    sortable: true,
    sortId: 'project_resource_role',
    width: '200px',
    editable:
      permissionMap?.['project_resource_role']?.read &&
      permissionMap?.['project_resource_role']?.edit,
    hide:
      !permissionMap?.['project_resource_role']?.read &&
      !permissionMap?.['project_resource_role']?.edit,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Resource Role',
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
    id: 'total_hours_pro_res',
    label: 'Effort (Hours)',
    sortable: true,
    sortId: 'total_hours_pro_res',
    width: '150px',
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectResourcesListType) =>
      row.total_hours_pro_res ? valueDisplay(row.total_hours_pro_res) : '-',
    editable:
      permissionMap?.['total_hours_pro_res']?.read &&
      permissionMap?.['total_hours_pro_res']?.edit &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['total_hours_pro_res']?.read &&
      !permissionMap?.['total_hours_pro_res']?.edit,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter an effort',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
    },
  },
  {
    id: 'total_cost_pro_res',
    label: 'Cost',
    sortable: true,
    sortId: 'total_cost_pro_res',
    width: '150px',
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectResourcesListType) =>
      row.total_cost_pro_res
        ? costDisplay(row.total_cost_pro_res, row?.currency_symbol)
        : '-',

    editable:
      permissionMap?.['total_cost_pro_res']?.read &&
      permissionMap?.['total_cost_pro_res']?.edit &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['total_cost_pro_res']?.read &&
      !permissionMap?.['total_cost_pro_res']?.edit,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Cost',
      validation: [
        {
          regex: PROJECT_RESOURCE_REGEX.COST_REGEX,
          errorMessage: 'Cost must be a 18-digit number with up to 2 decimals',
        },
      ],
    },
  },
  {
    id: 'qre_percent',
    label: 'QRE %',
    sortable: true,
    sortId: 'rd_percent_final',
    width: '150px',
    hide:
      !permissionMap?.['rd_percent_final']?.read &&
      !permissionMap?.['rd_percent_final']?.edit,
  },
  {
    id: 'qre_final',
    label: 'QRE',
    sortable: true,
    sortId: 'qre_final',
    width: '150px',
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 130,
    sortable: true,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
    render: (row: ProjectResourcesListType) => (
      <span
        className={`${
          row.status_name === 'Active'
            ? 'text-[#199806]'
            : row.status_name === 'In-Active'
              ? 'text-[#f44336] '
              : ''
        }`}
      >
        {row.status_name || '-'}
      </span>
    ),
  },
  {
    id: 'description',
    label: 'Comments',
    sortable: true,
    sortId: 'description',
    width: '150px',
    editable:
      permissionMap?.['description']?.read &&
      permissionMap?.['description']?.edit &&
      !accountOrProjectInActive,
    hide:
      !permissionMap?.['description']?.read &&
      !permissionMap?.['description']?.edit,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Comments',
      validation: [
        {
          regex: PROJECT_RESOURCE_REGEX.DESCRIPTION,
          errorMessage: 'Maximum 2000 characters allowed',
        },
      ],
    },
  },
  {
    id: 'r_number',
    label: 'Project Resource ID',
    sortable: true,
    sortId: 'r_number',
    width: '180px',
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r-number']?.edit,
  },
];

import {
  costDisplay,
  PROJECT_RESOURCE_REGEX,
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
  permissionMap: Record<string, { read: boolean; edit: boolean }>
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
      permissionMap?.['resource_code']?.edit,
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
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.resource_code}
      </span>
    ),
  },
  // {
  //   id: 'resource_name',
  //   editId: 'resource_name',
  //   label: 'Resource Name',
  //   sortable: true,
  //   sortId: 'resource_name',
  //   width: '180px',
  //   editable:
  //     permissionMap?.['resource_name']?.read &&
  //     permissionMap?.['resource_name']?.edit,
  //   hide:
  //     !permissionMap?.['resource_name']?.read &&
  //     !permissionMap?.['resource_name']?.edit,
  //   field: {
  //     type: 'text',
  //     required: false,
  //     placeholder: 'Enter Resource Name',
  //     validation: [
  //       {
  //         regex: PROJECT_RESOURCE_REGEX.RESOURCE_NAME,
  //         errorMessage:
  //           "Please enter 2–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
  //       },
  //     ],
  //   },
  // },
  {
    id: 'country_name',
    label: 'Resource Country',
    editId: 'country_rid',
    sortable: true,
    sortId: 'country_name',
    width: '150px',
    editable:
      permissionMap?.['country_rid']?.read &&
      permissionMap?.['country_rid']?.edit,
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
        handleCountry(String(rowData.country_rid));
        return String(rowData.country_rid);
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
      permissionMap?.['region_rid']?.edit,
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
        return String(rowData.region_rid);
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
  // {
  //   id: 'resource_role',
  //   label: 'Resource Role',
  //   sortable: true,
  //   sortId: 'resource_role',
  //   width: '150px',
  //   editable:
  //     permissionMap?.['resource_role']?.read &&
  //     permissionMap?.['resource_role']?.edit,
  //   hide:
  //     !permissionMap?.['resource_role']?.read &&
  //     !permissionMap?.['resource_role']?.edit,
  //   field: {
  //     type: 'text',
  //     required: false,
  //     placeholder: 'Enter Resource Role',
  //     validation: [
  //       {
  //         regex: PROJECT_RESOURCE_REGEX.ROLE,
  //         errorMessage:
  //           "Please enter 2–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
  //       },
  //     ],
  //   },
  // },

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
      row.total_cost_pro_res ? valueDisplay(row.total_hours_pro_res) : '-',
    editable:
      permissionMap?.['total_hours_pro_res']?.read &&
      permissionMap?.['total_hours_pro_res']?.edit,
    hide:
      !permissionMap?.['total_hours_pro_res']?.read &&
      !permissionMap?.['total_hours_pro_res']?.edit,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter an effort',
      validation: [
        {
          regex: PROJECT_RESOURCE_REGEX.EFFORT,
          errorMessage: 'Effort must be a positive number',
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
      permissionMap?.['total_cost_pro_res']?.edit,
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
    sortId: 'qre_percent',
    width: '150px',
    hide:
      !permissionMap?.['qre_percent']?.read &&
      !permissionMap?.['qre_percent']?.edit,
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
    id: 'description',
    label: 'Comments',
    sortable: true,
    sortId: 'description',
    width: '150px',
    editable:
      permissionMap?.['description']?.read &&
      permissionMap?.['description']?.edit,
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
  // {
  //   id: 'r_number',
  //   label: 'Project Resource ID',
  //   sortable: true,
  //   sortId: 'r_number',
  //   width: '180px',
  // },
];

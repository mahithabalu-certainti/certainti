import { formatDateToYYYYMMDDWithTime } from '../../../common-utils';
import { ListTableColumn } from '../../../components/table/types';
import { ColorCode, FourPartAssessmentList } from '../../types';
import { FieldConfig } from '../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getFourPartAssessmentTableColumns = (
  handleFourPartAssessmentView: (rowId: string) => void,
  moduleLevel: 'account' | 'project' | 'case',
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<FourPartAssessmentList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Four Part Assessment ID',
    width: 200,
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
      handleFourPartAssessmentView ? (
        <span
          onClick={() => handleFourPartAssessmentView(row.rid)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 140,
    sortable: true,
    hide:
      moduleLevel === 'project' ||
      (!projectPermissionMap?.['project_code']?.edit &&
        !projectPermissionMap?.['project_code']?.read),
  },
  {
    id: 'rd_potential_category',
    sortId: 'rd_potential_category',
    label: 'Range',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['rd_potential_category']?.edit &&
      !permissionMap?.['rd_potential_category']?.read,
  },
  {
    id: 'permitted_purpose_status',
    sortId: 'permitted_purpose_status',
    label: 'Permitted Purpose Status',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['permitted_purpose_status']?.edit &&
      !permissionMap?.['permitted_purpose_status']?.read,
  },
  {
    id: 'technological_uncertainty_status',
    sortId: 'technological_uncertainty_status',
    label: 'Technological Uncertainty Status',
    width: 245,
    sortable: true,
    hide:
      !permissionMap?.['technological_uncertainty_status']?.edit &&
      !permissionMap?.['technological_uncertainty_status']?.read,
  },
  {
    id: 'technological_in_nature_status',
    sortId: 'technological_in_nature_status',
    label: 'Technological In Nature Status',
    width: 235,
    sortable: true,
    hide:
      !permissionMap?.['technological_in_nature_status']?.edit &&
      !permissionMap?.['technological_in_nature_status']?.read,
  },
  {
    id: 'process_of_experimentation_status',
    sortId: 'process_of_experimentation_status',
    label: 'Process of Experimentation Status',
    width: 255,
    sortable: true,
    hide:
      !permissionMap?.['process_of_experimentation_status']?.edit &&
      !permissionMap?.['process_of_experimentation_status']?.read,
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['created_by']?.edit &&
      !permissionMap?.['created_by']?.read,
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
];

export const getFourPartAssessmentFilterFields = (
  moduleLevel: 'account' | 'project' | 'case',
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Four Part Assessment ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      hide:
        moduleLevel === 'project' ||
        (!projectPermissionMap?.['project_code']?.edit &&
          !projectPermissionMap?.['project_code']?.read),
    },
    {
      name: 'Range',
      value: 'rd_potential_category',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['rd_potential_category']?.edit &&
        !permissionMap?.['rd_potential_category']?.read,
    },
    {
      name: 'Permitted Purpose Status',
      value: 'permitted_purpose_status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['permitted_purpose_status']?.edit &&
        !permissionMap?.['permitted_purpose_status']?.read,
    },
    {
      name: 'Technological Uncertainty Status',
      value: 'technological_uncertainty_status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['technological_uncertainty_status']?.edit &&
        !permissionMap?.['technological_uncertainty_status']?.read,
    },
    {
      name: 'Technological In Nature Status',
      value: 'technological_in_nature_status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['technological_in_nature_status']?.edit &&
        !permissionMap?.['technological_in_nature_status']?.read,
    },
    {
      name: 'Process of Experimentation Status',
      value: 'process_of_experimentation_status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['process_of_experimentation_status']?.edit &&
        !permissionMap?.['process_of_experimentation_status']?.read,
    },
    {
      name: 'Created By',
      value: 'created_by_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['created_by']?.edit &&
        !permissionMap?.['created_by']?.read,
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
  ];
};

export const moduleColorMap = {
  account: {
    text: ColorCode.accountTextColor,
    bg: ColorCode.accountBgColor,
  },
  project: {
    text: ColorCode.projectTextColor,
    bg: ColorCode.projectBgColor,
  },
  case: {
    text: ColorCode.caseTextColor,
    bg: ColorCode.caseBgColor,
  },
};

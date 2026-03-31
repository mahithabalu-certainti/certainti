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

const assessmentChipStyles: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  // R&D Potential Category
  high: { label: 'High', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  low: { label: 'Low', bg: '#FEF9C3', text: '#A16207', border: '#FDE047' },
  medium: {
    label: 'Medium',
    bg: '#FFEDD5',
    text: '#C2410C',
    border: '#FDBA74',
  },
  none: { label: 'None', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  // Status / Met / Not Met
  met: { label: 'Met', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  completed: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#15803D',
    border: '#86EFAC',
  },
  'not met': {
    label: 'Not Met',
    bg: '#FEE2E2',
    text: '#B91C1C',
    border: '#FCA5A5',
  },
};

export const renderAssessmentChip = (value?: string | null) => {
  if (!value) return <span>-</span>;
  const chip = assessmentChipStyles[value.toLowerCase()];
  const style = chip ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
  const label = chip ? chip.label : value;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: '18px',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

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
    label: 'R&D Potential Category',
    width: 210,
    sortable: true,
    hide:
      !permissionMap?.['rd_potential_category']?.edit &&
      !permissionMap?.['rd_potential_category']?.read,
    render: (row) => renderAssessmentChip(row.rd_potential_category),
  },
  {
    id: 'summary_judgment',
    sortId: 'summary_judgment',
    label: 'Summary',
    width: 250,
    sortable: true,
    hide:
      !permissionMap?.['summary_judgment']?.edit &&
      !permissionMap?.['summary_judgment']?.read,
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
    render: (row) => renderAssessmentChip(row.permitted_purpose_status),
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
    render: (row) => renderAssessmentChip(row.technological_uncertainty_status),
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
    render: (row) => renderAssessmentChip(row.technological_in_nature_status),
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
    render: (row) =>
      renderAssessmentChip(row.process_of_experimentation_status),
  },
  {
    id: 'status',
    sortId: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
    render: (row) => renderAssessmentChip(row.status),
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
      name: 'R&D Potential Category',
      value: 'rd_potential_category',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['rd_potential_category']?.edit &&
        !permissionMap?.['rd_potential_category']?.read,
    },
    {
      name: 'Summary',
      value: 'summary_judgment',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['summary_judgment']?.edit &&
        !permissionMap?.['summary_judgment']?.read,
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
      name: 'Status',
      value: 'status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
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

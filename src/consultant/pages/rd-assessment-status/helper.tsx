import { formatDateToYYYYMMDDWithTime } from '../../../common-utils';
import { ListTableColumn } from '../../../components/table/types';
import { RdAssessmentStatusItem } from '../../types';
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

export const getRdAssessmentStatusTableColumns = (
  moduleLevel: 'account' | 'project' | 'case',
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  rdAssessmentPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  handleViewProject?: (data: RdAssessmentStatusItem) => void
): ListTableColumn<RdAssessmentStatusItem>[] => [
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 160,
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
      moduleLevel === 'project' ||
      (!projectPermissionMap?.['project_code']?.edit &&
        !projectPermissionMap?.['project_code']?.read),
    render: (row) => {
      return handleViewProject && moduleLevel === 'case' ? (
        <span
          onClick={() => handleViewProject(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.project_code}
        </span>
      ) : (
        row.project_code
      );
    },
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Assessment Triggered At',
    width: 200,
    sortable: true,
    ...(moduleLevel === 'project'
      ? {
          sticky: true,
          sx: {
            position: 'sticky',
            left: 0,
            background: '#fff',
            zIndex: 10,
            borderRight: '1px solid #CBD6E2 !important',
            borderBottom: '1px solid #CBD6E2 !important',
          },
        }
      : {}),
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !rdAssessmentPermissionMap?.['created_datetime']?.edit &&
      !rdAssessmentPermissionMap?.['created_datetime']?.read,
  },
  {
    id: 'four_part_assessment',
    sortId: 'four_part_assessment',
    label: 'Four-Part Assessment',
    width: 190,
    sortable: true,
    hide:
      !rdAssessmentPermissionMap?.['four_part_assessment']?.edit &&
      !rdAssessmentPermissionMap?.['four_part_assessment']?.read,
  },
  {
    id: 'project_summary',
    sortId: 'project_summary',
    label: 'Project Summary',
    width: 170,
    sortable: true,
    hide:
      !rdAssessmentPermissionMap?.['project_summary']?.edit &&
      !rdAssessmentPermissionMap?.['project_summary']?.read,
  },
  {
    id: 'qre_summary',
    sortId: 'qre_summary',
    label: 'QRE Summary',
    width: 155,
    sortable: true,
    hide:
      !rdAssessmentPermissionMap?.['qre_summary']?.edit &&
      !rdAssessmentPermissionMap?.['qre_summary']?.read,
  },
  {
    id: 'interaction_status',
    sortId: 'interaction_status',
    label: 'Interaction Status',
    width: 170,
    sortable: true,
    hide:
      !rdAssessmentPermissionMap?.['interaction_status']?.edit &&
      !rdAssessmentPermissionMap?.['interaction_status']?.read,
  },
];

export const getRdAssessmentStatusFilterFields = (
  moduleLevel: 'account' | 'project' | 'case',
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  rdAssessmentPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
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
      name: 'Assessment Triggered At',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !rdAssessmentPermissionMap?.['created_datetime']?.edit &&
        !rdAssessmentPermissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Four-Part Assessment',
      value: 'four_part_assessment',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !rdAssessmentPermissionMap?.['four_part_assessment']?.edit &&
        !rdAssessmentPermissionMap?.['four_part_assessment']?.read,
    },
    {
      name: 'Project Summary',
      value: 'project_summary',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !rdAssessmentPermissionMap?.['project_summary']?.edit &&
        !rdAssessmentPermissionMap?.['project_summary']?.read,
    },
    {
      name: 'QRE Summary',
      value: 'qre_summary',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !rdAssessmentPermissionMap?.['qre_summary']?.edit &&
        !rdAssessmentPermissionMap?.['qre_summary']?.read,
    },
    {
      name: 'Interaction Status',
      value: 'interaction_status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !rdAssessmentPermissionMap?.['interaction_status']?.edit &&
        !rdAssessmentPermissionMap?.['interaction_status']?.read,
    },
  ];
};

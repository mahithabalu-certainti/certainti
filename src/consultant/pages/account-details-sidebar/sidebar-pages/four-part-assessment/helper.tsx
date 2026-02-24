import { ListTableColumn } from '../../../../../components/table/types';
import { FourPartAssessmentList } from '../../../../types';
import { FieldConfig } from '../../components/filter/filterType';
import { formatDateToYYYYMMDDWithTime } from '../resources/utils';

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

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

const enumOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const getFourPartAssessmentTableColumns = (
  handleFourPartAssessmentView: (rowId: string) => void
  //   permissionMap?: Record<string, { read: boolean; edit: boolean }>
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
    // hide:
    //   !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
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
    width: 120,
    sortable: true,
    // hide:
    //   !projectPermissionMap?.['project_code']?.edit &&
    //   !projectPermissionMap?.['project_code']?.read,
  },
  {
    id: 'range',
    sortId: 'range',
    label: 'Range',
    width: 140,
    sortable: true,
    //   hide: !permissionMap?.['range']?.edit && !permissionMap?.['range']?.read,
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 140,
    sortable: true,
    //   hide: !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_by_name']?.edit &&
    //   !permissionMap?.['created_by_name']?.read,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    // hide:
    //   !permissionMap?.['created_datetime']?.edit &&
    //   !permissionMap?.['created_datetime']?.read,
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Modified By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['modified_by_name']?.edit &&
    //   !permissionMap?.['modified_by_name']?.read,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Modified On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.modified_datetime),
    // hide:
    //   !permissionMap?.['modified_datetime']?.edit &&
    //   !permissionMap?.['modified_datetime']?.read,
  },
];

export const getFourPartAssessmentFilterFields = (
  statusOptions: { option: string; value: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Four Part Assessment ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['r_number']?.edit &&
      //     !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['project_code']?.edit &&
      //     !permissionMap?.['project_code']?.read,
    },
    {
      name: 'Range',
      value: 'range',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['range']?.edit &&
      //     !permissionMap?.['range']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: statusOptions,
      operatorOption: enumOptions,
      //   hide:
      //     !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    },
    {
      name: 'Created By',
      value: 'created_by_name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['created_by_name']?.edit &&
      //     !permissionMap?.['created_by_name']?.read,
    },
    {
      name: 'Created On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['created_datetime']?.edit &&
      //     !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Modified By',
      value: 'modified_by_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
      //   hide:
      //     !permissionMap?.['modified_by_name']?.edit &&
      //     !permissionMap?.['modified_by_name']?.read,
    },
    {
      name: 'Modified On',
      value: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['modified_datetime']?.edit &&
      //     !permissionMap?.['modified_datetime']?.read,
    },
  ];
};

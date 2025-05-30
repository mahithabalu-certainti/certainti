import { ResourceSkillList } from '../../../../../types/resource-skill';
import { formatDateToYYYYMMDD } from '../utils';

export interface ResourceSkillTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export const resourceSkillColumns: ResourceSkillTableColumn<ResourceSkillList>[] =
  [
    {
      id: 'resource_code',
      sortId: 'resource_code',
      label: 'Resource Code',
      width: 130,
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
    },
    {
      id: 'resource_name',
      sortId: 'resource_name',
      label: 'Name',
      width: 160,
      sortable: false,
    },
    {
      id: 'resource_type',
      sortId: 'resource_type',
      label: 'Resource Type',
      width: 130,
      sortable: true,
    },
    {
      id: 'start_date',
      sortId: 'start_date',
      label: 'Start Date',
      width: 130,
      sortable: true,
      render: (row: ResourceSkillList) => (
        <span>{formatDateToYYYYMMDD(row.start_date as string) || '-'}</span>
      ),
    },
    {
      id: 'skill_type_name',
      sortId: 'skill_type_name',
      label: 'Skill Type',
      width: 180,
      sortable: true,
    },
    {
      id: 'skill_subtype_name',
      sortId: 'skill_subtype_name',
      label: 'Skill SubType',
      width: 180,
      sortable: true,
    },
    {
      id: 'skill_level',
      sortId: 'skill_level',
      label: 'Skill Level',
      width: 140,
      sortable: true,
    },
    {
      id: 'skill_details',
      sortId: 'skill_details',
      label: 'Skill Details',
      width: 180,
      sortable: true,
    },
    {
      id: 'resource_orgname',
      sortId: 'resource_orgname',
      label: 'Org Name',
      width: 130,
      sortable: true,
    },
    {
      id: 'resource_designation',
      sortId: 'resource_designation',
      label: 'Designation',
      width: 130,
      sortable: true,
    },
    {
      id: 'resource_role',
      sortId: 'resource_role',
      label: 'Role',
      width: 130,
      sortable: true,
    },
    {
      id: 'years_of_experience',
      sortId: 'resource_total_experience',
      label: 'Years of Experience',
      width: 160,
      sortable: true,
      align: 'right',
    },
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Skill ID',
      width: 130,
      sortable: true,
    },
  ];

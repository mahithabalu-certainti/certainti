import { ResourceSkillList } from '../../../../../types/resource-skill';
import { formatDateToMMDDYYYY } from '../utils';

export interface ResourceSkillTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export const resourceSkillColumns: ResourceSkillTableColumn<ResourceSkillList>[] =
  [
    {
      id: 'start_date',
      sortId: 'start_date',
      label: 'Start Date',
      width: '15%',
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
      render: (row: ResourceSkillList) => (
        <span>{formatDateToMMDDYYYY(row.start_date as string) || '-'}</span>
      ),
    },
    {
      id: 'skill_type_name',
      sortId: 'skill_type_name',
      label: 'Skill Type',
      width: '20%',
      sortable: true,
    },
    {
      id: 'skill_subtype_name',
      sortId: 'skill_subtype_name',
      label: 'Skill SubType',
      width: '20%',
      sortable: true,
    },
    {
      id: 'skill_details',
      sortId: 'skill_details',
      label: 'Skill Details',
      width: '20%',
      sortable: true,
    },
    {
      id: 'skill_level',
      sortId: 'skill_level',
      label: 'Skill Level',
      width: '15%',
      sortable: true,
    },
  ];

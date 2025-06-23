import { ResourceSkillList } from '../../../../../types/resource-skill';
import { dateFormatToYYYYMMDD } from '../utils';

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
      label: 'Effective From',
      width: 130,
      sortable: true,
      render: (row: ResourceSkillList) => (
        <span>{dateFormatToYYYYMMDD(row.start_date as string) || '-'}</span>
      ),
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
      id: 'r_number',
      sortId: 'r_number',
      label: 'Skill ID',
      width: 130,
      sortable: true,
    },
  ];

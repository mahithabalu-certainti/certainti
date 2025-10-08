import { CaseTeamMember } from '../../../../services/case-team';

export interface CaseTeamFormData {
  team_members: CaseTeamMember[];
}

export interface CaseTeamFormErrors {
  team_members?: CaseTeamMemberErrors[];
}

export interface CaseTeamMemberErrors {
  user_name?: string;
  user_role?: string;
}

export interface CaseTeamTableColumn {
  name: string;
  label: string;
  width: string;
  hide?: boolean;
  required?: boolean;
  align?: 'left' | 'center' | 'right';
  disabled?: boolean;
}

export const getCaseTeamTableColumns = (): CaseTeamTableColumn[] => [
  {
    name: 'user_role',
    label: 'User Role',
    width: '40%',
    required: true,
  },
  {
    name: 'user_name',
    label: 'User Name',
    width: '50%',
    required: true,
  },
  {
    name: 'action',
    label: 'Action',
    width: '10%',
    align: 'center',
    hide: false,
  },
];

export const getCaseTeamListColumns = () => [
  {
    name: 'user_name',
    label: 'Team Member',
    width: '25%',
    sortable: true,
  },
  {
    name: 'user_role',
    label: 'Role',
    width: '20%',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    width: '10%',
    sortable: true,
    render: (value: string) => (
      <span className={`status-badge ${value.toLowerCase()}`}>{value}</span>
    ),
  },
];

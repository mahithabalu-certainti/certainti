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
  start_date?: string;
  end_date?: string;
  is_primary?: string;
  status?: string;
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
    width: '15%',
    required: true,
  },
  {
    name: 'user_name',
    label: 'User Name',
    width: '15%',
    required: true,
  },
  {
    name: 'is_primary',
    label: 'Is Primary',
    width: '5%',
    align: 'center',
    required: false,
  },
  {
    name: 'status',
    label: 'Status',
    width: '15%',
    required: true,
  },
  {
    name: 'start_date',
    label: 'Start Date',
    width: '25%',
    required: true,
  },
  {
    name: 'end_date',
    label: 'End Date',
    width: '25%',
    required: false,
  },
  {
    name: 'action',
    label: 'Action',
    width: '5%',
    align: 'center',
    hide: false,
  },
];

import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
} from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { InteractionList } from '../../../../types';
import { Project } from '../../../../types/project';

export const getInteractionListColumns = (
  handleViewInteraction: (rid: string, rNumber: string) => void,
  viewProjectCount: (rid: string) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<InteractionList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Interaction ID',
    width: 130,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: InteractionList) => (
      <span
        onClick={() => handleViewInteraction(row.rid, row.r_number)}
        className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
      >
        {row.r_number}
      </span>
    ),
  },
  {
    id: 'project_count',
    sortId: 'project_count',
    label: 'Project Count',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['project_count']?.edit &&
      !permissionMap?.['project_count']?.read,
    render: (row: InteractionList) =>
      row.project_count && Number(row.project_count) > 0 ? (
        <span
          onClick={() => row.project_count && viewProjectCount(row.rid)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.project_count}
        </span>
      ) : (
        row.project_count || '0'
      ),
  },
  {
    id: 'interaction_type_name',
    sortId: 'interaction_type_name',
    label: 'Type',
    width: 80,
    sortable: true,
    hide:
      !permissionMap?.['interaction_type_name']?.edit &&
      !permissionMap?.['interaction_type_name']?.read,
  },
  {
    id: 'created_user_name',
    sortId: 'created_user_name',
    label: 'Created By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['created_by']?.edit &&
      !permissionMap?.['created_by']?.read,
    render: (row: InteractionList) => row.created_user_name || '-',
  },
  {
    id: 'modified_user_name',
    sortId: 'modified_user_name',
    label: 'Last Updated By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['modified_by']?.edit &&
      !permissionMap?.['modified_by']?.read,
    render: (row: InteractionList) => row.updated_user_name || '-',
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Last Updated Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['modified_datetime']?.edit &&
      !permissionMap?.['modified_datetime']?.read,
    render: (row: InteractionList) =>
      formatDateToYYYYMMDDWithTime(row.modified_datetime),
  },
  {
    id: 'sent_on_datetime',
    sortId: 'sent_on_datetime',
    label: 'Last Sent Date',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['sent_on_datetime']?.edit &&
      !permissionMap?.['sent_on_datetime']?.read,
    render: (row: InteractionList) =>
      row.last_resent_on && formatDateToYYYYMMDDWithTime(row.last_resent_on),
  },
];

export const getProjectColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<Project>[] => [
  {
    id: 'project_code',
    editId: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
    width: 260,
    sticky: true,
    hide:
      !permissionMap?.['project_code']?.read &&
      !permissionMap?.['project_code']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: Project) => {
      const displayCode = row.fiscal_year
        ? `FY${row.fiscal_year} - ${row.project_code}`
        : row.project_code;
      const isClickable = row._level !== undefined && row._level === 1;
      return isClickable ? (
        <span className={row.fiscal_year ? '!text-[#1755E7]' : ''}>
          {displayCode}
        </span>
      ) : (
        displayCode
      );
    },
  },
  {
    id: 'project_name',
    editId: 'project_name',
    label: 'Name',
    sortable: true,
    sortId: 'project_name',
    width: 160,
    hide:
      !permissionMap?.['project_name']?.read &&
      !permissionMap?.['project_name']?.edit,
  },
  {
    id: 'project_type_name',
    editId: 'project_type_rid',
    label: 'Project Type',
    sortable: true,
    sortId: 'project_type_rid',
    width: 160,
    hide:
      !permissionMap?.['project_type_rid']?.read &&
      !permissionMap?.['project_type_rid']?.edit,
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    hide:
      !permissionMap?.['fiscal_year']?.read &&
      !permissionMap?.['fiscal_year']?.edit,
    sortId: 'fiscal_year',
    width: 130,
    sx: {
      textAlign: 'left',
    },
    render: (row: Project) => {
      const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
      return <span>{displayYear}</span>;
    },
  },
  {
    id: 'classification_name',
    editId: 'project_classification_rid',
    label: 'Project Classification',
    sortable: true,
    sortId: 'classification_name',
    hide:
      !permissionMap?.['project_classification_rid']?.read &&
      !permissionMap?.['project_classification_rid']?.edit,
    width: 170,
    render: (row: Project) =>
      row.project_classification_other
        ? `${row.classification_name} - ${row.project_classification_other}`
        : row.classification_name,
  },
  {
    id: 'project_client_group',
    editId: 'project_client_group',
    label: 'Customer Group',
    sortable: true,
    sortId: 'project_client_group',
    width: 160,
    hide:
      !permissionMap?.['project_client_group']?.read &&
      !permissionMap?.['project_client_group']?.edit,
  },
  {
    id: 'project_group',
    editId: 'project_group',
    label: 'Project Group',
    sortable: true,
    sortId: 'project_group',
    hide:
      !permissionMap?.['project_group']?.read &&
      !permissionMap?.['project_group']?.edit,
    width: 160,
  },
  {
    id: 'total_effort',
    editId: 'total_effort',
    label: 'Project Effort (Hours)',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    conditionallyEdit: [
      {
        key: 'total_effort',
        matchValue: [null, '0.00'],
      },
    ],
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_effort ? valueDisplay(row.total_effort) : '-',
  },
  {
    id: 'total_cost',
    editId: 'total_cost',
    label: 'Project Cost',
    sortable: true,
    sortId: 'total_cost',
    width: 130,
    hide:
      !permissionMap?.['total_cost']?.read &&
      !permissionMap?.['total_cost']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
  },
  {
    id: 'total_cost_fte',
    editId: 'total_cost_fte',
    label: 'FTE Cost',
    sortable: true,
    sortId: 'total_cost_fte',
    width: 140,
    hide:
      !permissionMap?.['total_cost_fte']?.read &&
      !permissionMap?.['total_cost_fte']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_fte
        ? costDisplay(row.total_cost_fte, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon',
    editId: 'total_cost_subcon',
    label: 'SubCon Cost',
    sortable: true,
    sortId: 'total_cost_subcon',
    width: 140,
    hide:
      !permissionMap?.['total_cost_subcon']?.read &&
      !permissionMap?.['total_cost_subcon']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor',
    editId: 'total_cost_nonlabor',
    label: 'Non-Labor Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_nonlabor']?.read &&
      !permissionMap?.['total_cost_nonlabor']?.edit,
    sortId: 'total_cost_nonlabor',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_nonlabor
        ? costDisplay(row.total_cost_nonlabor, row.currency_symbol)
        : '-',
  },
  {
    id: 'project_point_of_contact',
    label: 'Project Point of Contact',
    sortable: true,
    sortId: 'project_point_of_contact',
    width: 200,
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
    render: (row: Project & { _level?: number }) => {
      return (
        <span>
          {row.project_point_of_contact ? row.project_point_of_contact : '-'}
        </span>
      );
    },
  },
  {
    id: 'technical_point_of_contact',
    label: 'Technical Point of Contact',
    sortable: true,
    sortId: 'technical_point_of_contact',
    width: 210,
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
    render: (row: Project & { _level?: number }) => {
      return (
        <span>
          {row.technical_point_of_contact
            ? row.technical_point_of_contact
            : '-'}
        </span>
      );
    },
  },
  {
    id: 'assessment_status',
    label: 'Assessment Status',
    sortable: true,
    sortId: 'assessment_status',
    width: 180,
    hide:
      !permissionMap?.['assessment_status']?.read &&
      !permissionMap?.['assessment_status']?.edit,
  },
  {
    id: 'qre_final',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre_final',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
    render: (row: Project) => (row.qre_final ? row.qre_final : '-'),
  },
  {
    id: 'qre',
    label: 'QRE',
    sortable: true,
    sortId: 'qre',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide: !permissionMap?.['qre']?.read && !permissionMap?.['qre']?.edit,
    render: (row: Project) => (row.qre ? row.qre : '-'),
  },
  {
    id: 'comments',
    editId: 'comments',
    label: 'Comments',
    sortable: true,
    sortId: 'comments',
    width: 200,
    hide:
      !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
  },
  {
    id: 'modified_datetime',
    label: 'Last Modified',
    sortable: true,
    sortId: 'modified_datetime',
    width: 190,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row: Project) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];

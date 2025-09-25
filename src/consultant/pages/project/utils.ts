import { costDisplay } from '../../../common-utils';

export interface projectDetails {
  rid: string;
  r_number: string;
  eid: string | null;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  project_rid: string;
  project_code: string;
  industry_rid: string | null;
  industry_name: string | null;
  fiscal_year: number;
  project_name: string;
  program_name: string | null;
  project_type_rid: string;
  project_classification_rid: string | null;
  project_classification_other: string | null;
  project_client_group: string | null;
  project_group: string | null;
  auto_send_ai_interaction: boolean;
  account_rid: string;
  country_rid: string | null;
  region_rid: string | null;
  currency_rid: string;
  max_ai_interaction: number;
  expiry_duration: string | null;
  auto_access_rd: boolean;
  status_rid: string;
  project_startdate: string | null;
  project_enddate: string | null;
  fiscal_start_date: string | null;
  fiscal_end_date: string | null;
  total_fte_prj: number | null;
  total_fte_from_prj_res: number | null;
  total_fte_from_tasks: number | null;
  total_subcon_prj: number | null;
  total_subcon_from_prj_res: number | null;
  total_subcon_from_tasks: number | null;
  total_nonlabor_prj: number | null;
  total_nonlabor_from_prj_res: number | null;
  total_resources_prj: number | null;
  total_resources_from_prj_res: number | null;
  total_resources_from_tasks: number | null;
  organistaion_name: string | null;

  total_effort_prj: number | null;
  total_effort_fte_prj: number | null;
  total_effort_subcon_prj: number | null;
  total_effort_from_prj_res: number | null;
  total_effort_fte_from_prj_res: number | null;
  total_effort_subcon_from_prj_res: number | null;
  total_effort_from_tasks: number | null;
  total_effort_fte_from_tasks: number | null;
  total_effort_subcon_from_tasks: number | null;

  total_cost_prj: number | null;
  total_cost_fte_prj: number | null;
  total_cost_subcon_prj: number | null;
  total_cost_nonlabor_prj: number | null;
  total_cost_from_prj_res: number | null;
  total_cost_fte_from_prj_res: number | null;
  total_cost_subcon_from_prj_res: number | null;
  total_cost_nonlabor_from_prj_res: number | null;
  total_cost_from_tasks: number | null;
  total_cost_fte_from_tasks: number | null;
  total_cost_subcon_from_tasks: number | null;

  total_cost_prj_blended: number | null;
  total_cost_fte_prj_blended: number | null;
  total_cost_subcon_prj_blended: number | null;
  total_cost_from_prj_res_blended: number | null;
  total_cost_fte_from_prj_res_blended: number | null;
  total_cost_subcon_from_prj_res_blended: number | null;
  total_cost_from_tasks_blended: number | null;
  total_cost_fte_from_tasks_blended: number | null;
  total_cost_subcon_from_tasks_blended: number | null;

  blended_rate_fte: number | null;
  blended_rate_subcon: number | null;

  rd_percent_potential_ai: number | null;
  rd_percent_adjustment: number | null;
  rd_percent_final: number | null;

  qre_fte: number | null;
  qre_subcon: number | null;
  qre_nonlabor: number | null;
  qre_final: number | null;

  rd_credits_fte_fed_level: number | null;
  rd_credits_subcon_fed_level: number | null;
  rd_credits_nonlabor_fed_level: number | null;
  rd_credits_fed_level: number | null;
  rd_credits_total: number | null;

  interaction_cc_list: string[] | null;
  assessment_status: string | null;
  claim_status: string | null;
  comments: string | null;
  project_description: string | null;

  total_fte: number | null;
  total_subcon: number | null;
  total_cost: number | null;
  total_effort: number | null;
  total_effort_fte: number | null;
  total_effort_subcon: number | null;
  total_cost_fte: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;

  country: string | null;
  region: string | null;
  currency: string;

  keyContact: string[]; // Replace with `KeyContact[]` if you have the type

  country_name: string | null;
  country_code: string | null;
  region_name: string | null;

  currency_name: string;
  currency_symbol: string;

  status_name: string;
  project_type_name: string;
  classification_name: string | null;

  account_name: string;
  account_status: string;

  created_name: string;
  modified_name: string;

  industry_rid_name?: string;
}

export interface ProjectQreAdjustmentResponse {
  rd_percent_potential_ai: string | null;
  rd_percent_adjustment: string | null;
  rd_percent_final: string | null;
  qre_fte: string | null;
  qre_subcon: string | null;
  qre_nonlabor: string | null;
  qre_final: string | null;
}

interface DisplayColumn {
  items: Array<{
    label: string;
    key?: string;
    value: string | React.ReactNode;
    className?: string;
    hide?: boolean;
    editable?: boolean;
    onSave?: (value: string) => void;
    showHyphenForEmptyValue?: boolean;
  }>;
}

export const transformProjectData = (
  project: projectDetails
): DisplayColumn[] => {
  const status = project?.status_name?.toLowerCase() || 'active';
  const currencySymbol = project?.currency_symbol;
  const aiEstimatedQre = project?.rd_percent_potential_ai;
  const adjustmentFactor = project?.rd_percent_adjustment;

  return [
    {
      items: [
        {
          label: 'Project ID',
          value: project?.r_number || '-',
          className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
        },
        {
          label: 'Industry',
          value: project?.industry_name || project?.industry_rid_name || '-',
        },
        {
          label: 'FTE Cost',
          value: project?.total_cost_fte
            ? costDisplay(project.total_cost_fte, currencySymbol)
            : '-',
        },
        {
          label: 'QRE Percent Potential',
          value: aiEstimatedQre ? `${aiEstimatedQre}%` : '-',
          key: 'ai_estimated_qre',
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Name',
          value: project?.project_name || '-',
        },
        {
          label: 'Business Name',
          value: project?.organistaion_name || '-',
        },
        {
          label: 'SubCon Cost',
          value: project?.total_cost_subcon
            ? costDisplay(project.total_cost_subcon, currencySymbol)
            : '-',
        },
        {
          label: 'QRE Percent Adjustment',
          key: 'adjustment_factor',
          value: adjustmentFactor ? `${adjustmentFactor}%` : '',
          editable: aiEstimatedQre ? true : false,
        },
      ],
    },
    {
      items: [
        { label: 'Account Name', value: project?.account_name || '-' },
        {
          label: 'Fiscal Start',
          value: project?.fiscal_start_date || '-',
        },
        {
          label: 'Non-Labor Cost',
          value: project?.total_cost_nonlabor
            ? costDisplay(project.total_cost_nonlabor, currencySymbol)
            : '-',
        },
        {
          label: 'QRE Percent Final',
          value: project?.rd_percent_final
            ? `${project.rd_percent_final}%`
            : '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Country',
          value: `${project?.country_code || '-'}`,
        },
        {
          label: 'Fiscal End',
          value: project?.fiscal_end_date || '-',
        },
        {
          label: 'Project Cost',
          value: project?.total_cost
            ? costDisplay(project.total_cost, currencySymbol)
            : '-',
        },
        {
          label: 'QRE Final',
          value: costDisplay(project?.qre_final, currencySymbol),
        },
      ],
    },
    {
      items: [
        {
          label: 'Currency',
          value: project?.currency_name || '-',
        },
        {
          label: '',
          value: '',
          showHyphenForEmptyValue: false,
        },
        {
          label: 'Project Effort (Hours)',
          value: project?.total_effort?.toString() || '-',
        },
      ],
    },
  ];
};

export const mergeAdjustmentResponse = (
  project: projectDetails,
  adjustmentResponse: ProjectQreAdjustmentResponse
) => {
  if (!adjustmentResponse) return project;

  return {
    ...project,
    rd_percent_potential_ai: adjustmentResponse.rd_percent_potential_ai,
    rd_percent_adjustment: adjustmentResponse.rd_percent_adjustment,
    rd_percent_final: adjustmentResponse.rd_percent_final,
    qre_fte: adjustmentResponse.qre_fte,
    qre_subcon: adjustmentResponse.qre_subcon,
    qre_nonlabor: adjustmentResponse.qre_nonlabor,
    qre_final: adjustmentResponse.qre_final,
  };
};

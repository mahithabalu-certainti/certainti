/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProjectResponse {
  project: projectDetails;
}
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

  interaction_cc_list: any[] | null;
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

  keyContact: any[]; // Replace with `KeyContact[]` if you have the type

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

interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
  }>;
}
export const transformProjectData = (
  data: ProjectResponse
): DisplayColumn[] => {
  const project = data?.project;
  const status = project?.status_name.toLowerCase();
  return [
    {
      items: [
        {
          label: 'Project ID',
          value: project?.r_number || '-',
          className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
        },
        // {
        //   label: 'Project Code',
        //   value: project?.project_code || '-',
        // },
      ],
    },
    {
      items: [
        // {
        //   label: 'Project ID',
        //   value: project?.r_number || '-',
        //   className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
        // },
        {
          label: 'Project Code',
          value: project?.project_code || '-',
        },
      ],
    },

    {
      items: [
        // {
        //   label: 'Name',
        //   value: project?.project_name || '-',
        // },
        { label: 'Account Name', value: project?.account_name },
      ],
    },
    {
      items: [
        {
          label: 'Country / Currency',
          value: `${project?.country_code || '-'} / ${project?.currency_name || '-'}`,
        },
      ],
    },

    {
      items: [
        {
          label: 'Industry',
          value: project?.industry_name || project?.industry_rid_name || '-',
        },
        // {
        //   label: 'Status',
        //   value:
        //     project?.project_status.charAt(0).toUpperCase() +
        //     project?.project_status.slice(1),
        // },
      ],
    },
  ];
};

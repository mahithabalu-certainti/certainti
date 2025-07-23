import { ProjectFinancialSummaryResponse } from '../../../../types';

export const mockProjectFinancialSummay: ProjectFinancialSummaryResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Data Fetched Successfully',
  data: {
    resource_metrics: [
      {
        rid: 'resmetric0000001',
        metric: 'No Of Resources',
        fte: 45,
        sub_con: 12,
        non_labor: 2,
      },
    ],
    detailed_metrics: [
      {
        rid: 'detmetric0000001',
        metric_name: 'FTE Hours',
        project_level: 3000,
        project_resource_level: 'Not Available',
        project_task_level: 3500,
      },
      {
        rid: 'detmetric0000002',
        metric_name: 'FTE Cost',
        project_level: 95320,
        project_resource_level: 90000,
        project_task_level: 91000,
      },
      {
        rid: 'detmetric0000003',
        metric_name: 'Sub Con Hours',
        project_level: 1026,
        project_resource_level: 4200,
        project_task_level: 4600,
      },
      {
        rid: 'detmetric0000004',
        metric_name: 'Sub Con Cost',
        project_level: 60000,
        project_resource_level: 62300,
        project_task_level: 42000,
      },
      {
        rid: 'detmetric0000005',
        metric_name: 'Non Labor Cost',
        project_level: 900,
        project_resource_level: 858,
        project_task_level: 'Not Applicable',
      },
    ],
    rd_percent: [
      {
        rid: 'rdpercent000001',
        rd_percent_potential: '60%',
        rd_percent_adjustment: '+5%',
        rd_percent_final: '65%',
      },
    ],
    qre: [
      {
        rid: 'qre000000000001',
        qre_fte: 58500,
        qre_sub_con: 27300,
        qre_non_labor: 558,
        qre_final: 86358,
      },
    ],
    rd_credits: [
      {
        rid: 'rdcredits000001',
        rd_credits_fte: 37000,
        rd_credits_sub_con: 13500,
        rd_credits_non_labor: 200,
        rd_credits_total: 50700,
      },
    ],
    claim_status: {
      rid: 'claimstatus00001',
      status: 'Qualified',
    },
  },
};

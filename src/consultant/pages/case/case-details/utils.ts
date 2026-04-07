import { costDisplay } from '../../../../common-utils';
import { CaseDetails } from '../../../types/cases';

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

export const transformCaseData = (
  cases: CaseDetails,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap: Record<string, { read: boolean; edit: boolean }>
): DisplayColumn[] => {
  const currencySymbol = cases?.currency_symbol || '$';

  return [
    {
      items: [
        {
          label: 'Account ID',
          value: cases?.account_rnumber || '-',
          hide:
            !accountPermissionMap?.['r_number']?.read &&
            !accountPermissionMap?.['r_number']?.edit,
        },

        {
          label: 'Case Owner',
          value: cases?.case_owner_name || '-',
          hide:
            !permissionMap?.['case_owner_rid']?.edit &&
            !permissionMap?.['case_owner_rid']?.read,
        },

        {
          label: 'No. of Projects',
          value: cases?.case_total_projects?.toString() || '-',
          hide:
            !permissionMap?.['case_total_projects']?.edit &&
            !permissionMap?.['case_total_projects']?.read,
        },

        {
          label: 'Total Project Cost',
          value: cases?.case_total_project_cost
            ? costDisplay(cases.case_total_project_cost, currencySymbol)
            : '-',
          hide:
            !permissionMap?.['case_total_project_cost']?.edit &&
            !permissionMap?.['case_total_project_cost']?.read,
        },
      ],
    },
    {
      items: [
        {
          label: 'Account Name',
          value: cases?.account_name || '-',
          hide:
            !accountPermissionMap?.['account_name']?.read &&
            !accountPermissionMap?.['account_name']?.edit,
        },

        {
          label: 'Fiscal Year',
          value: 'FY-' + cases?.fiscal_year?.toString() || '-',
          hide:
            !permissionMap?.['fiscal_year']?.edit &&
            !permissionMap?.['fiscal_year']?.read,
        },

        {
          label: 'No. of Qualified Projects',
          value: cases?.case_total_qualified_projects || '-',
          hide:
            !permissionMap?.['case_total_projects']?.edit &&
            !permissionMap?.['case_total_projects']?.read,
        },

        {
          label: 'Total Qualified Project Cost',
          value: cases?.case_total_qualified_project_cost
            ? costDisplay(
                cases.case_total_qualified_project_cost,
                currencySymbol
              )
            : '-',
          hide:
            !permissionMap?.['case_total_qualified_project_cost']?.edit &&
            !permissionMap?.['case_total_qualified_project_cost']?.read,
        },
      ],
    },
    {
      items: [
        {
          label: 'Case ID',
          value: cases?.r_number || '-',
          hide:
            !permissionMap?.['r_number']?.edit &&
            !permissionMap?.['r_number']?.read,
        },

        {
          label: 'Country',
          value: cases?.country_name || '-',
          hide:
            !accountPermissionMap?.['country_rid']?.read &&
            !accountPermissionMap?.['country_rid']?.edit,
        },

        {
          label: 'Total QRE',
          value: cases?.case_total_qre_cost
            ? costDisplay(cases.case_total_qre_cost, currencySymbol)
            : '-',
          hide:
            !permissionMap?.['case_total_qre_cost']?.edit &&
            !permissionMap?.['case_total_qre_cost']?.read,
        },

        {
          label: 'Total RD Credits',
          value: cases?.final_credit
            ? costDisplay(cases.final_credit, currencySymbol)
            : '-',
          hide:
            !permissionMap?.['total_rd_credits']?.edit &&
            !permissionMap?.['total_rd_credits']?.read,
        },
      ],
    },
    {
      items: [
        {
          label: 'Case Name',
          value: cases?.case_name || '-',
          hide:
            !permissionMap?.['case_name']?.edit &&
            !permissionMap?.['case_name']?.read,
        },

        {
          label: 'Currency',
          value: cases?.currency_code || '-',
          hide:
            !accountPermissionMap?.['currency_rid']?.read &&
            !accountPermissionMap?.['currency_rid']?.edit,
        },

        {
          label: 'Case Status',
          value: cases?.status_name || '-',
          className: (() => {
            const status = cases?.status_name;
            if (!status) return '';
            if (status === 'Closed') return 'text-[#3EA72F] font-semibold';
            return '';
          })(),
          hide:
            !permissionMap?.['status_rid']?.edit &&
            !permissionMap?.['status_rid']?.read,
        },

        {
          label: 'Case Progress Percentage',
          value: cases.case_completion_percentage
            ? `${cases.case_completion_percentage}%`
            : '-',
          hide:
            !permissionMap?.['case_progress_percentage']?.edit &&
            !permissionMap?.['case_progress_percentage']?.read,
        },
      ],
    },
    {
      items: [
        {
          label: 'Filing Type',
          value: cases?.filing_type_name || '-',
          hide:
            !permissionMap?.['filing_type_rid']?.edit &&
            !permissionMap?.['filing_type_rid']?.read,
        },
        {
          label: '',
          value: '',
        },
        {
          label: 'Submission Date',
          value: cases?.planned_submission_date || '-',
          hide:
            !permissionMap?.['planned_submission_date']?.edit &&
            !permissionMap?.['planned_submission_date']?.read,
        },
        {
          label: 'Case Progress',
          value: cases?.case_progress || '-',
          className: (() => {
            const progress = cases?.case_progress;
            if (!progress) return '';
            if (progress === 'On Track') return 'text-[#3EA72F] font-semibold';
            if (progress === 'At Risk') return 'text-[#FF9800] font-semibold';
            if (progress === 'Critical') return 'text-[#FF3C03] font-semibold';
            return '';
          })(),
          hide:
            !permissionMap?.['case_progress']?.edit &&
            !permissionMap?.['case_progress']?.read,
        },
      ],
    },
  ];
};

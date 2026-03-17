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

export const transformCaseData = (cases: CaseDetails): DisplayColumn[] => {
  const currencySymbol = cases?.currency_symbol || '$';

  return [
    {
      items: [
        {
          label: 'Account ID',
          value: cases?.account_rnumber || '-',
        },

        {
          label: 'Case Owner',
          value: cases?.case_owner_name || '-',
        },

        {
          label: 'No. of Projects',
          value: cases?.case_total_projects?.toString() || '-',
        },

        {
          label: 'Total Project Cost',
          value: cases?.case_total_project_cost
            ? costDisplay(cases.case_total_project_cost, currencySymbol)
            : '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Account Name',
          value: cases?.account_name || '-',
        },

        {
          label: 'Fiscal Year',
          value: 'FY-' + cases?.fiscal_year?.toString() || '-',
        },

        {
          label: 'No. of Qualified Projects',
          value: cases?.case_total_qualified_projects || '-',
        },

        {
          label: 'Total Qualified Project Cost',
          value: cases?.case_total_qualified_project_cost
            ? costDisplay(
                cases.case_total_qualified_project_cost,
                currencySymbol
              )
            : '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Case ID',
          value: cases?.r_number || '-',
        },

        {
          label: 'Country',
          value: cases?.country_name || '-',
        },

        {
          label: 'Total QRE',
          value: cases?.case_total_qre_cost
            ? costDisplay(cases.case_total_qre_cost, currencySymbol)
            : '-',
        },

        {
          label: 'Total RD Credits',
          value: cases?.final_credit
            ? costDisplay(cases.final_credit, currencySymbol)
            : '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Case Name',
          value: cases?.case_name || '-',
        },

        {
          label: 'Currency',
          value: cases?.currency_code || '-',
        },

        {
          label: 'Case Status',
          value: cases?.status_name || '-',
        },

        {
          label: 'Case Progress Percentage',
          value: cases.case_completion_percentage
            ? `${cases.case_completion_percentage}%`
            : '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Filing Type',
          value: cases?.filing_type_name || '-',
        },
        {
          label: '',
          value: '',
        },
        {
          label: 'Submission Date',
          value: cases?.planned_submission_date || '-',
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
        },
      ],
    },
  ];
};

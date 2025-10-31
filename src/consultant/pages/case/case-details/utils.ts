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
  const status = cases?.status_name?.toLowerCase() || 'active';

  const currencySymbol = cases?.currency_code;

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
          value: cases?.fiscal_year?.toString() || '-',
        },

        {
          label: 'No. of Qualified Projects',
          value: '-',
        },

        {
          label: 'Total Qualified Project Cost',
          value: '-',
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
          value: cases?.case_total_rd_cost
            ? costDisplay(cases.case_total_rd_cost, currencySymbol)
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
          className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
        },

        {
          label: 'Case % Completion',
          value: '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Filing Type',
          value: cases?.filing_type_name || '-',
        },
      ],
    },
  ];
};

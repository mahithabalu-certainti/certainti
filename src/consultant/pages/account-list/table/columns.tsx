import { costDisplay, REGEX_PATTERNS } from '../../../../common-utils';
import { ListOption } from '../../../../components/table/types';
import { AccountColumn, AccountList } from '../../../types/account';
import { formatNumberWithCommas } from './utils';

export const getAccountColumns = (
  onClick: (row: AccountList) => void,
  countryOptions: ListOption[],
  industryOptions: ListOption[]
): AccountColumn<AccountList>[] => [
  {
    id: 'account_name',
    sortId: 'account_name',
    label: 'Account Name',
    width: 250,
    sortable: true,
    editable: true,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: AccountList & { _level?: number }) => {
      const isClickable = row._level === undefined || row._level < 2;

      return isClickable ? (
        <span
          onClick={() => onClick(row)}
          className={`cursor-pointer ${row._level === 1 ? '!text-[#1755E7] !underline !text-[13px] !font-semibold' : ''}`}
        >
          {row.account_name}
        </span>
      ) : (
        <span className='cursor-default !no-underline !text-[13px] !font-semibold !text-[#425A76]'>
          {row.account_name}
        </span>
      );
    },
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_ACCOUNT_NAME_REGEX,
          errorMessage: 'Name must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_ACCOUNT_NAME_REGEX,
          errorMessage: 'Max length exceeded',
        },
        {
          regex: REGEX_PATTERNS.ACCOUNT_NAME,
          errorMessage:
            "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
        },
      ],
    },
  },
  {
    id: 'industry',
    sortId: 'industry',
    label: 'Industry',
    width: 200,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      renderValue: true,
      placeholder: 'Choose Industry',
      options: industryOptions,
    },
    render: (row: AccountList) => row.industry?.industry_name || '-',
  },
  {
    id: 'country',
    sortId: 'country',
    label: 'Country',
    width: 150,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: false,
      renderValue: true,
      placeholder: 'Choose Country',
      options: countryOptions,
    },
    render: (row: AccountList) => row.country?.country_name || '-',
  },
  {
    id: 'total_projects',
    sortId: 'total_projects',
    label: 'Total Projects',
    width: 150,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'total_project_hours',
    sortId: 'total_project_hours',
    label: 'Total Project Hours',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: AccountList) =>
      formatNumberWithCommas(row.total_project_hours),
  },
  {
    id: 'total_project_cost',
    sortId: 'total_project_cost',
    label: 'Total Cost',
    width: 150,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: AccountList) =>
      costDisplay(row.total_project_cost, row.currency?.currency_symbol),
  },
  {
    id: 'qualifying_project_hours_fed',
    sortId: 'qualifying_project_hours_fed',
    label: 'Estimated R&D Hours',
    width: 200,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'qualifying_project_qre_fed',
    sortId: 'qualifying_project_qre_fed',
    label: 'QRE',
    width: 140,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: AccountList) =>
      costDisplay(
        row.qualifying_project_qre_fed,
        row.currency?.currency_symbol
      ),
  },
  {
    id: 'qualifying_project_rd_credits_fed',
    sortId: 'qualifying_project_rd_credits_fed',
    label: 'Estimated R&D Credits',
    width: 200,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: AccountList) =>
      costDisplay(
        row.qualifying_project_rd_credits_fed,
        row.currency?.currency_symbol
      ),
  },
  {
    id: 'total_projects_rd_credits',
    sortId: 'total_projects_rd_credits',
    label: 'Actual R&D Credits',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: AccountList) =>
      costDisplay(row.total_projects_rd_credits, row.currency?.currency_symbol),
  },
  {
    id: 'finance_executive',
    sortId: 'finance_executive',
    label: 'Finance Executive',
    width: 200,
    sortable: true,
  },
  {
    id: 'finance_lead',
    sortId: 'finance_lead',
    label: 'Finance Lead',
    width: 160,
    sortable: true,
  },
  {
    id: 'professional_services_consultant',
    sortId: 'professional_services_consultant',
    label: 'Professional Services Consultant',
    width: 250,
    sortable: true,
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Account ID',
    width: 120,
    sortable: true,
  },
];

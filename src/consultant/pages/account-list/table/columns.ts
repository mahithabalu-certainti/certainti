import { REGEX_PATTERNS } from '../../../../common-utils';
import { ListOption } from '../../../../components/table/types';
import { AccountColumn, AccountList } from '../../../types/account';

export const getAccountColumns = (
  countryOptions: ListOption[],
  industryOptions: ListOption[]
): AccountColumn<AccountList>[] => [
  {
    id: 'account_name',
    sortId: 'account_name',
    label: 'Account Name',
    width: '250px',
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
    width: '200px',
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Industry',
      options: industryOptions,
    },
  },
  {
    id: 'country',
    sortId: 'country',
    label: 'Country',
    width: '150px',
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Country',
      options: countryOptions,
    },
  },
  {
    id: 'total_projects',
    sortId: 'total_projects',
    label: 'Total Projects',
    width: '150px',
    sortable: true,
  },
  {
    id: 'total_project_hours',
    sortId: 'total_project_hours',
    label: 'Total Project Hours',
    width: '180px',
    sortable: true,
  },
  {
    id: 'total_project_cost',
    sortId: 'total_project_cost',
    label: 'Total Cost',
    width: '150px',
    sortable: true,
  },
  {
    id: 'qualifying_project_hours_fed',
    sortId: 'qualifying_project_hours_fed',
    label: 'Estimated R&D Hours',
    width: '200px',
    sortable: true,
  },
  {
    id: 'qualifying_project_qre_fed',
    sortId: 'qualifying_project_qre_fed',
    label: 'QRE',
    width: '140px',
    sortable: true,
  },
  {
    id: 'qualifying_project_rd_credits_fed',
    sortId: 'qualifying_project_rd_credits_fed',
    label: 'Estimated R&D Credits',
    width: '200px',
    sortable: true,
  },
  {
    id: 'total_projects_rd_credits',
    sortId: 'total_projects_rd_credits',
    label: 'Actual R&D Credits',
    width: '180px',
    sortable: true,
  },
  {
    id: 'finance_executive',
    sortId: 'finance_executive',
    label: 'Finance Executive',
    width: '200px',
    sortable: true,
  },
  {
    id: 'finance_lead',
    sortId: 'finance_lead',
    label: 'Finance Lead',
    width: '160px',
    sortable: true,
  },
  {
    id: 'professional_services_consultant',
    sortId: 'professional_services_consultant',
    label: 'Professional Services Consultant',
    width: '250px',
    sortable: true,
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Account ID',
    width: '120px',
    sortable: true,
  },
];

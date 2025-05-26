export interface AccountData {
  accountById: {
    rid: string;
    r_number: string;
    account_name: string;
    status: string;
    is_parent: boolean;
    country: {
      country_name: string;
    };
    currency: {
      currency_code: string;
    };
    parent_account: {
      account_name: string;
    };
    industry: {
      industry_name: string;
    };
    primary_contact_name: string;
    parent_account_name: string;
  };
}

interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
  }>;
}

interface InputAccountDetails {
  rid: string;
  account_rid: string;
  tax_claim_level: string | null;
  max_ai_interactions: number;
  autosend_interaction: boolean;
  fiscal_start_date: string;
  fiscal_end_date: string;
  interaction_cc_list: string | null;
  blended_rate_fte: string | null;
  blended_rate_subcon: string | null;
  created_by: string;
  modified_by: string;
  primary_contact_email: string;
  primary_contact_number: string;
  finance_poc_name: string;
  finance_poc_email: string;
  finanace_poc_number: string;
  website: string | null;
  project_manager: string;
  data_residency: string | null;
  data_storage: string;
  auto_access_rd: boolean;
  created_datetime: string;
  modified_datetime: string;
}

interface InputData {
  accountById: InputAccountById;
  accountDetails: InputAccountDetails;
}

interface OutputData {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  currency: string;
  status: string;
  primaryContact: string;
  parentAccountID: string | null;
  annualRevenue: string;
}

const getValueOrDefault = (
  value?: string | number | null,
  defaultValue = 'NA'
): string => {
  return value?.toString() || defaultValue;
};

export const transformAccountData = (data: AccountData): DisplayColumn[] => {
  const account = data?.accountById;

  return [
    {
      items: [
        { label: 'Account ID', value: account?.r_number },
        {
          label: 'Country',
          value: getValueOrDefault(account?.country?.country_name),
        },
      ],
    },
    {
      items: [
        {
          label: 'Parent Name',
          value: getValueOrDefault(account?.parent_account?.account_name),
        },
        {
          label: 'Currency',
          value: getValueOrDefault(account?.currency?.currency_code),
        },
      ],
    },
    {
      items: [
        {
          label: 'Account Name',
          value: getValueOrDefault(account?.account_name),
        },
        {
          label: 'Is Parent Account',
          value: account?.is_parent ? 'Yes' : 'No',
        },
      ],
    },
    {
      items: [
        {
          label: 'Industry',
          value: getValueOrDefault(account?.industry?.industry_name),
        },
        {
          label: 'Status',
          value:
            account?.status.charAt(0).toUpperCase() + account?.status.slice(1),
        },
      ],
    },
  ];
};

interface InputAccountById {
  rid: string;
  r_number: string;
  account_name: string;
  account_description: string | null;
  eid: string | null;
  status: string;
  is_parent: boolean;
  annual_revenue: string;
  region: string;
  storage_type: string;
  parent_account_rid: string | null;
  database_connection_rid: string | null;
  country_rid: string;
  currency_rid: string;
  industry: string;
  primary_contact_name: string;
  created_datetime: string;
  modified_datetime: string;
  child_accounts: unknown[]; // Could be further typed if structure is known
  country: {
    country_name: string;
  };
  currency: {
    currency_code: string;
  };
  parent_account: {
    account_name: string;
    rid: string;
  } | null;
}

export interface accountByIdProps {
  account_name: string;
  industry: {
    industry_name: string;
  };
  business_details: string;
  is_parent: boolean;
  parent_account: string;
  status: string;
  annual_revenue: string;
  country: {
    country_name: string;
  };
  region: {
    region_name: string;
  };
  currency: {
    currency_code: string;
  };
  r_number: string;
  comments: string;
}

export interface accountByDetailsProps {
  account_rid: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string;
  modified_by: string;
  fiscal_start_date: string;
  fiscal_end_date: string;
  autosend_interaction: string;
  max_ai_interactions: string;
  auto_access_rd: string;
  blended_rate_fte: string;
  blended_rate_subcon: string;
  data_residency: string;
  website: string;
  project_manager: string;
  keyContacts: KeyContactProps[];
  business_details: string;
}

export interface KeyContactProps {
  r_number?: string;
  key_contact_name?: string;
  role_name?: string;
  key_contact_email?: string;
  is_primary_contact?: boolean;
  include_in_communication?: boolean;
  status?: string;
}

export interface accountDetailsProps {
  accountById?: accountByIdProps;
  accountDetails?: accountByDetailsProps;
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function convertAccountDataForEdit(input: InputData): OutputData {
  return {
    accountName: input.accountById.account_name,
    accountId: input.accountById.rid,
    parentAccount: input.accountById.parent_account?.account_name || null,
    accountNumber: input.accountById.r_number,
    industry: input.accountById.industry,
    country: input.accountById.country.country_name,
    currency: input.accountById.currency.currency_code,
    status: capitalizeFirstLetter(input.accountById.status),
    primaryContact: input.accountById.primary_contact_name,
    parentAccountID: input.accountById.parent_account_rid,
    annualRevenue: input.accountById.annual_revenue,
  };
}

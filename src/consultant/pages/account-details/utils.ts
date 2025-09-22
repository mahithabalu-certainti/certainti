import { formatMonthDay } from '../../../common-utils';
import { AccountDetailsResponse } from '../../types';
import { AttachmentList } from '../../types/attachment';

export interface AccountData {
  accountById: {
    rid: string;
    r_number: string;
    account_name: string;
    status: {
      status_name: string;
    };
    is_parent: boolean;
    country: {
      country_name: string;
      country_code: string;
    };
    currency: {
      currency_code: string;
    };
    parent_account: {
      account_name: string;
    };
    industry_rid_name: string;
    primary_contact_name: string;
    parent_account_name: string;
  };
}
export interface ResourceData {
  data: {
    resourceDetails: {
      resource_name: string;
      resource_code: string;
      resource_type_rid: string;
      resource_type_name: string;
      resource_role: string;
      resource_designation: string;
      resource_orgname: string;
      status_name: string;
    };
  };
}

export interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
    hide?: boolean;
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
  defaultValue = '-'
): string => {
  return value?.toString() || defaultValue;
};

export const transformAccountData = (
  data: AccountDetailsResponse,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): DisplayColumn[] => {
  const account = data?.accountById;
  const accountDetails = data?.accountDetails;
  const status = account?.status?.status_name?.toLowerCase();

  return [
    {
      items: [
        {
          label: 'Account ID',
          value: account?.r_number || '-',
          className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
          hide:
            !permissionMap?.['r_number']?.read &&
            !permissionMap?.['r_number']?.edit,
        },
        {
          label: 'Industry',
          value: getValueOrDefault(account?.industry_rid_name),
          hide:
            !permissionMap?.['industry_rid']?.read &&
            !permissionMap?.['industry_rid']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Name',
          value: getValueOrDefault(account?.account_name),
          hide:
            !permissionMap?.['account_name']?.read &&
            !permissionMap?.['account_name']?.edit,
        },
        {
          label: 'Business Name',
          value: getValueOrDefault(account?.organisation_name),
          hide:
            !permissionMap?.['organisation_name']?.read &&
            !permissionMap?.['organisation_name']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Parent Name',
          value: getValueOrDefault(account?.parent_account?.account_name),
          hide:
            !permissionMap?.['parent_account_rid']?.read &&
            !permissionMap?.['parent_account_rid']?.edit,
        },
        {
          label: 'Fiscal Start',
          value: accountDetails?.fiscal_start_date
            ? formatMonthDay(accountDetails?.fiscal_start_date)
            : '-',
          // className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
          hide:
            !permissionMap?.['fiscal_start_date']?.read &&
            !permissionMap?.['fiscal_start_date']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Country',
          value: `${getValueOrDefault(account?.country?.country_code)}`,
          hide:
            !permissionMap?.['country_rid']?.read &&
            !permissionMap?.['country_rid']?.edit,
        },
        {
          label: 'Fiscal End',
          value: accountDetails?.fiscal_end_date
            ? formatMonthDay(accountDetails?.fiscal_end_date)
            : '-',
          // className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
          hide:
            !permissionMap?.['fiscal_end_date']?.read &&
            !permissionMap?.['fiscal_end_date']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: ' Currency',
          value: getValueOrDefault(account?.currency?.currency_code),
          hide:
            !permissionMap?.['currency_rid']?.read &&
            !permissionMap?.['currency_rid']?.edit,
        },
      ],
    },
  ];
};
export const transformResourceData = (
  resource: ResourceData,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): DisplayColumn[] => {
  const resourceData = resource?.data?.resourceDetails;
  const status = resourceData?.status_name;

  return [
    {
      items: [
        {
          label: 'Resource Code',
          value: getValueOrDefault(resourceData?.resource_code),
          className: `${status === 'Active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
          hide:
            !permissionMap?.['resource_code']?.read &&
            !permissionMap?.['resource_code']?.edit,
        },
        {
          label: 'Role',
          value: `${getValueOrDefault(resourceData?.resource_role)} `,
          hide:
            !permissionMap?.['resource_role']?.read &&
            !permissionMap?.['resource_role']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Name',
          value: getValueOrDefault(resourceData?.resource_name),
          hide:
            !permissionMap?.['resource_name']?.read &&
            !permissionMap?.['resource_name']?.edit,
        },
        {
          label: 'Designation',
          value: getValueOrDefault(resourceData?.resource_designation),
          hide:
            !permissionMap?.['resource_designation']?.read &&
            !permissionMap?.['resource_designation']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Resource Type',
          value: getValueOrDefault(resourceData?.resource_type_name),
          hide:
            !permissionMap?.['resource_type_rid']?.read &&
            !permissionMap?.['resource_type_rid']?.edit,
        },
        {
          label: '',
          value: '',
        },
      ],
    },
    {
      items: [
        {
          label: 'Resource Org Name',
          value: getValueOrDefault(resourceData?.resource_orgname),
          hide:
            !permissionMap?.['resource_orgname']?.read &&
            !permissionMap?.['resource_orgname']?.edit,
        },
        {
          label: '',
          value: '',
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
  rid: string;
  account_name: string;
  industry: {
    industry_name: string;
  };
  business_details: string;
  is_parent: boolean;
  parent_account: {
    account_name: string;
  };
  status: {
    status_name: string;
  };
  annual_revenue: string;
  country: {
    country_name: string;
  };
  region_details: {
    state_name: string;
  };
  currency: {
    currency_code: string;
    currency_symbol: string;
  };
  r_number: string;
  comments: string;
  created_datetime: string;
  modified_datetime: string;
  created_by: string;
  modified_by: string;
  organisation_name: string;
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
  is_send_interaction: boolean;
  project_manager: string;
  keyContacts: KeyContactProps[];
  business_details: string;
  data_storage: string;
  attachments: AttachmentList[];
}

export interface KeyContactProps {
  r_number?: string;
  key_contact_name?: string;
  role_name?: string;
  key_contact_email?: string;
  is_primary_contact?: boolean;
  include_in_communication?: boolean;
  interaction_cc_recipient?: boolean;
  status?: string;
  status_name?: string;
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

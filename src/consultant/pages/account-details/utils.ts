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
    industry: string;
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

export const transformAccountData = (data: AccountData): DisplayColumn[] => {
  const account = data?.accountById;

  return [
    {
      // Column 1 (15%)
      items: [
        { label: 'Account ID', value: account?.rid },
        { label: 'Country', value: account?.country?.country_name },
      ],
    },
    {
      // Column 2 (25%)
      items: [
        {
          label: 'Parent Name',
          value: account?.parent_account?.account_name || '-',
        },
        { label: 'Currency', value: account?.currency.currency_code },
      ],
    },
    {
      // Column 3 (15%)
      items: [
        { label: 'Account Number', value: account?.r_number },
        {
          label: 'Is Parent Account',
          value: account?.is_parent ? 'YES' : 'NO',
        },
      ],
    },
    {
      // Column 4 (20%)
      items: [
        { label: 'Account Name', value: account?.account_name },
        { label: 'Primary Contact', value: account?.primary_contact_name },
      ],
    },
    {
      // Column 5 (25%)
      items: [
        { label: 'Industry', value: account?.industry },
        {
          label: 'Status',
          value:
            account?.status.charAt(0).toUpperCase() + account?.status.slice(1),
        },
      ],
    },
  ];
};

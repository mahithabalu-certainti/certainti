/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
    hide?: boolean;
  }>;
}

// const getValueOrDefault = (
//   value?: string | number | null,
//   defaultValue = '-'
// ): string => {
//   return value?.toString() || defaultValue;
// };

export const transformInteractionData = (
  data: any
  //   permissionMap?: Record<string, { read: boolean; edit: boolean }>
): DisplayColumn[] => {
  const account = data?.accountById;
  const status = account?.status?.status_name?.toLowerCase();

  return [
    {
      items: [
        {
          label: 'Response ID',
          //   value: account?.r_number || '-',
          value: 'DOORESID001',
          className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
          //   hide:
          //     !permissionMap?.['r_number']?.read &&
          //     !permissionMap?.['r_number']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Name',
          value: 'New one',
          //   hide:
          //     !permissionMap?.['parent_account_rid']?.read &&
          //     !permissionMap?.['parent_account_rid']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Histroy ID',
          value: `DOORESID001`,
          //   hide:
          //     !permissionMap?.['country_rid']?.read &&
          //     !permissionMap?.['country_rid']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Response Date',
          value: '20-07-2024',
          //   hide:
          //     !permissionMap?.['industry_rid']?.read &&
          //     !permissionMap?.['industry_rid']?.edit,
        },
      ],
    },
  ];
};

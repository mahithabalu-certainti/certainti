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
  const interaction = data?.data;

  return [
    {
      items: [
        {
          label: 'Interaction ID',
          value: interaction?.interaction_rid || '-',
          // className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
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
          value: interaction?.project_name || '-',
          //   hide:
          //     !permissionMap?.['parent_account_rid']?.read &&
          //     !permissionMap?.['parent_account_rid']?.edit,
        },
      ],
    },
  ];
};

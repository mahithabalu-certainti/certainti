/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
    hide?: boolean;
  }>;
}
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

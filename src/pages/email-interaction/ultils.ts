import { HeaderData } from './interaction-qustions';

export interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
  }>;
}
export const transformInteractionData = (data: HeaderData): DisplayColumn[] => {
  const interaction = data;
  return [
    {
      items: [
        {
          label: 'Account Name',
          value: interaction?.accountName || '-',
        },
        {
          label: 'Project ID',
          value: interaction?.projectId || '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Account ID',
          value: interaction?.accountId || '-',
        },
        {
          label: 'Interaction ID',
          value: interaction?.interactionId || '-',
        },
      ],
    },

    {
      items: [
        {
          label: 'Project Code',
          value: interaction?.projectCode || '-',
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Name',
          value: interaction?.projectName || '-',
        },
      ],
    },
  ];
};

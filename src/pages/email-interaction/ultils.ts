import { HeaderData } from './interaction-qustions';

export interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
    hide?: boolean;
  }>;
}
export const transformInteractionData = (data: HeaderData, isAccountlevel?: boolean): DisplayColumn[] => {
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
          hide: isAccountlevel,
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
          label: 'Project Code',
          value: interaction?.projectCode || '-',
          hide: isAccountlevel,
        },
      ],
    },

    {
      items: [
        {
          label: 'Interaction ID',
          value: interaction?.interactionId || '-',
        },
        {
          label: 'Project Name',
          value: interaction?.projectName || '-',
          hide: isAccountlevel,
        },
      ],
    },
    {
      items: [
        {
          label: 'Fiscal Year',
          value: interaction?.fiscal_year || '-',
          hide: isAccountlevel,
        },
      ],
    },
  ];
};

import { RowData } from '../../../../../../components/table/types';
import { DisplayColumn } from '../../../../account-details/utils';

export interface InteractionHistoryAction extends RowData {
  rid: string;
  action: string;
  date: string;
}

export interface InteractionHistoryList extends RowData {
  rid: string;
  action: string;
  date: string;
}

export interface InteractionHistoryData {
  page: number;
  limit: number;
  total_records: number;
  data: {
    project_name: string | number | null | undefined;
    project_code: string | number | null | undefined;
    interaction_rnumber: string;
    response_source: string | null;
    interaction_source_name?: string | null;
    interaction_history: InteractionHistoryAction[];
  };
}

export const getValueOrDefault = (
  value?: string | number | null,
  defaultValue = '-'
): string => {
  return value?.toString() || defaultValue;
};

export const transformInteractionHistoryData = (
  interactionHistory: InteractionHistoryData
): DisplayColumn[] => {
  const nestedData = interactionHistory?.data;

  return [
    {
      items: [
        {
          label: 'Interaction ID',
          value: getValueOrDefault(nestedData?.interaction_rnumber),
        },
      ],
    },
    {
      items: [
        {
          label: 'Interaction Source',
          value: `${getValueOrDefault(nestedData?.interaction_source_name)} `,
        },
      ],
    },
  ];
};

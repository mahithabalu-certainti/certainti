import { DisplayColumn } from '../../../../account-details/utils';
import { RowData } from '../../../../../../components/table/types';

export interface InteractionHistoryAction extends RowData {
  rid: string;
  action: string;
  date: string;
}

export interface InteractionHistoryList extends RowData {
  rid: string;
  action: string;
  date: string;
  status_name?: string;
}

// Updated to reflect the actual API response structure
export interface InteractionHistoryData {
  page: number;
  limit: number;
  total_records: number;
  data: {
    interaction_rnumber: string;
    project_code: string;
    project_name: string;
    response_source: string | null;
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
  interactionHistory: InteractionHistoryData // This is the top-level data from the API response
): DisplayColumn[] => {
  const nestedData = interactionHistory?.data; // Access the nested 'data'

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
          label: 'Type',
          value: `${getValueOrDefault(nestedData?.response_source)} `,
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Code',
          value: getValueOrDefault(nestedData?.project_code),
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Name',
          value: getValueOrDefault(nestedData?.project_name),
        },
      ],
    },
  ];
};

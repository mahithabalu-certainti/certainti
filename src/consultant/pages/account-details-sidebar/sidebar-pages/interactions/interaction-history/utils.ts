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

export interface InteractionHistoryDetails {
  project_code: string;
  project_name: string;
  response_source: string;
  interaction_rnumber: string;
  interaction_history: InteractionHistoryAction[];
}

export interface InteractionHistoryData {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: InteractionHistoryDetails;
}

export const getValueOrDefault = (
  value?: string | number | null,
  defaultValue = '-'
): string => {
  return value?.toString() || defaultValue;
};

export const transformInteractionHistoryData = (
  interactionHistory: InteractionHistoryData
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>
): DisplayColumn[] => {
  const interactionHistoryData = interactionHistory?.data;

  return [
    {
      items: [
        {
          label: 'Interaction ID',
          value: getValueOrDefault(interactionHistoryData?.interaction_rnumber),
          // hide:
          //   !permissionMap?.['interaction_code']?.read &&
          //   !permissionMap?.['interaction_code']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Type',
          value: `${getValueOrDefault(interactionHistoryData?.response_source)} `,
          // hide:
          //   !permissionMap?.['interaction_type']?.read &&
          //   !permissionMap?.['interaction_type']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Code',
          value: getValueOrDefault(interactionHistoryData?.project_code),
          // hide:
          //   !permissionMap?.['interaction_subject']?.read &&
          //   !permissionMap?.['interaction_subject']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Name',
          value: getValueOrDefault(interactionHistoryData?.project_name),
          // hide:
          //   !permissionMap?.['interaction_priority']?.read &&
          //   !permissionMap?.['interaction_priority']?.edit,
        },
      ],
    },
  ];
};

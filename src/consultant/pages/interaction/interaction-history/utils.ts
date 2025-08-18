import { RowData } from '../../../../components/table/types';
import { DisplayColumn } from '../../account-details/utils';

export interface InteractionHistoryAction extends RowData {
  id: string;
  interaction_type: string;
  date: string;
}

export interface InteractionHistoryList extends RowData {
  rid: string;
  interaction_type: string;
  date: string;
}

export interface InteractionHistoryDetails {
  interaction_code: string;
  interaction_type: string;
  interaction_subject: string;
  interaction_priority: string;
  interaction_category_name: string;
  created_by_name: string;
  status_name: string;
  action: InteractionHistoryAction[];
}

export interface InteractionHistoryData {
  data: {
    interactionHistoryDetails: InteractionHistoryDetails;
  };
}

export const getValueOrDefault = (
  value?: string | number | null,
  defaultValue = '-'
): string => {
  return value?.toString() || defaultValue;
};

export const transformInteractionHistoryData = (
  interactionHistory: InteractionHistoryData,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): DisplayColumn[] => {
  const interactionHistoryData =
    interactionHistory?.data?.interactionHistoryDetails;
  const status = interactionHistoryData?.status_name;

  return [
    {
      items: [
        {
          label: 'Interaction ID',
          value: getValueOrDefault(interactionHistoryData?.interaction_code),
          className: `${status === 'Active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
          hide:
            !permissionMap?.['interaction_code']?.read &&
            !permissionMap?.['interaction_code']?.edit,
        },
        {
          label: 'Type',
          value: `${getValueOrDefault(interactionHistoryData?.interaction_type)} `,
          hide:
            !permissionMap?.['interaction_type']?.read &&
            !permissionMap?.['interaction_type']?.edit,
        },
      ],
    },
    {
      items: [
        {
          label: 'Project Code',
          value: getValueOrDefault(interactionHistoryData?.interaction_subject),
          hide:
            !permissionMap?.['interaction_subject']?.read &&
            !permissionMap?.['interaction_subject']?.edit,
        },
        {
          label: 'Project Name',
          value: getValueOrDefault(
            interactionHistoryData?.interaction_priority
          ),
          hide:
            !permissionMap?.['interaction_priority']?.read &&
            !permissionMap?.['interaction_priority']?.edit,
        },
      ],
    },
  ];
};

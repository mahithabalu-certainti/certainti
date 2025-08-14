import { InteractionHistoryData } from './utils';

export const mockInteractionHistory: InteractionHistoryData = {
  data: {
    interactionHistoryDetails: {
      interaction_code: 'INT001',
      interaction_type: 'Email Communication',
      interaction_subject: 'Project Status Update',
      interaction_priority: 'High',
      interaction_category_name: 'Status Update',
      created_by_name: 'John Smith',
      status_name: 'Active',
      action: [
        {
          id: '1',
          interaction_type: 'email',
          date: '',
        },
        {
          id: '2',
          interaction_type: 'phone',
          date: '',
        },
        {
          id: '3',
          interaction_type: 'email',
          date: '',
        },
      ],
    },
  },
};

// Mock permission map
export const mockPermissionMap: Record<
  string,
  { read: boolean; edit: boolean }
> = {
  interaction_code: { read: true, edit: false },
  interaction_type: { read: true, edit: true },
  interaction_subject: { read: true, edit: false },
  interaction_priority: { read: true, edit: false },
  interaction_category_rid: { read: true, edit: false },
  created_by_name: { read: true, edit: false },
};

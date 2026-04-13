import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const enumOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const dateOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getInteractionFilterFields = (
  interactionTypes: { option: string; value: string }[],
  interactionResponseSources: { option: string; value: string }[],
  interactionStatus: { option: string; value: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  fourPartPermissionMap: Record<string, { read: boolean; edit: boolean }>,
  assessmentSourceOptions: { option: string; value: string }[]
): FieldConfig[] => {
  return [
    {
      name: 'Interaction ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    // {
    //   name: 'Iteration',
    //   value: 'interaction_iteration',
    //   type: 'number',
    //   hide:
    //     !permissionMap?.['interaction_iteration']?.edit &&
    //     !permissionMap?.['interaction_iteration']?.read,
    // },
    {
      name: 'Assessment Type',
      value: 'interaction_assessment_source_rid',
      type: 'enum',
      options: assessmentSourceOptions,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['interaction_assessment_source_name']?.edit &&
        !permissionMap?.['interaction_assessment_source_name']?.read,
    },
    {
      name: 'Four Part Assessment ID',
      value: 'four_part_r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !fourPartPermissionMap?.['r_number']?.edit &&
        !fourPartPermissionMap?.['r_number']?.read,
    },
    // {
    //   name: 'Primary',
    //   value: 'is_primary',
    //   type: 'enum',
    //   options: [
    //     { option: 'Yes', value: 'true' },
    //     { option: 'No', value: 'false' },
    //   ],
    //   operatorOption: enumOptions,
    //   hide:
    //     !permissionMap?.['is_primary']?.edit &&
    //     !permissionMap?.['is_primary']?.read,
    // },
    {
      name: 'Primary',
      value: 'is_primary',
      type: 'enum',
      options: [
        { option: 'Yes', value: 'true' },
        { option: 'No', value: 'false' },
      ],
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['is_primary']?.edit &&
        !permissionMap?.['is_primary']?.read,
    },
    {
      name: 'Batch ID',
      value: 'interaction_batch_id',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['interaction_batch_id']?.edit &&
        !permissionMap?.['interaction_batch_id']?.read,
    },
    {
      name: 'Age (Days)',
      value: 'interaction_age',
      type: 'number',
      hide:
        !permissionMap?.['interaction_age']?.edit &&
        !permissionMap?.['interaction_age']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: interactionStatus,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    },
    {
      name: 'Recipient Name',
      value: 'recipient_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['recipient_name']?.edit &&
        !permissionMap?.['recipient_name']?.read,
    },
    {
      name: 'Recipient Email',
      value: 'recipient_email',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['recipient_email']?.edit &&
        !permissionMap?.['recipient_email']?.read,
    },
    {
      name: 'Last Sent Date',
      value: 'sent_on_datetime',
      type: 'date',
      hide:
        !permissionMap?.['last_resent_on']?.edit &&
        !permissionMap?.['last_resent_on']?.read,
    },
    {
      name: 'Last Reminder Date',
      value: 'last_reminder_on',
      type: 'date',
      hide:
        !permissionMap?.['last_reminder_on']?.edit &&
        !permissionMap?.['last_reminder_on']?.read,
    },
    {
      name: 'Response Date',
      value: 'response_submitted_on',
      type: 'date',
      hide:
        !permissionMap?.['response_submitted_on']?.edit &&
        !permissionMap?.['response_submitted_on']?.read,
    },
    {
      name: 'Last Response Update',
      value: 'response_updated_on',
      type: 'date',
      hide:
        !permissionMap?.['response_updated_on']?.edit &&
        !permissionMap?.['response_updated_on']?.read,
    },
    {
      name: 'Number of Attachments',
      value: 'attachment_count',
      type: 'number',
      hide:
        !permissionMap?.['attachment_count']?.edit &&
        !permissionMap?.['attachment_count']?.read,
    },
    {
      name: 'Type',
      value: 'interaction_type_rid',
      type: 'enum',
      options: interactionTypes,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['interaction_type_name']?.edit &&
        !permissionMap?.['interaction_type_name']?.read,
    },
    {
      name: 'Response Source',
      value: 'response_source_rid',
      type: 'enum',
      options: interactionResponseSources,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['response_source_name']?.edit &&
        !permissionMap?.['response_source_name']?.read,
    },
    {
      name: 'Created By',
      value: 'created_user_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['created_by']?.edit &&
        !permissionMap?.['created_by']?.read,
    },
    {
      name: 'Created Date',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Last Updated By',
      value: 'updated_user_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['modified_by']?.edit &&
        !permissionMap?.['modified_by']?.read,
    },
    {
      name: 'Last Updated Date',
      value: 'modified_datetime',
      type: 'date',
      hide:
        !permissionMap?.['modified_datetime']?.edit &&
        !permissionMap?.['modified_datetime']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    },
  ];
};
export const getProjectInteractionFilterFields = (
  interactionStatus: { option: string; value: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  fourPartPermissionMap: Record<string, { read: boolean; edit: boolean }>,
  assessmentSourceOptions: { option: string; value: string }[]
): FieldConfig[] => {
  return [
    {
      name: 'Interaction ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Assessment Type',
      value: 'interaction_assessment_source_rid',
      type: 'enum',
      options: assessmentSourceOptions,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['interaction_assessment_source_name']?.edit &&
        !permissionMap?.['interaction_assessment_source_name']?.read,
    },
    {
      name: 'Four Part Assessment ID',
      value: 'four_part_r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !fourPartPermissionMap?.['r_number']?.edit &&
        !fourPartPermissionMap?.['r_number']?.read,
    },
    // {
    //   name: 'Primary',
    //   value: 'is_primary',
    //   type: 'enum',
    //   options: [
    //     { option: 'Yes', value: 'true' },
    //     { option: 'No', value: 'false' },
    //   ],
    //   operatorOption: enumOptions,
    //   hide:
    //     !permissionMap?.['is_primary']?.edit &&
    //     !permissionMap?.['is_primary']?.read,
    // },
    {
      name: 'Primary',
      value: 'is_primary',
      type: 'enum',
      options: [
        { option: 'Yes', value: 'true' },
        { option: 'No', value: 'false' },
      ],
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['is_primary']?.edit &&
        !permissionMap?.['is_primary']?.read,
    },
    {
      name: 'Batch ID',
      value: 'interaction_batch_id',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['interaction_batch_id']?.edit &&
        !permissionMap?.['interaction_batch_id']?.read,
    },
    {
      name: 'Age (Days)',
      value: 'interaction_age',
      type: 'number',
      hide:
        !permissionMap?.['interaction_age']?.edit &&
        !permissionMap?.['interaction_age']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: interactionStatus,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    },
    {
      name: 'Recipient Name',
      value: 'recipient_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['recipient_name']?.edit &&
        !permissionMap?.['recipient_name']?.read,
    },
    {
      name: 'Recipient Email',
      value: 'recipient_email',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['recipient_email']?.edit &&
        !permissionMap?.['recipient_email']?.read,
    },
    {
      name: 'Last Sent Date',
      value: 'sent_on_datetime',
      type: 'date',
      hide:
        !permissionMap?.['last_resent_on']?.edit &&
        !permissionMap?.['last_resent_on']?.read,
    },
    {
      name: 'Last Reminder Date',
      value: 'last_reminder_on',
      type: 'date',
      hide:
        !permissionMap?.['last_reminder_on']?.edit &&
        !permissionMap?.['last_reminder_on']?.read,
    },
  ];
};

export const getInteractionStatusColor = (status?: string): string => {
  switch (status) {
    case 'Draft':
      return 'text-gray-500';
    case 'Created':
      return 'text-blue-500';
    case 'Sent':
      return 'text-purple-500';
    case 'Response Draft':
      return 'text-orange-500';
    case 'Response Received':
      return 'text-green-600';
    case 'On Hold':
      return 'text-yellow-500';
    case 'Cancelled':
      return 'text-red-600';
    case 'Completed':
      return 'text-green-700';
    case 'Question Updated':
      return 'text-indigo-500';
    default:
      return 'text-gray-700';
  }
};

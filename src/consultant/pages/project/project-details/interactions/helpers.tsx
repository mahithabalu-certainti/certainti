import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const nonReqTextOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Is-Empty', value: 'is_empty' },
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
  interactionSources: { option: string; value: string }[],
  interactionStatus: { option: string; value: string }[]
  // permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Interaction ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['r_number']?.edit &&
      //   !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Iteration',
      value: 'interaction_iteration',
      type: 'number',
      // hide:
      //   !permissionMap?.['iteration']?.edit &&
      //   !permissionMap?.['iteration']?.read,
    },
    {
      name: 'Age (Days)',
      value: 'interaction_age',
      type: 'number',
      // hide:
      //   !permissionMap?.['age_days']?.edit &&
      //   !permissionMap?.['age_days']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: interactionStatus,
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    },
    {
      name: 'Recipient Name',
      value: 'recipient_name',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['recipient_name']?.edit &&
      //   !permissionMap?.['recipient_name']?.read,
    },
    {
      name: 'Recipient Email',
      value: 'recipient_email',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['recipient_email']?.edit &&
      //   !permissionMap?.['recipient_email']?.read,
    },
    {
      name: 'Last Sent Date',
      value: 'last_resent_on',
      type: 'date',
      // hide:
      //   !permissionMap?.['last_sent_date']?.edit &&
      //   !permissionMap?.['last_sent_date']?.read,
    },
    {
      name: 'Last Reminder Date',
      value: 'last_reminder_on',
      type: 'date',
      // hide:
      //   !permissionMap?.['last_reminder_date']?.edit &&
      //   !permissionMap?.['last_reminder_date']?.read,
    },
    {
      name: 'Response Date',
      value: 'response_submitted_on',
      type: 'date',
      // hide:
      //   !permissionMap?.['response_date']?.edit &&
      //   !permissionMap?.['response_date']?.read,
    },
    {
      name: 'Last Response Update',
      value: 'response_updated_on',
      type: 'date',
      // hide:
      //   !permissionMap?.['last_response_update']?.edit &&
      //   !permissionMap?.['last_response_update']?.read,
    },
    {
      name: 'Attachments',
      value: 'attachment_count',
      type: 'text',
      // hide:
      //   !permissionMap?.['attachments']?.edit &&
      //   !permissionMap?.['attachments']?.read,
    },
    {
      name: 'Parent Interaction ID',
      value: 'parent_interaction_rid',
      type: 'text',
      operatorOption: nonReqTextOptions,
      // hide:
      //   !permissionMap?.['parent_interaction_id']?.edit &&
      //   !permissionMap?.['parent_interaction_id']?.read,
    },
    {
      name: 'Type',
      value: 'interaction_type_rid',
      type: 'enum',
      options: interactionTypes,
      operatorOption: enumOptions,
      // hide: !permissionMap?.['type']?.edit && !permissionMap?.['type']?.read,
    },
    {
      name: 'Response Source',
      value: 'response_source',
      type: 'enum',
      options: interactionSources,
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['response_source']?.edit &&
      //   !permissionMap?.['response_source']?.read,
    },
    {
      name: 'Created By',
      value: 'created_by',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['created_by']?.edit &&
      //   !permissionMap?.['created_by']?.read,
    },
    {
      name: 'Created Date',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      // hide:
      //   !permissionMap?.['created_date']?.edit &&
      //   !permissionMap?.['created_date']?.read,
    },
    {
      name: 'Last Updated By',
      value: 'modified_by',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['last_updated_by']?.edit &&
      //   !permissionMap?.['last_updated_by']?.read,
    },
    {
      name: 'Last Updated Date',
      value: 'modified_datetime',
      type: 'date',
      // hide:
      //   !permissionMap?.['last_updated_date']?.edit &&
      //   !permissionMap?.['last_updated_date']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};

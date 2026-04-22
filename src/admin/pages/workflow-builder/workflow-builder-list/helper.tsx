import { FieldConfig } from '../../../../consultant/pages/account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const nonReqTextfieldOptions: { option: string; value: string }[] = [
  { option: 'Contains', value: 'contains' },
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Is Empty', value: 'is_empty' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getWorkflowListFilterFields = (): FieldConfig[] => {
  return [
    {
      name: 'Rule Name',
      value: 'rule_name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['rule_name']?.edit &&
      //     !permissionMap?.['rule_name']?.read,
    },
    {
      value: 'scope_type_name',
      name: 'Scope Name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['scope_type_name']?.edit &&
      //     !permissionMap?.['scope_type_name']?.read,
    },
    {
      name: 'Created By',
      value: 'created_user_name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['created_user_name']?.edit &&
      //     !permissionMap?.['created_user_name']?.read,
    },
    {
      name: 'Created On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['created_datetime']?.edit &&
      //     !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Updated By',
      value: 'modified_user_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
      //   hide:
      //     !permissionMap?.['modified_user_name']?.edit &&
      //     !permissionMap?.['modified_user_name']?.read,
    },
    {
      name: 'Updated On',
      value: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['modified_datetime']?.edit &&
      //     !permissionMap?.['modified_datetime']?.read,
    },
    // {
    //   name: 'Sort Options',
    //   value: 'sort_options',
    //   type: 'system-sort',
    //   options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    // },
  ];
};

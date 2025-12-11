import { FieldConfig } from '../../../../../consultant/pages/account-details-sidebar/components/filter/filterType';
import { getFiscalYears } from '../../../../../common-utils';

const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const getTaskFilterFields = (
  priorityOptions: { value: string; label: string }[],
  statusOptions: { value: string; label: string }[],
  _assigneeOptions: { value: string; label: string }[],
  accountStatusOptions: { value: string; label: string }[]
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
    {
      name: 'Task ID',
      value: 'r_number',
      type: 'text',
      // hide: !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Task Name',
      value: 'task_name',
      type: 'text',
      // hide: !permissionMap?.['task_name']?.read,
    },
    {
      name: 'Description',
      value: 'description',
      type: 'text',
      // hide: !permissionMap?.['description']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOptions,
      // hide: !permissionMap?.['fiscal_year']?.read,
    },
    {
      name: 'Attach To',
      value: 'attach_to',
      type: 'text',
      // hide: !permissionMap?.['attach_to']?.read,
    },
    {
      name: 'Attachment Level',
      value: 'attachment_level',
      type: 'text',
      // hide: !permissionMap?.['attachment_level']?.read,
    },
    {
      name: 'Assigned To',
      value: 'assigned_to_name',
      type: 'text',
      // hide: !permissionMap?.['assigned_to_name']?.read,
    },
    {
      name: 'Priority',
      value: 'priority_name',
      type: 'enum',
      options: priorityOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOptions,
      // hide: !permissionMap?.['priority_name']?.read,
    },
    {
      name: 'Status',
      value: 'status_name',
      type: 'enum',
      options: statusOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOptions,
      // hide: !permissionMap?.['status_name']?.read,
    },
    {
      name: 'Account Status',
      value: 'account_status_name',
      type: 'enum',
      options: accountStatusOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOptions,
      // hide: !permissionMap?.['account_status_name']?.read,
    },
    {
      name: 'Created By',
      value: 'created_by_name',
      type: 'text',
      // hide: !permissionMap?.['created_by_name']?.read,
    },
    {
      name: 'Created On',
      value: 'created_datetime',
      type: 'date',
      // hide: !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Modified By',
      value: 'modified_by_name',
      type: 'text',
      // hide: !permissionMap?.['modified_by_name']?.read,
    },
    {
      name: 'Modified On',
      value: 'modified_datetime',
      type: 'date',
      // hide: !permissionMap?.['modified_datetime']?.read,
    },
  ];

import { FieldConfig } from '../../../../account-details-sidebar/components/filter/filterType';
const requiredFieldFilterOptionsForText: { option: string; value: string }[] = [
    { option: 'Equals', value: 'equals' },
    { option: 'Not Equals', value: 'not_equals' },
    { option: 'Contains', value: 'contains' },
];
const requiredFieldFilterOptionsForEnum: { option: string; value: string }[] = [
    { option: 'Equals', value: 'equals' },
    { option: 'Not Equals', value: 'not_equals' },
    { option: 'In', value: 'in' },
];

export const projectTaskFilterFields = (
    memoizedProjectTaskResourceCode: { option: string; value: string }[],
    resourceTypeOptions: { option: string; value: string }[],
    permissionMapTaskTableColumn?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
        {
            name: 'Resource Code',
            value: 'resource_code',
            type: 'enum',
            required: true,
            options: memoizedProjectTaskResourceCode,
            filterOptions: requiredFieldFilterOptionsForEnum,
            hide:
                !permissionMapTaskTableColumn?.['resource_code']?.read &&
                !permissionMapTaskTableColumn?.['resource_code']?.edit,
        },
        {
            name: 'Resource Name',
            value: 'resource_name',
            type: 'text',
            hide:
                !permissionMapTaskTableColumn?.['resource_name']?.read &&
                !permissionMapTaskTableColumn?.['resource_name']?.edit,
        },

        {
            name: 'Resource Type',
            value: 'resource_type_rid',
            type: 'enum',
            required: true,
            options: resourceTypeOptions,
            filterOptions: requiredFieldFilterOptionsForEnum,
            hide:
                !permissionMapTaskTableColumn?.['resource_type_name']?.read &&
                !permissionMapTaskTableColumn?.['resource_type_name']?.edit,
        },

        {
            name: 'Resource Role',
            value: 'resource_role',
            type: 'text',
            hide:
                !permissionMapTaskTableColumn?.['resource_role']?.read &&
                !permissionMapTaskTableColumn?.['resource_role']?.edit,
        },
        {
            name: 'Task Date',
            value: 'start_date',
            type: 'date',
            hide:
                !permissionMapTaskTableColumn?.['start_date']?.read &&
                !permissionMapTaskTableColumn?.['start_date']?.edit,
        },

        {
            name: 'Cost',
            value: 'total_cost_pro_task',
            type: 'text',
            hide:
                !permissionMapTaskTableColumn?.['total_cost_pro_task']?.read &&
                !permissionMapTaskTableColumn?.['total_cost_pro_task']?.edit,
        },
        {
            name: 'Effort Hours',
            value: 'total_hours_pro_task',
            type: 'text',
            hide:
                !permissionMapTaskTableColumn?.['total_hours_pro_task']?.read &&
                !permissionMapTaskTableColumn?.['total_hours_pro_task']?.edit,
        },
        {
            name: 'Comments',
            value: 'comments',
            type: 'text',
            hide:
                !permissionMapTaskTableColumn?.['comments']?.read &&
                !permissionMapTaskTableColumn?.['comments']?.edit,
        },

        {
            name: 'Resource ID',
            value: 'r_number',
            type: 'text',
            required: true,
            filterOptions: requiredFieldFilterOptionsForText,
            hide:
                !permissionMapTaskTableColumn?.['r_number']?.read &&
                !permissionMapTaskTableColumn?.['r_number']?.edit,
        },
        {
            name: 'Sort Options',
            value: 'sort_options',
            type: 'system-sort',
            options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
        },
    ];

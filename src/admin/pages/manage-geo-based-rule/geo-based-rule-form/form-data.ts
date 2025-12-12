import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
    createDateField,
    createSelectField,
    createTextField,
    REGEX_PATTERNS,
    YES_NO_OPTIONS,
} from '../../../../common-utils';

export const GeoBasedRuleFormFieldsData = (
    isEditView: boolean,
    countryOptions: SelectOption[],
    regionOptions: SelectOption[],
    regionLoading: boolean,
    permissionMap: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
    return useMemo(
        () => [
            {
                sectionName: 'Geo Based Rule Information',
                fillType: 'half',
                fields: [
                    createTextField('rule_name', 'Rule Name', {
                        required: true,
                        placeholder: 'Enter Rule Name',
                        disabled:
                            isEditView &&
                            !permissionMap?.['rule_name']?.edit &&
                            permissionMap?.['rule_name']?.read,
                        hide:
                            isEditView &&
                            !permissionMap?.['rule_name']?.edit &&
                            !permissionMap?.['rule_name']?.read,
                        regex: REGEX_PATTERNS.MIN_3,
                        regexErrorMessage: 'Rule Name must be at least 3 characters long',
                    }),
                    createSelectField('country', 'Country', {
                        options: countryOptions || [],
                        placeholder: 'Choose Country',
                        required: true,
                        onChange: true,
                        resetDependsFields: ['region'],
                        disabled:
                            isEditView &&
                            !permissionMap?.['country']?.edit &&
                            permissionMap?.['country']?.read,
                        hide:
                            isEditView &&
                            !permissionMap?.['country']?.edit &&
                            !permissionMap?.['country']?.read,
                    }),
                    createSelectField('region', 'Region', {
                        options: regionOptions || [],
                        placeholder: 'Choose Region',
                        required: true,
                        isLoading: regionLoading,
                        disabled:
                            isEditView &&
                            !permissionMap?.['region']?.edit &&
                            permissionMap?.['region']?.read,
                        hide:
                            isEditView &&
                            !permissionMap?.['region']?.edit &&
                            !permissionMap?.['region']?.read,
                    }),
                    createSelectField('is_federal', 'Federal', {
                        options: YES_NO_OPTIONS,
                        placeholder: 'Select',
                        required: true,
                        disabled:
                            isEditView &&
                            !permissionMap?.['is_federal']?.edit &&
                            permissionMap?.['is_federal']?.read,
                        hide:
                            isEditView &&
                            !permissionMap?.['is_federal']?.edit &&
                            !permissionMap?.['is_federal']?.read,
                    }),
                    createDateField('effective_start_date', 'Effective Start Date', {
                        required: true,
                        disabled:
                            isEditView &&
                            !permissionMap?.['effective_start_date']?.edit &&
                            permissionMap?.['effective_start_date']?.read,
                        hide:
                            isEditView &&
                            !permissionMap?.['effective_start_date']?.edit &&
                            !permissionMap?.['effective_start_date']?.read,
                    }),
                    createDateField('effective_end_date', 'Effective End Date', {
                        required: true,
                        greaterThan: { effective_start_date: 'Effective Start Date' },
                        disabled:
                            isEditView &&
                            !permissionMap?.['effective_end_date']?.edit &&
                            permissionMap?.['effective_end_date']?.read,
                        hide:
                            isEditView &&
                            !permissionMap?.['effective_end_date']?.edit &&
                            !permissionMap?.['effective_end_date']?.read,
                    }),
                ],
            },
            {
                sectionName: 'Audit Information',
                fillType: 'half',
                hide: !isEditView,
                fields: [
                    createTextField('rid', 'Record ID', {
                        required: false,
                        disabled: true,
                        hide:
                            isEditView &&
                            !permissionMap?.['rid']?.edit &&
                            !permissionMap?.['rid']?.read,
                    }),
                    createTextField('created_datetime', 'Created On', {
                        required: false,
                        disabled: true,
                        hide:
                            isEditView &&
                            !permissionMap?.['created_datetime']?.edit &&
                            !permissionMap?.['created_datetime']?.read,
                    }),
                    createTextField('modified_datetime', 'Updated On', {
                        required: false,
                        disabled: true,
                        hide:
                            isEditView &&
                            !permissionMap?.['modified_datetime']?.edit &&
                            !permissionMap?.['modified_datetime']?.read,
                    }),
                ],
            },
        ],
        [countryOptions, regionOptions, regionLoading, isEditView, permissionMap]
    );
};

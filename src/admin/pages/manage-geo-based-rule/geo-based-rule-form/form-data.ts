/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
  createDateField,
  createMultiSelectField,
  createSelectField,
  createTextField,
  REGEX_PATTERNS,
  YES_NO_OPTIONS,
} from '../../../../common-utils';
export const GeoBasedRuleFormFieldsData = (
  isEditView: boolean,
  countryOptions: SelectOption[],
  regionOptions: SelectOption[],
  statusOptions: SelectOption[],
  projectTypeOptions: SelectOption[],
  regionLoading: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  isFederal: boolean | null,
  configDetails: any = {},
  caseNamePrefix: string = ''
): FormType[] => {
  return useMemo(() => {
    const dynamicSections = Object.values(configDetails).map((config: any) => {
      const items = config?.configItems || [];
      const title = config?.credit_program_name || 'Configuration';
      const isTableView =
        config?.credit_program_name?.toLowerCase() === 'federal r&d credit' ||
        config?.credit_program_name?.toLowerCase() === 'state r&d credit';

      const formatLabel = (str: string) =>
        str
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      const fields = items.map((item: any) => {
        const formattedLabel = formatLabel(item.displayName || item.label);

        const commonProps = {
          required: item?.is_required ?? false,
          disabled:
            isEditView &&
            !permissionMap?.['configs']?.edit &&
            permissionMap?.['configs']?.read,
          hide:
            isEditView &&
            !permissionMap?.['configs']?.edit &&
            !permissionMap?.['configs']?.read,
          ...(isTableView && { width: '250px' }),
        };

        // ✅ Date field
        if (item.type === 'Date') {
          const isSubmissionDate = [
            'caseSubmissionDate',
            'case_submission_date',
            'submission_date',
          ].includes(item.label);

          if (isSubmissionDate) {
            return createTextField(item.label, formattedLabel, {
              ...commonProps,
              placeholder: 'MM',
              regex: REGEX_PATTERNS.ALLOW_01_TO_99,
              regexErrorMessage: 'Value must be between 01 and 99',
              maxLength: 2,
            });
          }

          return createDateField(item.label, formattedLabel, {
            ...commonProps,
          });
        }
        if (item.type === 'select') {
          return createMultiSelectField(item.label, formattedLabel, {
            ...commonProps,
            options: projectTypeOptions,
            placeholder: 'Choose ' + formattedLabel,
          });
        }
        // ✅ Numeric field with validation
        if (item.type?.startsWith('numeric')) {
          return createTextField(item.label, formattedLabel, {
            ...commonProps,
            placeholder: `Enter ${formattedLabel}`,
            regex: REGEX_PATTERNS.NUMERIC_10_4,
            regexErrorMessage: `${formattedLabel} must be a positive number with up to 10 digits and 4 decimal places`,
            formatCostValue: true,
          });
        }

        // ✅ Default text field
        return createTextField(item.label, formattedLabel, {
          ...commonProps,
          placeholder: `Enter ${formattedLabel}`,
        });
      });

      return {
        sectionName: title,
        fillType: 'half' as const,
        hide: fields.length === 0,
        fields,
        renderAsDetailTable: isTableView,
      };
    });

    return [
      {
        sectionName: 'Jurisdiction Rules Information',
        fillType: 'half',
        fields: [
          createDateField('effective_start_date', 'Effective Start Date', {
            required: true,
            allowFutureDates: true,
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
            required: false,
            greaterThan: { effective_start_date: 'Effective Start Date' },
            allowFutureDates: true,
            disabled:
              isEditView &&
              !permissionMap?.['effective_end_date']?.edit &&
              permissionMap?.['effective_end_date']?.read,
            hide:
              isEditView &&
              !permissionMap?.['effective_end_date']?.edit &&
              !permissionMap?.['effective_end_date']?.read,
          }),
          createSelectField('status_rid', 'Status', {
            required: true,
            options: statusOptions,
            placeholder: 'Choose Status',
            hide:
              isEditView &&
              !permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
          }),
          createSelectField('is_federal', 'Federal', {
            options: YES_NO_OPTIONS,
            placeholder: 'Select',
            required: true,
            onChange: true,
            resetDependsFields: ['region'],
            disabled:
              isEditView &&
              !permissionMap?.['is_federal']?.edit &&
              permissionMap?.['is_federal']?.read,
            hide:
              isEditView &&
              !permissionMap?.['is_federal']?.edit &&
              !permissionMap?.['is_federal']?.read,
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
              !permissionMap?.['country_rid']?.edit &&
              !permissionMap?.['country_rid']?.read,
          }),
          createSelectField('region', 'Region', {
            options: regionOptions || [],
            placeholder: 'Choose Region',
            required: isFederal ? false : true,
            isLoading: regionLoading,
            onChange: true,
            disabled: isFederal ?? undefined,
            hide:
              isEditView &&
              !permissionMap?.['state_rid']?.edit &&
              !permissionMap?.['state_rid']?.read,
          }),
          createTextField('config_name', 'Configuration Name', {
            required: true,
            placeholder: 'Enter Configuration Name',
            prefixValue: caseNamePrefix,
            disabled:
              isEditView &&
              !permissionMap?.['config_name']?.edit &&
              permissionMap?.['config_name']?.read,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage:
                  'Configuration Name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_150,
                errorMessage:
                  'Configuration Name must be within 150 characters',
              },
            ],
            hide:
              isEditView &&
              !permissionMap?.['config_name']?.edit &&
              !permissionMap?.['config_name']?.read,
          }),
        ],
      },
      ...dynamicSections,
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
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_by']?.edit &&
              !permissionMap?.['created_by']?.read,
          }),
          createTextField('r_number', 'Jurisdiction Rule ID', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['r_number']?.edit &&
              !permissionMap?.['r_number']?.read,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_datetime']?.edit &&
              !permissionMap?.['modified_datetime']?.read,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_by']?.edit &&
              !permissionMap?.['modified_by']?.read,
          }),
        ],
      },
    ];
  }, [
    configDetails,
    isEditView,
    permissionMap,
    statusOptions,
    countryOptions,
    regionOptions,
    isFederal,
    regionLoading,
    caseNamePrefix,
    projectTypeOptions,
  ]);
};

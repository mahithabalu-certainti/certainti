/* eslint-disable @typescript-eslint/no-explicit-any */
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
  statusOptions: SelectOption[],
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

      const fields = items.map((item: any) => {
        const formatLabel = (str: string) => {
          return str
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        const formattedLabel = formatLabel(item.displayName || item.label);

        return createTextField(item.label, formattedLabel, {
          required: false,
          placeholder: `Enter ${formattedLabel}`,
          disabled:
            isEditView &&
            !permissionMap?.[item.label]?.edit &&
            permissionMap?.[item.label]?.read,
          // hide:
          //     isEditView &&
          //     !permissionMap?.[item.label]?.edit &&
          //     !permissionMap?.[item.label]?.read,
        });
      });

      return {
        sectionName: title,
        fillType: 'half' as const,
        hide: fields.length === 0,
        fields: fields,
      };
    });

    return [
      {
        sectionName: 'Geo Based Rule Information',
        fillType: 'half',
        fields: [
          createDateField('effective_start_date', 'Effective Start Date', {
            required: true,
            allowFutureDates: true,
            disabled:
              isEditView &&
              !permissionMap?.['effective_start_date']?.edit &&
              permissionMap?.['effective_start_date']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['effective_start_date']?.edit &&
            //   !permissionMap?.['effective_start_date']?.read,
          }),
          createDateField('effective_end_date', 'Effective End Date', {
            required: false,
            greaterThan: { effective_start_date: 'Effective Start Date' },
            allowFutureDates: true,
            disabled:
              isEditView &&
              !permissionMap?.['effective_end_date']?.edit &&
              permissionMap?.['effective_end_date']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['effective_end_date']?.edit &&
            //   !permissionMap?.['effective_end_date']?.read,
          }),
          createSelectField('status_rid', 'Status', {
            required: true,
            options: statusOptions,
            placeholder: 'Choose Status',
            // hide:
            //   isEditView &&
            //   !permissionMap?.['status_rid']?.read &&
            //   !permissionMap?.['status_rid']?.edit,
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
            // hide:
            //   isEditView &&
            //   !permissionMap?.['is_federal']?.edit &&
            //   !permissionMap?.['is_federal']?.read,
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
            // hide:
            //     isEditView &&
            //     !permissionMap?.['country']?.edit &&
            //     !permissionMap?.['country']?.read,
          }),
          createSelectField('region', 'Region', {
            options: regionOptions || [],
            placeholder: 'Choose Region',
            required: isFederal ? false : true,
            isLoading: regionLoading,
            onChange: true,
            disabled: isFederal ?? undefined,

            // hide:
            //   isEditView &&
            //   !permissionMap?.['region']?.edit &&
            //   !permissionMap?.['region']?.read,
          }),
          createTextField('config_name', 'Config Name', {
            required: true,
            placeholder: 'Enter Config Name',
            prefixValue: caseNamePrefix,
            disabled:
              isEditView &&
              !permissionMap?.['rule_name']?.edit &&
              permissionMap?.['rule_name']?.read,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Config Name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Config Name must be within 255 characters',
              },
            ],
            // hide:
            //   isEditView &&
            //   !permissionMap?.['rule_name']?.edit &&
            //   !permissionMap?.['rule_name']?.read,
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
            // hide:
            //     isEditView &&
            //     !permissionMap?.['rid']?.edit &&
            //     !permissionMap?.['rid']?.read,
          }),
          createTextField('created_datetime', 'Created On', {
            required: false,
            disabled: true,
            // hide:
            //     isEditView &&
            //     !permissionMap?.['created_datetime']?.edit &&
            //     !permissionMap?.['created_datetime']?.read,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['created_by']?.edit &&
            //   !permissionMap?.['created_by']?.read,
          }),
          createTextField('config_id', 'Config ID', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['r_number']?.edit &&
            //   !permissionMap?.['r_number']?.read,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['modified_datetime']?.edit &&
            //   !permissionMap?.['modified_datetime']?.read,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['modified_by']?.edit &&
            //   !permissionMap?.['modified_by']?.read,
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
  ]);
};

import type { FormType, SelectOption } from '../../../../consultant/types';
import {
  createTextField,
  createSelectField,
  createDateField,
  REGEX_PATTERNS,
  createTextAreaField,
  YES_NO_OPTIONS,
} from '../../../../common-utils';
import dayjs from 'dayjs';

export const DataMapperFormData = (
  isEditView: boolean,
  countryOptions: SelectOption[],
  stateOptions: SelectOption[],
  statesLoading: boolean,
  isFederal: boolean,
  effectiveFromDate?: Date,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return [
    {
      sectionName: 'Basic Information',
      fillType: 'half',
      fields: [
        createTextField('form_name', 'Form Name', {
          required: true,
          placeholder: 'Enter Form Name',
          hide:
            isEditView &&
            !permissionMap?.['form_name']?.read &&
            !permissionMap?.['form_name']?.edit,
          disabled:
            isEditView &&
            permissionMap?.['form_name']?.read &&
            !permissionMap?.['form_name']?.edit,
          errorHandling: [
            {
              regex: REGEX_PATTERNS.MIN_3,
              errorMessage: 'Form Name must be more than 2 characters long',
            },
            {
              regex: REGEX_PATTERNS.MAX_64,
              errorMessage: 'Form Name must not exceed 64 characters',
            },
            {
              regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
              errorMessage:
                "Form Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
            },
          ],
        }),
        createDateField('effective_from_date', 'Start Date', {
          required: true,
          allowFutureDates: true,
          onChange: true,
          hide:
            isEditView &&
            !permissionMap?.['effective_from_date']?.read &&
            !permissionMap?.['effective_from_date']?.edit,
          disabled:
            isEditView &&
            permissionMap?.['effective_from_date']?.read &&
            !permissionMap?.['effective_from_date']?.edit,
        }),
        createDateField('effective_to_date', 'End Date', {
          required: false,
          allowFutureDates: true,
          minDate: effectiveFromDate
            ? dayjs(effectiveFromDate).add(1, 'day').toDate()
            : undefined,
          hide:
            isEditView &&
            !permissionMap?.['effective_to_date']?.read &&
            !permissionMap?.['effective_to_date']?.edit,
          disabled:
            isEditView &&
            permissionMap?.['effective_to_date']?.read &&
            !permissionMap?.['effective_to_date']?.edit,
        }),
        createSelectField('is_federal', 'Federal', {
          options: YES_NO_OPTIONS,
          placeholder: 'Choose Federal',
          required: true,
          onChange: true,
          resetDependsFields: ['state_rid'],
          hide:
            isEditView &&
            !permissionMap?.['is_federal']?.read &&
            !permissionMap?.['is_federal']?.edit,
          disabled:
            isEditView &&
            permissionMap?.['is_federal']?.read &&
            !permissionMap?.['is_federal']?.edit,
        }),
        createSelectField('country_rid', 'Country', {
          options: countryOptions,
          placeholder: 'Choose Country',
          required: true,
          onChange: true,
          resetDependsFields: ['state_rid'],
          hide:
            isEditView &&
            !permissionMap?.['country_rid']?.read &&
            !permissionMap?.['country_rid']?.edit,
          disabled:
            isEditView &&
            permissionMap?.['country_rid']?.read &&
            !permissionMap?.['country_rid']?.edit,
        }),
        createSelectField('state_rid', 'Region', {
          options: stateOptions,
          placeholder: 'Choose Region',
          required: isFederal ? false : true,
          isLoading: statesLoading,
          hide:
            isEditView &&
            !permissionMap?.['state_rid']?.read &&
            !permissionMap?.['state_rid']?.edit,
          disabled:
            statesLoading ||
            isFederal ||
            (isEditView &&
              permissionMap?.['state_rid']?.read &&
              !permissionMap?.['state_rid']?.edit),
        }),
      ],
    },
    {
      sectionName: '',
      fillType: 'full',
      fields: [
        createTextAreaField('description', 'Description', {
          required: false,
          placeholder: 'Enter Description',
          regexErrorMessage: 'Description must be within 2000 characters',
          regex: REGEX_PATTERNS.DESCRIPTION,
          hide:
            isEditView &&
            !permissionMap?.['descriptions']?.read &&
            !permissionMap?.['descriptions']?.edit,
          disabled:
            isEditView &&
            permissionMap?.['descriptions']?.read &&
            !permissionMap?.['descriptions']?.edit,
        }),
      ],
    },
  ];
};

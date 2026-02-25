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
  countryOptions: SelectOption[],
  stateOptions: SelectOption[],
  statesLoading: boolean,
  isFederal: boolean,
  effectiveFromDate?: Date
): FormType[] => {
  return [
    {
      sectionName: 'Basic Information',
      fillType: 'half',
      fields: [
        createTextField('form_name', 'Form Name', {
          required: true,
          placeholder: 'Enter Form Name',
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
        createDateField('effective_from_date', 'Effective From Date', {
          required: true,
          allowFutureDates: true,
          onChange: true,
        }),
        createDateField('effective_to_date', 'Effective To Date', {
          required: false,
          allowFutureDates: true,
          minDate: effectiveFromDate
            ? dayjs(effectiveFromDate).add(1, 'day').toDate()
            : undefined,
        }),
        createSelectField('is_federal', 'Federal', {
          options: YES_NO_OPTIONS,
          placeholder: 'Choose Federal',
          required: true,
          onChange: true,
          resetDependsFields: ['state_rid'],
        }),
        createSelectField('country_rid', 'Country', {
          options: countryOptions,
          placeholder: 'Choose Country',
          required: true,
          onChange: true,
          resetDependsFields: ['state_rid'],
        }),
        createSelectField('state_rid', 'Region', {
          options: stateOptions,
          placeholder: 'Choose Region',
          required: isFederal ? false : true,
          isLoading: statesLoading,
          disabled: statesLoading || isFederal,
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
        }),
      ],
    },
  ];
};

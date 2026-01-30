import type { FormType, SelectOption } from '../../../../consultant/types';
import {
  createTextField,
  createSelectField,
  createDateField,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import dayjs from 'dayjs';

export const DataMapperFormData = (
  countryOptions: SelectOption[],
  stateOptions: SelectOption[],
  statesLoading: boolean,
  effectiveFromDate?: Date
): FormType[] => {
  return [
    {
      sectionName: 'Basic Information',
      fillType: 'half',
      fields: [
        createTextField('form_name', 'Name', {
          required: true,
          placeholder: 'Enter Name',
          errorHandling: [
            {
              regex: REGEX_PATTERNS.MIN_3,
              errorMessage: 'Name must be more than 2 characters long',
            },
            {
              regex: REGEX_PATTERNS.MAX_64,
              errorMessage: 'Name must not exceed 64 characters',
            },
            {
              regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
              errorMessage:
                "Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
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
        createSelectField('country_rid', 'Country', {
          options: countryOptions,
          placeholder: 'Choose Country',
          required: true,
          onChange: true,
        }),
        createSelectField('state_rid', 'Region', {
          options: stateOptions,
          placeholder: 'Choose Region',
          required: false,
          disabled: statesLoading,
          isLoading: statesLoading,
        }),
      ],
    },
  ];
};

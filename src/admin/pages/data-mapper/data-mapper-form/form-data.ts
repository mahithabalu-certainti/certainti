import type { FormType, SelectOption } from '../../../../consultant/types';
import {
  createTextField,
  createSelectField,
  createDateField,
} from '../../../../common-utils';

export const DataMapperFormData = (
  countryOptions: SelectOption[],
  stateOptions: SelectOption[],
  statesLoading: boolean,
  effectiveFromDate?: Date
): FormType[] => {
  return [
    {
      sectionName: 'Form Information',
      fillType: 'half',
      fields: [
        createTextField('form_name', 'Name', {
          required: true,
          placeholder: 'Enter Name',
        }),
        createDateField('effective_from_date', 'Effective From Date', {
          required: true,
          allowFutureDates: true,
          onChange: true,
        }),
        createDateField('effective_to_date', 'Effective To Date', {
          required: false,
          allowFutureDates: true,
          minDate: effectiveFromDate,
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
          required: true,
          disabled: statesLoading,
          isLoading: statesLoading,
        }),
      ],
    },
  ];
};

import { useMemo } from 'react';
import { FormType, SelectOption, YesNo } from '../../types';
import { DATA_STORAGE_OPTIONS, STATUS_OPTIONS } from './utils';
import {
  createDateField,
  createPhoneInputField,
  createRadioField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
  YES_NO_OPTIONS,
} from '../../../common-utils';

export const FormData = (
  country: SelectOption[],
  parentAccount: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  disableFields?: boolean,
  stateLoading?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          // createTextField('rid', 'Account ID', {
          //   required: true,
          //   regex: REGEX_PATTERNS.ALPHANUMERIC,
          //   regexErrorMessage: 'Please Enter valid Account ID',
          //   placeholder: 'Enter Account ID',
          //   disabled: disableFields,
          // }),
          createTextField('account_name', 'Account Name', {
            required: true,
            regex: REGEX_PATTERNS.NAME_REGEX,
            regexErrorMessage: 'Invalid Account Name',
            placeholder: 'Enter Account Name',
            lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_ACCOUNT_NAME_REGEX,
              minErrorMessage: 'Account name must be more than 6 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_ACCOUNT_NAME_REGEX,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createSelectField('status', 'Status', {
            required: true,
            options: STATUS_OPTIONS,
            placeholder: 'Choose Status',
          }),
          createSelectField('parent_account_rid', 'Parent Account', {
            options: parentAccount,
            placeholder: 'Choose Parent Account',
            required: false,
            disabled: disableFields,
            dependsRequired: {
              key: 'is_parent',
              matchedValue: YesNo.No,
              errorMessage: 'Field is required',
            },
          }),
          createTextField('website', 'Website', {
            required: false,
            regex: REGEX_PATTERNS.WEBSITE,
            regexErrorMessage: 'Enter a valid website URL',
            placeholder: 'Enter Website',
          }),
          createTextField('industry', 'Industry', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_5_TO_25,
            regexErrorMessage:
              'Industry should contain only letters and between 5 to 25 characters',
            placeholder: 'Enter Industry',
          }),
          createTextField('project_manager', 'Delivery Manager', {
            required: true,
            regex: REGEX_PATTERNS.MANAGER_REGEX,
            regexErrorMessage: 'Enter a valid name',
            placeholder: 'Enter Delivery Manager Name',
          }),
          createRadioField('is_parent', 'Is Parent Account', {
            radioOptions: YES_NO_OPTIONS,
            disabled: disableFields,
            required: true,
          }),
        ],
      },
      {
        sectionName: 'Location and Currency Information',
        fillType: 'half',
        fields: [
          createSelectField('country_rid', 'Country', {
            options: country,
            placeholder: 'Choose Country',
            required: true,
            onChange: true,
            resetDependsFields: ['region'],
          }),
          createSelectField('region', 'Region', {
            options: state,
            placeholder: 'Choose Region',
            required: true,
            isLoading: stateLoading,
          }),
          createSelectField('currency_rid', 'Currency', {
            options: currency,
            required: true,
            placeholder: 'Choose Currency',
          }),
        ],
      },
      {
        sectionName: 'Contact Information',
        fillType: 'half',
        fields: [
          createTextField('primary_contact_name', 'Primary Contact Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: 'Letters Only and between 3 to 25 characters',
            placeholder: 'Enter Primary Contact Name',
          }),
          createTextField('finance_poc_name', 'Finance point of contact', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: 'Letters Only and between 3 to 25 characters',
            placeholder: 'Enter Finance point of contact',
          }),
          createTextField('primary_contact_email', 'Primary Contact Email', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
            placeholder: 'Enter Primary Contact Email',
          }),
          createTextField('finance_poc_email', 'Finance POC Email', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
            placeholder: 'Enter Finance POC Email',
          }),
          createPhoneInputField(
            'primary_contact_number',
            'Primary Contact Phone',
            {
              required: true,
              placeholder: 'Enter Primary Contact Phone',
            }
          ),
          createPhoneInputField('finanace_poc_number', 'Finance POC Phone', {
            required: true,
            placeholder: 'Enter Finance POC Phone',
          }),
        ],
      },
      {
        sectionName: 'Settings Information',
        fillType: 'half',
        fields: [
          createDateField('fiscal_start_date', 'Fiscal Start Date', {
            required: true,
            disabled: disableFields,
          }),
          createTextField('max_ai_interactions', 'Max AI Intractions', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Max AI Intractions',
          }),
          createDateField('fiscal_end_date', 'Fiscal End Date', {
            disabled: disableFields,
            required: true,
          }),
          createTextField('blended_rate_fte', 'Blended Rate - FTE', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only maximum 10 digits',
            placeholder: 'Enter Blended Rate - FTE',
          }),
          createTextField('annual_revenue', 'Annual Revenue', {
            required: true,
            regex: REGEX_PATTERNS.NUMBERS,
            regexErrorMessage: 'Enter a valid annual revenue',
            placeholder: 'Enter Annual Revenue',
          }),
          createTextField('blended_rate_subcon', 'Blended Rate - SubCon', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage:
              'Enter a valid annual revenue using numbers and commas only',
            placeholder: 'Enter Blended Rate - SubCon',
          }),
          createRadioField('auto_access_rd', 'Auto assess RD', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
          }),
          createRadioField('data_storage', 'Data Storage', {
            required: true,
            radioOptions: DATA_STORAGE_OPTIONS,
            disabled: disableFields,
          }),
          createRadioField('autosend_interaction', 'Auto Send AI Interaction', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
          }),
        ],
      },
      {
        sectionName: 'Description Information',
        fillType: 'full',
        fields: [
          createTextAreaField('account_description', 'Description', {
            required: false,
            regex: REGEX_PATTERNS.ACCOUNT_DESCRIPTION,
            regexErrorMessage: 'Description must be with in 500 characters',
            placeholder: 'Enter Description',
          }),
        ],
      },
    ],
    [country, parentAccount, state, disableFields, currency, stateLoading]
  );
};

import { useMemo } from 'react';
import { FormType, SelectOption, YesNo } from '../../types';
import {
  createDateField,
  createRadioField,
  createSelectField,
  createTextAreaField,
  createTextField,
  DATA_STORAGE_OPTIONS,
  REGEX_PATTERNS,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
} from './utils';

export const FormData = (
  country: SelectOption[],
  parentAccount: SelectOption[],
  currency: SelectOption[],
  region: SelectOption[],
  disableFields?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('rid', 'Account ID', {
            required: true,
            regex: REGEX_PATTERNS.ALPHANUMERIC,
            regexErrorMessage: 'Please Enter valid Account ID',
            disabled: disableFields
          }),
          createSelectField('status', 'Status', STATUS_OPTIONS),
          createSelectField(
            'parent_account_rid',
            'Parent Account',
            parentAccount,
            disableFields,
            false,
            {key: 'is_parent', matchedValue: YesNo.No, errorMessage: 'Field is required'}
          ),
          createTextField('website', 'Website', {
            required: false,
            regex: REGEX_PATTERNS.WEBSITE,
            regexErrorMessage: 'Enter a valid website URL',
          }),
          createTextField('account_name', 'Account Name', {
            required: true,
            regex: REGEX_PATTERNS.ACCOUNT_NAME,
            regexErrorMessage:
              'Account name should contain only letters and between 7 to 25 characters',
          }),
          createTextField('industry', 'Industry', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_5_TO_25,
            regexErrorMessage:
              'Industry should contain only letters and between 5 to 25 characters',
          }),
          createTextField('project_manager', 'Project Manager', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
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
          createSelectField('country_rid', 'Country', country),
          createSelectField('currency_rid', 'Currency', currency),
          createSelectField('region', 'Region', region),
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
          }),
          createTextField('finance_poc_name', 'Finance point of contact', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: 'Letters Only and between 3 to 25 characters',
          }),
          createTextField('primary_contact_email', 'Primary Contact Email', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
          }),
          createTextField('finance_poc_email', 'Finance POC Email', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
          }),
          createTextField('primary_contact_number', 'Primary Contact Phone', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
          }),
          createTextField('finanace_poc_number', 'Finance POC Phone', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
          }),
        ],
      },
      {
        sectionName: 'Settings Information',
        fillType: 'half',
        fields: [
          createDateField(
            'fiscal_start_date',
            'Fiscal Start Date',
            disableFields
          ),
          createTextField('max_ai_interactions', 'Max AI Intractions', {
            required: true,
            regex: /^[3-5]$/,
            regexErrorMessage: 'Enter a number between 3 and 5',
          }),
          createDateField(
            'fiscal_end_date',
            'Fiscal End Date',
            disableFields,
            {key: 'fiscal_start_date', errorMessage: 'Date should be greater or equal to Fiscal Start Date'}
          ),
          createTextField('blended_rate_fte', 'Blended Rate - FTE', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only maximum 10 digits',
          }),
          createTextField('annual_revenue', 'Annual Revenue', {
            required: true,
            regex: /^[0-9]+(\.[0-9]{1,2})?$/,
            regexErrorMessage: 'Enter a valid annual revenue',
          }),
          createTextField('blended_rate_subcon', 'Blended Rate - SubCon', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only maximum 10 digits',
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
            regex: REGEX_PATTERNS.DESCRIPTION,
            regexErrorMessage: 'Maximum 500 characters allowed',
          }),
        ],
      },
    ],
    [country, parentAccount, currency, region, disableFields]
  );
};

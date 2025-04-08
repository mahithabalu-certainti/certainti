import { useMemo } from 'react';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../common-utils';
import { FormType, SelectOption } from '../../types';

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
          createTextField('rid', 'Project Number', {
            required: true,
            regex: REGEX_PATTERNS.ALPHANUMERIC,
            regexErrorMessage: 'Please Enter valid Project Number',
            placeholder: 'Enter Project Number',
            disabled: disableFields,
          }),
          createDateField('project_start_date', 'Project Start Date', {
            required: true,
            disabled: disableFields,
          }),
          createTextField('project_ref_id', 'Project Ref Id', {
            required: true,
            regex: REGEX_PATTERNS.ALPHANUMERIC,
            regexErrorMessage: 'Please Enter valid Project Ref Id',
            placeholder: 'Enter Project Ref Id',
            disabled: disableFields,
          }),
          createDateField('project_end_date', 'Project End Date', {
            required: true,
            disabled: disableFields,
          }),
          createSelectField('region', 'Region', {
            options: region,
            placeholder: 'Choose Region',
            required: true,
          }),
          createTextField('industry', 'Industry', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_5_TO_25,
            regexErrorMessage:
              'Industry should contain only letters and between 5 to 25 characters',
            placeholder: 'Enter Industry',
          }),
          createTextField('project_manager', 'Project Manager', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
            placeholder: 'Enter Project Manager',
          }),
          createSelectField('region', 'Region', {
            options: region,
            placeholder: 'Choose Region',
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
          }),
          createSelectField('currency_rid', 'Currency', {
            options: currency,
            required: true,
            placeholder: 'Choose Currency',
          }),
          createSelectField('region', 'Region', {
            options: region,
            placeholder: 'Choose Region',
            required: true,
          }),
        ],
      },
      {
        sectionName: 'Contact Information',
        fillType: 'half',
        fields: [
          createTextField('project_manager', 'Project Manager', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: 'Letters Only and between 3 to 25 characters',
            placeholder: 'Enter Project Manager',
          }),
          createTextField(
            'project_Technical_point_of_contact_name',
            'Project Technical Point of Contact Name',
            {
              required: true,
              regex: REGEX_PATTERNS.LETTERS_3_TO_25,
              regexErrorMessage: 'Letters Only and between 3 to 25 characters',
              placeholder: 'Project Technical Point of Contact Name',
            }
          ),
          createTextField('project_lead', 'Project Lead', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Enter a valid email address',
            placeholder: 'Enter Project Lead',
          }),
          createTextField(
            'project_Technical_point_of_contact_email',
            'Project Technical Point of Contact Name Email',
            {
              required: true,
              regex: REGEX_PATTERNS.EMAIL,
              regexErrorMessage: 'Enter a valid email address',
              placeholder:
                'Enter Project Technical Point of Contact Name Email',
            }
          ),
          createTextField('spoc_name', 'SPOC Name', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
            placeholder: 'Enter SPOC Name',
          }),
          createTextField(
            'project_Technical_point_of_contact_mobile',
            'Project Technical Point of Contact Mobile',
            {
              required: true,
              regex: REGEX_PATTERNS.PHONE,
              regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
              placeholder: 'Enter Finance POC Phone',
            }
          ),
          createTextField('spoc_email', 'SPOC Email', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
            placeholder: 'Enter Primary Contact Phone',
          }),
          createTextField('project_cc_list', 'Project CC List', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
            placeholder: 'Enter Finance POC Phone',
          }),
          createTextField('spoc_mobile', 'SPOC Mobile', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Enter a valid number (e.g 9876543210)',
            placeholder: 'Enter SPOC Mobile',
          }),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        fields: [
          createSelectField('account_billing_type', 'Account Billing Type', {
            options: region,
            placeholder: 'Choose bill type',
            required: true,
          }),
          createTextField('total_non_labour_cost', 'Total Non Labour Cost', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total Non Labour Cost',
          }),
          createTextField('total-effort', 'Total Effort', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total Effort',
          }),
          createTextField('total_fte_effort', 'Total FTE Effort', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only maximum 10 digits',
            placeholder: 'Enter Total FTE Effort',
          }),
          createTextField('total_cost', 'Total Cost', {
            required: true,
            regex: REGEX_PATTERNS.NUMBERS,
            regexErrorMessage: 'Enter a valid annual revenue',
            placeholder: 'Enter Total Cost',
          }),
          createTextField('total_sub_con_effort', 'Total Sub Con Effort', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only maximum 10 digits',
            placeholder: 'Enter Total Sub Con Effort',
          }),
          createTextField('total_fte', 'Total FTE', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total FTE',
          }),
          createTextField('total_fte_cost', 'Total FTE Cost', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total FTE Cost',
          }),
          createTextField('total_sub_con', 'Total Sub Con', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total Sub Con',
          }),
          createTextField('total_sub_con_cost', 'Total Sub Con Cost', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total Sub Con Cost',
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        fields: [
          createTextField('last_rd_ai_assessed_on', 'Total Effort', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTRACTION,
            regexErrorMessage: 'Enter a number between 3 and 5',
            placeholder: 'Enter Total Effort',
          }),
          createTextField('last_rd_ai_assessed_by', 'Total FTE Effort', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only maximum 10 digits',
            placeholder: 'Enter Total FTE Effort',
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
            placeholder: 'Enter Description',
          }),
        ],
      },
    ],
    [country, parentAccount, region, disableFields, currency]
  );
};

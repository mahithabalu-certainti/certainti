import { useMemo } from 'react';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../common-utils';
import {
  mockDesignationOptions,
  mockResourceStatusOptions,
  mockSkillLevelOptions,
  mockStatusOptions,
} from '../../mockdata/resource-form';
import { FormType, SelectOption } from '../../types';

export const FormData = (
  country: SelectOption[],
  currency: SelectOption[],
  region: SelectOption[]
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('resource_ref_id', 'Resource Ref Id', {
            required: true,
            regex: REGEX_PATTERNS.ALPHANUMERIC,
            regexErrorMessage: 'Alphanumeric characters only',
            placeholder: 'Enter Resource Ref Id',
          }),
          createTextField('resource_full_name', 'Resource Full Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            regexErrorMessage: 'Letters and spaces only',
            placeholder: 'Enter Full Name',
          }),
          createTextField('resource_type', 'Resource Type', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Resource Type',
          }),
          createTextField('resource_org_name', 'Resource Org Name', {
            required: true,
            regex: REGEX_PATTERNS.ALPHANUMERIC,
            regexErrorMessage: 'Alphanumeric characters only',
            placeholder: 'Enter Organization Name',
          }),
          createTextField('resource_first_name', 'Resource First Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter First Name',
          }),
          createSelectField('resource_status', 'Resource Status', {
            options: mockResourceStatusOptions,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('resource_middle_name', 'Resource Middle Name', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Middle Name',
          }),
          createSelectField('status', 'Status', {
            options: mockStatusOptions,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('resource_last_name', 'Resource Last Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Last Name',
          }),
        ],
      },
      {
        sectionName: 'Contact Information',
        fillType: 'half',
        fields: [
          createTextField('resource_email', 'Resource Email', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            regexErrorMessage: 'Invalid email format',
            placeholder: 'Enter Email',
          }),
          createTextField('resource_mobile', 'Resource Mobile', {
            required: true,
            regex: REGEX_PATTERNS.PHONE,
            regexErrorMessage: 'Invalid phone number',
            placeholder: 'Enter Mobile Number',
          }),
        ],
      },
      {
        sectionName: 'Location and Currency Information',
        fillType: 'half',
        fields: [
          createSelectField('country', 'Country', {
            options: country,
            placeholder: '-Select-',
            required: true,
          }),
          createSelectField('region', 'Region', {
            options: region,
            placeholder: '-Select-',
            required: true,
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            placeholder: '-Select-',
            required: true,
          }),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        fields: [
          createDateField('financial_start_date', 'Effective From', {
            required: false,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
          }),
          createTextField('annual', 'Annual', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
          createTextField('semi_annual', 'Semi Annual', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
          createTextField('monthly', 'Monthly', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
          createTextField('bi_weekly', 'Bi Weekly', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
          createTextField('weekly', 'Weekly', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
          createTextField('daily', 'Daily', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
          createTextField('hourly', 'Hourly', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
            anyOneRequired: true,
          }),
        ],
      },
      {
        sectionName: 'Skill Information',
        fillType: 'half',
        fields: [
          createDateField('skill_start_date', 'Start Date', {
            required: false,
          }),
          createTextField('skill_name', 'Skill Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            regexErrorMessage: 'Letters and spaces only',
            placeholder: 'Enter Skill Name',
          }),
          createSelectField('skill_level', 'Skill Level', {
            options: mockSkillLevelOptions,
            placeholder: '-Select-',
            required: false,
          }),
          createTextField('years_of_experience', 'Years of Experience', {
            required: false,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter years of experience',
          }),
        ],
      },
      {
        sectionName: 'Employment Details',
        fillType: 'half',
        fields: [
          createDateField(
            'resource_effective_from',
            'Resource Effective From',
            {
              required: true,
            }
          ),
          createDateField('resource_end_date', 'Resource End Date', {
            required: false,
          }),
          createSelectField('designation', 'Designation', {
            options: mockDesignationOptions,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('manager_name', 'Manager Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            regexErrorMessage: 'Letters and spaces only',
            placeholder: 'Enter Manager Name',
          }),
        ],
      },
      {
        sectionName: 'Experience Information',
        fillType: 'half',
        fields: [
          createTextField(
            'total_years_of_experience',
            'Total Years of Experience',
            {
              required: true,
              regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
              regexErrorMessage: 'Numbers only',
              placeholder: 'Enter Years',
            }
          ),
          createTextField(
            'total_years_in_the_organisation',
            'Total Years in the Organisation',
            {
              required: true,
              regex: REGEX_PATTERNS.NUMBERS,
              regexErrorMessage: 'Numbers only',
              placeholder: 'Enter Years',
            }
          ),
        ],
      },
      {
        sectionName: 'Additional Information',
        fillType: 'full',
        fields: [
          createTextAreaField('description', 'Description', {
            required: false,
            placeholder: 'Enter any additional information...',
          }),
        ],
      },
    ],
    [country, currency, region]
  );
};

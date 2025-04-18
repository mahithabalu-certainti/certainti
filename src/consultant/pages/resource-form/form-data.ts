import { useMemo } from 'react';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../common-utils';
import {
  mockSkillLevelOptions
} from '../../mockdata/resource-form';
import { FormType, SelectOption } from '../../types';
import { resourceTypeOption, statusOption } from './utils';

export const FormData = (
  country: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  stateLoading?: boolean
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
          createTextField('resource_fullname', 'Resource Full Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Full Name',
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: resourceTypeOption,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('resource_orgname', 'Resource Org Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Organization Name',
          }),
          createTextField('resource_firstname', 'Resource First Name', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter First Name',
          }),
          createTextField('resource_middlename', 'Resource Middle Name', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Middle Name',
          }),
          createSelectField('resource_status', 'Status', {
            options: statusOption,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('resource_lastname', 'Resource Last Name', {
            required: false,
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
            onChange: true,
          }),
          createSelectField('region', 'Region', {
            options: state,
            placeholder: '-Select-',
            required: true,
            isLoading: stateLoading,
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
              required: false,
            }
          ),
          createDateField('resource_enddate', 'Resource End Date', {
            required: false,
          }),
          createTextField('designation', 'Designation', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            regexErrorMessage: 'Letters and spaces only',
            placeholder: 'Enter Designation',
          }),
          createTextField('manager_name', 'Manager Name', {
            required: false,
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
            'total_years_experience',
            'Total Years of Experience',
            {
              required: false,
              regex: REGEX_PATTERNS.NUMBERS_GREATER_THAN_ZERO,
              regexErrorMessage: 'Numbers Greater than Zero',
              placeholder: 'Enter Years',
            }
          ),
          createTextField(
            'total_years_in_org',
            'Total Years in the Organisation',
            {
              required: false,
              regex: REGEX_PATTERNS.NUMBERS_GREATER_THAN_ZERO,
              regexErrorMessage: 'Numbers Greater than Zero',
              placeholder: 'Enter Years',
            }
          ),
        ],
      },
      {
        sectionName: 'Additional Information',
        fillType: 'full',
        fields: [
          createTextAreaField('resource_desc', 'Description', {
            required: false,
            placeholder: 'Enter any additional information...',
          }),
        ],
      },
    ],
    [country, currency, state]
  );
};

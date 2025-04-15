import { useMemo } from 'react';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../common-utils';
import { FormType, SelectOption } from '../../types';
import { frequencyOption, resourceTypeOption, statusOption } from './utils';

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
          createSelectField('cost_frequency', 'Cost Frequency', {
            options: frequencyOption,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('cost', 'Cost', {
            required: true,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
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
            'total_years_oexperience',
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
    [country, currency, region]
  );
};

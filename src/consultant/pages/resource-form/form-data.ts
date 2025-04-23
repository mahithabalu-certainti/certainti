/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../common-utils';
import { mockSkillLevelOptions } from '../../mockdata/resource-form';
import { FormType, selectOptions } from '../../types';
import {
  FREQUENCY_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
} from './utils.tsx';

export const fiscalYears = Array.from({ length: 6 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year as any, label: `FY-${year}` };
});

const currentDate = new Date();
const minDate = new Date();
minDate.setFullYear(currentDate.getFullYear() - 6);

export const ResourceFormData = (
  country: selectOptions[],
  states: selectOptions[],
  city: selectOptions[],
  currency: selectOptions[],
  stateLoading?: boolean,
  cityLoading?: boolean,
  currencyLoading?: boolean,
  disableFields?: boolean,
  hideSkill?: string,
  disableCostAndSkill?: boolean
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
            disabled: disableFields || disableCostAndSkill,
          }),
          createTextField('resource_fullname', 'Resource Full Name', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Full Name',
            disabled: disableCostAndSkill,
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: RESOURCE_TYPE_OPTIONS,
            placeholder: '-Select-',
            required: true,
            disabled: disableCostAndSkill,
          }),
          createTextField('resource_orgname', 'Resource Org Name', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Organization Name',
            disabled: disableCostAndSkill,
          }),

          createSelectField('resource_status', 'Status', {
            options: RESOURCE_STATUS_OPTIONS,
            placeholder: '-Select-',
            required: true,
            disabled: disableCostAndSkill,
          }),

          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: '-Select-',
            required: true,
            onChange: true,
            disabled: disableCostAndSkill,
          }),
          createTextField('resource_role', 'Resource Role', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_3_TO_25,
            regexErrorMessage: '3-25 letters only',
            placeholder: 'Enter Resource Role',
            disabled: disableCostAndSkill,
          }),
        ],
      },
      {
        sectionName: 'Location and Currency Information',
        fillType: 'half',
        fields: [
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Select Country',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
            disabled: disableCostAndSkill,
          }),
          createSelectField('state', 'State/Province', {
            options: states,
            placeholder: 'Select State',
            required: false,
            onChange: true,
            isLoading: stateLoading,
            disabled: disableCostAndSkill,
          }),
          createSelectField('city', 'City', {
            options: city,
            placeholder: 'Select City',
            required: false,
            isLoading: stateLoading || cityLoading,
            disabled: disableCostAndSkill,
          }),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        hide: hideSkill === 'cost' ? false : true,
        fields: [
          createDateField('financial_start_date', 'Effective Date', {
            required: false,
            minDate: minDate.getTime(),
            maxDate: currentDate,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
            minDate: minDate.getTime(),
            maxDate: currentDate,
          }),
          createSelectField('cost_frequency', 'Cost Frequency', {
            options: FREQUENCY_OPTIONS,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('cost', 'Cost', {
            required: true,
            regex: REGEX_PATTERNS.NUMBER_OPTIONAL_DECIMAL,
            regexErrorMessage: 'Numbers only',
            placeholder: 'Enter Cost',
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            placeholder: '-Select-',
            required: false,
            isLoading: currencyLoading,
          }),
        ],
      },
      {
        sectionName: 'Skill Information',
        fillType: 'half',
        hide: hideSkill === 'skill' ? false : true,
        fields: [
          createDateField('skill_start_date', 'Start Date', {
            required: false,
            minDate: minDate.getTime(),
            maxDate: currentDate,
          }),
          createTextField('skill_name', 'Skill Name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_3_TO_100,
            regexErrorMessage: '4-25 letters only',
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
          createDateField('resource_startdate', 'Resource Effective From', {
            required: false,
            disabled: disableCostAndSkill,
          }),
          createDateField('resource_enddate', 'Resource End Date', {
            required: false,
            disabled: disableCostAndSkill,
          }),
          createTextField('designation', 'Designation', {
            required: false,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            regexErrorMessage: 'Letters and spaces only',
            placeholder: 'Enter Designation',
            disabled: disableCostAndSkill,
          }),
          createTextField(
            'total_years_experience',
            'Total Years of Experience',
            {
              required: false,
              regex: REGEX_PATTERNS.NUMBERS_GREATER_THAN_ZERO,
              regexErrorMessage: 'Numbers Greater than Zero',
              placeholder: 'Enter Years',
              disabled: disableCostAndSkill,
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
              disabled: disableCostAndSkill,
            }
          ),
        ],
      },
      {
        sectionName: 'Description',
        fillType: 'full',
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            placeholder: 'Enter any additional information...',
          }),
        ],
      },
    ],
    [
      city,
      cityLoading,
      country,
      disableFields,
      currencyLoading,
      stateLoading,
      states,
      disableCostAndSkill,
      hideSkill,
    ]
  );
};

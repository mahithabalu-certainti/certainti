import { useMemo } from 'react';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
  RESOURCE_REGEX,
} from '../../../common-utils';
import { mockSkillLevelOptions } from '../../mockdata/resource-form';
import { FormType, SelectOption } from '../../types';
import {
  FREQUENCY_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
} from './utils.tsx';

// 1. Extract date constants
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
} as const;

// 2. Extract fiscal years calculation
const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: String(year) };
  });
};

// 3. Extract date calculations
const getDateConstraints = (yearsBack: number) => {
  const currentDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(currentDate.getFullYear() - yearsBack);
  return { currentDate, minDate };
};

export const fiscalYears = getFiscalYears(DATE_CONFIG.FISCAL_YEARS_RANGE);
const { currentDate, minDate } = getDateConstraints(DATE_CONFIG.MIN_YEARS_BACK);

export const ResourceFormData = (
  country: SelectOption[],
  states: SelectOption[],
  city: SelectOption[],
  currency: SelectOption[],
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
          createTextField('resource_ref_id', 'Resource Ref ID', {
            required: true,
            regex: REGEX_PATTERNS.ALPHANUMERIC_SPEC_5_TO_50,
            regexErrorMessage: '5 to 50 alphanumeric characters',
            placeholder: 'Enter Resource Ref Id',
            disabled: disableFields || disableCostAndSkill,
          }),
          createTextField('resource_fullname', 'Resource Full Name', {
            required: false,
            regex: RESOURCE_REGEX.FULL_NAME,
            regexErrorMessage:
              '3 to 100 characters using letters, numbers, spaces, hyphens or apostrophes',
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
            regex: RESOURCE_REGEX.ORG_NAME,
            regexErrorMessage: '4 to 100 characters',
            placeholder: 'Enter Organization Name',
            disabled: disableCostAndSkill,
          }),

          createSelectField('resource_status', 'Resource Status', {
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
            regex: RESOURCE_REGEX.ROLE,
            regexErrorMessage: '4 to 100 characters',
            placeholder: 'Enter Resource Role',
            disabled: disableCostAndSkill,
          }),
          createTextField('r_number', 'Resource Number', {
            required: false,
            placeholder: 'Enter Resource Number',
            disabled: disableCostAndSkill,
            hide: !disableCostAndSkill,
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
            minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
          }),
          createSelectField('cost_frequency', 'Cost Frequency', {
            options: FREQUENCY_OPTIONS,
            placeholder: '-Select-',
            required: true,
          }),
          createTextField('cost', 'Cost', {
            required: true,
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage: 'Numbers with up to 2 decimal places',
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
            minDate: new Date(minDate.getTime()),
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
            regex: REGEX_PATTERNS.NUMBERS_GREATER_THAN_ZERO,
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
            maxDate: currentDate,
            disableFutureDates: true,
          }),
          createDateField('resource_enddate', 'Resource End Date', {
            required: false,
            disabled: disableCostAndSkill,
            minDate: currentDate,
            greaterThan: {
              field: 'resource_startdate',
              message:
                'Resource End Date must be after Resource Effective From',
            },
          }),
          createTextField('designation', 'Designation', {
            required: false,
            regex: RESOURCE_REGEX.DESIGNATION,
            regexErrorMessage: '4 to 100 characters',
            placeholder: 'Enter Designation',
            disabled: disableCostAndSkill,
          }),
          createTextField(
            'total_years_experience',
            'Total Years of Experience',
            {
              required: false,
              regex: RESOURCE_REGEX.YEARS_EXPERIENCE,
              regexErrorMessage: 'Enter whole numbers between 0 and 99',
              placeholder: 'Enter Total Years of Experience',
              disabled: disableCostAndSkill,
            }
          ),
          createTextField(
            'total_years_in_org',
            'Total Years in the Organisation',
            {
              required: false,
              regex: RESOURCE_REGEX.YEARS_EXPERIENCE,
              regexErrorMessage: 'Enter whole numbers between 0 and 99',
              placeholder: 'Enter total years in the organisation',
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
            regexErrorMessage: 'Maximum 1000 characters allowed',
            regex: RESOURCE_REGEX.DESCRIPTION,
          }),
        ],
      },
    ],
    [
      disableFields,
      disableCostAndSkill,
      country,
      states,
      stateLoading,
      city,
      cityLoading,
      currency,
      currencyLoading,
      hideSkill,
    ]
  );
};

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

const getSkillStartDateOptions = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `${year}`, value: String(year) };
  });
};

// 3. Extract date calculations
const getDateConstraints = (yearsBack: number) => {
  const currentDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(currentDate.getFullYear() - yearsBack);
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 1);
  return { currentDate, minDate, previousDate };
};

export const fiscalYears = getFiscalYears(DATE_CONFIG.FISCAL_YEARS_RANGE);
export const skillStartDateYears = getSkillStartDateOptions(
  DATE_CONFIG.FISCAL_YEARS_RANGE
);
const { currentDate, minDate, previousDate } = getDateConstraints(
  DATE_CONFIG.MIN_YEARS_BACK
);

export const ResourceFormData = (
  country: SelectOption[],
  states: SelectOption[],
  city: SelectOption[],
  currency: SelectOption[],
  skillTypeOptions: SelectOption[],
  skillSubTypeOptions: SelectOption[],
  stateLoading?: boolean,
  cityLoading?: boolean,
  currencyLoading?: boolean,
  skillSubTypeLoading?: boolean,
  disableFields?: boolean,
  disableCostAndSkill?: boolean,
  disableOrgname?: boolean,
  currentSkillType?: string,
  currentskillSubType?: string,
  disableSkill?: boolean,
  disableCost?: boolean,
  createResource?: boolean,
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        hide: disableCostAndSkill,
        fields: [
          createTextField('resource_ref_id', 'Resource Code', {
            required: true,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.LENGTH_3_TO_50_REGEX,
                errorMessage: 'Please enter 3-50 characters.',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_SPECIAL_REGEX,
                errorMessage:
                  'Cannot start with a number, hyphen, or underscore.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_REGEX,
                errorMessage:
                  'Only letters, numbers, hyphens, and underscores are allowed.',
              },
              {
                regex: REGEX_PATTERNS.NO_CONSECUTIVE_SPECIALS_REGEX,
                errorMessage:
                  'Consecutive hyphens or underscores are not allowed.',
              },
              {
                regex: REGEX_PATTERNS.NO_TRAILING_SPECIAL_REGEX,
                errorMessage: 'Cannot end with a hyphen or underscore.',
              },
            ],
            placeholder: 'Enter Resource Code',
            disabled: disableFields || disableCostAndSkill,
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: RESOURCE_TYPE_OPTIONS,
            placeholder: 'Select Resource Type',
            required: true,
            disabled: disableCostAndSkill || disableOrgname,
          }),
          createTextField('resource_fullname', 'Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.NAME_LENGTH_2_TO_64_REGEX,
                errorMessage: 'Please enter 2-64 characters.',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
                errorMessage:
                  'Name cannot start or end with a space, apostrophe, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
                errorMessage:
                  'Only letters, spaces, apostrophes, and hyphens are allowed.',
              },
              {
                regex: REGEX_PATTERNS.NO_CONSECUTIVE_SPECIALS_REGEX,
                errorMessage:
                  'Consecutive spaces, apostrophes, or hyphens are not allowed.',
              },
            ],
            placeholder: 'Enter Name',
            disabled: disableCostAndSkill,
          }),
          createTextField('resource_firstname', 'First Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.NAME_LENGTH_2_TO_64_REGEX,
                errorMessage: 'Please enter 2-64 characters.',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
                errorMessage:
                  'Name cannot start or end with a space, apostrophe, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
                errorMessage:
                  'Only letters, spaces, apostrophes, and hyphens are allowed.',
              },
              {
                regex: REGEX_PATTERNS.NO_CONSECUTIVE_SPECIALS_REGEX,
                errorMessage:
                  'Consecutive spaces, apostrophes, or hyphens are not allowed.',
              },
            ],
            placeholder: 'Enter First Name',
            disabled: disableCostAndSkill,
          }),
          createTextField('resource_lastname', 'Last Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.NAME_LENGTH_2_TO_64_REGEX,
                errorMessage: 'Please enter 2-64 characters.',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
                errorMessage:
                  'Name cannot start or end with a space, apostrophe, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
                errorMessage:
                  'Only letters, spaces, apostrophes, and hyphens are allowed.',
              },
              {
                regex: REGEX_PATTERNS.NO_CONSECUTIVE_SPECIALS_REGEX,
                errorMessage:
                  'Consecutive spaces, apostrophes, or hyphens are not allowed.',
              },
            ],
            placeholder: 'Enter Last Name',
            disabled: disableCostAndSkill,
          }),

          createTextField('resource_orgname', 'Resource Org Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.NAME_LENGTH_3_TO_100_REGEX,
                errorMessage: 'Please enter between 3 to 100 characters.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                errorMessage:
                  "Only letters, numbers, spaces, ampersands (&), hyphens (-), periods (.), apostrophes (') and commas (,) are allowed.",
              },
              {
                regex:
                  REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                errorMessage:
                  'Cannot start or end with a space or special character',
              },
            ],
            placeholder: 'Enter Resource Org Name',
            disabled: disableCostAndSkill,
            clearValue: {
              key: 'resource_type',
              matchedValue: RESOURCE_TYPE_OPTIONS[0].value || RESOURCE_TYPE_OPTIONS[1].value || RESOURCE_TYPE_OPTIONS[2].value ,
            },
          }),
          createTextField('resource_role', 'Role', {
            required: false,
            regex: RESOURCE_REGEX.ROLE,
            regexErrorMessage:
              'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
            placeholder: 'Enter Role',
            disabled: disableCostAndSkill,
          }),
          createSelectField('resource_status', 'Status', {
            options: RESOURCE_STATUS_OPTIONS,
            placeholder: 'Select Resource Status',
            required: true,
            disabled: disableCostAndSkill,
          }),
        ],
      },
      {
        sectionName: 'Location and Currency Information',
        fillType: 'half',
        hide: disableCostAndSkill,
        fields: [
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Select Country',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
            disabled: disableCostAndSkill,
          }),
          createSelectField('state', 'Region', {
            options: states,
            placeholder: 'Select Region',
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
        hide: !disableCost,
        fields: [
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Select Fiscal Year',
            required: true,
            onChange: true,
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            placeholder: 'Select Currency',
            required: false,
            isLoading: currencyLoading,
          }),
          createDateField('financial_start_date', 'Start Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
            startValue: false,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
            endDateValue: true,
            startDateLabel: 'financial_start_date',
          }),
          createSelectField('cost_frequency', 'Cost Frequency', {
            options: FREQUENCY_OPTIONS,
            placeholder: 'Select Cost Frequency',
            required: true,
          }),
          createTextField('cost', 'Cost', {
            required: true,
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Cost must be a 16-digit number with up to 2 decimals',
            placeholder: 'Enter Cost',
          }),
        ],
      },
      {
        sectionName: 'Skill Information',
        fillType: 'half',
        hide: !disableSkill,
        fields: [
          createSelectField('skill_start_date', 'Start Date', {
            options: skillStartDateYears,
            required: false,
            placeholder: 'Select Start Date',
            onChange: true,
          }),
          createSelectField('skill_type', 'Skill Type', {
            options: skillTypeOptions,
            placeholder: 'Select Skill Type',
            required: true,
            onChange: true,
            resetDependsFields: ['skill_sub_type'],
          }),
          createSelectField('skill_sub_type', 'Skill SubType', {
            options: skillSubTypeOptions,
            placeholder: 'Select Skill SubType',
            required: true,
            isLoading: skillSubTypeLoading,
            onChange: true,
          }),
          createTextField('skill_details', 'Skill Details', {
            required: true,
            placeholder: 'Enter Skill Details',
          }),
          createSelectField('skill_level', 'Skill Level', {
            options: mockSkillLevelOptions,
            placeholder: 'Select Skill Level',
            required: false,
          }),
          createTextField('skill_type_others', 'Skill Type(Other)', {
            required: true,
            placeholder: 'Enter Skill Type',
            hide:
              currentSkillType === 'f6044ae9-7b65-4cfc-8ad3-c18a8f7ee30a'
                ? false
                : true,
          }),
          createTextField('skill_subtype_others', 'Skill SubType(Other)', {
            required: true,
            placeholder: 'Enter Skill SubType',
            hide:
              currentskillSubType === 'b8894099-0385-4681-8237-21f89b0d1883'
                ? false
                : true,
          }),
        ],
      },
      {
        sectionName: 'Employment Details',
        fillType: 'half',
        hide: disableCostAndSkill,
        fields: [
          createDateField('resource_startdate', 'Effective Date', {
            required: false,
            disabled: disableCostAndSkill,
            minDate: new Date('1950-01-01'),
            maxDate: previousDate,
            disableFutureDates: true,
          }),
          createDateField('resource_enddate', 'End Date', {
            required: false,
            disabled: disableCostAndSkill,
            maxDate: currentDate,
            greaterThan: {
              field: 'resource_startdate',
              message: 'End Date must be after Effective Date',
            },
          }),
          createTextField('designation', 'Designation', {
            required: false,
            regex: RESOURCE_REGEX.DESIGNATION,
            regexErrorMessage:
              'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
            placeholder: 'Enter Designation',
            disabled: disableCostAndSkill,
          }),
          createTextField(
            'total_years_experience',
            'Total Years of Experience',
            {
              required: false,
              regex: RESOURCE_REGEX.YEARS_EXPERIENCE,
              regexErrorMessage:
                'Please enter a valid number between 0 and 99 with up to 2 decimals',
              placeholder: 'Enter Total Years Of Experience',
              disabled: disableCostAndSkill,
            }
          ),
          createTextField(
            'total_years_in_org',
            'Total Years in the Organisation',
            {
              required: false,
              regex: RESOURCE_REGEX.YEARS_EXPERIENCE,
              regexErrorMessage:
                'Please enter a valid number between 0 and 99 with up to 2 decimals',
              placeholder: 'Enter Total Years In The Organisation',
              disabled: disableCostAndSkill,
            }
          ),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            placeholder: 'Enter Comments',
            regexErrorMessage: 'Maximum 2000 characters allowed',
            regex: RESOURCE_REGEX.DESCRIPTION,
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: disableCostAndSkill || createResource,
        fields: [
          createTextField('Record_id', 'Record ID', {
            required: false,
            disabled: true,
            hide: disableCostAndSkill,
          }),
          createTextField('Resource_id', 'Resource ID', {
            required: false,
            disabled: true,
            hide: disableCostAndSkill,
          }),
          createTextField('Created_On', 'Created On', {
            required: false,
            disabled: true,
            hide: disableCostAndSkill,
          }),
          createTextField('Created_By', 'Created By', {
            required: false,
            disabled: true,
            hide: disableCostAndSkill,
          }),
          createTextField('Updated_On', 'Updated On', {
            required: false,
            disabled: true,
            hide: disableCostAndSkill,
          }),
          createTextField('Updated_By', 'Updated By', {
            required: false,
            disabled: true,
            hide: disableCostAndSkill,
          }),
        ],
      },
    ],
    [
      disableCostAndSkill,
      disableFields,
      disableOrgname,
      country,
      states,
      stateLoading,
      city,
      cityLoading,
      disableCost,
      currency,
      currencyLoading,
      disableSkill,
      skillTypeOptions,
      skillSubTypeOptions,
      skillSubTypeLoading,
      currentSkillType,
      currentskillSubType,
    ]
  );
};

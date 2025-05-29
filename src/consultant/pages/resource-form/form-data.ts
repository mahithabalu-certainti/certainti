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
import { RESOURCE_STATUS_OPTIONS, RESOURCE_TYPE_OPTIONS } from './utils.tsx';

// 1. Extract date constants
const minYear = 2000;
const currentYear = new Date().getFullYear();
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
  COST_FISCAL_YEARS_RANGE: currentYear - minYear + 1,
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

export const fiscalYears = getFiscalYears(DATE_CONFIG.COST_FISCAL_YEARS_RANGE);
export const skillStartDateYears = getSkillStartDateOptions(
  DATE_CONFIG.FISCAL_YEARS_RANGE
);
const { currentDate, previousDate } = getDateConstraints(
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
  disableOrgname?: string,
  currentSkillType?: string[],
  currentskillSubType?: string[],
  disableSkill?: boolean,
  disableCost?: boolean,
  createResource?: boolean,
  isResourceFullNameEmpty?: boolean,
  isAnyResourceNameFilled?: boolean,
  currentResource?: { resource_firstname: string; resource_lastname: string }
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        hide: disableCostAndSkill,
        fields: [
          createTextField('resource_code', 'Resource Code', {
            required: true,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Please enter more than 2 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_50,
                errorMessage: 'Max length exceeded',
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
                regex: REGEX_PATTERNS.NO_TRAILING_SPECIAL_REGEX,
                errorMessage: 'Cannot end with a hyphen or underscore.',
              },
            ],
            placeholder: 'Enter Resource Code',
            disabled: disableCostAndSkill,
            onChange: true,
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: RESOURCE_TYPE_OPTIONS,
            placeholder: 'Choose Resource Type',
            required: true,
            disabled: disableCostAndSkill,
            onChange: true,
            resetDependsFields: ['resource_orgname'],
          }),
          createTextField('resource_name', 'Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_2,
                errorMessage: 'PLease enter more than 1 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
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
            ],
            placeholder: 'Enter Name',
            disabled: disableCostAndSkill || isAnyResourceNameFilled,
            onChange: true,
            defaultValue:
              currentResource?.resource_firstname ||
              currentResource?.resource_lastname
                ? `${currentResource?.resource_firstname} ${currentResource?.resource_lastname}`
                : '',
          }),
          createTextField('resource_firstname', 'First Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_2,
                errorMessage: 'Please enter more than 1 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
                errorMessage:
                  'Frist name cannot start or end with a space, apostrophe, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
                errorMessage:
                  'Only letters, spaces, apostrophes, and hyphens are allowed.',
              },
            ],
            placeholder: 'Enter First Name',
            disabled: disableCostAndSkill || isResourceFullNameEmpty,
            onChange: true,
          }),
          createTextField('resource_lastname', 'Last Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_2,
                errorMessage: 'Please enter more than 1 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
                errorMessage:
                  'Last name cannot start or end with a space, apostrophe, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
                errorMessage:
                  'Only letters, spaces, apostrophes, and hyphens are allowed.',
              },
            ],
            placeholder: 'Enter Last Name',
            disabled: disableCostAndSkill || isResourceFullNameEmpty,
            onChange: true,
          }),

          createTextField('resource_orgname', 'Resource Org Name', {
            required:
              disableOrgname && disableOrgname !== 'Full-Time' ? true : false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Please enter more than 2 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_100,
                errorMessage: 'Max length exceeded.',
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
            disabled:
              disableOrgname && disableOrgname === 'Full-Time' ? true : false,
            clearValue: {
              key: 'resource_type',
              matchedValue: 'Full-Time',
            },
            defaultValue: '',
          }),
          createTextField('resource_role', 'Role', {
            required: false,

            placeholder: 'Enter Role',
            disabled: disableCostAndSkill,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Please enter more than 2 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
              },
              {
                regex: RESOURCE_REGEX.ROLE,
                errorMessage:
                  'Allows only letters, Apostrophe, spaces, hyphens, and Periods.',
              },
              {
                regex:
                  REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                errorMessage:
                  'Cannot start or end with a space or special character',
              },
            ],
          }),
          createSelectField('resource_status', 'Status', {
            options: RESOURCE_STATUS_OPTIONS,
            placeholder: 'Choose Status',
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
            placeholder: 'Choose Country',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
            disabled: disableCostAndSkill,
          }),
          createSelectField('state', 'Region', {
            options: states,
            placeholder: 'Choose Region',
            required: false,
            onChange: true,
            isLoading: stateLoading,
            disabled: disableCostAndSkill,
          }),
          createSelectField('city', 'City', {
            options: city,
            placeholder: 'Choose City',
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
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
            resetDependsFields: ['financial_start_date, financial_end_date'],
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            placeholder: 'Choose Currency',
            required: false,
            isLoading: currencyLoading,
          }),
          createDateField('financial_start_date', 'Start Date', {
            required: false,
            // minDate: new Date(minDate.getTime()),
            maxDate: previousDate,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
            // minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
            startDateLabel: 'financial_start_date',
          }),
          createTextField('annual_cost', 'Annual Compensation', {
            required: false,
            placeholder: 'Enter Annual Compensation',
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_COST_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
            group: 'compensation',
          }),
          createTextField('monthly_cost', 'Monthly Compensation', {
            required: false,
            placeholder: 'Enter Monthly Compensation',
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_COST_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
            group: 'compensation',
          }),
          createTextField('bi_weekly_cost', 'Bi-Weekly Compensation', {
            required: false,
            placeholder: 'Enter Bi-Weekly Compensation',
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_COST_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
            group: 'compensation',
          }),
          createTextField('weekly_cost', 'Weekly Compensation', {
            required: false,
            placeholder: 'Enter Weekly Compensation',
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_COST_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
            group: 'compensation',
          }),
          createTextField('daily_cost', 'Daily Compensation', {
            required: false,
            placeholder: 'Enter Daily Compensation',
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_COST_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
            group: 'compensation',
          }),
          createTextField('hourly_cost', 'Hourly Compensation', {
            required: false,
            placeholder: 'Enter Hourly Compensation',
            regex: REGEX_PATTERNS.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_COST_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
            group: 'compensation',
          }),
        ],
      },
      {
        sectionName: 'Skill Information',
        fillType: 'half',
        hide: !disableSkill,
        fields: [
          createDateField('skill_start_date', 'Start Date', {
            required: false,
            minDate: new Date('1950-01-01'),
            maxDate: currentDate,
            disableFutureDates: true,
          }),
          createSelectField('skill_type', 'Skill Type', {
            options: skillTypeOptions,
            placeholder: 'Choose Skill Type',
            required: true,
            onChange: true,
            resetDependsFields: ['skill_sub_type'],
          }),
          createTextField('skill_type_others', 'Skill Type(Others)', {
            required: true,
            placeholder: 'Enter Skill Type',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Skill type must more than 2 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
              },
              {
                regex:
                  REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                errorMessage:
                  'Cannot start or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.SKILL_OTHERS_ALLOWED_CHARS_REGEX,
                errorMessage:
                  "Only letters, hyphens (-), apostrophes ('), periods (.), underscores (_), and spaces are allowed.",
              },
            ],
            hide:
              currentSkillType?.[0] === 'f6044ae9-7b65-4cfc-8ad3-c18a8f7ee30a'
                ? false
                : true,
          }),
          createSelectField('skill_sub_type', 'Skill SubType', {
            options: skillSubTypeOptions,
            placeholder: 'Choose Skill SubType',
            required: true,
            isLoading: skillSubTypeLoading,
            onChange: true,
          }),
          createTextField('skill_subtype_others', 'Skill SubType(Others)', {
            required: true,
            placeholder: 'Enter Skill SubType',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Skill subtype must more than 2 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
              },
              {
                regex:
                  REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                errorMessage:
                  'Cannot start or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.SKILL_OTHERS_ALLOWED_CHARS_REGEX,
                errorMessage:
                  "Only letters, hyphens (-), apostrophes ('), periods (.), underscores (_), and spaces are allowed.",
              },
            ],
            hide:
              currentskillSubType?.[0] ===
              'b8894099-0385-4681-8237-21f89b0d1883'
                ? false
                : true,
          }),
          createTextField('skill_details', 'Skill Details', {
            required: true,
            placeholder: 'Enter Skill Details',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_2000,
                errorMessage: 'Input must be between 1 and 2,000 characters.',
              },
            ],
          }),
          createSelectField('skill_level', 'Skill Level', {
            options: mockSkillLevelOptions,
            placeholder: 'Choose Skill Level',
            required: false,
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
            placeholder: 'Enter Designation',
            disabled: disableCostAndSkill,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Please enter more than 2 characters.',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded.',
              },
              {
                regex: RESOURCE_REGEX.ROLE,
                errorMessage:
                  'Allows only letters, Apostrophe, spaces, hyphens, and Periods.',
              },
              {
                regex:
                  REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                errorMessage:
                  'Cannot start or end with a space or special character',
              },
            ],
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
            regexErrorMessage: 'Max length exceeded.',
            regex: RESOURCE_REGEX.DESCRIPTION,
            // disabled: disableCostAndSkill,
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
      isResourceFullNameEmpty,
      isAnyResourceNameFilled,
      currentResource,
    ]
  );
};

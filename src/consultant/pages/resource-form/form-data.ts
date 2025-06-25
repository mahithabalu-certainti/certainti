import { useMemo } from 'react';
import {
  createDateField,
  createEmptyField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
  RESOURCE_REGEX,
} from '../../../common-utils';
import { FormType, SelectOption } from '../../types';

// 1. Extract date constants
const minYear = 2000;
const currentYear = new Date().getFullYear();
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
  COST_FISCAL_YEARS_RANGE: currentYear - minYear + 1,
  TOTAL_YEARS: 20,
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
  minDate.setFullYear(currentDate.getFullYear() - yearsBack + 1);
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 1);
  return { currentDate, minDate, previousDate };
};

export const fiscalYears = getFiscalYears(DATE_CONFIG.COST_FISCAL_YEARS_RANGE);
const fiscalYearsCost = getFiscalYears(DATE_CONFIG.TOTAL_YEARS);
export const skillStartDateYears = getSkillStartDateOptions(
  DATE_CONFIG.FISCAL_YEARS_RANGE
);
const { currentDate, previousDate, minDate } = getDateConstraints(
  DATE_CONFIG.COST_FISCAL_YEARS_RANGE
);

export const ResourceFormData = (
  statusOptions: SelectOption[],
  resourceTypeOptions: SelectOption[],
  skillLevelOptions: SelectOption[],
  resourceStatusOptions: SelectOption[],
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
  disableCostAndSkill?: boolean,
  disableOrgname?: boolean,
  currentSkillType?: string[],
  currentskillSubType?: string[],
  disableSkill?: boolean,
  disableCost?: boolean,
  isResourceFullNameEmpty?: boolean,
  isAnyResourceNameFilled?: boolean,
  isresourceType?: boolean,
  isSalaryRequired?: boolean,
  isEditView?: boolean,
  currentResource?: { resource_firstname: string; resource_lastname: string },
  autoCalculatedValue?: number,
  accountName?: string
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
            ],
            placeholder: 'Enter Resource Code',
            disabled: disableCostAndSkill,
            onChange: true,
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: resourceTypeOptions,
            placeholder: 'Choose Resource Type',
            required: true,
            disabled: disableCostAndSkill,
            onChange: true,
            resetDependsFields: ['resource_orgname'],
          }),
          createTextField('resource_orgname', 'Resource Org Name', {
            required: !disableOrgname,
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
            disabled: disableOrgname,
            clearValue: {
              key: 'resource_type',
              matchedValue: 'Full-Time',
            },
            defaultValue: '',
          }),
          createTextField('resource_name', 'Name', {
            required: false,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_2,
                errorMessage: 'PLease enter more than 1 characters.',
              },
              {
                regex: REGEX_PATTERNS.CONSECUTIVE_SPECIAL_CHARS,
                errorMessage:
                  'Consecutive spaces, hyphens, and apostrophes are not allowed.',
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
                regex: REGEX_PATTERNS.CONSECUTIVE_SPECIAL_CHARS,
                errorMessage:
                  'Consecutive spaces, hyphens, and apostrophes are not allowed.',
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
                regex: REGEX_PATTERNS.CONSECUTIVE_SPECIAL_CHARS,
                errorMessage:
                  'Consecutive spaces, hyphens, and apostrophes are not allowed.',
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
            ],
          }),
          createSelectField('resource_status', 'Status', {
            options: statusOptions,
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
        sectionName: 'Basic Information',
        fillType: 'half',
        hide: !disableCostAndSkill,
        fields: [
          createTextField('account_name', 'Account Name', {
            required: false,
            placeholder: 'Enter Resource Code',
            disabled: true,
            onChange: true,
            defaultValue: accountName,
          }),
          createTextField('resource_code', 'Resource Code', {
            required: false,
            placeholder: 'Enter Resource Code',
            disabled: true,
            onChange: true,
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: resourceTypeOptions,
            placeholder: 'Choose Resource Type',
            required: false,
            disabled: true,
          }),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        hide: !disableCost,
        fields: [
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYearsCost,
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
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createDateField('financial_start_date', 'Effective From', {
            required: false,
            minDate: minDate,
            maxDate: previousDate,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
            minDate: minDate,
            maxDate: currentDate,
            startDateLabel: 'financial_start_date',
          }),
          createTextField('effort_in_hrs', 'Effort In Hrs', {
            required: true,
            placeholder: 'Enter Effort In Hrs',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          }),
          createTextField('salary', 'Salary', {
            required: false,
            placeholder: 'Enter Salary',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            hide: !isresourceType,
            onChange: true,
          }),
          createTextField('bonus', 'Bonus', {
            required: false,
            placeholder: 'Enter Bonus',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            hide: !isresourceType,
            onChange: true,
          }),
          createTextField('insurance', 'Insurance', {
            required: false,
            placeholder: 'Enter Insurance',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            hide: !isresourceType,
            onChange: true,
          }),
          createTextField('deductions', 'Deductions', {
            required: false,
            placeholder: 'Enter Deductions',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            onChange: true,
          }),
          createTextField('resource_cost', 'Resource Cost', {
            required: isSalaryRequired,
            placeholder: 'Enter Cost',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            onChange: true,
          }),
          createTextField('net_resource_cost', 'Net Resource Cost', {
            required: false,
            disabled: true,
            defaultValue: autoCalculatedValue
              ? autoCalculatedValue.toString()
              : '0',
          }),
          createSelectField('resource_status', 'Status', {
            options: resourceStatusOptions,
            placeholder: 'Choose Status',
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
        ],
      },
      {
        sectionName: 'Skills Information',
        fillType: 'half',
        hide: !disableSkill,
        fields: [
          createDateField('skill_start_date', 'Effective From', {
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
          createSelectField('skill_level', 'Skill Level', {
            options: skillLevelOptions,
            placeholder: 'Choose Skill Level',
            required: false,
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'half',
        hide: !disableSkill,
        fields: [
          createTextAreaField('skill_details', 'Skill Details', {
            required: true,
            placeholder: 'Enter Skill Details',
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Input must be between 1 and 2,000 characters.',
          }),
        ],
      },
      {
        sectionName: 'Employment Details',
        fillType: 'half',
        hide: disableCostAndSkill,
        fields: [
          createDateField('resource_startdate', 'Effective From', {
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
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
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
              placeholder: 'Enter Total Years in the Organisation',
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
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !isEditView,
        fields: [
          createTextField('Record_id', 'Record ID', {
            required: false,
            disabled: true,
            // hide: disableCostAndSkill,
          }),
          createTextField('Created_On', 'Created On', {
            required: false,
            disabled: true,
            // hide: disableCostAndSkill,
          }),
          createTextField('Created_By', 'Created By', {
            required: false,
            disabled: true,
            // hide: disableCostAndSkill,
          }),
          // hide: disableCostAndSkill,
          createTextField(
            'Resource_id',
            `${disableCost ? 'Cost ID' : disableSkill ? 'Skill ID' : 'Resource ID'}`,
            {
              required: false,
              disabled: true,
              // hide: disableCostAndSkill,
            }
          ),
          createTextField('Updated_On', 'Updated On', {
            required: false,
            disabled: true,
            // hide: disableCostAndSkill,
          }),
          createTextField('Updated_By', 'Updated By', {
            required: false,
            disabled: true,
            // hide: disableCostAndSkill,
          }),
        ],
      },
    ],
    [
      disableCostAndSkill,
      resourceTypeOptions,
      disableOrgname,
      isAnyResourceNameFilled,
      currentResource?.resource_firstname,
      currentResource?.resource_lastname,
      isResourceFullNameEmpty,
      statusOptions,
      country,
      states,
      stateLoading,
      city,
      cityLoading,
      accountName,
      disableCost,
      currency,
      currencyLoading,
      isresourceType,
      isSalaryRequired,
      autoCalculatedValue,
      resourceStatusOptions,
      isEditView,
      disableSkill,
      skillTypeOptions,
      currentSkillType,
      skillSubTypeOptions,
      skillSubTypeLoading,
      currentskillSubType,
      skillLevelOptions,
    ]
  );
};

export default ResourceFormData;

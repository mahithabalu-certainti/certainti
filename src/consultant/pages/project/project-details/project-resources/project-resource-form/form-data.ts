import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../../types';
// import {
//   PROJECT_RESOURCE_STATUS_OPTIONS,
//   PROJECT_RESOURCE_TYPE_OPTIONS,
// } from './utils';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_RESOURCE_REGEX,
  REGEX_PATTERNS,
} from '../../../../../../common-utils';

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
// const getDateConstraints = (yearsBack: number) => {
//   const currentDate = new Date();
//   const minDate = new Date();
//   minDate.setFullYear(currentDate.getFullYear() - yearsBack);
//   const previousDate = new Date(currentDate);
//   previousDate.setDate(currentDate.getDate() - 1);
//   return { currentDate, minDate, previousDate };
// };

export const fiscalYears = getFiscalYears(DATE_CONFIG.FISCAL_YEARS_RANGE);
// const {
// currentDate,
// previousDate,
// } = getDateConstraints(DATE_CONFIG.MIN_YEARS_BACK);

export const ProjectResourceFormData = (
  projectResourceCodes: SelectOption[],
  projectTypes: SelectOption[],
  projectResourceSkillType: SelectOption[],
  projectResourceRollSkill: SelectOption[],
  resourceStatusOptions: SelectOption[],
  country: SelectOption[],
  states: SelectOption[],
  // city: SelectOption[],
  currency: SelectOption[],
  showSkillRoleOthersField: boolean,
  isResourceType: boolean,
  stateLoading?: boolean,
  // cityLoading?: boolean,
  // currencyLoading?: boolean,
  // disableFields?: boolean,
  // isEditView?: boolean
  projectPFY?: string | null
): FormType[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const endDateMax = projectPFY
    ? Number(projectPFY) === currentYear
      ? today
      : new Date(`${projectPFY}-12-31`)
    : undefined;
  const previousDate = new Date(today);
  previousDate.setDate(today.getDate() - 1);

  const startDateMin = projectPFY ? new Date(`${projectPFY}-01-01`) : undefined;

  const startDateMax = projectPFY
    ? Number(projectPFY) === currentYear
      ? previousDate
      : new Date(`${projectPFY}-12-31`)
    : undefined;

  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createSelectField('resource_code', 'Resource Code', {
            options: projectResourceCodes,
            required: true,
            placeholder: 'Enter Resource Code',
          }),
          createSelectField('resource_type_rid', 'Resource Type', {
            options: projectTypes,
            placeholder: 'Choose Resource Type',
            required: false,
            onChange: true,
            resetDependsFields: [
              'salary',
              'bonus',
              'insurance',
              'resource_orgname',
            ],
          }),
          createTextField('resource_orgname', 'Resource Org Name', {
            required: isResourceType ? false : true,
            regex: PROJECT_RESOURCE_REGEX.ORG_NAME,
            regexErrorMessage:
              'Please enter 3-100 characters, including at least one letter. Special characters other than ampersand, hyphen, period, comma are not allowed.',
            placeholder: 'Enter Organization Name',
            // hide: isResourceType,
            disabled: isResourceType,
          }),
          createTextField('resource_name', 'Resource Name', {
            required: false,
            regex: PROJECT_RESOURCE_REGEX.RESOURCE_NAME,
            regexErrorMessage:
              "Please enter 2–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
            placeholder: 'Enter Resource Name',
          }),
          createTextField('designation', 'Designation', {
            required: false,
            regex: PROJECT_RESOURCE_REGEX.DESIGNATION,
            regexErrorMessage:
              "Please enter 3–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
            placeholder: 'Enter Resource Role',
          }),
          createTextField('resource_role', 'Resource Role', {
            required: false,
            regex: PROJECT_RESOURCE_REGEX.ROLE,
            regexErrorMessage:
              "Please enter 2–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
            placeholder: 'Enter Resource Role',
          }),
          createSelectField(
            'assigned_skill_role_type_rid',
            'Resource Skill Role Type',
            {
              options: projectResourceSkillType,
              placeholder: 'Choose Resource Skill Role Type',
              required: false,
              onChange: true,
              resetDependsFields: ['skill_role_rid', 'skill_role_others'],
            }
          ),
          createSelectField('skill_role_rid', 'Resource Skill Role', {
            options: projectResourceRollSkill,
            placeholder: 'Choose Resource Skill Role',
            required: true,
            hide: !showSkillRoleOthersField,
          }),
          createTextField('skill_role_others', 'Resource Skill Role Others', {
            required: true,
            regex: PROJECT_RESOURCE_REGEX.ROLE,
            regexErrorMessage:
              'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
            placeholder: 'Enter Resource Skill Role Others',
            hide: !showSkillRoleOthersField,
          }),
          // createSelectField('fiscal_year', 'Fiscal Year', {
          //   options: fiscalYears,
          //   placeholder: '-Select-',
          //   required: true,
          //   onChange: true,
          // }),
          createSelectField('status_rid', 'Resource Status', {
            options: resourceStatusOptions,
            placeholder: 'Choose Resource Status',
            required: false,
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
            required: false,
            onChange: true,
            resetDependsFields: ['region_rid'],
          }),
          createSelectField('region_rid', 'Region', {
            options: states,
            placeholder: 'Choose Region',
            required: false,
            isLoading: stateLoading,
          }),
          createSelectField('currency_rid', 'Currency', {
            options: currency,
            required: false,
            placeholder: 'Choose Currency',
          }),
        ],
      },
      {
        sectionName: 'Project Details',
        fillType: 'half',
        fields: [
          createDateField('start_date', 'Effective From', {
            required: false,
            minDate: startDateMin,
            maxDate: startDateMax,
            disableFutureDates: true,
          }),
          createDateField('end_date', 'End Date', {
            required: false,
            minDate: projectPFY ? new Date(`${projectPFY}-01-01`) : undefined,
            maxDate: endDateMax,
            greaterThan: {
              field: 'start_date',
              message: 'End Date must be after Start Date',
            },
          }),
          createTextField('total_hours_pro_res', 'Effort', {
            required: false,
            regex: PROJECT_RESOURCE_REGEX.EFFORT,
            regexErrorMessage: 'Effort must be a positive number',
            placeholder: 'Enter an effort',
          }),
          createTextField('salary', 'Salary', {
            required: false,
            placeholder: 'Enter Salary',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            hide: !isResourceType,
          }),
          createTextField('bonus', 'Bonus', {
            required: false,
            placeholder: 'Enter Bonus',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            hide: !isResourceType,
            onChange: true,
          }),
          createTextField('insurance', 'Insurance', {
            required: false,
            placeholder: 'Enter Insurance',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            hide: !isResourceType,
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
          createTextField('total_cost_pro_res', 'Cost', {
            required: false,
            regex: PROJECT_RESOURCE_REGEX.COST_REGEX,
            regexErrorMessage:
              'Cost must be a 18-digit number with up to 2 decimals',
            placeholder: 'Enter Cost',
          }),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        fields: [
          createTextAreaField('description', 'Comments', {
            required: false,
            placeholder: 'Enter Comments',
            regexErrorMessage: 'Maximum 2000 characters allowed',
            regex: PROJECT_RESOURCE_REGEX.DESCRIPTION,
          }),
        ],
      },
    ],
    [
      projectResourceCodes,
      projectTypes,
      isResourceType,
      projectResourceSkillType,
      projectResourceRollSkill,
      showSkillRoleOthersField,
      resourceStatusOptions,
      country,
      states,
      stateLoading,
      currency,
      startDateMin,
      startDateMax,
      projectPFY,
      endDateMax,
    ]
  );
};

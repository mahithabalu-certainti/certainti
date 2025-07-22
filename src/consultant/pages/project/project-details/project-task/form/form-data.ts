import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../../types';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_TASK_REGEX,
} from '../../../../../../common-utils';
// import {
//   PROJECT_TASK_STATUS_OPTIONS,
//   PROJECT_TASK_TYPE_OPTIONS,
// } from './utils';

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
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 1);
  return { currentDate, minDate, previousDate };
};

export const fiscalYears = getFiscalYears(DATE_CONFIG.FISCAL_YEARS_RANGE);
const { currentDate, previousDate } = getDateConstraints(
  DATE_CONFIG.MIN_YEARS_BACK
);

export const ProjectTaskFormData = (
  country: SelectOption[],
  states: SelectOption[],
  // city: SelectOption[],
  currency: SelectOption[],
  stateLoading?: boolean,
  // cityLoading?: boolean,
  // currencyLoading?: boolean,
  disableFields?: boolean
  // isEditView?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          // createTextField('project_task_id', 'Project Task ID', {
          //   required: false,
          //   regex: PROJECT_TASK_REGEX.RESOURCE_CODE,
          //   regexErrorMessage:
          //     'Please enter 3-50 characters. Special characters are not allowed.',
          //   placeholder: 'Enter Project Task ID',
          //   disabled: disableFields,
          // }),
          // createTextField('resource_code', 'Resource Code', {
          //   required: false,
          //   regex: PROJECT_TASK_REGEX.FULL_NAME,
          //   regexErrorMessage:
          //     'Please enter 3-100 characters, including at least one letter. Special characters and numbers are not allowed.',
          //   placeholder: 'Enter Resource Code',
          //   disabled: disableFields,
          // }),
          // createSelectField('resource_type', 'Resource Type', {
          //   options: PROJECT_TASK_TYPE_OPTIONS,
          //   placeholder: '-Select-',
          //   required: true,
          // }),
          createTextField('project_resource_code', 'Project Resource Code', {
            required: false,
            regex: PROJECT_TASK_REGEX.ORG_NAME,
            regexErrorMessage:
              'Please enter 3-50 characters. Special characters are not allowed.',
            placeholder: 'Enter Project Resource Code',
            disabled: disableFields,
          }),
          // createTextField('designation', 'Designation', {
          //   required: false,
          //   regex: PROJECT_TASK_REGEX.DESIGNATION,
          //   regexErrorMessage:
          //     'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
          //   placeholder: 'Enter Resource Role',
          // }),
          // createTextField('resource_role', 'Resource Role', {
          //   required: false,
          //   regex: PROJECT_TASK_REGEX.ROLE,
          //   regexErrorMessage:
          //     'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
          //   placeholder: 'Enter Resource Role',
          // }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: '-Select-',
            required: true,
            onChange: true,
          }),
          // createSelectField('resource_status', 'Resource Status', {
          //   options: PROJECT_TASK_STATUS_OPTIONS,
          //   placeholder: '-Select-',
          //   required: false,
          // }),
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
            resetDependsFields: ['region'],
          }),
          createSelectField('region', 'Region', {
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
          createDateField('resource_startdate', 'Effective From', {
            required: false,
            minDate: new Date('1950-01-01'),
            maxDate: previousDate,
            disableFutureDates: true,
          }),
          createDateField('resource_enddate', 'End Date', {
            required: false,
            maxDate: currentDate,
            greaterThan: {
              field: 'resource_startdate',
              message: 'End Date must be after Start Date',
            },
          }),
          createTextField('cost', 'Cost', {
            required: false,
            regex: PROJECT_TASK_REGEX.COST_REGEX,
            regexErrorMessage:
              'Cost must be a 18-digit number with up to 2 decimals',
            placeholder: 'Enter Cost',
          }),
          createTextField('effort', 'Effort', {
            required: false,
            regex: PROJECT_TASK_REGEX.EFFORT,
            regexErrorMessage: 'Effort must be a positive number',
            placeholder: 'Enter an effort',
          }),
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
            regex: PROJECT_TASK_REGEX.DESCRIPTION,
          }),
        ],
      },
    ],
    [
      disableFields,
      country,
      states,
      stateLoading,
      //   city,
      //   cityLoading,
      currency,
      // currencyLoading,
    ]
  );
};

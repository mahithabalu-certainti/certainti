import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../../types';
import {
  createAutoCompleteField,
  createDateField,
  // createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_TASK_REGEX,
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
  memoizedProjectResourceCode: SelectOption[],
  // country: SelectOption[],
  // states: SelectOption[],
  // city: SelectOption[],
  // currency: SelectOption[],
  // stateLoading?: boolean,
  // cityLoading?: boolean,
  // currencyLoading?: boolean,
  // disableFields?: boolean
  // isEditView?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          // createTextField('resource_code', 'Resource Code', {
          //   required: false,
          //   regex: PROJECT_TASK_REGEX.ORG_NAME,
          //   regexErrorMessage:
          //     'Please enter 3-50 characters. Special characters are not allowed.',
          //   placeholder: 'Enter Resource Code',
          //   disabled: disableFields,
          // }),
          createAutoCompleteField('resource_code', 'Resource Code', {
            options: memoizedProjectResourceCode,
            // options: [{ label: 'one', value: 'one' }, { label: 'two', value: 'two' }, { label: 'three', value: 'three' },],
            required: true,
            onChange: true,
            placeholder: 'Enter Resource Code',
          }),
          // createTextField('resource_role', 'Resource Role', {
          //   required: false,
          //   regex: PROJECT_TASK_REGEX.ROLE,
          //   regexErrorMessage:
          //     'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
          //   placeholder: 'Enter Resource Role',
          // }),
          // createSelectField('fiscal_year', 'Fiscal Year', {
          //   options: fiscalYears,
          //   placeholder: '-Select-',
          //   required: true,
          //   onChange: true,
          // }),
          // createSelectField('resource_status', 'Resource Status', {
          //   options: PROJECT_TASK_STATUS_OPTIONS,
          //   placeholder: '-Select-',
          //   required: false,
          // }),
        ],
      },
      // {
      //   sectionName: 'Location and Currency Information',
      //   fillType: 'half',
      //   fields: [
      //     createSelectField('country_rid', 'Country', {
      //       options: country,
      //       placeholder: 'Choose Country',
      //       required: false,
      //       onChange: true,
      //       resetDependsFields: ['region'],
      //     }),
      //     createSelectField('region_rid', 'Region', {
      //       options: states,
      //       placeholder: 'Choose Region',
      //       required: false,
      //       isLoading: stateLoading,
      //     }),
      //     createSelectField('currency_rid', 'Currency', {
      //       options: currency,
      //       required: false,
      //       placeholder: 'Choose Currency',
      //     }),
      //   ],
      // },
      {
        sectionName: 'Project Details',
        fillType: 'half',
        fields: [
          createDateField('start_date', 'Effective From', {
            required: false,
            minDate: new Date('1950-01-01'),
            maxDate: previousDate,
            disableFutureDates: true,
          }),
          createDateField('end_date', 'End Date', {
            required: false,
            maxDate: currentDate,
            greaterThan: {
              field: 'resource_startdate',
              message: 'End Date must be after Start Date',
            },
          }),
          createTextField('total_cost_pro_task', 'Cost', {
            required: false,
            regex: PROJECT_TASK_REGEX.COST_REGEX,
            regexErrorMessage:
              'Cost must be a 18-digit number with up to 2 decimals',
            placeholder: 'Enter Cost',
          }),
          createTextField('total_hours_pro_task', 'Effort', {
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
    [memoizedProjectResourceCode]
  );
};

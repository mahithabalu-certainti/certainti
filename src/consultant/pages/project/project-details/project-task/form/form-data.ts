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
import { FiscalYearType } from '../../../../../types/project';

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
// const { currentDate, previousDate } = getDateConstraints(
//   DATE_CONFIG.MIN_YEARS_BACK
// );

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
  isEditView?: boolean,
  projectPFY?: FiscalYearType | undefined,
  permissionMapTaskForm?: Record<string, { read: boolean; edit: boolean }>,
): FormType[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const endDateMax =
    projectPFY?.endDate && Number(projectPFY.year) !== currentYear
      ? new Date(projectPFY.endDate)
      : today;

  const previousDate = new Date(today);
  previousDate.setDate(today.getDate() - 1);

  const startDateMin = projectPFY?.startDate
    ? new Date(projectPFY.startDate)
    : undefined;

  const startDateMax = projectPFY?.endDate
    ? Number(projectPFY.year) === currentYear
      ? previousDate
      : (() => {
        const date = new Date(projectPFY.endDate);
        date.setDate(date.getDate() - 1);
        return date;
      })()
    : undefined;
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createAutoCompleteField('resource_code', 'Resource Code', {
            options: memoizedProjectResourceCode,
            required: true,
            onChange: true,
            placeholder: 'Enter Resource Code',
            disabled:
              isEditView &&
              permissionMapTaskForm?.['resource_code']?.read &&
              !permissionMapTaskForm?.['resource_code']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['resource_code']?.read &&
              !permissionMapTaskForm?.['resource_code']?.edit,
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
            minDate: startDateMin,
            maxDate: startDateMax,
            disableFutureDates: true,
            // disabled:
            //   isEditView &&
            //   permissionMapTaskForm?.['start_date']?.read &&
            //   !permissionMapTaskForm?.['start_date']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMapTaskForm?.['start_date']?.read &&
            //   !permissionMapTaskForm?.['start_date']?.edit,
          }),
          createDateField('end_date', 'End Date', {
            required: false,
            minDate: startDateMin,
            maxDate: endDateMax,
            greaterThan: {
              field: 'resource_startdate',
              message: 'End Date must be after Start Date',
            },
            // disabled:
            //   isEditView &&
            //   permissionMapTaskForm?.['end_date']?.read &&
            //   !permissionMapTaskForm?.['end_date']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMapTaskForm?.['end_date']?.read &&
            //   !permissionMapTaskForm?.['end_date']?.edit,
          }),
          createTextField('total_cost_pro_task', 'Cost', {
            required: false,
            regex: PROJECT_TASK_REGEX.COST_REGEX,
            regexErrorMessage:
              'Cost must be a 18-digit number with up to 2 decimals',
            placeholder: 'Enter Cost',
            disabled:
              isEditView &&
              permissionMapTaskForm?.['total_cost_pro_task']?.read &&
              !permissionMapTaskForm?.['total_cost_pro_task']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['total_cost_pro_task']?.read &&
              !permissionMapTaskForm?.['total_cost_pro_task']?.edit,
          }),
          createTextField('total_hours_pro_task', 'Effort', {
            required: false,
            regex: PROJECT_TASK_REGEX.EFFORT,
            regexErrorMessage: 'Effort must be a positive number',
            placeholder: 'Enter an effort',
            disabled:
              isEditView &&
              permissionMapTaskForm?.['total_hours_pro_task']?.read &&
              !permissionMapTaskForm?.['total_hours_pro_task']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['total_hours_pro_task']?.read &&
              !permissionMapTaskForm?.['total_hours_pro_task']?.edit,
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
            disabled:
              isEditView &&
              permissionMapTaskForm?.['comments']?.read &&
              !permissionMapTaskForm?.['comments']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['comments']?.read &&
              !permissionMapTaskForm?.['comments']?.edit,
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !isEditView,
        fields: [
          createTextField('rid', 'Record ID', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['rid']?.read &&
              !permissionMapTaskForm?.['rid']?.edit,
          }),
          createTextField('created_datetime', 'Created On', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['created_datetime']?.read &&
              !permissionMapTaskForm?.['created_datetime']?.edit,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['created_by']?.read &&
              !permissionMapTaskForm?.['created_by']?.edit,
          }),
          createTextField('r_number', 'Project Task ID', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['r_number']?.read &&
              !permissionMapTaskForm?.['r_number']?.edit,
          }),
          createTextField('modified_datetime', 'Updated On', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['modified_datetime']?.read &&
              !permissionMapTaskForm?.['modified_datetime']?.edit,
          }),
          createTextField('modified_by', 'Updated By', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['modified_by']?.read &&
              !permissionMapTaskForm?.['modified_by']?.edit,
          }),
        ],
      },
    ],
    [endDateMax, isEditView, memoizedProjectResourceCode, permissionMapTaskForm, startDateMax, startDateMin]
  );
};

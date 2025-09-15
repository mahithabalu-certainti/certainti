import { useMemo } from 'react';
import {
  FormFiscalDateType,
  FormType,
  SelectOption,
  SelectResourceOption,
} from '../../../../../types';
import {
  createAutoCompleteField,
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_RESOURCE_REGEX,
  REGEX_PATTERNS,
  // REGEX_PATTERNS,
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
  projectResourceCodes: SelectResourceOption[],
  // projectTypes: SelectOption[],
  // projectResourceSkillType: SelectOption[],
  // projectResourceRollSkill: SelectOption[],
  resourceStatusOptions: SelectOption[],
  country: SelectOption[],
  states: SelectOption[],
  // city: SelectOption[],
  currency: SelectOption[],
  // showSkillRoleOthersField: boolean,
  isResourceType: boolean,
  stateLoading?: boolean,
  // cityLoading?: boolean,
  // currencyLoading?: boolean,
  // disableFields?: boolean,
  autoCalculatedValue?: number,
  isSalaryRequired?: boolean,
  isEditView?: boolean,
  fiscalDate?: FormFiscalDateType,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createAutoCompleteField('resource_code', 'Resource Code', {
            options: projectResourceCodes,
            required: true,
            onChange: true,
            showCreateBtn: true,
            placeholder: 'Choose Resource Code',
            resetDependsFields: [
              'salary',
              'bonus',
              'insurance',
              'resource_orgname',
            ],
            disabled:
              isEditView &&
              permissionMap?.['resource_code']?.read &&
              !permissionMap?.['resource_code']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['resource_code']?.read &&
              !permissionMap?.['resource_code']?.edit,
          }),
          createTextField('project_resource_role', 'Project Resource Role', {
            placeholder: 'Enter Project Resource Role',
            required: false,
            disabled:
              isEditView &&
              permissionMap?.['project_resource_role']?.read &&
              !permissionMap?.['project_resource_role']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_resource_role']?.read &&
              !permissionMap?.['project_resource_role']?.edit,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_ORG_NAME_LEGNTH,
                errorMessage:
                  'Business Name must be more than 6 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_125,
                errorMessage: 'Maximum length exceeded.',
              },
              {
                regex: REGEX_PATTERNS.ACCOUNT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes (') and commas (,)",
              },
            ],
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
            disabled:
              isEditView &&
              permissionMap?.['country_rid']?.read &&
              !permissionMap?.['country_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['country_rid']?.read &&
              !permissionMap?.['country_rid']?.edit,
          }),
          createSelectField('region_rid', 'Region', {
            options: states,
            placeholder: 'Choose Region',
            required: false,
            isLoading: stateLoading,
            disabled:
              isEditView &&
              permissionMap?.['region_rid']?.read &&
              !permissionMap?.['region_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['region_rid']?.read &&
              !permissionMap?.['region_rid']?.edit,
          }),
          createSelectField('currency_rid', 'Currency', {
            options: currency,
            required: false,
            placeholder: 'Choose Currency',
            disabled:
              isEditView &&
              permissionMap?.['currency_rid']?.read &&
              !permissionMap?.['currency_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['currency_rid']?.read &&
              !permissionMap?.['currency_rid']?.edit,
          }),
        ],
      },
      {
        sectionName: 'Project Details',
        fillType: 'half',
        fields: [
          createDateField('start_date', 'Resource Start Date', {
            required: false,
            minDate: fiscalDate?.startMin,
            maxDate: fiscalDate?.startMax,
            disableFutureDates: true,
            disabled:
              isEditView &&
              permissionMap?.['start_date']?.read &&
              !permissionMap?.['start_date']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['start_date']?.read &&
              !permissionMap?.['start_date']?.edit,
          }),
          createDateField('end_date', 'End Date', {
            required: false,
            minDate: fiscalDate?.startMin,
            maxDate: fiscalDate?.endMax,
            // greaterThan: {
            //   field: 'start_date',
            //   message: 'End Date must be after Start Date',
            // },
            disabled:
              isEditView &&
              permissionMap?.['end_date']?.read &&
              !permissionMap?.['end_date']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['end_date']?.read &&
              !permissionMap?.['end_date']?.edit,
          }),
          createTextField('total_hours_pro_res', 'Effort', {
            required: false,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Effort',
            disabled:
              isEditView &&
              permissionMap?.['total_hours_pro_res']?.read &&
              !permissionMap?.['total_hours_pro_res']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_hours_pro_res']?.read &&
              !permissionMap?.['total_hours_pro_res']?.edit,
          }),
          createTextField('salary', 'Salary', {
            required: false,
            placeholder: 'Enter Salary',
            formatCostValue: true,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            onChange: true,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            // hide: !isResourceType,
            disabled:
              isEditView &&
              permissionMap?.['salary']?.read &&
              !permissionMap?.['salary']?.edit,
            hide:
              (isEditView &&
                !permissionMap?.['salary']?.read &&
                !permissionMap?.['salary']?.edit) ||
              !isResourceType,
          }),
          createTextField('bonus', 'Bonus', {
            required: false,
            placeholder: 'Enter Bonus',
            formatCostValue: true,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            onChange: true,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            // hide: !isResourceType,
            disabled:
              isEditView &&
              permissionMap?.['bonus']?.read &&
              !permissionMap?.['bonus']?.edit,
            hide:
              (isEditView &&
                !permissionMap?.['bonus']?.read &&
                !permissionMap?.['bonus']?.edit) ||
              !isResourceType,
          }),
          createTextField('insurance', 'Insurance', {
            required: false,
            placeholder: 'Enter Insurance',
            formatCostValue: true,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            onChange: true,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            // hide: !isResourceType,
            disabled:
              isEditView &&
              permissionMap?.['insurance']?.read &&
              !permissionMap?.['insurance']?.edit,
            hide:
              (isEditView &&
                !permissionMap?.['insurance']?.read &&
                !permissionMap?.['insurance']?.edit) ||
              !isResourceType,
          }),
          createTextField('deductions', 'Deductions', {
            required: false,
            placeholder: 'Enter Deductions',
            formatCostValue: true,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            onChange: true,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isEditView &&
              permissionMap?.['deductions']?.read &&
              !permissionMap?.['deductions']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['deductions']?.read &&
              !permissionMap?.['deductions']?.edit,
          }),
          createTextField('total_cost_pro_res', 'Cost', {
            required: isSalaryRequired,
            regex: PROJECT_RESOURCE_REGEX.COST_REGEX,
            formatCostValue: true,
            onChange: true,
            regexErrorMessage:
              'Cost must be a 18-digit number with up to 2 decimals',
            placeholder: 'Enter Cost',
            disabled:
              isEditView &&
              permissionMap?.['total_cost_pro_res']?.read &&
              !permissionMap?.['total_cost_pro_res']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_cost_pro_res']?.read &&
              !permissionMap?.['total_cost_pro_res']?.edit,
          }),
          createTextField('net_resource_cost', 'Net Resource Cost', {
            required: false,
            disabled: true,
            onChange: true,
            formatCostValue: true,
            defaultValue: autoCalculatedValue
              ? autoCalculatedValue.toString()
              : '0',
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
            disabled:
              isEditView &&
              permissionMap?.['description']?.read &&
              !permissionMap?.['description']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['description']?.read &&
              !permissionMap?.['description']?.edit,
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
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['project_rid']?.read &&
              !permissionMap?.['project_rid']?.edit,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_datetime']?.read &&
              !permissionMap?.['created_datetime']?.edit,
          }),
          createTextField('created_name', 'Created By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_name']?.read &&
              !permissionMap?.['created_name']?.edit,
          }),
          createTextField('r_number', 'Project Resource ID', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['r_number']?.read &&
              !permissionMap?.['r_number']?.edit,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_datetime']?.read &&
              !permissionMap?.['modified_datetime']?.edit,
          }),
          createTextField('modified_name', 'Updated By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_name']?.read &&
              !permissionMap?.['modified_name']?.edit,
          }),
          createTextField('project_resource_code', 'Project Resource Code', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['project_resource_code']?.read &&
              !permissionMap?.['project_resource_code']?.edit,
          }),
        ],
      },
    ],
    [
      projectResourceCodes,
      isSalaryRequired,
      autoCalculatedValue,
      isEditView,
      permissionMap,
      resourceStatusOptions,
      country,
      states,
      stateLoading,
      currency,
      fiscalDate?.startMin,
      fiscalDate?.startMax,
      fiscalDate?.endMax,
      isResourceType,
    ]
  );
};

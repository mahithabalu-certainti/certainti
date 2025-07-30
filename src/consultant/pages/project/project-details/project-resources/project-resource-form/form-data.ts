/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
import {
  FormType,
  SelectOption,
  SelectResourceOption,
} from '../../../../../types';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_RESOURCE_REGEX,
  REGEX_PATTERNS,
  // REGEX_PATTERNS,
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
  isEditView?: boolean,
  projectPFY?: FiscalYearType | undefined,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
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
          createSelectField('resource_code', 'Resource Code', {
            options: projectResourceCodes,
            required: true,
            onChange: true,
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
          // createSelectField('resource_type_rid', 'Resource Type', {
          //   options: projectTypes,
          //   placeholder: 'Choose Resource Type',
          //   required: true,
          //   onChange: true,
          //   resetDependsFields: [
          //     'salary',
          //     'bonus',
          //     'insurance',
          //     'resource_orgname',
          //   ],
          //   disabled:
          //     isEditView &&
          //     permissionMap?.['resource_type_rid']?.read &&
          //     !permissionMap?.['resource_type_rid']?.edit,
          //   hide:
          //     isEditView &&
          //     !permissionMap?.['resource_type_rid']?.read &&
          //     !permissionMap?.['resource_type_rid']?.edit,
          // }),
          // createTextField('resource_orgname', 'Resource Org Name', {
          //   required: false,
          //   regex: PROJECT_RESOURCE_REGEX.ORG_NAME,
          //   regexErrorMessage:
          //     'Please enter 3-100 characters, including at least one letter. Special characters other than ampersand, hyphen, period, comma are not allowed.',
          //   placeholder: 'Enter Organization Name',
          //   // disabled: isResourceType,
          //   disabled:
          //     (isEditView &&
          //       permissionMap?.['resource_orgname']?.read &&
          //       !permissionMap?.['resource_orgname']?.edit) ||
          //     isResourceType,
          //   hide:
          //     isEditView &&
          //     !permissionMap?.['resource_orgname']?.read &&
          //     !permissionMap?.['resource_orgname']?.edit,
          // }),
          // createTextField('resource_name', 'Resource Name', {
          //   required: false,
          //   regex: PROJECT_RESOURCE_REGEX.RESOURCE_NAME,
          //   regexErrorMessage:
          //     "Please enter 2–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
          //   placeholder: 'Enter Resource Name',
          //   disabled:
          //     isEditView &&
          //     permissionMap?.['resource_name']?.read &&
          //     !permissionMap?.['resource_name']?.edit,
          //   hide:
          //     isEditView &&
          //     !permissionMap?.['resource_name']?.read &&
          //     !permissionMap?.['resource_name']?.edit,
          // }),
          // createTextField('designation', 'Designation', {
          //   required: false,
          //   regex: PROJECT_RESOURCE_REGEX.DESIGNATION,
          //   regexErrorMessage:
          //     "Please enter 3–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
          //   placeholder: 'Enter Resource Role',
          //   disabled:
          //     isEditView &&
          //     permissionMap?.['designation']?.read &&
          //     !permissionMap?.['designation']?.edit,
          //   hide:
          //     isEditView &&
          //     !permissionMap?.['designation']?.read &&
          //     !permissionMap?.['designation']?.edit,
          // }),
          // createTextField('resource_role', 'Resource Role', {
          //   required: false,
          //   regex: PROJECT_RESOURCE_REGEX.ROLE,
          //   regexErrorMessage:
          //     "Please enter 2–64 characters using only letters, spaces, apostrophes ('), or hyphens (-). Numbers, symbols, or consecutive special characters are not allowed.",
          //   placeholder: 'Enter Resource Role',
          //   disabled:
          //     isEditView &&
          //     permissionMap?.['resource_role']?.read &&
          //     !permissionMap?.['resource_role']?.edit,
          //   hide:
          //     isEditView &&
          //     !permissionMap?.['resource_role']?.read &&
          //     !permissionMap?.['resource_role']?.edit,
          // }),
          // createSelectField(
          //   'assigned_skill_role_type_rid',
          //   'Resource Skill Role Type',
          //   {
          //     options: projectResourceSkillType,
          //     placeholder: 'Choose Resource Skill Role Type',
          //     required: false,
          //     onChange: true,
          //     resetDependsFields: ['skill_role_rid', 'skill_role_others'],
          //     disabled:
          //       isEditView &&
          //       permissionMap?.['assigned_skill_role_type_rid']?.read &&
          //       !permissionMap?.['assigned_skill_role_type_rid']?.edit,
          //     hide:
          //       isEditView &&
          //       !permissionMap?.['assigned_skill_role_type_rid']?.read &&
          //       !permissionMap?.['assigned_skill_role_type_rid']?.edit,
          //   }
          // ),
          // createSelectField('skill_role_rid', 'Resource Skill Role', {
          //   options: projectResourceRollSkill,
          //   placeholder: 'Choose Resource Skill Role',
          //   required: true,
          //   // hide: !showSkillRoleOthersField,
          //   disabled:
          //     isEditView &&
          //     permissionMap?.['skill_role_rid']?.read &&
          //     !permissionMap?.['skill_role_rid']?.edit,
          //   hide:
          //     (isEditView &&
          //       !permissionMap?.['skill_role_rid']?.read &&
          //       !permissionMap?.['skill_role_rid']?.edit) ||
          //     !showSkillRoleOthersField,
          // }),
          // createTextField('skill_role_others', 'Resource Skill Role Others', {
          //   required: true,
          //   regex: PROJECT_RESOURCE_REGEX.ROLE,
          //   regexErrorMessage:
          //     'Please enter 4-100 characters, including at least one letter. Special characters and numbers alone are not allowed.',
          //   placeholder: 'Enter Resource Skill Role Others',
          //   // hide: !showSkillRoleOthersField,
          //   disabled:
          //     isEditView &&
          //     permissionMap?.['skill_role_others']?.read &&
          //     !permissionMap?.['skill_role_others']?.edit,
          //   hide:
          //     (isEditView &&
          //       !permissionMap?.['skill_role_others']?.read &&
          //       !permissionMap?.['skill_role_others']?.edit) ||
          //     !showSkillRoleOthersField,
          // }),

          createSelectField('status_rid', 'Resource Status', {
            options: resourceStatusOptions,
            placeholder: 'Choose Resource Status',
            required: false,
            disabled:
              isEditView &&
              permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
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
            minDate: startDateMin,
            maxDate: startDateMax,
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
            minDate: startDateMin,
            maxDate: endDateMax,
            greaterThan: {
              field: 'start_date',
              message: 'End Date must be after Start Date',
            },
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
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
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
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
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
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
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
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
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
            required: false,
            regex: PROJECT_RESOURCE_REGEX.COST_REGEX,
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
      isEditView,
      permissionMap,
      // projectResourceSkillType,
      // projectResourceRollSkill,
      // showSkillRoleOthersField,
      resourceStatusOptions,
      country,
      states,
      stateLoading,
      currency,
      startDateMin,
      startDateMax,
      endDateMax,
      isResourceType,
    ]
  );
};

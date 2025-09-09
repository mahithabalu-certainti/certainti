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
import { FormFiscalDateType, FormType, SelectOption } from '../../types';

// 1. Extract date constants
const minYear = 1950;
const currentYear = new Date().getFullYear();
export const DATE_CONFIG = {
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
export const getDateConstraints = (yearsBack: number) => {
  const currentDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(currentDate.getFullYear() - yearsBack + 1);
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 1);
  return { currentDate, minDate, previousDate };
};

export const fiscalYears = getFiscalYears(DATE_CONFIG.COST_FISCAL_YEARS_RANGE);
export const skillStartDateYears = getSkillStartDateOptions(
  DATE_CONFIG.FISCAL_YEARS_RANGE
);
const { currentDate, previousDate } = getDateConstraints(
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
  // currentSkillType?: string[],
  // currentskillSubType?: string[],
  isOthersSkillTypeSelected?: boolean,
  isOthersSubTypeSelected?: boolean,
  disableSkill?: boolean,
  disableCost?: boolean,
  isResourceFullNameEmpty?: boolean,
  isAnyResourceNameFilled?: boolean,
  isresourceType?: boolean,
  isSalaryRequired?: boolean,
  isEditView?: boolean,
  currentResource?: { resource_firstname: string; resource_lastname: string },
  autoCalculatedValue?: number,
  accountName?: string,
  fiscalDate?: FormFiscalDateType,
  resourcePermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  resourceCostPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  resourceSkillPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  // const commandsHide =
  //   isEditView &&
  //   (disableCost
  //     ? !resourceCostPermissionMap?.['comments']?.read &&
  //       !resourceCostPermissionMap?.['comments']?.edit
  //     : disableSkill
  //       ? !resourceSkillPermissionMap?.['comments']?.read &&
  //         !resourceSkillPermissionMap?.['comments']?.edit
  //       : !resourcePermissionMap?.['comments']?.read &&
  //         !resourcePermissionMap?.['comments']?.edit);
  const commandsDisable =
    isEditView &&
    (disableCost
      ? resourceCostPermissionMap?.['comments']?.read &&
        !resourceCostPermissionMap?.['comments']?.edit
      : disableSkill
        ? resourceSkillPermissionMap?.['comments']?.read &&
          !resourceSkillPermissionMap?.['comments']?.edit
        : resourcePermissionMap?.['comments']?.read &&
          !resourcePermissionMap?.['comments']?.edit);
  const isFieldHidden = (field: string) => {
    const map = disableCost
      ? resourceCostPermissionMap
      : disableSkill
        ? resourceSkillPermissionMap
        : resourcePermissionMap;

    return isEditView && !map?.[field]?.read && !map?.[field]?.edit;
  };
  const createdOnHide = isFieldHidden('created_datetime');
  const createdByHide = isFieldHidden('created_by');
  const modifiedByHide = isFieldHidden('modified_by');
  const modifiedOnHide = isFieldHidden('modified_datetime');
  const ridHide = isFieldHidden('rid');
  const rNumberHide = isFieldHidden('r_number');
  const commandsHide = isFieldHidden('comments');

  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        hide: disableCostAndSkill,
        fields: [
          createTextField('resource_code', 'Resource Code', {
            required: true,
            disabled:
              isEditView &&
              resourcePermissionMap?.['resource_code']?.read &&
              !resourcePermissionMap?.['resource_code']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_code']?.read &&
              !resourcePermissionMap?.['resource_code']?.edit,
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
            onChange: true,
          }),
          createSelectField('resource_type', 'Resource Type', {
            options: resourceTypeOptions,
            placeholder: 'Choose Resource Type',
            required: true,
            disabled:
              isEditView &&
              resourcePermissionMap?.['resource_type_rid']?.read &&
              !resourcePermissionMap?.['resource_type_rid']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_type_rid']?.read &&
              !resourcePermissionMap?.['resource_type_rid']?.edit,
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
            disabled:
              disableOrgname ||
              (isEditView &&
                resourcePermissionMap?.['resource_orgname']?.read &&
                !resourcePermissionMap?.['resource_orgname']?.edit),
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_orgname']?.read &&
              !resourcePermissionMap?.['resource_orgname']?.edit,
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
                  'Name cannot start or end with a space, apostrophe, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.ALLOWED_CHARS_NAME_REGEX,
                errorMessage:
                  'Only letters, spaces, apostrophes, and hyphens are allowed.',
              },
            ],
            placeholder: 'Enter Name',
            disabled:
              (isEditView &&
                resourcePermissionMap?.['resource_name']?.read &&
                !resourcePermissionMap?.['resource_name']?.edit) ||
              isAnyResourceNameFilled,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_name']?.read &&
              !resourcePermissionMap?.['resource_name']?.edit,
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
            disabled:
              (isEditView &&
                resourcePermissionMap?.['resource_firstname']?.read &&
                !resourcePermissionMap?.['resource_firstname']?.edit) ||
              isResourceFullNameEmpty,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_firstname']?.read &&
              !resourcePermissionMap?.['resource_firstname']?.edit,
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
            disabled:
              (isEditView &&
                resourcePermissionMap?.['resource_lastname']?.read &&
                !resourcePermissionMap?.['resource_lastname']?.edit) ||
              isResourceFullNameEmpty,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_lastname']?.read &&
              !resourcePermissionMap?.['resource_lastname']?.edit,
            onChange: true,
          }),
          createTextField('resource_role', 'Role', {
            required: false,

            placeholder: 'Enter Role',
            disabled:
              isEditView &&
              resourcePermissionMap?.['resource_role'].read &&
              !resourcePermissionMap?.['resource_role'].edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_role'].read &&
              !resourcePermissionMap?.['resource_role'].edit,
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
            disabled:
              isEditView &&
              resourcePermissionMap?.['status_rid'].read &&
              !resourcePermissionMap?.['status_rid'].edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['status_rid'].read &&
              !resourcePermissionMap?.['status_rid'].edit,
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
            disabled:
              isEditView &&
              resourcePermissionMap?.['country_rid']?.read &&
              !resourcePermissionMap?.['country_rid']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['country_rid']?.read &&
              !resourcePermissionMap?.['country_rid']?.edit,
          }),
          createSelectField('state', 'Region', {
            options: states,
            placeholder: 'Choose Region',
            required: false,
            onChange: true,
            isLoading: stateLoading,
            resetDependsFields: ['city'],
            disabled:
              isEditView &&
              resourcePermissionMap?.['region_rid']?.read &&
              !resourcePermissionMap?.['region_rid']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['region_rid']?.read &&
              !resourcePermissionMap?.['region_rid']?.edit,
          }),
          createSelectField('city', 'City', {
            options: city,
            placeholder: 'Choose City',
            required: false,
            isLoading: stateLoading || cityLoading,
            disabled:
              isEditView &&
              resourcePermissionMap?.['city_rid']?.read &&
              !resourcePermissionMap?.['city_rid']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['city_rid']?.read &&
              !resourcePermissionMap?.['city_rid']?.edit,
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
            options: fiscalYears,
            isFiscalYear: true,
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['fiscal_year']?.read &&
              !resourceCostPermissionMap?.['fiscal_year']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['fiscal_year']?.read &&
              !resourceCostPermissionMap?.['fiscal_year']?.edit,
            resetDependsFields: ['financial_start_date, financial_end_date'],
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            placeholder: 'Choose Currency',
            required: false,
            isLoading: currencyLoading,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['currency_rid']?.read &&
              !resourceCostPermissionMap?.['currency_rid']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['currency_rid']?.read &&
              !resourceCostPermissionMap?.['currency_rid']?.edit,
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createDateField('financial_start_date', 'Effective Date', {
            required: false,
            minDate: fiscalDate?.startMin,
            maxDate: fiscalDate?.startMax,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['effective_from']?.read &&
              !resourceCostPermissionMap?.['effective_from']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['effective_from']?.read &&
              !resourceCostPermissionMap?.['effective_from']?.edit,
          }),
          createDateField('financial_end_date', 'End Date', {
            required: false,
            minDate: fiscalDate?.startMin,
            maxDate: fiscalDate?.endMax,
            startDateLabel: 'financial_start_date',
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['end_date']?.read &&
              !resourceCostPermissionMap?.['end_date']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['end_date']?.read &&
              !resourceCostPermissionMap?.['end_date']?.edit,
          }),
          createTextField('effort_in_hrs', 'Effort In Hrs', {
            required: true,
            placeholder: 'Enter Effort In Hrs',
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['effort_in_hrs']?.read &&
              !resourceCostPermissionMap?.['effort_in_hrs']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['effort_in_hrs']?.read &&
              !resourceCostPermissionMap?.['effort_in_hrs']?.edit,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          }),
          createTextField('salary', 'Salary', {
            required: false,
            placeholder: 'Enter Salary',
            formatCostValue: true,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['salary']?.read &&
              !resourceCostPermissionMap?.['salary']?.edit,
            hide:
              (isEditView &&
                !resourceCostPermissionMap?.['salary']?.read &&
                !resourceCostPermissionMap?.['salary']?.edit) ||
              !isresourceType,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            // hide: !isresourceType,
            onChange: true,
          }),
          createTextField('bonus', 'Bonus', {
            required: false,
            placeholder: 'Enter Bonus',
            formatCostValue: true,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['bouns']?.read &&
              !resourceCostPermissionMap?.['bouns']?.edit,
            hide:
              (isEditView &&
                !resourceCostPermissionMap?.['bouns']?.read &&
                !resourceCostPermissionMap?.['bouns']?.edit) ||
              !isresourceType,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            // hide: !isresourceType,
            onChange: true,
          }),
          createTextField('insurance', 'Insurance', {
            required: false,
            placeholder: 'Enter Insurance',
            formatCostValue: true,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['insurance']?.read &&
              !resourceCostPermissionMap?.['insurance']?.edit,
            hide:
              (isEditView &&
                !resourceCostPermissionMap?.['insurance']?.read &&
                !resourceCostPermissionMap?.['insurance']?.edit) ||
              !isresourceType,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            // hide: !isresourceType,
            onChange: true,
          }),
          createTextField('deductions', 'Deductions', {
            required: false,
            placeholder: 'Enter Deductions',
            formatCostValue: true,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['deductions']?.read &&
              !resourceCostPermissionMap?.['deductions']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['deductions']?.read &&
              !resourceCostPermissionMap?.['deductions']?.edit,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            onChange: true,
          }),
          createTextField('resource_cost', 'Resource Cost', {
            required: isSalaryRequired,
            placeholder: 'Enter Cost',
            formatCostValue: true,
            disabled:
              isEditView &&
              resourceCostPermissionMap?.['resource_cost']?.read &&
              !resourceCostPermissionMap?.['resource_cost']?.edit,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['resource_cost']?.read &&
              !resourceCostPermissionMap?.['resource_cost']?.edit,
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            onChange: true,
          }),
          createTextField('net_resource_cost', 'Net Resource Cost', {
            required: false,
            disabled: true,
            formatCostValue: true,
            hide:
              isEditView &&
              !resourceCostPermissionMap?.['net_resource_cost']?.read &&
              !resourceCostPermissionMap?.['net_resource_cost']?.edit,
            defaultValue: autoCalculatedValue
              ? autoCalculatedValue.toString()
              : '0',
          }),
          createSelectField('resource_status', 'Status', {
            options: resourceStatusOptions,
            placeholder: 'Choose Status',
            required: false,
            disabled: true,
            hide:
              (isEditView &&
                !resourceCostPermissionMap?.['status_rid']?.read &&
                !resourceCostPermissionMap?.['status_rid']?.edit) ||
              !isEditView,
            // hide: !isEditView,
          }),
        ],
      },
      {
        sectionName: 'Skills Information',
        fillType: 'half',
        hide: !disableSkill,
        fields: [
          createDateField('skill_start_date', 'Effective Date', {
            required: false,
            maxDate: currentDate,
            disableFutureDates: true,
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['start_date']?.read &&
              !resourceSkillPermissionMap?.['start_date']?.edit,
            hide:
              isEditView &&
              !resourceSkillPermissionMap?.['start_date']?.read &&
              !resourceSkillPermissionMap?.['start_date']?.edit,
          }),
          createSelectField('skill_type', 'Skill Type', {
            options: skillTypeOptions,
            placeholder: 'Choose Skill Type',
            required: true,
            onChange: true,
            resetDependsFields: ['skill_sub_type'],
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['skill_type_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_type_rid']?.edit,
            hide:
              isEditView &&
              !resourceSkillPermissionMap?.['skill_type_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_type_rid']?.edit,
          }),
          createTextField('skill_type_others', 'Skill Type(Others)', {
            required: true,
            placeholder: 'Enter Skill Type',
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['skill_type_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_type_rid']?.edit,
            hide:
              (isEditView &&
                !resourceSkillPermissionMap?.['skill_type_rid']?.read &&
                !resourceSkillPermissionMap?.['skill_type_rid']?.edit) ||
              !isOthersSkillTypeSelected,
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
            // hide: !isOthersSkillTypeSelected,
          }),
          createSelectField('skill_sub_type', 'Skill SubType', {
            options: skillSubTypeOptions,
            placeholder: 'Choose Skill SubType',
            required: true,
            isLoading: skillSubTypeLoading,
            onChange: true,
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['skill_subtype_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_subtype_rid']?.edit,
            hide:
              isEditView &&
              !resourceSkillPermissionMap?.['skill_subtype_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_subtype_rid']?.edit,
          }),
          createTextField('skill_subtype_others', 'Skill SubType(Others)', {
            required: true,
            placeholder: 'Enter Skill SubType',
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['skill_subtype_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_subtype_rid']?.edit,
            hide:
              (isEditView &&
                !resourceSkillPermissionMap?.['skill_subtype_rid']?.read &&
                !resourceSkillPermissionMap?.['skill_subtype_rid']?.edit) ||
              !isOthersSubTypeSelected,
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
            // hide: !isOthersSubTypeSelected,
          }),
          createSelectField('skill_level', 'Skill Level', {
            options: skillLevelOptions,
            placeholder: 'Choose Skill Level',
            required: false,
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['skill_level_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_level_rid']?.edit,
            hide:
              isEditView &&
              !resourceSkillPermissionMap?.['skill_level_rid']?.read &&
              !resourceSkillPermissionMap?.['skill_level_rid']?.edit,
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
            disabled:
              isEditView &&
              resourceSkillPermissionMap?.['skill_details']?.read &&
              !resourceSkillPermissionMap?.['skill_details']?.edit,
            hide:
              isEditView &&
              !resourceSkillPermissionMap?.['skill_details']?.read &&
              !resourceSkillPermissionMap?.['skill_details']?.edit,
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
            maxDate: previousDate,
            disableFutureDates: true,
            disabled:
              isEditView &&
              resourcePermissionMap?.['resource_startdate']?.read &&
              !resourcePermissionMap?.['resource_startdate']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_startdate']?.read &&
              !resourcePermissionMap?.['resource_startdate']?.edit,
          }),
          createDateField('resource_enddate', 'End Date', {
            required: false,
            maxDate: currentDate,
            disabled:
              isEditView &&
              resourcePermissionMap?.['resource_enddate']?.read &&
              !resourcePermissionMap?.['resource_enddate']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_enddate']?.read &&
              !resourcePermissionMap?.['resource_enddate']?.edit,
            // greaterThan: {
            //   field: 'resource_startdate',
            //   message: 'End Date must be after Effective Date',
            // },
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
            disabled:
              isEditView &&
              resourcePermissionMap?.['resource_designation']?.read &&
              !resourcePermissionMap?.['resource_designation']?.edit,
            hide:
              isEditView &&
              !resourcePermissionMap?.['resource_designation']?.read &&
              !resourcePermissionMap?.['resource_designation']?.edit,
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
              disabled:
                isEditView &&
                resourcePermissionMap?.['resource_total_experience']?.read &&
                !resourcePermissionMap?.['resource_total_experience']?.edit,
              hide:
                isEditView &&
                !resourcePermissionMap?.['resource_total_experience']?.read &&
                !resourcePermissionMap?.['resource_total_experience']?.edit,
              regexErrorMessage:
                'Please enter a valid number between 0 and 99 with up to 2 decimals',
              placeholder: 'Enter Total Years Of Experience',
            }
          ),
          createTextField(
            'total_years_in_org',
            'Total Years in the Organisation',
            {
              required: false,
              regex: RESOURCE_REGEX.YEARS_EXPERIENCE,
              disabled:
                isEditView &&
                resourcePermissionMap?.[
                  'resource_total_experience_organization'
                ]?.read &&
                !resourcePermissionMap?.[
                  'resource_total_experience_organization'
                ]?.edit,
              hide:
                isEditView &&
                !resourcePermissionMap?.[
                  'resource_total_experience_organization'
                ]?.read &&
                !resourcePermissionMap?.[
                  'resource_total_experience_organization'
                ]?.edit,
              regexErrorMessage:
                'Please enter a valid number between 0 and 99 with up to 2 decimals',
              placeholder: 'Enter Total Years in the Organisation',
            }
          ),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        hide: commandsHide,
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            placeholder: 'Enter Comments',
            regexErrorMessage: 'Max length exceeded.',
            regex: RESOURCE_REGEX.DESCRIPTION,
            disabled: commandsDisable,
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
            hide: ridHide,
          }),
          createTextField('Created_On', 'Created On', {
            required: false,
            disabled: true,
            hide: createdOnHide,
          }),
          createTextField('Created_By', 'Created By', {
            required: false,
            disabled: true,
            hide: createdByHide,
          }),
          createTextField(
            'Resource_id',
            `${disableCost ? 'Cost ID' : disableSkill ? 'Skill ID' : 'Resource ID'}`,
            {
              required: false,
              disabled: true,
              hide: rNumberHide,
            }
          ),
          createTextField('Updated_On', 'Updated On', {
            required: false,
            disabled: true,
            hide: modifiedOnHide,
          }),
          createTextField('Updated_By', 'Updated By', {
            required: false,
            disabled: true,
            hide: modifiedByHide,
          }),
        ],
      },
    ],
    [
      disableCostAndSkill,
      isEditView,
      resourcePermissionMap,
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
      resourceCostPermissionMap,
      currency,
      currencyLoading,
      fiscalDate?.startMin,
      fiscalDate?.startMax,
      fiscalDate?.endMax,
      isresourceType,
      isSalaryRequired,
      autoCalculatedValue,
      resourceStatusOptions,
      disableSkill,
      resourceSkillPermissionMap,
      skillTypeOptions,
      isOthersSkillTypeSelected,
      skillSubTypeOptions,
      skillSubTypeLoading,
      isOthersSubTypeSelected,
      skillLevelOptions,
      commandsHide,
      commandsDisable,
      ridHide,
      createdOnHide,
      createdByHide,
      rNumberHide,
      modifiedOnHide,
      modifiedByHide,
    ]
  );
};

export default ResourceFormData;

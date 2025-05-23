import { useMemo } from 'react';
import {
  createDateField,
  createRadioField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_TYPE,
  REGEX_PATTERNS,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
} from '../../../common-utils';
import { FormType, SelectOption } from '../../types';
import { fiscalYears } from '../resource-form/form-data';
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
} as const;

const getDateConstraints = (yearsBack: number) => {
  const currentDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(currentDate.getFullYear() - yearsBack);
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 1);
  return { currentDate, minDate, previousDate };
};

const { currentDate, minDate } = getDateConstraints(DATE_CONFIG.MIN_YEARS_BACK);

export const FormData = (
  country: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  industry: SelectOption[],
  classification: SelectOption[],
  roles: SelectOption[],
  isPrimaryContactRequired: boolean,
  disableFields?: boolean,
  showOthersField?: boolean,
  stateLoading?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('project_code', 'Project Code', {
            required: true,
            placeholder: 'Enter project code',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_5,
                errorMessage:
                  'Porject code must be more than 4 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_50,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_).",
              },
            ],
          }),
          createTextField('project_name', 'Name', {
            // required: true,
            placeholder: 'Enter name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_4,
                errorMessage: 'Name must be more than 3 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_).",
              },
            ],
          }),
          createSelectField('industry_rid', 'Industry', {
            options: industry,
            placeholder: 'Choose Industry',
            required: false,
            onChange: true,
          }),
          createTextField('industry_name', 'Industry-other', {
            required: true,
            placeholder: 'Enter Industry-other',
            hide: !showOthersField,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage:
                  'Industry-other must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_).",
              },
            ],
          }),
          createTextField('program_name', 'Program Name', {
            placeholder: 'Enter a Program Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_4,
                errorMessage:
                  'Program name must be more than 3 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_).",
              },
            ],
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: '-Select-',
            required: true,
            onChange: true,
          }),
          createDateField('project_startdate', 'Start Date', {
            required: false,
            minDate: new Date('2000-01-01'),
            maxDate: currentDate,
          }),
          createDateField('project_enddate', 'End Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            // maxDate: currentDate,
            startDateLabel: 'project_start_date',
          }),
          createSelectField('project_type', 'Project Type', {
            required: true,
            options: PROJECT_TYPE,
            placeholder: 'Choose Project Type',
          }),
          createSelectField('project_classification_rid', 'Classification', {
            options: classification,
            placeholder: 'Choose Classification',
            required: false,
          }),
          createTextField('project_client_group', 'Client Group', {
            placeholder: 'Enter Client Group',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_4,
                errorMessage:
                  'Client Group must be more than 3 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_).",
              },
            ],
          }),
          createTextField('project_group', 'Project Group', {
            placeholder: 'Enter a Project  Group',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_4,
                errorMessage:
                  'Project group must be more than 3 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_).",
              },
            ],
          }),
          createTextField('project_description', 'Description', {
            required: false,
            placeholder: 'Enter Description',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_2000,
                errorMessage: 'Max length exceeded',
              },
            ],
          }),
          createSelectField('project_status', 'Status', {
            required: true,
            options: STATUS_OPTIONS,
            placeholder: 'Choose Status',
          }),
        ],
      },
      {
        sectionName: 'Location and Currency Information',
        fillType: 'half',
        fields: [
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Choose Country',
            required: false,
            onChange: true,
            disabled: disableFields,
            resetDependsFields: ['region'],
          }),
          createSelectField('region', 'Region', {
            options: state,
            placeholder: 'Choose Region',
            required: false,
            isLoading: stateLoading,
            disabled: disableFields,
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            required: false,
            placeholder: 'Choose Currency',
            disabled: disableFields,
          }),
        ],
      },
      {
        sectionName: 'Key Contacts List',
        fillType: 'half',
        fields: [
          createTextField('key_contact_name', 'Key Contact Name', {
            required: false,
            // regex: REGEX_PATTERNS.CONTACT_NAME,
            // regexErrorMessage: 'Invalid Name',
            placeholder: 'Enter Key Contact Name',
            onChange: true,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_NAME_REGEX,
                errorMessage:
                  'Key Contact Name must be more than 1 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_NAME_REGEX,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
                errorMessage:
                  'Cannot begin or end with a space or special character',
              },
              {
                regex: REGEX_PATTERNS.MANAGER_REGEX,
                errorMessage:
                  "Only letters, spaces, apostrophes (') and hyphens (-) are allowed",
              },
            ],
          }),
          createSelectField('key_contact_role', 'Key Contact Role', {
            options: roles,
            required: false,
            placeholder: 'Choose Key Contact Role',
            onChange: true,
          }),
          createTextField('key_contact_email', 'Key Contact Email', {
            required: false,
            placeholder: 'Enter Key Contact Email',
            onChange: true,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_EMAIL_REGEX,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.EMAIL,
                errorMessage: 'Invalid email address',
              },
            ],
          }),
          createRadioField('is_primary_contact', 'Is Primary Contact?', {
            radioOptions: YES_NO_OPTIONS,
            required: isPrimaryContactRequired,
            onChange: true,
          }),
          createRadioField(
            'include_in_communication',
            'Include in Communications?',
            {
              radioOptions: YES_NO_OPTIONS,
              required: false,
            }
          ),
          createSelectField('status', 'Key Contact Status', {
            required: false,
            options: STATUS_OPTIONS,
            placeholder: 'Choose Key Contact Status',
          }),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        fields: [
          createTextField('total_effort', 'Effort in Hrs', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_NUMBER,
            regexErrorMessage:
              'Enter a Positive Integer number allowed 16 digits',
            placeholder: 'Enter Total Effort',
          }),
          createTextField('total_cost', 'Total Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
            placeholder: 'Enter Total Cost',
          }),
          createTextField('total_fte', 'Total FTE Count', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_9,
            regexErrorMessage:
              'Enter a Positive Integer number allowed 9 digits',
            placeholder: 'Enter Total FTE',
          }),
          createTextField('total_sub_con', 'Total Sub Con Count', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_9,
            regexErrorMessage:
              'Enter a Positive Integer number allowed 9 digits',
            placeholder: 'Enter Total Sub Con',
          }),

          createTextField('total_fte_effort', 'Total FTE Effort', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_NUMBER,
            regexErrorMessage:
              'Enter a Positive Integer number allowed 16 digits',
            placeholder: 'Enter Total FTE Effort',
          }),
          createTextField('total_sub_con_effort', 'Total Sub Con Effort', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_NUMBER,
            regexErrorMessage:
              'Enter a Positive Integer number allowed 16 digits',
            placeholder: 'Enter Total Sub Con Effort',
          }),

          createTextField('total_fte_cost', 'Total FTE Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total FTE Cost',
          }),
          createTextField('total_sub_con_cost', 'Total Sub Con Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Sub Con Cost',
          }),
          createTextField('total_non_labor_cost', 'Total Non Labour Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Non Labour Cost',
          }),
        ],
      },
      {
        sectionName: 'Project Settings',
        fillType: 'half',
        fields: [
          createRadioField(
            'auto_send_ai_interaction',
            'Auto Send Interaction',
            {
              required: true,
              radioOptions: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
            }
          ),
          createTextField('max_ai_interaction', 'Max Interaction follow up', {
            required: true,
            placeholder: 'Enter  Max AI Interactions',
            regex: REGEX_PATTERNS.POSITIVE_INTEGER_REGEX,
            regexErrorMessage: 'Only positive numbers allowed, 2 digits only',
          }),
          createRadioField('auto_access_rd', 'Auto Assessment', {
            required: false,
            radioOptions: [
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ],
          }),
          createTextField('blended_rate_fte', 'Blended Rate FTE', {
            required: false,
            placeholder: 'Enter Blended Rate FTE',
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
          }),
          createTextField('blended_rate_sub_con', 'Blended Rate Sub Con', {
            required: false,
            placeholder: 'Enter Blended Rate Sub Con',
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !disableFields,
        fields: [
          createTextField('rid', 'Record ID', {
            required: false,
            placeholder: 'Enter Project Number',
            disabled: disableFields,
            hide: !disableFields,
          }),
          createTextField('r_number', 'Project ID', {
            required: false,
            placeholder: 'Enter Project Number',
            disabled: disableFields,
            hide: !disableFields,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            placeholder: 'Enter Last Rd AI Assessed By',
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('modified_by', 'Updated By', {
            required: false,
            placeholder: 'Enter Last Rd AI Assessed By',
            disabled: disableFields,
            // hide:!disableFields,
          }),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Maximum 2000 characters allowed',
            placeholder: 'Enter a comments',
          }),
        ],
      },
    ],
    [
      country,
      state,
      disableFields,
      currency,
      showOthersField,
      stateLoading,
      isPrimaryContactRequired,
    ]
  );
};

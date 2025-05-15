import { useMemo } from 'react';
import {
  createDateField,
  createRadioField,
  createSelectField,
  createTextAreaField,
  createTextField,
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

const { currentDate, minDate,  } = getDateConstraints(DATE_CONFIG.MIN_YEARS_BACK);

export const FormData = (
  country: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  industry: SelectOption[],
  classification: SelectOption[],
  roles: SelectOption[],
  isPrimaryContactRequired: boolean,
  disableFields?: boolean,
  stateLoading?: boolean
): FormType[] => {


  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('rid', 'Record ID', {
            required: true,
            placeholder: 'Enter Project Number',
            disabled: disableFields,
            hide:!disableFields
          }),
          createTextField('r_number', 'Project ID', {
            required: true,
            placeholder: 'Enter Project Number',
            disabled: disableFields,
            hide:!disableFields
          }),
          createTextField('project_ref_id', 'Project Code', {
            required: true,
            placeholder: 'Enter project code',
            lengthRequired: {
                  key: 'name_length',
                  minMatchedValue: REGEX_PATTERNS.MIN_5,
                  minErrorMessage: 'Porject code must be more than 4 characters long',
                  maxMatchedValue: REGEX_PATTERNS.MAX_50,
                  maxErrorMessage: 'Max length exceeded',
                },
          }),
          createTextField('name', 'Name', {
            // required: true,
            placeholder: 'Enter name',
            lengthRequired: {
                  key: 'name_length',
                  minMatchedValue: REGEX_PATTERNS.MIN_4,
                  minErrorMessage: 'Name must be more than 4 characters long',
                  maxMatchedValue: REGEX_PATTERNS.MAX_255,
                  maxErrorMessage: 'Max length exceeded',
                },
          }),
          createSelectField('industry', 'Industry', {
            options: industry,
            placeholder: 'Choose Industry',
            required: false,
          }),
          createTextField('program_name', 'Program Name', {
            placeholder: 'Enter a Program Name',
            lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_4,
              minErrorMessage: 'Program name must be more than 3 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_100,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createDateField('project_start_date', 'Start Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
            startValue: true,
          }),
          createDateField('project_end_date', 'End Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            // maxDate: currentDate,
            // endDateValue: false,
            startDateLabel: 'project_start_date',
          }),
          createRadioField('project_type', 'Project Type', {
            required: true,
            radioOptions: [
              { label: 'Fixed', value: 'Fixed' },
              { label: 'Time & Material', value: 'Time & Material' },
            ],
          }),
          createSelectField('project_classification', 'Classification', {
            options: classification,
            placeholder: 'Choose Industry',
            required: false,
          }), 
          createTextField('project_client_group', 'Client Group', {
            placeholder: 'Enter a Project Client Group',
            lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_4,
              minErrorMessage: 'Name must be more than 3 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_200,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createTextField('project_group', 'Project Group', {
            placeholder: 'Enter a Project  Group',
            lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_4,
              minErrorMessage: 'Name must be more than 3 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_150,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createTextField('project_summary', 'Description', {
            required: false,
            placeholder: 'Enter Project Summary',
             lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_4,
              minErrorMessage: 'Summary must be more than 3 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_1000,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createRadioField('status', 'Status', {
            required: true,
            radioOptions: [
              { label: 'Active', value: 'Active' },
              { label: 'In-active', value: 'Inactive' },
            ],
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: '-Select-',
            required: true,
            onChange: true,
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
            regex: REGEX_PATTERNS.CONTACT_NAME,
            regexErrorMessage: 'Invalid Name',
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
          createSelectField('key_contact_status', 'Key Contact Status', {
            required: false,
            options: STATUS_OPTIONS,
            placeholder: 'Choose Key Contact Status',
          }),
        ],
      },
      // {
      //   sectionName: 'Contact Information',
      //   fillType: 'half',
      //   fields: [
      //     createTextField('project_manager', 'Project Manager', {
      //       required: true,
      //       placeholder: 'Enter Project Manager',
      //       lengthRequired: {
      //         key: 'name_length',
      //         minMatchedValue: REGEX_PATTERNS.MIN_3,
      //         minErrorMessage: 'Project Manager must be more than 2 characters long',
      //         maxMatchedValue: REGEX_PATTERNS.MAX_100,
      //         maxErrorMessage: 'Max length exceeded',
      //       },
      //     }),
      //     createTextField(
      //       'project_tpc_name',
      //       'Project Technical POC Name',
      //       {
      //         placeholder: 'Project Technical Point of Contact Name',
      //         lengthRequired: {
      //           key: 'name_length',
      //           minMatchedValue: REGEX_PATTERNS.MIN_NAME_REGEX,
      //           minErrorMessage: 'Name must be more than 2 characters long',
      //           maxMatchedValue: REGEX_PATTERNS.MAX_100,
      //           maxErrorMessage: 'Max length exceeded',
      //         },
      //       }
      //     ),
      //     createTextField('project_lead', 'Project Lead', {
      //       required: true,
      //       placeholder: 'Enter Project Lead',
      //       lengthRequired: {
      //         key: 'name_length',
      //         minMatchedValue: REGEX_PATTERNS.MIN_3,
      //         minErrorMessage: 'Project Lead must be more than 2 characters long',
      //         maxMatchedValue: REGEX_PATTERNS.MAX_100,
      //         maxErrorMessage: 'Max length exceeded',
      //       },
      //     }),
      //     createTextField(
      //       'project_tpc_email',
      //       'Project Technical POC Email',
      //       {
      //         regex: REGEX_PATTERNS.EMAIL,
      //         placeholder:
      //           'Enter Project Technical Point of Contact Email',
      //       regexErrorMessage: 'Invalid email address',
      //       lengthRequired: {
      //         key: 'email_length',
      //         minMatchedValue: REGEX_PATTERNS.EMAIL,
      //         minErrorMessage: 'Invalid email address',
      //         maxMatchedValue: REGEX_PATTERNS.MAX_EMAIL_REGEX,
      //         maxErrorMessage: 'Max length exceeded',
      //       },
      //       }  
      //     ),
      //     createTextField('spoc_name', 'SPOC Name', {
      //       required: true,
      //       placeholder: 'Enter SPOC Name',
      //       lengthRequired: {
      //         key: 'name_length',
      //         minMatchedValue: REGEX_PATTERNS.MIN_3,
      //         minErrorMessage: 'SPOC name must be more than 2 characters long',
      //         maxMatchedValue: REGEX_PATTERNS.MAX_100,
      //         maxErrorMessage: 'Max length exceeded',
      //       },
      //     }),
      //     createPhoneInputField(
      //       'project_tpc_mobile',
      //       'Project Technical POC Mobile',
      //       {
      //         required: false,
      //         placeholder: 'Enter Finance POC Phone',
      //       }
      //     ),
      //     createTextField('spoc_email', 'SPOC Email', {
      //       required: false,
      //       regex: REGEX_PATTERNS.EMAIL,
      //       regexErrorMessage: 'Invalid email address',
      //       placeholder: 'Enter SPOC Email',
      //       lengthRequired: {
      //         key: 'email_length',
      //         minMatchedValue: REGEX_PATTERNS.EMAIL,
      //         minErrorMessage: 'Invalid email address',
      //         maxMatchedValue: REGEX_PATTERNS.MAX_EMAIL_REGEX,
      //         maxErrorMessage: 'Max length exceeded',
      //       },
      //     }),
      //     createTextField('project_cc_list', 'Project CC List', {
      //       placeholder: 'Enter Project CC List',
      //       lengthRequired: {
      //         key: 'email_length',
      //         minMatchedValue: REGEX_PATTERNS.EMAIL,
      //         minErrorMessage: 'Invalid email address',
      //         maxMatchedValue: REGEX_PATTERNS.MAX_EMAIL_REGEX,
      //         maxErrorMessage: 'Max length exceeded',
      //       },
      //     }),
      //     createPhoneInputField('spoc_mobile', 'SPOC Mobile', {
      //       required: false,
      //       placeholder: 'Enter SPOC Mobile',
      //     }),
      //   ],
      // },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        fields: [
        
          createTextField('total_effort', 'Effort in Hrs', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a Positive Integer or Decimal number ',
            placeholder: 'Enter Total Effort',
          }),
          createTextField('total_cost', 'Total Cost', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a only Positve Interger or Decimal number',
            placeholder: 'Enter Total Cost',
          }),
          createTextField('total_fte', 'Total FTE Count', {
            regex: REGEX_PATTERNS.POSITIVE_INTEGER_REGEX,
            regexErrorMessage: 'Enter a Positive Integer or Decimal number ',
            placeholder: 'Enter Total FTE',
          }),
          createTextField('total_sub_con', 'Total Sub Con Count', {

            regex: REGEX_PATTERNS.POSITIVE_INTEGER_REGEX,
            regexErrorMessage: 'Enter a Positive Integer or Decimal number',
            placeholder: 'Enter Total Sub Con',
          }),
       
          createTextField('total_fte_effort', 'Total FTE Effort', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a Positive Integer number ',
            placeholder: 'Enter Total FTE Effort',
          }),
          createTextField('total_sub_con_effort', 'Total Sub Con Effort', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a Positive Integer number ',
            placeholder: 'Enter Total Sub Con Effort',
          }),
         
          createTextField('total_fte_cost', 'Total FTE Cost', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a only Positve Interger or Decimal number',
            placeholder: 'Enter Total FTE Cost',
          }), 
          createTextField('total_sub_con_cost', 'Total Sub Con Cost', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a only Positve Interger or Decimal number',
            placeholder: 'Enter Total Sub Con Cost',
          }),  
          createTextField('total_non_labor_cost', 'Total Non Labour Cost', {
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a only Positve Interger or Decimal number',
            placeholder: 'Enter Total Non Labour Cost',
          }),
        ],
      },
      {
        sectionName: 'Project Settings',
        fillType: 'half',
        fields: [
          createRadioField('auto_send_ai_interaction', 'Auto Send Interaction', {
            required: true,
            radioOptions: [
              { label: 'Yes', value: "Yes" },
              { label: 'N0', value: "No" },
            ],
          }),
          createRadioField('auto_access_rd', 'Auto Assessment', {
            required: true,
            radioOptions: [
              { label: 'Yes', value: "Yes" },
              { label: 'N0', value: "No" },
            ],
          }),
          createTextField('max_ai_interaction', 'Max Interaction follow up', {
            required: false,
            placeholder: 'Enter  Max AI Interactions',
            regex: REGEX_PATTERNS.POSITIVE_INTEGER_REGEX,
            regexErrorMessage: 'Enter a only Positve Interger number',
          }),
         
          createTextField('blended_rate_fte', 'Blended Rate FTE', {
            required: false,
            placeholder: 'Enter Blended Rate FTE',
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a Positive Integer or Decimal number ',
          }),
          createTextField('blended_rate_sub_con', 'Blended Rate Sub Con', {
            required: false,
            placeholder: 'Enter Blended Rate Sub Con',
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage: 'Enter a Positive Integer or Decimal number ',
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide:!disableFields,
        fields: [
          createDateField('last_rd_ai_assess_on', 'Created On', {
            required: false,
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('llast_rd_ai_assess_by', 'Created By', {
            required: false,
            placeholder: 'Enter Last Rd AI Assessed By',
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createDateField('last_rd_ai_assess_on', 'Updated On', {
            required: false,
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('llast_rd_ai_assess_by', 'Updated By', {
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
          createTextAreaField('project_description', 'Comments', {
            required: false,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Maximum 2000 characters allowed',
            placeholder: 'Enter a comments',
            
          }),
        ],
      },
    ],
    [country, state, disableFields, currency, stateLoading]
  );
};

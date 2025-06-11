import { useMemo } from 'react';
import {
  createButton,
  createDateField,
  createEmptyField,
  createImgButton,
  createRadioField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_TYPE,
  PROJECT_YES_NO_OPTIONS,
  REGEX_PATTERNS,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
} from '../../../common-utils';
import { FieldType, FormType, SelectOption } from '../../types';
import { fiscalYears } from '../resource-form/form-data';
import { closeIcon } from '../../../assets';
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
} as const;

export const newKeyContactFields = (
  roles: SelectOption[],
  isPrimaryContactRequired: boolean
) => [
  createTextField('key_contact_name', 'Contact Name', {
    required: false,
    width: '190px',
    placeholder: 'Enter Contact Name',
    onChange: true,
    errorHandling: [
      {
        regex: REGEX_PATTERNS.MIN_2,
        errorMessage: 'Key Contact Name must be at least 2 characters long',
      },
      {
        regex: REGEX_PATTERNS.MAX_NAME_REGEX,
        errorMessage: 'Key Contact Name must not exceed 128 characters',
      },
      {
        regex: REGEX_PATTERNS.CONTACT_NAME,
        errorMessage:
          "Key Contact Name can only contain letters, spaces, apostrophes ('), and hyphens (-)",
      },
      {
        regex: REGEX_PATTERNS.KEY_CONTACT_NO_CONSECUTIVE,
        errorMessage:
          'Key Contact Name must not contain consecutive special characters',
      },
      {
        regex: REGEX_PATTERNS.KEY_CONTACT_NO_TRAILING,
        errorMessage:
          'Key Contact Name cannot begin or end with a space or special character',
      },
    ],
  }),
  createSelectField('key_contact_role', 'Role', {
    options: roles,
    width: '180px',
    required: false,
    placeholder: 'Choose Role',
    onChange: true,
  }),
  createTextField('key_contact_email', 'Email', {
    required: false,
    width: '180px',
    placeholder: 'Enter Email',
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
  createTextField('key_contact_rid', 'Key Contact ID', {
    required: false,
    hide: true,
    placeholder: '',
  }),
  createRadioField('is_primary_contact', 'Is Primary Contact?', {
    radioOptions: YES_NO_OPTIONS,
    width: '140px',
    required: isPrimaryContactRequired,
    onChange: true,
  }),
  createRadioField('include_in_communication', 'Include In Communications?', {
    radioOptions: YES_NO_OPTIONS,
    width: '200px',
    required: false,
    // defaultValue: YesNo.No,
  }),
  createSelectField('key_contact_status', 'Status', {
    required: false,
    width: '140px',
    options: STATUS_OPTIONS,
    placeholder: 'Choose Status',
    defaultValue: STATUS_OPTIONS[0].value,
  }),
  createImgButton('button', closeIcon, {
    width: '30px',
  }),
];

const createDynamicField = (
  contacts: FieldType,
  index: number,
  removeKeyContact: (index: number) => void
) => {
  const fieldsArr = [];
  const groupIndex = Math.floor(index / 8);
  const { name, label, ...rest } = contacts;
  const dynamicName = `${name}_${groupIndex}`;
  if (contacts.type === 'text') {
    fieldsArr.push(
      createTextField(dynamicName, label, {
        ...rest,
      })
    );
  }
  if (contacts.type === 'select') {
    fieldsArr.push(
      createSelectField(dynamicName, label, {
        ...rest,
        options: rest.options || [],
      })
    );
  }

  if (contacts.type === 'radio') {
    fieldsArr.push(
      createRadioField(dynamicName, label, {
        required: rest.required,
        width: rest.width,
        defaultValue: rest.defaultValue,
        disabled: rest.disabled,
        onChange: rest.onChange,
        radioOptions: rest.options || [],
      })
    );
  }
  if (contacts.type === 'iconButton') {
    fieldsArr.push(
      createImgButton(dynamicName, '', {
        width: rest.width,
        onClick: () => removeKeyContact(index),
      })
    );
  }

  return fieldsArr;
};

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
  // roles: SelectOption[],
  keyContacts: FieldType[],
  addNewKeyContact: () => void,
  removeKeyContact: (index: number) => void,
  disableFields?: boolean,
  showOthersField?: boolean,
  showClassifyOthersField?: boolean,
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
            placeholder: 'Enter Project Code',
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
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
              },
              // {
              //   regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
              //   errorMessage:
              //     'Cannot begin or end with a space or special character',
              // },
            ],
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
          }),
          createTextField('project_name', 'Name', {
            // required: true,
            placeholder: 'Enter Name',
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
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
              },
            ],
          }),
          createSelectField('project_type', 'Project Type', {
            required: true,
            options: PROJECT_TYPE,
            placeholder: 'Choose Project Type',
          }),
          createDateField('project_startdate', 'Start Date', {
            required: false,
            minDate: new Date('2000-01-01'),
            maxDate: currentDate,
            disableFutureDates: true,
          }),

          createDateField('project_enddate', 'End Date', {
            required: false,
            minDate: new Date(minDate.getTime()),
            maxDate: currentDate,
          }),
          createSelectField('project_classification_rid', 'Classification', {
            options: classification,
            placeholder: 'Choose Classification',
            required: false,
            onChange: true,
            resetDependsFields: ['classification_name'],
          }),
          createTextField('classification_name', 'Classification-Other', {
            required: true,
            placeholder: 'Enter Classification-Other',
            hide: !showClassifyOthersField,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage:
                  'Classification-Other must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
              },
            ],
          }),
          createTextField('project_group', 'Project Group', {
            placeholder: 'Enter Project  Group',
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
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
              },
            ],
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
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
              },
            ],
          }),
          createTextField('program_name', 'Program Name', {
            placeholder: 'Enter Program Name',
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
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
              },
            ],
          }),
          createSelectField('industry_rid', 'Industry', {
            options: industry,
            placeholder: 'Choose Industry',
            required: false,
            onChange: true,
            resetDependsFields: ['industry_name'],
          }),
          createTextField('industry_name', 'Industry-Other', {
            required: true,
            placeholder: 'Enter Industry-Other',
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
                regex: REGEX_PATTERNS.PROJECT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
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
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('project_description', 'Description', {
            required: false,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Maximum 2000 characters allowed',
            placeholder: 'Enter Description',
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
            // disabled: disableFields,
            resetDependsFields: ['region'],
          }),
          createSelectField('region', 'Region', {
            options: state,
            placeholder: 'Choose Region',
            required: false,
            isLoading: stateLoading,
            // disabled: disableFields,
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            required: false,
            placeholder: 'Choose Currency',
            // disabled: disableFields,
          }),
        ],
      },
      {
        sectionName: 'Key Contacts List',
        fillType: 'half',
        fields: [
          ...keyContacts
            .map((contacts, index) => [
              ...createDynamicField(contacts, index, removeKeyContact),
            ])
            .flat(),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createButton('Add another key contact', '', {
            iconUrl: '',
            onClick: addNewKeyContact,
          }),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        fields: [
          createTextField('total_fte', 'Total FTE Count', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_9,
            regexErrorMessage:
              'Total FTE Count Count must be a positive integer with up to 9 digits',
            placeholder: 'Enter Total FTE Count',
          }),
          createTextField('total_sub_con', 'Total Sub Con Count', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_9,
            regexErrorMessage:
              'Total Sub Con Count must be a positive integer with up to 9 digits',
            placeholder: 'Enter Total Sub Con Count',
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createTextField('total_fte_effort', 'Total FTE Effort', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_NUMBER,
            regexErrorMessage:
              'Total FTE Effort must be a positive integer with up to 16 digits',
            placeholder: 'Enter Total FTE Effort',
          }),
          createTextField('total_sub_con_effort', 'Total Sub Con Effort', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_NUMBER,
            regexErrorMessage:
              'Total Sub Con Effort must be a positive integer with up to 16 digits',
            placeholder: 'Enter Total Sub Con Effort',
          }),
          createTextField('total_effort', 'Total Effort In Hrs', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_NUMBER,
            regexErrorMessage:
              'Effort In Hrs must be a positive integer with up to 16 digits',
            placeholder: 'Enter Total Effort In Hrs',
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
              'Total Sub Con Cost must be a positive integer up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Sub Con Cost',
          }),
          createTextField('total_non_labor_cost', 'Total Non Labor Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Total Non Labor Cost must be a positive integer with up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Non Labor Cost',
          }),
          createTextField('total_cost', 'Total Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Total Cost must be a positive integer with up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Cost',
          }),
        ],
      },
      {
        sectionName: 'Project Settings',
        fillType: 'half',
        fields: [
          createTextField('blended_rate_fte', 'Blended Rate - FTE', {
            required: false,
            placeholder: 'Enter Blended Rate - FTE',
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
          }),
          createTextField('blended_rate_sub_con', 'Blended Rate - SubCon', {
            required: false,
            placeholder: 'Enter Blended Rate - SubCon',
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createRadioField('auto_access_rd', 'Auto Assessment', {
            required: false,
            radioOptions: PROJECT_YES_NO_OPTIONS,
          }),
          createRadioField(
            'auto_send_ai_interaction',
            'Auto Send Interaction',
            {
              required: true,
              radioOptions: PROJECT_YES_NO_OPTIONS,
            }
          ),
          createTextField('max_ai_interaction', 'Max Interaction Follow Up', {
            required: true,
            placeholder: 'Enter Max Interaction Follow Up',
            regex: REGEX_PATTERNS.POSITIVE_INTEGER_REGEX,
            regexErrorMessage:
              ' Max Interaction follow up must be a positive integer between 1 and 10.',
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
            placeholder: 'Enter Comments',
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
            // placeholder: 'Enter Project Number',
            disabled: disableFields,
            hide: !disableFields,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('created_name', 'Created By', {
            required: false,
            // placeholder: 'Enter Last Rd AI Assessed By',
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('r_number', 'Project ID', {
            required: false,
            // placeholder: 'Enter Project Number',
            disabled: disableFields,
            hide: !disableFields,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: disableFields,
            // hide:!disableFields,
          }),
          createTextField('modified_name', 'Updated By', {
            required: false,
            // placeholder: 'Enter Last Rd AI Assessed By',
            disabled: disableFields,
            // hide:!disableFields,
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
      showClassifyOthersField,
      stateLoading,
      keyContacts,
    ]
  );
};

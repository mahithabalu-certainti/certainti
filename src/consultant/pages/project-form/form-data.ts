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
  REGEX_PATTERNS,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
} from '../../../common-utils';
import { FieldType, FormType, SelectOption } from '../../types';
import { fiscalYears } from '../resource-form/form-data';
import { CloseIcon } from '../../../assets';
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
} as const;

export const newKeyContactFields = (
  roles: SelectOption[],
  disabled?: boolean
): FieldType[] => [
  createTextField('key_contact_name', 'Key Contact Name', {
    required: false,
    width: '190px',
    placeholder: 'Enter Key Contact Name',
    onChange: true,
    disabled: disabled || false,
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
  createSelectField('key_contact_role', 'Key Contact Role', {
    options: roles,
    width: '180px',
    required: false,
    placeholder: 'Choose Key Contact Role',
    onChange: true,
    disabled: disabled || false,
  }),
  createTextField('key_contact_email', 'Key Contact Email', {
    required: false,
    width: '180px',
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
    disabled: disabled || false,
  }),
  createTextField('key_contact_rid', 'Key Contact ID', {
    required: false,
    hide: true,
    placeholder: '',
    disabled: disabled || false,
  }),
  createRadioField('is_primary_contact', 'Is Primary Contact?', {
    radioOptions: YES_NO_OPTIONS,
    width: '140px',
    required: true,
    disabled: disabled || false,
  }),
  createRadioField('include_in_communication', 'Interaction Recipient?', {
    radioOptions: YES_NO_OPTIONS,
    width: '200px',
    required: true,
    disabled: disabled || false,
  }),
  createRadioField('interaction_cc_recipient', 'Interaction CC Recipient?', {
    radioOptions: YES_NO_OPTIONS,
    width: '200px',
    required: true,
    disabled: disabled || false,
  }),
  createSelectField('key_contact_status', 'Key Contact Status', {
    required: false,
    width: '140px',
    options: STATUS_OPTIONS,
    disabled: disabled || false,
  }),
  createImgButton('button', CloseIcon, {
    width: '30px',
    disabled: disabled || false,
  }),
];

const createDynamicField = (
  contacts: FieldType,
  index: number,
  removeKeyContact: (index: number) => void
) => {
  const fieldsArr: FieldType[] = [];
  const groupIndex = Math.floor(index / 9);
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
        disabled: rest.disabled,
      })
    );
  }
  return fieldsArr;
};

const getDateConstraints = (yearsBack: number) => {
  const currentDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(currentDate.getFullYear() - yearsBack);
  return { currentDate, minDate };
};

const { currentDate } = getDateConstraints(DATE_CONFIG.MIN_YEARS_BACK);

export const FormData = (
  statusOptions: SelectOption[],
  projectTypeOptions: SelectOption[],
  country: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  industry: SelectOption[],
  classification: SelectOption[],
  keyContacts: FieldType[],
  addNewKeyContact: () => void,
  removeKeyContact: (index: number) => void,
  isEditView?: boolean,
  showOthersField?: boolean,
  showClassifyOthersField?: boolean,
  stateLoading?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  totalEffort?: string,
  calculatedTotalCost?: string,
  disableTotalEffort?: boolean,
  disableTotalCost?: boolean
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
            disabled:
              isEditView &&
              permissionMap?.['project_code']?.read &&
              !permissionMap?.['project_code']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_code']?.read &&
              !permissionMap?.['project_code']?.edit,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_5,
                errorMessage:
                  'Project code must be more than 4 characters long',
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
            ],
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
            isFiscalYear: true,
            disabled:
              isEditView &&
              permissionMap?.['fiscal_year']?.read &&
              !permissionMap?.['fiscal_year']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['fiscal_year']?.read &&
              !permissionMap?.['fiscal_year']?.edit,
          }),
          createTextField('project_name', 'Name', {
            placeholder: 'Enter Name',
            disabled:
              isEditView &&
              permissionMap?.['project_name']?.read &&
              !permissionMap?.['project_name']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_name']?.read &&
              !permissionMap?.['project_name']?.edit,
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
            options: projectTypeOptions,
            placeholder: 'Choose Project Type',
            disabled:
              isEditView &&
              permissionMap?.['project_type_rid']?.read &&
              !permissionMap?.['project_type_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_type_rid']?.read &&
              !permissionMap?.['project_type_rid']?.edit,
          }),
          createDateField('project_startdate', 'Start Date', {
            required: false,
            minDate: new Date('2000-01-01'),
            maxDate: currentDate,
            disableFutureDates: true,
            disabled:
              isEditView &&
              permissionMap?.['project_startdate']?.read &&
              !permissionMap?.['project_startdate']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_startdate']?.read &&
              !permissionMap?.['project_startdate']?.edit,
          }),
          createDateField('project_enddate', 'End Date', {
            required: false,
            minDate: new Date('2000-01-01'),
            maxDate: currentDate,
            disabled:
              isEditView &&
              permissionMap?.['project_enddate']?.read &&
              !permissionMap?.['project_enddate']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_enddate']?.read &&
              !permissionMap?.['project_enddate']?.edit,
          }),
          createSelectField('project_classification_rid', 'Classification', {
            options: classification,
            placeholder: 'Choose Classification',
            required: false,
            onChange: true,
            disabled:
              isEditView &&
              permissionMap?.['project_classification_rid']?.read &&
              !permissionMap?.['project_classification_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_classification_rid']?.read &&
              !permissionMap?.['project_classification_rid']?.edit,
            resetDependsFields: ['classification_name'],
          }),
          createTextField('classification_name', 'Classification-Other', {
            required: true,
            placeholder: 'Enter Classification-Other',
            disabled:
              isEditView &&
              permissionMap?.['project_classification_rid']?.read &&
              !permissionMap?.['project_classification_rid']?.edit,
            hide:
              (isEditView &&
                !permissionMap?.['project_classification_rid']?.read &&
                !permissionMap?.['project_classification_rid']?.edit) ||
              !showClassifyOthersField,
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
            placeholder: 'Enter Project Group',
            disabled:
              isEditView &&
              permissionMap?.['project_group']?.read &&
              !permissionMap?.['project_group']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_group']?.read &&
              !permissionMap?.['project_group']?.edit,
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
            disabled:
              isEditView &&
              permissionMap?.['project_client_group']?.read &&
              !permissionMap?.['project_client_group']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_client_group']?.read &&
              !permissionMap?.['project_client_group']?.edit,
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
            disabled:
              isEditView &&
              permissionMap?.['program_name']?.read &&
              !permissionMap?.['program_name']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['program_name']?.read &&
              !permissionMap?.['program_name']?.edit,
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
            disabled:
              isEditView &&
              permissionMap?.['industry_rid']?.read &&
              !permissionMap?.['industry_rid']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['industry_rid']?.read &&
              !permissionMap?.['industry_rid']?.edit,
            resetDependsFields: ['industry_name'],
          }),
          createTextField('industry_name', 'Industry-Other', {
            required: true,
            placeholder: 'Enter Industry-Other',
            disabled:
              isEditView &&
              permissionMap?.['industry_rid']?.read &&
              !permissionMap?.['industry_rid']?.edit,
            hide:
              (isEditView &&
                !permissionMap?.['industry_rid']?.read &&
                !permissionMap?.['industry_rid']?.edit) ||
              !showOthersField,
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
            options: statusOptions,
            placeholder: 'Choose Status',
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
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('project_description', 'Description', {
            required: false,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Maximum 2000 characters allowed',
            placeholder: 'Enter Description',
            disabled:
              isEditView &&
              permissionMap?.['project_description']?.read &&
              !permissionMap?.['project_description']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['project_description']?.read &&
              !permissionMap?.['project_description']?.edit,
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
            disabled:
              isEditView &&
              permissionMap?.['country']?.read &&
              !permissionMap?.['country']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['country']?.read &&
              !permissionMap?.['country']?.edit,
            resetDependsFields: ['region'],
          }),
          createSelectField('region', 'Region', {
            options: state,
            placeholder: 'Choose Region',
            required: false,
            isLoading: stateLoading,
            disabled:
              isEditView &&
              permissionMap?.['region']?.read &&
              !permissionMap?.['region']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['region']?.read &&
              !permissionMap?.['region']?.edit,
          }),
          createSelectField('currency', 'Currency', {
            options: currency,
            required: false,
            placeholder: 'Choose Currency',
            disabled:
              isEditView &&
              permissionMap?.['currency']?.read &&
              !permissionMap?.['currency']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['currency']?.read &&
              !permissionMap?.['currency']?.edit,
          }),
        ],
      },
      {
        sectionName: 'key_contacts_list',
        fillType: 'half',
        from: 'project',
        hide:
          isEditView &&
          !permissionMap?.['key_contacts']?.read &&
          !permissionMap?.['key_contacts']?.edit,
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
        hide:
          isEditView &&
          !permissionMap?.['key_contacts']?.read &&
          !permissionMap?.['key_contacts']?.edit,
        fields: [
          createButton('Add Key Contact', '', {
            iconUrl: '',
            onClick: addNewKeyContact,
            disabled:
              isEditView &&
              permissionMap?.['key_contacts']?.read &&
              !permissionMap?.['key_contacts']?.edit,
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
              'Total FTE Count must be a positive integer with up to 9 digits',
            placeholder: 'Enter Total FTE Count',
            disabled:
              isEditView &&
              permissionMap?.['total_fte']?.read &&
              !permissionMap?.['total_fte']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_fte']?.read &&
              !permissionMap?.['total_fte']?.edit,
          }),
          createTextField('total_subcon', 'Total Sub Con Count', {
            regex: REGEX_PATTERNS.EFFORTS_INTEGER_9,
            regexErrorMessage:
              'Total Sub Con Count must be a positive integer with up to 9 digits',
            placeholder: 'Enter Total Sub Con Count',
            disabled:
              isEditView &&
              permissionMap?.['total_subcon']?.read &&
              !permissionMap?.['total_subcon']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_subcon']?.read &&
              !permissionMap?.['total_subcon']?.edit,
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createTextField('total_effort_fte', 'Total FTE Effort', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total FTE Effort',
            onChange: true,
            resetDependsFields: ['total_effort'],
            disabled:
              isEditView &&
              permissionMap?.['total_effort_fte']?.read &&
              !permissionMap?.['total_effort_fte']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_effort_fte']?.read &&
              !permissionMap?.['total_effort_fte']?.edit,
          }),
          createTextField('total_effort_subcon', 'Total Sub Con Effort', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Sub Con Effort',
            onChange: true,
            resetDependsFields: ['total_effort'],
            disabled:
              isEditView &&
              permissionMap?.['total_effort_subcon']?.read &&
              !permissionMap?.['total_effort_subcon']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_effort_subcon']?.read &&
              !permissionMap?.['total_effort_subcon']?.edit,
          }),
          createTextField('total_effort', 'Total Effort In Hrs', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Effort In Hrs',
            onChange: true,
            defaultValue: totalEffort || '',
            disabled:
              (isEditView &&
                permissionMap?.['total_effort']?.read &&
                !permissionMap?.['total_effort']?.edit) ||
              disableTotalEffort,
            hide:
              isEditView &&
              !permissionMap?.['total_effort']?.read &&
              !permissionMap?.['total_effort']?.edit,
          }),
          createTextField('total_cost_fte', 'Total FTE Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            resetDependsFields: ['total_cost'],
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total FTE Cost',
            onChange: true,
            disabled:
              isEditView &&
              permissionMap?.['total_cost_fte']?.read &&
              !permissionMap?.['total_cost_fte']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_cost_fte']?.read &&
              !permissionMap?.['total_cost_fte']?.edit,
          }),
          createTextField('total_cost_subcon', 'Total Sub Con Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            resetDependsFields: ['total_cost'],
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Sub Con Cost',
            onChange: true,
            disabled:
              isEditView &&
              permissionMap?.['total_cost_subcon']?.read &&
              !permissionMap?.['total_cost_subcon']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_cost_subcon']?.read &&
              !permissionMap?.['total_cost_subcon']?.edit,
          }),
          createTextField('total_cost_nonlabor', 'Total Non Labor Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            resetDependsFields: ['total_cost'],
            regexErrorMessage:
              'Total Non Labor Cost must be a positive integer with up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Non Labor Cost',
            onChange: true,
            disabled:
              isEditView &&
              permissionMap?.['total_cost_nonlabor']?.read &&
              !permissionMap?.['total_cost_nonlabor']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['total_cost_nonlabor']?.read &&
              !permissionMap?.['total_cost_nonlabor']?.edit,
          }),
          createTextField('total_cost', 'Total Cost', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Total Cost must be a positive integer with up to 16 digits and 2 decimal places',
            placeholder: 'Enter Total Cost',
            onChange: true,
            defaultValue: calculatedTotalCost || '',
            disabled:
              (isEditView &&
                permissionMap?.['total_cost']?.read &&
                !permissionMap?.['total_cost']?.edit) ||
              disableTotalCost,
            hide:
              isEditView &&
              !permissionMap?.['total_cost']?.read &&
              !permissionMap?.['total_cost']?.edit,
          }),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        hide:
          isEditView &&
          !permissionMap?.['comments']?.read &&
          !permissionMap?.['comments']?.edit,
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Maximum 2000 characters allowed',
            placeholder: 'Enter Comments',
            disabled:
              isEditView &&
              permissionMap?.['comments']?.read &&
              !permissionMap?.['comments']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['comments']?.read &&
              !permissionMap?.['comments']?.edit,
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
              !permissionMap?.['rid']?.read &&
              !permissionMap?.['rid']?.edit,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['created_datetime']?.read &&
              !permissionMap?.['created_datetime']?.edit,
          }),
          createTextField('created_name', 'Created By', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['created_by']?.read &&
              !permissionMap?.['created_by']?.edit,
          }),
          createTextField('r_number', 'Project ID', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['r_number']?.read &&
              !permissionMap?.['r_number']?.edit,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['modified_datetime']?.read &&
              !permissionMap?.['modified_datetime']?.edit,
          }),
          createTextField('modified_name', 'Updated By', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['modified_by']?.read &&
              !permissionMap?.['modified_by']?.edit,
          }),
        ],
      },
    ],
    [
      statusOptions,
      projectTypeOptions,
      classification,
      showClassifyOthersField,
      industry,
      showOthersField,
      country,
      state,
      stateLoading,
      currency,
      keyContacts,
      addNewKeyContact,
      removeKeyContact,
      isEditView,
      permissionMap,
      totalEffort,
      calculatedTotalCost,
      disableTotalEffort,
      disableTotalCost,
    ]
  );
};

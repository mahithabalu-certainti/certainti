import { useMemo } from 'react';
import { FieldType, FormType, SelectOption, YesNo } from '../../types';
import { DATA_STORAGE_OPTIONS } from './utils';
import {
  createButton,
  createEmptyField,
  createFiscalDateField,
  createImgButton,
  createRadioField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
} from '../../../common-utils';
import { CloseIcon } from '../../../assets';

export const newKeyContactFields = (roles: SelectOption[]) => [
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
    required: true,
  }),
  createRadioField('include_in_communication', 'Interaction Recipient?', {
    radioOptions: YES_NO_OPTIONS,
    width: '200px',
    required: true,
  }),
  // createRadioField('interaction_cc_recipient', 'Interaction CC Recipient?', {
  //   radioOptions: YES_NO_OPTIONS,
  //   width: '200px',
  //   required: true,
  //   defaultValue: YesNo.No,
  // }),
  createSelectField('key_contact_status', 'Status', {
    required: false,
    width: '140px',
    options: STATUS_OPTIONS,
    placeholder: 'Choose Status',
  }),
  createImgButton('button', CloseIcon, {
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

export const AccFormData = (
  country: SelectOption[],
  parentAccount: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  dataResidency: SelectOption[],
  industrys: SelectOption[],
  isParentAccountRequired: boolean,
  keyContacts: FieldType[],
  addNewKeyContact: () => void,
  removeKeyContact: (index: number) => void,
  disableFields?: boolean,
  stateLoading?: boolean,
  showOthersField?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('account_name', 'Name', {
            required: true,
            placeholder: 'Enter Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_ACCOUNT_NAME_REGEX,
                errorMessage: 'Name must be more than 6 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_ACCOUNT_NAME_REGEX,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.ACCOUNT_NAME,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
              },
            ],
          }),
          createRadioField('is_parent', 'Is Parent Account', {
            radioOptions: YES_NO_OPTIONS,
            disabled: disableFields,
            required: true,
            onChange: true,
            defaultSelect: {
              matchedValue: YesNo.Yes,
              key: 'data_storage',
              ifMatchValue: DATA_STORAGE_OPTIONS[0].value,
              ifNotMatchValue: DATA_STORAGE_OPTIONS[1].value,
            },
          }),
          createSelectField('parent_account_rid', 'Parent Account', {
            options: parentAccount,
            placeholder: 'Choose Parent Account',
            required: isParentAccountRequired,
            disabled: !isParentAccountRequired || disableFields,
            clearValue: {
              key: 'is_parent',
              matchedValue: YesNo.Yes,
            },
          }),
          createSelectField('industry_rid', 'Industry', {
            options: industrys,
            placeholder: 'Choose Industry',
            required: true,
            onChange: true,
          }),
          createTextField('industry_name_other', 'Industry-other', {
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
                regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                errorMessage:
                  "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
              },
            ],
          }),
          createTextField('website', 'Website', {
            type: 'text',
            required: false,
            placeholder: 'Enter Website',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_WEBSITE,
                errorMessage: 'Minimum 10 characters required',
              },
              {
                regex: REGEX_PATTERNS.MAX_WEBSITE,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.WEBSITE,
                errorMessage: 'Enter a valid website URL',
              },
            ],
          }),
          createTextField('annual_revenue', 'Annual Revenue', {
            required: false,
            regex: REGEX_PATTERNS.ANNUAL_REVENUE,
            regexErrorMessage:
              'Only positive numbers allowed, up to 12 digits and 2 decimal places',
            placeholder: 'Enter Annual Revenue',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_ANNUAL_REVENUE,
                errorMessage: 'Maximum length exceeded.',
              },
            ],
          }),
          createSelectField('status', 'Status', {
            required: true,
            options: STATUS_OPTIONS,
            placeholder: 'Choose Status',
          }),
          createTextField('organisation_name', 'Org Name', {
            required: true,
            placeholder: 'Enter Org Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_ORG_NAME_LEGNTH,
                errorMessage: 'Org Name must be more than 6 characters long',
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
          createTextField('logo', 'Org Logo', {
            type: 'file',
            onChange: true,
            required: false,
            placeholder: 'Browse Image',
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('business_details', 'Business Details', {
            required: true,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage:
              'Business Details must be within 2000 characters',
            placeholder: 'Enter Business Details',
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
            resetDependsFields: ['region'],
          }),
          createSelectField('region', 'Region', {
            options: state,
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
        sectionName: 'key_contacts_list',
        fillType: 'half',
        from: 'account',
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
          createButton('Add key contact', '', {
            iconUrl: '',
            onClick: addNewKeyContact,
          }),
        ],
      },
      {
        sectionName: 'Account Settings',
        fillType: 'half',
        fields: [
          createFiscalDateField('fiscal_start_date', 'Fiscal Start', {
            required: true,
            disabled: disableFields,
          }),
          createFiscalDateField('fiscal_end_date', 'Fiscal End', {
            disabled: disableFields,
            required: true,
            toBeNotSame: {
              key: 'fiscal_start_date',
              errorMessage:
                'Fiscal End Date cannot be the same as the Fiscal Start Date',
            },
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createTextField('blended_rate_fte', 'Blended Rate - FTE', {
            required: false,
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
            placeholder: 'Enter Blended Rate - FTE',
          }),
          createTextField('blended_rate_subcon', 'Blended Rate - SubCon', {
            required: false,
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
            placeholder: 'Enter Blended Rate - SubCon',
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createRadioField('auto_access_rd', 'Auto Assessment', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
          }),
          createRadioField('autosend_interaction', 'Auto Send Interaction', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
          }),
          createTextField('max_ai_interactions', 'Max Interaction Follow Up', {
            required: true,
            regex: REGEX_PATTERNS.MAX_AI_INTERACTIONS,
            regexErrorMessage:
              'Max Interaction Follow Up must be between 1 and 10',
            placeholder: 'Enter Max Interaction Follow Up',
          }),
          createRadioField('data_storage', 'Data Residency', {
            required: true,
            radioOptions: dataResidency,
            disabled: disableFields,
          }),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            regex: REGEX_PATTERNS.ACCOUNT_DESCRIPTION,
            regexErrorMessage: 'Comments must be within 2000 characters',
            placeholder: 'Enter Comments',
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !disableFields,
        fields: [
          createTextField('record_id', 'Record ID', {
            required: false,
            disabled: true,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
          }),
          createTextField('account_id', 'Account ID', {
            required: false,
            disabled: true,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
          }),
        ],
      },
    ],
    [
      industrys,
      disableFields,
      parentAccount,
      isParentAccountRequired,
      country,
      state,
      stateLoading,
      currency,
      dataResidency,
      showOthersField,
      keyContacts,
      addNewKeyContact,
      removeKeyContact,
    ]
  );
};

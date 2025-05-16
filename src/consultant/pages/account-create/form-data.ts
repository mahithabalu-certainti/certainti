import { useMemo } from 'react';
import { FieldType, FormType, SelectOption, YesNo } from '../../types';
import { DATA_STORAGE_OPTIONS } from './utils';
import {
  createButton,
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
import { closeIcon } from '../../../assets';

export const newKeyContactFields = (
  roles: SelectOption[],
  isPrimaryContactRequired: boolean
) => [
  createTextField('key_contact_name', 'Key Contact Name', {
    required: false,
    width: '190px',
    regex: REGEX_PATTERNS.CONTACT_NAME,
    regexErrorMessage: 'Invalid Name',
    placeholder: 'Enter Key Contact Name',
    onChange: true,
    errorHandling: [
      {
        regex: REGEX_PATTERNS.MIN_NAME_REGEX,
        errorMessage: 'Key Contact Name must be more than 1 characters long',
      },
      {
        regex: REGEX_PATTERNS.MAX_NAME_REGEX,
        errorMessage: 'Max length exceeded',
      },
      {
        regex: REGEX_PATTERNS.NOT_ALLOW_SPACE_SYMBOLS_AT_START_END,
        errorMessage: 'Cannot begin or end with a space or special character',
      },
    ],
  }),
  createSelectField('key_contact_role', 'Role', {
    options: roles,
    width: '140px',
    required: false,
    placeholder: 'Choose Role',
    onChange: true,
  }),
  createTextField('key_contact_email', 'Email', {
    required: false,
    width: '160px',
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
  createRadioField('is_primary_contact', 'Is Primary Contact?', {
    radioOptions: YES_NO_OPTIONS,
    width: '140px',
    required: isPrimaryContactRequired,
    onChange: true,
  }),
  createRadioField('include_in_communication', 'Include in Communications?', {
    radioOptions: YES_NO_OPTIONS,
    width: '190px',
    required: false,
  }),
  createSelectField('key_contact_status', 'Status', {
    required: false,
    width: '140px',
    options: STATUS_OPTIONS,
    placeholder: 'Choose Status',
  }),
  createImgButton(closeIcon, {
    width: '60px',
  }),
];

const createDynamicField = (
  contacts: FieldType,
  index: number,
  removeKeyContact: (index: number) => void
) => {
  const fieldsArr = [];
  const groupIndex = Math.floor(index / 7);
  const { name, label, ...rest } = contacts;
  if (contacts.type === 'text') {
    fieldsArr.push(
      createTextField(name + '_' + groupIndex, label, {
        ...rest,
      })
    );
  }
  if (contacts.type === 'select') {
    fieldsArr.push(
      createSelectField(name + '_' + groupIndex, label, {
        ...rest,
        options: rest.options || [],
      })
    );
  }
  if (contacts.type === 'radio') {
    fieldsArr.push(
      createRadioField(name + '_' + groupIndex, label, {
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
      createImgButton('', {
        width: rest.width,
        onClick: () => removeKeyContact(index),
      })
    );
  }

  return fieldsArr;
};

export const FormData = (
  country: SelectOption[],
  parentAccount: SelectOption[],
  currency: SelectOption[],
  state: SelectOption[],
  dataResidency: SelectOption[],
  industrys: SelectOption[],
  roles: SelectOption[],
  isPrimaryContactRequired: boolean,
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
          // createTextField('rid', 'Account ID', {
          //   required: true,
          //   regex: REGEX_PATTERNS.ALPHANUMERIC,
          //   regexErrorMessage: 'Please Enter valid Account ID',
          //   placeholder: 'Enter Account ID',
          //   disabled: disableFields,
          // }),
          createTextField('account_name', 'Account Name', {
            required: true,
            regex: REGEX_PATTERNS.ACCOUNT_NAME,
            regexErrorMessage:
              "only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,)",
            placeholder: 'Enter Account Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_ACCOUNT_NAME_REGEX,
                errorMessage:
                  'Account Name must be more than 6 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_ACCOUNT_NAME_REGEX,
                errorMessage: 'Max length exceeded',
              },
            ],
          }),
          createSelectField('industry_rid', 'Industry', {
            options: industrys,
            placeholder: 'Choose Industry',
            required: true,
            onChange: true,
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
          createTextField('industry_name_other', 'Industry - Others', {
            required: true,
            regex: REGEX_PATTERNS.MAX_255,
            regexErrorMessage: 'Max length exceeded',
            placeholder: 'Enter Industry - Others',
            hide: !showOthersField,
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
          createSelectField('status', 'Status', {
            required: true,
            options: STATUS_OPTIONS,
            placeholder: 'Choose Status',
          }),
          createTextField('website', 'Website', {
            type: 'website',
            required: false,
            regex: REGEX_PATTERNS.WEBSITE,
            regexErrorMessage: 'Enter a valid website URL',
            placeholder: 'Enter Website',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_WEBSITE,
                errorMessage: 'Max length exceeded',
              },
            ],
          }),
          createTextField('project_manager', 'Delivery Manager', {
            required: false,
            regex: REGEX_PATTERNS.MANAGER_REGEX,
            regexErrorMessage: 'Enter a valid name',
            placeholder: 'Enter Delivery Manager Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_NAME_REGEX,
                errorMessage: 'Name must be more than 1 characters long',
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
          createTextField('annual_revenue', 'Annual Revenue', {
            required: false,
            regex: REGEX_PATTERNS.ANNUAL_REVENUE,
            regexErrorMessage:
              'Only allowed positive numbers, up to 12 digits & 2 decimal places',
            placeholder: 'Enter Annual Revenue',
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('business_details', 'Business Details', {
            required: true,
            regex: REGEX_PATTERNS.ACCOUNT_DESCRIPTION,
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
        sectionName: 'Key Contacts List',
        fillType: 'half',
        fields: [
          ...keyContacts
            .map((contacts, index) => [
              ...createDynamicField(contacts, index, removeKeyContact),
            ])
            .flat(),
          //
          // createTextField('finance_poc_name', 'Finance Contact Name', {
          //   required: true,
          //   regex: REGEX_PATTERNS.LETTERS_3_TO_25,
          //   regexErrorMessage: 'Letters Only and between 3 to 25 characters',
          //   placeholder: 'Enter Finance point of contact',
          // }),
          // createTextField('finance_poc_email', 'Finance POC Email', {
          //   required: true,
          //   regex: REGEX_PATTERNS.EMAIL,
          //   regexErrorMessage: 'Enter a valid email address',
          //   placeholder: 'Enter Finance POC Email',
          // }),
          // createPhoneInputField(
          //   'primary_contact_number',
          //   'Primary Contact Phone',
          //   {
          //     required: true,
          //     placeholder: 'Enter Primary Contact Phone',
          //   }
          // ),
          // createPhoneInputField('finanace_poc_number', 'Finance POC Phone', {
          //   required: true,
          //   placeholder: 'Enter Finance POC Phone',
          // }),
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
        sectionName: 'Account Settings',
        fillType: 'half',
        fields: [
          createFiscalDateField('fiscal_start_date', 'Fiscal start', {
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
          createRadioField('autosend_interaction', 'Auto Send Interaction', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
          }),
          createSelectField(
            'max_ai_interactions',
            'Max interaction Follow up',
            {
              required: true,
              options: [
                { label: '3', value: '3' },
                { label: '4', value: '4' },
                { label: '5', value: '5' },
              ],
              placeholder: 'Choose Max interaction Follow up',
            }
          ),
          createRadioField('auto_access_rd', 'Auto Assessment', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
          }),
          createTextField('blended_rate_fte', 'Blended Rate - FTE', {
            required: false,
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only allowed positive numbers, up to 16 digits & 2 decimal places',
            placeholder: 'Enter Blended Rate - FTE',
          }),
          createTextField('blended_rate_subcon', 'Blended Rate - SubCon', {
            required: false,
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only allowed positive numbers, up to 16 digits & 2 decimal places',
            placeholder: 'Enter Blended Rate - SubCon',
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
          createTextAreaField('account_description', 'Comments', {
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
          createTextField('account_id', 'Account ID', {
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
      roles,
      isPrimaryContactRequired,
      dataResidency,
      showOthersField,
      keyContacts,
      addNewKeyContact,
    ]
  );
};

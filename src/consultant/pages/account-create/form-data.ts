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
import { CloseIcon } from '../../../assets';

export const newKeyContactFields = (
  roles: SelectOption[],
  disabled?: boolean
) => [
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
    disabled: disabled || false,
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
  const fieldsArr = [];
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
        disabled: rest.disabled,
        onClick: () => removeKeyContact(index),
      })
    );
  }

  return fieldsArr;
};

export const AccFormData = (
  statusOptions: SelectOption[],
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
  isEditView?: boolean,
  isCaseExists?: boolean,
  stateLoading?: boolean,
  showOthersField?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
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
            disabled:
              isEditView &&
              permissionMap?.['account_name']?.read &&
              !permissionMap?.['account_name']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['account_name']?.read &&
              !permissionMap?.['account_name']?.edit,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_ACCOUNT_NAME_REGEX,
                errorMessage: 'Name must be more than 2 characters long',
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
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['is_parent']?.read &&
              !permissionMap?.['is_parent']?.edit,
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
            disabled: !isParentAccountRequired || isEditView,
            hide:
              isEditView &&
              !permissionMap?.['parent_account_rid']?.read &&
              !permissionMap?.['parent_account_rid']?.edit,
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
            hide:
              isEditView &&
              !permissionMap?.['industry_rid']?.read &&
              !permissionMap?.['industry_rid']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['industry_rid']?.read &&
              !permissionMap?.['industry_rid']?.edit,
          }),
          createTextField('industry_name_other', 'Industry-other', {
            required: true,
            placeholder: 'Enter Industry-other',
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
            hide:
              isEditView &&
              !permissionMap?.['website']?.read &&
              !permissionMap?.['website']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['website']?.read &&
              !permissionMap?.['website']?.edit,
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
            formatCostValue: true,
            hide:
              isEditView &&
              !permissionMap?.['annual_revenue']?.read &&
              !permissionMap?.['annual_revenue']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['annual_revenue']?.read &&
              !permissionMap?.['annual_revenue']?.edit,
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
            options: statusOptions,
            placeholder: 'Choose Status',
            hide:
              isEditView &&
              !permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
          }),
          createTextField('organisation_name', 'Business Name', {
            required: true,
            placeholder: 'Enter Business Name',
            hide:
              isEditView &&
              !permissionMap?.['organisation_name']?.read &&
              !permissionMap?.['organisation_name']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['organisation_name']?.read &&
              !permissionMap?.['organisation_name']?.edit,
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
          createTextField('logo', 'Business Logo', {
            type: 'file',
            onChange: true,
            required: false,
            placeholder: 'Browse Image',
            hide:
              isEditView &&
              !permissionMap?.['logo_url']?.read &&
              !permissionMap?.['logo_url']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['logo_url']?.read &&
              !permissionMap?.['logo_url']?.edit,
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
            hide:
              isEditView &&
              !permissionMap?.['business_details']?.read &&
              !permissionMap?.['business_details']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['business_details']?.read &&
              !permissionMap?.['business_details']?.edit,
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
            resetDependsFields: ['region_rid'],
            hide:
              isEditView &&
              !permissionMap?.['country_rid']?.read &&
              !permissionMap?.['country_rid']?.edit,
            disabled:
              (isEditView && isCaseExists) ||
              (isEditView &&
                permissionMap?.['country_rid']?.read &&
                !permissionMap?.['country_rid']?.edit),
            labelTooltip: {
              showTooltip: (isEditView && isCaseExists) || false,
              tooltipMessage:
                'The case already exists for this account, so the country should not be changed.',
            },
          }),
          createSelectField('region_rid', 'Region', {
            options: state,
            placeholder: 'Choose Region',
            required: false,
            isLoading: stateLoading,
            hide:
              isEditView &&
              !permissionMap?.['region_rid']?.read &&
              !permissionMap?.['region_rid']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['region_rid']?.read &&
              !permissionMap?.['region_rid']?.edit,
          }),
          createSelectField('currency_rid', 'Currency', {
            options: currency,
            required: false,
            placeholder: 'Choose Currency',
            hide:
              isEditView &&
              !permissionMap?.['currency_rid']?.read &&
              !permissionMap?.['currency_rid']?.edit,
            disabled:
              (isEditView && isCaseExists) ||
              (isEditView &&
                permissionMap?.['currency_rid']?.read &&
                !permissionMap?.['currency_rid']?.edit),
            labelTooltip: {
              showTooltip: (isEditView && isCaseExists) || false,
              tooltipMessage:
                'The case already exists for this account, so the currency should not be changed.',
            },
          }),
        ],
      },
      {
        sectionName: 'key_contacts_list',
        fillType: 'half',
        from: 'account',
        hide:
          isEditView &&
          !permissionMap?.['keyContacts']?.read &&
          !permissionMap?.['keyContacts']?.edit,
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
          !permissionMap?.['keyContacts']?.read &&
          !permissionMap?.['keyContacts']?.edit,
        fields: [
          createButton('Add Key Contact', '', {
            iconUrl: '',
            onClick: addNewKeyContact,
            disabled:
              isEditView &&
              permissionMap?.['keyContacts']?.read &&
              !permissionMap?.['keyContacts']?.edit,
          }),
        ],
      },
      {
        sectionName: 'Account Settings',
        fillType: 'half',
        fields: [
          createFiscalDateField('fiscal_start_date', 'Fiscal Start', {
            required: true,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['fiscal_start_date']?.read &&
              !permissionMap?.['fiscal_start_date']?.edit,
          }),
          createFiscalDateField('fiscal_end_date', 'Fiscal End', {
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['fiscal_end_date']?.read &&
              !permissionMap?.['fiscal_end_date']?.edit,
            required: true,
            toBeNotSame: {
              key: 'fiscal_start_date',
              errorMessage:
                'Fiscal End Date cannot be the same as the Fiscal Start Date',
            },
          }),
          createRadioField('data_storage', 'Data Residency', {
            required: true,
            radioOptions: dataResidency,
            disabled: isEditView,
            hide:
              (!isParentAccountRequired && dataResidency.length === 0) ||
              (isEditView &&
                !permissionMap?.['data_storage']?.read &&
                !permissionMap?.['data_storage']?.edit),
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
          createTextField('record_id', 'Record ID', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['rid']?.read &&
              !permissionMap?.['rid']?.edit,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_datetime']?.read &&
              !permissionMap?.['created_datetime']?.edit,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_by']?.read &&
              !permissionMap?.['created_by']?.edit,
          }),
          createTextField('account_id', 'Account ID', {
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
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
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
      industrys,
      isEditView,
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
      permissionMap,
      isCaseExists,
    ]
  );
};

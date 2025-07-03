import { useMemo } from 'react';
import { FormType, SelectOption, YesNo } from '../../../../consultant/types';
import {
  createPhoneInputField,
  createRadioField,
  createSelectField,
  createTextField,
  REGEX_PATTERNS,
  YES_NO_OPTIONS,
} from '../../../../common-utils';

export const FormData = (
  statusOptions: SelectOption[],
  country: SelectOption[],
  profile: SelectOption[],
  role: SelectOption[],
  states: SelectOption[],
  city: SelectOption[],
  orgNames: SelectOption[],
  disableFields?: boolean,
  stateLoading?: boolean,
  cityLoading?: boolean,
  disabledStatus?: boolean,
  isConsultantFirm?: string,
  org_id?: string
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Identity',
        fillType: 'half',
        fields: [
          createTextField('first_name', 'First Name', {
            required: true,
            placeholder: 'Enter First Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'First name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded',
              },
              // {
              //   regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
              //   errorMessage:
              //     'Name cannot begin or end with special characters.',
              // },
              {
                regex: REGEX_PATTERNS.NAME_REGEX,
                errorMessage:
                  "First name must contain only letters, space( ), apostrophes(') and hyphens(-).",
              },
            ],
          }),
          createTextField('last_name', 'Last Name', {
            required: true,
            placeholder: 'Enter Last Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Last name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NAME_REGEX,
                errorMessage:
                  "Last name must contain only letters, space( ), apostrophes(') and hyphens(-).",
              },
            ],
          }),
          createTextField('email', 'Email Address', {
            required: true,
            placeholder: 'Enter Email Address',
            disabled: disableFields,
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
          createPhoneInputField('phone', 'Phone Number', {
            required: false,
            placeholder: 'Enter Phone Number',
          }),
          createRadioField('is_consultant_firm', 'Is Consultant Firm', {
            radioOptions: YES_NO_OPTIONS,
            required: true,
            onChange: true,
            resetDependsFields: ['org_id'],
            dependantLabel: 'org_id',
          }),
          createSelectField('org_id', 'Org Name', {
            required: true,
            options: orgNames,
            placeholder: 'Choose Org Name',
            disabled: isConsultantFirm === YesNo.Yes,
            defaultValue:
              isConsultantFirm === YesNo.Yes ? orgNames[0]?.value : org_id,
            assignDefaultValue: true,
            dependantLabel: 'is_consultant_firm',
            clearValue: {
              key: 'is_consultant_firm',
              matchedValue: YesNo.Yes,
            },
          }),
        ],
      },
      {
        sectionName: 'Access & Role',
        fillType: 'half',
        fields: [
          createSelectField('profile_rid', 'Profile', {
            options: profile,
            required: true,
            placeholder: 'Choose Profile',
          }),
          createSelectField('role_rid', 'Role', {
            options: role,
            placeholder: 'Choose Role',
            required: true,
          }),
          createSelectField('status', 'Status', {
            required: true,
            options: statusOptions,
            placeholder: 'Choose Status',
            disabled: disabledStatus,
          }),
        ],
      },
      {
        sectionName: 'Address',
        fillType: 'half',
        fields: [
          createTextField('street', 'Street', {
            required: false,
            regex: REGEX_PATTERNS.STREET_REGEX,
            regexErrorMessage:
              'Street must contain only alphanumeric characters, spaces, commas, periods, hyphens and hash',
            placeholder: 'Enter Street',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
              },
            ],
          }),
          createSelectField('country_rid', 'Country', {
            options: country,
            placeholder: 'Choose Country',
            required: false,
            onChange: true,
            resetDependsFields: ['region_rid, city_rid'],
          }),
          createSelectField('region_rid', 'Region', {
            options: states,
            placeholder: 'Choose Region',
            required: false,
            onChange: true,
            isLoading: stateLoading,
            resetDependsFields: ['city_rid'],
          }),
          createSelectField('city_rid', 'City', {
            options: city,
            placeholder: 'Choose City',
            required: false,
            isLoading: stateLoading || cityLoading,
          }),
          createTextField('zip_code', 'Zip Code / Area Code', {
            required: false,
            placeholder: 'Enter Zip Code / Area Code',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_POSTAL_REGEX,
                errorMessage: 'Max length exceeded',
              },
              {
                regex: REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_REGEX,
                errorMessage:
                  'Zip Code / Area cannot start or end with a space, or hyphen.',
              },
              {
                regex: REGEX_PATTERNS.POSTAL_CODE,
                errorMessage:
                  'Zip Code / Area code must contain only alphanumeric, numeric characters and hyphens (-)',
              },
            ],
          }),
        ],
      },
    ],
    [
      statusOptions,
      country,
      profile,
      role,
      disableFields,
      states,
      orgNames,
      stateLoading,
      city,
      cityLoading,
      disabledStatus,
      isConsultantFirm,
      org_id,
    ]
  );
};

import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
  createPhoneInputField,
  createSelectField,
  createTextField,
  REGEX_PATTERNS,
  STATUS_OPTIONS,
} from '../../../../common-utils';

export const FormData = (
  country: SelectOption[],
  profile: SelectOption[],
  role: SelectOption[],
  states: SelectOption[],
  city: SelectOption[],
  disableFields?: boolean,
  stateLoading?: boolean,
  cityLoading?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Identity',
        fillType: 'half',
        fields: [
          createTextField('first_name', 'First Name', {
            required: true,
            regex: REGEX_PATTERNS.NAME_REGEX,
            regexErrorMessage:
              "First name must contain only letters, apostrophes (') and hyphens (-)",
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
            ],
          }),
          createTextField('last_name', 'Last Name', {
            required: true,
            regex: REGEX_PATTERNS.NAME_REGEX,
            placeholder: 'Enter Last Name',
            regexErrorMessage:
              "First name must contain only letters, apostrophes (') and hyphens (-)",
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Last name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Max length exceeded',
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
            options: STATUS_OPTIONS,
            placeholder: 'Choose Status',
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
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Choose Country',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
          }),
          createSelectField('state', 'Region', {
            options: states,
            placeholder: 'Choose Region',
            required: false,
            onChange: true,
            isLoading: stateLoading,
          }),
          createSelectField('city', 'City', {
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
                regex: REGEX_PATTERNS.POSTAL_CODE,
                errorMessage: 'Zip Code / Area code must contain only alphanumeric characters and hyphens (-)',
              },
            ],
          }),
        ],
      },
    ],
    [
      country,
      profile,
      role,
      disableFields,
      states,
      stateLoading,
      city,
      cityLoading,
    ]
  );
};

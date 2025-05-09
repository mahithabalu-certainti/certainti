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
          createTextField('first_name', 'First name', {
            required: true,
            regex: REGEX_PATTERNS.NAME_REGEX,
            regexErrorMessage:
              "First name must contain only letters, spaces, apostrophes (') or hyphens (-).",
            placeholder: 'Enter First name',
            lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_NAME_REGEX,
              minErrorMessage: 'Name must be more than 2 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_NAME_REGEX,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createTextField('last_name', 'Last name', {
            required: true,
            regex: REGEX_PATTERNS.NAME_REGEX,
            placeholder: 'Enter Last name',
            regexErrorMessage:
              "Last name must contain only letters, spaces, apostrophes (') or hyphens (-).",
            lengthRequired: {
              key: 'name_length',
              minMatchedValue: REGEX_PATTERNS.MIN_NAME_REGEX,
              minErrorMessage: 'Name must be more than 2 characters long',
              maxMatchedValue: REGEX_PATTERNS.MAX_NAME_REGEX,
              maxErrorMessage: 'Max length exceeded',
            },
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
            placeholder: 'Select Profile',
          }),
          createSelectField('role_rid', 'Role', {
            options: role,
            placeholder: 'Select Role',
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
              'Street must contain only letters and spaces, and be 3 to 200 characters long.',
            placeholder: 'Enter Street',
          }),
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Select Country',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
          }),
          createSelectField('state', 'Region', {
            options: states,
            placeholder: 'Select Region',
            required: false,
            onChange: true,
            isLoading: stateLoading,
          }),
          createSelectField('city', 'City', {
            options: city,
            placeholder: 'Select City',
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
                errorMessage: 'Invalid postal code / zip code',
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

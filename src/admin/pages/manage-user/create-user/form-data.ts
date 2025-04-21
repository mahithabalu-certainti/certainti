import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
  createPhoneInputField,
  createRadioField,
  createSelectField,
  createTextField,
  REGEX_PATTERNS,
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
        sectionName: 'Basic Information',
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
          createTextField('street', 'Street', {
            required: false,
            regex: REGEX_PATTERNS.STREET_REGEX,
            regexErrorMessage:
              'Street must contain only letters and spaces, and be 3 to 200 characters long.',
            placeholder: 'Enter Street',
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
            regex: REGEX_PATTERNS.EMAIL,
            placeholder: 'Enter Email Address',
            regexErrorMessage: 'Invalid email address',
            disabled: disableFields,
            lengthRequired: {
              key: 'email_length',
              minMatchedValue: REGEX_PATTERNS.EMAIL,
              minErrorMessage: 'Invalid email address',
              maxMatchedValue: REGEX_PATTERNS.MAX_EMAIL_REGEX,
              maxErrorMessage: 'Max length exceeded',
            },
          }),
          createSelectField('profile_rid', 'Profile', {
            options: profile,
            required: true,
            placeholder: 'Select Profile',
          }),
          createTextField('zip_code', 'Zip/Postal code', {
            required: false,
            regex: REGEX_PATTERNS.POSTAL_CODE,
            regexErrorMessage: 'Invalid postal code / zip code',
            placeholder: 'Enter Zip/Postal code',
          }),
          createPhoneInputField('phone', 'Phone Number', {
            required: false,
            placeholder: 'Enter Phone Number',
          }),
          createSelectField('role_rid', 'Role', {
            options: role,
            placeholder: 'Select Role',
            required: true,
          }),
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Select Country',
            required: true,
            onChange: true,
            resetDependsFields: ['state, city'],
          }),
          createSelectField('state', 'State/Province', {
            options: states,
            placeholder: 'Select State',
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
          createRadioField('status', 'Status', {
            required: true,
            radioOptions: [
              { label: 'Active', value: 'active' },
              { label: 'In-active', value: 'inactive' },
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

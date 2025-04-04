import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
  createRadioField,
  createSelectField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';

export const FormData = (
  country: SelectOption[],
  profile: SelectOption[],
  role: SelectOption[],
  disableFields?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('first_name', 'First name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            regexErrorMessage: 'First name must be alphabets',
            placeholder: 'Enter First name',
          }),
          createTextField('street', 'Street', {
            required: true,
            placeholder: 'Enter Street',
          }),
          createTextField('last_name', 'Last name', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            placeholder: 'Enter Last name',
            regexErrorMessage: 'Last name must be alphabets',
          }),
          createTextField('city', 'City', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            placeholder: 'Enter City',
            regexErrorMessage: 'City must be alphabets',
          }),
          createTextField('email', 'Email Address', {
            required: true,
            regex: REGEX_PATTERNS.EMAIL,
            placeholder: 'Enter Email Address',
            regexErrorMessage: 'Enter a valid email address',
            disabled: disableFields,
          }),
          createTextField('state', 'State/Province', {
            required: true,
            regex: REGEX_PATTERNS.LETTERS_SPACES,
            placeholder: 'Enter State/Province',
            regexErrorMessage: 'State must be alphabets',
          }),
          createSelectField('profile_rid', 'Profile', {
            options: profile,
            required: true,
            placeholder: 'Enter Profile',
          }),
          createTextField('zip_code', 'Zip/Postal code', {
            required: true,
            regex: REGEX_PATTERNS.POSTAL_CODE,
            regexErrorMessage:
              'Enter a valid postal code (e.g., 12345 or 12345-6789)',
            placeholder: 'Enter Zip/Postal code',
          }),
          createSelectField('role_rid', 'Role', {
            options: role,
            placeholder: 'Enter Role',
            required: true,
          }),
          createSelectField('country', 'Country', {
            options: country,
            placeholder: 'Enter Country',
            required: true,
          }),
          createRadioField('status', 'Active', {
            required: true,
            radioOptions: [
              { label: 'Active', value: 'active' },
              { label: 'In-active', value: 'inactive' },
            ],
          }),
        ],
      },
    ],
    [country, profile, role, disableFields]
  );
};

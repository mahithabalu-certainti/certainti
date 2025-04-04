import { FormType } from '../../../../consultant/types';

export const formData: FormType[] = [
  {
    sectionName: 'Basic Information',
    fillType: 'half',
    fields: [
      {
        type: 'text',
        name: 'first_name',
        label: 'First name',
        required: true,
        regex: /^[A-Za-z\s]+$/,
        regexErrorMessage: 'First name must be alphabets',
      },
      {
        type: 'text',
        name: 'street',
        label: 'Street',
        required: true,
      },
      {
        type: 'text',
        name: 'last_name',
        label: 'Last name',
        required: true,
        regex: /^[A-Za-z\s]+$/,
        regexErrorMessage: 'Last name must be alphabets',
      },
      {
        type: 'text',
        name: 'city',
        label: 'City',
        required: true,
        regex: /^[A-Za-z\s]+$/,
        regexErrorMessage: 'City must be alphabets',
      },
      {
        type: 'text',
        name: 'email',
        label: 'Email Address',
        required: true,
        regex: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
        regexErrorMessage: 'Enter a valid email address',
      },
      {
        type: 'text',
        name: 'state',
        label: 'State/Province',
        required: true,
        regex: /^[A-Za-z\s]+$/,
        regexErrorMessage: 'State must be alphabets',
      },
      {
        type: 'select',
        name: 'profile_rid',
        label: 'Profile',
        required: true,
      },
      {
        type: 'text',
        name: 'zip_code',
        label: 'Zip/Postal code',
        required: true,
        regex: /^\d{5}(-\d{4})?$/,
        regexErrorMessage:
          'Enter a valid postal code (e.g., 12345 or 12345-6789)',
      },
      {
        type: 'select',
        name: 'role_rid',
        label: 'Role',
        required: true,
      },
      {
        type: 'select',
        name: 'country',
        label: 'Country',
        required: true,
      },
      {
        type: 'radio',
        name: 'status',
        label: 'Active',
        required: true,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'In-active', value: 'inactive' },
        ],
      },
    ],
  },
];

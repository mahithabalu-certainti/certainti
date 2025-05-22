import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
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
        sectionName: 'Create Profile',
        fillType: 'half',
        fields: [ 
          createSelectField('existing_profile', 'Select an Existing Profile', {
            options: country,
            placeholder: '-Select-',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
          }),
          createTextField('profile_name', 'Profile Name', {
            required: false,
            regex: REGEX_PATTERNS.STREET_REGEX,
            regexErrorMessage:
              'Street must contain only alphanumeric characters, spaces, commas, periods, hyphens and hash',
            placeholder: 'Type',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Max length exceeded',
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

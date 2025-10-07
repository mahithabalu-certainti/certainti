import { useMemo } from 'react';

import { FormType } from '../../../types';
import {
  createSelectField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import { fiscalYears } from '../../resource-form/form-data';

export const FormData = (
  isEditView?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('case_id', 'Case ID', {
            required: true,
            placeholder: 'Enter Case ID',
            // disabled:
            //   isEditView &&
            //   permissionMap?.['first_name']?.read &&
            //   !permissionMap?.['first_name']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['first_name']?.read &&
            //   !permissionMap?.['first_name']?.edit,
            errorHandling: [
              // {
              //   regex: REGEX_PATTERNS.MIN_3,
              //   errorMessage: 'First name must be more than 2 characters long',
              // },
              // {
              //   regex: REGEX_PATTERNS.MAX_64,
              //   errorMessage: 'Max length exceeded',
              // },
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
          createTextField('case_name', 'Case Name', {
            required: true,
            placeholder: 'Enter Case Name',
            // disabled:
            //   isEditView &&
            //   permissionMap?.['last_name']?.read &&
            //   !permissionMap?.['last_name']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['last_name']?.read &&
            //   !permissionMap?.['last_name']?.edit,
            errorHandling: [
              // {
              //   regex: REGEX_PATTERNS.MIN_3,
              //   errorMessage: 'Last name must be more than 2 characters long',
              // },
              // {
              //   regex: REGEX_PATTERNS.MAX_64,
              //   errorMessage: 'Max length exceeded',
              // },
              // {
              //   regex: REGEX_PATTERNS.NAME_REGEX,
              //   errorMessage:
              //     "Last name must contain only letters, space( ), apostrophes(') and hyphens(-).",
              // },
            ],
          }),
          createTextField('email', 'Email Address', {
            required: true,
            placeholder: 'Enter Email Address',
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['email']?.read &&
              !permissionMap?.['email']?.edit,
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
          createTextField('case_id', 'Case Number', {
            required: true,
            placeholder: 'Enter Case Number',
            // disabled:
            //   isEditView &&
            //   permissionMap?.['first_name']?.read &&
            //   !permissionMap?.['first_name']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['first_name']?.read &&
            //   !permissionMap?.['first_name']?.edit,
            errorHandling: [
              // {
              //   regex: REGEX_PATTERNS.MIN_3,
              //   errorMessage: 'First name must be more than 2 characters long',
              // },
              // {
              //   regex: REGEX_PATTERNS.MAX_64,
              //   errorMessage: 'Max length exceeded',
              // },
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
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
            isFiscalYear: true,
            // disabled:
            //   isEditView &&
            //   permissionMap?.['fiscal_year']?.read &&
            //   !permissionMap?.['fiscal_year']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['fiscal_year']?.read &&
            //   !permissionMap?.['fiscal_year']?.edit,
          }),
        ],
      },
    ],
    [isEditView, permissionMap]
  );
};

import { useMemo } from 'react';

import { FormType, SelectOption } from '../../../types';
import {
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import { fiscalYears } from '../../resource-form/form-data';

export const FormData = (
  isEditView?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  resourceTypeOptions?: SelectOption[],
  country?: SelectOption[],
  states?: SelectOption[],
  stateLoading?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createSelectField('cases_type', 'Case Type', {
            options: resourceTypeOptions || [],
            placeholder: 'Choose Case Type',
            required: true,
            // disabled:
            //   isEditView &&
            //   resourcePermissionMap?.['resource_type_rid']?.read &&
            //   !resourcePermissionMap?.['resource_type_rid']?.edit,
            // hide:
            //   isEditView &&
            //   !resourcePermissionMap?.['resource_type_rid']?.read &&
            //   !resourcePermissionMap?.['resource_type_rid']?.edit,
            // onChange: true,
            // resetDependsFields: ['resource_orgname'],
          }),
          createTextField('case_name', 'Case Name', {
            required: false,
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
          createSelectField('owner', 'Owner', {
            options: resourceTypeOptions || [],
            placeholder: 'Choose Owner',
            required: true,
            // disabled:
            //   isEditView &&
            //   resourcePermissionMap?.['resource_type_rid']?.read &&
            //   !resourcePermissionMap?.['resource_type_rid']?.edit,
            // hide:
            //   isEditView &&
            //   !resourcePermissionMap?.['resource_type_rid']?.read &&
            //   !resourcePermissionMap?.['resource_type_rid']?.edit,
            // onChange: true,
            // resetDependsFields: ['resource_orgname'],
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
          createSelectField('country', 'Country', {
            options: country || [],
            placeholder: 'Choose Country',
            required: false,
            onChange: true,
            resetDependsFields: ['state, city'],
            // disabled:
            //   isEditView &&
            //   resourcePermissionMap?.['country_rid']?.read &&
            //   !resourcePermissionMap?.['country_rid']?.edit,
            // hide:
            //   isEditView &&
            //   !resourcePermissionMap?.['country_rid']?.read &&
            //   !resourcePermissionMap?.['country_rid']?.edit,
          }),
          createSelectField('state', 'Region', {
            options: states || [],
            placeholder: 'Choose Region',
            required: false,
            onChange: true,
            isLoading: stateLoading,
            resetDependsFields: ['city'],
            // disabled:
            //   isEditView &&
            //   resourcePermissionMap?.['region_rid']?.read &&
            //   !resourcePermissionMap?.['region_rid']?.edit,
            // hide:
            //   isEditView &&
            //   !resourcePermissionMap?.['region_rid']?.read &&
            //   !resourcePermissionMap?.['region_rid']?.edit,
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('description', 'Description', {
            required: false,
            placeholder: 'Enter Description',
            regexErrorMessage: 'Maximum 2000 characters allowed',
            regex: REGEX_PATTERNS.DESCRIPTION,
            disabled:
              isEditView &&
              permissionMap?.['description']?.read &&
              !permissionMap?.['description']?.edit,
            hide:
              isEditView &&
              !permissionMap?.['description']?.read &&
              !permissionMap?.['description']?.edit,
          }),
        ],
      },
    ],
    [
      country,
      isEditView,
      permissionMap,
      resourceTypeOptions,
      stateLoading,
      states,
    ]
  );
};

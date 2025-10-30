import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../types';
import {
  createSelectField,
  createTextField,
  createTextAreaField,
  REGEX_PATTERNS,
  createDateField,
  createEmptyField,
} from '../../../../common-utils';
import { fiscalYears } from '../../resource-form/form-data';

const currentDate = new Date();

export const CaseFormData = (
  isEditView?: boolean,
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  filingTypeOptions?: SelectOption[],
  ownerOptions?: SelectOption[],
  countryOptions?: SelectOption[]
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('account_name', 'Account Name', {
            required: false,
            disabled: true,
            placeholder: 'Enter Account Name',
          }),
          createTextField('account_id', 'Account ID', {
            required: false,
            disabled: true,
            placeholder: 'Enter Account ID',
          }),
        ],
      },
      {
        sectionName: 'Case Information',
        fillType: 'half',
        fields: [
          createSelectField('filing_type', 'Filing Type', {
            options: filingTypeOptions || [],
            placeholder: 'Choose Filing Type',
            required: true,
          }),
          createTextField('case_name', 'Case Name', {
            required: true,
            placeholder: 'Enter Case Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Case Name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_255,
                errorMessage: 'Case Name must be within 255 characters',
              },
            ],
          }),
          createSelectField('case_owner', 'Case Owner', {
            options: ownerOptions || [],
            placeholder: 'Choose Case Owner',
            required: true,
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            isFiscalYear: true,
          }),
          createSelectField('country', 'Country', {
            options: countryOptions || [],
            placeholder: 'Choose Country',
            required: true,
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createDateField('case_startdate', 'Start Date', {
            required: true,
            maxDate: currentDate,
            disableFutureDates: true,
          }),
          createDateField(
            'planned_submission_date',
            'Planned Submission Date',
            {
              required: true,
              maxDate: currentDate,
              disableFutureDates: true,
            }
          ),
          createDateField(
            'statutory_submission_date',
            'Statutory Submission Date',
            {
              required: true,
              maxDate: currentDate,
              disableFutureDates: true,
            }
          ),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('description', 'Description', {
            required: false,
            placeholder: 'Enter Description',
            regexErrorMessage: 'Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
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
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
          }),
          createTextField('case_id', 'Case ID', {
            required: false,
            disabled: true,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
          }),
        ],
      },
    ],
    [isEditView, filingTypeOptions, ownerOptions, countryOptions]
  );
};

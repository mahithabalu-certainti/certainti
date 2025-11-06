import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../types';
import {
  createSelectField,
  createTextField,
  createTextAreaField,
  REGEX_PATTERNS,
  createDateField,
  createEmptyField,
  getFiscalYears,
} from '../../../../common-utils';

const currentDate = new Date();
const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const CaseFormData = (
  isEditView?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  filingTypeOptions?: SelectOption[],
  ownerOptions?: SelectOption[],
  countryOptions?: SelectOption[],
  dateConstraints?: {
    planned_min: string;
    planned_max: string;
    statutory_min: string;
    statutory_max: string;
  },
  caseNamePrefix?: string
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
            disabled:
              isEditView &&
              !permissionMap?.['filing_type_rid']?.edit &&
              permissionMap?.['filing_type_rid']?.read,
            hide:
              isEditView &&
              !permissionMap?.['filing_type_rid']?.edit &&
              !permissionMap?.['filing_type_rid']?.read,
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
            isFiscalYear: true,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['fiscal_year']?.edit &&
              !permissionMap?.['fiscal_year']?.read,
          }),
          createTextField('case_name', 'Case Name', {
            required: true,
            placeholder: 'Enter Case Name',
            prefixValue: caseNamePrefix,
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
            disabled:
              isEditView &&
              !permissionMap?.['case_name']?.edit &&
              permissionMap?.['case_name']?.read,
            hide:
              isEditView &&
              !permissionMap?.['case_name']?.edit &&
              !permissionMap?.['case_name']?.read,
          }),
          createSelectField('case_owner', 'Case Owner', {
            options: ownerOptions || [],
            placeholder: 'Choose Case Owner',
            required: true,
            disabled:
              isEditView &&
              !permissionMap?.['case_owner_rid']?.edit &&
              permissionMap?.['case_owner_rid']?.read,
            hide:
              isEditView &&
              !permissionMap?.['case_owner_rid']?.edit &&
              !permissionMap?.['case_owner_rid']?.read,
          }),
          createSelectField('country', 'Country', {
            options: countryOptions || [],
            placeholder: 'Choose Country',
            required: true,
            disabled: true,
            hide:
              isEditView &&
              !accountPermissionMap?.['currency_rid']?.read &&
              !accountPermissionMap?.['currency_rid']?.edit,
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
          }),
          createDateField('case_startdate', 'Start Date', {
            required: true,
            onChange: true,
            maxDate: currentDate,
            disableFutureDates: true,
            disabled:
              isEditView &&
              !permissionMap?.['start_date']?.edit &&
              permissionMap?.['start_date']?.read,
            hide:
              isEditView &&
              !permissionMap?.['start_date']?.edit &&
              !permissionMap?.['start_date']?.read,
          }),
          createDateField(
            'planned_submission_date',
            'Planned Submission Date',
            {
              required: true,
              disableFutureDates: true,
              onChange: true,
              minDate: dateConstraints?.planned_min
                ? new Date(dateConstraints.planned_min)
                : undefined,
              maxDate: dateConstraints?.planned_max
                ? new Date(dateConstraints.planned_max)
                : currentDate,
              disabled:
                isEditView &&
                !permissionMap?.['planned_submission_date']?.edit &&
                permissionMap?.['planned_submission_date']?.read,
              hide:
                isEditView &&
                !permissionMap?.['planned_submission_date']?.edit &&
                !permissionMap?.['planned_submission_date']?.read,
            }
          ),
          createDateField(
            'statutory_submission_date',
            'Statutory Submission Date',
            {
              required: true,
              onChange: true,
              disableFutureDates: true,
              minDate: dateConstraints?.statutory_min
                ? new Date(dateConstraints.statutory_min)
                : undefined,
              maxDate: dateConstraints?.statutory_max
                ? new Date(dateConstraints.statutory_max)
                : currentDate,
              disabled:
                isEditView &&
                !permissionMap?.['statutory_submission_date']?.edit &&
                permissionMap?.['statutory_submission_date']?.read,
              hide:
                isEditView &&
                !permissionMap?.['statutory_submission_date']?.edit &&
                !permissionMap?.['statutory_submission_date']?.read,
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
            disabled:
              isEditView &&
              !permissionMap?.['case_description']?.edit &&
              permissionMap?.['case_description']?.read,
            hide:
              isEditView &&
              !permissionMap?.['case_description']?.edit &&
              !permissionMap?.['case_description']?.read,
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
            hide:
              isEditView &&
              !permissionMap?.['rid']?.edit &&
              !permissionMap?.['rid']?.read,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_datetime']?.edit &&
              !permissionMap?.['created_datetime']?.read,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_by']?.edit &&
              !permissionMap?.['created_by']?.read,
          }),
          createTextField('case_id', 'Case ID', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['r_number']?.edit &&
              !permissionMap?.['r_number']?.read,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_datetime']?.edit &&
              !permissionMap?.['modified_datetime']?.read,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_by']?.edit &&
              !permissionMap?.['modified_by']?.read,
          }),
        ],
      },
    ],
    [
      filingTypeOptions,
      isEditView,
      permissionMap,
      accountPermissionMap,
      ownerOptions,
      countryOptions,
      dateConstraints,
      caseNamePrefix,
    ]
  );
};

import { useMemo } from 'react';
import {
  FinancialWorkingCountries,
  FormType,
  ParentChildSelectOption,
  SelectOption,
} from '../../../types';
import {
  createSelectField,
  createTextField,
  createTextAreaField,
  REGEX_PATTERNS,
  createDateField,
  getFiscalYears,
  createSelectChildField,
  createEmptyField,
} from '../../../../common-utils';

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const CaseFormData = (
  isEditView?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  filingTypeOptions?: SelectOption[],
  ownerOptions?: SelectOption[],
  parentCaseOptions?: SelectOption[],
  countryOptions?: SelectOption[],
  accountList?: ParentChildSelectOption[],
  dateConstraints?: {
    planned_min: string;
    planned_max: string;
    statutory_min: string;
    statutory_max: string;
    start_date_max: string;
    start_date_min: string;
  },
  caseNamePrefix?: string,
  selectedCountryRid?: string,
  selectedAccountNumber?: string,
  selectedFiscalYear?: string,
  globalType?: boolean,
  calculatedStatutoryDate?: string,
  statusOptions?: SelectOption[],
  isAustralianCountry?: boolean,
  CountryName?: string,
  isAmendmentType?: boolean,
  isParentCaseLoading?: boolean,
  isCaseClosed?: boolean,
  hasParentCase?: boolean,
  parentCaseFiscalYear?: string
): FormType[] => {
  const isCreateAndAmendmentType = !isEditView && isAmendmentType;
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createSelectChildField('account_rid', 'Account Name', {
            expandOptions: accountList || [],
            placeholder: 'Choose Account Name',
            required: true,
            onChange: true,
            hide: !globalType,
            expandedAll: true,
            disabled: isEditView || isCaseClosed,
            resetDependsFields: ['parent_case_rid'],
          }),
          createTextField('account_name', 'Account Name', {
            required: false,
            disabled: true,
            hide: globalType,
            placeholder: 'Enter Account Name',
          }),
          createTextField('account_id', 'Account ID', {
            required: false,
            disabled: true,
            placeholder: 'Enter Account ID',
            defaultValue: selectedAccountNumber,
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
            onChange: true,
            disabled: isEditView || isCaseClosed,
            hide:
              isEditView &&
              !permissionMap?.['filing_type_rid']?.edit &&
              !permissionMap?.['filing_type_rid']?.read,
            resetDependsFields: ['parent_case_rid'],
          }),
          createSelectField('parent_case_rid', 'Parent Case', {
            options: parentCaseOptions || [],
            placeholder: 'Choose Parent Case',
            required: false,
            hide:
              !isAmendmentType ||
              (isEditView &&
                !permissionMap?.['parent_case_rid']?.edit &&
                !permissionMap?.['parent_case_rid']?.read),
            disabled: isEditView || isCaseClosed,
            isLoading: isParentCaseLoading,
            onChange: true,
            resetDependsFields: [
              'heat_light_power',
              'total_nonlabor_cost',
              'tax_liability',
              'employers_pension_contribution',
              'material_software_cost',
              'sub_contracts',
              'cloud_software',
              'unpaid_amounts_paid',
              'unpaid_amounts',
              'aggregated_turnover',
              'total_expenses',
              'taxable_income',
              'export_sales_revenue',
              'lease_costs_of_computers',
              'illinois_rd_credit_partnership_corp',
              'illinois_research_payments_corp_only',
              'basic_research_payments',
              'qualified_computer_rental_time_expenses',
              'current_year_gross_receipts',
              'credit_carry_forward_py',
              'other_credits_total',
              'other',
              'description',
            ],
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            onChange: true,
            isFiscalYear: true,
            defaultValue: parentCaseFiscalYear,
            assignDefaultValue:
              !!parentCaseFiscalYear && isCreateAndAmendmentType,
            disabled: isEditView || isCaseClosed || hasParentCase,
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
              isCaseClosed ||
              (isEditView &&
                !permissionMap?.['case_name']?.edit &&
                permissionMap?.['case_name']?.read),
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
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['case_owner_rid']?.edit &&
                permissionMap?.['case_owner_rid']?.read),
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
            defaultValue: selectedCountryRid,
            assignDefaultValue: globalType,
            requiredErrorMessage:
              'Field is required. Please select a country at the account level.',
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
            hide: isEditView || isAmendmentType,
          }),
          createSelectField('status_rid', 'Status', {
            options: statusOptions || [],
            placeholder: 'Choose Status',
            required: true,
            hide: !isEditView,
            disabled: isCaseClosed,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['status_rid']?.edit &&
            //   permissionMap?.['status_rid']?.read,
          }),

          createDateField('case_startdate', 'Planned Start Date', {
            required: true,
            onChange: true,
            allowFutureDates: true,
            customDateOpen: selectedFiscalYear
              ? new Date(`${Number(selectedFiscalYear) - 1}-04-01`)
              : undefined,
            maxDate: dateConstraints?.start_date_max
              ? new Date(dateConstraints.start_date_max)
              : undefined,
            disableDatesBefore: dateConstraints?.start_date_min
              ? new Date(dateConstraints.start_date_min)
              : undefined,
            disabled:
              isCaseClosed ||
              (isEditView &&
                !permissionMap?.['start_date']?.edit &&
                permissionMap?.['start_date']?.read),
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
              onChange: true,
              allowFutureDates: true,
              customDateOpen: selectedFiscalYear
                ? new Date(`${selectedFiscalYear}-04-01`)
                : undefined,
              disableDatesBefore: dateConstraints?.planned_min
                ? new Date(dateConstraints.planned_min)
                : undefined,
              maxDate: dateConstraints?.planned_max
                ? new Date(dateConstraints.planned_max)
                : undefined,
              disabled:
                isCaseClosed ||
                (isEditView &&
                  !permissionMap?.['planned_submission_date']?.edit &&
                  permissionMap?.['planned_submission_date']?.read),
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
              allowFutureDates: true,
              customDateOpen: selectedFiscalYear
                ? new Date(`${selectedFiscalYear}-04-01`)
                : undefined,
              minDate: dateConstraints?.statutory_min
                ? new Date(dateConstraints.statutory_min)
                : undefined,
              maxDate: dateConstraints?.statutory_max
                ? new Date(dateConstraints.statutory_max)
                : undefined,
              disabled: true,
              hide:
                isEditView &&
                !permissionMap?.['statutory_submission_date']?.edit &&
                !permissionMap?.['statutory_submission_date']?.read,
              defaultValue: calculatedStatutoryDate,
              assignDefaultValue: !isEditView || !!calculatedStatutoryDate,
              requiredErrorMessage:
                'Field is required. Please add statutory submission date in the platform level configuration.',
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Statutory Submission Date: Please add statutory submission date in the platform level configuration.',
              },
            }
          ),
        ],
      },
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        // hide: !isEditView,
        fields: [
          createTextField('heat_light_power', 'Heating & Lighting Cost', {
            required: false,
            placeholder: 'Enter Heating & Lighting Cost',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Heating & Lighting Cost.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['heat_light_power']?.edit &&
                permissionMap?.['heat_light_power']?.read),
            hide:
              ![
                FinancialWorkingCountries.Ireland,
                FinancialWorkingCountries.UK,
              ].includes(CountryName as FinancialWorkingCountries) ||
              (isEditView &&
                !permissionMap?.['heat_light_power']?.edit &&
                !permissionMap?.['heat_light_power']?.read),
          }),
          createTextField('tax_liability_ct', 'Tax Liability CT', {
            required: false,
            placeholder: 'Enter Tax Liability CT',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Tax Liability Due To Connecticut.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.US ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                !permissionMap?.['tax_liability']?.read),
          }),
          createTextField('tax_liability_ga', 'Tax Liability GA', {
            required: false,
            placeholder: 'Enter Tax Liability GA',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Tax Liability Due To Georgia.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.US ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                !permissionMap?.['tax_liability']?.read),
          }),
          createTextField('tax_liability_sc', 'Tax Liability SC', {
            required: false,
            placeholder: 'Enter Tax Liability SC',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Tax Liability Due To South Carolina',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.US ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                !permissionMap?.['tax_liability']?.read),
          }),
          createTextField(
            'employers_pension_contribution',
            'Employers Pension Contribution',
            {
              required: false,
              placeholder: 'Enter Employers Pension Contribution',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Actual Employer Pension Contribution Due.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['employers_pension_contribution']?.edit &&
                  permissionMap?.['employers_pension_contribution']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.Australia ||
                (isEditView &&
                  !permissionMap?.['employers_pension_contribution']?.edit &&
                  !permissionMap?.['employers_pension_contribution']?.read),
            }
          ),
          createTextField(
            'material_software_cost',
            'Material & Software Cost',
            {
              required: false,
              placeholder: 'Enter Material & Software Cost',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Actual Material & Software Cost Due.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['material_software_cost']?.edit &&
                  permissionMap?.['material_software_cost']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.UK ||
                (isEditView &&
                  !permissionMap?.['material_software_cost']?.edit &&
                  !permissionMap?.['material_software_cost']?.read),
            }
          ),
          createTextField('sub_contracts', 'Subcontracts', {
            required: false,
            placeholder: 'Enter Subcontracts',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Subcontracts Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['sub_contracts']?.edit &&
                permissionMap?.['sub_contracts']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.UK ||
              (isEditView &&
                !permissionMap?.['sub_contracts']?.edit &&
                !permissionMap?.['sub_contracts']?.read),
          }),
          createTextField('cloud_software', 'Cloud Software', {
            required: false,
            placeholder: 'Enter Cloud Software',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Cloud Software Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['cloud_software']?.edit &&
                permissionMap?.['cloud_software']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Ireland ||
              (isEditView &&
                !permissionMap?.['cloud_software']?.edit &&
                !permissionMap?.['cloud_software']?.read),
          }),
          createTextField('unpaid_amounts_paid', 'Unpaid Amounts (+)', {
            required: false,
            placeholder: 'Enter Unpaid Amounts (+)',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Unpaid Amounts Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['unpaid_amounts_paid']?.edit &&
                permissionMap?.['unpaid_amounts_paid']?.read),
            hide:
              ![FinancialWorkingCountries.Ireland].includes(
                CountryName as FinancialWorkingCountries
              ) ||
              (isEditView &&
                !permissionMap?.['unpaid_amounts_paid']?.edit &&
                !permissionMap?.['unpaid_amounts_paid']?.read),
          }),
          createTextField('unpaid_amounts', 'Unpaid Amounts (-)', {
            required: false,
            placeholder: 'Enter Unpaid Amounts (-)',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Unpaid Amounts Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['unpaid_amounts']?.edit &&
                permissionMap?.['unpaid_amounts']?.read),
            hide:
              ![FinancialWorkingCountries.Ireland].includes(
                CountryName as FinancialWorkingCountries
              ) ||
              (isEditView &&
                !permissionMap?.['unpaid_amounts']?.edit &&
                !permissionMap?.['unpaid_amounts']?.read),
          }),
          createTextField('aggregated_turnover', 'Aggregated Turnover', {
            required: false,
            placeholder: 'Enter Aggregated Turnover',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Aggregated Turnover Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['aggregated_turnover']?.edit &&
                permissionMap?.['aggregated_turnover']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Australia ||
              (isEditView &&
                !permissionMap?.['aggregated_turnover']?.edit &&
                !permissionMap?.['aggregated_turnover']?.read),
          }),
          createTextField('total_expenses', 'Total Expenses', {
            required: isAustralianCountry,
            placeholder: 'Enter Total Expenses',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Total Expenses Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['total_expenses']?.edit &&
                permissionMap?.['total_expenses']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Australia ||
              (isEditView &&
                !permissionMap?.['total_expenses']?.edit &&
                !permissionMap?.['total_expenses']?.read),
          }),
          createTextField('taxable_income', 'Taxable Income', {
            required: false,
            placeholder: 'Enter Taxable Income',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Taxable Income Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['taxable_income']?.edit &&
                permissionMap?.['taxable_income']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Australia ||
              (isEditView &&
                !permissionMap?.['taxable_income']?.edit &&
                !permissionMap?.['taxable_income']?.read),
          }),
          createTextField('export_sales_revenue', 'Export Sales Revenue', {
            required: false,
            placeholder: 'Enter Export Sales Revenue',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Export Sales Revenue Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['export_sales_revenue']?.edit &&
                permissionMap?.['export_sales_revenue']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Australia ||
              (isEditView &&
                !permissionMap?.['export_sales_revenue']?.edit &&
                !permissionMap?.['export_sales_revenue']?.read),
          }),
          createTextField(
            'lease_costs_of_computers_az',
            'Lease Costs of Computers AZ',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers AZ',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Lease Costs of Computers Due To Arizona.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  !permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'lease_costs_of_computers_ca',
            'Lease Costs of Computers CA',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers CA',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Lease Costs of Computers Due To California.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  !permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'lease_costs_of_computers_id',
            'Lease Costs of Computers ID',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers ID',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Actual Lease Costs of Computers Due To Idaho.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  !permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'lease_costs_of_computers_il',
            'Lease Costs of Computers IL',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers IL',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Lease Costs of Computers Due To Illinois.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  !permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'lease_costs_of_computers_nj',
            'Lease Costs of Computers NJ',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers NJ',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Lease Costs of Computers Due To New Jersey.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  !permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'illinois_rd_credit_partnership_corp',
            'Illinois RD Credit Partnership (Corp)',
            {
              required: false,
              placeholder: 'Enter Illinois RD Credit Partnership (Corp)',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Illinois RD Credit Partnership (Corp) Due.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['illinois_rd_credit_partnership_corp']
                    ?.edit &&
                  permissionMap?.['illinois_rd_credit_partnership_corp']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['illinois_rd_credit_partnership_corp']
                    ?.edit &&
                  !permissionMap?.['illinois_rd_credit_partnership_corp']
                    ?.read),
            }
          ),
          createTextField(
            'illinois_research_payments_corp_only',
            'Illinois Research Payments (Corp Only)',
            {
              required: false,
              placeholder: 'Enter Illinois Research Payments (Corp Only)',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Illinois Research Payments (Corp Only) Due.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['illinois_research_payments_corp_only']
                    ?.edit &&
                  permissionMap?.['illinois_research_payments_corp_only']
                    ?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['illinois_research_payments_corp_only']
                    ?.edit &&
                  !permissionMap?.['illinois_research_payments_corp_only']
                    ?.read),
            }
          ),
          createTextField(
            'basic_research_payments_id',
            'Basic Research Payments ID',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments ID',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Actual Basic Research Payments Due To Idaho.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  permissionMap?.['basic_research_payments']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  !permissionMap?.['basic_research_payments']?.read),
            }
          ),
          createTextField(
            'basic_research_payments_ma',
            'Basic Research Payments MA',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments MA',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Basic Research Payments Due.To Massachusetts.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  permissionMap?.['basic_research_payments']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  !permissionMap?.['basic_research_payments']?.read),
            }
          ),
          createTextField(
            'qualified_computer_rental_time_expenses',
            'Qualified Computer Rental Time Expenses',
            {
              required: false,
              placeholder: 'Enter Qualified Computer Rental Time Expenses',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Actual Qualified Computer Rental Time Expenses Due.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['qualified_computer_rental_time_expenses']
                    ?.edit &&
                  permissionMap?.['qualified_computer_rental_time_expenses']
                    ?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['qualified_computer_rental_time_expenses']
                    ?.edit &&
                  !permissionMap?.['qualified_computer_rental_time_expenses']
                    ?.read),
            }
          ),
          createTextField('current_year_gross_receipts', 'Gross Receipts', {
            required: false,
            placeholder: 'Enter Gross Receipts',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Gross Receipts.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['current_year_gross_receipts']?.edit &&
                permissionMap?.['current_year_gross_receipts']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.US ||
              (isEditView &&
                !permissionMap?.['current_year_gross_receipts']?.edit &&
                !permissionMap?.['current_year_gross_receipts']?.read),
          }),
          createTextField(
            'credit_carry_forward_py',
            'Credit Carry Forward PY',
            {
              required: false,
              placeholder: 'Enter Credit Carry Forward PY',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Actual Credit Carry Forward PY.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_carry_forward_py']?.edit &&
                  permissionMap?.['credit_carry_forward_py']?.read),
              hide:
                CountryName !== FinancialWorkingCountries.US ||
                (isEditView &&
                  !permissionMap?.['credit_carry_forward_py']?.edit &&
                  !permissionMap?.['credit_carry_forward_py']?.read),
            }
          ),
          createTextField('other_credits_total_ga', 'Other Credits Total GA', {
            required: false,
            placeholder: 'Enter Other Credits Total GA',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Other Credits Total Due To Georgia.',
            },
            regexErrorMessage:
              'Numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['other_credits_total']?.edit &&
                permissionMap?.['other_credits_total']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.US ||
              (isEditView &&
                !permissionMap?.['other_credits_total']?.edit &&
                !permissionMap?.['other_credits_total']?.read),
          }),
          createTextField('other_credits_total_sc', 'Other Credits Total SC', {
            required: false,
            placeholder: 'Enter Other Credits Total SC',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Actual Other Credits Total Due To South Carolina.',
            },
            regexErrorMessage:
              'Numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['other_credits_total']?.edit &&
                permissionMap?.['other_credits_total']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.US ||
              (isEditView &&
                !permissionMap?.['other_credits_total']?.edit &&
                !permissionMap?.['other_credits_total']?.read),
          }),
          createTextField('other_can', 'Other CAN', {
            required: false,
            placeholder: 'Enter Other CAN',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Other Due To Canada',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                permissionMap?.['other']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Canada ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                !permissionMap?.['other']?.read),
          }),
          createTextField('other_ont', 'Other ON', {
            required: false,
            placeholder: 'Enter Other ON',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Other Due To Ontario',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                permissionMap?.['other']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Canada ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                !permissionMap?.['other']?.read),
          }),
          createTextField('other_uk', 'Other', {
            required: false,
            placeholder: 'Enter Other',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Other Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                permissionMap?.['other']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.UK ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                !permissionMap?.['other']?.read),
          }),
          createTextField('other_irl', 'Other', {
            required: false,
            placeholder: 'Enter Other',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Actual Other Due.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                permissionMap?.['other']?.read),
            hide:
              CountryName !== FinancialWorkingCountries.Ireland ||
              (isEditView &&
                !permissionMap?.['other']?.edit &&
                !permissionMap?.['other']?.read),
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
            hide:
              ![
                FinancialWorkingCountries.Australia,
                FinancialWorkingCountries.UK,
              ].includes(CountryName as FinancialWorkingCountries) ||
              isEditView,
          }),
          createEmptyField('', '', {
            name: 'emptyData',
            label: '',
            type: '',
            required: false,
            hide:
              ![
                FinancialWorkingCountries.Canada,
                FinancialWorkingCountries.Australia,
                FinancialWorkingCountries.US,
              ].includes(CountryName as FinancialWorkingCountries) ||
              isEditView,
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
            regexErrorMessage: 'Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['case_description']?.edit &&
                permissionMap?.['case_description']?.read),
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
      parentCaseOptions,
      countryOptions,
      accountList,
      dateConstraints,
      caseNamePrefix,
      selectedCountryRid,
      selectedAccountNumber,
      selectedFiscalYear,
      globalType,
      calculatedStatutoryDate,
      isAustralianCountry,
      statusOptions,
      CountryName,
      isAmendmentType,
      isParentCaseLoading,
      isCaseClosed,
      isCreateAndAmendmentType,
      hasParentCase,
      parentCaseFiscalYear,
    ]
  );
};

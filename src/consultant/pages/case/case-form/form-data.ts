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

      // First Section - Financial Information (Non-US countries only)
      {
        sectionName: 'Financial Information',
        fillType: 'half',
        fields: [
          createTextField('heat_light_power', 'Heating & Lighting Cost', {
            required: false,
            placeholder: 'Enter Heating & Lighting Cost',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Total expenses incurred for heating, electricity, and lighting related to business operations.',
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
          createTextField(
            'employers_pension_contribution',
            'Employer Pension Contribution',
            {
              required: false,
              placeholder: 'Enter Employer Pension Contribution',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total pension contributions made by the employer on behalf of employees.',
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
                tooltipMessage:
                  'Total cost of materials and software used for operational or development activities.',
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
              tooltipMessage:
                'Payments made to subcontractors for services related to the project or business activities.',
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
              tooltipMessage:
                'Expenses incurred for cloud-based software services and platforms.',
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
              tooltipMessage:
                'Eligible unpaid expenses that are added back for calculation purposes.',
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
              tooltipMessage:
                'Unpaid expenses that are deducted based on applicable rules or adjustments.',
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
              tooltipMessage:
                'Combined turnover of the company and any associated or related entities.',
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
              tooltipMessage:
                'Total allowable business expenses recorded during the reporting period.',
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
              tooltipMessage:
                'Income subject to taxation after allowable deductions and adjustments.',
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
              tooltipMessage:
                'Revenue generated from sales made to customers outside the domestic market.',
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
          createTextField('other_uk', 'Other', {
            required: false,
            placeholder: 'Enter Other',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Any additional relevant income, expense, or adjustment not covered in other fields.',
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
              tooltipMessage:
                'Any additional relevant income, expense, or adjustment not covered in other fields.',
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

      // ── Accordion Sections (expand/collapse — one open at a time) ──
      // Canada (CA) - Federal Section
      {
        sectionName: 'Canada (CA) - Federal',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.Canada,
        fields: [
          createTextField('other_can', 'Other CAN', {
            required: false,
            placeholder: 'Enter Other CAN',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Any additional relevant income, expense, or adjustment not covered in other fields - Canada.',
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
        ],
      },

      // Canada (CA) - Alphabetical order starts here
      {
        sectionName: 'Ontario (ON)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.Canada,
        fields: [
          createTextField('other_on', 'Other ON', {
            required: false,
            placeholder: 'Enter Other ON',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Any additional relevant income, expense, or adjustment not covered in other fields - Ontario.',
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
        ],
      },
      // ── Accordion Sections (expand/collapse — one open at a time) ──
      // United States (US) - Federal Section

      // United States (US) - Federal Section
      {
        sectionName: 'United States (US) - Federal',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField('current_year_gross_receipts', 'Gross Receipts', {
            required: false,
            placeholder: 'Enter Gross Receipts',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Total gross receipts for the reporting period.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['current_year_gross_receipts']?.edit &&
                permissionMap?.['current_year_gross_receipts']?.read),
          }),
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
            }
          ),
        ],
      },

      // Arizona (AZ) - Alphabetical order starts here
      {
        sectionName: 'Arizona (AZ)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'lease_costs_of_computers_az',
            'Lease Costs of Computers - AZ',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers - AZ',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total lease expenses for computers used in Arizona.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
        ],
      },

      // California (CA)
      {
        sectionName: 'California (CA)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'lease_costs_of_computers_ca',
            'Lease Costs of Computers - CA',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers - CA',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total lease expenses for computers used in California.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
        ],
      },

      // Connecticut (CT)
      {
        sectionName: 'Connecticut (CT)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField('tax_liability_ct', 'Tax Liability - CT', {
            required: false,
            placeholder: 'Enter Tax Liability - CT',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Actual Connecticut tax liability for the current year.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
          }),
        ],
      },

      // District of Columbia (DC)
      {
        sectionName: 'District of Columbia (DC)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'basic_research_payments_dc',
            'Basic Research Payments',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified basic research payments made in District of Columbia.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  permissionMap?.['basic_research_payments']?.read),
            }
          ),
          createTextField(
            'energy_consortia_amount_dc',
            'Energy Consortia Amount',
            {
              required: false,
              placeholder: 'Enter Energy Consortia Amount',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Energy consortia Amount related expenses in District of Columbia.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['energy_consortia_amount']?.edit &&
                  permissionMap?.['energy_consortia_amount']?.read),
            }
          ),
          createTextField(
            'qualified_org_baseamount_dc',
            'Qualified Org Base Amount',
            {
              required: false,
              placeholder: 'Enter Qualified Org Base Amount',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified organization Base Amount in District of Columbia.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['qualified_org_baseamount']?.edit &&
                  permissionMap?.['qualified_org_baseamount']?.read),
            }
          ),
          createTextField(
            'lease_costs_of_computers_dc',
            'Lease Costs of Computers - DC',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers - DC',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Lease Costs of Computers - DC in District of Columbia.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
        ],
      },

      // Georgia (GA)
      {
        sectionName: 'Georgia (GA)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField('tax_liability_ga', 'Tax Liability - GA', {
            required: false,
            placeholder: 'Enter Tax Liability - GA',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Actual Georgia tax liability for the current year.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
          }),
          createTextField(
            'credit_carry_forward_py_ga',
            'Credit Carry Forward from PY - GA',
            {
              required: false,
              placeholder: 'Enter Credit Carry Forward from PY - GA',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'R&D credit carried forward from the previous year - Georgia',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_carry_forward_py']?.edit &&
                  permissionMap?.['credit_carry_forward_py']?.read),
            }
          ),
          createTextField(
            'other_credits_total_ga',
            'Other Credits Total - GA',
            {
              required: false,
              placeholder: 'Enter Other Credits Total - GA',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total additional Georgia credits applied against tax liability - Georgia.',
              },
              regexErrorMessage:
                'Numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['other_credits_total']?.edit &&
                  permissionMap?.['other_credits_total']?.read),
            }
          ),
        ],
      },

      // Idaho (ID)
      {
        sectionName: 'Idaho (ID)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'lease_costs_of_computers_id',
            'Lease Costs of Computers - ID',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers - ID',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total lease expenses for computers used in Idaho.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'basic_research_payments_id',
            'Basic Research Payments - ID',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments - ID',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified basic research payments made in Idaho.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  permissionMap?.['basic_research_payments']?.read),
            }
          ),
        ],
      },

      // Illinois (IL)
      {
        sectionName: 'Illinois (IL)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'lease_costs_of_computers_il',
            'Lease Costs of Computers - IL',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers - IL',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total lease expenses for computers used in Illinois.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
          createTextField(
            'illinois_rd_credit_partnership_corp',
            'Illinois RD Credit - Partnership (Corp)',
            {
              required: false,
              placeholder: 'Enter Illinois RD Credit - Partnership (Corp)',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'R&D credit received from Illinois partnerships applicable to corporations.',
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
                  'Qualified research payments made in Illinois (corporations only).',
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
            }
          ),
        ],
      },

      // Iowa (IA)
      {
        sectionName: 'Iowa (IA)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'basic_research_payments_ia',
            'Basic Research Payments',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified basic research payments made in Iowa.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments_ia']?.edit &&
                  permissionMap?.['basic_research_payments_ia']?.read),
            }
          ),
          createTextField(
            'qualified_org_baseamount_ia',
            'Qualified Org Base Amount',
            {
              required: false,
              placeholder: 'Enter Qualified Org Base Amount',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Qualified organization base amount for Iowa.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['qualified_org_baseamount_ia']?.edit &&
                  permissionMap?.['qualified_org_baseamount_ia']?.read),
            }
          ),
          createTextField('non_qualifying_wages_ia', 'Non Qualifying Wages', {
            required: false,
            placeholder: 'Enter Non Qualifying Wages',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Non-qualifying wages for Iowa R&D credit.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['non_qualifying_wages_ia']?.edit &&
                permissionMap?.['non_qualifying_wages_ia']?.read),
          }),
          createTextField(
            'non_qualifying_contract_expenses_ia',
            'Non Qualifying Contract Expenses',
            {
              required: false,
              placeholder: 'Enter Non Qualifying Contract Expenses',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Non-qualifying contract expenses for Iowa R&D credit.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['non_qualifying_contract_expenses_ia']
                    ?.edit &&
                  permissionMap?.['non_qualifying_contract_expenses_ia']?.read),
            }
          ),
          createTextField('cost_of_supplies_ia', 'Cost Of Supplies', {
            required: false,
            placeholder: 'Enter Cost Of Supplies',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Cost of supplies for Iowa R&D credit.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['cost_of_supplies_ia']?.edit &&
                permissionMap?.['cost_of_supplies_ia']?.read),
          }),
          createTextField('rac_share_ia', 'RAC Share', {
            required: false,
            placeholder: 'Enter RAC Share',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Research Activities Credit share for Iowa.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['rac_share_ia']?.edit &&
                permissionMap?.['rac_share_ia']?.read),
          }),
          createTextField('supplement_rac_ia', 'Supplement RAC', {
            required: false,
            placeholder: 'Enter Supplement RAC',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Supplement Research Activities Credit for Iowa.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['supplement_rac_ia']?.edit &&
                permissionMap?.['supplement_rac_ia']?.read),
          }),
          createTextField(
            'passthrough_supplement_rac_ia',
            'Passthrough Supplement RAC',
            {
              required: false,
              placeholder: 'Enter Passthrough Supplement RAC',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Passthrough supplement Research Activities Credit for Iowa.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['passthrough_supplement_rac_ia']?.edit &&
                  permissionMap?.['passthrough_supplement_rac_ia']?.read),
            }
          ),
        ],
      },

      // Kansas (KS)
      {
        sectionName: 'Kansas (KS)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField('tax_liability_ks', 'Tax Liability', {
            required: false,
            placeholder: 'Enter Tax Liability',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Actual Kansas tax liability for the current year.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
          }),
          createTextField('machinery_equipments_ks', 'Machinery Equipments', {
            required: false,
            placeholder: 'Enter Machinery Equipments',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Machinery and equipment expenses for Kansas.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['machinery_equipments']?.edit &&
                permissionMap?.['machinery_equipments']?.read),
          }),
        ],
      },

      // Kentucky (KY)
      {
        sectionName: 'Kentucky (KY)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField('llet_credit_ky', 'LLET Credit', {
            required: false,
            placeholder: 'Enter LLET Credit',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Limited Liability Entity Tax credit for Kentucky.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['llet_credit']?.edit &&
                permissionMap?.['llet_credit']?.read),
          }),
          createTextField(
            'corporation_tax_credit_ky',
            'Corporation Tax Credit',
            {
              required: false,
              placeholder: 'Enter Corporation Tax Credit',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Corporation tax credit for Kentucky.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['corporation_tax_credit']?.edit &&
                  permissionMap?.['corporation_tax_credit']?.read),
            }
          ),
          createTextField('individual_tax_credit_ky', 'Individual Tax Credit', {
            required: false,
            placeholder: 'Enter Individual Tax Credit',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Individual tax credit for Kentucky.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['individual_tax_credit']?.edit &&
                permissionMap?.['individual_tax_credit']?.read),
          }),
        ],
      },

      // Massachusetts (MA)
      {
        sectionName: 'Massachusetts (MA)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'basic_research_payments_ma',
            'Basic Research Payments - MA',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments - MA',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified basic research payments made in Massachusetts.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments']?.edit &&
                  permissionMap?.['basic_research_payments']?.read),
            }
          ),
        ],
      },

      // Maine (ME)
      {
        sectionName: 'Maine (ME)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'credit_carry_forward_py_me',
            'Credit Carry Forward from PY - ME',
            {
              required: false,
              placeholder: 'Enter Credit Carry Forward from PY - ME',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'R&D credit carried forward from the previous year - Maine',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_carry_forward_py_me']?.edit &&
                  permissionMap?.['credit_carry_forward_py_me']?.read),
            }
          ),
        ],
      },

      // Minnesota (MN)
      {
        sectionName: 'Minnesota (MN)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'nonprofit_development_contributions_mn',
            'Nonprofit Development Contributions',
            {
              required: false,
              placeholder: 'Enter Nonprofit Development Contributions',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Nonprofit development contributions for Minnesota.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['nonprofit_development_contributions_mn']
                    ?.edit &&
                  permissionMap?.['nonprofit_development_contributions_mn']
                    ?.read),
            }
          ),
          createTextField('basic_research_amount_mn', 'Basic Research Amount', {
            required: false,
            placeholder: 'Enter Basic Research Amount',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Basic research amount for Minnesota R&D credit.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['basic_research_amount_mn']?.edit &&
                permissionMap?.['basic_research_amount_mn']?.read),
          }),
          createTextField('credit_carry_over_mn', 'Credit Carry Over', {
            required: false,
            placeholder: 'Enter Credit Carry Over',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Credit carry over amount for Minnesota.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['credit_carry_over_mn']?.edit &&
                permissionMap?.['credit_carry_over_mn']?.read),
          }),
          createTextField('credit_tax_limit_mn', 'Credit Tax Limit', {
            required: false,
            placeholder: 'Enter Credit Tax Limit',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage: 'Credit tax limit for Minnesota.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['credit_tax_limit_mn']?.edit &&
                permissionMap?.['credit_tax_limit_mn']?.read),
          }),
          createTextField(
            'lease_costs_of_computers_mn',
            'Lease Costs of Computers',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Lease costs of computers for Minnesota.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers_mn']?.edit &&
                  permissionMap?.['lease_costs_of_computers_mn']?.read),
            }
          ),
        ],
      },
      // Nebraska (NE)
      {
        sectionName: 'Nebraska (NE)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'off_campus_research_expenses_ne',
            'Off-Campus Research Expenses',
            {
              required: false,
              placeholder: 'Enter Off-Campus Research Expenses',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Off-campus research expenses for Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['off_campus_research_expenses_ne']?.edit &&
                  permissionMap?.['off_campus_research_expenses_ne']?.read),
            }
          ),
          createTextField(
            'payroll_factor_on_campus_ne',
            'Payroll Factor On-Campus',
            {
              required: false,
              placeholder: 'Enter Payroll Factor On-Campus',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Payroll factor for on-campus activities in Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['payroll_factor_on_campus_ne']?.edit &&
                  permissionMap?.['payroll_factor_on_campus_ne']?.read),
            }
          ),
          createTextField(
            'payroll_factor_off_campus_ne',
            'Payroll Factor Off-Campus',
            {
              required: false,
              placeholder: 'Enter Payroll Factor Off-Campus',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Payroll factor for off-campus activities in Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['payroll_factor_off_campus_ne']?.edit &&
                  permissionMap?.['payroll_factor_off_campus_ne']?.read),
            }
          ),
          createTextField(
            'property_factor_on_campus_ne',
            'Property Factor On-Campus',
            {
              required: false,
              placeholder: 'Enter Property Factor On-Campus',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Property factor for on-campus activities in Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['property_factor_on_campus_ne']?.edit &&
                  permissionMap?.['property_factor_on_campus_ne']?.read),
            }
          ),
          createTextField(
            'property_factor_off_campus_ne',
            'Property Factor Off-Campus',
            {
              required: false,
              placeholder: 'Enter Property Factor Off-Campus',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Property factor for off-campus activities in Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['property_factor_off_campus_ne']?.edit &&
                  permissionMap?.['property_factor_off_campus_ne']?.read),
            }
          ),
          createTextField(
            'credit_distributed_ne',
            'Nonrefundable Credit Distributed',
            {
              required: false,
              placeholder: 'Enter Nonrefundable Credit Distributed',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Nonrefundable credit distributed for Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_distributed_ne']?.edit &&
                  permissionMap?.['credit_distributed_ne']?.read),
            }
          ),
          createTextField(
            'credit_tax_refunds_ne',
            'Credit Used for Sales/Use Tax Refunds',
            {
              required: false,
              placeholder: 'Enter Credit Used for Sales/Use Tax Refunds',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Credit used for sales and use tax refunds in Nebraska.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_tax_refunds_ne']?.edit &&
                  permissionMap?.['credit_tax_refunds_ne']?.read),
            }
          ),
        ],
      },

      // New Jersey (NJ)
      {
        sectionName: 'New Jersey (NJ)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'lease_costs_of_computers_nj',
            'Lease Costs of Computers - NJ',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers - NJ',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total lease expenses for computers used in New Jersey.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers']?.edit &&
                  permissionMap?.['lease_costs_of_computers']?.read),
            }
          ),
        ],
      },

      // South Carolina (SC)
      {
        sectionName: 'South Carolina (SC)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField('tax_liability_sc', 'Tax Liability - SC', {
            required: false,
            placeholder: 'Enter Tax Liability - SC',
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            labelTooltip: {
              showTooltip: true,
              tooltipMessage:
                'Actual South Carolina tax liability for the current year.',
            },
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            disabled:
              isCaseClosed ||
              (isCreateAndAmendmentType && hasParentCase) ||
              (isEditView &&
                !permissionMap?.['tax_liability']?.edit &&
                permissionMap?.['tax_liability']?.read),
          }),
          createTextField(
            'credit_carry_forward_py_sc',
            'Credit Carry Forward from PY - SC',
            {
              required: false,
              placeholder: 'Enter Credit Carry Forward from PY - SC',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'R&D credit carried forward from the previous year - South Carolina',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_carry_forward_py']?.edit &&
                  permissionMap?.['credit_carry_forward_py']?.read),
            }
          ),
          createTextField(
            'other_credits_total_sc',
            'Other Credits Total - SC',
            {
              required: false,
              placeholder: 'Enter Other Credits Total - SC',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total additional South Carolina credits applied against tax liability - South Carolina.',
              },
              regexErrorMessage:
                'Numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['other_credits_total']?.edit &&
                  permissionMap?.['other_credits_total']?.read),
            }
          ),
        ],
      },

      // Texas (TX)
      {
        sectionName: 'Texas (TX)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          createTextField(
            'credit_carry_forward_py_tx',
            'Credit Carry Forward from PY - TX',
            {
              required: false,
              placeholder: 'Enter Credit Carry Forward from PY - TX',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'R&D credit carried forward from the previous year - Texas',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['credit_carry_forward_py']?.edit &&
                  permissionMap?.['credit_carry_forward_py']?.read),
            }
          ),
        ],
      },

      // Vermont (VT)
      {
        sectionName: 'Vermont (VT)',
        fillType: 'accordion',
        accordionGroup: 'case_additional_info',
        hide: CountryName !== FinancialWorkingCountries.US,
        fields: [
          // createTextField('credit_attributable_to_shared_wages_vt', 'Credit Attributable to Shared Wages', {
          //   required: false,
          //   placeholder: 'Enter Credit Attributable to Shared Wages',
          //   regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          //   labelTooltip: {
          //     showTooltip: true,
          //     tooltipMessage: 'Credit attributable to shared wages for Vermont.',
          //   },
          //   regexErrorMessage: 'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          //   disabled: isCaseClosed || (isCreateAndAmendmentType && hasParentCase) || (isEditView && !permissionMap?.['credit_attributable_to_shared_wages_vt']?.edit && permissionMap?.['credit_attributable_to_shared_wages_vt']?.read),
          // }),
          createTextField(
            'basic_research_payments_vt',
            'Basic Research Payments',
            {
              required: false,
              placeholder: 'Enter Basic Research Payments',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified basic research payments made in Vermont.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['basic_research_payments_vt']?.edit &&
                  permissionMap?.['basic_research_payments_vt']?.read),
            }
          ),
          createTextField(
            'energy_consortia_amount_vt',
            'Energy Consortia Amount',
            {
              required: false,
              placeholder: 'Enter Energy Consortia Amount',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage: 'Energy consortia amount for Vermont.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['energy_consortia_amount_vt']?.edit &&
                  permissionMap?.['energy_consortia_amount_vt']?.read),
            }
          ),
          createTextField(
            'qualified_org_baseamount_vt',
            'Qualified Org Base Amount',
            {
              required: false,
              placeholder: 'Enter Qualified Org Base Amount',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Qualified organization base amount for Vermont.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['qualified_org_baseamount_vt']?.edit &&
                  permissionMap?.['qualified_org_baseamount_vt']?.read),
            }
          ),
          createTextField(
            'lease_costs_of_computers_vt',
            'Lease Costs of Computers',
            {
              required: false,
              placeholder: 'Enter Lease Costs of Computers',
              regex: REGEX_PATTERNS.EFFORTS_NUMBER,
              labelTooltip: {
                showTooltip: true,
                tooltipMessage:
                  'Total lease expenses for computers used in Vermont.',
              },
              regexErrorMessage:
                'Only positive numbers allowed, up to 16 digits and 2 decimal places',
              disabled:
                isCaseClosed ||
                (isCreateAndAmendmentType && hasParentCase) ||
                (isEditView &&
                  !permissionMap?.['lease_costs_of_computers_vt']?.edit &&
                  permissionMap?.['lease_costs_of_computers_vt']?.read),
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

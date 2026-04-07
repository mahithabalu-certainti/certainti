import { CommonApiResponse } from '../../common-service';

export interface ParentAccountApiResponse extends CommonApiResponse {
  data: {
    globalAccount: GloablAcconunts[];
  };
}

export interface IndustrysApiResponse extends CommonApiResponse {
  data: {
    industries: Industries[];
  };
}

export interface CurrencyApiResponse extends CommonApiResponse {
  data: {
    currency: Currencys[];
  };
}

export interface ColorCodeApiResponse extends CommonApiResponse {
  data: {
    colors: ColorItems[];
  };
}

export interface ClassificationApiResponse extends CommonApiResponse {
  data: {
    projectClassifications: Classification[];
  };
}

export interface StatesApiResponse extends CommonApiResponse {
  data: {
    states: States[];
  };
}

export interface FinancialStatesApiResponse extends CommonApiResponse {
  data: States[];
}

export interface CitysApiResponse extends CommonApiResponse {
  data: {
    cities: Cities[];
  };
}

export interface AccountDetailsResponse {
  accountById: AccountById;
  accountDetails: AccountFieldsTypes;
}

export interface AccountFieldsApiResponse extends CommonApiResponse {
  data: AccountDetailsResponse;
}

export interface FinancialSummaryApiResponse extends CommonApiResponse {
  data: FinancialSummaryDetails;
}

interface ResourceMetric {
  rid: string;
  metric: string;
  fte: number;
  subcon: number;
  nonlabor: number;
}

interface DetailedMetric {
  rid: string;
  metric_name: string;
  project_level: number;
  project_resource_level: number;
  project_task_level?: number; // Optional as one item lacks it
  permission: string;
}

export type ClaimJurisdiction = {
  rid: string;
  name: string;
  rd_credits_fte: number;
  rd_credits_subcon: number;
  rd_credits_nonlabor: number;
  rd_credits_total: number;
  permission: string;
};

export interface FinancialSummaryDetails {
  account_rid: string;
  fiscal_year: number;
  rd_eligible_projects: number | null;
  resource_metrics: ResourceMetric[];
  detailed_metrics: DetailedMetric[];
  claim_jurisdiction: ClaimJurisdiction[];
  permission: string;
}

export interface States {
  rid: string;
  state_name: string;
}

export interface Cities {
  rid: string;
  city_name: string;
}

export interface Currencys {
  rid: string;
  currency_name: string;
  currency_code: string;
}
export interface Industries {
  rid: string;
  currency_name: string;
  currency_code: string;
}
export interface Classification {
  rid: string;
  classification_name: string;
  currency_code: string;
}

export interface GloablAcconunts {
  rid: string;
  account_name: string;
}
export interface ColorItems {
  rid: string;
  color_number: number;
  color_code: string;
  status: 'Active' | 'Inactive';
}

export interface Industries {
  rid: string;
  industry_name: string;
}

export interface Account {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  totalProjects: string | number;
  totalProjectHours: string | number;
  totalProjectCost: string | number;
  estimatedHours: string | number;
  qre: string | number;
  estimatedCredits: string | number;
  actualCredits: string | number;
  financeExecutive: string;
  financeHead: string;
  professionalConsultant: string;
}

export interface Column<T> {
  id: keyof T;
  label: string;
  sortable?: boolean;
}

export enum Storagetype {
  SeperateDB = 'separate_db',
  StoredDB = 'store_in_parent',
}

export enum Status {
  Active = 'active',
  InActive = 'inactive',
}

type NewStatus = {
  status_name: string;
};

export enum YesNo {
  Yes = 'yes',
  No = 'no',
}

export enum OthersEnum {
  Other = 'other',
  Others = 'others',
}
export enum TaskType {
  Action = 'action',
  Milestone = 'milestone',
}
export enum ResourceType {
  full_time = 'full-time',
}

export enum enumValue {
  Yes = 'Yes',
  No = 'No',
}

export enum KeyContactsUpdate {
  Edit = 'edit',
  Delete = 'delete',
  Add = 'add',
}

export interface AccountById {
  parent_account_rid: string | null;
  r_number: string;
  account_name: string;
  industry: string;
  industry_rid: string;
  industry_rid_name: string;
  business_details: string;
  country_rid: string | null;
  currency_rid: string | null;
  status: NewStatus;
  primary_contact_name: string;
  status_rid: string;
  is_parent: boolean;
  comments: string | null;
  annual_revenue: number;
  region: string;
  rid: string;
  created_datetime: string;
  modified_datetime: string;
  organisation_name: string;
  logo_url: string;
  parent_account: {
    account_name: string;
  };
  country: { country_name: string; country_code: string };
  currency: {
    currency_code: string;
    currency_symbol: string;
  };
  region_rid?: string | null;
}

export interface KeyContacts {
  key_contact_id?: string;
  account_rid?: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication?: boolean;
  interaction_cc_recipient?: boolean;
  status_name?: string;
  status_rid: string;
  action_type?: string;
  rid?: string;
}

export interface AccountFieldsTypes {
  rid: string;
  status_rid: string;
  primary_contact_email: string;
  primary_contact_number: string;
  finance_poc_name: string;
  finance_poc_email: string;
  finanace_poc_number: string;
  website: string | null;
  project_manager: string;
  fiscal_start_date: string;
  fiscal_end_date: string;
  autosend_interaction: boolean;
  max_ai_interactions: number;
  auto_access_rd: boolean;
  blended_rate_fte: string | null;
  blended_rate_subcon: string | null;
  data_storage: Storagetype;
  keyContacts: KeyContacts[];
  modified_by: string;
  created_by: string;
  account_rid: string;
  client_secret: string;
  client_id: string;
  tenant_id: string;
  support_email: string;
  is_send_interaction: boolean;
  is_case_exists: boolean;
}

export interface NewAccountData extends AccountFieldsTypes, AccountById {
  account_id: string;
  account_currency_rid: string | null;
  account_country_rid: string | null;
  account_country_region_rid: string | null;
  region_rid: string | null;
  account_city_rid: string;
  created_by: string;
  modified_by: string;
  finance_poc_number: string;
  account_rid: string;
  industry_rid: string;
  industry_name_other: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: string;
  include_in_communication: string;
  key_contact_status: Status;
  key_contacts: KeyContacts[];
  organisation_name: string;
  showOthersField?: boolean;
}

export interface updatedAccountFormData {
  logo: File;
  data: NewAccountData;
}

export interface AccountFormData
  extends Omit<
    NewAccountData,
    'is_parent' | 'autosend_interaction' | 'auto_access_rd'
  > {
  is_parent: YesNo;
  autosend_interaction: YesNo;
  auto_access_rd: YesNo;
}

type Country = {
  country_name: string;
};

type Currency = {
  currency_code?: string;
  currency_symbol?: string;
};

export type AccountListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    account: {
      data: AccountList[];
      total: number;
      totaltotalResult?: number;
    };
    count: number;
  };
};

export type GlobalAccountListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    gloablAcconunt: AccountList[];
    count: number;
  };
};

export interface ProjectsByYear {
  fiscal_year: string;
  account_rid: string;
  total_projects: number | null;
  total_project_hours: string;
  total_project_cost: string;
  qualifying_project_hours_fed: number | null;
  qualifying_project_qre_fed: number | null;
  qualifying_project_rd_credits_fed: number | null;
  total_projects_rd_credits: string;
  currency: string;
}

export interface AccountListURLParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  globalFilters?: globalFilters;
  fiscalYear?: string;
  search?: string;
}

export interface globalFilters {
  [key: string]: string[];
}
type Industry = {
  rid: string;
  industry_name: string;
};
export type AccountList = {
  rid: string;
  r_number: string;
  createdAt: string;
  updatedAt: string;
  account_name: string;
  comments: string;
  eid: string | null;
  status: 'active' | 'inactive';
  is_parent: boolean;
  annual_revenue: string;
  region: string;
  storage_type: 'separate_db' | 'store_in_parent';
  parent_account_rid: string | null;
  database_connection_rid: string | null;
  country_rid: string;
  country_code?: string;
  currency_rid: string;
  industry_rid: string;
  industry_name_other: string | null;
  is_file_drop_enabled: boolean;
  file_drop_medium: string | null;
  file_drop_config_id: string | null;
  total_projects: number;
  total_project_cost: number;
  total_projects_rd_credits: number;
  total_project_hours: number;
  qualifying_project_hours_fed: number;
  qualifying_project_qre_fed: number;
  qualifying_project_rd_credits_fed: number;
  created_datetime: string;
  modified_datetime: string;
  created_by: string;
  modified_by: string;
  country?: Country | null;
  currency?: Currency | null;
  industry?: Industry;
  child_accounts?: AccountList[];
  key_contacts: KeyContacts[];
  technical_consultant: string;
  financial_consultant: string;
  delivery_head: string;
  finance_executive: string;
  professional_services_consultant: string;
  finance_lead: string;
  projects_by_fiscal_year?: ProjectsByYear[];
  color?: string;
  bgColor?: string;
};

export interface ConvertedAccount {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  currency: string;
  // currency: string;
  // status: 'Active' | 'In Active';
  // primaryContact: string;
  // parentAccountID: string | null;
  // annualRevenue: string;
  color?: string;
  bgColor?: string;
  totalProjects: string | number;
  totalProjectHours: string | number;
  totalProjectCost: string | number;
  estimatedHours: string | number;
  qre: string | number;
  estimatedCredits: string | number;
  actualCredits: string | number;
  financeExecutive: string;
  financeHead: string;
  professionalConsultant: string;
  projectsByYear?: ProjectsByYear[];
}

export interface keyContactRoles {
  rid: string;
  role_name: string;
}

export interface keyContactRolesApiResponse extends CommonApiResponse {
  data: {
    keyContactRoles: keyContactRoles[];
  };
}

export interface GlobalAccountListParams {
  fiscalYear?: number | string;
  globalFilters?: globalFilters;
}

export interface FormField {
  id: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'date';
  required?: boolean;
  editable?: boolean;
  hide?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  rows?: number;
  fullWidth?: boolean;
  resetDependsFields?: string[];
  validation?: Array<{
    regex: RegExp;
    errorMessage: string;
  }>;
}

export type ExportType =
  | 'resource'
  | 'cost'
  | 'skill'
  | 'project'
  | 'attachments'
  | 'imports'
  | 'financial'
  | 'financial_resource_cost'
  | 'financial_project_cost'
  | 'resource_attachments'
  | 'projectTask'
  | 'project_resource'
  | 'timesheet'
  | 'interactions'
  | 'timesheet_project'
  | 'timesheet_project_resource'
  | 'timesheet_project_task'
  | 'technical_summary'
  | 'resource_notes'
  | 'notes'
  | 'cases'
  | 'checklist'
  | 'resource_checklist'
  | 'cases_projects'
  | 'case_task'
  | 'review_projects'
  | 'activities'
  | 'dossier-technical-summary'
  | 'dossier-resource-summary'
  | 'dossier-project-documents'
  | 'dossier-qualified-projects'
  | 'dossier-audit-timeline'
  | 'four_part_assessment'
  | 'rd_assessment_status';

export type FinancialSummaryFlag = 'all' | 'rd_qualified';

export interface FinancialSummaryBody {
  account_rid: string;
  fiscal_year: number;
  flag: FinancialSummaryFlag;
  summaryType: string;
  region_rid: string;
  case_rid?: string;
}

export type FormFiscalDateType = {
  year: number;
  startMin?: Date;
  startMax?: Date;
  endMax?: Date;
};

export type FiscalDates = {
  startDate: string;
  endDate: string;
};

export interface FinancialStateProps {
  accountId: string;
  countryId?: string;
  fiscalYear?: string;
  caseId?: string;
}

export interface ActivityMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hide?: boolean;
}

export interface ActivityDropdownItem {
  label: string;
  hide?: boolean;
  disabled?: boolean;
  icon?: React.ElementType;
  onClick: () => void;
}

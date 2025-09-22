import { CommonApiResponse } from '../../common-service';
import { AttachmentList } from './attachment';

export interface globalFilters {
  [key: string]: string[];
}
export interface ProjectListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  accountNumber?: string;
  globalFilters?: globalFilters;
  timezone?: string;
  bothParentAndChild?: boolean;
  apiSource?: string;
  accountInteractionId?: string;
}
export enum Status {
  Active = 'active',
  InActive = 'inactive',
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
  key_contact_status?: Status;
  role_name?: string;
  rid?: string;
}
export interface NewProjectData {
  showOthersField?: boolean;
  account_id?: string;
  status_rid: string;
  name?: string;
  r_number?: string;
  account_name: string;
  industry_rid_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  classification?: string | null;
  project_classification_other?: string | null;
  classification_name?: string | null;
  client_group?: string | null;
  account_rid?: string;
  description?: string | null;
  status_name: string;
  currency_name?: string;
  currency_symbol?: string;
  region_name?: string;
  country_name?: string;
  record_id?: string;
  created_on?: string;
  created_by?: string;
  modified_on?: string;
  modified_by?: string;
  is_active?: boolean;
  updated_on?: string;
  Updated_By?: string;
  created_datetime?: string;
  modified_datetime?: string;
  keyContact?: KeyContacts[] | undefined;
  efforts_in_hrs?: string | null;
  total_fte_count?: number | null;
  total_sub_con_count?: number | null;
  account_number?: string;
  project_code?: string;
  project_name?: string;
  project_id?: string;
  created_name?: string;
  modified_name?: string;
  industry: string;
  industry_rid: string | null;
  industry_name: string;
  program_name: string;
  client_organization?: string;
  project_startdate?: string | null;
  project_enddate?: string | null;
  project_type?: string;
  project_type_name?: string;
  project_type_rid?: string;
  project_classification_rid?: string | null;
  project_classification_name?: string;
  project_client_group?: string;
  project_group?: string;
  project_summary?: string;
  project_status?: string;
  fiscal_year?: number;
  country?: string;
  region?: string;
  currency?: string;
  country_rid?: string;
  region_rid?: string;
  currency_rid?: string;
  total_effort?: string | null;
  total_cost?: string | null;
  total_fte?: number | null;
  total_subcon?: number | null;
  total_cost_nonlabor?: string | null;
  total_effort_fte?: string | null;
  total_effort_subcon?: string | null;
  total_cost_fte?: string | null;
  total_cost_subcon?: string | null;
  auto_send_ai_interaction?: boolean | string;
  auto_assessment?: boolean | string;
  auto_access_rd?: boolean;
  max_ai_interaction?: number | null;
  blended_rate_fte?: string | null;
  blended_rate_FTE?: string | null;
  max_ai_interaction_follow_up?: number | null;
  blended_rate_subCon?: string | null;
  blended_rate_subcon?: string | null;
  project_description?: string;
  comments?: string;
  key_contacts?: KeyContacts[];
  key_contact_name?: string;
  key_contact_email?: string;
  key_contact_role?: string;
  rid?: string;
  is_primary_contact?: string;
  include_in_communication?: string;
  key_contact_status?: Status;
  project_fiscal_id?: string;
  project_fiscal_rid?: string;
  attachment?: AttachmentList[];
  project_rid?: string;
}

export interface ProjectTypeItem {
  rid: string;
  project_type_name: string;
  project_type_description: string;
  status: string;
}

export interface GetProjectTypeApiResponse extends CommonApiResponse {
  data: {
    projectType: ProjectTypeItem[];
  };
}

//Project Accordion table data types
export type ProjectAccordionResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    projects: Project[];
    count?: number;
    totalCount?: number;
  };
};

export type Project = {
  project_classification_other: string | null;
  project_code: string;
  project_name: string | null;
  account_name?: string;
  account_status_name?: string;
  account_id: string;
  project_rid: string;
  modified_datetime: string;
  assessment_status: string | null;
  qre: string | null;
  qre_final?: string | null;
  is_rd_qualified: boolean;
  industry_name_other: string | null;
  project_type: string;
  project_type_name: string;
  project_client_group: string | null;
  project_group: string | null;
  project_classification_rid: string | null;
  classification_name: string | null;
  project_status: string;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  r_number: string;
  program_name: string | null;
  project_startdate: string | null;
  project_enddate: string | null;
  total_cost: number | null;
  total_effort: number | null;
  total_fte: number | null;
  total_cost_fte: number | null;
  total_subcon: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;
  comments: string | null;
  country_name: string | null;
  currency_code: string;
  currency_symbol: string;
  region_name: string | null;
  created_datetime: string;
  rid?: string;
  account_rid?: string;
  fiscal_year?: number;
  project_fiscal_rid?: string;
  ProjectFiscal: ProjectFiscalSummary[];
  _level?: number;
  currency_rid?: string;
};
export type ProjectFiscalSummary = {
  account_status_name?: string;
  project_code: string;
  project_group: string | null;
  project_name: string | null;
  project_type: string;
  fiscal_year: number;
  project_client_group: string | null;
  account_name: string;
  qre: string | null;
  classification_name: string | null;
  total_effort: number | null;
  total_cost: number | null;
  total_cost_fte: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;
  assessment_status: string | null;
  qre_final: string | null;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  comments: string | null;
  modified_datetime: string;
  project_rid: string;
  created_datetime: string;
  project_fiscal_rid: string;
  rid: string;
  isInteractionMapped?: boolean;
  isKeyContactIncluded?: boolean;
};

export type FiscalYearType = {
  year?: number;
  startDate?: string;
  endDate?: string;
};

export type ProjectTiggerAIResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
};
interface ProjectItem {
  account_rid: string;
  project_fiscal_rid: string[];
}
export type ProjectTriggerAIPayload = {
  data: ProjectItem[];
  type: string;
};

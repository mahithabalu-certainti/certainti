export interface FourPartAssessmentListURLParams {
  account_rid: string;
  project_fiscal_rid?: string;
  case_rid?: string;
  page: number;
  limit: number;
  search: string;
  filter: object;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  type: 'account' | 'project' | 'case';
}

export interface FourPartAssessmentListExportURLParams {
  account_rid: string;
  project_fiscal_rid?: string;
  case_rid?: string;
  search: string;
  filter: object;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  type: 'account' | 'project' | 'case';
  timezone?: string;
}

export type FourPartAssessmentList = {
  rid: string;
  r_number: string | null;
  project_code: string | null;
  rd_potential_category: 'Low' | 'Medium' | 'High' | string;
  status: string;
  created_by: string;
  created_by_name: string;
  created_datetime: string;
  permitted_purpose_status: string;
  technological_uncertainty_status: string;
  technological_in_nature_status: string;
  process_of_experimentation_status: string;
};

export interface FourPartAssessmentListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page: number;
    limit: number;
    total_results: number;
    data: FourPartAssessmentList[];
  };
}

export interface FourPartAssessmentAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
}

export interface FourPartAssessmentQuestions {
  permitted_purpose: string;
  technological_uncertainty: string;
  process_of_experimentation: string;
  technological_in_nature: string;
}

export interface FourPartAssessmentDetailsTitle {
  rid: string;
  r_number: string;
}

export interface FourPartAssessmentDetailsBasicInfo {
  rid: string;
  status: string;
  project_code: string | null;
  project_description: string | null;
  rd_potential_category: string;
}

export interface FourPartAssessmentDetailsAuditInfo {
  record_id: string;
  created_by: string;
  created_on: string | null;
  four_part_assessment_id: string;
  created_by_name: string;
}

export interface FourPartAssessmentDetails {
  title: FourPartAssessmentDetailsTitle;
  basic_information: FourPartAssessmentDetailsBasicInfo;
  four_part_assessment: FourPartAssessmentQuestions;
  audit_information: FourPartAssessmentDetailsAuditInfo;
}

export interface FourPartAssessmentDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: FourPartAssessmentDetails;
}

export interface ExportFourPartAssessmentListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

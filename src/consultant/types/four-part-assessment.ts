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
  summary_judgment: string | null;
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

export interface FourPartAssessmentQuestionItem {
  status: string;
  rationale: string | null;
}

export interface FourPartAssessmentQuestions {
  permitted_purpose: FourPartAssessmentQuestionItem;
  technological_uncertainty: FourPartAssessmentQuestionItem;
  process_of_experimentation: FourPartAssessmentQuestionItem;
  technological_in_nature: FourPartAssessmentQuestionItem;
}

export interface FourPartAssessmentDetailsTitle {
  rid: string;
  r_number: string;
}

export interface FourPartAssessmentDetailsBasicInfo {
  rid: string;
  status: string;
  created_on: string | null;
  project_code: string | null;
  tracker_one_liner: string | null;
  rd_potential_category: string;
}

export interface FourPartAssessmentDetailsAuditInfo {
  record_id: string;
  created_by: string;
  created_on: string | null;
  four_part_assessment_id: string;
  created_by_name: string;
}

export interface FourPartAssessmentQuestionDetail {
  question: string;
  question_seq_num: string;
}

export interface FourPartAssessmentInteractionQuestions {
  interaction_rid: string;
  r_number: string;
  project_fiscal_rid: string;
  question_details: FourPartAssessmentQuestionDetail[];
}

export interface FourPartAssessmentDetails {
  title: FourPartAssessmentDetailsTitle;
  record_information: FourPartAssessmentDetailsBasicInfo;
  four_part_assessment_evaluation: FourPartAssessmentQuestions;
  audit_information: FourPartAssessmentDetailsAuditInfo;
  interaction_questions: FourPartAssessmentInteractionQuestions | null;
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

export interface FourPartAssessmentListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  fiscalYear?: number;
  filters?: object;
  search?: string;
  entityId?: string;
  accountRid?: string;
  attachmentLevel?: string;
}

export interface FourPartAssessmentListExportURLParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  search?: string;
  fiscalYear?: number;
  entityId?: string;
  accountRid?: string;
  attachmentLevel?: string;
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
  modified_by?: string | null;
  modified_by_name?: string | null;
  modified_datetime?: string | null;
};

export interface FourPartAssessmentListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page: number;
    limit: number;
    total_results: number;
    four_part_assessment: FourPartAssessmentList[];
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
  updated_on: string | null;
  modified_by: string | null;
  four_part_assessment_id: string;
  created_by_name: string;
  modified_by_name: string | null;
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

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
  account_rid: string;
  project_code: string | null;
  attach_to: string;
  attached_to: string;
  attachment_level: string;
  range: 'Low' | 'Medium' | 'High';
  status_rid: string | null;
  status_name: 'Met' | 'Not Met';
  created_by: string;
  created_by_name: string;
  created_datetime: string;
  modified_by?: string | null;
  modified_by_name?: string | null;
  modified_datetime?: string | null;
  tracker_one_liner?: string;
};

export interface FourPartAssessmentListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    fourPartAssessment: FourPartAssessmentList[];
    count: number;
  };
}

export interface FourPartAssessmentAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
}

export interface FourPartAssessmentQuestions {
  permitted_purpose: 'Met' | 'Not Met';
  technological_uncertainty: 'Met' | 'Not Met';
  process_of_experimentation: 'Met' | 'Not Met';
  technological_in_nature: 'Met' | 'Not Met';
}

export interface FourPartAssessmentDetails {
  rid: string;
  r_number: string;
  account_rid: string;
  project_code: string | null;
  attach_to: string;
  attached_to: string;
  attachment_level: string;
  range: 'Low' | 'Medium' | 'High';
  status_rid: string | null;
  status_name: 'Met' | 'Not Met';
  created_by: string;
  created_by_name: string;
  created_datetime: string;
  modified_by?: string | null;
  modified_by_name?: string | null;
  modified_datetime?: string | null;
  tracker_one_liner: string;
  assessment_questions: FourPartAssessmentQuestions;
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

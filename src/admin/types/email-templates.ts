export type EmailSortOrder = 'ASC' | 'DESC';

export interface EmailTemplateListParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: EmailSortOrder;
  filters?: object;
  searchTerm?: string;
  timezone?: string;
}

// List
export type EmailTemplateList = {
  rid: string;
  r_number: string;
  template_name: string;

  status: string;
  status_name: string;

  created_by: string;
  modified_by: string | null;
  created_user_name: string;
  modified_user_name: string | null;
  created_datetime: string;
  modified_datetime: string | null;

  description: string;
  owner: string;
};

export interface EmailTemplateListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    emailTemplates: EmailTemplateList[];
  };
}

//Details
export interface EmailTemplateDetails {
  template_rid: string;
  r_number: string;
  template_name: string;
  subject: string;
  description: string;
  email_body: string;
  status_rid: string;
  status_name: string;
  owner?: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
}

export interface EmailTemplateDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    templateDetails: EmailTemplateDetails;
  };
}

// Form
export interface EmailTemplateFormData {
  templateName: string;
  subject: string;
  description: string;
  status: string;
  emailBody: string;
  rid?: string;
  template_rid?: string;
  created_on?: string;
  created_by?: string;
  updated_on?: string;
  updated_by?: string;
}

export interface EmailTemplateFormErrors {
  templateName?: string;
  subject?: string;
  description?: string;
  status?: string;
  emailBody?: string;
}

export type EmailTemplateFormPayload = {
  template_rid?: string;
  template_name?: string;
  subject?: string;
  description?: string;
  owner?: string;
  status_rid?: string;
  email_body?: string;
};

export interface ExportEmailTemplateResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

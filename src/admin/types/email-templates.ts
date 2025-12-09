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
  status_rid: string;
  status_name: string;
  created_by: string;
  created_user_name: string;
  created_datetime: string;
  modified_by: string | null;
  modified_user_name: string | null;
  modified_datetime: string | null;
  description: string;
  total_records: number;
  category_rid: string;
  category_name: string;
};

export interface EmailTemplateListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    emailTemplates: EmailTemplateList[];
    count: number;
  };
}

//Details
export interface EmailTemplateDetails {
  email_template_rid: string;
  email_template_name: string;
  email_template_description: string;
  r_number: string;
  status_rid: string;
  status_name: string;
  subject: string;
  body_html: string;
  category_rid: string;
  category_name: string;
  created_by: string;
  created_datetime: string;
  modified_by: string | null;
  modified_datetime: string | null;
}

export interface EmailTemplateDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    emailTemplateDetails: EmailTemplateDetails;
  };
}

// Form
export interface EmailTemplateFormData {
  templateName: string;
  subject: string;
  description: string;
  status: string;
  emailBody: string;
  category: string;
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
  category?: string;
  emailBody?: string;
}

export type EmailTemplateFormPayload = {
  email_template_rid?: string;
  template_name?: string;
  subject?: string;
  description?: string;
  category_rid?: string;
  status_rid?: string;
  body_html?: string;
};

export interface ExportEmailTemplateResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

// Email PlaceHolders
export interface EmailPlaceholder {
  rid: string;
  placeholder_key: string;
  display_name: string;
}

export interface EmailPlaceholderResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    placeHolders: EmailPlaceholder[];
  };
}

// Category PlaceHolders
export interface CategoryPlaceholder {
  rid: string;
  placeholder_rid: string;
  placeholder_key: string;
  applicable_to: 'body' | 'subject' | 'both';
}

export interface CategoryPlaceholderResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    placeholders: CategoryPlaceholder[];
  };
}

// Email Category List
export interface EmailCategory {
  rid: string;
  category_name: string;
}

export interface EmailCategoryResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    categories: EmailCategory[];
  };
}

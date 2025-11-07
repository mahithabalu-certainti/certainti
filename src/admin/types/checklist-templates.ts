import { CommonApiResponse } from '../../common-service';

export type ChecklistSortOrder = 'ASC' | 'DESC';

export interface ChecklistTemplateListParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: ChecklistSortOrder;
  filters?: object;
  searchTerm?: string;
  timezone?: string;
  search?: string;
}

// List
export type ChecklistTemplateList = {
  rid: string;
  r_number: string;
  checklist_name: string;
  checklist_type: string;
  checklist_level: string;
  description: string;
  status: string;
  status_name: string;
  created_by: string;
  modified_by: string | null;
  created_user_name: string;
  modified_user_name: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  checklist_description: string | null;
};

export interface ChecklistTemplateListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page: number;
    limit: number;
    count: number;
    checklist: ChecklistTemplateList[];
  };
}

// Details
export interface ChecklistItem {
  rid: string;
  checklist_item_name: string;
  checklist_template_rid: string;
  description: string;
  sequence_no?: string;
}

export interface ChecklistTemplateDetails {
  checklist_template_rid: string;
  checklist_name: string;
  checklist_description: string;
  r_number: string;
  status_rid: string;
  status_name: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  checklist_items: ChecklistItem[];
}

export interface ChecklistTemplateDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    checklistDetails: ChecklistTemplateDetails;
  };
}

export enum QustionActionType {
  Add = 'add',
  Edit = 'edit',
  Delete = 'delete',
}

export type ChecklistTemplateQuestionPayload = {
  rid?: string;
  question: string;
  description: string;
  action_type: QustionActionType;
};

export type ChecklistTemplateFormPayload = {
  checklist_rid?: string;
  checklist_level_rid?: string;
  checklist_type_rid?: string;
  checklist_name?: string;
  description?: string;
  status_rid?: string;
  expires_on?: string;
  questions: ChecklistTemplateQuestionPayload[];
};

export interface ExportChecklistTemplateResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

// Checklist level, status, type response structure

// Checklist Status
export interface ChecklistStatusItem {
  rid: string;
  status_name: string;
  status_type?: string | null;
}

export interface ChecklistStatusApiResponse extends CommonApiResponse {
  data: {
    checklistStatus: ChecklistStatusItem[];
  };
}

// Checklist Level
export interface ChecklistLevelItem {
  rid: string;
  checklist_level_name: string;
}

export interface ChecklistLevelApiResponse extends CommonApiResponse {
  data: {
    checklistLevel: ChecklistLevelItem[];
  };
}

// Checklist Type
export interface ChecklistTypeItem {
  rid: string;
  checklist_type_name: string;
}

export interface ChecklistTypeApiResponse extends CommonApiResponse {
  data: {
    checklistTypes: ChecklistTypeItem[];
  };
}

export interface ChecklistItemPayload {
  checklist_item_name: string;
  checklist_item_rid?: string;
  // sequence_no: number;
  description: string;
  action_type: 'add' | 'edit' | 'delete';
}

export interface CreateTemplatePayload {
  checklist_name: string;
  checklist_template_rid?: string;
  checklist_description: string;
  status_rid: string;
  checklist_items: ChecklistItemPayload[];
}

export interface CreateTemplateResponse extends CommonApiResponse {
  data: {
    checklist_rid?: string;
    message?: string;
  };
}

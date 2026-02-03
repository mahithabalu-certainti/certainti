import { CommonApiResponse } from '../../common-service';

interface GlobalFilters {
  [key: string]: string[];
}

export interface ChecklistListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: GlobalFilters;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  isGlobal?: boolean;
  search?: string;
}

export interface ChecklistListExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: GlobalFilters;
  timezone?: string;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  search?: string;
  isGlobal?: boolean;
  page?: number;
  limit?: number;
}

//List
export type ChecklistList = {
  rid: string;
  r_number: string;
  checklist_name: string;
  checklist_description: string | null;
  checklist_template_rid: string | null;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: string | number | null;
  assigned_to: string | null;
  status_rid: string | null;
  created_by_name: string;
  modified_by_name: string | null;
  attached_to: string;
};

export interface ChecklistListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    checklists: ChecklistList[];
    totalCount: number;
  };
}

//Details

export type ChecklistItemDetails = {
  rid: string;
  sequence_no?: string;
  checklist_item_name: string;
  status_rid: string | null;
  status_name: string | null;
  checklist_item_description: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  created_by_name?: string | null;
  modified_by_name?: string | null;
};

export interface ChecklistDetails {
  checklist_rid: string;
  checklist_name: string;
  checklist_description: string;
  r_number: string;
  status_rid: string;
  status_name: string;
  account_rid: string;
  fiscal_year: number;
  attached_to: string;
  attach_to: string;
  attachment_level: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  checklist_items: ChecklistItemDetails[];
}

export interface ChecklistDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    checklistDetails: ChecklistDetails;
  };
}

//Form types

export enum ItemActionType {
  Add = 'add',
  Edit = 'edit',
  Delete = 'delete',
}

export type ChecklistItem = {
  checklist_item_rid?: string;
  checklist_item_name: string;
  checklist_item_description: string;
  status_rid?: string;
  action_type: ItemActionType | string;
};

export type ChecklistFormPayload = {
  checklist_rid?: string;
  account_rid: string;
  checklist_name: string;
  checklist_template_rid?: string;
  fiscal_year?: string | number;
  checklist_description: string;
  attach_to: string;
  attachment_level: string;
  status_rid: string;
  checklist_items: ChecklistItem[];
};

export interface ChecklistFormResponse extends CommonApiResponse {
  data: {
    checklist_rid?: string;
    message?: string;
  };
}

// Checklist status
export interface ChecklistStatus {
  rid: string;
  status_name: string;
}

export interface ChecklistStatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    checklistStatus: ChecklistStatus[];
  };
}

// Checklist templates list
export interface ChecklistTemplateItem {
  rid: string;
  checklist_name: string;
}

export interface ChecklistTemplateItemsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ChecklistTemplateItem[];
}

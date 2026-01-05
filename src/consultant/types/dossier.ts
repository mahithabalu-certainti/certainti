//-------- Project Documents ----------
export interface ProjectDocumentsListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectDocumentsListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ProjectDocumentItem = {
  rid: string;
  r_number: string;
  project_ref_id: string;
  project_name: string;
  document_number: string;
  document_type: string;
  document_name: string;
};

export interface ProjectDocumentListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    projectDocuments: ProjectDocumentItem[];
  };
}

//-------- Resource Summary ----------
export interface ResourceSummaryListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ResourceSummaryListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ResourceSummaryItem = {
  rid: string;
  r_number: string;
  project_ref_id: string;
  project_name: string;
  resource_ref_id: string;
  resource_name: string;
  resource_type: string;
  country_region: string;
  cost: string;
  rd_percentage: string;
  qre: string;
  rd_credit: string;
};

export interface ResourceSummaryListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    resourceSummary: ResourceSummaryItem[];
  };
}

//-------- Project Summary ----------
export interface ProjectSummaryListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectSummaryListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ProjectSummaryItem = {
  rid: string;
  r_number: string;
  project_ref_id: string;
  project_name: string;
  fte_cost: string;
  sub_con_cost: string;
  non_labour_cost: string;
  project_cost: string;
  rd_percentage: string;
  project_qre: string;
  rd_credit: string;
};

export interface ProjectSummaryListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    projectSummary: ProjectSummaryItem[];
  };
}

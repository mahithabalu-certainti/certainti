export interface ResourceListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
}

export type ResourceList = {
  rid: string;
  r_number: string;
  resource_ref_id: string;
  resource_fullname: string;
  resource_type: string;
  resource_status: string;
};

export type ResourcesData = {
  resources: ResourceList[];
  count: number;
};

export type ResourcesListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ResourcesData;
};

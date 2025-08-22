import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api, resourceServiceApi } from '../../../api/api';
import { UploadImportPayload } from '../../../common-service';
import {
  FailureType,
  ImportDetailsResponse,
  ImportEntityType,
  ImportListResponse,
  ImportsDetails,
  ImportsList,
  ImportsListURLParams,
} from '../../types/imports';
import { uploadUrl } from '../urls';
import { TimesheetProjectExportListURLParams, TimesheetProjectList, TimesheetProjectTableListResponse, TimesheetProjectTableListURLParams, TimesheetResourceListType, TimesheetResourceTableListResponse, } from '../../types/timesheet-projects';

import { TimesheetDetails, TimesheetDetailsResponse, TimeSheetList, TImesheetListResponse, TimeSheetListURLParams } from '../../types';
import { ProjectTaskApiResponse, ProjectTaskListType } from '../../types/project-task';

const getImportDetailsURL = (accountId: string, fileId: string) => {
  return `/api/import/list/${accountId}/${fileId}`;
};

const getImportFailureURL = (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: string
) => {
  return `/api/import/export/${failureType}/${accountId}/${fileId}/${entityType}`;
};

export const uploadImportFile = async (payload: UploadImportPayload) => {
  const response = await api.post(uploadUrl(), payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};

export const fetchImportList = async (
  params: ImportsListURLParams
): Promise<{ imports: ImportsList[]; count: number }> => {
  const response = await resourceServiceApi.post<ImportListResponse>(
    '/api/import/list',
    params
  );
  return {
    imports: response.data.data.imports,
    count: response.data.data.total_count || response.data.data.count || 0,
  };
};

export const useImportListList = (
  params: ImportsListURLParams,
  shouldFetchList: boolean,
  refreshImports?: number
): UseQueryResult<{ imports: ImportsList[]; count: number }, Error> => {
  return useQuery<{ imports: ImportsList[]; count: number }, Error>({
    queryKey: ['importList', params, refreshImports],
    queryFn: () => fetchImportList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!shouldFetchList,
  });
};

export const fetchTimeSheetList = async (
  params: TimeSheetListURLParams
): Promise<{ imports: TimeSheetList[]; count: number }> => {
  const response = await resourceServiceApi.post<TImesheetListResponse>(
    '/api/timesheet/list',
    params
  );
  return {
    imports: response.data.data.imports,
    count: response.data.data.total_count || response.data.data.count || 0,
  };
};

export const useTimesheetList = (
  params: TimeSheetListURLParams,
  shouldFetchList: boolean,
  refreshImports?: number
): UseQueryResult<{ imports: TimeSheetList[]; count: number }, Error> => {
  return useQuery<{ imports: TimeSheetList[]; count: number }, Error>({
    queryKey: ['timesheetList', params, refreshImports],
    queryFn: () => fetchTimeSheetList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!shouldFetchList,
  });
};

const fetchImportDetails = async (
  accountId: string,
  fileId: string
): Promise<ImportsDetails> => {
  const response = await resourceServiceApi.get<ImportDetailsResponse>(
    getImportDetailsURL(accountId, fileId)
  );
  return response.data.data.imports;
};

export const useImportDetails = (
  accountId?: string,
  fileId?: string
): UseQueryResult<ImportsDetails | undefined, Error> => {
  return useQuery<ImportsDetails | undefined, Error>({
    queryKey: ['importDetails', accountId, fileId],
    queryFn: () => fetchImportDetails(accountId!, fileId!),
    enabled: !!fileId && !!accountId,
    retry: 0,
    gcTime: 0,
  });
};

const fetchTimesheetDetails = async (
  accountId: string,
  fileId: string
): Promise<TimesheetDetails> => {
  const response = await resourceServiceApi.get<TimesheetDetailsResponse>(
    `/api/timesheet/list/${accountId}/${fileId}`
  );
  return response.data.data.imports;
};

export const useTimesheetDetails = (
  accountId?: string,
  fileId?: string
): UseQueryResult<TimesheetDetails | undefined, Error> => {
  return useQuery<TimesheetDetails | undefined, Error>({
    queryKey: ['timesheetDetails', accountId, fileId],
    queryFn: () => fetchTimesheetDetails(accountId!, fileId!),
    enabled: !!fileId && !!accountId,
    retry: 0,
    gcTime: 0,
  });
};

export const exportImportsData = async (params: ImportsListURLParams) => {
  try {
    const response = await resourceServiceApi.post(
      '/api/import/list/export',
      params
    );
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'all_imports_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const exportTimesheetData = async (params: TimeSheetListURLParams) => {
  try {
    const response = await resourceServiceApi.post(
      '/api/timesheet/list/export',
      params
    );
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'all_timesheet_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const downloadBase64File = async (
  url: string,
  filename: string = 'export.xlsx'
) => {
  try {
    const response = await resourceServiceApi.get(url);
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const downloadImportFailureData = async (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: ImportEntityType
) => {
  const url = getImportFailureURL(accountId, fileId, failureType, entityType);
  await downloadBase64File(url, `${failureType}_failures.xlsx`);
};

const getTimesheetFailureURL = (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: string
) => {
  return `/api/timesheet/export/${failureType}/${accountId}/${fileId}/${entityType}`;
};

export const downloadTimesheetFailureData = async (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: ImportEntityType
) => {
  const url = getTimesheetFailureURL(
    accountId,
    fileId,
    failureType,
    entityType
  );
  await downloadBase64File(url, `${failureType}_failures.xlsx`);
};

// Timesheet view project tab table
export const useTimesheetProjectTableList = (
  params: TimesheetProjectTableListURLParams,
  shouldFetchList: boolean,
  refreshProject?: number
): UseQueryResult<{ timesheet_projects: TimesheetProjectList[]; count: number }, Error> => {
  return useQuery<{ timesheet_projects: TimesheetProjectList[]; count: number }, Error>({
    queryKey: ['timesheetProjectList', params, refreshProject],
    queryFn: () => fetchTimesheetProjectTableList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.documentRid && !!shouldFetchList,
  });
};

export const fetchTimesheetProjectTableList = async (
  params: TimesheetProjectTableListURLParams
): Promise<{ timesheet_projects: TimesheetProjectList[]; count: number }> => {
  const response = await resourceServiceApi.get<TimesheetProjectTableListResponse>(
    TimesheetProjectURL(params)
  );
  return {
    timesheet_projects: response?.data?.data?.projects || [],
    count: response?.data?.data?.totalCount || 0,
  };
};
export const getTimesheetProjectUrl = (
  account_rid: string,
) => `/api/timesheet/importedProjects/${account_rid}`;

const returnTimesheetProjectURL = (baseURL: string, params: Record<string, string | number | undefined | object>): string => {
  const { page, limit, sort, sort_by, filters, fiscalYear, bothParentAndChild, documentRid, } = params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sort) searchParams.set('sortBy', String(sort));
  if (sort_by) searchParams.set('sortOrder', String(sort_by));
  if (fiscalYear) searchParams.set('fiscalYear', String(fiscalYear));

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (bothParentAndChild !== undefined) {
    searchParams.set("bothParentAndChild", String(bothParentAndChild));
  }

  if (documentRid) {
    searchParams.set('documentRid', String(documentRid));
  }
  return `${baseURL}/?${searchParams.toString()}`;
};
export const TimesheetProjectURL = ({
  page,
  limit,
  sort,
  sort_by,
  filters,
  fiscalYear,
  account_rid,
  bothParentAndChild,
  documentRid,
}: TimesheetProjectTableListURLParams): string => {
  const base = getTimesheetProjectUrl(account_rid ?? '');
  return returnTimesheetProjectURL(base, {
    page,
    limit,
    sort,
    sort_by,
    filters,
    fiscalYear,
    bothParentAndChild: bothParentAndChild ? "true" : "false",
    documentRid,
  });
};
// Timesheet project export api
export const getExportTimesheetProjectUrl = (
  account_rid: string,
) => `/api/timesheet/export/importedProjects/${account_rid}`;
const exportProjectURL = (baseURL: string, params: Record<string, string | number | undefined | object>): string => {

  const { page, limit, sort, sort_by, filters, fiscalYear, bothParentAndChild, documentRid, } = params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sort) searchParams.set('sortBy', String(sort));
  if (sort_by) searchParams.set('sortOrder', String(sort_by));
  if (fiscalYear) searchParams.set('fiscalYear', String(fiscalYear));

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (bothParentAndChild !== undefined) {
    searchParams.set("bothParentAndChild", String(bothParentAndChild));
  }

  if (documentRid) {
    searchParams.set('documentRid', String(documentRid));
  }
  return `${baseURL}/?${searchParams.toString()}`;
};
export const exportTimesheetProjectURL = ({
  sortOrder,
  sortBy,
  filters,
  fiscalYear,
  account_rid,
  bothParentAndChild,
  documentRid,
}: TimesheetProjectExportListURLParams): string => {
  const base = getExportTimesheetProjectUrl(account_rid ?? '');
  return exportProjectURL(base, {
    sortOrder,
    sortBy,
    filters,
    fiscalYear,
    bothParentAndChild: bothParentAndChild ? "true" : "false",
    documentRid,
  });
};
export const exportTimesheetProjectData = async (params: TimesheetProjectExportListURLParams) => {
  try {
    const response = await resourceServiceApi.get(
      exportTimesheetProjectURL(params)
    );
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'timesheet_project_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

// Timesheet view Resource tab table
export const useTimesheetResourceTableList = (
  params: TimesheetProjectTableListURLParams,
  shouldFetchList: boolean,
  refreshResource?: number
): UseQueryResult<{ timesheet_resources: TimesheetResourceListType[]; count: number }, Error> => {
  return useQuery<{ timesheet_resources: TimesheetResourceListType[]; count: number }, Error>({
    queryKey: ['timesheetResourceList', params, refreshResource],
    queryFn: () => fetchTimesheetResourceTableList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.documentRid && !!shouldFetchList,
  });
};

export const fetchTimesheetResourceTableList = async (
  params: TimesheetProjectTableListURLParams
): Promise<{ timesheet_resources: TimesheetResourceListType[]; count: number }> => {
  const response = await resourceServiceApi.get<TimesheetResourceTableListResponse>(
    TimesheetProjectResourcesURL(params),
  );
  return {
    timesheet_resources: response.data.data.resources || [],
    count: response.data.data.count || 0,
  };
};

export const getProjectResourcesUrl = (
  account_rid: string,
) => `/api/timesheet/importedResources/${account_rid}`;

const returnURL = (baseURL: string, params: Record<string, string | number | undefined | object>): string => {
  const { page, limit, sort, sort_by, filters, documentRid } = params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sort) searchParams.set('sortBy', String(sort));
  if (sort_by) searchParams.set('sortOrder', String(sort_by));

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (documentRid) {
    searchParams.set('documentRid', String(documentRid));
  }
  return `${baseURL}/?${searchParams.toString()}`;
};
export const TimesheetProjectResourcesURL = ({
  page,
  limit,
  sort,
  sort_by,
  filters,
  // fiscalYear,
  account_rid,
  documentRid,
}: TimesheetProjectTableListURLParams): string => {
  const base = getProjectResourcesUrl(account_rid ?? '');
  return returnURL(base, {
    page,
    limit,
    sort,
    sort_by,
    filters,
    // fiscalYear,
    documentRid
  });
};
// Timesheet resources export api
export const exportTimesheetResourceData = async (params: TimesheetProjectExportListURLParams) => {
  try {
    const response = await resourceServiceApi.get(exportTimesheetResourcesURL(params));
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'timesheet_resource_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const getExportTimesheetResourcesUrl = (
  account_rid: string,
) => `/api/timesheet/export/importedResources/${account_rid}`;

const returnExportResourcesURL = (baseURL: string, params: Record<string, string | number | undefined | object>): string => {

  const { sort, sort_by, filters, documentRid, } = params;

  const searchParams = new URLSearchParams();

  if (sort) searchParams.set('sortBy', String(sort));
  if (sort_by) searchParams.set('sortOrder', String(sort_by));

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (documentRid) {
    searchParams.set('documentRid', String(documentRid));
  }
  return `${baseURL}/?${searchParams.toString()}`;
};

export const exportTimesheetResourcesURL = ({
  sortOrder,
  sortBy,
  filters,
  account_rid,
  documentRid,
}: TimesheetProjectExportListURLParams): string => {
  const base = getExportTimesheetResourcesUrl(account_rid ?? '');
  return returnExportResourcesURL(base, {
    sortOrder,
    sortBy,
    filters,
    documentRid,
  });
};

// Timesheet view Project Task tab table
export const useTimesheetProjectTaskList = (
  params: TimesheetProjectTableListURLParams,
  shouldFetchList: boolean,
  refreshProjectTask?: number
): UseQueryResult<{ timesheet_project_task: ProjectTaskListType[]; count: number }, Error> => {
  return useQuery<{ timesheet_project_task: ProjectTaskListType[]; count: number }, Error>({
    queryKey: ['timesheetProjectTask', params, refreshProjectTask],
    queryFn: () => fetchTimesheetProjectTaskList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.documentRid && !!shouldFetchList,
  });
};

export const fetchTimesheetProjectTaskList = async (
  params: TimesheetProjectTableListURLParams
): Promise<{ timesheet_project_task: ProjectTaskListType[]; count: number }> => {
  const response = await resourceServiceApi.get<ProjectTaskApiResponse>(
    TimesheetProjectTaskURL(params),
  );
  return {
    timesheet_project_task: response.data.data.tasks || [],
    count: response.data.data.totalCount || 0,
  };
};

export const getProjectTaskUrl = (
  account_rid: string,
) => `/api/timesheet/importedProjectTasks/${account_rid}`;

const returnTimesheetProjectTaskURL = (baseURL: string, params: Record<string, string | number | undefined | object>): string => {
  const { page, limit, sort, sort_by, filters, documentRid } = params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sort) searchParams.set('sortBy', String(sort));
  if (sort_by) searchParams.set('sortOrder', String(sort_by));

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (documentRid) {
    searchParams.set('documentRid', String(documentRid));
  }
  return `${baseURL}/?${searchParams.toString()}`;
};
export const TimesheetProjectTaskURL = ({
  page,
  limit,
  sort,
  sort_by,
  filters,
  // fiscalYear,
  account_rid,
  documentRid,
}: TimesheetProjectTableListURLParams): string => {
  const base = getProjectTaskUrl(account_rid ?? '');
  return returnTimesheetProjectTaskURL(base, {
    page,
    limit,
    sort,
    sort_by,
    filters,
    // fiscalYear,
    documentRid
  });
};

// Timesheet resources export api
export const exportTimesheetTaskData = async (params: TimesheetProjectExportListURLParams) => {
  try {
    const response = await resourceServiceApi.get(exportTimesheetTaskURL(params));
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'timesheet_task_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const getExportTimesheetTaskUrl = (
  account_rid: string,
) => `/api/timesheet/export/importedProjectTasks/${account_rid}`;

const returnExportTaskURL = (baseURL: string, params: Record<string, string | number | undefined | object>): string => {

  const { sortOrder, sortBy, filters, documentRid, } = params;

  const searchParams = new URLSearchParams();

  if (sortOrder) searchParams.set('sortOrder', String(sortOrder));
  if (sortBy) searchParams.set('sortBy', String(sortBy));

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (documentRid) {
    searchParams.set('documentRid', String(documentRid));
  }
  return `${baseURL}/?${searchParams.toString()}`;
};

export const exportTimesheetTaskURL = ({
  sortOrder,
  sortBy,
  filters,
  account_rid,
  documentRid,
}: TimesheetProjectExportListURLParams): string => {
  const base = getExportTimesheetTaskUrl(account_rid ?? '');
  return returnExportTaskURL(base, {
    sortOrder,
    sortBy,
    filters,
    documentRid,
  });
};
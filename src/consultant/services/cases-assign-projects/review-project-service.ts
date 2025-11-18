import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ReviewListProject,
  ReviewListResponse,
  ReviewProjectExportParams,
  ReviewProjectListURLParams,
} from '../../types/assign-projects';
import { caseServiceApi } from '../../../api/api';
import { ExportCaseListResponse } from '../../types';

export const getReviewProjectListURL = (
  {
    page,
    sortBy,
    sortOrder,
    filters,
    limit,
    fiscalYear,
    search,
  }: ReviewProjectListURLParams,
  accountId?: string,
  caseId?: string
): string => {
  const baseUrl = `/api/cases/reviewProjects/${accountId}/${caseId}`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear !== undefined && fiscalYear !== null) {
    searchParams.set('fiscal_year', fiscalYear.toString());
  }

  // Only add filters if present
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const fetchReviewProjectList = async (
  params: ReviewProjectListURLParams,
  accountId?: string,
  caseId?: string
): Promise<{ reviewProject: ReviewListProject[]; count: number }> => {
  const { data } = await caseServiceApi.get<ReviewListResponse>(
    getReviewProjectListURL(params, accountId, caseId)
  );
  console.log(data.data, 'data in api');
  return {
    reviewProject: data?.data?.reviewProjects,
    count: data.data.count,
  };
};

export const useReviewProjectList = (
  params: ReviewProjectListURLParams,
  accountId?: string,
  caseId?: string,
  refresh?: number
): UseQueryResult<
  { reviewProject: ReviewListProject[]; count: number },
  Error
> => {
  return useQuery<{ reviewProject: ReviewListProject[]; count: number }, Error>(
    {
      queryKey: ['case-list', params, accountId, refresh],
      queryFn: () => fetchReviewProjectList(params, accountId, caseId),
      retry: 0,
      gcTime: 0,
      enabled: !!accountId,
    }
  );
};

export const getCaseExportListURL = (
  {
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
    globalFilters,
    timezone,
    search,
  }: ReviewProjectExportParams,
  accountId?: string,
  caseId?: string
): string => {
  const baseUrl = `/api/cases/exportReviewProjects/${accountId}/${caseId}`;

  const searchParams = new URLSearchParams();
  if (fiscalYear !== undefined && fiscalYear !== null) {
    searchParams.set('fiscal_year', fiscalYear.toString());
  }
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (search) {
    searchParams.set('search', search);
  }
  if (timezone) searchParams.set('timezone', timezone);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const ExportReviewProjectList = async (
  params: ReviewProjectExportParams,
  accountId?: string,
  caseId?: string
): Promise<void> => {
  try {
    const filename = `review_projects_list.xlsx`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response = await caseServiceApi.get<ExportCaseListResponse>(
      getCaseExportListURL({ ...params, timezone }, accountId, caseId)
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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

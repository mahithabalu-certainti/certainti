import { ProjectListParams } from '../../types/project';

export const ProjectListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  accountNumber,
  globalFilters,
  bothParentAndChild,
}: ProjectListParams): string => {
  const baseUrl = `/api/project/list${accountNumber ? `/${accountNumber}` : ''}`;
  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', page.toString());
  if (limit !== undefined) searchParams.set('limit', limit.toString());
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (bothParentAndChild !== undefined) {
    searchParams.set('bothParentAndChild', bothParentAndChild.toString());
  }
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const ProjectDetailUrl = (projectId: string, accountId: string) =>
  `/api/project/list/${projectId}/${accountId}`;

export const ProjectCreateUrl = '/api/project/new';
export const ProjectUpdateUrl = '/api/project/update';

export const ProjectExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  accountNumber,
  globalFilters,
  timezone,
  bothParentAndChild,
}: ProjectListParams): string => {
  const baseUrl = accountNumber
    ? `/api/project/export${accountNumber ? `/${accountNumber}` : ''}`
    : `/api/project/list/export`;
  const searchParams = new URLSearchParams();

  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (bothParentAndChild !== undefined) {
    searchParams.set('bothParentAndChild', bothParentAndChild.toString());
  }
  if (timezone !== undefined) searchParams.set('timezone', timezone);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// export const ProjectTriggerAIUrl = '/api/interactions/triggerAi';

export const ProjectTriggerAIUrl = (): string => {
  return '/api/interactions/triggerAi';
};

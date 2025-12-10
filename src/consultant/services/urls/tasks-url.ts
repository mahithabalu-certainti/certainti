import { TasksListExportParams, TasksListURLParams } from '../../types/task';

export const TasksListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  globalFilters,
  // isGlobal,
  search,
}: TasksListURLParams) => {
  let baseUrl = '';
  const searchParams = new URLSearchParams();

  const isMilestone =
    filters &&
    (filters as { attachment_level?: string }).attachment_level === 'milestone';

  if (isMilestone) {
    baseUrl = '/api/task/list/summaryMilestone';
    searchParams.set('flag', 'milestone');
  } else {
    baseUrl = '/api/task/list/summaryActivity';
    searchParams.set('flag', 'activity');
  }

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());

  let filtersToSend = filters ? { ...filters } : {};
  const { attachment_level, ...rest } = filtersToSend as {
    attachment_level?: string;
  };
  filtersToSend = rest;

  if (filtersToSend && Object.keys(filtersToSend).length > 0) {
    searchParams.set('filters', JSON.stringify(filtersToSend));
  }
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const TasksExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  globalFilters,
  timezone,
  search,
}: TasksListExportParams): string => {
  const baseUrl = `/api/task/list/summary/export`;
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
  if (timezone !== undefined) searchParams.set('timezone', timezone);
  if (search) {
    searchParams.set('search', search);
  }
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

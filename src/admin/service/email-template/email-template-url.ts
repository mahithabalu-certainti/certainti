import { EmailTemplateListParams } from '../../types';

export const getEmailTemplateListUrl = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  searchTerm,
}: EmailTemplateListParams) => {
  const baseUrl = `/api/caseManagement/emailTemplate/list`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (searchTerm) {
    searchParams.set('search', searchTerm);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const getEmailTemplateExportUrl = ({
  sortBy,
  sortOrder,
  filters,
  timezone,
  searchTerm,
}: EmailTemplateListParams): string => {
  const baseUrl = `/api/caseManagement/emailTemplate/export`;
  const searchParams = new URLSearchParams();

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);

  if (searchTerm) {
    searchParams.set('search', searchTerm);
  }
  if (timezone !== undefined) searchParams.set('timezone', timezone);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

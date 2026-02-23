import {
  FourPartAssessmentListURLParams,
  FourPartAssessmentListExportURLParams,
} from '../../types';

export const FourPartAssessmentListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  entityId,
  accountRid,
  attachmentLevel,
  search,
}: FourPartAssessmentListURLParams) => {
  const baseUrl = `/api/four-part-assessment/list`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  if (attachmentLevel !== undefined) {
    searchParams.set('attachmentLevel', attachmentLevel);
  }
  if (entityId !== undefined) {
    searchParams.set('entityId', entityId);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }
  if (fiscalYear !== undefined) {
    searchParams.set('fiscalYear', fiscalYear.toString());
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const getFourPartAssessmentExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  timezone,
  entityId,
  accountRid,
  attachmentLevel,
  search,
  fiscalYear,
}: FourPartAssessmentListExportURLParams): string => {
  const baseUrl = '/api/four-part-assessment/export';
  const searchParams = new URLSearchParams();

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);

  if (attachmentLevel !== undefined) {
    searchParams.set('attachmentLevel', attachmentLevel.toString());
  }
  if (entityId !== undefined) {
    searchParams.set('entityId', entityId.toString());
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid.toString());
  }
  if (fiscalYear !== undefined) {
    searchParams.set('fiscalYear', fiscalYear.toString());
  }
  if (search) {
    searchParams.set('search', search);
  }
  if (timezone !== undefined) searchParams.set('timezone', timezone);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

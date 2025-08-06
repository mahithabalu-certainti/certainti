import {
  AttachmentsListExportParams,
  AttachmentsListURLParams,
} from '../../types/attachment';

export const AttachmentListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  globalFilters,
  attachmentLevel,
  entityId,
  accountRid,
  isGlobal,
}: AttachmentsListURLParams) => {
  const baseUrl = `/api/attachment/list${isGlobal ? `/summary` : ''}`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (attachmentLevel !== undefined) {
    searchParams.set('attachmentLevel', attachmentLevel);
  }
  if (entityId !== undefined) {
    searchParams.set('entityId', entityId);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const uploadAttachmentUrl = () => `/api/attachment/upload/attachment`;

export const AttachmentExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  globalFilters,
  timezone,
  entityId,
  accountRid,
  attachmentLevel,
}: AttachmentsListExportParams): string => {
  const baseUrl = attachmentLevel
    ? `/api/attachment/list/export`
    : `/api/attachment/list/summary/export`;
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
  if (attachmentLevel !== undefined) {
    searchParams.set('attachmentLevel', attachmentLevel.toString());
  }
  if (entityId !== undefined) {
    searchParams.set('entityId', entityId.toString());
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid.toString());
  }
  if (timezone !== undefined) searchParams.set('timezone', timezone);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

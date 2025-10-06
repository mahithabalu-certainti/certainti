import { NotesListExportParams, NotesListURLParams } from '../../types';

export const NotesListURL = ({
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
  search,
}: NotesListURLParams) => {
  const baseUrl = `/api/notes/list${isGlobal ? `/summary` : ''}`;
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
  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const createNoteUrl = () => `/api/notes/upload/note`;
export const updateNoteUrl = () => `/api/notes/upload/note`;

export const NoteExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  globalFilters,
  timezone,
  entityId,
  accountRid,
  attachmentLevel,
  isGlobal,
  search,
}: NotesListExportParams): string => {
  const baseUrl = isGlobal
    ? `/api/notes/list/summary/export`
    : `/api/notes/list/export`;
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
  if (search) {
    searchParams.set('search', search);
  }
  if (timezone !== undefined) searchParams.set('timezone', timezone);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

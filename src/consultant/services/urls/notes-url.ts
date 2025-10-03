import { NotesListURLParams } from '../../types';

export const NotesListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  globalFilters,
  noteLevel,
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
  if (noteLevel !== undefined) {
    searchParams.set('noteLevel', noteLevel);
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

import { ProjectDocumentsListURLParams } from '../../types';

export const ProjectDocumentListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  accountRid,
  caseRid,
  search,
}: ProjectDocumentsListURLParams) => {
  const baseUrl = `/api/project-documents/list`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (caseRid !== undefined) {
    searchParams.set('caseRid', caseRid);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
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

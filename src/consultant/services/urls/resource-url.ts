import { ResourceListURLParams } from '../../types/resource';

export const ResourceListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
}: ResourceListURLParams): string => {
  const baseUrl = '/api/resource/';
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

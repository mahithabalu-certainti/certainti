import { ResourceListURLParams } from '../../types/resource';

const baseUrl = import.meta.env.VITE_RESOURCE_URL;

export const ResourceCreateURL = `${baseUrl}/api/resources/new`;
export const ResourceUpdateURL = `${baseUrl}/api/resources/update`;
export const ResourceDetailURL = (resourceId: string, accountNumber: string) =>
  `${baseUrl}/api/resources/list/${accountNumber}/${resourceId}`;

export const ResourceListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  accountNumber,
}: ResourceListURLParams) => {
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  searchParams.set('limit', limit.toString());
  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseUrl}/api/resources/list/${accountNumber}/?${searchParams.toString()}`;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ProjectResourcesListParams } from '../../types/project-task';

// export const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const projectResourcesUrl = 'api/project-resources/list';
const returnURL = (
  _projectResourcesUrl: string, // url: string,
  params: Record<string, any>
): string => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    // accountNumber,
    fiscalYear,
    // resourceRid,
  } = params;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);
  //   searchParams.set('accountNumber', accountNumber);
  //   if (resourceRid) {
  //     searchParams.set('resourceRid', resourceRid);
  //   }
  if (fiscalYear) {
    searchParams.set('fiscalYear', fiscalYear);
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  return '';
  // return `${baseUrl}/${url}?${searchParams.toString()}`;
};
export const ProjectResourcesURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  // accountNumber,
  fiscalYear,
  // resourceRid,
}: ProjectResourcesListParams): string => {
  return returnURL(projectResourcesUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    //   accountNumber,
    fiscalYear,
    //   resourceRid,
  });
};

export const DetailURL = (resourceId: string, projectNumber: string) => {
  console.log(resourceId, projectNumber);
  return '';
  // return `${baseUrl}/api/resources/list/${accountNumber}/${resourceId}`;
};

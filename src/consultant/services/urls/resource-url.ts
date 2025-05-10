import { ResourceListURLParams } from '../../types/resource';
import { ExportModule } from '../../types/resource-skill';

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
  fiscalYear,
}: ResourceListURLParams) => {
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  searchParams.set('limit', limit.toString());
  searchParams.set('fiscalYear', fiscalYear.toString());
  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseUrl}/api/resources/list/${accountNumber}/?${searchParams.toString()}`;
};
export const ExportResourcelUrl = ({
  sortBy,
  sortOrder,
  fiscalYear,
  rNumber
}: ExportModule): string => {
  const baseUrl = `entityService/api/resources/export/${rNumber}/`;
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear !== undefined) searchParams.set('fiscalYear', fiscalYear);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const SKILLTYPEURL = `${baseUrl}/api/resource_skill/skilltypes`;
export const SkillSubTypeUrl = (skillType : string | null) => `${baseUrl}/api/resource_skill/skillsubtypes?skillTypeRid=${skillType}`;
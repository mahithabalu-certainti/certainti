/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceCostListParams } from '../../types/resource-cost';
import {
  ExportModule,
  ResourceSkillListParams,
} from '../../types/resource-skill';

export const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const resourceCostUrl = 'api/resource_cost/list';
export const createResourceCost = 'api/resource_cost/create';
export const updateResourceCost = 'api/resource_cost/update';
export const resourceSkillUrl = 'api/resource_skill/list';

const returnURL = (url: string, params: Record<string, any>): string => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
    fiscalYear,
    resourceRid,
    search,
  } = params;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);
  searchParams.set('accountNumber', accountNumber);
  if (resourceRid) {
    searchParams.set('resourceRid', resourceRid);
  }
  if (fiscalYear) {
    searchParams.set('fiscalYear', fiscalYear);
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}/${url}?${searchParams.toString()}`;
};
const returnCostIdURL = (url: string, params: Record<string, any>): string => {
  const { accountNumber, id } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('accountNumber', accountNumber);
  // searchParams.set('id', id );

  return `${baseUrl}/${url}/${id}?${searchParams.toString()}`;
};
const returnSkillIdURL = (url: string, params: Record<string, any>): string => {
  const { accountNumber, rid } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('accountNumber', accountNumber);
  searchParams.set('rid', rid);
  // searchParams.set('id', id );

  return `${baseUrl}/${url}/?${searchParams.toString()}`;
};

export const costListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  accountNumber,
  fiscalYear,
  resourceRid,
  search,
}: ResourceCostListParams): string => {
  return returnURL(resourceCostUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
    fiscalYear,
    resourceRid,
    search,
  });
};

export const fetchResourceCostByIdUrl = ({
  id,
  accountNumber,
}: ResourceCostListParams): string => {
  return returnCostIdURL(resourceCostUrl, {
    id,
    accountNumber,
  });
};
export const fetchResourceSkillByIdUrl = ({
  rid,
  accountNumber,
}: ResourceSkillListParams): string => {
  return returnSkillIdURL(resourceSkillUrl, {
    rid,
    accountNumber,
  });
};

export const skillListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  accountNumber,
  resourceRid,
  search,
}: ResourceSkillListParams): string => {
  return returnURL(resourceSkillUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
    resourceRid,
    search,
  });
};
export const ExportResourceCostUrl = ({
  sortBy,
  sortOrder,
  fiscalYear,
  rNumber,
  resourceRid,
  filter,
  search,
}: ExportModule): string => {
  const baseUrl = '/entityService/api/resource_cost/export';
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (rNumber !== undefined) searchParams.set('accountNumber', rNumber);
  if (fiscalYear !== undefined) searchParams.set('fiscalYear', fiscalYear);
  if (filter !== undefined) searchParams.set('filters', JSON.stringify(filter));
  if (resourceRid !== undefined) searchParams.set('resourceRid', resourceRid);
  if (search) searchParams.set('search', search);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
export const ExportResourceSkillUrl = ({
  sortBy,
  sortOrder,
  fiscalYear,
  rNumber,
  filter,
  resourceRid,
  search,
}: ExportModule): string => {
  const baseUrl = '/entityService/api/resource_skill/export';
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (rNumber !== undefined) searchParams.set('accountNumber', rNumber);
  if (fiscalYear !== undefined) searchParams.set('fiscalYear', fiscalYear);
  if (filter !== undefined) searchParams.set('filters', JSON.stringify(filter));
  if (resourceRid !== undefined) searchParams.set('resourceRid', resourceRid);
  if (search) searchParams.set('search', search);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

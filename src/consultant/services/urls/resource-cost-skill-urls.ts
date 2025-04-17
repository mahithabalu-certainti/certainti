import { ResourceCostListParams } from '../../types/resource-cost';
import { ResourceSkillListParams } from '../../types/resource-skill';

const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const resourceCostUrl = '/api/resource_cost/';
export const resourceCostById = '/api/resource_cost/resourcecost/by/id';
export const createResourceCost = '/api/resource_cost/create';
export const updateResourceCost = '/api/resource_cost/update';
export const resourceSkillUrl = '/api/resource_skill';

const returnURL = (url: string, params: Record<string, any>): string => {
  const { page, limit, sortBy, sortOrder, filters, accountNumber } = params;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);
  searchParams.set('accountNumber', accountNumber);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseUrl}/${url}?${searchParams.toString()}`;
};

export const costListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  accountNumber,
}: ResourceCostListParams): string => {
  return returnURL(resourceCostUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
  });
};

export const fetchResourceCostByIdUrl = ({
  id,
  accountNumber,
}: ResourceCostListParams): string => {
  return returnURL(resourceCostById, {
    id,
    accountNumber,
  });
};
export const fetchResourceSkillByIdUrl = ({
  rid,
  accountNumber,
}: ResourceSkillListParams): string => {
  return returnURL(resourceSkillUrl, {
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
}: ResourceSkillListParams): string => {
  return returnURL(resourceSkillUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
  });
};

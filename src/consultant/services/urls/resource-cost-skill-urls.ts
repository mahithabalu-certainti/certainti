import { ResourceCostListParams } from '../../types/resource-cost';
import { ResourceSkillListParams } from '../../types/resource-skill';

export const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const resourceCostUrl = 'api/resource_cost/list';
export const createResourceCost = 'api/resource_cost/create';
export const updateResourceCost = 'api/resource_cost/update';
export const resourceSkillUrl = 'api/resource_skill/list';

const returnURL = (url: string, params: Record<string, any>): string => {
  const { page, limit, sortBy, sortOrder, filters, accountNumber, fiscalYear } = params;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);
  searchParams.set('accountNumber', accountNumber);
  searchParams.set('fiscalYear', fiscalYear);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
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

export const costListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  accountNumber,
  fiscalYear,
}: ResourceCostListParams): string => {
  return returnURL(resourceCostUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
    fiscalYear
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
  fiscalYear
}: ResourceSkillListParams): string => {
  return returnURL(resourceSkillUrl, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    accountNumber,
    fiscalYear
  });
};

import { FilterState, globalFilters } from '../consultant/types';

interface StoredFilter {
  userId: string;
  filters: FilterState;
  fiscalYear: string;
}

const FILTERS_KEY = 'global_filters';

const DEFAULT_FILTERS: FilterState = [];
const DEFAULT_FISCAL_YEAR = 'FY-All';

export const saveFiltersToStorage = (
  userId: string,
  filters: FilterState,
  fiscalYear: string
): void => {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    const all: StoredFilter[] = raw ? JSON.parse(raw) : [];

    const index = all.findIndex((item) => item.userId === userId);
    if (index !== -1) {
      all[index].filters = filters;
      all[index].fiscalYear = fiscalYear;
    } else {
      all.push({ userId, filters, fiscalYear });
    }

    localStorage.setItem(FILTERS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error:', e);
  }
};

export const getFiltersFromStorage = (
  userId: string
): { filters: FilterState; fiscalYear: string } => {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw)
      return { filters: DEFAULT_FILTERS, fiscalYear: DEFAULT_FISCAL_YEAR };

    const all: StoredFilter[] = JSON.parse(raw);
    const userEntry = all.find((item) => item.userId === userId);

    return {
      filters: userEntry?.filters ?? DEFAULT_FILTERS,
      fiscalYear: userEntry?.fiscalYear ?? DEFAULT_FISCAL_YEAR,
    };
  } catch (e) {
    console.error('Error:', e);
    return { filters: DEFAULT_FILTERS, fiscalYear: DEFAULT_FISCAL_YEAR };
  }
};

export const reshapeGlobalFilter = (filters: FilterState) => {
  const globalFilters: globalFilters = {};
  filters.forEach((item) => {
    globalFilters[item.account] = item.child;
  });
  return Object.keys(globalFilters).length > 0 ? globalFilters : undefined; // for avoiding empty params
};

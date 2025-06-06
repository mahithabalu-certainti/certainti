import { FilterState } from './filterType';
import { ResetFilter } from '../../../../types/resource';

export const resetFilter = ({
  setAppliedFilters,
  setFilterStates,
  setSelectedFilters,
  onFilterStatesChange,
  onSelectedFiltersChange,
}: ResetFilter) => {
  setAppliedFilters({});
  setFilterStates({});
  setSelectedFilters([]);
  if (onFilterStatesChange) {
    onFilterStatesChange({});
  }

  if (onSelectedFiltersChange) {
    onSelectedFiltersChange([]);
  }
};

export const getStoredFilters = (filterKey: string): FilterState | null => {
  const raw = localStorage.getItem(filterKey);
  if (!raw) return null;

  try {
    const parsed: FilterState = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
};

export const storeFilters = (filter: FilterState, filterKey: string) => {
  try {
    localStorage.setItem(filterKey, JSON.stringify(filter));
  } catch {
    console.error('Error storing filters in localStorage');
  }
};

export const clearFilters = (filterKey: string) => {
  try {
    localStorage.removeItem(filterKey);
  } catch {
    console.error('Error clearing filters from localStorage');
  }
};

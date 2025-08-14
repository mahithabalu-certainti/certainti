import { FieldConfig, FilterState, FilterValue } from './filterType';
import { ResetFilter } from '../../../../types/resource';

function formatString(str: string | undefined): string {
  if (!str) return '';
  return str
    .split('_') // split on underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
    .join(' ');
}

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

export const validateFilters = (
  filters: Record<string, FilterState>
): boolean => {
  let hasInvalid = false;

  for (const key in filters) {
    const state = filters[key];

    if (state.text) {
      const { option, value } = state.text;
      const isEmptyCheck = formatString(option) === 'Is Empty';

      if (!isEmptyCheck) {
        const isEmpty = !value.trim();
        if (isEmpty) hasInvalid = true;
      }
    }

    if (state.textCostAndSkill) {
      const { option, value } = state.textCostAndSkill;
      const isEmptyCheck = formatString(option) === 'Is Empty';

      if (!isEmptyCheck) {
        const isEmpty = !value.trim();
        if (isEmpty) hasInvalid = true;
      }
    }

    if (state.number) {
      const { option, value } = state.number;
      if (formatString(option) !== 'Is Empty') {
        if (formatString(option) === 'Between') {
          if (!value?.from?.trim() || !value?.to?.trim()) {
            hasInvalid = true;
          }
        } else {
          if (!value?.from?.trim()) {
            hasInvalid = true;
          }
        }
      }
    }

    if (state.enum) {
      const { option, value } = state.enum;
      const requiresValue = formatString(option) !== 'Is Empty';
      const isEmptyArray = !value || value.length === 0;

      if (requiresValue && isEmptyArray) {
        hasInvalid = true;
      }
    }

    if (state.currencySelect) {
      const { option, value } = state.currencySelect;
      const requiresValue = formatString(option) !== 'Is Empty';
      const isEmptyArray = !value || value.length === 0;

      if (requiresValue && isEmptyArray) {
        hasInvalid = true;
      }
    }

    if (state.date) {
      const { option, value } = state.date;
      const isEmptyCheck = formatString(option) === 'Is Empty';
      const fromEmpty = !value?.from?.trim();
      const toEmpty = formatString(option) === 'Between' && !value?.to?.trim();
      if (!isEmptyCheck) {
        if (fromEmpty || toEmpty) {
          hasInvalid = true;
        }
      }
    }

    if (state.select) {
      const isEmpty = !state.select.value.trim();
      if (isEmpty) hasInvalid = true;
    }
  }

  return hasInvalid;
};

export const applyFilterOnChanges = (
  savedFilters: Record<string, FilterState>,
  filterMenu: FieldConfig[],
  onFilterChange: (field: string, value: FilterValue) => void
) => {
  Object.entries(savedFilters).forEach(([fieldName, fieldState]) => {
    const fieldConfig = filterMenu.find((f) => f.value === fieldName);
    if (fieldConfig?.onChange && !fieldConfig.hide) {
      const value =
        fieldState.enum?.value ??
        fieldState.select?.value ??
        fieldState.text?.value ??
        fieldState.number?.value ??
        fieldState.date?.value;

      if (value !== undefined) {
        onFilterChange(fieldName, value);
      }
    }
  });
};

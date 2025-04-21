/* eslint-disable @typescript-eslint/no-explicit-any */
// filterUtils.ts
// import { FieldConfig, FilterState } from '../../../types/account-filter';

import {
  FieldConfig,
  FilterState,
} from '../../consultant/types/account-filter';
export const fields: FieldConfig[] = [
  { name: 'Parent Account', type: 'text' },
  { name: 'Account Number', type: 'number' },
  { name: 'Account Name', type: 'text' },
  { name: 'Account ID', type: 'text' },
  { name: 'Industries', type: 'text' },
  {
    name: 'Country',
    type: 'multi-select',
    options: [
      'Canada',
      'United States',
      'United Kingdom',
      'Ireland',
      'Sweden',
      'Romania',
      'Australia',
      'France',
    ],
  },
  {
    name: 'Currency',
    type: 'multi-select',
    options: ['CAD', 'USD', 'GBP', 'EUR', 'SEK', 'RON', 'AUD'],
  },
  { name: 'Annual Revenue', type: 'number' },
  { name: 'Status', type: 'status', options: ['Active', 'Inactive'] },
  { name: 'Primary Contact', type: 'text' },
  { name: 'is Parent Account', type: 'boolean' },
];

export const getInitialStateForField = (
  fieldConfig: FieldConfig
): FilterState => {
  switch (fieldConfig.type) {
    case 'text':
      return { text: { option: 'contains', value: '' } };
    case 'number':
      return { number: { option: 'greater_than', value: '' } };
    case 'status':
      return { status: { option: 'equals', value: 'Active' } };
    case 'boolean':
      return { boolean: { option: 'equals', value: true } };
    case 'multi-select':
      return { multiSelect: { values: [] } };
    default:
      return {};
  }
};

export const formatFilterForApi = (
  filterStates: Record<string, FilterState>
) => {
  const formattedFilters: Record<string, any> = {};

  Object.entries(filterStates).forEach(([fieldName, state]) => {
    const fieldKey = fieldName === 'Industries' ? 'industry' : fieldName.toLowerCase().replace(/\s+/g, '_');

    if (state.text) {
      formattedFilters[fieldKey] = { [state.text.option]: state.text.value.toLowerCase() };
    } else if (state.number) {
      formattedFilters[fieldKey] = {
        [state.number.option]: state.number.value,
      };
    } else if (state.status) {
      formattedFilters[fieldKey] = { value: state.status.value.toLowerCase() };
    } else if (state.boolean) {
      formattedFilters[fieldKey] = state.boolean.value === true ? 'yes' : 'no';
    } else if (state.multiSelect) {
      formattedFilters[fieldKey] = state.multiSelect.values;
    }
  });

  return formattedFilters;
};

interface FilterEntry {
  userId: string | null;
  filter: FilterState;
}

export const getStoredFiltersForUser = (userId: string | null, filterKey: string): FilterState | null => {
  if (!userId) return null;

  const raw = localStorage.getItem(filterKey);
  if (!raw) return null;

  try {
    const parsed: FilterEntry[] = JSON.parse(raw);
    const userEntry = parsed.find((entry) => entry.userId === userId);
    return userEntry?.filter || null;
  } catch {
    return null;
  }
};

export const storeFiltersForUser = (userId: string | null, filter: FilterState, filterKey: string) => {
  if (!userId) return;
  
  let stored: FilterEntry[] = [];
  try {
    stored = JSON.parse(localStorage.getItem(filterKey) || '[]');
  } catch {
    stored = [];
  }

  const updated = stored.filter((entry) => entry.userId !== userId);

  updated.push({ userId, filter });
  localStorage.setItem(filterKey, JSON.stringify(updated));
};

export const clearFiltersForUser = (userId: string | null, filterKey: string) => {
  if (!userId) return;

  let stored: FilterEntry[] = [];
  try {
    stored = JSON.parse(localStorage.getItem(filterKey) || '[]');
  } catch {
    stored = [];
  }

  const updated = stored.filter((entry) => entry.userId !== userId);
  localStorage.setItem(filterKey, JSON.stringify(updated));
};

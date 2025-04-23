/* eslint-disable @typescript-eslint/no-explicit-any */
// filterUtils.ts
// import { FieldConfig, FilterState } from '../../../types/account-filter';

import {
  FieldConfig,
  FilterState,
} from '../../consultant/types/account-filter';
export const fields: FieldConfig[] = [
  { label: 'Parent Account', name: 'parent_account', type: 'text' },
  { label: 'Account Number', name: 'account_number', type: 'number' },
  { label: 'Account Name', name: 'account_name', type: 'text' },
  { label: 'Record ID', name: 'account_id', type: 'text' },
  { label: 'Industries', name: 'industry', type: 'text' },
  {
    label: 'Country',
    name: 'country',
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
    label: 'Currency',
    name: 'currency',
    type: 'multi-select',
    options: ['CAD', 'USD', 'GBP', 'EUR', 'SEK', 'RON', 'AUD'],
  },
  { label: 'Annual Revenue', name: 'annual_revenue', type: 'number' },
  { label: 'Status', name: 'status', type: 'status', options: ['Active', 'Inactive'] },
  { label: 'Primary Contact', name: 'primary_contact', type: 'text' },
  { label: 'is Parent Account', name: 'is_parent_account', type: 'boolean' },
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
    if (state.text) {
      formattedFilters[fieldName] = { [state.text.option]: state.text.value.toLowerCase() };
    } else if (state.number) {
      formattedFilters[fieldName] = {
        [state.number.option]: state.number.value,
      };
    } else if (state.status) {
      formattedFilters[fieldName] = state.status.value.toLowerCase();
    } else if (state.boolean) {
      formattedFilters[fieldName] = state.boolean.value === true ? 'yes' : 'no';
    } else if (state.multiSelect) {
      formattedFilters[fieldName] = state.multiSelect.values;
    }
  });

  return formattedFilters;
};

const FILTER_KEY = 'FILTER_STATE';

export const getStoredFilters = (): FilterState | null => {
  const raw = localStorage.getItem(FILTER_KEY);
  if (!raw) return null;

  try {
    const parsed: FilterState = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
};

export const storeFilters = (filter: FilterState) => {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
  } catch {
    console.error("Error storing filters in localStorage");
  }
};

export const clearFilters = () => {
  try {
    localStorage.removeItem(FILTER_KEY);
  } catch {
    console.error("Error clearing filters from localStorage");
  }
};

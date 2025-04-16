/* eslint-disable @typescript-eslint/no-explicit-any */
// filterUtils.ts
// import { FieldConfig, FilterState } from '../../../types/account-filter';

import {
  FieldConfig,
  FilterState,
} from '../../consultant/types/account-filter';

export const getInitialStateForField = (
  fieldConfig: FieldConfig
): FilterState => {
  switch (fieldConfig.type) {
    case 'text':
      return { text: { option: 'contains', value: '' } };
    case 'number':
      return { number: { option: 'equals', value: '' } };
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
    const fieldKey = fieldName.toLowerCase().replace(/\s+/g, '_');

    if (state.text) {
      formattedFilters[fieldKey] = { [state.text.option]: state.text.value };
    } else if (state.number) {
      formattedFilters[fieldKey] = {
        [state.number.option]: state.number.value,
      };
    } else if (state.status) {
      formattedFilters[fieldKey] = { value: state.status.value.toLowerCase() };
    } else if (state.boolean) {
      formattedFilters[fieldKey] = { value: state.boolean.value.toString() };
    } else if (state.multiSelect) {
      formattedFilters[fieldKey] = state.multiSelect.values;
    }
  });

  return formattedFilters;
};

import { NavigateFunction } from 'react-router-dom';

/** All supported field types */
export type NavFilterType =
  | 'text'
  | 'enum'
  | 'number'
  | 'date'
  | 'time'
  | 'textCostAndSkill';

/** All supported operators */
export type NavFilterOperator =
  // text / textCostAndSkill
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'does_not_contain'
  | 'is_empty'
  | 'is_not_empty'
  // enum
  | 'in'
  | 'not_in'
  // number
  | 'less_than'
  | 'greater_than'
  | 'between'
  // date / time
  | 'before'
  | 'after';

export interface NavFilterRangeValue {
  from?: string;
  to?: string;
}

export interface NavFilter {
  filterKey: string;
  type: NavFilterType;
  operator: NavFilterOperator;
  value?: string | string[] | NavFilterRangeValue;
}

export interface NavFilterState {
  filters: NavFilter[];
  [key: string]: unknown;
}

// ─── Main utility ─────────────────────────────────────────────────────────────

export function navigateWithFilters(
  navigate: NavigateFunction,
  route: string,
  filters: NavFilter[],
  extraState?: Record<string, unknown>
): void {
  const state: NavFilterState = { filters, ...extraState };
  navigate(route, { state });
}

// ─── Filter-state builder ─────────────────────────────────────────────────────

export function buildFilterStates(
  filters: NavFilter[]
): Record<string, unknown> {
  const filterStates: Record<string, unknown> = {};

  for (const f of filters) {
    const { filterKey, type, operator, value } = f;

    switch (type) {
      case 'text':
      case 'textCostAndSkill': {
        const stateKey = type === 'text' ? 'text' : 'textCostAndSkill';
        filterStates[filterKey] = {
          [stateKey]: {
            option: operator,
            value: typeof value === 'string' ? value : '',
          },
        };
        break;
      }

      case 'enum': {
        const isMultiple = operator === 'in' || operator === 'not_in';
        let enumValue: string | string[];
        if (isMultiple) {
          enumValue = Array.isArray(value)
            ? (value as string[])
            : typeof value === 'string'
              ? [value]
              : [];
        } else {
          enumValue = Array.isArray(value)
            ? ((value as string[])[0] ?? '')
            : typeof value === 'string'
              ? value
              : '';
        }
        filterStates[filterKey] = {
          enum: {
            option: operator,
            value: enumValue,
          },
        };
        break;
      }

      case 'number': {
        if (Array.isArray(value)) {
          filterStates[filterKey] = {
            number: {
              option: operator,
              value: { from: value[0] ?? '', to: value[1] ?? '' },
            },
          };
        } else if (value && typeof value === 'object') {
          filterStates[filterKey] = {
            number: {
              option: operator,
              value: { from: value.from ?? '', to: value.to ?? '' },
            },
          };
        } else {
          filterStates[filterKey] = {
            number: {
              option: operator,
              value: { from: typeof value === 'string' ? value : '' },
            },
          };
        }
        break;
      }

      case 'date': {
        if (Array.isArray(value)) {
          filterStates[filterKey] = {
            date: {
              option: operator,
              value: { from: value[0] ?? '', to: value[1] ?? '' },
            },
          };
        } else if (value && typeof value === 'object') {
          filterStates[filterKey] = {
            date: {
              option: operator,
              value: { from: value.from ?? '', to: value.to ?? '' },
            },
          };
        } else {
          filterStates[filterKey] = {
            date: {
              option: operator,
              value: { from: typeof value === 'string' ? value : '' },
            },
          };
        }
        break;
      }

      case 'time': {
        if (Array.isArray(value)) {
          filterStates[filterKey] = {
            time: {
              option: operator,
              value: { from: value[0] ?? '', to: value[1] ?? '' },
            },
          };
        } else if (value && typeof value === 'object') {
          filterStates[filterKey] = {
            time: {
              option: operator,
              value: { from: value.from ?? '', to: value.to ?? '' },
            },
          };
        } else {
          filterStates[filterKey] = {
            time: {
              option: operator,
              value: { from: typeof value === 'string' ? value : '' },
            },
          };
        }
        break;
      }

      default:
        break;
    }
  }

  return filterStates;
}

export function buildApiFilters(filters: NavFilter[]): Record<string, unknown> {
  const apiFilters: Record<string, unknown> = {};

  for (const f of filters) {
    const { filterKey, type, operator, value } = f;

    switch (type) {
      case 'text':
      case 'textCostAndSkill': {
        const isEmptyOp =
          operator === 'is_empty' || operator === 'is_not_empty';
        apiFilters[filterKey] = {
          [operator]: isEmptyOp ? true : typeof value === 'string' ? value : '',
        };
        break;
      }

      case 'enum': {
        const isEmptyOp =
          operator === 'is_empty' || operator === 'is_not_empty';
        const isMultiple = operator === 'in' || operator === 'not_in';

        let enumValue: boolean | string | string[];
        if (isEmptyOp) {
          enumValue = true;
        } else if (isMultiple) {
          // 'in' / 'not_in' → array
          enumValue = Array.isArray(value)
            ? (value as string[])
            : typeof value === 'string'
              ? [value]
              : [];
        } else {
          enumValue = Array.isArray(value)
            ? ((value as string[])[0] ?? '')
            : typeof value === 'string'
              ? value
              : '';
        }
        apiFilters[filterKey] = { [operator]: enumValue };
        break;
      }

      case 'number': {
        const isEmptyOp = operator === 'is_empty';
        if (isEmptyOp) {
          apiFilters[filterKey] = { [operator]: true };
        } else if (Array.isArray(value)) {
          apiFilters[filterKey] = {
            [operator]:
              operator === 'between' ? [value[0], value[1]] : value[0],
          };
        } else if (value && typeof value === 'object') {
          apiFilters[filterKey] = {
            [operator]:
              operator === 'between' ? [value.from, value.to] : value.from,
          };
        } else {
          apiFilters[filterKey] = {
            [operator]: typeof value === 'string' ? value : '',
          };
        }
        break;
      }

      case 'date':
      case 'time': {
        const isEmptyOp = operator === 'is_empty';
        if (isEmptyOp) {
          apiFilters[filterKey] = { [operator]: true };
        } else if (Array.isArray(value)) {
          apiFilters[filterKey] = {
            [operator]:
              operator === 'between' ? [value[0], value[1]] : value[0],
          };
        } else if (value && typeof value === 'object') {
          apiFilters[filterKey] = {
            [operator]:
              operator === 'between' ? [value.from, value.to] : value.from,
          };
        } else {
          apiFilters[filterKey] = {
            [operator]: typeof value === 'string' ? value : '',
          };
        }
        break;
      }

      default:
        break;
    }
  }

  return apiFilters;
}

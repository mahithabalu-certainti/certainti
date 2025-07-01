// filterUtils.ts
import {
  FieldConfig,
  FilterState,
} from '../../consultant/types/account-filter';
export const fields: FieldConfig[] = [
  { label: 'Parent Account', name: 'parent_account', type: 'text' },
  { label: 'Account Number', name: 'account_number', type: 'number' },
  { label: 'Account Name', name: 'account_name', type: 'text' },
  { label: 'Record ID', name: 'account_id', type: 'text' },
  { label: 'Industry', name: 'industry', type: 'text' },
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
  {
    label: 'Status',
    name: 'status',
    type: 'status',
    options: ['Active', 'Inactive'],
  },
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
    case 'enumSelect':
      return { enumSelect: { option: 'equals', value: [] } };
    case 'multi-select':
      return { multiSelect: { values: [] } };
    case 'date':
      return { date: { option: 'equals', value: { from: '', to: '' } } };
    default:
      return {};
  }
};

function formatString(str: string | undefined): string {
  if (!str) return '';
  return str
    .split('_') // split on underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
    .join(' ');
}

export const formatFilterForApi = (
  filterStates: Record<string, FilterState>
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedFilters: Record<string, any> = {};

  Object.entries(filterStates).forEach(([fieldName, state]) => {
    if (state.date) {
      const option = state.date.option;
      const value = state.date.value;
      const boolOptions = formatString(option) === 'Is Empty';
      if (value?.from || value?.to || boolOptions) {
        formattedFilters[fieldName] = {
          [option as string]:
            formatString(option) === 'Between'
              ? { from: value.from?.toString(), to: value.to?.toString() }
              : boolOptions
                ? true
                : value.from?.toString(),
        };
      }
    }
    if (state.text) {
      const selectedOption = state.text?.option;
      const value =
        selectedOption === 'is_empty' ? true : state.text.value.toLowerCase();
      if (value) {
        formattedFilters[fieldName] = {
          [state.text.option]: value,
        };
      }
    } else if (state.number) {
      const selectedOption = state.number?.option;
      const value = selectedOption === 'is_empty' ? true : state.number.value;
      if (value) {
        formattedFilters[fieldName] = {
          [state.number.option]: value,
        };
      }
    } else if (state.status) {
      if (fieldName === 'industry') {
        formattedFilters[fieldName] = { equals: state.status.value };
      } else {
        formattedFilters[fieldName] = state.status.value.toLowerCase();
      }
    } else if (state.boolean) {
      formattedFilters[fieldName] = state.boolean.value === true ? 'yes' : 'no';
    } else if (state.enumSelect && state.enumSelect.option) {
      const option = state.enumSelect.option;
      const value =
        formatString(option) === 'Is Empty' ? true : state.enumSelect.value;
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        formattedFilters[fieldName] = {
          [option]: value,
        };
      }
    } else if (state.multiSelect) {
      formattedFilters[fieldName] = state.multiSelect.values;
    } else if (state.system) {
      formattedFilters[fieldName] = state.system.values;
    } else if (state.keyContact) {
      const roleOption = state.keyContact.role?.option;
      const nameOption = state.keyContact.name?.option;

      formattedFilters[fieldName] = {};

      if (roleOption === 'is_empty') {
        // If role is_empty, force both role and name to is_empty
        formattedFilters[fieldName] = {
          role: { is_empty: true },
          name: { is_empty: true },
        };
      } else {
        // Handle role filter normally
        if (state.keyContact.role?.value && roleOption) {
          formattedFilters[fieldName].role = {
            [roleOption]: state.keyContact.role.value.toLowerCase(),
          };
        }

        // Handle name filter
        if (nameOption === 'is_empty') {
          formattedFilters[fieldName].name = { is_empty: true };
        } else if (state.keyContact.name?.value && nameOption) {
          formattedFilters[fieldName].name = {
            [nameOption]: state.keyContact.name.value.toLowerCase(),
          };
        }
      }

      // Remove if empty
      if (Object.keys(formattedFilters[fieldName]).length === 0) {
        delete formattedFilters[fieldName];
      }
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
    console.error('Error storing filters in localStorage');
  }
};

export const clearFilters = () => {
  try {
    localStorage.removeItem(FILTER_KEY);
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

    if (state.date) {
      const { option, value } = state.date;
      const isEmptyCheck = formatString(option) === 'Is Empty';
      const isFromEmpty = !value.from?.trim();
      const isToEmpty =
        option?.toLowerCase() === 'between' && !value.to?.trim();
      if (!isEmptyCheck) {
        if (isFromEmpty || isToEmpty) {
          hasInvalid = true;
        }
      }
    }

    if (state.text) {
      const { option, value } = state.text;
      const isEmptyCheck = option === 'is_empty';

      if (!isEmptyCheck) {
        const isEmpty = !value.trim();
        if (isEmpty) hasInvalid = true;
      }
    }

    if (state.number) {
      const { option, value } = state.number;
      let hasError = false;

      if (option !== 'is_empty') {
        if (option === 'between') {
          hasError = !Array.isArray(value) || value.some((v) => !v.trim());
        } else {
          hasError = !value || (typeof value === 'string' && !value.trim());
        }
      }

      state.number.error = hasError;
      if (hasError) hasInvalid = true;
    }

    if (state.enumSelect) {
      const { option, value } = state.enumSelect;
      const requiresValue = formatString(option) !== 'Is Empty';
      const isEmptyArray = !value || value.length === 0;

      if (requiresValue && isEmptyArray) {
        hasInvalid = true;
      }
    }

    if (state.status) {
      const isEmpty = !state.status.value.trim();
      if (isEmpty) hasInvalid = true;
    }

    if (state.boolean) {
      const isInvalid = typeof state.boolean.value !== 'boolean';
      if (isInvalid) hasInvalid = true;
    }

    if (state.multiSelect) {
      const isEmpty =
        !Array.isArray(state.multiSelect.values) ||
        state.multiSelect.values.length === 0;
      if (isEmpty) hasInvalid = true;
    }

    // Add validation for keyContact field
    if (state.keyContact) {
      const { role, name } = state.keyContact;

      // Validate role
      if (role.option !== 'is_empty' && !role.value?.trim()) {
        hasInvalid = true;
        state.keyContact.role.error = true;
      } else {
        state.keyContact.role.error = false;
      }

      // Validate name (only if name operator is not 'is_empty')
      if (name.option !== 'is_empty' && !name.value?.trim()) {
        hasInvalid = true;
        state.keyContact.name.error = true;
      } else {
        state.keyContact.name.error = false;
      }
    }
  }

  return hasInvalid;
};

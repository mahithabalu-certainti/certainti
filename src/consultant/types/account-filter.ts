/* eslint-disable @typescript-eslint/no-explicit-any */
// Define filter options for each field type
export type TextFilterOption = 'contains' | 'equals' | 'not_equals';
export type NumberFilterOption = 'greater_than' | 'less_than' | 'between';
export type StatusFilterOption = 'equals';
export type BooleanFilterOption = 'equals';
export type DateOptions = 'equals' | 'before' | 'after' | 'between';
export const DateValueOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  // { value: 'is_empty', label: 'Is Empty' },
];

// Define filter state types for each field type
interface TextFilterState {
  option: TextFilterOption;
  value: string;
}

interface NumberFilterState {
  option: NumberFilterOption;
  value: string | [string, string];
  error?: boolean;
}

interface StatusFilterState {
  option: StatusFilterOption;
  value: string;
}

interface BooleanFilterState {
  option: BooleanFilterOption;
  value: boolean;
}

interface MultiSelectFilterState {
  values: string[];
}

interface DateFilterState {
  option: DateOptions;
  value: string;
  toValue?: string;
}

// Union type for all possible filter states
export type FilterState = {
  text?: TextFilterState;
  number?: NumberFilterState;
  status?: StatusFilterState;
  boolean?: BooleanFilterState;
  multiSelect?: MultiSelectFilterState;
  date?: DateFilterState;
};

// Define field configuration
export type FieldConfig = {
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'status'
    | 'boolean'
    | 'multi-select'
    | 'date'
    | 'enum';
  options?: string[] | { value: string; label: string }[];
};

export interface FilterComponentProps {
  setAppliedFilters: (filters: Record<string, any>) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterFields: FieldConfig[];
  filterLabel?: string;
  setPage: (page: number) => void;
}

export const StatusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'In-Active' },
];

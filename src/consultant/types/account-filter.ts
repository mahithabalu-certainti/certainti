/* eslint-disable @typescript-eslint/no-explicit-any */
// Define filter options for each field type
export type TextFilterOption = 'contains' | 'equals';
export type NumberFilterOption = 'greater_than' | 'less_than' | 'between';
export type StatusFilterOption = 'equals';
export type BooleanFilterOption = 'equals';

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

// Union type for all possible filter states
export type FilterState = {
  text?: TextFilterState;
  number?: NumberFilterState;
  status?: StatusFilterState;
  boolean?: BooleanFilterState;
  multiSelect?: MultiSelectFilterState;
};

// Define field configuration
export type FieldConfig = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'status' | 'boolean' | 'multi-select';
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

export interface FilterModalProps {
  isOpen: boolean;
  filterId: string | undefined;
  filterAnchorEl: HTMLButtonElement | null;
  setAppliedFilters: (filters: Record<string, any>) => void;
  filterFields: FieldConfig[];
  setPage: (page: number) => void;
  handleCloseFilter: () => void;
}

export const StatusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'In-Active' },
];

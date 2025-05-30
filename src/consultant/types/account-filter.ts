/* eslint-disable @typescript-eslint/no-explicit-any */
// Define filter options for each field type
export type TextFilterOption =
  | 'contains'
  | 'equals'
  | 'not_equals'
  | 'is_empty';
export type NumberFilterOption =
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'equals'
  | 'not_equals'
  | 'is_empty';
export type StatusFilterOption = 'equals';
export type BooleanFilterOption = 'equals';
export type DateOptions =
  | 'Equals'
  | 'Before'
  | 'After'
  | 'Between'
  | 'Is Empty';
export type KeyContactFilterOption =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'is_empty';
export type EnumSelectFilterOption =
  | 'Equals'
  | 'Not Equals'
  | 'In'
  | 'Is Empty';

export const DateValueOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  { value: 'is_empty', label: 'Is Empty' },
];

export const numberOperators: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Greater Than', value: 'greater_than' },
  { label: 'Less Than', value: 'less_than' },
  { label: 'Between', value: 'between' },
  { label: 'Is Empty', value: 'is_empty' },
];

export const textfieldOperators: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Is Empty', value: 'is_empty' },
];

export const enumSelectOperators: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
  { label: 'Is Empty', value: 'is_empty' },
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

export interface DateFilterState {
  option: DateOptions;
  value: {
    from?: string;
    to?: string;
  };
}
interface RoleFilter {
  option: string;
  value: string;
  error?: boolean;
}

interface NameFilter {
  option: string;
  value: string;
  error?: boolean;
}

interface KeyContactFilterState {
  role: RoleFilter;
  name: NameFilter;
}

export interface EnumSelectFilterState {
  option?: EnumSelectFilterOption;
  value?: [];
}

// Union type for all possible filter states
export type FilterState = {
  text?: TextFilterState;
  number?: NumberFilterState;
  status?: StatusFilterState;
  boolean?: BooleanFilterState;
  multiSelect?: MultiSelectFilterState;
  date?: DateFilterState;
  keyContact?: KeyContactFilterState;
  enumSelect?: EnumSelectFilterState;
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
    | 'keyContact'
    | 'enumSelect'
    | 'enum';
  options?: string[] | { value: string; label: string }[];
  operatorOption?: { label: string; value: string }[];
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

export interface FilterSelectOption {
  label: string;
  value: string;
}

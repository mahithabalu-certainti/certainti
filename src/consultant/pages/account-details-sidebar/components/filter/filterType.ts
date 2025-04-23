/* eslint-disable @typescript-eslint/no-explicit-any */
// Define filter options for each field type

export type TextFilterOption =
  | 'Equals'
  | 'Not Equals'
  | 'Contains'
  | 'Does Not Contain'
  | 'Is Empty';

export const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Does Not Contain', value: 'does_not_contain' },
  { option: 'Is Empty', value: 'is_empty' },
];
export type NumberFilterOption =
  | 'Equals'
  | 'Not Equals'
  | 'Less Than'
  | 'Greater Than'
  | 'Between'
  | 'Is Empty'
  | 'Is Not Empty';

export const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is Empty', value: 'is_empty' },
  { option: 'Is Not Empty', value: 'is_not_empty' },
];
export type EnumFilterOption =
  | 'Equals'
  | 'Not Equals'
  | 'In'
  | 'Not In'
  | 'Is Empty'
  | 'Is Not Empty';

export const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
  { option: 'Not In', value: 'not_in' },
  { option: 'Is Empty', value: 'is_empty' },
  { option: 'Is Not Empty', value: 'is_not_empty' },
];

export const enumValueOptions: { option: string; value: string }[] = [
  { option: 'Beginner', value: 'beginner' },
  { option: 'Intermediate', value: 'intermediate' },
  { option: 'Advanced', value: 'advanced' },
];

export type DateFilterOption =
  | 'Equals'
  | 'Before'
  | 'After'
  | 'Between'
  | 'This week'
  | 'This month'
  | 'This Quarter'
  | 'Last 7 days'
  | 'Last 30 days'
  | 'Is Empty'
  | 'Is Not Empty';

export const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
  { option: 'This Week', value: 'this_week' },
  { option: 'This Month', value: 'this_month' },
  { option: 'This Quarter', value: 'this_quarter' },
  { option: 'Last 7 Days', value: 'last_7_days' },
  { option: 'Last 30 Days', value: 'last_30_days' },
  { option: 'Is Empty', value: 'is_empty' },
  { option: 'Is Not Empty', value: 'is_not_empty' },
];

// Define filter state types for each field type
export interface TextFilterState {
  option: TextFilterOption;
  value: string;
}

export interface NumberFilterState {
  option: NumberFilterOption;
  value: {
    from?: string;
    to?: string;
  };
}
export interface EnumFilterState {
  option?: EnumFilterOption;
  value?: [];
}
export interface DateFilterState {
  option: DateFilterOption;
  value: {
    from?: string;
    to?: string;
  };
}

// Union type for all possible filter states
export type FilterState = {
  text?: TextFilterState;
  number?: NumberFilterState;
  date?: DateFilterState;
  enum?: EnumFilterState;
};

// Define field configuration
export type FieldConfig = {
  name: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'enum';
  options?: string[];
};

export interface FilterComponentProps {
  filterMenu: FieldConfig[];
  setAppliedFilters: (filters: Record<string, any>) => void;
  handleFilter: () => void;
}

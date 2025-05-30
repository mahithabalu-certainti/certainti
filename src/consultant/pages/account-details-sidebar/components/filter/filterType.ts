/* eslint-disable @typescript-eslint/no-explicit-any */
// Define filter options for each field type

import { Dispatch, SetStateAction } from 'react';

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
  { option: 'Is Empty', value: 'is_empty' },
];

export type TextFilterOptionForCostAndSkill =
  | 'Equals'
  | 'Not Equals'
  | 'Contains'
  | 'Is Empty';
// | 'Does Not Contain'
// | 'Starts With'
// | 'Ends With'
// | 'Is Not Empty';

export const textOptionForCostAndSkill: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Is Empty', value: 'is_empty' },
  // { option: 'Does Not Contain', value: 'does_not_contain' },
  // { option: 'Starts With', value: 'starts_with' },
  // { option: 'Ends With', value: 'ends_with' },
  // { option: 'Is Not Empty', value: 'is_not_empty' },
];
export type NumberFilterOption =
  | 'Equals'
  | 'Not Equals'
  | 'Less Than'
  | 'Greater Than'
  | 'Between'
  | 'Is Empty';
// | 'Is Not Empty';

export const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is Empty', value: 'is_empty' },
  // { option: 'Is Not Empty', value: 'is_not_empty' },
];
export type EnumFilterOption = 'Equals' | 'Not Equals' | 'In' | 'Is Empty';
// | 'Not In'
// | 'Is Not Empty';

export const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
  { option: 'Is Empty', value: 'is_empty' },
  // { option: 'Not In', value: 'not_in' },
  // { option: 'Is Not Empty', value: 'is_not_empty' },
];

export const enumValueOptions: { option: string; value: string }[] = [
  { option: 'Beginner', value: 'Beginner' },
  { option: 'Intermediate', value: 'Intermediate' },
  { option: 'Advanced', value: 'Advanced' },
];

export type DateFilterOption =
  | 'Equals'
  | 'Before'
  | 'After'
  | 'Between'
  | 'Is Empty';
// | 'This week'
// | 'This month'
// | 'This Quarter'
// | 'Last 7 days'
// | 'Last 30 days'
// | 'Is Not Empty';

export const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
  { option: 'Is Empty', value: 'is_empty' },
  // { option: 'This Week', value: 'this_week' },
  // { option: 'This Month', value: 'this_month' },
  // { option: 'This Quarter', value: 'this_quarter' },
  // { option: 'Last 7 Days', value: 'last_7_days' },
  // { option: 'Last 30 Days', value: 'last_30_days' },
  // { option: 'Is Not Empty', value: 'is_not_empty' },
];

export type StatusFilterOption = 'equals';

export const statusOptions: { option: string; value: string }[] = [
  { option: 'Active', value: 'active' },
  { option: 'In-Active', value: 'inactive' },
];
const minYear = 2000;
const currentYear = new Date().getFullYear();
const getFiscalYears = (range: number) => {
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { option: `FY-${year}`, value: String(year) };
  });
};

export const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const resourceTypeOptions: { option: string; value: string }[] = [
  { option: 'Full-Time', value: 'Full-Time' },
  { option: 'Sub Con', value: 'Sub Con' },
  { option: 'Non-Labor', value: 'Non-Labor' },
];

// Define filter state types for each field type
export interface TextFilterState {
  option: TextFilterOption;
  value: string;
}
export interface TextFilterStateForCostAndSkill {
  option: TextFilterOptionForCostAndSkill;
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
  value?: string[];
}
export interface CurrencySelectFilterState {
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

interface StatusFilterState {
  option: StatusFilterOption;
  value: string;
}

// Union type for all possible filter states
export type FilterState = {
  text?: TextFilterState;
  number?: NumberFilterState;
  date?: DateFilterState;
  enum?: EnumFilterState;
  textCostAndSkill?: TextFilterStateForCostAndSkill;
  select?: StatusFilterState;
  currencySelect?: CurrencySelectFilterState;
};

// Define field configuration
export type FieldConfig = {
  name: string;
  value: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'enum'
    | 'textCostAndSkill'
    | 'select'
    | 'currencySelect'
    | 'skillTypeFilter'
    | 'skillSubTypeFilter';
  options?: { option: string; value: string }[];
  dependsOn?: string;
  operatorOption?: { option: string; value: string }[];
};

export interface FilterComponentProps {
  value: string;
  isOpen: boolean;
  filterId: string | undefined;
  filterAnchorEl: HTMLButtonElement | null;
  filterMenu: FieldConfig[];
  setAppliedFilters: (filters: Record<string, any>) => void;
  handleCloseFilter: () => void;
  setCurrentSkillType?: Dispatch<
    SetStateAction<{
      skill_type_rid: string[];
      skill_subtype_rid: string[] | undefined[];
    }>
  >;
  setCurrentCountry?: Dispatch<SetStateAction<string[] | null>>;
  setCurrentPage: (page: number) => void;
  mode?: string;
}

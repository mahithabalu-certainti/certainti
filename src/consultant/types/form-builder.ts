export interface FormType {
  gridMode?: string;
  sectionName: string;
  subSection?: boolean; // Means this is a secondary level block → no header + half width
  fillType: 'half' | 'full' | 'quarter';
  fields: FormTypeFields[];
  from?: string;
  hide?: boolean;
  renderAsTable?: boolean;
  renderAsDetailTable?: boolean;
}

export interface FormTypeFields {
  group?: string;
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  value?: string;
  minDate?: Date;
  maxDate?: Date;
  options?: SelectOption[];
  expandOptions?: ParentChildSelectOption[];
  expandedAll?: boolean;
  width?: string;
  error?: string;
  placeholder?: string;
  requiredErrorMessage?: string;
  regex?: string | RegExp;
  regexErrorMessage?: string;
  disabled?: boolean;
  greaterThan?: Record<string, string>;
  toBeNotSame?: Record<string, string>;
  clearValue?: Record<string, string>;
  defaultSelect?: Record<string, string>;
  resetDependsFields?: string[];
  prefixValue?: string;
  disableFutureDates?: boolean;
  allowFutureDates?: boolean;
  labelTooltip?: {
    showTooltip: boolean;
    tooltipMessage: string;
  };
  lengthRequired?: {
    key: string;
    minMatchedValue: RegExp;
    maxMatchedValue: RegExp;
    minErrorMessage: string;
    maxErrorMessage: string;
  };
  onChange?: boolean;
  anyOneRequired?: boolean;
  hide?: boolean;
  isLoading?: boolean;
  dateRangeError?: boolean;
  startValue?: boolean;
  endDateValue?: boolean;
  errorMessage?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  defaultValue?: string;
  errorHandling?: ErrorHandling[];
  onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
  iconUrl?: string | React.ElementType;
  assignDefaultValue?: boolean;
  dependantLabel?: string;
  isFiscalYear?: boolean;
  showCreateBtn?: boolean;
  formatCostValue?: boolean;
  allowNegative?: boolean;
  clearDate?: string;
  customDateOpen?: Date;
  disableDatesBefore?: Date;
  dateFormat?: string;
  views?: ('day' | 'month' | 'year')[];
  maxLength?: number;
}

export type InputType =
  | 'text'
  | 'select'
  | 'multiSelect'
  | 'expandselect'
  | 'autocomplete'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'radio'
  | 'phone'
  | 'fiscalDate'
  | 'button'
  | 'emptyFeild'
  | 'website'
  | 'iconButton'
  | 'file'
  | 'custom';

export interface SelectOption {
  label: string;
  value: string;
  desc?: string;
  isCreate?: boolean;
  code?: string;
}
export interface SelectNumberOption {
  label: string;
  value: number;
  desc?: string;
  isCreate?: boolean;
}
export interface SelectResourceOption {
  label: string;
  value: string;
  desc?: string;
  resource_type_rid?: string;
  resource_type_name?: string;
  start_date?: string;
  end_date?: string;
}
export interface ErrorHandling {
  regex: RegExp;
  errorMessage: string;
}

export interface FieldType {
  type: InputType;
  name: string;
  group?: string;
  label: string;
  required: boolean;
  minDate?: Date;
  maxDate?: Date;
  iconUrl?: React.ElementType | string;
  expandOptions?: ParentChildSelectOption[];
  expandedAll?: boolean;
  options?: SelectOption[];
  regex?: RegExp;
  regexErrorMessage?: string;
  placeholder?: string;
  requiredErrorMessage?: string;
  disableFutureDates?: boolean;
  allowFutureDates?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  greaterThan?: Record<string, string>;
  toBeNotSame?: Record<string, string>;
  clearValue?: Record<string, string>;
  defaultSelect?: Record<string, string>;
  resetDependsFields?: string[];
  dateRangeError?: boolean;
  startValue?: boolean;
  endDateValue?: boolean;
  errorMessage?: string;
  prefixValue?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  hide?: boolean;
  labelTooltip?: {
    showTooltip: boolean;
    tooltipMessage: string;
  };
  lengthRequired?: {
    key: string;
    minMatchedValue: RegExp;
    maxMatchedValue: RegExp;
    minErrorMessage: string;
    maxErrorMessage: string;
  };
  onChange?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
  anyOneRequired?: boolean; // financial information error handling
  isLoading?: boolean;
  errorHandling?: ErrorHandling[];
  width?: string;
  assignDefaultValue?: boolean;
  dependantLabel?: string;
  isFiscalYear?: boolean;
  showCreateBtn?: boolean;
  formatCostValue?: boolean;
  allowNegative?: boolean;
  clearDate?: string;
  customDateOpen?: Date;
  disableDatesBefore?: Date;
  dateFormat?: string;
  views?: ('day' | 'month' | 'year')[];
  maxLength?: number;
}

export type AllowedCountry =
  | 'us'
  | 'ca'
  | 'gb'
  | 'ie'
  | 'se'
  | 'ro'
  | 'au'
  | 'fr';

export type GroupFields = Map<string, string[]>;

export type KeyContactHeader = {
  name: string;
  label: string;
  width: string;
};
export interface ChildList {
  child_value: string;
  child_label: string;
  currency_rid?: string;
  country_rid?: string;
  country_code?: string;
  r_number?: string;
}
export interface ParentChildSelectOption {
  parent_value: string;
  parent_label: string;
  childList: ChildList[];
}

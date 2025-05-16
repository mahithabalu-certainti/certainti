export interface FormType {
  sectionName: string;
  fillType: 'half' | 'full' | 'quarter';
  fields: FormTypeFields[];
  hide?: boolean;
}

export interface FormTypeFields {
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  value?: string;
  minDate?: Date;
  maxDate?: Date;
  options?: SelectOption[];
  width?: string;
  error?: string;
  placeholder?: string;
  regex?: string | RegExp;
  regexErrorMessage?: string;
  disabled?: boolean;
  greaterThan?: Record<string, string>;
  toBeNotSame?: Record<string, string>;
  clearValue?: Record<string, string>;
  defaultSelect?: Record<string, string>;
  resetDependsFields?: string[];
  disableFutureDates?: boolean;
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
  errorHandling?: ErrorHandling[];
  onClick?: () => void;
  iconUrl?: string;
}

// export interface SelectOptions {
//   label: string;
//   value: string;
// }

export type InputType =
  | 'text'
  | 'select'
  | 'autocomplete'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'radio'
  | 'phone'
  | 'fiscalDate'
  | 'button'
  | 'website'
  | 'iconButton';

export interface SelectOption {
  label: string;
  value: string;
}

export interface ErrorHandling {
  regex: RegExp;
  errorMessage: string;
}

export interface FieldType {
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  minDate?: Date;
  maxDate?: Date;
  iconUrl?: string;
  options?: SelectOption[];
  regex?: RegExp;
  regexErrorMessage?: string;
  placeholder?: string;
  disableFutureDates?: boolean;
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
  startDateLabel?: string;
  endDateLabel?: string;
  hide?: boolean;
  lengthRequired?: {
    key: string;
    minMatchedValue: RegExp;
    maxMatchedValue: RegExp;
    minErrorMessage: string;
    maxErrorMessage: string;
  };
  onChange?: boolean;
  onClick?: (index?: number) => void;
  anyOneRequired?: boolean; // financial information error handling
  isLoading?: boolean;
  errorHandling?: ErrorHandling[];
  width?: string;
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

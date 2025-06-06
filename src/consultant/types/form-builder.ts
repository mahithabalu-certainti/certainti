export interface FormType {
  sectionName: string;
  fillType: 'half' | 'full' | 'quarter';
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  fields: FormTypeFields[];

  hide?: boolean;
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
  defaultValue?: string;
  errorHandling?: ErrorHandling[];
  onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
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
  | 'emptyFeild'
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
  group?: string;
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
  onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
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

export type GroupFields = Map<string, string[]>;

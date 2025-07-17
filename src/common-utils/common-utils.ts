import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

import { UserDetail } from '../admin/types/manage-user';
import {
  AllMenus,
  AllModules,
  AllPermissions,
  AxiosErrorMsg,
  CheckError,
  MenuOption,
  Permissions,
  PermissionsMenus,
} from '../common-service';

import {
  AllowedCountry,
  enumValue,
  ErrorHandling,
  FieldType,
  InputType,
  SelectOption,
  YesNo,
} from '../consultant/types';
import { PermissionState } from '../store/type';
import { DetailItem } from '../components/details-section/details';

export const createTextField = (
  name: string,
  label: string,
  options: {
    type?: InputType;
    width?: string;
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
    placeholder?: string;
    group?: string;
    disabled?: boolean;
    onChange?: boolean;
    anyOneRequired?: boolean;
    hide?: boolean;
    defaultValue?: string;
    errorHandling?: ErrorHandling[];
    clearValue?: Record<string, string>;
    lengthRequired?: {
      key: string;
      minMatchedValue: RegExp;
      maxMatchedValue: RegExp;
      minErrorMessage: string;
      maxErrorMessage: string;
    };
  } = {}
): FieldType => ({
  type: options.type ?? 'text',
  name,
  label,
  required: options.required ?? false,
  width: options.width,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
  placeholder: options.placeholder,
  disabled: options.disabled,
  group: options.group,
  onChange: options.onChange,
  anyOneRequired: options.anyOneRequired,
  hide: options.hide,
  lengthRequired: options.lengthRequired,
  errorHandling: options.errorHandling,
  clearValue: options.clearValue,
  defaultValue: options.defaultValue,
});

export const createPhoneInputField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    onChange?: boolean;
    hide?: boolean;
  } = {}
): FieldType => ({
  type: 'phone',
  name,
  label,
  required: options.required ?? false,
  placeholder: options.placeholder,
  disabled: options.disabled,
  onChange: options.onChange,
  hide: options.hide,
});

export const createTextAreaField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
    placeholder?: string;
    disabled?: boolean;
    hide?: boolean;
  } = {}
): FieldType => ({
  type: 'textarea',
  name,
  label,
  required: options.required ?? false,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
  placeholder: options.placeholder,
  disabled: options.disabled,
  hide: options.hide,
});

export const createCheckboxField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    checkboxOptions: SelectOption[];
    defaultValue?: string;
  }
): FieldType => ({
  type: 'checkbox',
  name,
  label,
  required: options.required ?? false,
  options: options.checkboxOptions,
  defaultValue: options.defaultValue,
});

export const createRadioField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    width?: string;
    radioOptions: SelectOption[];
    defaultValue?: string;
    disabled?: boolean;
    onChange?: boolean;
    hide?: boolean;
    resetDependsFields?: string[];
    dependantLabel?: string;
    clearValue?: Record<string, string>;
    defaultSelect?: {
      key: string;
      matchedValue: YesNo.Yes;
      ifMatchValue: string;
      ifNotMatchValue: string;
    };
  }
): FieldType => ({
  type: 'radio',
  name,
  label,
  required: options.required ?? false,
  width: options.width,
  options: options.radioOptions,
  disabled: options.disabled,
  onChange: options.onChange,
  defaultSelect: options.defaultSelect,
  defaultValue: options.defaultValue,
  hide: options.hide,
  resetDependsFields: options.resetDependsFields,
  dependantLabel: options.dependantLabel,
  clearValue: options.clearValue,
});

export const createSelectField = (
  name: string,
  label: string,
  others: {
    options: SelectOption[];
    required: boolean;
    width?: string;
    placeholder?: string;
    disabled?: boolean;
    clearValue?: Record<string, string>;
    onChange?: boolean;
    isLoading?: boolean;
    hide?: boolean;
    resetDependsFields?: string[];
    defaultValue?: string;
    assignDefaultValue?: boolean;
    dependantLabel?: string;
  }
): FieldType => ({
  type: 'select',
  name,
  label,
  required: others.required,
  options: others.options,
  width: others.width,
  disabled: others.disabled,
  placeholder: others.placeholder,
  clearValue: others.clearValue,
  onChange: others.onChange,
  isLoading: others.isLoading,
  hide: others.hide,
  defaultValue: others.defaultValue,
  resetDependsFields: others.resetDependsFields,
  assignDefaultValue: others.assignDefaultValue,
  dependantLabel: others.dependantLabel,
});

export const createButton = (
  name: string,
  label: string,
  others: {
    iconUrl?: React.ElementType | string;
    onClick?: () => void;
    disabled?: boolean;
  }
): FieldType => ({
  type: 'button',
  name: name,
  label: label,
  required: false,
  iconUrl: others.iconUrl,
  onClick: others.onClick,
  disabled: others.disabled,
});
export const createEmptyField = (
  name: string,
  label: string,
  options?: { name?: string; label?: string; type?: string; required?: boolean }
): FieldType => ({
  type: 'emptyFeild',
  name: options?.name || name,
  label: options?.label || label,
  required: options?.required ?? false,
});

export const createImgButton = (
  name: string,
  iconUrl: React.ElementType | string,
  others?: {
    width?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
    disabled?: boolean;
  }
): FieldType => ({
  type: 'iconButton',
  iconUrl: iconUrl,
  name: name,
  label: '',
  required: false,
  width: others?.width,
  disabled: others?.disabled,
  onClick: (e?: React.MouseEvent<HTMLElement>) => {
    others?.onClick?.(e);
  },
});

export const createDateField = (
  name: string,
  label: string,
  others: {
    required: boolean;
    disabled?: boolean;
    hide?: boolean;
    disableFutureDates?: boolean;
    minDate?: Date;
    maxDate?: Date;
    endDateValue?: boolean;
    startDateLabel?: string;
    endDateLabel?: string;
    greaterThan?: Record<string, string>;
    dateRangeError?: boolean;
    startValue?: boolean;
    errorMessage?: string;
  }
): FieldType => ({
  type: 'date',
  name,
  label,
  required: others.required,
  placeholder: 'YYYY-MM-DD',
  minDate: others.minDate,
  maxDate: others.maxDate,
  disabled: others.disabled,
  hide: others.hide,
  disableFutureDates: others.disableFutureDates,
  greaterThan: others.greaterThan,
  dateRangeError: others.dateRangeError,
  startValue: others.startValue,
  endDateValue: others.endDateValue,
  startDateLabel: others.startDateLabel,
  endDateLabel: others.endDateLabel,
  errorMessage: others.errorMessage,
});

export const createFiscalDateField = (
  name: string,
  label: string,
  others: {
    required: boolean;
    disabled?: boolean;
    greaterThan?: Record<string, string>;
    toBeNotSame?: Record<string, string>;
    hide?: boolean;
  }
): FieldType => ({
  type: 'fiscalDate',
  name,
  label,
  required: others.required,
  disabled: others.disabled,
  greaterThan: others.greaterThan,
  toBeNotSame: others.toBeNotSame,
  hide: others.hide,
});

export const YES_NO_OPTIONS: SelectOption[] = [
  { label: 'Yes', value: YesNo.Yes },
  { label: 'No', value: YesNo.No },
];
export const PROJECT_YES_NO_OPTIONS: SelectOption[] = [
  { label: 'Yes', value: enumValue.Yes },
  { label: 'No', value: enumValue.No },
];

export interface ActionsDropdownItem {
  label: string;
  hide?: boolean;
  onClick: () => void;
}

// Regex patterns
export const REGEX_PATTERNS = {
  ALPHANUMERIC: /^[A-Za-z0-9-]+$/,
  LETTERS_SPACES: /^[A-Za-z\s]+$/,
  ACCOUNT_NAME: /^[A-Za-z0-9 &'.,-]+$/,
  PROJECT_NAME: /^[A-Za-z0-9 &'.,_-]+$/,
  CONTACT_NAME: /^[A-Za-z\s'-]+$/,
  INDUSTRY: /^[A-Za-z &]{5,25}$/,
  LETTERS_5_TO_25: /^[A-Za-z\s]{5,25}$/,
  LETTERS_3_TO_25: /^(?!.*\s{2,-'})[A-Za-z\s]{3,25}$/,
  LETTERS_3_TO_100: /^[\s\S]{3,100}$/,
  LENGTH_3_TO_50_REGEX: /^.{3,50}$/,
  NOT_ALLOW_ONLY_SYMBOLS: /^(?![\W_]+$).+$/,
  ALPHANUMERIC_SPEC_5_TO_50: /^[\s\S]{5,50}$/,
  EMAIL:
    /^(?=.{6,254}$)[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/,
  PHONE: /^([0-9]{10})$/,
  WEBSITE:
    /^(https?:\/\/|www\.)[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}(:[0-9]+)?(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]*)?$/,
  MAX_WEBSITE: /^.{0,255}$/,
  MIN_WEBSITE: /^.{10,}$/,
  DATA_RESIDENCY: /^[A-Za-z0-9\s-]+$/,
  NUMBER_OPTIONAL_DECIMAL: /^([0-9]{1,10}(\.[0-9]{1,2})?)?$/,
  BLENDED_NUMBER: /^(?:[0-9]{1,3})(?:\.[0-9]{1,2})?$/,
  EFFORTS_NUMBER: /^(?:[0-9]{1,16})(?:\.[0-9]{1,2})?$/,
  EFFORTS_INTEGER_NUMBER: /^[0-9]{1,16}$/,
  EFFORTS_INTEGER_9: /^[0-9]{1,9}$/,
  DESCRIPTION: /^.{0,500}$/,
  RESOURCE_DESCRIPTION: /^.{0,1000}$/,
  ACCOUNT_DESCRIPTION: /^[\s\S]{0,2000}$/,
  POSTAL_CODE: /^(?!^[A-Za-z]+$)[A-Za-z0-9-]+$/,
  MAX_AI_INTRACTION: /^[3-5]$/,
  NUMBERS: /^[0-9]{1,20}$/,
  NUMBERS_50: /^[0-9]{5,50}$/,
  ANNUAL_REVENUE: /^(0|([1-9]\d{0,11}))(\.\d{1,2})?$/,
  MAX_ANNUAL_REVENUE: /^.{1,15}$/,
  MAX_COST_REVENUE: /^.{1,15}$/,
  COST_REGEX: /^(0|([1-9]\d{0,11}))(\.\d{1,2})?$/,
  NAME_REGEX: /^[A-Za-z' -]+$/,
  USER_NAME: /^(?!.*['-]{2})(?!.*^\s)(?!.*\s$)[A-Za-z]+(?:['-][A-Za-z]+)*$/,
  STREET_REGEX: /^(?![\W_]+$)(?!\s*$)[a-zA-Z0-9\s,.\-#]+$/,
  MAX_255: /^.{0,255}$/,
  MAX_64: /^.{0,64}$/,
  MAX_50: /^.{0,50}$/,
  MAX_100: /^.{0,100}$/,
  MAX_125: /^.{0,125}$/,
  MAX_150: /^.{0,150}$/,
  MAX_200: /^.{0,200}$/,
  MAX_1000: /^.{0,1000}$/,
  MAX_2000: /^[\s\S]{0,2000}$/,
  MIN_3: /^.{3,}$/,
  MIN_5: /^.{5,}$/,
  MIN_4: /^.{4,}$/,
  POSITIVE_INTEGER_REGEX: /^(?:[1-9]|10)$/,
  MAX_AI_INTERACTIONS: /^(10|[1-9])$/,
  MIN_2: /^.{2,}$/,
  CITY_REGEX: /^[A-Za-z\s]{3,100}$/,
  NUMBERS_GREATER_THAN_ZERO: /^[1-9]\d*$/,
  MANAGER_REGEX: /^[A-Za-z\s.'-]*$/,
  MIN_NAME_REGEX: /^.{2,}$/,
  MAX_NAME_REGEX: /^.{0,128}$/,
  MIN_ACCOUNT_NAME_REGEX: /^.{3,}$/,
  MAX_ACCOUNT_NAME_REGEX: /^.{0,125}$/,
  MAX_EMAIL_REGEX: /^.{0,254}$/,
  MAX_POSTAL_REGEX: /^.{1,20}$/,
  NOT_ALLOW_SPACE_SYMBOLS_AT_START_END:
    /^[a-zA-Z0-9][\w !@#$%^&*()_+=\-[\]{};':’"\\|,.<>\\/?\u2013\u2014]*[a-zA-Z0-9]$/,
  NAME_LENGTH_2_TO_64_REGEX: /^.{2,64}$/,
  NAME_LENGTH_3_TO_64_REGEX: /^.{3,64}$/,
  NO_LEADING_OR_TRAILING_SPECIAL_REGEX: /^(?!^[-' ]|.*[-' ]$)/,
  ALLOWED_CHARS_NAME_REGEX: /^[A-Za-z-' ]+$/,
  NO_CONSECUTIVE_SPECIALS_REGEX: /^(?!.*[-' ]{2})/,
  NAME_LENGTH_3_TO_100_REGEX: /^.{3,100}$/,
  ALLOWED_CHARS_EXTENDED_NAME_REGEX: /^[A-Za-z0-9 &'.,-]+$/,
  NO_CONSECUTIVE_SPECIALS_EXTENDED_REGEX: /^(?!.*[ &'.,-]{2})/,
  NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX:
    /^(?!^[ &'.,-])(?!(.*[ &'.,-]$))/,
  NO_LEADING_SPECIAL_REGEX: /^[a-zA-Z]/,
  ALLOWED_CHARS_REGEX: /^[a-zA-Z0-9_-]+$/,
  NO_CONSECUTIVE_SPECIALS_REGEX_FOR_ORG_NAME: /^(?!.*[-_]{2}).+$/,
  NO_TRAILING_SPECIAL_REGEX: /[^-_]$/,
  POSTAL_NO_CONSECUTIVE_HYPHENS: /^(?!-)(?!.*--)[a-zA-Z0-9-]{1,20}(?<!-)$/,
  POSTAL_NO_LEADING_OR_TRAILING:
    /^(?!-)(?!.*--)(?!.*-.*-)[a-zA-Z0-9]{1,19}(-[a-zA-Z0-9]{1,19})?$/,
  POSTAL_ALLOWED_CHARS: /^(?!^[a-zA-Z-]+$).*$/,
  // NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX:
  //   /^(?!^[ &'.,-])(?!(.*[ &'.,-]$))/,
  SKILL_OTHERS_ALLOWED_CHARS_REGEX: /^[A-Za-z\-'._\s]+$/,
  SKILL_OTHERS_NO_CONSECUTIVE_SPECIALS_REGEX: /^(?!.*[&\-.'", ]{2})/,
  CONSECUTIVE_SPECIAL_CHARS: /^(?!.*[ '\\-]{2})/,
  EFFORT_IN_HOURS_REGEX: /^(0|([1-9]\d{0,15}))(\.\d{1,2})?$/,
  MAX_EFFORT_IN_HOURS: /^.{1,18}$/,
  KEY_CONTACT_NO_CONSECUTIVE: /^(?!.*[-'\s]{2,})/,
  KEY_CONTACT_NO_TRAILING: /^[A-Za-z].*[A-Za-z]$/,
  ACCOUNT_ORG_NAME: /^[A-Za-z0-9 -&.,']+$/,
  MAX_ORG_NAME_LEGNTH: /^.{7,125}/,
  MIN_ORG_NAME_LEGNTH: /^.{7,}/,
};

/**
 * Resource Form Field Regex Patterns
 *
 * Each pattern is optimized for its specific field requirements with:
 * - Exact character allowances
 * - Proper length validation
 * - Prevention of edge cases
 */

export const RESOURCE_REGEX = {
  RESOURCE_CODE: /^(?![0-9_-])[a-zA-Z][a-zA-Z0-9_-]{2,49}$/,
  RESOURCE_NAME:
    /^(?!.*[-' ]{2})[A-Za-z](?:[A-Za-z]|[-' ](?=[A-Za-z])){0,62}[A-Za-z]$/,
  ORG_NAME:
    /^(?!.*[&\-.'", ]{2})[A-Za-z0-9](?:[A-Za-z0-9]|[&\-.'", ](?=[A-Za-z0-9])){1,98}[A-Za-z0-9]$/,
  EMAIL: /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  MOBILE: /^\+?[0-9][0-9\- ]{3,14}[0-9]$/,
  MANAGER_NAME: /^(?=(.*[a-zA-Z0-9]){3})[a-zA-Z0-9][a-zA-Z0-9 .'-]{1,99}$/,
  ROLE: /^(?=.*[a-zA-Z])[a-zA-Z\s\-'.]+$/,
  DESIGNATION: /^(?=.*[a-zA-Z])[a-zA-Z0-9\s!-~]{4,100}$/,
  YEARS_EXPERIENCE: /^(?:0|[1-9]\d?)(?:\.\d{1,2})?$/,
  DESCRIPTION: /^[\s\S]{0,2000}$/,
  ENUM_VALIDATION: /^(Active|Inactive|Full-time|Contract|Mandatory)$/,
  COUNTRY:
    /^(?![\s-])(?!.*[\s-]{2})[A-Za-zÀ-ÖØ-öø-ÿ\s-]{2,49}[A-Za-zÀ-ÖØ-öø-ÿ]$/,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
};

export const ALLOWED_COUNTRIES: AllowedCountry[] = [
  'us',
  'ca',
  'gb',
  'ie',
  'se',
  'ro',
  'au',
  'fr',
];

export const fiscalYears = Array.from({ length: 26 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: `FY-${year}` };
});

export const checkError = (data: CheckError[]) => {
  return data.some((value) => value.isError === true);
};

export const errorHandling = (data: AxiosErrorMsg): string => {
  const errorData = data.response?.data;
  return `<p>${
    errorData?.statusMessage
      ? typeof errorData.statusMessage === 'object'
        ? Object.values(errorData.statusMessage).join(', ')
        : errorData.statusMessage || ''
      : errorData?.message || data.message
  }</p>`;
};

export const formatAddress = (userDatas?: UserDetail) => {
  const addressParts = [
    userDatas?.street,
    userDatas?.city,
    userDatas?.state_name,
    userDatas?.zip_code,
    userDatas?.country_name,
  ].filter(Boolean);
  return addressParts.join(', ');
};

export const getDateTimeFormat = (date?: string) => {
  if (!date) return '';
  return dayjs.utc(date).local().format('MM-DD-YYYY HH:mm:ss');
};

export const getDateFormat = (date?: string) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};
export const STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'In-Active', value: 'inactive' },
];

export const reShapePermissionData = (all: Permissions[]): PermissionState => {
  const [menus, modules, permission] = all.reduce<
    [Permissions[], Permissions[], Permissions[]]
  >(
    (acc, item) => {
      const [menus, mods, perms] = acc;

      if (item.type === PermissionsMenus.MENU) {
        menus.push(item);
      } else if (item.type === PermissionsMenus.MODULE) {
        mods.push(item);
      } else if (item.type === PermissionsMenus.PERMISSION) {
        perms.push(item);
      } else if (item.type === PermissionsMenus.FIELD) {
        const permIndex = perms.findIndex(
          (p) => p.permission_id === item.permission_id
        );
        if (permIndex !== -1) {
          perms[permIndex].fields = [...(perms[permIndex].fields || []), item];
        }
      }
      return [menus, mods, perms];
    },
    [[], [], []]
  );
  return { menus, modules, permission };
};

export const checkPermission = (
  data: Permissions[],
  condition: AllPermissions | MenuOption | AllMenus | AllModules | AllModules[]
) => {
  if (Array.isArray(condition)) {
    return condition.some(
      (cond) => data?.find((item) => item?.name === cond)?.is_enabled
    );
  }
  return data?.find((item) => item?.name === condition)?.is_enabled;
};

export const applyHidePermission = (
  items: DetailItem[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): DetailItem[] => {
  return items.map((item) => {
    const permission = item.key
      ? permissionMap[item.key]
      : { read: true, edit: true };
    return {
      ...item,
      hide: !(permission?.read || permission?.edit),
    };
  });
};

export const DONT_HAVE_ACCESS =
  'Access Restricted. Contact administrator to gain access.';

export const PROJECT_TYPE: SelectOption[] = [
  { label: 'Fixed', value: 'Fixed' },
  { label: 'Time & Material', value: 'Time & Material' },
];

export const formatDateToYYYYMMDDWithTime = (
  dateString?: string | null
): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Date parts
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Time parts (12-hour format with AM/PM)
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours || 12; // Convert "0" hours to "12"

  const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

  return `${year}-${month}-${day}, ${formattedTime}`;
};

export const costDisplay = (
  cost: string | number | null | undefined,
  symbol: string = '$'
): string => {
  if (cost === null || cost === undefined) return '-';

  const costStr = String(cost);
  const [whole, decimal] = costStr.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedCost =
    decimal !== undefined ? `${formattedWhole}.${decimal}` : formattedWhole;

  return `${symbol || '$'} ${formattedCost}`;
};

export const valueDisplay = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return '-';

  const valueStr = String(value);
  const [whole, decimal] = valueStr.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedValue =
    decimal !== undefined ? `${formattedWhole}.${decimal}` : formattedWhole;

  return formattedValue;
};

export const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: String(year) };
  });
};

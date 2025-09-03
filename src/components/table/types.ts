export type Column<T> = {
  id: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sort?: string;
  width?: string;
};

export type RowData = {
  [key: string]: unknown;
};

export type SortDirection = 'ASC' | 'DESC';
export type SortOrder = 'asc' | 'desc';

export interface TableProps<T extends RowData> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  // Selection
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  // Actions
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onDeleteIcon?: (row: T) => void;
  onView?: (row: T) => void;
  // State
  loading?: boolean;
  error?: string;
  // Pagination
  rowsPerPage?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newLimit: number) => void;
  // Sorting
  sortBy?: string;
  sortOrder?: SortDirection;
  onSort?: (sortBy: string, sortOrder: SortDirection) => void;
}

export interface ITablePaginationProps {
  count: number;
  rowsPerPage: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newPageSize: number) => void;
  rowsPerPageOptions?: number[];
}

export interface ListOption {
  label: string;
  value: string | number;
}

export interface FieldValidation {
  regex: RegExp;
  errorMessage: string;
}

// Define specific types for dependency condition values
export type DependencyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown;

// Define row data type for dependency conditions
export type DependencyRowData = Record<string, DependencyValue>;

export interface DependencyRule {
  dependsOn: string | string[];
  condition: (value: DependencyValue, rowData: DependencyRowData) => boolean;
  action: 'required' | 'disabled' | 'show_modal' | 'enable';
  message?: string;
  modalFields?: ModalField[];
}

export interface ModalField {
  id: string;
  editId?: string;
  label: string;
  type: ListFieldType;
  required: boolean;
  placeholder?: string;
  validation?: FieldValidation[];
}

export interface DateFieldConfig {
  disableFutureDates?: boolean;
  minDate?: string | Date | null;
  maxDate?: string | Date | null;
  fiscalYearValidation?: boolean;
  startFieldId?: string;
  endFieldId?: string;
}

export interface TableField {
  type: ListFieldType;
  required: boolean;
  renderValue?: boolean;
  disabled?: boolean;
  placeholder?: string;
  prefix?: string;
  prefixRegex?: RegExp;
  options?: ListOption[];
  validation?: FieldValidation[];
  dependencies?: DependencyRule[];
  // Dynamic field reset configuration
  resetDependentFields?: string[];
  // Dynamic onChange callback
  onChange?: boolean;
  // Date field specific configuration
  dateConfig?: DateFieldConfig;
  getFieldData?: (
    rowData: DependencyRowData,
    columnId: string
  ) => string | number;
  // Loading state
  loading?: boolean;
}

export type ListFieldType =
  | 'text'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'textarea'
  | 'autocomplete'
  | 'phone';

export type ListTableColumn<T> = {
  id: string;
  label: string;
  width?: string | number;
  sortId: string;
  editId?: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  editable?: boolean;
  hide?: boolean;
  render?: (row: T) => React.ReactNode;
  field?: TableField;
  conditionallyEdit?: {
    key: keyof T;
    matchValue: string | number | null | (string | number | null)[];
  }[];
};

export interface ActionItem<T extends RowData> {
  label: string;
  onClick: (row: T) => void;
  disabled?: boolean | ((row: T) => boolean);
  icon?: React.ElementType;
  iconStyle?: React.CSSProperties;
  hide?: boolean;
}
export interface ConditionMenuItem<T extends RowData> {
  label: string;
  onClick: (row: T) => void;
  hide?: boolean;
  icon?: React.ElementType;
  className?: string;
  iconStyle?: React.CSSProperties;
  disabled?: boolean;
}

export interface MultipleEditingCells {
  [key: string]: {
    rowId: string;
    columnId: string;
    originalValue: string | number;
    value: string | number;
    error?: string | null;
    isDependent?: boolean;
  };
}

// Define specific types for field change event values
export type FieldChangeValue = string | number | boolean | null | undefined;

export interface FieldChangeEvent {
  rowId: string;
  columnId: string;
  value: FieldChangeValue;
  oldValue: FieldChangeValue;
  rowData: DependencyRowData;
}

// Enhanced cell edit data structure to support both regular edits and modal data
export interface CellEditData {
  columnId: string;
  editId: string;
  value: FieldChangeValue;
  modalData?: Record<string, FieldChangeValue>; // Additional modal data if applicable
}

export interface ListTableProps<T extends RowData> {
  data: T[];
  columns: ListTableColumn<T>[];
  getRowId: (row: T) => string;
  hoverHighlight?: boolean;
  tableStyle?: React.CSSProperties;
  stickyHeader?: boolean;
  stickyColumnsCount?: number;
  // Selection
  hideHeaderSelect?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  // Actions
  actionWidth: string | number;
  actionDisplayMode?: 'dropdown' | 'icon' | 'toggle';
  actionMenuItems?: ActionItem<T>[];
  // condition
  conditionMenuItems?: (row: T) => ConditionMenuItem<T>[];
  // State
  loading?: boolean;
  loadindRowCount?: number;
  error?: string;
  // Pagination
  rowsPerPageOptions?: number[];
  rowsPerPage?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newLimit: number) => void;
  // Sorting
  sortBy?: string;
  sortOrder?: SortDirection;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
  component?: string;
  onCellEdit?: (rowId: string, updates: CellEditData[]) => Promise<void> | void;
  // Dynamic field change callback
  onFieldChange?: (event: FieldChangeEvent) => Promise<void> | void;
  // Nested configuration
  expandAllParent?: boolean;
  expandAllChild?: boolean;
  parentBorder?: boolean;
  expandable?: boolean;
  childrenKey?: string;
  grandchildrenKey?: string;
  maxNestingLevel?: number;
  editDisableLevel?: number[];
  //skill
  skillTypeIds?: {
    othersSkillTypeId: string | null;
    othersSkillSubTypeId: string | null;
  };
  actionColumnName?: string;
  toggleData?: string[];
  disabledToggle?: boolean;
  checkedToggleTooltip?: string;
  unCheckedToggleTooltip?: string;
  toggleClick?: (rowId: string, value: boolean) => void;
  showEmptyRow?: boolean;
}

export interface EditingCell {
  rowId: string;
  columnId: string;
  originalValue: string | number;
  value: string | number;
  error?: string | null;
}

export interface RenderFieldsProps<T extends RowData> {
  column: ListTableColumn<T>;
  editingCell: EditingCell | null;
  handleValueChange: (value: string | number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
  rowData?: T;
  allEditingCells?: MultipleEditingCells;
}

// Modal state interface
export interface ModalState {
  open: boolean;
  fields: ModalField[];
  rowId: string;
  columnId: string;
  anchorEl: HTMLElement | null;
  modalFieldValues?: ModalFormData;
}

// Modal dialog specific types
export type ModalFormValue = string | number | boolean;

export interface ModalFormData {
  [fieldId: string]: ModalFormValue;
}

export interface ModalFormErrors {
  [fieldId: string]: string;
}

export interface ModalDialogProps {
  open: boolean;
  fields: ModalField[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSubmit: (data: ModalFormData) => void;
  loading?: boolean;
  initialValues?: ModalFormData;
}

export interface ExpandedState {
  [key: string]: {
    expanded: boolean;
    level: number;
    children?: ExpandedState;
  };
}

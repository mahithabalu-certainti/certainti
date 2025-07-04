/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface DependencyRule {
  dependsOn: string | string[];
  condition: (value: any, rowData: any) => boolean;
  action: 'required' | 'disabled' | 'hidden' | 'show_modal';
  message?: string;
  modalFields?: ModalField[];
}

export interface ModalField {
  id: string;
  label: string;
  type: ListFieldType;
  required: boolean;
  placeholder?: string;
  validation?: FieldValidation[];
}

export interface DateFieldConfig {
  disableFutureDates?: boolean;
  minDate?: string | null;
  maxDate?: string | null;
  fiscalYearValidation?: boolean;
}

export interface TableField {
  type: ListFieldType;
  required: boolean;
  renderValue?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: ListOption[];
  validation?: FieldValidation[];
  dependencies?: DependencyRule[];
  // Dynamic field reset configuration
  resetDependentFields?: string[];
  // Dynamic onChange callback
  onChange?: boolean;
  // Date field specific configuration
  dateConfig?: DateFieldConfig;
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
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  editable?: boolean;
  render?: (row: T) => React.ReactNode;
  field?: TableField;
};

export interface ActionItem<T extends RowData> {
  label: string;
  onClick: (row: T) => void;
  disabled?: boolean;
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

export interface FieldChangeEvent {
  rowId: string;
  columnId: string;
  value: any;
  oldValue: any;
  rowData: any;
}

// Enhanced cell edit data structure to support both regular edits and modal data
export interface CellEditData {
  columnId: string;
  value: any;
  modalData?: Record<string, any>; // Additional modal data if applicable
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
  actionDisplayMode?: 'dropdown' | 'icon';
  actionMenuItems?: ActionItem<T>[];
  // condition
  conditionMenuItems?: (row: T) => ConditionMenuItem<T>[];
  // State
  loading?: boolean;
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

//Project Accordion table data types
export type ProjectAccordionResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    projects: Project[];
    count?: number;
    totalCount?: number;
  };
};
export type Project = {
  project_code: string;
  project_name: string | null;
  account_name?: string;
  account_id: string;
  project_rid: string;
  modified_datetime: string;
  assessment_status: string | null;
  qre: string | null;
  qre_final?: string | null;
  is_rd_qualified: boolean;
  industry_name_other: string | null;
  project_type: string;
  project_client_group: string | null;
  project_group: string | null;
  project_classification_rid: string | null;
  classification_name: string | null;
  project_status: string;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  r_number: string;
  program_name: string | null;
  project_startdate: string | null;
  project_enddate: string | null;
  total_cost: number | null;
  total_effort: number | null;
  total_fte: number | null;
  total_cost_fte: number | null;
  total_subcon: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;
  comments: string | null;
  country_name: string | null;
  currency_code: string;
  currency_symbol: string;
  region_name: string | null;
  created_datetime: string;
  rid?: string;
  account_rid?: string;
  fiscal_year?: number;
  project_fiscal_rid?: string;
  ProjectFiscal: ProjectFiscalSummary[];
  _level?: number;
};
export type ProjectFiscalSummary = {
  project_code: string;
  project_group: string | null;
  project_name: string | null;
  project_type: string;
  fiscal_year: number;
  project_client_group: string | null;
  account_name: string;
  qre: string | null;
  classification_name: string | null;
  total_effort: number | null;
  total_cost: number | null;
  total_cost_fte: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;
  assessment_status: string | null;
  qre_final: string | null;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  comments: string | null;
  modified_datetime: string;
  project_rid: string;
  created_datetime: string;
  project_fiscal_rid: string;
  rid: string;
};

export interface ExpandedState {
  [key: string]: {
    expanded: boolean;
    level: number;
    children?: ExpandedState;
  };
}

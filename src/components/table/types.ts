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

export type ListTableColumn<T> = {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
};

export interface ActionItem<T extends RowData> {
  label: string;
  onClick: (row: T) => void;
  disabled?: boolean;
  icon?: string;
  iconStyle?: React.CSSProperties;
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
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  // Actions
  actionWidth: string | number;
  actionDisplayMode?: 'dropdown' | 'icon';
  actionMenuItems?: ActionItem<T>[];
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
}

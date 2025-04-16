export type Column<T> = {
  id: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sort?: string;
};

export type RowData = {
  [key: string]: unknown;
};

export type SortDirection = 'ASC' | 'DESC';

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

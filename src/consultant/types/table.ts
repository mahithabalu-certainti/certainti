/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RowData {
  [key: string]: any;
}

export interface TableProps<T extends RowData> {
  data: T[];
  columns: [];
  getRowId: (row: T) => string;
  selectable?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  loading?: boolean;
  error?: string;
  // Pagination props
  rowsPerPage?: number;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPaginationChange?: (page: number, limit: number) => void;
  // Sorting props
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort?: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
}

export interface accountsColumn<T> {
  id: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

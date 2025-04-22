/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify' | 'inherit';
  width?: string | number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableActionMenuItem {
  label: string;
  onClick: (row: any) => void;
  icon?: React.ReactNode;
}

interface TableHeaderButton {
  label: string;
  variant: 'text' | 'outlined' | 'contained';
  onClick: () => void;
  icon?: React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  actionMenuItems?: TableActionMenuItem[];
  title?: string;
  titleIcon?: React.ReactNode;
  headerButtons?: TableHeaderButton[];
  pagination?: boolean;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[]; // New prop for rows per page options
  sortable?: boolean;
  onViewModeToggle?: (viewMode: boolean) => void;
  viewMode?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  emptyStateMessage?: string;
  setCurrentPage: (page: number) => void; // Callback to set current page
  setSortOrder: (order: 'ASC' | 'DESC') => void; // Callback to set sort order
  setSortField: (field: string) => void; // Callback to set sort field
  setRowsPerPage: (rows: number) => void; // Callback to set rows per page
  sortField?: string; // Current sort field
  currentPage?: number; // Current page number
  rowIdentifier?: string; // Key to identify rows uniquely
  sortOrder: 'ASC' | 'DESC'; // Current sort order
}

const DataTable: React.FC<DataTableProps> = ({
  data = [],
  columns = [],
  actionMenuItems = [],
  pagination = true,
  rowsPerPage = 5,
  rowsPerPageOptions = [5, 10, 25, 50, 100], // Default rows per page options
  sortable = true,
  onViewModeToggle,
  viewMode = false,
  isLoading = false,
  error = null,
  emptyStateMessage = 'No data available',
  rowIdentifier = 'id',
  setCurrentPage,
  setSortOrder,
  setSortField,
  setRowsPerPage,
  sortField,
  currentPage = 0,
  sortOrder,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRowData, setSelectedRowData] = useState<any | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const handlePageChange = (_event: unknown, newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: any
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRowData(row);
  };

  const handleActionMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRowData(null);
  };

  const handleSortRequest = (property: string) => {
    const isAscending = sortField === property && sortOrder === 'ASC';
    setSortOrder(isAscending ? 'DESC' : 'ASC');
    setSortField(property);
  };

  const handleRowsPerPageChange = (event: any) => {
    const newRowsPerPage = event.target.value as number;
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0); // Reset to first page when rows per page changes
  };

  const stableSort = (array: any[], comparator: (a: any, b: any) => number) => {
    const stabilizedThis = array.map(
      (el, index) => [el, index] as [any, number]
    );
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = (order: 'ASC' | 'DESC', orderBy: string) => {
    return order === 'DESC'
      ? (a: any, b: any) => descendingComparator(a, b, orderBy)
      : (a: any, b: any) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a: any, b: any, orderBy: string) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const handleRowSelection = (rowId: string) => {
    const newSelection = new Set(selectedRowIds);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRowIds(newSelection);
  };

  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(data.map((row) => row[rowIdentifier].toString()));
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const toggleViewMode = () => {
    onViewModeToggle?.(!viewMode);
    setSelectedRowIds(new Set());
  };

  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const sortedData =
    sortable && sortField
      ? stableSort(data, getComparator(sortOrder, sortField))
      : data;
  const displayedRows =
    pagination && !viewMode
      ? sortedData.slice(startIndex, endIndex)
      : sortedData;
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const from = data.length === 0 ? 0 : startIndex + 1;
  const to = Math.min(endIndex, data.length);

  const isMenuOpen = Boolean(menuAnchor);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading data...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col justify-center items-center h-64 p-4'>
        <Typography variant='h6' color='error' className='mb-2'>
          Error loading data
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          className='text-center'
        >
          {error.message || 'Failed to fetch data. Please try again later.'}
        </Typography>
        <Button
          variant='outlined'
          color='primary'
          className='mt-4'
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0 && !isLoading) {
    return (
      <div className='flex flex-col justify-center items-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          {emptyStateMessage}
        </Typography>
      </div>
    );
  }

  return (
    <div className='border border-gray-300 rounded-lg mr-2'>
      <TableContainer
        component={Paper}
        style={viewMode ? { maxHeight: '70vh', overflowY: 'auto' } : {}}
      >
        <Table>
          <TableHead className='bg-gray-50'>
            <TableRow>
              {viewMode && (
                <TableCell padding='checkbox'>
                  <Checkbox
                    indeterminate={
                      selectedRowIds.size > 0 &&
                      selectedRowIds.size < data.length
                    }
                    checked={
                      data.length > 0 && selectedRowIds.size === data.length
                    }
                    onChange={handleSelectAllRows}
                    inputProps={{ 'aria-label': 'select all rows' }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className='font-bold'
                  align={column.align}
                  style={{ width: column.width }}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={sortField === column.id}
                      direction={
                        sortField === column.id
                          ? sortOrder.toLowerCase()
                          : 'ASC'.toLowerCase()
                      }
                      onClick={() => handleSortRequest(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {!viewMode && actionMenuItems.length > 0 && (
                <TableCell className='font-bold'>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((row) => (
              <TableRow
                key={row[rowIdentifier]}
                className='hover:bg-gray-50'
                selected={
                  viewMode && selectedRowIds.has(row[rowIdentifier].toString())
                }
              >
                {viewMode && (
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={selectedRowIds.has(
                        row[rowIdentifier].toString()
                      )}
                      onChange={() =>
                        handleRowSelection(row[rowIdentifier].toString())
                      }
                      inputProps={{
                        'aria-labelledby': `row-${row[rowIdentifier]}`,
                      }}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={`${row[rowIdentifier]}-${column.id}`}
                    align={column.align}
                  >
                    {column.render
                      ? column.render(row[column.id], row)
                      : row[column.id]}
                  </TableCell>
                ))}
                {!viewMode && actionMenuItems.length > 0 && (
                  <TableCell>
                    <IconButton
                      size='small'
                      onClick={(e) => handleActionMenuOpen(e, row)}
                      aria-controls={isMenuOpen ? 'action-menu' : undefined}
                      aria-haspopup='true'
                      aria-expanded={isMenuOpen ? 'true' : undefined}
                    >
                      <span role='img' aria-label='more'>
                        ⋮
                      </span>
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination && !viewMode && data.length > 0 && (
          <div className='flex items-center justify-between p-2'>
            <div className='flex items-center px-4 py-2'>
              <Typography variant='body2' className='mr-2'>
                Rows per page:
              </Typography>
              <FormControl variant='standard' size='small'>
                <Select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  className='text-sm'
                >
                  {rowsPerPageOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className='flex-grow flex justify-center items-center'>
              <Button
                variant='text'
                className='text-blue-600'
                onClick={toggleViewMode}
              >
                View All
              </Button>
            </div>
            <div className='flex items-center px-4 py-2'>
              <span className='text-gray-600 mr-4'>{`${from}-${to} of ${data.length}`}</span>
              <IconButton
                size='small'
                disabled={currentPage === 0}
                onClick={() => handlePageChange(null, currentPage - 1)}
              >
                <span role='img' aria-label='previous'>
                  ◀
                </span>
              </IconButton>
              <IconButton
                size='small'
                disabled={currentPage >= totalPages - 1}
                onClick={() => handlePageChange(null, currentPage + 1)}
              >
                <span role='img' aria-label='next'>
                  ▶
                </span>
              </IconButton>
            </div>
          </div>
        )}
      </TableContainer>

      {actionMenuItems.length > 0 && (
        <Menu
          sx={{
            paddingTop: '0px',
            paddingBottom: '0px',
            '& .MuiList-root': {
              padding: 0,
            },
          }}
          id='action-menu'
          anchorEl={menuAnchor}
          open={isMenuOpen}
          onClose={handleActionMenuClose}
          MenuListProps={{
            'aria-labelledby': 'action-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {actionMenuItems.map((item) => (
            <MenuItem
              sx={{
                display: 'flex',
                borderBottom: '1px solid',
                borderColor: 'grey.300',
                backgroundColor: 'grey.100',
              }}
              key={item.label}
              onClick={() => {
                item.onClick(selectedRowData);
                handleActionMenuClose();
              }}
            >
              {item.icon && <div className='mr-2'>{item.icon}</div>}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
};

export default DataTable;

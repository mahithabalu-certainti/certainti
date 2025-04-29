/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  CircularProgress,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
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
import { arrowDownIcon, arrowUpIcon } from '../../../../assets';
import { TablePagination } from '../../../../components/table';

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
  rowsPerPageOptions?: number[];
  sortable?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  emptyStateMessage?: string;
  setCurrentPage: (page: number) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setSortField: (field: string) => void;
  setRowsPerPage: (rows: number) => void;
  sortField?: string;
  currentPage?: number;
  rowIdentifier?: string;
  sortOrder: 'ASC' | 'DESC';
  totalCount: number;
}

const DataTable: React.FC<DataTableProps> = ({
  data = [],
  columns = [],
  actionMenuItems = [],
  pagination = true,
  rowsPerPage = 5,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  sortable = true,
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
  totalCount,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRowData, setSelectedRowData] = useState<any | null>(null);
  // const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const handlePageChange = (newPage: number) => {
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

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0); // Reset to first page when rows per page changes
  };

  // const stableSort = (array: any[], comparator: (a: any, b: any) => number) => {
  //   const stabilizedThis = array.map(
  //     (el, index) => [el, index] as [any, number]
  //   );
  //   stabilizedThis.sort((a, b) => {
  //     const order = comparator(a[0], b[0]);
  //     if (order !== 0) return order;
  //     return a[1] - b[1];
  //   });
  //   return stabilizedThis.map((el) => el[0]);
  // };

  // const getComparator = (order: 'ASC' | 'DESC', orderBy: string) => {
  //   return order === 'DESC'
  //     ? (a: any, b: any) => descendingComparator(a, b, orderBy)
  //     : (a: any, b: any) => -descendingComparator(a, b, orderBy);
  // };

  // const descendingComparator = (a: any, b: any, orderBy: string) => {
  //   if (b[orderBy] < a[orderBy]) {
  //     return -1;
  //   }
  //   if (b[orderBy] > a[orderBy]) {
  //     return 1;
  //   }
  //   return 0;
  // };

  // const handleRowSelection = (rowId: string) => {
  //   const newSelection = new Set(selectedRowIds);
  //   if (newSelection.has(rowId)) {
  //     newSelection.delete(rowId);
  //   } else {
  //     newSelection.add(rowId);
  //   }
  //   setSelectedRowIds(newSelection);
  // };

  // const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.checked) {
  //     const allIds = new Set(data.map((row) => row[rowIdentifier].toString()));
  //     setSelectedRowIds(allIds);
  //   } else {
  //     setSelectedRowIds(new Set());
  //   }
  // };

  const getSortIcon = (
    activeField: string,
    columnKey: string,
    sortOrder: 'asc' | 'desc',
    handleClick: () => void
  ) => {
    const isActive = activeField === columnKey;
  
    return (
      <div
        className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'
        onClick={handleClick}
      >
        <img
          src={arrowUpIcon}
          alt={isActive && sortOrder === 'asc' ? 'sort-up-active' : 'sort-up-inactive'}
          className='w-4 h-4'
          style={{
            filter:
              isActive && sortOrder === 'asc'
                ? 'brightness(0) saturate(100%)'
                : 'grayscale(100%) brightness(0) opacity(50%)',
          }}
        />
        <img
          src={arrowDownIcon}
          alt={isActive && sortOrder === 'desc' ? 'sort-down-active' : 'sort-down-inactive'}
          className='w-4 h-4 mt-[-9px]'
          style={{
            filter:
              isActive && sortOrder === 'desc'
                ? 'brightness(0) saturate(100%)'
                : 'grayscale(100%) brightness(0) opacity(50%)',
          }}
        />
      </div>
    );
  };
  

  const isMenuOpen = Boolean(menuAnchor);

  if (isLoading) {
    return (
      <div className='flex justify-center border border-gray-300 items-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading data...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col justify-center border border-gray-300 items-center h-64 p-4'>
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

  // if (data.length === 0 && !isLoading) {
  //   return (
  //     <div className='flex flex-col justify-center items-center border border-gray-300 h-64 p-4'>
  //       <Typography variant='h6' color='textSecondary'>
  //         {emptyStateMessage}
  //       </Typography>
  //     </div>
  //   );
  // }

  return (
    <div className='border border-gray-300'>
      <TableContainer component={Paper}>
        <Table>
          <TableHead 
          className='bg-gray-50'
          sx={{
            '& .MuiTableSortLabel-root': {
                '&:hover': {
                  color: 'inherit',
                  cursor: 'auto',
                },
              }
          }}
          >
            <TableRow>
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
                          ? sortOrder === 'ASC'
                            ? 'asc'
                            : 'desc'
                          : 'desc'
                      }
                      IconComponent={() =>
                        getSortIcon(
                          sortField!,
                          column.id!,
                          sortOrder.toLowerCase() as 'asc' | 'desc',
                          () => handleSortRequest(column.id!)
                        )
                      }
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actionMenuItems.length > 0 && (
                <TableCell className='font-bold'>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => (
                <TableRow
                key={row[rowIdentifier]}
                sx={{
                  '&:hover td': {
                    backgroundColor: '#f5f7fa',
                  },
                }}
              >
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
                  {actionMenuItems.length > 0 && (
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align='center'
                  className='text-center py-8'
                >
                  <Typography variant='h6' color='textSecondary'>
                    {emptyStateMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}

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

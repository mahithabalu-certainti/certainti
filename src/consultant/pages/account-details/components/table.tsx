/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Checkbox,
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
} from '@mui/material';
import React, { useState } from 'react';
import TextButton from '../../../../components/button/text-button';

interface Column {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify' | 'inherit';
  width?: string | number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ActionMenuItem {
  label: string;
  onClick: (row: any) => void;
}

interface ReusableTableProps {
  data: any[];
  columns: Column[];
  actionMenuItems?: ActionMenuItem[];
  title?: string;
  titleIcon?: React.ReactNode;
  headerButtons?: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
  }[];
  pagination?: boolean;
  rowsPerPage?: number;
  sortable?: boolean;
  setViewMode: (viewMode: boolean) => void;
  viewMode?: boolean;
}

const ListTable: React.FC<ReusableTableProps> = ({
  data = [],
  columns = [],
  actionMenuItems = [],
  title = '',
  titleIcon,
  headerButtons = [],
  pagination = true,
  rowsPerPage = 5,
  sortable = true,
  setViewMode,
  viewMode,
}) => {
  const [page, setPage] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: any
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
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

  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc'
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

  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(data.map((_, index) => index.toString()));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleViewMode = () => {
    setViewMode(!viewMode);
    setSelectedRows(new Set());
  };

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const sortedData =
    sortable && orderBy
      ? stableSort(data, getComparator(order, orderBy))
      : data;
  const displayedRows =
    pagination && !viewMode
      ? sortedData.slice(startIndex, endIndex)
      : sortedData;
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const from = data.length === 0 ? 0 : startIndex + 1;
  const to = Math.min(endIndex, data.length);

  const open = Boolean(anchorEl);

  return (
    <div className='border-1 border-gray-300 mr-2'>
      {!viewMode && (title || headerButtons.length > 0) && (
        <div className='flex items-center border-b-1 border-gray-300 justify-between p-4'>
          {title && (
            <div className='flex items-center'>
              {titleIcon && (
                <div className='bg-pink-100 p-2 rounded-lg mr-2'>
                  {titleIcon}
                </div>
              )}
              <h1 className='text-xl font-medium'>{title}</h1>
            </div>
          )}

          {headerButtons.length > 0 && (
            <div className='flex gap-2'>
              {headerButtons.map((button, index) => (
                <TextButton
                  key={index}
                  label={button.label}
                  variant={button.variant}
                  onClick={
                    button.label === 'View' ? toggleViewMode : button.onClick
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* {viewMode && (
        <Button
          variant='text'
          onClick={toggleViewMode}
          className='text-blue-600'
        >
          Exit View
        </Button>
      )} */}
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
                      selectedRows.size > 0 && selectedRows.size < data.length
                    }
                    checked={
                      data.length > 0 && selectedRows.size === data.length
                    }
                    onChange={handleSelectAll}
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
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {!viewMode && actionMenuItems.length > 0 && (
                <TableCell className='font-bold'>Action</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className='hover:bg-gray-50'
                selected={viewMode && selectedRows.has(rowIndex.toString())}
              >
                {viewMode && (
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={selectedRows.has(rowIndex.toString())}
                      onChange={() => handleRowSelect(rowIndex.toString())}
                      inputProps={{ 'aria-labelledby': `row-${rowIndex}` }}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    {column.render
                      ? column.render(row[column.id], row)
                      : row[column.id]}
                  </TableCell>
                ))}
                {!viewMode && actionMenuItems.length > 0 && (
                  <TableCell>
                    <IconButton
                      size='small'
                      onClick={(e) => handleMenuOpen(e, row)}
                      aria-controls={open ? 'action-menu' : undefined}
                      aria-haspopup='true'
                      aria-expanded={open ? 'true' : undefined}
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
            <div className='px-4 py-2'>{/* Empty div for spacing */}</div>
            <div className='flex-grow flex justify-center items-center'>
              <Button
                variant='text'
                className='text-blue-600'
                onClick={toggleViewMode}
              >
                View All
              </Button>
            </div>
            <div className='px-4 py-2'>
              <span className='text-gray-600'>{`${from}-${to} of ${data.length}`}</span>
              <IconButton
                size='small'
                disabled={page === 0}
                onClick={() => handleChangePage(null, page - 1)}
              >
                <span role='img' aria-label='previous'>
                  ◀
                </span>
              </IconButton>
              <IconButton
                size='small'
                disabled={page >= totalPages - 1}
                onClick={() => handleChangePage(null, page + 1)}
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
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
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
          {actionMenuItems.map((item, index) => (
            <MenuItem
              sx={{
                display: 'flex',
                borderBottom: '1px solid',
                borderColor: 'grey.300',
                backgroundColor: 'grey.100',
              }}
              key={index}
              onClick={() => {
                item.onClick(selectedRow);
                handleMenuClose();
              }}
            >
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
};

export default ListTable;

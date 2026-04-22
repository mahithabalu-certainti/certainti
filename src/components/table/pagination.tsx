import {
  Box,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { ITablePaginationProps } from './types';

const TablePagination: React.FC<ITablePaginationProps> = ({
  count,
  rowsPerPage,
  page,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    onPageChange(newPage - 1);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    onRowsPerPageChange(Number(event.target.value));
    onPageChange(0);
  };

  return (
    <Box className='flex items-center justify-between px-2.5 py-1 w-full'>
      <Box className='flex items-center gap-4'>
        <Select
          value={rowsPerPage}
          onChange={handlePageSizeChange}
          size='small'
          sx={{
            border: 'none',
            '& fieldset': { border: 'none' },
            backgroundColor: 'transparent',
            '& .MuiSelect-icon': {
              color: '#2D3E4F',
            },
            '& .MuiSelect-select': {
              fontWeight: 500,
              fontSize: '14px !important',
              color: '#272833 !important',
            },
          }}
        >
          {rowsPerPageOptions.map((size) => (
            <MenuItem
              key={size}
              value={size}
              sx={{ fontSize: '14px', color: '#2D3E4F', fontWeight: 400 }}
            >
              {size} Entries
            </MenuItem>
          ))}
        </Select>
        {count > 0 && (
          <span className='text-center hidden sm:block font-medium text-[#6B6C7E] text-[14px]'>
            Showing {page * rowsPerPage + 1} to{' '}
            {Math.min(count, (page + 1) * rowsPerPage)} of {count} entries.
          </span>
        )}
      </Box>

      <Pagination
        count={totalPages}
        page={page + 1}
        onChange={handlePageChange}
        shape='rounded'
        size={'medium'}
        siblingCount={0}
        boundaryCount={1}
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: '14px',
            color: '#7D98B6',
            fontWeight: 400,
            '&:hover': {
              backgroundColor: '#F1F2F5',
            },
          },
          '& .MuiPaginationItem-root.Mui-selected': {
            color: '#2D3E4F',
            backgroundColor: '#F1F2F5',
            '&:hover': {
              backgroundColor: '#F1F2F5',
            },
          },
          '& .MuiPaginationItem-ellipsis': {
            color: '#7D98B6',
          },
          '& .MuiPaginationItem-icon': {
            color: '#425A76',
          },
        }}
      />
    </Box>
  );
};

export default TablePagination;

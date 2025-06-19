import { useState } from 'react';
import { TableCell, IconButton, Menu, MenuItem, SxProps } from '@mui/material';
import { ArrowIcon, SortIcon } from '../../assets';
import { Theme } from '@emotion/react';

interface TableSortHeaderProps {
  columnId: string;
  label: string;
  sx?: SxProps<Theme>;
  orderBy: string;
  order: 'asc' | 'desc';
  onSortChange: (property: string, order: 'asc' | 'desc') => void;
}

const TableSortHeader: React.FC<TableSortHeaderProps> = ({
  columnId,
  label,
  orderBy,
  order,
  onSortChange,
  ...rest
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSort = (direction: 'asc' | 'desc') => {
    onSortChange(columnId, direction);
    handleClose();
  };

  return (
    <TableCell
      {...rest}
      className={`group ${open ? 'bg-[#F5F9FF]' : ''} hover:bg-[#F5F9FF]`}
    >
      <div className='flex items-center justify-between'>
        {label}
        <IconButton
          size='small'
          disableRipple
          onClick={handleClick}
          sx={{
            width: '18px',
            height: '18px',
            borderRadius: '2px',
            bgcolor: open || orderBy === columnId ? '#D9E8FF' : 'transparent',
            p: '0px !important',
            '&:hover': {
              bgcolor: '#D9E8FF!important',
            },
          }}
          className={`${
            open || orderBy === columnId
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          } cursor-pointer transition-opacity duration-150`}
        >
          {orderBy === columnId ? (
            <SortIcon
              alt='sort-icon'
              className={`mr-[1px] w-[13px] h-[13px] ${order === 'desc' ? 'scale-y-[-1]' : ''}`}
            />
          ) : (
            <ArrowIcon
              alt='arrow-icon'
              className={`mr-[1px] w-[10px] h-[10px] ${order === 'desc' ? 'scale-y-[-1]' : ''}`}
            />
          )}
        </IconButton>
      </div>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: '164px',
            border: '1px solid #CBD6E2',
            boxShadow: '0px 3px 2px 0px #00000014',
            borderRadius: '2px',
            padding: 0,
          },
        }}
        MenuListProps={{
          disablePadding: true,
        }}
      >
        <MenuItem
          selected={orderBy === columnId && order === 'asc'}
          onClick={() => handleSort('asc')}
          sx={{
            height: '37px',
            fontWeight: 600,
            fontSize: '13px',
            color: '#2D3E4F',
            borderBottom: '1px solid #CBD6E2',
          }}
        >
          <SortIcon alt='Asc-sortIcon' className='w-[16px] h-[16px] mr-[6px]' />
          Sort Ascending
        </MenuItem>
        <MenuItem
          selected={orderBy === columnId && order === 'desc'}
          onClick={() => handleSort('desc')}
          sx={{
            height: '37px',
            fontWeight: 600,
            fontSize: '13px',
            color: '#2D3E4F',
          }}
        >
          <SortIcon
            alt='Desc-sortIcon'
            className='w-[16px] h-[16px] mr-[6px] scale-y-[-1]'
          />
          Sort Descending
        </MenuItem>
      </Menu>
    </TableCell>
  );
};

export default TableSortHeader;

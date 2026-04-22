import { Box, Button, Menu, MenuItem } from '@mui/material';
import { styled, SxProps } from '@mui/material/styles';
import React, { useState } from 'react';
import { AddIcon, ArrowUpIcon } from '../../assets';
import { ActivityDropdownItem } from '../../consultant/types';

interface ActivityDropdownProps {
  label: string;
  menuItems: ActivityDropdownItem[];
  sx?: SxProps;
}

const StyledButton = styled(Button)(() => ({
  height: '25px !important',
  width: '135px !important',
  maxWidth: '135px !important',
  color: '#425A76',
  border: '1px solid #CBD6E2',
  boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
  background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
  textTransform: 'none',
  fontSize: '13px',
  fontWeight: '400',
  padding: '0px',
  borderRadius: '2px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ActivityDropdown: React.FC<ActivityDropdownProps> = ({
  label,
  menuItems,
  sx,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <Box>
      <StyledButton sx={sx} onClick={handleClick}>
        <Box
          component='span'
          sx={{ color: '#425A76' }}
          className='flex gap-1.5 items-center px-2'
        >
          <AddIcon className='w-3.5 h-3.5 p-[1px]' />
          {label}
        </Box>

        <ArrowUpIcon
          alt='arrow'
          className={`mr-1 transition-transform duration-300 ${
            !open ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </StyledButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ style: { maxHeight: '200px', marginTop: '3px' } }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {menuItems
          .filter((a) => !a.hide)
          .map((menu, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                handleClose();
                menu.onClick();
              }}
              disabled={menu.disabled}
              sx={{
                minWidth: '160px',
                maxWidth: '160px',
                fontSize: '13px',
                color: '#425a76',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom:
                  index !== menuItems.length - 1 ? '1px solid #CBD6E2' : 'none',
              }}
            >
              {menu.icon && (
                <span className='flex items-center justify-center w-4 h-4'>
                  <menu.icon className='w-4 h-4 text-black' />
                </span>
              )}
              {menu.label}
            </MenuItem>
          ))}
      </Menu>
    </Box>
  );
};

export default ActivityDropdown;

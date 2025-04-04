import { Box, Button, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { arrowDownIcon, arrowUpIcon } from '../../assets';

interface ActionsDropdownItem {
  label: string;
  onClick: () => void;
}

interface ActionsDropdownProps {
  variant?: 'filled' | 'outlined';
  actions: ActionsDropdownItem[];
}

const StyledButton = styled(Button)<{ variantType: 'filled' | 'outlined' }>(
  ({ variantType }) => ({
    backgroundColor: variantType === 'filled' ? '#F15A29' : 'transparent',
    height: '35px',
    color: variantType === 'filled' ? '#fff' : '#F15A29',
    border: variantType === 'outlined' ? '1px solid #F15A29' : 'none',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRadius: '0px',
    '&:hover': {
      backgroundColor: '#F15A29',
      color: '#fff',
    },
  })
);

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  variant = 'outlined',
  actions,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <StyledButton
        variantType={variant}
        onClick={handleClick}
        endIcon={
          open ? (
            <img src={arrowUpIcon} alt='arrowUp' />
          ) : (
            <img src={arrowDownIcon} alt='arrowDown' />
          )
        }
      >
        Actions
      </StyledButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              handleClose();
              action.onClick();
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ActionsDropdown;

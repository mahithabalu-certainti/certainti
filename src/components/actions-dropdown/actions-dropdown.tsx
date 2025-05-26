import { Box, Button, Menu, MenuItem } from '@mui/material';
import { styled, SxProps } from '@mui/material/styles';
import React, { useState } from 'react';
import { arrowUpIcon } from '../../assets';
import { ActionsDropdownItem } from '../../common-utils';
import { Theme } from '@emotion/react';


interface ActionsDropdownProps {
  variant?: 'filled' | 'outlined';
  actions: ActionsDropdownItem[];
  sx?: SxProps<Theme>;
}

const StyledButton = styled(Button)<{ buttontype: 'filled' | 'outlined' }>(
  ({ buttontype, theme }) => ({
    backgroundColor:
      buttontype === 'filled' ? theme.palette.secondary.main : 'transparent',
    height: '32px !important',
    width: '95px',
    color: buttontype === 'filled' ? '#fff' : theme.palette.secondary.main,
    border:
      buttontype === 'outlined'
        ? `1px solid ${theme.palette.secondary.main}`
        : 'none',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 400,
    // padding: '8px 14px',
    borderRadius: '2px',
    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
      color: '#fff',
    },
  })
);

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  variant = 'outlined',
  actions,
  ...rest
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Check if all actions are hidden then hide action button
  if (actions.every((action) => action.hide)) {
    return null;
  }

  return (
    <Box>
      <StyledButton
        buttontype={variant}
        {...rest}
        onClick={handleClick}
        endIcon={
          <img
            src={arrowUpIcon}
            alt={open ? 'arrowUp' : 'arrowDown'}
            style={{
              filter: "brightness(0) saturate(100%) invert(42%) sepia(11%) saturate(1204%) hue-rotate(169deg) brightness(93%) contrast(87%)",
              transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }}
          />
        }
      >
        Actions
      </StyledButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {actions.map((action, index) => {
          if (action.hide) return null;
          return (
            <MenuItem
              key={index}
              onClick={() => {
                handleClose();
                action.onClick();
              }}
              sx={{ fontSize: '14px', fontWeight: 400, color: '#2D3E4F' }}
            >
              {action.label}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default ActionsDropdown;

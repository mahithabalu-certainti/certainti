import { Box, Button, Menu, MenuItem } from '@mui/material';
import { styled, SxProps, Theme } from '@mui/material/styles';
import React, { useState } from 'react';
import { arrowDownIcon, arrowUpIcon } from '../../assets';

interface ActionsDropdownItem {
  label: string;
  onClick: () => void;
}

interface ActionsDropdownProps {
  // variant?: 'filled' | 'outlined';
  actions: ActionsDropdownItem[];
  sx?: SxProps<Theme>;
}

// const StyledButton = styled(Button)<{ variantType: 'filled' | 'outlined' }>(
//   ({ variantType, theme }) => ({
//     backgroundColor:
//       variantType === 'filled' ? theme.palette.secondary.main : 'transparent',
//     height: '32px !important',
//     width: '95px',
//     color: variantType === 'filled' ? '#fff' : theme.palette.secondary.main,
//     border:
//       variantType === 'outlined'
//         ? `1px solid ${theme.palette.secondary.main}`
//         : 'none',
//     textTransform: 'none',
//     fontSize: '13px',
//     fontWeight: 400,
//     // padding: '8px 14px',
//     borderRadius: '2px',
//     '&:hover': {
//       backgroundColor: theme.palette.secondary.main,
//       color: '#fff',
//     },
//   })
// );

const StyledButton = styled(Button)(() => {
  return {
    height: '32px !important',
    color: '#425A76',
    border: '1px solid #CBD6E2',
    boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: '700',
    width: '81px',
    // padding: '8px 16px',
    borderRadius: '2px',
  }
});

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
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

  return (
    <Box>
      <StyledButton
        {...rest}
        onClick={handleClick}
        endIcon={
          open ? (
            <img
              src={arrowUpIcon}
              alt='arrowUp'
            />
          ) : (
            <img
              src={arrowDownIcon}
              alt='arrowDown'
            />
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
            sx={{ fontSize: '14px', fontWeight: 400, color: '#2D3E4F' }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ActionsDropdown;

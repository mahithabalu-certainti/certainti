import { Box, Button, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { arrowDownIcon, arrowUpIcon, addIcon } from '../../../../../assets';

interface ImportDropdownItem {
  label: string;
  onClick: () => void;
}

interface ImportDropdownItemProps {
  variant?: 'filled' | 'outlined';
  actions: ImportDropdownItem[];
  label: string;
  split?: string; // optional string
}

const StyledButton = styled(Button)(() => {
  return {
    height: '32px !important',
    color: '#425A76',
    border: '1px solid #CBD6E2',
    boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: '400',
    padding: '8px 16px',
    borderRadius: '2px',
  }
});

const ActionImportDropdown: React.FC<ImportDropdownItemProps> = ({
  variant = 'outlined',
  actions,
  label,
  split,
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

  // const iconFilter =
  //   variant === 'filled'
  //     ? 'brightness(0) invert(1)' // white
  //     : 'brightness(0) saturate(100%) invert(46%) sepia(8%) saturate(489%) hue-rotate(169deg) brightness(95%) contrast(89%)';


  return (
    <Box>
      <StyledButton
        {...rest}
        onClick={split === 'true' ? undefined : handleClick}
        startIcon={variant === 'filled' && <img src={addIcon} />}
      >
        <Box component='span' sx={{ flexGrow: 1, pr: 1 }}>
          {label}
        </Box>
        {split === 'true' && (
          <Box
            sx={{
              height: '100%',
              width: '1px',
              backgroundColor: variant === 'filled' ? '#fff' : '#CBD6E2',
              margin: '0 8px',
              alignSelf: 'stretch',
            }}
          />
        )}

        <img
          src={open ? arrowUpIcon : arrowDownIcon}
          alt={open ? 'arrowUp' : 'arrowDown'}
          // style={{ filter: iconFilter }}
          onClick={(event) =>
            handleClick(event as unknown as React.MouseEvent<HTMLButtonElement>)
          }
        />
      </StyledButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              handleClose();
              action.onClick();
            }}
            sx={{
              minWidth: '130px',
              fontSize: '14px',
              color: '#2D3E4F',
              borderBottom:
                index !== actions.length - 1 ? '1px solid #CBD6E2' : 'none',
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ActionImportDropdown;

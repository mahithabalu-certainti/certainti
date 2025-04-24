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

const StyledButton = styled(Button)<{ variantType: 'filled' | 'outlined' }>(
  ({ variantType, theme }) => ({
    backgroundColor:
      variantType === 'filled' ? theme.palette.secondary.main : 'transparent',
    height: '35px',
    color: variantType === 'filled' ? '#fff' : '#64707D',
    border: variantType === 'outlined' ? `1px solid #CBD6E2` : 'none',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 400,
    padding: '0px 16px',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    '&:hover': {
      color: variantType === 'filled' ? '#fff' : '#64707D',
    },
  })
);

const ActionImportDropdown: React.FC<ImportDropdownItemProps> = ({
  variant = 'outlined',
  actions,
  label,
  split,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

 const iconFilter =
   variant === 'filled'
     ? 'brightness(0) invert(1)' // white
     : 'brightness(0) saturate(100%) invert(46%) sepia(8%) saturate(489%) hue-rotate(169deg) brightness(95%) contrast(89%)';


  return (
    <Box>
      <StyledButton
        variantType={variant}
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
          style={{ filter: iconFilter }}
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

import { Box, Button, Menu, MenuItem } from '@mui/material';
import { styled, SxProps } from '@mui/material/styles';
import React, { useState } from 'react';
import { AddIcon, ArrowUpIcon } from '../../assets';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  hide?: boolean;
}

interface ButtonDropdownProps {
  variant?: 'filled' | 'outlined';
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  label: string;
  sx?: SxProps;
  disabled?: boolean;
  loading?: boolean;
}

const StyledButton = styled(Button)(() => {
  return {
    height: '25px !important',
    color: '#425A76',
    border: '1px solid #CBD6E2',
    boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: '400',
    padding: '0px',
    borderRadius: '2px',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };
});

const ButtonDropdown: React.FC<ButtonDropdownProps> = ({
  variant = 'outlined',
  options,
  selectedValue,
  onSelect,
  label,
  disabled = false,
  ...rest
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const visibleOptions = options.filter((option) => !option.hide);

  const selectedLabel = selectedValue
    ? visibleOptions.find((opt) => opt.value === selectedValue)?.label
    : undefined;

  if (visibleOptions.length === 0 && !disabled) {
    return null;
  }

  return (
    <Box>
      <StyledButton {...rest} onClick={handleClick} disabled={disabled}>
        <Box
          component='span'
          sx={{
            flexGrow: 1,
            color: disabled ? '#CBD6E2' : '#425A76',
          }}
          className='flex gap-1.5 items-center pl-2 px-2'
        >
          {variant === 'filled' && <AddIcon className='w-3 p-[1px]' />}
          {selectedLabel || label}
        </Box>

        <ArrowUpIcon
          alt='arrow'
          className={`mx-1 transition-transform duration-300 ${!open ? 'rotate-180' : 'rotate-0'}`}
          onClick={(event: React.MouseEvent) => {
            if (!disabled) {
              handleClick(event as React.MouseEvent<HTMLButtonElement>);
            }
          }}
          style={{
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
      </StyledButton>

      <Menu
        anchorEl={anchorEl}
        open={open && !disabled}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: '250px',
          },
        }}
      >
        {visibleOptions.map((option, index) => (
          <MenuItem
            key={option.value}
            title={option.label}
            onClick={() => {
              if (!option.disabled) {
                handleClose();
                onSelect(option.value);
              }
            }}
            disabled={option.disabled}
            sx={{
              minWidth: '130px',
              fontSize: '14px',
              color: option.disabled ? '#CBD6E2' : '#2D3E4F',
              borderBottom:
                index !== visibleOptions.length - 1
                  ? '1px solid #CBD6E2'
                  : 'none',
              backgroundColor:
                selectedValue === option.value ? '#f5f7fa' : 'white',
              '&:hover': {
                backgroundColor: option.disabled ? 'white' : '#f5f7fa',
              },
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ButtonDropdown;

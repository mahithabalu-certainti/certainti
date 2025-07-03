import {
  Box,
  Button,
  Menu,
  MenuItem,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import React, { MouseEvent, useState } from 'react';
import { ArrowDownIcon } from '../../assets';
interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  defaultValue?: string;
  buttonSx?: SxProps<Theme>;
  menuItemSx?: SxProps<Theme>;
  menuPaperSx?: SxProps<Theme>;
  onChange?: (value: string) => void;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  defaultValue?: string;
  buttonSx?: SxProps<Theme>;
  menuItemSx?: SxProps<Theme>;
  menuPaperSx?: SxProps<Theme>;
  onChange?: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  defaultValue = '',
  buttonSx = {},
  menuItemSx = {},
  menuPaperSx = {},
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOption, setSelectedOption] = useState<string>(
    defaultValue || (options.length > 0 ? options[0].value : '')
  );

  // Find the label for the selected value
  const selectedLabel =
    options.find((opt) => opt.value === selectedOption)?.label ||
    selectedOption;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (value?: string) => {
    setAnchorEl(null);
    if (value && value !== selectedOption) {
      setSelectedOption(value);
      if (onChange) {
        onChange(value);
      }
    }
  };

  // Default button styles
  const defaultButtonSx: SxProps<Theme> = {
    color: '#1A3D6F',
    textTransform: 'none',
    border: '1px solid #CBD6E2',
    padding: '6px 12px',
    minWidth: '180px',
    justifyContent: 'space-between',
    '&:hover': {
      backgroundColor: '#F1F5FA',
      borderColor: '#A0AEC0',
    },
    ...buttonSx,
  };

  // Default menu paper styles
  const defaultMenuPaperSx: SxProps<Theme> = {
    width: '180px', // Match button width
    border: '1px solid #CBD6E2',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    ...menuPaperSx,
  };

  // Default menu item styles
  const defaultMenuItemSx: SxProps<Theme> = {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#1A3D6F',
    borderBottom: '1px solid #CBD6E2',
    ...menuItemSx,
  };

  return (
    <Box>
      <Button
        variant='outlined'
        endIcon={<ArrowDownIcon alt='arrow-down' />}
        onClick={handleOpen}
        sx={defaultButtonSx}
      >
        <Typography variant='body1' component='span'>
          {selectedLabel}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose()}
        slotProps={{
          paper: {
            sx: defaultMenuPaperSx,
          },
        }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={option.value}
            onClick={() => handleClose(option.value)}
            sx={{
              ...defaultMenuItemSx,
              // Remove border bottom for last item
              borderBottom:
                index === options?.length - 1 ? 'none' : '1px solid #CBD6E2',
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Dropdown;

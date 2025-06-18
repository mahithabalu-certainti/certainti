import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import React, { MouseEvent, useState } from 'react';
import { ArrowDownIcon } from '../../assets';

const SortByDropdown: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOption, setSelectedOption] = useState<string>('Accounts');

  // Open menu at button location
  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Close menu and update selected option if clicked
  const handleClose = (option?: string) => {
    setAnchorEl(null);
    if (option) {
      setSelectedOption(option);
    }
  };

  return (
    <Box>
      {/* Styled Sort Button */}
      <Button
        variant='outlined'
        endIcon={<ArrowDownIcon alt='arrowDown'/>}
        onClick={handleOpen}
        sx={{
          color: '#1A3D6F', // Text color
          textTransform: 'none', // Keep text as normal case
          border: '1px solid #CBD6E2', // Border color
          padding: '6px 12px', // Adjusted padding
          minWidth: '180px', // Set min width for consistency
          justifyContent: 'space-between', // Align text & icon properly
          '&:hover': {
            backgroundColor: '#F1F5FA', // Lighter hover effect
            borderColor: '#A0AEC0',
          },
        }}
      >
        <Typography variant='body1' component='span'>
          Sort By: {selectedOption}
        </Typography>
      </Button>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose()}
        slotProps={{
          paper: {
            sx: {
              minWidth: '180px', // Match button width
              border: '1px solid #CBD6E2', // Border to match button
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow effect
              borderRadius: '6px', // Rounded dropdown
              backgroundColor: '#FFFFFF', // White dropdown background
            },
          },
        }}
      >
        <MenuItem
          onClick={() => handleClose('Recently Added')}
          sx={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#1A3D6F',
            borderBottom: '1px solid #CBD6E2',
          }}
        >
          Recently Added
        </MenuItem>
        <MenuItem
          onClick={() => handleClose('Ascending')}
          sx={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#1A3D6F',
            borderBottom: '1px solid #CBD6E2',
          }}
        >
          Ascending
        </MenuItem>
        <MenuItem
          onClick={() => handleClose('Descending')}
          sx={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#1A3D6F',
            borderBottom: '1px solid #CBD6E2',
          }}
        >
          Descending
        </MenuItem>
        <MenuItem
          onClick={() => handleClose('Popularity')}
          sx={{ padding: '8px 16px', fontSize: '14px', color: '#1A3D6F' }}
        >
          Popularity
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SortByDropdown;

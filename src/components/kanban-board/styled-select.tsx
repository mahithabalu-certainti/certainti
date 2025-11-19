/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Select, SelectChangeEvent, SxProps, Theme } from '@mui/material';

export const COMMON_SELECT_STYLES: SxProps<Theme> = {
  height: '32px',
  fontSize: '13px',
  padding: '6px 4px',
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: '2px solid #60A5FA',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused': { boxShadow: 'none' },
  },
  '.MuiSelect-select': {
    padding: '6px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    '&::-webkit-scrollbar': {
      height: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#CBD6E2',
      borderRadius: '2px',
    },
  },
  '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
  '& .MuiOutlinedInput-notchedOutline': {
    border: '1px solid #CBD6E2',
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: '1px solid #CBD6E2',
  },
  '& svg': {
    color: '#7D98B6',
    flexShrink: 0,
  },
};

export const COMMON_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxWidth: 300,
      maxHeight: 300,
      marginTop: '4px',
      zIndex: 40,
      boxShadow:
        'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
      '& .MuiMenuItem-root': {
        fontSize: '13px',
        padding: '6px 12px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
  },
} as const;

interface StyledSelectProps {
  name: string;
  value: string | string[];
  onChange: (
    event: SelectChangeEvent<string> | SelectChangeEvent<string[]>
  ) => void;
  disabled?: boolean;
  multiple?: boolean;
  displayEmpty?: boolean;
  renderValue?: (value: unknown) => React.ReactNode;
  children: React.ReactNode;
  placeholder?: string;
  width?: string;
  menuMaxHeight?: number;
  sx?: SxProps<Theme>;
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  name,
  value,
  onChange,
  disabled = false,
  multiple = false,
  displayEmpty = true,
  renderValue,
  children,
  width = '140px',
  sx,
}) => {
  const mergedSx = sx
    ? { ...COMMON_SELECT_STYLES, ...sx }
    : COMMON_SELECT_STYLES;

  return (
    <div style={{ width }}>
      <Select
        name={name}
        disabled={disabled}
        className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
        onChange={
          onChange as (event: SelectChangeEvent<string | string[]>) => void
        }
        value={value}
        displayEmpty={displayEmpty}
        fullWidth
        size='small'
        multiple={multiple}
        MenuProps={
          COMMON_MENU_PROPS as Parameters<typeof Select>[0]['MenuProps']
        }
        renderValue={renderValue}
        sx={mergedSx as SxProps<Theme>}
      >
        {children}
      </Select>
    </div>
  );
};

export default StyledSelect;

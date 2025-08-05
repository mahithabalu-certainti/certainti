import { MenuProps } from '@mui/material';

export const SELECT_STYLES = {
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '30px',
  borderRadius: '2px',
  '& .MuiSelect-select': {
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '30px',
    color: '#425A76',
    py: 0,
    maxWidth: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '& .MuiSelect-icon': {
    top: '40%',
  },
};
export const OPERATOR_STYLE = {
  maxWidth: '112px',
  minWidth: '112px',
  '& .MuiSelect-select': {
    display: 'flex',
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '30px',
    color: '#425A76',
    py: 0,
  },
};
export const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
  PaperProps: {
    style: {
      borderRadius: '0px 0px 8px 8px',
      border: '1px solid #CBD6E2',
      borderTop: 'none',
      marginTop: '1px',
      boxShadow: 'none',
      maxHeight: '200px',
      cursor: 'pointer',
    },
  },
  MenuListProps: {
    sx: {
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
};

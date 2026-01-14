export const COMMON_MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 200,
      marginTop: '4px',
    },
  },
  anchorOrigin: {
    vertical: 'bottom' as const,
    horizontal: 'left' as const,
  },
  transformOrigin: {
    vertical: 'top' as const,
    horizontal: 'left' as const,
  },
};

export const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
  height: '26px',
  fontSize: '13px',
  fontWeight: 500,
  color: isEmpty ? '#7D98B6' : '#425A76',
  borderRadius: '2px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? '#EF4444' : '#CBD6E2',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? '#EF4444' : '#CBD6E2',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? '#EF4444' : '#3B82F6',
    borderWidth: hasError ? '1px' : '2px',
  },
  '&.Mui-disabled': {
    backgroundColor: '#F3F4F6',
  },
  backgroundColor: hasError ? '#FEF2F2' : 'white',
});

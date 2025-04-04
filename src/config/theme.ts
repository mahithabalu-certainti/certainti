import { createTheme } from '@mui/material';

export const theme = createTheme({
  typography: {
    fontFamily: ['Lexend', 'sans-serif'].join(','),
  },
  palette: {
    primary: {
      main: '#2D3E4F',
    },
    secondary: {
      main: '#F16137',
    },
    error: {
      main: '#fb2c36',
    },
  },
});

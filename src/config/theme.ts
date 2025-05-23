import { createTheme } from '@mui/material';

export const theme = createTheme({
  typography: {
    fontFamily: ['Mulish', 'Lexend', 'sans-serif'].join(','),
  },
  palette: {
    primary: {
      main: '#2D3E4F', // dark green
    },
    secondary: {
      main: '#F16137', // orange
    },
    error: {
      main: '#fb2c36', // red orange
    },
  },
});

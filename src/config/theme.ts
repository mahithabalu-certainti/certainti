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
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'white',
          color: 'black',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, .4)',
        },
        arrow: {
          color: 'white',
        },
      },
    },
  },
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App.jsx';
import './index.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#BC5C2B', // LEP primary color
    },
    secondary: {
      main: '#6393AA', // LEP secondary color
    },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
});

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { signInAnonymously } from 'firebase/auth';
import App from './App.jsx';
import { auth } from './firebase';
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

const root = createRoot(document.getElementById('root'));

const renderApp = () => {
  root.render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};

(async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.error('Anonymous Firebase auth failed:', error);
  } finally {
    renderApp();
  }
})();
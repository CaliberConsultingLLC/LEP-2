import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3F647B',
      dark: '#345367',
      light: '#6393AA',
    },
    secondary: {
      main: '#E07A3F',
      dark: '#C85A2A',
      light: '#F1B38D',
    },
    success: {
      main: '#6F9A83',
    },
    warning: {
      main: '#D7C97E',
    },
    error: {
      main: '#C88D86',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Montserrat", "Inter", "Segoe UI", sans-serif',
    h1: { fontSize: '2.125rem', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.75rem', lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem', lineHeight: 1.3, fontWeight: 700 },
    h4: { fontSize: '1.25rem', lineHeight: 1.35, fontWeight: 700 },
    body1: { fontSize: '0.95rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        '*::before, *::after': { boxSizing: 'inherit' },
        body: {
          margin: 0,
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 40,
          transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
          whiteSpace: 'nowrap',
          '&:focus-visible': {
            outline: '3px solid rgba(63,100,123,0.28)',
            outlineOffset: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid rgba(15,23,42,0.10)',
          boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid rgba(15,23,42,0.10)',
          boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          border: '1px solid rgba(15,23,42,0.16)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

const root = createRoot(document.getElementById('root'));

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
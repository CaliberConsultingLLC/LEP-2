import { createTheme } from '@mui/material/styles';

// MUI theme for the Cairn (Compass Redesign) skin.
// Only used when `useCairnTheme` is true (staging host or ?theme=cairn).
// Production continues to use the theme defined in main.jsx.
const cairnMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#10223C', // navy-900
      dark: '#09101F',
      light: '#3F647B',
      contrastText: '#F4CEA1', // amber-soft
    },
    secondary: {
      main: '#E07A3F', // orange
      dark: '#C0612A',
      light: '#F4CEA1',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2F855A',
      light: '#6F9A83',
    },
    warning: {
      main: '#ECC94B',
      dark: '#C0612A',
    },
    error: {
      main: '#C0612A',
    },
    info: {
      main: '#5E91B0',
    },
    background: {
      default: '#FBF7F0', // sand-50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F1C2E', // ink
      secondary: '#44566C', // ink-soft
    },
    divider: '#E8DBC3', // sand-200
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Manrope", "Inter", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '2.5rem',
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '2rem',
      lineHeight: 1.1,
      fontWeight: 500,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '1.6rem',
      lineHeight: 1.2,
      fontWeight: 500,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '1.3rem',
      lineHeight: 1.25,
      fontWeight: 500,
      letterSpacing: '-0.015em',
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '1.1rem',
      lineHeight: 1.3,
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Manrope", "Inter", sans-serif',
      fontSize: '0.95rem',
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    subtitle1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '1.05rem',
      lineHeight: 1.5,
      fontStyle: 'italic',
      fontWeight: 400,
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    body1: { fontSize: '0.95rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: {
      fontFamily: '"Manrope", "Inter", sans-serif',
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.04em',
    },
    overline: {
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      lineHeight: 1,
    },
    caption: {
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: '0.7rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        '*::before, *::after': { boxSizing: 'inherit' },
        body: {
          margin: 0,
          backgroundColor: '#FBF7F0',
          color: '#0F1C2E',
          fontFamily: '"Manrope", "Inter", sans-serif',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 42,
          padding: '12px 22px',
          transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
          whiteSpace: 'nowrap',
          '&:focus-visible': {
            outline: '3px solid rgba(224,122,63,0.32)',
            outlineOffset: 2,
          },
        },
        containedPrimary: {
          backgroundColor: '#10223C',
          color: '#F4CEA1',
          boxShadow: '0 8px 20px rgba(15,28,46,0.18)',
          '&:hover': {
            backgroundColor: '#162A44',
            transform: 'translateY(-1px)',
            boxShadow: '0 12px 28px rgba(15,28,46,0.22)',
          },
        },
        containedSecondary: {
          backgroundColor: '#E07A3F',
          color: '#FFFFFF',
          boxShadow: '0 8px 20px rgba(224,122,63,0.22)',
          '&:hover': { backgroundColor: '#C0612A' },
        },
        outlinedPrimary: {
          borderColor: '#3F647B',
          color: '#10223C',
          '&:hover': {
            backgroundColor: '#F4ECDD',
            borderColor: '#1E3A5C',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 20,
          border: '1px solid #E8DBC3',
          boxShadow: '0 18px 40px rgba(15,28,46,0.06)',
        },
        outlined: { boxShadow: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid #E8DBC3',
          boxShadow: '0 18px 40px rgba(15,28,46,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: '1px solid #E8DBC3',
          backgroundColor: '#FBF7F0',
          color: '#44566C',
          height: 28,
        },
        filledPrimary: {
          backgroundColor: '#10223C',
          color: '#F4CEA1',
          borderColor: '#10223C',
        },
        filledSecondary: {
          backgroundColor: '#E07A3F',
          color: '#FFFFFF',
          borderColor: '#E07A3F',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          fontFamily: '"Manrope", "Inter", sans-serif',
        },
        notchedOutline: { borderColor: '#E8DBC3' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#10223C',
          color: '#F4CEA1',
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: '"Manrope", "Inter", sans-serif',
        },
        arrow: { color: '#10223C' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          fontFamily: '"Manrope", "Inter", sans-serif',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#E07A3F',
          height: 3,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Manrope", "Inter", sans-serif',
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.03em',
          color: '#44566C',
          minHeight: 42,
          '&.Mui-selected': { color: '#10223C' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#10223C',
          color: '#F4CEA1',
          boxShadow: '0 10px 32px rgba(9,16,31,0.18)',
          border: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E8DBC3' } },
    },
  },
});

export default cairnMuiTheme;

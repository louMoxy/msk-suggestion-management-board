import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  palette: {
    primary: { main: '#5A77DF' },
    secondary: { main: '#3E53A0' },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
    success: { main: '#2EBD85' },
    warning: { main: '#F6A609' },
    error: { main: '#E44848' },
    info: { main: '#5A77DF' },
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, #F7F9FC 0%, #ECF1FF 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: '#F0F3FA' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: 'rgba(90,119,223,0.06)' } },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
        contained: { boxShadow: '0 4px 12px rgba(90,119,223,0.25)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
  },
});

export default theme;



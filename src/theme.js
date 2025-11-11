import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#ec4899', // pink-500
      light: '#f9a8d4', // pink-300
      dark: '#be185d', // pink-700
      contrastText: '#fff',
    },
    secondary: {
      main: '#f43f5e', // rose-500
      light: '#fb7185', // rose-400
      dark: '#e11d48', // rose-600
      contrastText: '#fff',
    },
    background: {
      default: '#fdf2f8', // pink-50
      paper: '#ffffff',
    },
    text: {
      primary: '#831843', // pink-900
      secondary: '#9f1239', // rose-800
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Dancing Script", cursive',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Dancing Script", cursive',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Dancing Script", cursive',
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(236, 72, 153, 0.55)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(236, 72, 153, 0.1)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
})

export default theme

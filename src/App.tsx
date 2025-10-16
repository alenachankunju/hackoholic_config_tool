import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { DragDropProvider } from './contexts/DragDropContext';
import Home from './components/Home';
import Login from './components/Login';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

function AppContent() {
  const { state, login } = useAppContext();

  const handleLogin = (username: string, _password: string) => {
    login(username);
  };

  if (!state.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <DragDropProvider>
      <Box sx={{ 
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        <Home />
      </Box>
    </DragDropProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;

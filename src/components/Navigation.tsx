import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import type { NavItem } from '../types';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAppContext();

  const navItems: NavItem[] = [
    { label: 'API Config', path: '/api-config' },
    { label: 'Database Config', path: '/database-config' },
    { label: 'Mapping', path: '/mapping' },
    { label: 'Testing', path: '/testing' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Button
              fullWidth
              color="inherit"
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 2,
                backgroundColor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
                textAlign: 'center',
              }}
            >
              {item.label}
            </Button>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <Button
            fullWidth
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              py: 2,
              '&:hover': {
                backgroundColor: 'rgba(220, 0, 78, 0.1)',
              },
              textAlign: 'center',
            }}
          >
            Logout
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static" elevation={1} sx={{ width: '100vw', margin: 0 }}>
      <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              cursor: 'pointer',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
            onClick={() => navigate('/')}
          >
            Hackoholics Config Tool
          </Typography>
          
          {isMobile ? (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 4 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      px: { xs: 1, sm: 2 },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                }}
              >
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navigation;

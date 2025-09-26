import React from 'react';
import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material';
import { Api as ApiIcon, Storage as DatabaseIcon, AccountTree as MappingIcon, CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';
import ApiConfig from './ApiConfig';
import DatabaseConfig from './DatabaseConfig';
import Mapping from './Mapping';
 

const HomePage: React.FC = () => {
  const { state } = useAppContext();
  

  const getStatusIcon = (config: any) => {
    if (config) return <CheckIcon color="success" sx={{ fontSize: 14 }} />;
    return <ErrorIcon color="error" sx={{ fontSize: 14 }} />;
  };

  const getStatusText = (config: any) => {
    if (config) return 'Configured';
    return 'Not Configured';
  };

  const getStatusColor = (config: any) => {
    if (config) return 'success';
    return 'error';
  };

  const getOverallProgress = () => {
    const configs = [state.apiConfig, state.databaseConfig, state.mappingConfig];
    const configured = configs.filter(Boolean).length;
    return (configured / configs.length) * 100;
  };

  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Simplified Top Bar */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 1.5, 
          borderRadius: 0,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          minHeight: '60px'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
            }}
          >
            Hackoholics Config Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={getOverallProgress()} 
              sx={{ 
                width: 120,
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white'
                }
              }} 
            />
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
              {Math.round(getOverallProgress())}%
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 1.5, overflow: 'hidden' }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          height: '100%',
          flexDirection: { xs: 'column', lg: 'row' }
        }}>
          {/* Left Sidebar - API Configuration */}
          <Box sx={{ 
            flex: { xs: 'none', lg: '0 0 22%' },
            minWidth: { xs: '100%', lg: '280px' },
            maxWidth: { xs: '100%', lg: '320px' }
          }}>
            <Paper sx={{ p: 1.5, height: '100%', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <ApiIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                  API Configuration
                </Typography>
                <Chip 
                  label={getStatusText(state.apiConfig)} 
                  color={getStatusColor(state.apiConfig) as any}
                  size="small"
                  sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                />
              </Box>
              <ApiConfig />
            </Paper>
          </Box>

          {/* Middle - Field Mapping */}
          <Box sx={{ 
            flex: { xs: 'none', lg: '1 1 56%' },
            minWidth: { xs: '100%', lg: '400px' }
          }}>
            <Paper sx={{ p: 1.5, height: '100%', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <MappingIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                  Field Mapping
                </Typography>
                <Chip 
                  label={getStatusText(state.mappingConfig)} 
                  color={getStatusColor(state.mappingConfig) as any}
                  size="small"
                  sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                />
              </Box>
              <Mapping />
            </Paper>
          </Box>

          {/* Right Sidebar - Database Configuration */}
          <Box sx={{ 
            flex: { xs: 'none', lg: '0 0 22%' },
            minWidth: { xs: '100%', lg: '280px' },
            maxWidth: { xs: '100%', lg: '320px' }
          }}>
            <Paper sx={{ p: 1.5, height: '100%', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <DatabaseIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                  Database Configuration
                </Typography>
                <Chip 
                  label={getStatusText(state.databaseConfig)} 
                  color={getStatusColor(state.databaseConfig) as any}
                  size="small"
                  sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                />
              </Box>
              <DatabaseConfig />
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Configuration Status Section */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 1.5, 
          borderRadius: 0,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'text.secondary' }}>
            Configuration Status:
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'white', px: 1.5, py: 0.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <ApiIcon sx={{ fontSize: 16 }} />
            {getStatusIcon(state.apiConfig)}
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              API
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'white', px: 1.5, py: 0.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <DatabaseIcon sx={{ fontSize: 16 }} />
            {getStatusIcon(state.databaseConfig)}
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              Database
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'white', px: 1.5, py: 0.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <MappingIcon sx={{ fontSize: 16 }} />
            {getStatusIcon(state.mappingConfig)}
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              Mapping
            </Typography>
          </Box>
          
          
        </Box>
      </Paper>

      
    </Box>
  );
};

export default HomePage;
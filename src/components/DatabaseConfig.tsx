import React, { useState } from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  Divider,
} from '@mui/material';
import {
  Code as CodeIcon,
} from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';
import type { DatabaseConfig } from '../types';
import DatabaseTypeSelector, { type DatabaseType } from './DatabaseTypeSelector';
import DatabaseConnectionForm from './DatabaseConnectionForm';
import ConnectionProfileManager from './ConnectionProfileManager';
import SchemaTreeViewer from './SchemaTreeViewer';
import DatabaseQueryModal from './DatabaseQueryModal';

const DatabaseConfigPage: React.FC = () => {
  const { state, setDatabaseConfig, setError } = useAppContext();
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<DatabaseType>(
    state.databaseConfig?.type || 'postgresql'
  );
  const [connectionConfig, setConnectionConfig] = useState<DatabaseConfig>(
    state.databaseConfig || {
      type: 'postgresql',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    }
  );
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  const handleDatabaseTypeChange = (type: DatabaseType) => {
    setSelectedDatabaseType(type);
    // Reset connection config when database type changes
    setConnectionConfig({
      type,
      host: '',
      port: getDefaultPort(type),
      database: '',
      username: '',
      password: '',
      ssl: false,
    });
  };

  const handleConnectionConfigChange = (config: Partial<DatabaseConfig>) => {
    setConnectionConfig(prev => ({ ...prev, ...config } as DatabaseConfig));
  };

  const handleLoadProfile = (config: DatabaseConfig) => {
    setConnectionConfig(config);
    setSelectedDatabaseType(config.type);
  };

  const onSubmit = () => {
    try {
      const fullConfig: DatabaseConfig = {
        type: selectedDatabaseType,
        host: connectionConfig.host,
        port: connectionConfig.port,
        database: connectionConfig.database,
        username: connectionConfig.username,
        password: connectionConfig.password,
        ssl: connectionConfig.ssl,
      };
      
      setDatabaseConfig(fullConfig);
      console.log('Database Config saved:', fullConfig);
    } catch (error) {
      setError('Failed to save database configuration');
    }
  };

  const onReset = () => {
    setSelectedDatabaseType('postgresql');
    setConnectionConfig({
      type: 'postgresql',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    });
  };

  const getDefaultPort = (type: DatabaseType): number => {
    switch (type) {
      case 'mysql':
        return 3306;
      case 'postgresql':
        return 5432;
      case 'mssql':
        return 1433;
      default:
        return 5432;
    }
  };

  return (
    <Box>
      {state.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {state.error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Database Type Selector */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Database Type
          </Typography>
          <DatabaseTypeSelector
            selectedType={selectedDatabaseType}
            onTypeChange={handleDatabaseTypeChange}
            disabled={state.isLoading}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Database Connection Form */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Connection Settings
          </Typography>
          <DatabaseConnectionForm
            key={`${selectedDatabaseType}-${connectionConfig.host}-${connectionConfig.database}`}
            databaseType={selectedDatabaseType}
            onConfigChange={handleConnectionConfigChange}
            disabled={state.isLoading}
            error={state.error}
            initialConfig={connectionConfig}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Connection Profile Manager */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Connection Profiles
          </Typography>
          <ConnectionProfileManager
            currentConfig={connectionConfig}
            onLoadProfile={handleLoadProfile}
            disabled={state.isLoading}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* MS SQL Connection Help */}
        {selectedDatabaseType === 'mssql' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              MS SQL Server Connection Help
            </Typography>
            <Box sx={{ 
              backgroundColor: 'info.light', 
              p: 1.5, 
              borderRadius: 1,
              fontSize: '0.7rem'
            }}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 1, fontWeight: 'bold' }}>
                Common MS SQL Server Connection Issues:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.7rem' }}>
                <li>Make sure SQL Server is running and accessible</li>
                <li>Enable TCP/IP protocol in SQL Server Configuration Manager</li>
                <li>Check Windows Firewall settings for port 1433</li>
                <li>Enable SQL Server Authentication (not just Windows Authentication)</li>
                <li>For named instances, use format: SERVER\INSTANCE</li>
                <li>Verify the database exists and user has permissions</li>
              </ul>
            </Box>
          </Box>
        )}

        {/* Database Schema Viewer */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              Database Schema
            </Typography>
            <Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<CodeIcon />}
                onClick={() => setIsQueryModalOpen(true)}
                disabled={state.isLoading}
                sx={{ 
                  fontSize: '0.75rem', 
                  py: 0.5, 
                  px: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                Query Editor
              </Button>
            </Box>
          </Box>
          <SchemaTreeViewer
            config={connectionConfig}
            onTableSelect={(_table, columns) => {
              // Persist selected table columns into context for Mapping
              try {
                (window as any).__setSelectedTableColumns = columns;
              } catch {}
            }}
            onSchemaSelect={() => {}}
            onColumnSelect={() => {}}
            disabled={state.isLoading}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            variant="contained"
            size="small"
            onClick={onSubmit}
            disabled={state.isLoading || !connectionConfig.host || !connectionConfig.database}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '80px' },
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
              py: 0.5
            }}
          >
            Save Configuration
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            onClick={onReset}
            disabled={state.isLoading}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '70px' },
              fontSize: '0.75rem',
              py: 0.5
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* Database Query Modal */}
      {isQueryModalOpen && (
        <DatabaseQueryModal
          open={isQueryModalOpen}
          onClose={() => {
            console.log('Closing query modal...');
            setIsQueryModalOpen(false);
          }}
          config={connectionConfig}
          disabled={state.isLoading}
        />
      )}
    </Box>
  );
};

export default DatabaseConfigPage;

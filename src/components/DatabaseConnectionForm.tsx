import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Divider,
  Button,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PlayArrow as TestIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import type { DatabaseConfig } from '../types';
import type { DatabaseType } from './DatabaseTypeSelector';
import { generateDisplayConnectionString, validateDatabaseConfig } from '../utils/databaseUtils';
import { databaseService } from '../services/databaseService';

interface DatabaseConnectionFormProps {
  databaseType: DatabaseType;
  onConfigChange: (config: Partial<DatabaseConfig>) => void;
  disabled?: boolean;
  error?: string | null;
  initialConfig?: Partial<DatabaseConfig>;
}

const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({
  databaseType,
  onConfigChange,
  disabled = false,
  error,
  initialConfig,
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connectionString, setConnectionString] = useState('');
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<DatabaseConfig>({
    defaultValues: {
      type: databaseType,
      host: initialConfig?.host || '',
      port: initialConfig?.port || getDefaultPort(databaseType),
      database: initialConfig?.database || '',
      username: initialConfig?.username || '',
      password: initialConfig?.password || '',
      ssl: initialConfig?.ssl || false,
      schema: initialConfig?.schema || '',
      instance: initialConfig?.instance || '',
    },
  });

  const watchedValues = watch();

  // Watch form changes and notify parent
  useEffect(() => {
    const subscription = watch((value) => {
      onConfigChange(value as Partial<DatabaseConfig>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  // Update connection string when form values change
  useEffect(() => {
    const config = {
      type: databaseType,
      host: watchedValues.host || '',
      port: watchedValues.port || getDefaultPort(databaseType),
      database: watchedValues.database || '',
      username: watchedValues.username || '',
      password: watchedValues.password || '',
      ssl: watchedValues.ssl || false,
      schema: watchedValues.schema || '',
      instance: watchedValues.instance || '',
    };
    
    if (config.host && config.database && config.username) {
      setConnectionString(generateDisplayConnectionString(config));
    }
  }, [watchedValues, databaseType]);

  // Test database connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const config = {
        type: databaseType,
        host: watchedValues.host || '',
        port: watchedValues.port || getDefaultPort(databaseType),
        database: watchedValues.database || '',
        username: watchedValues.username || '',
        password: watchedValues.password || '',
        ssl: watchedValues.ssl || false,
        schema: watchedValues.schema || '',
        instance: watchedValues.instance || '',
      };

      const validation = validateDatabaseConfig(config);
      
      if (!validation.isValid) {
        setTestResult({
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        });
        return;
      }

      // Log connection details for debugging
      console.log('Testing MS SQL connection with config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        ssl: config.ssl,
        instance: config.instance
      });

      // Use actual database service for connection testing
      const isConnected = await databaseService.testConnection(config);
      
      setTestResult({
        success: isConnected,
        message: isConnected 
          ? `Successfully connected to ${databaseType.toUpperCase()} database`
          : `Failed to connect: ${databaseType.toUpperCase()} server is not responding`
      });

    } catch (error) {
      console.error('Database connection test failed:', error);
      setTestResult({
        success: false,
        message: `Connection test failed: ${error}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Get default port for database type
  function getDefaultPort(type: DatabaseType): number {
    switch (type) {
      case 'mysql':
        return 3306;
      case 'postgresql':
        return 5432;
      case 'mssql':
        return 1433;
      default:
        return 3306;
    }
  }

  // Get connection string format for the database type
  const getConnectionStringFormat = (type: DatabaseType): string => {
    switch (type) {
      case 'mysql':
        return 'mysql://username:password@host:port/database';
      case 'postgresql':
        return 'postgresql://username:password@host:port/database';
      case 'mssql':
        return 'mssql://username:password@host:port/database';
      default:
        return 'database://username:password@host:port/database';
    }
  };

  // Get SSL requirements for database type
  const getSSLRequirements = (type: DatabaseType): string => {
    switch (type) {
      case 'mysql':
        return 'SSL is recommended for MySQL connections in production environments.';
      case 'postgresql':
        return 'SSL is highly recommended for PostgreSQL connections.';
      case 'mssql':
        return 'SSL is required for MS SQL Server connections in most environments.';
      default:
        return 'SSL is recommended for secure database connections.';
    }
  };

  // Get MS SQL connection troubleshooting tips
  const getMSSQLTroubleshootingTips = () => {
    return [
      'Ensure SQL Server is running and accessible',
      'Check if TCP/IP protocol is enabled in SQL Server Configuration Manager',
      'Verify the port number (default: 1433)',
      'Check Windows Firewall settings',
      'Ensure SQL Server Authentication is enabled',
      'Verify the instance name if using named instances',
      'Check if the database exists and user has permissions'
    ];
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}

      <form>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Database Type Info */}
          <Box sx={{ 
            p: 1.5, 
            backgroundColor: 'info.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'info.200'
          }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 0.5 }}>
              {databaseType.toUpperCase()} Connection
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Connection String Format: {getConnectionStringFormat(databaseType)}
            </Typography>
          </Box>

          {/* Host and Port */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              size="small"
              label="Host"
              placeholder="localhost"
              sx={{ 
                flex: 1,
                '& .MuiInputBase-input': { fontSize: '0.8rem' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' }
              }}
              {...register('host', {
                required: 'Host is required',
              })}
              error={!!errors.host}
              helperText={errors.host?.message}
              disabled={disabled}
            />
            <TextField
              size="small"
              label="Port"
              type="number"
              sx={{ 
                flex: 1,
                '& .MuiInputBase-input': { fontSize: '0.8rem' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' }
              }}
              {...register('port', {
                required: 'Port is required',
                min: { value: 1, message: 'Port must be at least 1' },
                max: { value: 65535, message: 'Port must not exceed 65535' },
              })}
              error={!!errors.port}
              helperText={errors.port?.message}
              disabled={disabled}
            />
          </Box>
          
          {/* Database Name */}
          <TextField
            fullWidth
            size="small"
            label="Database Name"
            placeholder={`Enter ${databaseType} database name`}
            sx={{ 
              '& .MuiInputBase-input': { fontSize: '0.8rem' },
              '& .MuiInputLabel-root': { fontSize: '0.8rem' }
            }}
            {...register('database', {
              required: 'Database name is required',
            })}
            error={!!errors.database}
            helperText={errors.database?.message}
            disabled={disabled}
          />
          
          {/* Username */}
          <TextField
            fullWidth
            size="small"
            label="Username"
            placeholder={`Enter ${databaseType} username`}
            sx={{ 
              '& .MuiInputBase-input': { fontSize: '0.8rem' },
              '& .MuiInputLabel-root': { fontSize: '0.8rem' }
            }}
            {...register('username', {
              required: 'Username is required',
            })}
            error={!!errors.username}
            helperText={errors.username?.message}
            disabled={disabled}
          />
          
          {/* Password */}
          <TextField
            fullWidth
            size="small"
            label="Password"
            type="password"
            placeholder={`Enter ${databaseType} password`}
            sx={{ 
              '& .MuiInputBase-input': { fontSize: '0.8rem' },
              '& .MuiInputLabel-root': { fontSize: '0.8rem' }
            }}
            {...register('password', {
              required: 'Password is required',
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={disabled}
          />

          {/* Database-specific fields */}
          {databaseType === 'postgresql' && (
            <TextField
              fullWidth
              size="small"
              label="Schema (Optional)"
              placeholder="public"
              sx={{ 
                '& .MuiInputBase-input': { fontSize: '0.8rem' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' }
              }}
              {...register('schema')}
              error={!!errors.schema}
              helperText="PostgreSQL schema name (defaults to 'public')"
              disabled={disabled}
            />
          )}

          {databaseType === 'mssql' && (
            <TextField
              fullWidth
              size="small"
              label="Instance (Optional)"
              placeholder="SQLEXPRESS"
              sx={{ 
                '& .MuiInputBase-input': { fontSize: '0.8rem' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' }
              }}
              {...register('instance')}
              error={!!errors.instance}
              helperText="SQL Server instance name (e.g., SQLEXPRESS)"
              disabled={disabled}
            />
          )}

          <Divider sx={{ my: 1 }} />

          {/* SSL Configuration */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  {...register('ssl')}
                  size="small"
                  disabled={disabled}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Use SSL Connection
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {getSSLRequirements(databaseType)}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </Box>

          {/* Connection String Preview */}
          {connectionString && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
                  Connection String Preview
                </Typography>
                <Box sx={{ 
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all'
                }}>
                  {connectionString}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Test Connection */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={isTestingConnection ? <CircularProgress size={16} /> : <TestIcon />}
              onClick={testConnection}
              disabled={disabled || isTestingConnection || !watchedValues.host || !watchedValues.database}
              sx={{ 
                fontSize: '0.75rem',
                py: 0.5,
                mb: 1
              }}
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>

        {/* Test Result */}
        {testResult && (
          <Alert 
            severity={testResult.success ? 'success' : 'error'} 
            icon={testResult.success ? <CheckIcon /> : <ErrorIcon />}
            sx={{ fontSize: '0.8rem' }}
          >
            {testResult.message}
          </Alert>
        )}

        {/* MS SQL Troubleshooting Tips */}
        {databaseType === 'mssql' && testResult && !testResult.success && (
          <Card sx={{ mt: 2, backgroundColor: 'info.light' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
                MS SQL Server Connection Troubleshooting:
              </Typography>
              <List dense sx={{ fontSize: '0.7rem' }}>
                {getMSSQLTroubleshootingTips().map((tip, index) => (
                  <ListItem key={index} sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary={`• ${tip}`}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
          </Box>

          {/* Database-specific additional fields */}
          {databaseType === 'mysql' && (
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: 'warning.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.200'
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                💡 MySQL Tip: Ensure your MySQL server allows connections from this host and that the user has proper permissions.
              </Typography>
            </Box>
          )}

          {databaseType === 'postgresql' && (
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: 'success.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'success.200'
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                💡 PostgreSQL Tip: Make sure pg_hba.conf allows connections and that the database exists.
              </Typography>
            </Box>
          )}

          {databaseType === 'mssql' && (
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: 'error.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.200'
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                💡 MS SQL Server Tip: Ensure SQL Server authentication is enabled and the user has database access permissions.
              </Typography>
            </Box>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default DatabaseConnectionForm;

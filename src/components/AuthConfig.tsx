import React, { useState } from 'react';
import {
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Typography,
  Chip,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import CryptoJS from 'crypto-js';
import type { AuthConfig } from '../types';

// Props interface for the Authentication Configuration Component
export interface AuthConfigProps {
  value: AuthConfig;
  onChange: (config: AuthConfig) => void;
  disabled?: boolean;
}

// Authentication type configurations
const AUTH_TYPES = [
  {
    value: 'none',
    label: 'No Authentication',
    description: 'No authentication required',
    icon: <SecurityIcon sx={{ fontSize: 16 }} />,
    color: '#757575' as const,
  },
  {
    value: 'bearer',
    label: 'Bearer Token',
    description: 'Authorization header with Bearer token',
    icon: <KeyIcon sx={{ fontSize: 16 }} />,
    color: '#4caf50' as const,
  },
  {
    value: 'basic',
    label: 'Basic Authentication',
    description: 'Username and password authentication',
    icon: <PersonIcon sx={{ fontSize: 16 }} />,
    color: '#2196f3' as const,
  },
  {
    value: 'oauth2',
    label: 'OAuth 2.0',
    description: 'OAuth 2.0 authentication flow',
    icon: <LockIcon sx={{ fontSize: 16 }} />,
    color: '#ff9800' as const,
  },
] as const;

// Encryption key (in production, this should come from environment variables)
const ENCRYPTION_KEY = 'hackoholics-auth-key-2024';

// Form data interface
interface AuthFormData {
  authType: AuthConfig['type'];
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  grantType?: string;
}

// Test result interface
interface TestResult {
  status: 'success' | 'error' | 'testing';
  message: string;
}

const AuthConfigComponent: React.FC<AuthConfigProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Initialize form with current values
  const { control, handleSubmit, watch, setValue } = useForm<AuthFormData>({
    defaultValues: {
      authType: value.type,
      token: value.credentials?.token || '',
      username: value.credentials?.username || '',
      password: value.credentials?.password || '',
      clientId: value.credentials?.clientId || '',
      clientSecret: value.credentials?.clientSecret || '',
      scope: value.credentials?.scope || '',
      grantType: value.credentials?.grantType || 'client_credentials',
    },
  });

  const watchedAuthType = watch('authType');

  // Encryption/Decryption functions
  const encryptCredentials = (credentials: any): any => {
    if (!credentials) return null;
    
    try {
      const encryptedCredentials: any = {};
      for (const [key, val] of Object.entries(credentials)) {
        if (val && typeof val === 'string') {
          encryptedCredentials[key] = CryptoJS.AES.encrypt(val, ENCRYPTION_KEY).toString();
        } else {
          encryptedCredentials[key] = val;
        }
      }
      return encryptedCredentials;
    } catch (error) {
      console.error('Encryption failed:', error);
      return credentials;
    }
  };


  // Handle authentication type change
  const handleAuthTypeChange = (newType: AuthConfig['type']) => {
    setValue('authType', newType);
    onChange({
      type: newType,
      credentials: encryptCredentials(getDefaultCredentials(newType)),
    });
    setTestResult(null);
  };

  // Get default credentials for auth type
  const getDefaultCredentials = (type: AuthConfig['type']) => {
    switch (type) {
      case 'none':
        return null;
      case 'bearer':
        return { token: '' };
      case 'basic':
        return { username: '', password: '' };
      case 'oauth2':
        return {
          clientId: '',
          clientSecret: '',
          scope: '',
          grantType: 'client_credentials',
        };
      default:
        return null;
    }
  };


  // Watch for changes and automatically update parent
  React.useEffect(() => {
    const subscription = watch((data) => {
      const credentials = getCredentialsFromFormData(data as AuthFormData);
      const encryptedCredentials = encryptCredentials(credentials);
      
      onChange({
        type: data.authType || 'none',
        credentials: encryptedCredentials,
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  // Get credentials object from form data
  const getCredentialsFromFormData = (data: AuthFormData) => {
    switch (data.authType) {
      case 'none':
        return null;
      case 'bearer':
        return { token: data.token || '' };
      case 'basic':
        return { 
          username: data.username || '', 
          password: data.password || '' 
        };
      case 'oauth2':
        return {
          clientId: data.clientId || '',
          clientSecret: data.clientSecret || '',
          scope: data.scope || '',
          grantType: data.grantType || 'client_credentials',
        };
      default:
        return null;
    }
  };


  // Test authentication
  const testAuthentication = async (data: AuthFormData) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock validation logic (replace with actual API calls)
      const credentials = getCredentialsFromFormData(data);
      
      switch (data.authType) {
        case 'none':
          setTestResult({
            status: 'success',
            message: 'No authentication required - test passed'
          });
          break;
        case 'bearer':
          if (credentials?.token && credentials.token.length > 10) {
            setTestResult({
              status: 'success',
              message: 'Bearer token validation successful'
            });
          } else {
            setTestResult({
              status: 'error',
              message: 'Invalid or empty bearer token'
            });
          }
          break;
        case 'basic':
          if (credentials?.username && credentials?.password) {
            setTestResult({
              status: 'success',
              message: 'Basic authentication validation successful'
            });
          } else {
            setTestResult({
              status: 'error',
              message: 'Username and password are required'
            });
          }
          break;
        case 'oauth2':
          if (credentials?.clientId && credentials?.clientSecret) {
            setTestResult({
              status: 'success',
              message: 'OAuth 2.0 credentials validation successful'
            });
          } else {
            setTestResult({
              status: 'error',
              message: 'Client ID and Client Secret are required'
            });
          }
          break;
        default:
          setTestResult({
            status: 'error',
            message: 'Unknown authentication type'
          });
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Authentication test failed: ' + (error as Error).message
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Render credential fields based on auth type using React Hook Form
  const renderCredentialFields = () => {
    if (watchedAuthType === 'none') {
      return (
        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
          No authentication credentials required for this method.
        </Alert>
      );
    }

    switch (watchedAuthType) {
      case 'bearer':
        return (
          <Controller
            name="token"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                label="Bearer Token"
                type="password"
                disabled={disabled}
                placeholder="Enter your bearer token"
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.8rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                }}
              />
            )}
          />
        );

      case 'basic':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Username"
                  type="text"
                  disabled={disabled}
                  placeholder="Enter username"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Password"
                  type="password"
                  disabled={disabled}
                  placeholder="Enter password"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              )}
            />
          </Box>
        );

      case 'oauth2':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Client ID"
                  type="password"
                  disabled={disabled}
                  placeholder="Enter OAuth client ID"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              )}
            />
            <Controller
              name="clientSecret"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Client Secret"
                  type="password"
                  disabled={disabled}
                  placeholder="Enter OAuth client secret"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              )}
            />
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Scope"
                  type="password"
                  disabled={disabled}
                  placeholder="read write admin"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              )}
            />
            <Controller
              name="grantType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Grant Type"
                  type="password"
                  disabled={disabled}
                  placeholder="client_credentials"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              )}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const selectedAuthType = AUTH_TYPES.find(type => type.value === watchedAuthType);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Authentication Type Selection with Radio Buttons */}
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
          Authentication Type
        </FormLabel>
        <Controller
          name="authType"
          control={control}
          render={({ field }) => (
            <RadioGroup
              {...field}
              onChange={(e) => {
                field.onChange(e);
                handleAuthTypeChange(e.target.value as AuthConfig['type']);
              }}
              sx={{ gap: 1 }}
            >
              {AUTH_TYPES.map((authType) => (
                <FormControlLabel
                  key={authType.value}
                  value={authType.value}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{ color: authType.color }}>
                        {authType.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {authType.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {authType.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ 
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': { fontSize: '0.8rem' }
                  }}
                />
              ))}
            </RadioGroup>
          )}
        />
      </FormControl>

      {/* Selected Auth Type Indicator */}
      {selectedAuthType && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          p: 1.5,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Box sx={{ color: selectedAuthType.color }}>
            {selectedAuthType.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              {selectedAuthType.label}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              {selectedAuthType.description}
            </Typography>
          </Box>
          <Chip 
            label={selectedAuthType.label} 
            size="small" 
            sx={{ 
              fontSize: '0.7rem',
              backgroundColor: selectedAuthType.color,
              color: 'white'
            }} 
          />
        </Box>
      )}

      {/* Credential Fields */}
      <Box>
        {renderCredentialFields()}
      </Box>

      {/* Test Authentication Button and Result */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={isTesting ? <CircularProgress size={16} /> : <VpnKeyIcon />}
          onClick={handleSubmit(testAuthentication)}
          disabled={disabled || isTesting || watchedAuthType === 'none'}
          sx={{ 
            fontSize: '0.75rem',
            py: 0.5,
            alignSelf: 'flex-start'
          }}
        >
          {isTesting ? 'Testing...' : 'Test Auth'}
        </Button>

        {/* Test Result */}
        {testResult && (
          <Alert 
            severity={testResult.status === 'testing' ? 'info' : testResult.status} 
            icon={testResult.status === 'success' ? <CheckIcon /> : <ErrorIcon />}
            sx={{ fontSize: '0.8rem' }}
          >
            {testResult.message}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default AuthConfigComponent;

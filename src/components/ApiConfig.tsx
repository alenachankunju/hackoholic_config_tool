import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../contexts/AppContext';
import type { ApiConfig, AuthConfig, ApiField } from '../types';
import ApiUrlInput from './ApiUrlInput';
import AuthConfigComponent from './AuthConfig';
import FieldExtractor from './FieldExtractor';
import axios from 'axios';

const ApiConfigPage: React.FC = () => {
  const { state, setApiConfig, setError } = useAppContext();
  
  // Local state for the new API configuration
  const [apiUrl, setApiUrl] = useState(state.apiConfig?.url || '');
  const [httpMethod, setHttpMethod] = useState<ApiConfig['method']>(state.apiConfig?.method || 'GET');
  const [authConfig, setAuthConfig] = useState<AuthConfig>(state.apiConfig?.authentication || { type: 'none', credentials: null });
  const [headers, setHeaders] = useState<string>(JSON.stringify(state.apiConfig?.headers || {}, null, 2));
  
  // API Testing state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const {
    handleSubmit,
    reset,
  } = useForm<{ headers: string }>({
    defaultValues: {
      headers: JSON.stringify(state.apiConfig?.headers || {}, null, 2),
    },
  });

  const onSubmit = (data: { headers: string }) => {
    try {
      // Parse headers JSON
      let parsedHeaders: Record<string, string> = {};
      try {
        parsedHeaders = JSON.parse(data.headers || '{}');
      } catch (error) {
        setError('Invalid JSON format for headers');
        return;
      }

      // Create the new API configuration
      const newApiConfig: ApiConfig = {
        url: apiUrl,
        method: httpMethod,
        authentication: authConfig,
        headers: parsedHeaders,
      };

      setApiConfig(newApiConfig);
      console.log('API Config saved:', newApiConfig);
    } catch (error) {
      setError('Failed to save API configuration');
    }
  };

  const onReset = () => {
    setApiUrl('');
    setHttpMethod('GET');
    setAuthConfig({ type: 'none', credentials: null });
    setHeaders('{}');
    reset();
  };

  // Handle field extraction
  const handleFieldsExtracted = (fields: ApiField[]) => {
    console.log('Extracted fields:', fields);
  };

  // Handle field selection
  const handleFieldsSelected = (selectedFields: Record<string, boolean>) => {
    console.log('Selected fields:', selectedFields);
  };

  // Test API endpoint
  const testApiEndpoint = async () => {
    if (!apiUrl.trim()) {
      setError('Please enter a valid API URL');
      return;
    }

    setIsTestingApi(true);
    setApiError(null);
    setApiResponse(null);
    setResponseStatus(null);
    setResponseTime(null);

    const startTime = Date.now();

    try {
      // Parse headers
      let parsedHeaders: Record<string, string> = {};
      try {
        parsedHeaders = JSON.parse(headers || '{}');
      } catch (error) {
        setApiError('Invalid JSON format for headers');
        setIsTestingApi(false);
        return;
      }

      // Prepare request configuration
      const requestConfig: any = {
        method: httpMethod.toLowerCase(),
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        timeout: 10000, // 10 second timeout
      };

      // Add authentication if configured
      if (authConfig.type !== 'none' && authConfig.credentials) {
        switch (authConfig.type) {
          case 'bearer':
            requestConfig.headers.Authorization = `Bearer ${authConfig.credentials.token}`;
            break;
          case 'basic':
            const credentials = btoa(`${authConfig.credentials.username}:${authConfig.credentials.password}`);
            requestConfig.headers.Authorization = `Basic ${credentials}`;
            break;
          case 'oauth2':
            // For OAuth2, you would typically get a token first
            if (authConfig.credentials.token) {
              requestConfig.headers.Authorization = `Bearer ${authConfig.credentials.token}`;
            }
            break;
        }
      }

      // Make the API request
      const response = await axios(requestConfig);
      const endTime = Date.now();
      
      setApiResponse(response.data);
      setResponseStatus(response.status);
      setResponseTime(endTime - startTime);
      
      // Automatically extract fields from response
      if (response.data) {
        // Fields will be automatically extracted by the FieldExtractor component
        // when it receives the apiResponse data
      }

      setActiveTab(1); // Switch to response tab
      
    } catch (error: any) {
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
      if (error.response) {
        setApiError(`API Error: ${error.response.status} - ${error.response.statusText}`);
        setResponseStatus(error.response.status);
        setApiResponse(error.response.data);
      } else if (error.request) {
        setApiError('Network Error: Unable to reach the API endpoint');
      } else {
        setApiError(`Request Error: ${error.message}`);
      }
    } finally {
      setIsTestingApi(false);
    }
  };

  // Clear API response
  const clearApiResponse = () => {
    setApiResponse(null);
    setApiError(null);
    setResponseStatus(null);
    setResponseTime(null);
  };

  return (
    <Box>
      {state.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {state.error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* API URL Input Component */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              API Endpoint
            </Typography>
            <ApiUrlInput
              value={apiUrl}
              onChange={setApiUrl}
              method={httpMethod}
              onMethodChange={setHttpMethod}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Authentication Configuration */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              Authentication
            </Typography>
            <AuthConfigComponent
              value={authConfig}
              onChange={setAuthConfig}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Custom Headers */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              Custom Headers
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Headers (JSON)"
              multiline
              rows={3}
              placeholder='{"Content-Type": "application/json", "X-Custom-Header": "value"}'
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              sx={{ 
                '& .MuiInputBase-input': { fontSize: '0.8rem' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                '& .MuiFormHelperText-root': { fontSize: '0.7rem' }
              }}
              helperText="Enter custom headers in JSON format"
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* API Testing Section */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              API Testing
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={isTestingApi ? <CircularProgress size={16} /> : <SendIcon />}
                onClick={testApiEndpoint}
                disabled={isTestingApi || !apiUrl.trim()}
                sx={{ 
                  fontSize: '0.75rem',
                  py: 0.5,
                  flex: 1
                }}
              >
                {isTestingApi ? 'Testing...' : 'Test API'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={clearApiResponse}
                disabled={!apiResponse && !apiError}
                sx={{ 
                  fontSize: '0.75rem',
                  py: 0.5,
                  minWidth: 'auto'
                }}
              >
                Clear
              </Button>
            </Box>

            {/* API Response Display */}
            {(apiResponse || apiError) && (
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      API Response
                    </Typography>
                    {responseStatus && (
                      <Chip 
                        label={`${responseStatus}`} 
                        size="small" 
                        color={responseStatus >= 200 && responseStatus < 300 ? 'success' : 'error'}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                    {responseTime && (
                      <Chip 
                        label={`${responseTime}ms`} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>

                  <Tabs 
                    value={activeTab} 
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ minHeight: 'auto', mb: 1 }}
                  >
                    <Tab 
                      label="Response" 
                      sx={{ fontSize: '0.75rem', minHeight: 'auto', py: 0.5 }}
                    />
                    <Tab 
                      label="Fields" 
                      sx={{ fontSize: '0.75rem', minHeight: 'auto', py: 0.5 }}
                    />
                  </Tabs>

                  {activeTab === 0 && (
                    <Box sx={{ 
                      maxHeight: 200, 
                      overflow: 'auto',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      {apiError ? (
                        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                          {apiError}
                        </Alert>
                      ) : (
                        <pre style={{ 
                          margin: 0, 
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {JSON.stringify(apiResponse, null, 2)}
                        </pre>
                      )}
                    </Box>
                  )}

                  {activeTab === 1 && (
                    <Box sx={{ 
                      maxHeight: 200, 
                      overflow: 'auto',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      <FieldExtractor 
                        onFieldsExtracted={handleFieldsExtracted} 
                        onFieldsSelected={handleFieldsSelected}
                        initialJsonData={apiResponse}
                        autoExtract={!!apiResponse}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>

        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
            disabled={state.isLoading || !apiUrl.trim()}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '80px' },
              fontSize: '0.75rem',
              py: 0.5
            }}
          >
            Save Configuration
          </Button>
          <Button
            type="button"
            variant="outlined"
            size="small"
            onClick={onReset}
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
      </form>
    </Box>
  );
};

export default ApiConfigPage;

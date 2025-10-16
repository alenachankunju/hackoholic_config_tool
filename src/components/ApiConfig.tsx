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
import { testAPIConnection, validateAPIResponse } from '../services/apiTestingService';
import { flattenFields } from '../utils/fieldExtractor';

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
  const [activeTab, setActiveTab] = useState(1); // 0=Request, 1=Response, 2=Fields
  const [requestPreview, setRequestPreview] = useState<{ method: string; url: string; headers: Record<string, string> } | null>(null);
  const [validationSummary, setValidationSummary] = useState<{ missing: string[]; mismatches: string[] } | null>(null);
  
  // Field extraction state
  const [extractedFields, setExtractedFields] = useState<ApiField[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});

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

      // Get selected fields from extracted fields
      console.log('All extracted fields (hierarchical):', extractedFields);
      console.log('Selected fields state:', selectedFields);
      
      // Flatten the hierarchical field structure to get ALL fields including nested ones
      const allFlattenedFields = flattenFields(extractedFields);
      console.log('All flattened fields:', allFlattenedFields);
      
      // Filter to only include fields that were selected
      const selectedApiFields = allFlattenedFields.filter(field => 
        selectedFields[field.path] === true
      );
      
      console.log('✅ Filtered selected fields (including array items):', selectedApiFields);
      console.log('📊 Total selected:', selectedApiFields.length);

      // Create the new API configuration
      const newApiConfig: ApiConfig = {
        url: apiUrl,
        method: httpMethod,
        authentication: authConfig,
        headers: parsedHeaders,
        extractedFields: selectedApiFields,
      };

      setApiConfig(newApiConfig);
      console.log('API Config saved:', newApiConfig);
      console.log('Selected fields passed to mapping:', selectedApiFields);
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
    setExtractedFields(fields);
  };

  // Handle field selection
  const handleFieldsSelected = (selectedFields: Record<string, boolean>) => {
    console.log('Selected fields:', selectedFields);
    setSelectedFields(selectedFields);
  };

  // Build auth headers for preview
  const buildAuthHeadersForPreview = (authConfig: AuthConfig): Record<string, string> => {
    const headers: Record<string, string> = {};
    
    if (!authConfig || authConfig.type === 'none') {
      return headers;
    }

    try {
      switch (authConfig.type) {
        case 'bearer': {
          const token = authConfig.credentials?.token || authConfig.credentials?.accessToken;
          if (token) {
            // Show masked token in preview
            const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 10);
            headers['Authorization'] = `Bearer ${maskedToken} (encrypted)`;
          }
          break;
        }
        case 'basic': {
          const username = authConfig.credentials?.username || '';
          const password = authConfig.credentials?.password || '';
          if (username && password) {
            headers['Authorization'] = `Basic ********** (encrypted)`;
          }
          break;
        }
        case 'oauth2': {
          const token = authConfig.credentials?.token || authConfig.credentials?.accessToken;
          if (token) {
            const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 10);
            headers['Authorization'] = `Bearer ${maskedToken} (encrypted)`;
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error building auth headers for preview:', error);
    }

    return headers;
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
    setValidationSummary(null);

    // Parse headers for preview and config
    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = JSON.parse(headers || '{}');
    } catch (error) {
      setApiError('Invalid JSON format for headers');
      setIsTestingApi(false);
      return;
    }

    // Build auth headers for preview
    const authHeaders = buildAuthHeadersForPreview(authConfig);

    // Build complete request preview with auth and custom headers
    const completeHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...parsedHeaders,
    };

    setRequestPreview({ method: httpMethod, url: apiUrl, headers: completeHeaders });

    // Log the config being sent to API testing
    console.log('🧪 Testing API with configuration:');
    console.log('  - URL:', apiUrl);
    console.log('  - Method:', httpMethod);
    console.log('  - Auth Type:', authConfig.type);
    console.log('  - Auth Credentials:', authConfig.credentials ? 'Present' : 'Missing');
    if (authConfig.credentials) {
      console.log('  - Credentials keys:', Object.keys(authConfig.credentials));
      if (authConfig.type === 'bearer' && authConfig.credentials.token) {
        console.log('  - Token length (encrypted):', authConfig.credentials.token.length);
      }
    }
    console.log('  - Custom Headers:', parsedHeaders);

    try {
      const result = await testAPIConnection(
        {
          url: apiUrl,
          method: httpMethod,
          authentication: authConfig,
          headers: parsedHeaders,
        },
        { timeout: 10000, retries: 2 }
      );

      setApiResponse(result.data);
      setResponseStatus(result.statusCode);
      setResponseTime(Math.round(result.responseTime));
      setApiError(result.errors && result.errors.length > 0 ? result.errors.join('\n') : null);

      // Validate against selected expected fields
      const expected = extractedFields.filter(f => selectedFields[f.path] === true);
      if (expected.length > 0 && result.data) {
        const v = validateAPIResponse(result.data, expected);
        setValidationSummary({ missing: v.missingFields, mismatches: v.typeMismatches });
      }

      setActiveTab(1); // Response tab
    } catch (error: any) {
      setApiError(error?.message || 'Unknown error during API test');
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
              rows={4}
              placeholder={`{
  "accept": "application/json",
  "accept-language": "en-US,en;q=0.9",
  "accept-version": "v1"
}`}
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              sx={{ 
                '& .MuiInputBase-input': { fontSize: '0.8rem', fontFamily: 'monospace' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                '& .MuiFormHelperText-root': { fontSize: '0.7rem' }
              }}
              helperText="Custom headers in JSON format. Authorization header is added automatically from authentication config."
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
                  flex: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                  },
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
                      label="Request" 
                      sx={{ fontSize: '0.75rem', minHeight: 'auto', py: 0.5 }}
                    />
                    <Tab 
                      label="Response" 
                      sx={{ fontSize: '0.75rem', minHeight: 'auto', py: 0.5 }}
                    />
                    <Tab 
                      label="Fields" 
                      sx={{ fontSize: '0.75rem', minHeight: 'auto', py: 0.5 }}
                    />
                  </Tabs>

                  {activeTab === 1 && (
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

                  {activeTab === 2 && (
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

                  {activeTab === 0 && requestPreview && (
                    <Box sx={{ 
                      maxHeight: 200, 
                      overflow: 'auto',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
{`Method: ${requestPreview.method}\nURL: ${requestPreview.url}\nHeaders: ${JSON.stringify(requestPreview.headers, null, 2)}`}
                      </pre>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>

        {/* Selected Fields Summary and Validation */}
        {extractedFields.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
                Selected Fields for Mapping ({Object.values(selectedFields).filter(Boolean).length}/{flattenFields(extractedFields).length})
              </Typography>
              {Object.values(selectedFields).filter(Boolean).length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {flattenFields(extractedFields)
                    .filter(field => selectedFields[field.path])
                    .map((field, index) => (
                      <Chip
                        key={index}
                        label={`${field.name} (${field.type})`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.7rem', height: 18 }}
                      />
                    ))}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  No fields selected. Select fields in the tree view above to include them in the mapping.
                </Typography>
              )}

              {validationSummary && (
                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {validationSummary.missing.length > 0 && (
                    <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
                      Missing fields: {validationSummary.missing.join(', ')}
                    </Alert>
                  )}
                  {validationSummary.mismatches.length > 0 && (
                    <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
                      Type mismatches: {validationSummary.mismatches.join('; ')}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={state.isLoading || !apiUrl.trim()}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '80px' },
              fontSize: '0.75rem',
              py: 0.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            Save Configuration
            {extractedFields.length > 0 && (
              <Chip 
                label={`${Object.values(selectedFields).filter(Boolean).length}/${flattenFields(extractedFields).length} fields`}
                size="small"
                color="secondary"
                sx={{ 
                  ml: 1, 
                  fontSize: '0.7rem', 
                  height: 20,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
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

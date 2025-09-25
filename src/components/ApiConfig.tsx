import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../contexts/AppContext';
import type { ApiConfig, AuthConfig, ApiField } from '../types';
import ApiUrlInput from './ApiUrlInput';
import AuthConfigComponent from './AuthConfig';
import FieldExtractor from './FieldExtractor';

const ApiConfigPage: React.FC = () => {
  const { state, setApiConfig, setError } = useAppContext();
  
  // Local state for the new API configuration
  const [apiUrl, setApiUrl] = useState(state.apiConfig?.url || '');
  const [httpMethod, setHttpMethod] = useState<ApiConfig['method']>(state.apiConfig?.method || 'GET');
  const [authConfig, setAuthConfig] = useState<AuthConfig>(state.apiConfig?.authentication || { type: 'none', credentials: null });
  const [headers, setHeaders] = useState<string>(JSON.stringify(state.apiConfig?.headers || {}, null, 2));
  const [extractedFields, setExtractedFields] = useState<ApiField[]>([]);

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
    setExtractedFields([]);
    reset();
  };

  // Handle field extraction
  const handleFieldsExtracted = (fields: ApiField[]) => {
    setExtractedFields(fields);
    console.log('Extracted fields:', fields);
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

          {/* Field Extractor */}
          <Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    API Response Field Extractor
                  </Typography>
                  {extractedFields.length > 0 && (
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem', 
                      color: 'success.main',
                      fontWeight: 'bold'
                    }}>
                      ({extractedFields.length} fields extracted)
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Box sx={{ p: 2 }}>
                  <FieldExtractor onFieldsExtracted={handleFieldsExtracted} />
                </Box>
              </AccordionDetails>
            </Accordion>
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

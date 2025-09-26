import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Http as HttpIcon,
} from '@mui/icons-material';

// Props interface for the API URL Input Component
export interface ApiUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  onMethodChange: (method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Validation states
type ValidationState = 'valid' | 'invalid' | 'empty' | 'checking';

const ApiUrlInput: React.FC<ApiUrlInputProps> = ({
  value,
  onChange,
  method,
  onMethodChange,
  error,
  helperText,
  disabled = false,
}) => {
  const [validationState, setValidationState] = useState<ValidationState>('empty');
  const [isValidating, setIsValidating] = useState(false);

  // Real-time URL validation
  useEffect(() => {
    if (!value.trim()) {
      setValidationState('empty');
      return;
    }

    setIsValidating(true);
    
    // Simulate validation delay for better UX
    const validationTimer = setTimeout(() => {
      const isValid = URL_REGEX.test(value.trim());
      setValidationState(isValid ? 'valid' : 'invalid');
      setIsValidating(false);
    }, 300);

    return () => clearTimeout(validationTimer);
  }, [value]);

  // Handle URL input change
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  // Handle method change
  const handleMethodChange = (event: any) => {
    onMethodChange(event.target.value);
  };

  // Get validation icon
  const getValidationIcon = () => {
    if (isValidating) {
      return (
        <Box sx={{ 
          width: 20, 
          height: 20, 
          borderRadius: '50%', 
          border: '2px solid #1976d2',
          borderTop: '2px solid transparent',
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }} />
      );
    }

    switch (validationState) {
      case 'valid':
        return <CheckIcon color="success" sx={{ fontSize: 20 }} />;
      case 'invalid':
        return <ErrorIcon color="error" sx={{ fontSize: 20 }} />;
      default:
        return null;
    }
  };

  // Get helper text
  const getHelperText = () => {
    if (error) return error;
    if (helperText) return helperText;
    
    switch (validationState) {
      case 'valid':
        return 'Valid API URL format';
      case 'invalid':
        return 'Please enter a valid URL (e.g., https://api.example.com)';
      case 'checking':
        return 'Validating URL...';
      default:
        return 'Enter your API endpoint URL';
    }
  };

  // Get text field color based on validation state
  const getTextFieldProps = () => {
    const baseProps = {
      disabled,
      helperText: getHelperText(),
      InputProps: {
        startAdornment: (
          <InputAdornment position="start">
            <HttpIcon color="action" sx={{ fontSize: 18 }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {getValidationIcon()}
          </InputAdornment>
        ),
      },
    };

    if (validationState === 'valid' && !error) {
      return {
        ...baseProps,
        color: 'success' as const,
        focused: true,
      };
    }

    if (validationState === 'invalid' && !error) {
      return {
        ...baseProps,
        error: true,
      };
    }

    return baseProps;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* HTTP Method Dropdown */}
      <FormControl size="small" fullWidth>
        <InputLabel id="http-method-label">HTTP Method</InputLabel>
        <Select
          labelId="http-method-label"
          value={method}
          label="HTTP Method"
          onChange={handleMethodChange}
          disabled={disabled}
          sx={{ 
            '& .MuiSelect-select': { fontSize: '0.8rem' },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' }
          }}
        >
          <MenuItem value="GET" sx={{ fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#4caf50' 
              }} />
              GET
            </Box>
          </MenuItem>
          <MenuItem value="POST" sx={{ fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#2196f3' 
              }} />
              POST
            </Box>
          </MenuItem>
          <MenuItem value="PUT" sx={{ fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#ff9800' 
              }} />
              PUT
            </Box>
          </MenuItem>
          <MenuItem value="DELETE" sx={{ fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#f44336' 
              }} />
              DELETE
            </Box>
          </MenuItem>
          <MenuItem value="PATCH" sx={{ fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#9c27b0' 
              }} />
              PATCH
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* API URL Input */}
      <TextField
        fullWidth
        size="small"
        label="API URL"
        placeholder="https://api.example.com/v1/endpoint"
        value={value}
        onChange={handleUrlChange}
        sx={{ 
          '& .MuiInputBase-input': { fontSize: '0.8rem' },
          '& .MuiInputLabel-root': { fontSize: '0.8rem' },
          '& .MuiFormHelperText-root': { fontSize: '0.7rem' }
        }}
        {...getTextFieldProps()}
      />

      {/* Method Description */}
      <Typography 
        variant="caption" 
        color="text.secondary"
        sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}
      >
        {method === 'GET' && 'Retrieve data from the server'}
        {method === 'POST' && 'Send data to the server to create a resource'}
        {method === 'PUT' && 'Update an existing resource on the server'}
        {method === 'DELETE' && 'Remove a resource from the server'}
        {method === 'PATCH' && 'Partially update a resource on the server'}
      </Typography>
    </Box>
  );
};

export default ApiUrlInput;


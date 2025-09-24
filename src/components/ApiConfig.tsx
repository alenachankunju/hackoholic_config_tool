import React from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../contexts/AppContext';
import type { ApiConfig } from '../types';

const ApiConfigPage: React.FC = () => {
  const { state, setApiConfig, setError } = useAppContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApiConfig>({
    defaultValues: state.apiConfig || {
      baseUrl: '',
      timeout: 5000,
      headers: {},
    },
  });

  const onSubmit = (data: ApiConfig) => {
    try {
      setApiConfig(data);
      // Here you would typically save to localStorage or make an API call
      console.log('API Config saved:', data);
    } catch (error) {
      setError('Failed to save API configuration');
    }
  };

  const onReset = () => {
    reset();
  };

  return (
    <Box>
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Base URL"
            placeholder="https://api.example.com"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            {...register('baseUrl', {
              required: 'Base URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL',
              },
            })}
            error={!!errors.baseUrl}
            helperText={errors.baseUrl?.message}
          />
          <TextField
            fullWidth
            size="small"
            label="Timeout (ms)"
            type="number"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            {...register('timeout', {
              required: 'Timeout is required',
              min: { value: 1000, message: 'Timeout must be at least 1000ms' },
              max: { value: 60000, message: 'Timeout must not exceed 60000ms' },
            })}
            error={!!errors.timeout}
            helperText={errors.timeout?.message}
          />
          <TextField
            fullWidth
            size="small"
            label="Headers (JSON)"
            multiline
            rows={2}
            placeholder='{"Authorization": "Bearer token"}'
            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            {...register('headers')}
          />
        </Box>

        <Box sx={{ 
          mt: 1.5, 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
            disabled={state.isLoading}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '80px' },
              fontSize: '0.75rem',
              py: 0.5
            }}
          >
            Save
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

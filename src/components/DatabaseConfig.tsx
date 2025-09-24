import React from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../contexts/AppContext';
import type { DatabaseConfig } from '../types';

const DatabaseConfigPage: React.FC = () => {
  const { state, setDatabaseConfig, setError } = useAppContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DatabaseConfig>({
    defaultValues: state.databaseConfig || {
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    },
  });

  const onSubmit = (data: DatabaseConfig) => {
    try {
      setDatabaseConfig(data);
      // Here you would typically save to localStorage or make an API call
      console.log('Database Config saved:', data);
    } catch (error) {
      setError('Failed to save database configuration');
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
                '& .MuiInputBase-input': { fontSize: '0.8rem' }
              }}
              {...register('host', {
                required: 'Host is required',
              })}
              error={!!errors.host}
              helperText={errors.host?.message}
            />
            <TextField
              size="small"
              label="Port"
              type="number"
              sx={{ 
                flex: 1,
                '& .MuiInputBase-input': { fontSize: '0.8rem' }
              }}
              {...register('port', {
                required: 'Port is required',
                min: { value: 1, message: 'Port must be at least 1' },
                max: { value: 65535, message: 'Port must not exceed 65535' },
              })}
              error={!!errors.port}
              helperText={errors.port?.message}
            />
          </Box>
          
          <TextField
            fullWidth
            size="small"
            label="Database Name"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            {...register('database', {
              required: 'Database name is required',
            })}
            error={!!errors.database}
            helperText={errors.database?.message}
          />
          
          <TextField
            fullWidth
            size="small"
            label="Username"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            {...register('username', {
              required: 'Username is required',
            })}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
          
          <TextField
            fullWidth
            size="small"
            label="Password"
            type="password"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            {...register('password', {
              required: 'Password is required',
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                {...register('ssl')}
                size="small"
              />
            }
            label={<Typography sx={{ fontSize: '0.8rem' }}>Use SSL</Typography>}
            sx={{ mt: 0.5 }}
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

export default DatabaseConfigPage;

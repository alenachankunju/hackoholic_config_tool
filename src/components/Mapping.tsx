import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAppContext } from '../contexts/AppContext';
import type { MappingConfig } from '../types';

const MappingPage: React.FC = () => {
  const { state, setMappingConfig, setError } = useAppContext();
  const [sourceField, setSourceField] = useState('');
  const [targetField, setTargetField] = useState('');

  const {
    handleSubmit,
    control,
    reset,
  } = useForm<MappingConfig>({
    defaultValues: state.mappingConfig || {
      sourceFields: [],
      targetFields: [],
      transformations: {},
    },
  });

  const { fields: sourceFields, append: appendSource, remove: removeSource } = useFieldArray({
    control,
    name: 'sourceFields',
  });

  const { fields: targetFields, append: appendTarget, remove: removeTarget } = useFieldArray({
    control,
    name: 'targetFields',
  });

  const onSubmit = (data: MappingConfig) => {
    try {
      setMappingConfig(data);
      console.log('Mapping Config saved:', data);
    } catch (error) {
      setError('Failed to save mapping configuration');
    }
  };

  const onReset = () => {
    reset();
  };

  const addSourceField = () => {
    if (sourceField.trim()) {
      appendSource({ id: Math.random().toString(36).substr(2, 9), value: sourceField.trim() });
      setSourceField('');
    }
  };

  const addTargetField = () => {
    if (targetField.trim()) {
      appendTarget({ id: Math.random().toString(36).substr(2, 9), value: targetField.trim() });
      setTargetField('');
    }
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
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              Source Fields
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add source field"
                value={sourceField}
                onChange={(e) => setSourceField(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSourceField();
                  }
                }}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={addSourceField}
                disabled={!sourceField.trim()}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <AddIcon fontSize="small" />
              </Button>
            </Box>
            <List dense sx={{ maxHeight: '120px', overflow: 'auto' }}>
              {sourceFields.map((field, index) => (
                <ListItem
                  key={field.id}
                  sx={{ py: 0.5, px: 0 }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => removeSource(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={field.value} 
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.7rem' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              Target Fields
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add target field"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTargetField();
                  }
                }}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={addTargetField}
                disabled={!targetField.trim()}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <AddIcon fontSize="small" />
              </Button>
            </Box>
            <List dense sx={{ maxHeight: '120px', overflow: 'auto' }}>
              {targetFields.map((field, index) => (
                <ListItem
                  key={field.id}
                  sx={{ py: 0.5, px: 0 }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => removeTarget(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={field.value} 
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.7rem' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
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

export default MappingPage;

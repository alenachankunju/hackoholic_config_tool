import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useAppContext } from '../contexts/AppContext';
import SimpleFieldMapping from './SimpleFieldMapping';
import type { FieldMapping as FieldMappingType, DatabaseColumn, ApiField } from '../types';

const MappingPage: React.FC = () => {
  const { state } = useAppContext();
  const [mappings, setMappings] = useState<FieldMappingType[]>([]);
  const [apiFields, setApiFields] = useState<any[]>([]);
  const [databaseFields, setDatabaseFields] = useState<DatabaseColumn[]>([]);

  // Debug: Log the current state
  console.log('Mapping page state:', {
    apiConfig: state.apiConfig,
    databaseConfig: state.databaseConfig,
    isLoading: state.isLoading,
    error: state.error
  });

  // Load API fields from context
  useEffect(() => {
    if (state.apiConfig?.extractedFields && state.apiConfig.extractedFields.length > 0) {
      console.log('Loading API fields from context:', state.apiConfig.extractedFields);
      // Convert ApiField[] to DraggedField[] format
      const draggedFields = state.apiConfig.extractedFields.map((field: ApiField) => ({
        id: `api-${field.name}`,
        name: field.name,
        type: field.type,
        source: 'api' as const,
        nullable: true,
        constraints: [],
        path: field.path, // Include path for reference
      }));
      console.log('Converted API fields:', draggedFields);
      setApiFields(draggedFields);
    } else {
      setApiFields([]);
    }
  }, [state.apiConfig?.extractedFields]);

  // Load database fields from context
  useEffect(() => {
    const injected = (window as any).__setSelectedTableColumns;
    if (state.databaseConfig && Array.isArray(injected)) {
      setDatabaseFields(injected as DatabaseColumn[]);
    } else {
      setDatabaseFields([]);
    }
  }, [state.databaseConfig]);

  const handleMappingChange = (newMappings: FieldMappingType[]) => {
    setMappings(newMappings);
  };


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
        Field Mapping
      </Typography>
      
      {state.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {state.error}
        </Alert>
      )}

      {/* Status Cards (removed API card as requested) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {databaseFields.length}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              Database Fields Available
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {mappings.length}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              Active Mappings
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Field Mapping Panel */}
      <SimpleFieldMapping
        apiFields={apiFields}
        dbColumns={databaseFields}
        mappings={mappings}
        onMappingChange={handleMappingChange}
        onClearMappings={() => setMappings([])}
        disabled={state.isLoading}
      />
    </Box>
  );
};

export default MappingPage;
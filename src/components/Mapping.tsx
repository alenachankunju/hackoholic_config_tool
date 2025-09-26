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
      {state.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {state.error}
        </Alert>
      )}


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
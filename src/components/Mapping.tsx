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
      console.log('No API fields found in context, using mock data');
      // Use mock API fields for testing
      const mockApiFields = [
        { id: 'api-id', name: 'id', type: 'number', source: 'api' as const, nullable: false, constraints: [] },
        { id: 'api-name', name: 'name', type: 'string', source: 'api' as const, nullable: false, constraints: [] },
        { id: 'api-email', name: 'email', type: 'string', source: 'api' as const, nullable: false, constraints: [] },
        { id: 'api-age', name: 'age', type: 'number', source: 'api' as const, nullable: true, constraints: [] },
        { id: 'api-active', name: 'isActive', type: 'boolean', source: 'api' as const, nullable: false, constraints: [] },
      ];
      setApiFields(mockApiFields);
    }
  }, [state.apiConfig?.extractedFields]);

  // Load database fields from context
  useEffect(() => {
    if (state.databaseConfig) {
      // This would be populated from the database schema
      // For now, we'll use mock data
      setDatabaseFields([
        { name: 'id', type: 'int', nullable: false, constraints: ['PRIMARY KEY'] },
        { name: 'name', type: 'varchar(100)', nullable: false, constraints: [] },
        { name: 'email', type: 'varchar(255)', nullable: false, constraints: ['UNIQUE'] },
        { name: 'created_at', type: 'timestamp', nullable: false, constraints: [] },
        { name: 'age', type: 'int', nullable: true, constraints: [] },
        { name: 'is_active', type: 'boolean', nullable: false, constraints: [] },
        { name: 'salary', type: 'decimal(10,2)', nullable: true, constraints: [] },
      ]);
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

      {/* Status Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {apiFields.length}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              API Fields Available
            </Typography>
          </CardContent>
        </Card>
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
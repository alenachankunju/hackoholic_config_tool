import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DragDropProvider, useDragDropContext, convertToDraggedField, createApiField } from '../contexts/DragDropContext';
import DraggableField from './DraggableField';
import DropZone from './DropZone';
import type { DraggedField, DropResult, FieldMapping } from '../types';

interface FieldMappingProps {
  apiFields?: any[];
  databaseFields?: any[];
  onMappingChange?: (mappings: FieldMapping[]) => void;
  onSave?: (mappings: FieldMapping[]) => void;
  disabled?: boolean;
}

const FieldMappingContent: React.FC<FieldMappingProps> = ({
  apiFields = [],
  databaseFields = [],
  onMappingChange,
  onSave,
  disabled = false,
}) => {
  const { onFieldDrop } = useDragDropContext();
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [apiFieldsInMapping, setApiFieldsInMapping] = useState<DraggedField[]>([]);
  const [databaseFieldsInMapping, setDatabaseFieldsInMapping] = useState<DraggedField[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Convert API fields to draggable format
  const draggableApiFields = apiFields.map(field => 
    createApiField(field.name, field.type, field.nullable)
  );

  // Convert database fields to draggable format
  const draggableDatabaseFields = databaseFields.map(field => 
    convertToDraggedField(field, 'database', field.schema, field.table)
  );

  const handleFieldDrop = useCallback((result: DropResult) => {
    const { field, targetId } = result;
    
    if (targetId === 'api-zone') {
      setApiFieldsInMapping(prev => [...prev, field]);
    } else if (targetId === 'database-zone') {
      setDatabaseFieldsInMapping(prev => [...prev, field]);
    } else if (targetId === 'mapping-zone') {
      // Handle mapping creation
      const newMapping: FieldMapping = {
        id: `mapping-${Date.now()}`,
        sourceField: field,
        targetField: field, // This would be set by the user
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setMappings(prev => [...prev, newMapping]);
      onMappingChange?.([...mappings, newMapping]);
    }
    
    onFieldDrop(result);
  }, [mappings, onMappingChange, onFieldDrop]);

  const handleClearMapping = () => {
    setMappings([]);
    setApiFieldsInMapping([]);
    setDatabaseFieldsInMapping([]);
    onMappingChange?.([]);
  };

  const handleSave = () => {
    try {
      onSave?.(mappings);
      setError(null);
    } catch (err) {
      setError('Failed to save field mappings');
    }
  };


  const handleRemoveMapping = (mappingId: string) => {
    setMappings(prev => prev.filter(m => m.id !== mappingId));
    onMappingChange?.(mappings.filter(m => m.id !== mappingId));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          Field Mapping
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Clear all mappings">
            <IconButton size="small" onClick={handleClearMapping} disabled={disabled}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save mappings">
            <IconButton size="small" onClick={handleSave} disabled={disabled}>
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Chip 
          label={`${apiFieldsInMapping.length} API Fields`} 
          color="primary" 
          size="small" 
        />
        <Chip 
          label={`${databaseFieldsInMapping.length} Database Fields`} 
          color="secondary" 
          size="small" 
        />
        <Chip 
          label={`${mappings.length} Mappings`} 
          color="success" 
          size="small" 
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* API Fields Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 1 }}>
            API Fields
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {draggableApiFields.map((field) => (
              <DraggableField
                key={field.id}
                field={field}
                compact
                disabled={disabled}
              />
            ))}
          </Box>
          
          <DropZone
            id="api-zone"
            title="API Fields"
            description="Drag API fields here"
            variant="api"
            onDrop={handleFieldDrop}
            currentItems={apiFieldsInMapping.length}
            maxItems={10}
            disabled={disabled}
          >
            {apiFieldsInMapping.map((field) => (
              <DraggableField
                key={field.id}
                field={field}
                compact
                disabled={disabled}
              />
            ))}
          </DropZone>
        </Box>

        {/* Database Fields Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 1 }}>
            Database Fields
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {draggableDatabaseFields.map((field) => (
              <DraggableField
                key={field.id}
                field={field}
                compact
                disabled={disabled}
              />
            ))}
          </Box>
          
          <DropZone
            id="database-zone"
            title="Database Fields"
            description="Drag database fields here"
            variant="database"
            onDrop={handleFieldDrop}
            currentItems={databaseFieldsInMapping.length}
            maxItems={10}
            disabled={disabled}
          >
            {databaseFieldsInMapping.map((field) => (
              <DraggableField
                key={field.id}
                field={field}
                compact
                disabled={disabled}
              />
            ))}
          </DropZone>
        </Box>

        {/* Mapping Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 1 }}>
            Field Mappings
          </Typography>
          
          <DropZone
            id="mapping-zone"
            title="Create Mappings"
            description="Drag fields here to create mappings"
            onDrop={handleFieldDrop}
            currentItems={mappings.length}
            maxItems={20}
            disabled={disabled}
            onClear={handleClearMapping}
          >
            {mappings.map((mapping) => (
              <Card key={mapping.id} sx={{ mb: 1 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DraggableField
                      field={mapping.sourceField}
                      compact
                      disabled
                    />
                    <Typography variant="body2" sx={{ mx: 1 }}>
                      →
                    </Typography>
                    <DraggableField
                      field={mapping.targetField}
                      compact
                      disabled
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveMapping(mapping.id)}
                      disabled={disabled}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </DropZone>
        </Box>
      </Box>

      {/* Instructions */}
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
            How to use Field Mapping:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.7rem' }}>
            <li>Drag API fields to the API Fields zone</li>
            <li>Drag database fields to the Database Fields zone</li>
            <li>Create mappings by dragging fields to the Mappings zone</li>
            <li>Use the clear button to remove all mappings</li>
            <li>Save your mappings when done</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const FieldMappingComponent: React.FC<FieldMappingProps> = (props) => {
  return (
    <DragDropProvider>
      <FieldMappingContent {...props} />
    </DragDropProvider>
  );
};

export default FieldMappingComponent;

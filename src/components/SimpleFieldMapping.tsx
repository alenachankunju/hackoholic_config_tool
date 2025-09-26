import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Clear as ClearIcon, Api as ApiIcon, Storage as DatabaseIcon } from '@mui/icons-material';
import { useDrag, useDrop } from 'react-dnd';
import { getCompatibilityResult } from '../utils/typeCompatibility';
import type { DraggedField, FieldMapping, DatabaseColumn } from '../types';

interface SimpleFieldMappingProps {
  apiFields: DraggedField[];
  dbColumns: DatabaseColumn[];
  mappings: FieldMapping[];
  onMappingChange: (mappings: FieldMapping[]) => void;
  onClearMappings?: () => void;
  disabled?: boolean;
}

interface FieldItemProps {
  field: DraggedField;
  onDragStart?: (field: DraggedField) => void;
  onDragEnd?: (field: DraggedField) => void;
  onDrop?: (droppedField: DraggedField, targetField: DraggedField) => void;
  isConnected?: boolean;
  disabled?: boolean;
}

const FieldItem: React.FC<FieldItemProps> = ({
  field,
  onDragStart,
  onDragEnd,
  onDrop,
  isConnected = false,
  disabled = false,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD_ITEM',
    item: () => {
      if (onDragStart) {
        onDragStart(field);
      }
      return field;
    },
    canDrag: !disabled && !isConnected,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      if (onDragEnd) {
        onDragEnd(field);
      }
    },
  }), [field, disabled, isConnected, onDragStart, onDragEnd]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'FIELD_ITEM',
    drop: (droppedField: DraggedField) => {
      if (onDrop && droppedField.source !== field.source) {
        onDrop(droppedField, field);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop, field]);

  const getFieldIcon = () => {
    return field.source === 'api' ? <ApiIcon /> : <DatabaseIcon />;
  };

  return (
    <Card
      ref={(node) => {
        if (drag) {
          drag(node as any);
        }
        if (drop) {
          drop(node as any);
        }
      }}
      sx={{
        cursor: disabled || isConnected ? 'not-allowed' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: 'all 0.2s ease-in-out',
        border: '2px solid',
        borderColor: isOver && canDrop ? 'primary.main' : isConnected ? 'success.main' : 'divider',
        backgroundColor: isOver && canDrop ? 'primary.light' : isConnected ? 'success.light' : 'background.paper',
        '&:hover': {
          boxShadow: disabled || isConnected ? 'none' : '0px 4px 12px rgba(0, 0, 0, 0.15)',
          transform: disabled || isConnected ? 'none' : 'translateY(-2px)',
        },
        mb: 1,
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getFieldIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
              {field.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {field.type}
            </Typography>
          </Box>
          {isConnected && (
            <Chip
              label="Connected"
              size="small"
              color="success"
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface MappingZoneProps {
  onDrop: (sourceField: DraggedField, targetField: DraggedField) => void;
  disabled?: boolean;
}

const MappingZone: React.FC<MappingZoneProps> = ({ onDrop, disabled = false }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'FIELD_ITEM',
    drop: (item: DraggedField) => {
      if (!disabled) {
        // This will be handled by the parent component
        console.log('Dropped item in mapping zone:', item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop, disabled]);

  return (
    <Box
      ref={(node) => {
        if (drop) {
          drop(node as any);
        }
      }}
      sx={{
        minHeight: 200,
        border: '2px dashed',
        borderColor: isOver && canDrop ? 'primary.main' : 'divider',
        backgroundColor: isOver && canDrop ? 'primary.light' : 'grey.50',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        mb: 2,
      }}
    >
      {/* Empty state intentionally minimal */}
    </Box>
  );
};

const SimpleFieldMapping: React.FC<SimpleFieldMappingProps> = ({
  apiFields,
  dbColumns,
  mappings,
  onMappingChange,
  onClearMappings,
  disabled = false,
}) => {
  // Convert database columns to draggable fields
  const draggableDbFields: DraggedField[] = dbColumns.map(col => ({
    id: `db-${col.name}`,
    name: col.name,
    type: col.type,
    source: 'database',
    nullable: col.nullable,
    constraints: col.constraints,
  }));

  // Get connected field IDs
  const connectedApiFields = new Set(mappings.map(m => m.sourceField.id));
  const connectedDbFields = new Set(mappings.map(m => m.targetField.id));

  // Handle field drag start
  const handleDragStart = useCallback((field: DraggedField) => {
    console.log('Drag started:', field.name);
  }, []);

  // Handle field drag end
  const handleDragEnd = useCallback((field: DraggedField) => {
    console.log('Drag ended:', field.name);
  }, []);

  // Handle mapping creation
  const handleCreateMapping = useCallback((sourceField: DraggedField, targetField: DraggedField) => {
    // Check if fields are already connected
    const existingMapping = mappings.find(
      m => m.sourceField.id === sourceField.id || m.targetField.id === targetField.id
    );

    if (existingMapping) {
      return; // Don't create duplicate mappings
    }

    const newMapping: FieldMapping = {
      id: `map-${sourceField.id}-${targetField.id}`,
      sourceField,
      targetField,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onMappingChange([...mappings, newMapping]);
  }, [mappings, onMappingChange]);

  // Handle mapping deletion
  const handleDeleteMapping = useCallback((mappingId: string) => {
    onMappingChange(mappings.filter(m => m.id !== mappingId));
  }, [mappings, onMappingChange]);

  // Handle clear all mappings
  const handleClearAll = useCallback(() => {
    onMappingChange([]);
    onClearMappings?.();
  }, [onMappingChange, onClearMappings]);

  // Handle field drop
  const handleFieldDrop = useCallback((droppedField: DraggedField, targetField: DraggedField) => {
    console.log('Field dropped:', droppedField.name, 'onto:', targetField.name);
    handleCreateMapping(droppedField, targetField);
  }, [handleCreateMapping]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            Field Mapping
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              disabled={disabled || mappings.length === 0}
              sx={{ fontSize: '0.75rem' }}
            >
              Clear All
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          Drag fields from left (API) and right (Database) to create mappings
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
        {/* API Fields */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 1 }}>
            API Fields ({apiFields.length})
          </Typography>
          <Box sx={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            p: 1 
          }}>
            {apiFields.map((field) => (
              <FieldItem
                key={field.id}
                field={field}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleFieldDrop}
                isConnected={connectedApiFields.has(field.id)}
                disabled={disabled}
              />
            ))}
            {apiFields.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontSize: '0.8rem' }}>
                No API fields available
              </Typography>
            )}
          </Box>
        </Box>

        {/* Mapping Zone */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 1 }}>
            Mappings ({mappings.length})
          </Typography>
          <MappingZone onDrop={handleCreateMapping} disabled={disabled} />
          
          {/* Mappings List */}
          <Box sx={{ 
            maxHeight: 300, 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            p: 1 
          }}>
            {mappings.map((mapping) => {
              const compatibility = getCompatibilityResult(
                mapping.sourceField.type,
                mapping.targetField.type
              );

              return (
                <Card key={mapping.id} sx={{ mb: 1, border: '1px solid #e0e0e0' }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                        <Chip
                          label={mapping.sourceField.name}
                          size="small"
                          color="primary"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                          →
                        </Typography>
                        <Chip
                          label={mapping.targetField.name}
                          size="small"
                          color="secondary"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Chip
                          label={compatibility.level.toUpperCase()}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            height: 18,
                            backgroundColor: compatibility.color,
                            color: 'white'
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        disabled={disabled}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                      {mapping.sourceField.type} → {mapping.targetField.type}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
            {mappings.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontSize: '0.8rem' }}>
                No mappings created yet
              </Typography>
            )}
          </Box>
        </Box>

        {/* Database Fields */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 1 }}>
            Database Fields ({draggableDbFields.length})
          </Typography>
          <Box sx={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            p: 1 
          }}>
            {draggableDbFields.map((field) => (
              <FieldItem
                key={field.id}
                field={field}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleFieldDrop}
                isConnected={connectedDbFields.has(field.id)}
                disabled={disabled}
              />
            ))}
            {draggableDbFields.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontSize: '0.8rem' }}>
                No database fields available
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Instructions */}
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
            How to Create Mappings:
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            1. Drag a field from the left panel (API Fields)
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            2. Drop it onto a field from the right panel (Database Fields)
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
            3. The mapping will be created automatically in the center panel
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleFieldMapping;

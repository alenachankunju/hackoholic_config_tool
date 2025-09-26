import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Card,
  CardContent,
  IconButton,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  ListItemText,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Api as ApiIcon,
  Storage as DatabaseIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DraggableField from './DraggableField';
import ConnectionLines from './ConnectionLines';
import MappingValidationEngine from './MappingValidationEngine';
import ValidationIndicator from './ValidationIndicator';
import { getCompatibilityResult } from '../utils/typeCompatibility';
import { useConnectionRefs } from '../hooks/useConnectionRefs';
import { useRealTimeValidation } from '../hooks/useRealTimeValidation';
import type { DraggedField, FieldMapping, DatabaseColumn } from '../types';

interface FieldMappingPanelProps {
  apiFields: DraggedField[];
  dbColumns: DatabaseColumn[];
  mappings: FieldMapping[];
  onMappingChange: (mappings: FieldMapping[]) => void;
  onClearMappings?: () => void;
  disabled?: boolean;
}


const FieldMappingPanel: React.FC<FieldMappingPanelProps> = ({
  apiFields,
  dbColumns,
  mappings,
  onMappingChange,
  onClearMappings,
  disabled = false,
}) => {
  const { sourceRefs, targetRefs, containerRef, getContainerDimensions } = useConnectionRefs();
  
  // Real-time validation
  const {
    validationSummary,
  } = useRealTimeValidation({ mappings, autoValidate: true });
  // Search states
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  
  // Filter states
  const [apiTypeFilter, setApiTypeFilter] = useState<string[]>([]);
  const [dbTypeFilter, setDbTypeFilter] = useState<string[]>([]);
  
  // Mapping states
  const [selectedApiFields, setSelectedApiFields] = useState<string[]>([]);
  const [selectedDbFields, setSelectedDbFields] = useState<string[]>([]);
  const [showOnlyMapped, setShowOnlyMapped] = useState(false);

  // Convert database columns to draggable fields
  const draggableDbFields = useMemo(() => 
    dbColumns.map(col => ({
      id: `db-${col.name}`,
      name: col.name,
      type: col.type,
      source: 'database' as const,
      nullable: col.nullable,
      constraints: col.constraints,
    })), [dbColumns]
  );

  // Filter API fields based on search and type
  const filteredApiFields = useMemo(() => {
    return apiFields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
                           field.type.toLowerCase().includes(apiSearchQuery.toLowerCase());
      const matchesType = apiTypeFilter.length === 0 || apiTypeFilter.includes(field.type);
      const isMapped = mappings.some(m => m.sourceField.id === field.id);
      const matchesMappedFilter = !showOnlyMapped || isMapped;
      
      return matchesSearch && matchesType && matchesMappedFilter;
    });
  }, [apiFields, apiSearchQuery, apiTypeFilter, mappings, showOnlyMapped]);

  // Filter DB fields based on search and type
  const filteredDbFields = useMemo(() => {
    return draggableDbFields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
                           field.type.toLowerCase().includes(dbSearchQuery.toLowerCase());
      const matchesType = dbTypeFilter.length === 0 || dbTypeFilter.includes(field.type);
      const isMapped = mappings.some(m => m.targetField.id === field.id);
      const matchesMappedFilter = !showOnlyMapped || isMapped;
      
      return matchesSearch && matchesType && matchesMappedFilter;
    });
  }, [draggableDbFields, dbSearchQuery, dbTypeFilter, mappings, showOnlyMapped]);

  // Get field type statistics
  const apiTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    apiFields.forEach(field => {
      stats[field.type] = (stats[field.type] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({ type, count }));
  }, [apiFields]);

  const dbTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    dbColumns.forEach(col => {
      stats[col.type] = (stats[col.type] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({ type, count }));
  }, [dbColumns]);

  // Mapping statistics
  const mappingStats = useMemo(() => {
    const totalMappings = mappings.length;
    const mappedApiFields = new Set(mappings.map(m => m.sourceField.id)).size;
    const mappedDbFields = new Set(mappings.map(m => m.targetField.id)).size;
    const unmappedApiFields = apiFields.length - mappedApiFields;
    const unmappedDbFields = dbColumns.length - mappedDbFields;
    
    return {
      totalMappings,
      mappedApiFields,
      mappedDbFields,
      unmappedApiFields,
      unmappedDbFields,
      mappingPercentage: apiFields.length > 0 ? (mappedApiFields / apiFields.length) * 100 : 0,
    };
  }, [mappings, apiFields.length, dbColumns.length]);


  // Handle mapping creation
  const handleCreateMapping = useCallback(() => {
    if (selectedApiFields.length === 1 && selectedDbFields.length === 1) {
      const sourceField = apiFields.find(f => f.id === selectedApiFields[0]);
      const targetField = draggableDbFields.find(f => f.id === selectedDbFields[0]);
      
      if (sourceField && targetField) {
        const newMapping: FieldMapping = {
          id: `mapping-${Date.now()}`,
          sourceField,
          targetField,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        onMappingChange([...mappings, newMapping]);
        setSelectedApiFields([]);
        setSelectedDbFields([]);
      }
    }
  }, [selectedApiFields, selectedDbFields, apiFields, draggableDbFields, mappings, onMappingChange]);

  // Handle mapping deletion
  const handleDeleteMapping = useCallback((mappingId: string) => {
    onMappingChange(mappings.filter(m => m.id !== mappingId));
  }, [mappings, onMappingChange]);

  // Handle clear all mappings
  const handleClearAllMappings = useCallback(() => {
    onMappingChange([]);
    onClearMappings?.();
  }, [onMappingChange, onClearMappings]);


  return (
    <Box ref={containerRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header with Statistics */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              Field Mapping Panel
            </Typography>
            
            {/* Real-time Validation Indicator */}
            <ValidationIndicator
              validationSummary={validationSummary}
              compact={true}
              disabled={disabled}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearAllMappings}
                disabled={disabled || mappings.length === 0}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<LinkIcon />}
                onClick={handleCreateMapping}
                disabled={disabled || selectedApiFields.length !== 1 || selectedDbFields.length !== 1}
              >
                Create Mapping
              </Button>
            </Box>
          </Box>
          
          {/* Statistics */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`${mappingStats.totalMappings} Mappings`} 
              color="primary" 
              size="small" 
            />
            <Chip 
              label={`${mappingStats.mappedApiFields}/${apiFields.length} API Fields`} 
              color="secondary" 
              size="small" 
            />
            <Chip 
              label={`${mappingStats.mappedDbFields}/${dbColumns.length} DB Fields`} 
              color="success" 
              size="small" 
            />
            <Chip 
              label={`${mappingStats.mappingPercentage.toFixed(1)}% Complete`} 
              color="info" 
              size="small" 
            />
          </Box>
        </CardContent>
      </Card>

      {/* Connection Lines Overlay */}
      <ConnectionLines
        mappings={mappings}
        sourceRefs={sourceRefs}
        targetRefs={targetRefs}
        containerDimensions={getContainerDimensions()}
        onMappingClick={(mapping) => console.log('Mapping clicked:', mapping)}
        onMappingDelete={(mappingId) => {
          const updatedMappings = mappings.filter(m => m.id !== mappingId);
          onMappingChange(updatedMappings);
        }}
        disabled={disabled}
      />

      {/* Main Panel Layout */}
      <PanelGroup direction="horizontal" style={{ height: 'calc(100% - 120px)' }}>
        {/* Left Panel - API Fields */}
        <Panel defaultSize={40} minSize={25}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* API Fields Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ApiIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  API Fields (Source)
                </Typography>
                <Badge badgeContent={filteredApiFields.length} color="primary" />
              </Box>
              
              {/* Search and Filters */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search API fields..."
                  value={apiSearchQuery}
                  onChange={(e) => setApiSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type Filter</InputLabel>
                    <Select
                      multiple
                      value={apiTypeFilter}
                      onChange={(e) => setApiTypeFilter(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {apiTypeStats.map(({ type, count }) => (
                        <MenuItem key={type} value={type}>
                          <ListItemText primary={type} secondary={`${count} fields`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOnlyMapped}
                        onChange={(e) => setShowOnlyMapped(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Mapped only"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* API Fields List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {filteredApiFields.map((field, index) => (
                <Box key={field.id} ref={sourceRefs[index]}>
                  <DraggableField
                    field={field}
                    compact
                    disabled={disabled}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle>
          <Box sx={{ 
            width: 4, 
            height: '100%', 
            backgroundColor: 'divider',
            '&:hover': { backgroundColor: 'primary.main' },
            cursor: 'col-resize'
          }} />
        </PanelResizeHandle>

        {/* Right Panel - Database Fields */}
        <Panel defaultSize={40} minSize={25}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Database Fields Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DatabaseIcon color="secondary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Database Fields (Target)
                </Typography>
                <Badge badgeContent={filteredDbFields.length} color="secondary" />
              </Box>
              
              {/* Search and Filters */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search database fields..."
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type Filter</InputLabel>
                    <Select
                      multiple
                      value={dbTypeFilter}
                      onChange={(e) => setDbTypeFilter(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {dbTypeStats.map(({ type, count }) => (
                        <MenuItem key={type} value={type}>
                          <ListItemText primary={type} secondary={`${count} fields`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOnlyMapped}
                        onChange={(e) => setShowOnlyMapped(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Mapped only"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Database Fields List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {filteredDbFields.map((field, index) => (
                <Box key={field.id} ref={targetRefs[index]}>
                  <DraggableField
                    field={field}
                    compact
                    disabled={disabled}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle>
          <Box sx={{ 
            width: 4, 
            height: '100%', 
            backgroundColor: 'divider',
            '&:hover': { backgroundColor: 'primary.main' },
            cursor: 'col-resize'
          }} />
        </PanelResizeHandle>

        {/* Center Panel - Mappings */}
        <Panel defaultSize={20} minSize={15}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Mappings Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LinkIcon color="success" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Field Mappings
                </Typography>
                <Badge badgeContent={mappings.length} color="success" />
              </Box>
            </Box>

            {/* Mappings List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {mappings.map((mapping) => {
                const compatibilityResult = getCompatibilityResult(
                  mapping.sourceField.type, 
                  mapping.targetField.type
                );
                
                return (
                  <Card key={mapping.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {mapping.sourceField.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            →
                          </Typography>
                          {compatibilityResult.level === 'compatible' && <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} />}
                          {compatibilityResult.level === 'warning' && <ErrorIcon sx={{ fontSize: 12, color: 'warning.main' }} />}
                          {compatibilityResult.level === 'error' && <ErrorIcon sx={{ fontSize: 12, color: 'error.main' }} />}
                        </Box>
                        
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {mapping.targetField.name}
                        </Typography>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          disabled={disabled}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {/* Compatibility Details */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={compatibilityResult.level.toUpperCase()}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            height: 16,
                            backgroundColor: compatibilityResult.color,
                            color: 'white'
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                          {mapping.sourceField.type} → {mapping.targetField.type}
                        </Typography>
                      </Box>
                      
                      {/* Suggestions (if any) */}
                      {compatibilityResult.suggestions.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                            💡 {compatibilityResult.suggestions[0]}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Paper>
        </Panel>
      </PanelGroup>

      {/* Mapping Validation Engine */}
      <Box sx={{ mt: 2 }}>
        <MappingValidationEngine
          mappings={mappings}
          apiFields={apiFields}
          dbColumns={dbColumns}
          onValidationComplete={(results) => {
            console.log('Validation completed:', results);
          }}
          onMappingFix={(mappingId, fix) => {
            console.log('Fix mapping:', mappingId, fix);
          }}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
};

export default FieldMappingPanel;

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Checkbox,
  IconButton,
  Collapse,
  Chip,
  Paper,
  Divider,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  TextFields as StringIcon,
  Numbers as NumbersIcon,
  CheckBox as BooleanIcon,
  List as ArrayIcon,
  Folder as ObjectIcon,
  DataObject as DataObjectIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import type { ApiField } from '../types';

// Field selection state interface
export interface FieldSelectionState {
  [fieldPath: string]: boolean;
}

// Props interface for FieldTreeView component
export interface FieldTreeViewProps {
  fields: ApiField[];
  selectedFields: FieldSelectionState;
  onFieldToggle: (fieldPath: string, isSelected: boolean) => void;
  searchPlaceholder?: string;
  showFieldCounts?: boolean;
  maxHeight?: string | number;
  enableSearch?: boolean;
}

// Field type icon mapping
const getFieldTypeIcon = (type: string) => {
  const iconProps = { sx: { fontSize: 16, mr: 0.5 } };
  
  switch (type) {
    case 'string':
      return <StringIcon {...iconProps} color="success" />;
    case 'number':
      return <NumbersIcon {...iconProps} color="warning" />;
    case 'boolean':
      return <BooleanIcon {...iconProps} color="info" />;
    case 'array':
      return <ArrayIcon {...iconProps} color="secondary" />;
    case 'object':
      return <ObjectIcon {...iconProps} color="primary" />;
    case 'null':
      return <DataObjectIcon {...iconProps} color="disabled" />;
    case 'undefined':
      return <CodeIcon {...iconProps} color="disabled" />;
    default:
      return <DataObjectIcon {...iconProps} color="action" />;
  }
};

// Field type color mapping
const getFieldTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' => {
  switch (type) {
    case 'string':
      return 'success';
    case 'number':
      return 'warning';
    case 'boolean':
      return 'info';
    case 'array':
      return 'secondary';
    case 'object':
      return 'primary';
    case 'null':
    case 'undefined':
      return 'default';
    default:
      return 'default';
  }
};

// Individual field tree node component
interface FieldTreeNodeProps {
  field: ApiField;
  level: number;
  isSelected: boolean;
  onToggle: (fieldPath: string, isSelected: boolean) => void;
  searchTerm: string;
  isExpanded: boolean;
  onToggleExpand: (fieldPath: string) => void;
}

const FieldTreeNode: React.FC<FieldTreeNodeProps> = ({
  field,
  level,
  isSelected,
  onToggle,
  searchTerm,
  isExpanded,
  onToggleExpand,
}) => {
  const hasChildren = field.nested && field.nested.length > 0;
  const indentLevel = level * 20;
  
  // Check if field matches search term
  const matchesSearch = searchTerm === '' || 
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.type.toLowerCase().includes(searchTerm.toLowerCase());

  // If search term is active and field doesn't match, don't render
  if (searchTerm !== '' && !matchesSearch) {
    return null;
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(field.path, event.target.checked);
  };

  const handleExpandToggle = () => {
    if (hasChildren) {
      onToggleExpand(field.path);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          px: 1,
          ml: `${indentLevel}px`,
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          cursor: 'pointer',
          minHeight: 32,
        }}
        onClick={handleExpandToggle}
      >
        {/* Expand/Collapse Icon */}
        <Box sx={{ width: 20, display: 'flex', justifyContent: 'center', mr: 0.5 }}>
          {hasChildren ? (
            isExpanded ? (
              <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            )
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </Box>

        {/* Checkbox */}
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          sx={{ mr: 1, p: 0.5 }}
        />

        {/* Field Type Icon */}
        {getFieldTypeIcon(field.type)}

        {/* Field Name */}
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.85rem',
            fontWeight: hasChildren ? 'bold' : 'normal',
            flexGrow: 1,
            mr: 1,
            color: hasChildren ? 'text.primary' : 'text.secondary',
          }}
        >
          {field.name}
        </Typography>

        {/* Field Type Chip */}
        <Chip
          label={field.type}
          size="small"
          color={getFieldTypeColor(field.type)}
          sx={{ fontSize: '0.7rem', height: 20, mr: 1 }}
        />

        {/* JSONPath */}
        <Tooltip title={`JSONPath: ${field.path}`} placement="top">
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              fontFamily: 'monospace',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {field.path}
          </Typography>
        </Tooltip>
      </Box>

      {/* Nested Fields */}
      {hasChildren && (
        <Collapse in={isExpanded}>
          <Box>
            {field.nested?.map((nestedField, index) => (
              <FieldTreeNode
                key={`${nestedField.path}-${index}`}
                field={nestedField}
                level={level + 1}
                isSelected={isSelected} // This should be passed from parent state
                onToggle={onToggle}
                searchTerm={searchTerm}
                isExpanded={isExpanded} // This should be managed per node
                onToggleExpand={onToggleExpand}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

// Main FieldTreeView component
const FieldTreeView: React.FC<FieldTreeViewProps> = ({
  fields,
  selectedFields,
  onFieldToggle,
  searchPlaceholder = "Search fields...",
  showFieldCounts = true,
  maxHeight = 400,
  enableSearch = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Calculate field statistics
  const fieldStats = useMemo(() => {
    const flattenFields = (fieldList: ApiField[]): ApiField[] => {
      const result: ApiField[] = [];
      for (const field of fieldList) {
        result.push(field);
        if (field.nested) {
          result.push(...flattenFields(field.nested));
        }
      }
      return result;
    };

    const allFields = flattenFields(fields);
    const totalFields = allFields.length;
    const selectedCount = Object.values(selectedFields).filter(Boolean).length;

    return {
      totalFields,
      selectedCount,
      allFields,
    };
  }, [fields, selectedFields]);

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!searchTerm) return fields;
    
    const filterFields = (fieldList: ApiField[]): ApiField[] => {
      return fieldList.reduce((acc: ApiField[], field) => {
        const matchesSearch = 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.type.toLowerCase().includes(searchTerm.toLowerCase());

        if (matchesSearch) {
          acc.push({
            ...field,
            nested: field.nested ? filterFields(field.nested) : undefined,
          });
        } else if (field.nested) {
          const filteredNested = filterFields(field.nested);
          if (filteredNested.length > 0) {
            acc.push({
              ...field,
              nested: filteredNested,
            });
          }
        }
        
        return acc;
      }, []);
    };

    return filterFields(fields);
  }, [fields, searchTerm]);

  // Handle expand/collapse
  const handleToggleExpand = (fieldPath: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldPath)) {
        newSet.delete(fieldPath);
      } else {
        newSet.add(fieldPath);
      }
      return newSet;
    });
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Auto-expand nodes when searching
  React.useEffect(() => {
    if (searchTerm) {
      const newExpandedNodes = new Set<string>();
      const expandAll = (fieldList: ApiField[]) => {
        fieldList.forEach(field => {
          if (field.nested && field.nested.length > 0) {
            newExpandedNodes.add(field.path);
            expandAll(field.nested);
          }
        });
      };
      expandAll(filteredFields);
      setExpandedNodes(newExpandedNodes);
    }
  }, [searchTerm, filteredFields]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Search and Counts */}
        <Box sx={{ mb: 2 }}>
          {enableSearch && (
            <TextField
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{ p: 0.5 }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                '& .MuiInputBase-input': { fontSize: '0.8rem' },
              }}
            />
          )}

          {showFieldCounts && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Total Fields: <strong>{fieldStats.totalFields}</strong>
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Selected: <strong>{fieldStats.selectedCount}</strong>
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Field Tree */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            maxHeight,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper',
          }}
        >
          {filteredFields.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <SearchIcon sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {searchTerm ? 'No fields match your search' : 'No fields available'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 1 }}>
              {filteredFields.map((field, index) => (
                <FieldTreeNode
                  key={`${field.path}-${index}`}
                  field={field}
                  level={0}
                  isSelected={selectedFields[field.path] || false}
                  onToggle={onFieldToggle}
                  searchTerm={searchTerm}
                  isExpanded={expandedNodes.has(field.path)}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 2, pt: 1 }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1, display: 'block' }}>
            Field Types:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['string', 'number', 'boolean', 'array', 'object'].map((type) => (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getFieldTypeIcon(type)}
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  {type}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FieldTreeView;

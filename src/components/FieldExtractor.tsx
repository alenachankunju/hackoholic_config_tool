import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  AccountTree as TreeIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { 
  extractFieldsFromJSON, 
  flattenFields,
  type FieldExtractionOptions,
  type FieldExtractionResult 
} from '../utils/fieldExtractor';
import type { ApiField } from '../types';
import FieldTreeView, { type FieldSelectionState } from './FieldTreeView';

interface FieldExtractorProps {
  onFieldsExtracted?: (fields: ApiField[]) => void;
  onFieldsSelected?: (selectedFields: FieldSelectionState) => void;
  initialJsonData?: any; // Auto-populate with JSON data
  autoExtract?: boolean; // Automatically extract fields on mount
}

const FieldExtractor: React.FC<FieldExtractorProps> = ({ 
  onFieldsExtracted, 
  onFieldsSelected, 
  initialJsonData, 
  autoExtract = false 
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [extractionResult, setExtractionResult] = useState<FieldExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<FieldSelectionState>({});
  const [options, setOptions] = useState<FieldExtractionOptions>({
    maxDepth: 10,
    includeNullValues: false,
    arrayIndexLimit: 5,
  });

  // Auto-populate and extract when initialJsonData is provided
  useEffect(() => {
    if (initialJsonData && autoExtract) {
      const jsonString = JSON.stringify(initialJsonData, null, 2);
      setJsonInput(jsonString);
      
      // Automatically extract fields
      extractFieldsFromData(initialJsonData);
    }
  }, [initialJsonData, autoExtract]);

  // Extract fields from data (internal function)
  const extractFieldsFromData = async (data: any) => {
    setIsExtracting(true);
    setExtractionResult(null);

    try {
      const result = extractFieldsFromJSON(data, options);
      setExtractionResult(result);
      
      // Clear previous selections
      setSelectedFields({});
      
      // Notify parent component
      if (onFieldsExtracted && result.fields.length > 0) {
        onFieldsExtracted(result.fields);
      }
      
    } catch (error) {
      setExtractionResult({
        fields: [],
        errors: [`Extraction Error: ${error}`],
        warnings: [],
        statistics: {
          totalFields: 0,
          maxDepth: 0,
          arrayFields: 0,
          objectFields: 0,
          primitiveFields: 0,
        },
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Sample JSON data for testing
  const sampleJsonData = {
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      profile: {
        age: 30,
        bio: "Software developer",
        preferences: {
          theme: "dark",
          notifications: true
        }
      },
      posts: [
        {
          id: 1,
          title: "First Post",
          content: "This is my first post",
          tags: ["tech", "programming"]
        },
        {
          id: 2,
          title: "Second Post",
          content: "This is my second post",
          tags: ["life", "thoughts"]
        }
      ]
    },
    metadata: {
      version: "1.0",
      timestamp: "2024-01-01T00:00:00Z",
      count: 2
    }
  };

  // Handle JSON input change
  const handleJsonInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(event.target.value);
  };

  // Load sample data
  const loadSampleData = () => {
    setJsonInput(JSON.stringify(sampleJsonData, null, 2));
  };

  // Clear input
  const clearInput = () => {
    setJsonInput('');
    setExtractionResult(null);
  };

  // Extract fields from JSON
  const extractFields = async () => {
    setIsExtracting(true);
    setExtractionResult(null);

    try {
      // Parse JSON input
      const jsonData = JSON.parse(jsonInput);
      
      // Extract fields with options
      const result = extractFieldsFromJSON(jsonData, options);
      
      setExtractionResult(result);
      
      // Clear previous selections
      setSelectedFields({});
      
      // Notify parent component
      if (onFieldsExtracted && result.fields.length > 0) {
        onFieldsExtracted(result.fields);
      }
      
    } catch (error) {
      setExtractionResult({
        fields: [],
        errors: [`JSON Parse Error: ${error}`],
        warnings: [],
        statistics: {
          totalFields: 0,
          maxDepth: 0,
          arrayFields: 0,
          objectFields: 0,
          primitiveFields: 0,
        },
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle field selection
  const handleFieldToggle = (fieldPath: string, isSelected: boolean) => {
    const newSelectedFields = {
      ...selectedFields,
      [fieldPath]: isSelected,
    };
    setSelectedFields(newSelectedFields);
    
    // Notify parent component about selection changes
    if (onFieldsSelected) {
      onFieldsSelected(newSelectedFields);
    }
  };


  // Get type color for statistics
  const getTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default' => {
    switch (type) {
      case 'object': return 'primary';
      case 'array': return 'secondary';
      case 'string': return 'success';
      case 'number': return 'warning';
      case 'boolean': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CodeIcon color="primary" />
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          JSON Field Extractor
        </Typography>
        {initialJsonData && autoExtract && (
          <Chip 
            label="Auto-populated from API" 
            size="small" 
            color="success"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>

      {/* Input Section */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            JSON Input
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={loadSampleData}
              sx={{ fontSize: '0.75rem' }}
            >
              Load Sample
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={clearInput}
              sx={{ fontSize: '0.75rem' }}
            >
              Clear
            </Button>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={8}
            value={jsonInput}
            onChange={handleJsonInputChange}
            placeholder="Paste your JSON data here..."
            sx={{ 
              '& .MuiInputBase-input': { fontSize: '0.8rem' },
              '& .MuiInputLabel-root': { fontSize: '0.8rem' }
            }}
          />
        </CardContent>
      </Card>

      {/* Extraction Options */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            Extraction Options
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Max Depth</InputLabel>
                <Select
                  value={options.maxDepth}
                  label="Max Depth"
                  onChange={(e) => setOptions({ ...options, maxDepth: e.target.value as number })}
                >
                  <MenuItem value={5}>5 levels</MenuItem>
                  <MenuItem value={10}>10 levels</MenuItem>
                  <MenuItem value={15}>15 levels</MenuItem>
                  <MenuItem value={20}>20 levels</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Array Limit</InputLabel>
                <Select
                  value={options.arrayIndexLimit}
                  label="Array Limit"
                  onChange={(e) => setOptions({ ...options, arrayIndexLimit: e.target.value as number })}
                >
                  <MenuItem value={0}>All items</MenuItem>
                  <MenuItem value={3}>3 items</MenuItem>
                  <MenuItem value={5}>5 items</MenuItem>
                  <MenuItem value={10}>10 items</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeNullValues}
                  onChange={(e) => setOptions({ ...options, includeNullValues: e.target.checked })}
                  size="small"
                />
              }
              label="Include Null Values"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Extract Button */}
      <Button
        variant="contained"
        onClick={extractFields}
        disabled={!jsonInput.trim() || isExtracting}
        startIcon={<TreeIcon />}
        sx={{ 
          fontSize: '0.8rem',
          py: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
          },
          '&:disabled': {
            background: 'rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {isExtracting ? 'Extracting...' : 'Extract Fields'}
      </Button>

      {/* Results */}
      {extractionResult && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Statistics */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AnalyticsIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Extraction Statistics
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center', flex: '1 1 120px', minWidth: '120px' }}>
                  <Typography variant="h6" color="primary">
                    {extractionResult.statistics.totalFields}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Total Fields
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: '1 1 120px', minWidth: '120px' }}>
                  <Typography variant="h6" color="secondary">
                    {extractionResult.statistics.objectFields}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Objects
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: '1 1 120px', minWidth: '120px' }}>
                  <Typography variant="h6" color="warning.main">
                    {extractionResult.statistics.arrayFields}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Arrays
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: '1 1 120px', minWidth: '120px' }}>
                  <Typography variant="h6" color="success.main">
                    {extractionResult.statistics.primitiveFields}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Primitives
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Errors and Warnings */}
          {(extractionResult.errors.length > 0 || extractionResult.warnings.length > 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {extractionResult.errors.map((error, index) => (
                <Alert key={index} severity="error" icon={<ErrorIcon />} sx={{ fontSize: '0.8rem' }}>
                  {error}
                </Alert>
              ))}
              {extractionResult.warnings.map((warning, index) => (
                <Alert key={index} severity="warning" icon={<WarningIcon />} sx={{ fontSize: '0.8rem' }}>
                  {warning}
                </Alert>
              ))}
            </Box>
          )}

          {/* Field Tree View */}
          {extractionResult.fields.length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TreeIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Field Tree View ({flattenFields(extractionResult.fields).length} fields)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <FieldTreeView
                  fields={extractionResult.fields}
                  selectedFields={selectedFields}
                  onFieldToggle={handleFieldToggle}
                  searchPlaceholder="Search fields by name, type, or JSONPath..."
                  showFieldCounts={true}
                  maxHeight={400}
                  enableSearch={true}
                />
              </AccordionDetails>
            </Accordion>
          )}

          {/* Flattened Fields */}
          {extractionResult.fields.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    All Fields ({flattenFields(extractionResult.fields).length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  maxHeight: 300, 
                  overflow: 'auto',
                  p: 1,
                  backgroundColor: 'grey.50',
                  borderRadius: 1
                }}>
                  {flattenFields(extractionResult.fields).map((field, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      py: 0.5,
                      borderBottom: index < flattenFields(extractionResult.fields).length - 1 ? '1px solid #e0e0e0' : 'none'
                    }}>
                      <Chip 
                        label={field.type} 
                        size="small" 
                        color={getTypeColor(field.type)}
                        sx={{ fontSize: '0.7rem', height: 18 }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {field.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 'auto' }}>
                        {field.path}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FieldExtractor;


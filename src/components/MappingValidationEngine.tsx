import React, { useEffect } from 'react';
import {
  Box,
  Alert,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { type ValidationResult } from '../utils/mappingValidation';
import ValidationIndicator from './ValidationIndicator';
import { useRealTimeValidation } from '../hooks/useRealTimeValidation';
import type { FieldMapping, DraggedField, DatabaseColumn } from '../types';

// Remove duplicate interfaces - using imported ones

interface MappingValidationEngineProps {
  mappings: FieldMapping[];
  apiFields: DraggedField[];
  dbColumns: DatabaseColumn[];
  onValidationComplete?: (results: ValidationResult[]) => void;
  onMappingFix?: (mappingId: string, fix: string) => void;
  disabled?: boolean;
}

const MappingValidationEngine: React.FC<MappingValidationEngineProps> = ({
  mappings,
  onValidationComplete,
  onMappingFix,
  disabled = false,
}) => {
  // Use real-time validation hook
  const {
    validationResults,
    validationSummary,
    isValidating,
    validateNow,
  } = useRealTimeValidation({ mappings, autoValidate: true });

  // Handle mapping fix
  const handleMappingFix = (mappingId: string, fix: string) => {
    onMappingFix?.(mappingId, fix);
  };

  // Notify parent of validation completion
  useEffect(() => {
    onValidationComplete?.(validationResults);
  }, [validationResults, onValidationComplete]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Validation Header */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              Mapping Validation Engine
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={isValidating ? <StopIcon /> : <PlayArrowIcon />}
                onClick={validateNow}
                disabled={disabled || mappings.length === 0}
              >
                {isValidating ? 'Validating...' : 'Run Validation'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={validateNow}
                disabled={disabled || isValidating}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Validation Summary */}
          <ValidationIndicator
            validationSummary={validationSummary}
            onRefresh={validateNow}
            showDetails={true}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 2 }}>
              Validation Results
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {validationResults.map((result) => (
                <ValidationIndicator
                  key={result.mapping.id}
                  validationResult={result}
                  onFix={handleMappingFix}
                  showDetails={true}
                  disabled={disabled}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {validationResults.length === 0 && mappings.length > 0 && (
        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
          No validation results available. Click "Run Validation" to check your mappings.
        </Alert>
      )}

      {mappings.length === 0 && (
        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
          No mappings to validate. Create some field mappings first.
        </Alert>
      )}
    </Box>
  );
};

export default MappingValidationEngine;

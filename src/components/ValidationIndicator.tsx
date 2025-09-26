import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  IconButton,
  Collapse,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixIcon,
} from '@mui/icons-material';
import { 
  getValidationStatusIcon,
  type ValidationResult,
  type ValidationSummary 
} from '../utils/mappingValidation';

interface ValidationIndicatorProps {
  validationResult?: ValidationResult;
  validationSummary?: ValidationSummary;
  onFix?: (mappingId: string, fix: string) => void;
  onRefresh?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  validationResult,
  validationSummary,
  onFix,
  onRefresh,
  showDetails = false,
  compact = false,
  disabled = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Get validation status
  const getStatus = () => {
    if (validationResult) {
      if (validationResult.errors.length > 0) return 'error';
      if (validationResult.warnings.length > 0) return 'warning';
      return 'valid';
    }
    if (validationSummary) {
      return validationSummary.status;
    }
    return 'valid';
  };

  const status = getStatus();
  const icon = getValidationStatusIcon(status);

  // Get status icon component
  const getStatusIcon = () => {
    switch (icon) {
      case 'check_circle':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  // Get status text
  const getStatusText = () => {
    if (validationResult) {
      if (validationResult.errors.length > 0) {
        return `${validationResult.errors.length} Error${validationResult.errors.length > 1 ? 's' : ''}`;
      }
      if (validationResult.warnings.length > 0) {
        return `${validationResult.warnings.length} Warning${validationResult.warnings.length > 1 ? 's' : ''}`;
      }
      return 'Valid';
    }
    if (validationSummary) {
      return `${validationSummary.validMappings}/${validationSummary.totalMappings} Valid`;
    }
    return 'Valid';
  };

  // Get score text
  const getScoreText = () => {
    if (validationResult) {
      return `${validationResult.score}%`;
    }
    if (validationSummary) {
      return `${validationSummary.overallScore}%`;
    }
    return '100%';
  };

  if (compact) {
    return (
      <Tooltip title={getStatusText()}>
        <Chip
          icon={getStatusIcon()}
          label={getScoreText()}
          size="small"
          color={status === 'valid' ? 'success' : status === 'warning' ? 'warning' : 'error'}
          sx={{ 
            fontSize: '0.7rem',
            height: 20,
            '& .MuiChip-icon': { fontSize: 14 }
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon()}
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              {getStatusText()}
            </Typography>
            <Chip
              label={getScoreText()}
              size="small"
              color={status === 'valid' ? 'success' : status === 'warning' ? 'warning' : 'error'}
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onRefresh && (
              <IconButton size="small" onClick={onRefresh} disabled={disabled}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            )}
            {showDetails && (
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Summary */}
        {validationSummary && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              {validationSummary.validMappings} valid, {validationSummary.warningMappings} warnings, {validationSummary.errorMappings} errors
            </Typography>
          </Box>
        )}

        {/* Details */}
        {showDetails && (
          <Collapse in={expanded}>
            <Divider sx={{ my: 1 }} />
            
            {/* Errors */}
            {validationResult?.errors && validationResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1, fontSize: '0.7rem' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                  Errors:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {validationResult.errors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <ErrorIcon sx={{ fontSize: 12, color: 'error.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {error}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* Warnings */}
            {validationResult?.warnings && validationResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1, fontSize: '0.7rem' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                  Warnings:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {validationResult.warnings.map((warning, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <WarningIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {warning}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* Suggestions */}
            {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', fontSize: '0.7rem' }}>
                  Suggestions:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {validationResult.suggestions.slice(0, 3).map((suggestion, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <InfoIcon sx={{ fontSize: 12, color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {suggestion}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Action Buttons */}
            {validationResult && validationResult.errors && validationResult.errors.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  startIcon={<AutoFixIcon />}
                  onClick={() => onFix?.(validationResult.mapping.id, 'auto-fix')}
                  disabled={disabled}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Auto Fix
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onFix?.(validationResult.mapping.id, 'manual-fix')}
                  disabled={disabled}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Manual Fix
                </Button>
              </Box>
            )}
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationIndicator;

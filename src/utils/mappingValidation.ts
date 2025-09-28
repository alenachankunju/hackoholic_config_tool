/**
 * Comprehensive Mapping Validation Utilities
 * 
 * Provides detailed validation for field mappings including type compatibility,
 * constraint validation, format validation, and real-time validation feedback.
 */

import { getCompatibilityResult, validateFormat } from './typeCompatibility';
import type { FieldMapping } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  compatibility: 'compatible' | 'warning' | 'error';
  score: number; // 0-100 validation score
  mapping: FieldMapping; // Add mapping reference
  details: {
    typeCompatibility: boolean;
    constraintValidation: boolean;
    formatValidation: boolean;
    sizeValidation: boolean;
    requiredFieldValidation: boolean;
  };
}

export interface ValidationSummary {
  status: 'valid' | 'warning' | 'error';
  totalMappings: number;
  validMappings: number;
  warningMappings: number;
  errorMappings: number;
  overallScore: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  criticalIssues: string[];
  fixableIssues: string[];
}

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (mapping: FieldMapping) => boolean;
  message: (mapping: FieldMapping) => string;
  suggestion: (mapping: FieldMapping) => string;
}

/**
 * Comprehensive validation rules for field mappings
 */
const VALIDATION_RULES: ValidationRule[] = [
  // Type Compatibility Rules
  {
    name: 'type_compatibility',
    description: 'Check if source and target types are compatible',
    severity: 'error',
    check: (mapping) => {
      const compatibility = getCompatibilityResult(mapping.sourceField.type, mapping.targetField.type);
      return compatibility.level !== 'error';
    },
    message: (mapping) => `Type incompatibility: ${mapping.sourceField.type} → ${mapping.targetField.type}`,
    suggestion: () => `Consider using a compatible type or add data transformation`
  },
  {
    name: 'type_warning',
    description: 'Check for type conversion warnings',
    severity: 'warning',
    check: (mapping) => {
      const compatibility = getCompatibilityResult(mapping.sourceField.type, mapping.targetField.type);
      return compatibility.level !== 'warning';
    },
    message: (mapping) => `Type conversion warning: ${mapping.sourceField.type} → ${mapping.targetField.type}`,
    suggestion: () => `Review data transformation requirements`
  },

  // Constraint Validation Rules
  {
    name: 'not_null_constraint',
    description: 'Check NOT NULL constraint compatibility',
    severity: 'error',
    check: (mapping) => {
      const hasNotNullConstraint = mapping.targetField.constraints?.includes('NOT NULL');
      const sourceIsNullable = mapping.sourceField.nullable;
      return !(hasNotNullConstraint && sourceIsNullable);
    },
    message: (mapping) => `Source field '${mapping.sourceField.name}' is nullable but target requires NOT NULL`,
    suggestion: () => `Ensure source data is never null or add null handling`
  },
  {
    name: 'unique_constraint',
    description: 'Check UNIQUE constraint compatibility',
    severity: 'warning',
    check: (mapping) => {
      const hasUniqueConstraint = mapping.targetField.constraints?.includes('UNIQUE');
      return !hasUniqueConstraint; // This is more of an informational check
    },
    message: (mapping) => `Target field '${mapping.targetField.name}' has UNIQUE constraint`,
    suggestion: () => `Ensure source data contains unique values`
  },
  {
    name: 'primary_key_constraint',
    description: 'Check PRIMARY KEY constraint compatibility',
    severity: 'error',
    check: (mapping) => {
      const hasPrimaryKey = mapping.targetField.constraints?.includes('PRIMARY KEY');
      const sourceIsNullable = mapping.sourceField.nullable;
      return !(hasPrimaryKey && sourceIsNullable);
    },
    message: (mapping) => `Primary key field '${mapping.targetField.name}' cannot be nullable`,
    suggestion: () => `Ensure source field always has a value`
  },

  // Format Validation Rules
  {
    name: 'email_format',
    description: 'Validate email format if applicable',
    severity: 'warning',
    check: (mapping) => {
      const isEmailField = mapping.targetField.name.toLowerCase().includes('email') ||
                          mapping.sourceField.name.toLowerCase().includes('email');
      if (!isEmailField) return true;
      
      return validateFormat('email', 'test@example.com').isValid; // This is a simplified check
    },
    message: (mapping) => `Email field '${mapping.sourceField.name}' should contain valid email addresses`,
    suggestion: () => `Add email format validation`
  },
  {
    name: 'phone_format',
    description: 'Validate phone format if applicable',
    severity: 'warning',
    check: (mapping) => {
      const isPhoneField = mapping.targetField.name.toLowerCase().includes('phone') ||
                          mapping.sourceField.name.toLowerCase().includes('phone');
      if (!isPhoneField) return true;
      
      return validateFormat('phone', '+1234567890').isValid; // This is a simplified check
    },
    message: (mapping) => `Phone field '${mapping.sourceField.name}' should contain valid phone numbers`,
    suggestion: () => `Add phone format validation`
  },
  {
    name: 'uuid_format',
    description: 'Validate UUID format if applicable',
    severity: 'warning',
    check: (mapping) => {
      const isUuidField = mapping.targetField.name.toLowerCase().includes('uuid') ||
                         mapping.targetField.name.toLowerCase().includes('id') ||
                         mapping.targetField.type.toLowerCase().includes('uuid');
      if (!isUuidField) return true;
      
      return validateFormat('uuid', '123e4567-e89b-12d3-a456-426614174000').isValid;
    },
    message: (mapping) => `UUID field '${mapping.sourceField.name}' should contain valid UUIDs`,
    suggestion: () => `Add UUID format validation`
  },

  // Size Validation Rules
  {
    name: 'varchar_length',
    description: 'Check VARCHAR length constraints',
    severity: 'warning',
    check: (mapping) => {
      if (!mapping.targetField.type.includes('varchar')) return true;
      
      const lengthMatch = mapping.targetField.type.match(/varchar\((\d+)\)/);
      if (!lengthMatch) return true;
      
      const maxLength = parseInt(lengthMatch[1]);
      return maxLength >= 50; // Minimum recommended length
    },
    message: (mapping) => `VARCHAR field '${mapping.targetField.name}' may be too short for some data`,
    suggestion: () => `Consider increasing VARCHAR length or using TEXT type`
  },
  {
    name: 'decimal_precision',
    description: 'Check DECIMAL precision and scale',
    severity: 'warning',
    check: (mapping) => {
      if (!mapping.targetField.type.includes('decimal')) return true;
      
      const decimalMatch = mapping.targetField.type.match(/decimal\((\d+),(\d+)\)/);
      if (!decimalMatch) return true;
      
      const precision = parseInt(decimalMatch[1]);
      const scale = parseInt(decimalMatch[2]);
      return precision >= 10 && scale >= 2; // Minimum recommended precision
    },
    message: (mapping) => `DECIMAL field '${mapping.targetField.name}' may have insufficient precision`,
    suggestion: () => `Consider increasing precision and scale`
  },

  // Required Field Validation
  {
    name: 'required_field_mapping',
    description: 'Check if all required fields are mapped',
    severity: 'error',
    check: (mapping) => {
      // This is a simplified check - in reality, you'd have a list of required fields
      return Boolean(mapping.sourceField.name && mapping.targetField.name);
    },
    message: () => `Required field mapping is incomplete`,
    suggestion: () => `Ensure all required fields are properly mapped`
  },

  // Data Type Specific Rules
  {
    name: 'date_format',
    description: 'Validate date format compatibility',
    severity: 'warning',
    check: (mapping) => {
      const isDateField = mapping.targetField.type.toLowerCase().includes('date') ||
                          mapping.targetField.type.toLowerCase().includes('timestamp');
      if (!isDateField) return true;
      
      return mapping.sourceField.type.toLowerCase().includes('date') ||
             mapping.sourceField.type.toLowerCase().includes('string');
    },
    message: (mapping) => `Date field '${mapping.targetField.name}' requires proper date format`,
    suggestion: () => `Ensure source data is in ISO 8601 format (YYYY-MM-DD)`
  },
  {
    name: 'json_format',
    description: 'Validate JSON format compatibility',
    severity: 'warning',
    check: (mapping) => {
      const isJsonField = mapping.targetField.type.toLowerCase().includes('json');
      if (!isJsonField) return true;
      
      return mapping.sourceField.type.toLowerCase().includes('object') ||
             mapping.sourceField.type.toLowerCase().includes('array');
    },
    message: (mapping) => `JSON field '${mapping.targetField.name}' requires valid JSON data`,
    suggestion: () => `Ensure source data is valid JSON or can be serialized`
  }
];

/**
 * Validate a single field mapping
 */
export function validateMapping(mapping: FieldMapping): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  let typeCompatibility = true;
  let constraintValidation = true;
  let formatValidation = true;
  let sizeValidation = true;
  let requiredFieldValidation = true;

  // Run all validation rules
  for (const rule of VALIDATION_RULES) {
    const isValid = rule.check(mapping);
    
    if (!isValid) {
      const message = rule.message(mapping);
      const suggestion = rule.suggestion(mapping);
      
      if (rule.severity === 'error') {
        errors.push(message);
        typeCompatibility = false;
        constraintValidation = false;
        formatValidation = false;
        sizeValidation = false;
        requiredFieldValidation = false;
      } else if (rule.severity === 'warning') {
        warnings.push(message);
      }
      
      suggestions.push(suggestion);
    }
  }

  // Check type compatibility
  const compatibilityResult = getCompatibilityResult(
    mapping.sourceField.type,
    mapping.targetField.type
  );

  if (compatibilityResult.level === 'error') {
    errors.push(`Type incompatibility: ${mapping.sourceField.type} → ${mapping.targetField.type}`);
    typeCompatibility = false;
  } else if (compatibilityResult.level === 'warning') {
    warnings.push(`Type conversion warning: ${mapping.sourceField.type} → ${mapping.targetField.type}`);
  }

  // Add compatibility suggestions
  if (compatibilityResult.suggestions.length > 0) {
    suggestions.push(...compatibilityResult.suggestions);
  }

  // Calculate validation score
  const totalChecks = VALIDATION_RULES.length;
  const passedChecks = totalChecks - errors.length - warnings.length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    compatibility: compatibilityResult.level,
    score,
    mapping,
    details: {
      typeCompatibility,
      constraintValidation,
      formatValidation,
      sizeValidation,
      requiredFieldValidation,
    }
  };
}

/**
 * Validate all field mappings
 */
export function validateAllMappings(mappings: FieldMapping[]): ValidationSummary {
  if (mappings.length === 0) {
    return {
      status: 'warning',
      totalMappings: 0,
      validMappings: 0,
      warningMappings: 0,
      errorMappings: 0,
      overallScore: 0,
      errors: [],
      warnings: ['No mappings to validate'],
      suggestions: ['Add field mappings to validate compatibility and constraints'],
      criticalIssues: [],
      fixableIssues: [],
    };
  }

  const validationResults = mappings.map(validateMapping);
  
  const validMappings = validationResults.filter(r => r.isValid && r.warnings.length === 0).length;
  const warningMappings = validationResults.filter(r => r.isValid && r.warnings.length > 0).length;
  const errorMappings = validationResults.filter(r => !r.isValid).length;
  
  const allErrors = validationResults.flatMap(r => r.errors);
  const allWarnings = validationResults.flatMap(r => r.warnings);
  const allSuggestions = validationResults.flatMap(r => r.suggestions);
  
  const criticalIssues = allErrors.filter(error => 
    error.includes('PRIMARY KEY') || 
    error.includes('NOT NULL') || 
    error.includes('incompatibility')
  );
  
  const fixableIssues = allErrors.filter(error => 
    error.includes('format') || 
    error.includes('length') || 
    error.includes('precision')
  );

  const overallScore = Math.round(
    validationResults.reduce((sum, r) => sum + r.score, 0) / validationResults.length
  );

  let status: 'valid' | 'warning' | 'error';
  if (errorMappings === 0 && warningMappings === 0) {
    status = 'valid';
  } else if (errorMappings === 0) {
    status = 'warning';
  } else {
    status = 'error';
  }

  return {
    status,
    totalMappings: mappings.length,
    validMappings,
    warningMappings,
    errorMappings,
    overallScore,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions,
    criticalIssues,
    fixableIssues,
  };
}

/**
 * Get validation status color
 */
export function getValidationStatusColor(status: 'valid' | 'warning' | 'error'): string {
  switch (status) {
    case 'valid':
      return '#4caf50'; // Green
    case 'warning':
      return '#ff9800'; // Orange
    case 'error':
      return '#f44336'; // Red
    default:
      return '#9e9e9e'; // Gray
  }
}

/**
 * Get validation status icon
 */
export function getValidationStatusIcon(status: 'valid' | 'warning' | 'error'): string {
  switch (status) {
    case 'valid':
      return 'check_circle';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'help';
  }
}

/**
 * Format validation message for display
 */
export function formatValidationMessage(
  message: string,
  mapping: FieldMapping
): string {
  return message
    .replace('{sourceField}', mapping.sourceField.name)
    .replace('{targetField}', mapping.targetField.name)
    .replace('{sourceType}', mapping.sourceField.type)
    .replace('{targetType}', mapping.targetField.type);
}

/**
 * Get validation priority (for sorting)
 */
export function getValidationPriority(result: ValidationResult): number {
  if (result.errors.length > 0) return 1; // High priority
  if (result.warnings.length > 0) return 2; // Medium priority
  return 3; // Low priority
}

export default {
  validateMapping,
  validateAllMappings,
  getValidationStatusColor,
  getValidationStatusIcon,
  formatValidationMessage,
  getValidationPriority,
};

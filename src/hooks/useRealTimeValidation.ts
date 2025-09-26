import { useState, useEffect, useCallback, useMemo } from 'react';
import { validateMapping, validateAllMappings, type ValidationResult, type ValidationSummary } from '../utils/mappingValidation';
import type { FieldMapping } from '../types';

interface UseRealTimeValidationProps {
  mappings: FieldMapping[];
  debounceMs?: number;
  autoValidate?: boolean;
}

interface UseRealTimeValidationReturn {
  validationResults: ValidationResult[];
  validationSummary: ValidationSummary;
  isValidating: boolean;
  lastValidated: Date | null;
  validateNow: () => void;
  getMappingValidation: (mappingId: string) => ValidationResult | null;
  hasErrors: boolean;
  hasWarnings: boolean;
  criticalIssues: string[];
  fixableIssues: string[];
}

export const useRealTimeValidation = ({
  mappings,
  debounceMs = 500,
  autoValidate = true,
}: UseRealTimeValidationProps): UseRealTimeValidationReturn => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({
    status: 'valid',
    totalMappings: 0,
    validMappings: 0,
    warningMappings: 0,
    errorMappings: 0,
    overallScore: 100,
    errors: [],
    warnings: [],
    suggestions: [],
    criticalIssues: [],
    fixableIssues: [],
  });
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  // Debounced validation function
  const debouncedValidate = useCallback(
    (() => {
      let timeoutId: number;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          validateNow();
        }, debounceMs);
      };
    })(),
    [debounceMs]
  );

  // Immediate validation function
  const validateNow = useCallback(() => {
    if (mappings.length === 0) {
      setValidationResults([]);
      setValidationSummary({
        status: 'valid',
        totalMappings: 0,
        validMappings: 0,
        warningMappings: 0,
        errorMappings: 0,
        overallScore: 100,
        errors: [],
        warnings: [],
        suggestions: [],
        criticalIssues: [],
        fixableIssues: [],
      });
      setLastValidated(new Date());
      return;
    }

    setIsValidating(true);
    
    try {
      // Validate all mappings
      const results = mappings.map(validateMapping);
      const summary = validateAllMappings(mappings);
      
      setValidationResults(results);
      setValidationSummary(summary);
      setLastValidated(new Date());
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [mappings]);

  // Auto-validate when mappings change
  useEffect(() => {
    if (autoValidate) {
      debouncedValidate();
    }
  }, [mappings, debouncedValidate, autoValidate]);

  // Get validation for a specific mapping
  const getMappingValidation = useCallback((mappingId: string): ValidationResult | null => {
    return validationResults.find(result => result.mapping.id === mappingId) || null;
  }, [validationResults]);

  // Computed properties
  const hasErrors = useMemo(() => 
    validationResults.some(result => result.errors.length > 0),
    [validationResults]
  );

  const hasWarnings = useMemo(() => 
    validationResults.some(result => result.warnings.length > 0),
    [validationResults]
  );

  const criticalIssues = useMemo(() => 
    validationSummary.criticalIssues,
    [validationSummary]
  );

  const fixableIssues = useMemo(() => 
    validationSummary.fixableIssues,
    [validationSummary]
  );

  return {
    validationResults,
    validationSummary,
    isValidating,
    lastValidated,
    validateNow,
    getMappingValidation,
    hasErrors,
    hasWarnings,
    criticalIssues,
    fixableIssues,
  };
};

export default useRealTimeValidation;

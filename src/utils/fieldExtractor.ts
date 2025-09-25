import type { ApiField } from '../types';

// Supported data types for field extraction
export type SupportedDataType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'undefined';

// Field extraction options
export interface FieldExtractionOptions {
  maxDepth?: number; // Maximum nesting depth to prevent infinite recursion
  includeNullValues?: boolean; // Whether to include null/undefined fields
  arrayIndexLimit?: number; // Maximum array indices to process (0 = process all)
  customTypeDetector?: (value: any) => SupportedDataType; // Custom type detection function
}

// Field extraction result
export interface FieldExtractionResult {
  fields: ApiField[];
  errors: string[];
  warnings: string[];
  statistics: {
    totalFields: number;
    maxDepth: number;
    arrayFields: number;
    objectFields: number;
    primitiveFields: number;
  };
}

// Default extraction options
const DEFAULT_OPTIONS: Required<FieldExtractionOptions> = {
  maxDepth: 10,
  includeNullValues: false,
  arrayIndexLimit: 5,
  customTypeDetector: detectDataType,
};

/**
 * Detects the data type of a value
 */
export function detectDataType(value: any): SupportedDataType {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as SupportedDataType;
}

/**
 * Generates a JSONPath string from a path array
 * @param path - Array of path segments
 * @returns JSONPath string (e.g., "$.user.profile.name")
 */
export function generateJSONPath(path: string[]): string {
  if (path.length === 0) return '$';
  
  return '$' + path.map(segment => {
    // Handle array indices
    if (/^\d+$/.test(segment)) {
      return `[${segment}]`;
    }
    // Handle object properties
    return `.${segment}`;
  }).join('');
}

/**
 * Sanitizes field names to be valid identifiers
 */
function sanitizeFieldName(name: string): string {
  // Replace invalid characters with underscores
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Creates a unique field name to avoid duplicates
 */
function createUniqueFieldName(baseName: string, existingNames: Set<string>): string {
  let name = sanitizeFieldName(baseName);
  let counter = 1;
  
  while (existingNames.has(name)) {
    name = `${sanitizeFieldName(baseName)}_${counter}`;
    counter++;
  }
  
  existingNames.add(name);
  return name;
}

/**
 * Recursively extracts fields from JSON data
 */
function extractFieldsRecursive(
  data: any,
  path: string[],
  options: Required<FieldExtractionOptions>,
  existingNames: Set<string>,
  currentDepth: number = 0
): { fields: ApiField[]; errors: string[]; warnings: string[] } {
  const fields: ApiField[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check depth limit
  if (currentDepth > options.maxDepth) {
    warnings.push(`Maximum depth (${options.maxDepth}) reached at path: ${generateJSONPath(path)}`);
    return { fields, errors, warnings };
  }

  const dataType = options.customTypeDetector(data);

  // Handle different data types
  switch (dataType) {
    case 'object':
      try {
        const entries = Object.entries(data);
        for (const [key, value] of entries) {
          const newPath = [...path, key];
          const fieldName = createUniqueFieldName(key, existingNames);
          
          // Create field for the object property
          const field: ApiField = {
            name: fieldName,
            type: options.customTypeDetector(value),
            path: generateJSONPath(newPath),
            nested: undefined, // Will be populated if nested fields exist
          };

          // Process nested value
          const nestedResult = extractFieldsRecursive(
            value,
            newPath,
            options,
            existingNames,
            currentDepth + 1
          );

          // Add nested fields if they exist
          if (nestedResult.fields.length > 0) {
            field.nested = nestedResult.fields;
          }

          fields.push(field);
          errors.push(...nestedResult.errors);
          warnings.push(...nestedResult.warnings);
        }
      } catch (error) {
        errors.push(`Error processing object at path ${generateJSONPath(path)}: ${error}`);
      }
      break;

    case 'array':
      try {
        const arrayLength = data.length;
        const processLimit = options.arrayIndexLimit === 0 ? arrayLength : Math.min(options.arrayIndexLimit, arrayLength);
        
        // Add warning if we're not processing all array elements
        if (processLimit < arrayLength) {
          warnings.push(`Processing only first ${processLimit} elements of array at path: ${generateJSONPath(path)} (total: ${arrayLength})`);
        }

        // Process array elements
        for (let i = 0; i < processLimit; i++) {
          const newPath = [...path, i.toString()];
          const fieldName = createUniqueFieldName(`item_${i}`, existingNames);
          
          const field: ApiField = {
            name: fieldName,
            type: options.customTypeDetector(data[i]),
            path: generateJSONPath(newPath),
            nested: undefined,
          };

          // Process nested value
          const nestedResult = extractFieldsRecursive(
            data[i],
            newPath,
            options,
            existingNames,
            currentDepth + 1
          );

          if (nestedResult.fields.length > 0) {
            field.nested = nestedResult.fields;
          }

          fields.push(field);
          errors.push(...nestedResult.errors);
          warnings.push(...nestedResult.warnings);
        }

        // Add array metadata field
        const arrayMetaField: ApiField = {
          name: createUniqueFieldName('array_info', existingNames),
          type: 'object',
          path: generateJSONPath([...path, 'length']),
          nested: [
            {
              name: 'length',
              type: 'number',
              path: generateJSONPath([...path, 'length']),
            },
            {
              name: 'processed_count',
              type: 'number',
              path: generateJSONPath([...path, 'processed_count']),
            },
          ],
        };
        fields.push(arrayMetaField);

      } catch (error) {
        errors.push(`Error processing array at path ${generateJSONPath(path)}: ${error}`);
      }
      break;

    case 'string':
    case 'number':
    case 'boolean':
      // Primitive types don't have nested fields
      break;

    case 'null':
    case 'undefined':
      if (options.includeNullValues) {
        const fieldName = createUniqueFieldName('null_value', existingNames);
        fields.push({
          name: fieldName,
          type: dataType,
          path: generateJSONPath(path),
        });
      }
      break;

    default:
      warnings.push(`Unknown data type '${dataType}' at path: ${generateJSONPath(path)}`);
  }

  return { fields, errors, warnings };
}

/**
 * Calculates statistics for extracted fields
 */
function calculateStatistics(fields: ApiField[]): FieldExtractionResult['statistics'] {
  let arrayFields = 0;
  let objectFields = 0;
  let primitiveFields = 0;
  let maxDepth = 0;

  function traverseFields(fieldList: ApiField[], depth: number = 0) {
    maxDepth = Math.max(maxDepth, depth);
    
    for (const field of fieldList) {
      switch (field.type) {
        case 'array':
          arrayFields++;
          break;
        case 'object':
          objectFields++;
          break;
        default:
          primitiveFields++;
      }

      if (field.nested) {
        traverseFields(field.nested, depth + 1);
      }
    }
  }

  traverseFields(fields);

  return {
    totalFields: fields.length,
    maxDepth,
    arrayFields,
    objectFields,
    primitiveFields,
  };
}

/**
 * Main function to extract fields from JSON data
 * @param jsonData - The JSON data to extract fields from
 * @param options - Extraction options
 * @returns FieldExtractionResult with extracted fields and metadata
 */
export function extractFieldsFromJSON(
  jsonData: any,
  options: FieldExtractionOptions = {}
): FieldExtractionResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const existingNames = new Set<string>();

  try {
    // Validate input
    if (jsonData === null || jsonData === undefined) {
      errors.push('Input data is null or undefined');
      return {
        fields: [],
        errors,
        warnings,
        statistics: {
          totalFields: 0,
          maxDepth: 0,
          arrayFields: 0,
          objectFields: 0,
          primitiveFields: 0,
        },
      };
    }

    // Handle top-level primitive values
    const topLevelType = mergedOptions.customTypeDetector(jsonData);
    if (['string', 'number', 'boolean', 'null', 'undefined'].includes(topLevelType)) {
      const field: ApiField = {
        name: 'root_value',
        type: topLevelType,
        path: '$',
      };
      
      return {
        fields: [field],
        errors,
        warnings,
        statistics: {
          totalFields: 1,
          maxDepth: 0,
          arrayFields: 0,
          objectFields: 0,
          primitiveFields: 1,
        },
      };
    }

    // Extract fields recursively
    const result = extractFieldsRecursive(jsonData, [], mergedOptions, existingNames);
    
    // Calculate statistics
    const statistics = calculateStatistics(result.fields);

    return {
      fields: result.fields,
      errors: [...errors, ...result.errors],
      warnings: [...warnings, ...result.warnings],
      statistics,
    };

  } catch (error) {
    errors.push(`Fatal error during field extraction: ${error}`);
    return {
      fields: [],
      errors,
      warnings,
      statistics: {
        totalFields: 0,
        maxDepth: 0,
        arrayFields: 0,
        objectFields: 0,
        primitiveFields: 0,
      },
    };
  }
}

/**
 * Utility function to flatten the field tree into a single array
 * @param fields - Array of ApiField objects
 * @returns Flattened array of all fields (including nested ones)
 */
export function flattenFields(fields: ApiField[]): ApiField[] {
  const flattened: ApiField[] = [];

  function traverse(fieldList: ApiField[]) {
    for (const field of fieldList) {
      flattened.push(field);
      if (field.nested) {
        traverse(field.nested);
      }
    }
  }

  traverse(fields);
  return flattened;
}

/**
 * Utility function to filter fields by type
 * @param fields - Array of ApiField objects
 * @param type - Type to filter by
 * @returns Filtered array of fields
 */
export function filterFieldsByType(fields: ApiField[], type: SupportedDataType): ApiField[] {
  return flattenFields(fields).filter(field => field.type === type);
}

/**
 * Utility function to find fields by JSONPath pattern
 * @param fields - Array of ApiField objects
 * @param pathPattern - JSONPath pattern to match (supports wildcards)
 * @returns Array of matching fields
 */
export function findFieldsByPath(fields: ApiField[], pathPattern: string): ApiField[] {
  const flattened = flattenFields(fields);
  
  // Convert wildcard pattern to regex
  const regexPattern = pathPattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\$/g, '\\$');
  
  const regex = new RegExp(`^${regexPattern}$`);
  
  return flattened.filter(field => regex.test(field.path));
}

/**
 * Utility function to get field statistics summary
 * @param fields - Array of ApiField objects
 * @returns Statistics summary object
 */
export function getFieldStatistics(fields: ApiField[]) {
  const flattened = flattenFields(fields);
  const typeCounts: Record<string, number> = {};
  
  for (const field of flattened) {
    typeCounts[field.type] = (typeCounts[field.type] || 0) + 1;
  }
  
  return {
    totalFields: flattened.length,
    typeCounts,
    hasNestedFields: flattened.some(field => field.nested && field.nested.length > 0),
    maxPathDepth: Math.max(...flattened.map(field => field.path.split('.').length)),
  };
}


/**
 * Type Compatibility Utility
 * 
 * This utility provides comprehensive type compatibility checking between
 * JavaScript/API types and SQL database types, including validation rules
 * and transformation suggestions.
 */

export type CompatibilityLevel = 'compatible' | 'warning' | 'error';

export interface TypeCompatibilityResult {
  level: CompatibilityLevel;
  message: string;
  suggestions: string[];
  color: string;
}

export interface TypeMapping {
  source: string[];
  target: string[];
  compatibility: CompatibilityLevel;
  description: string;
  examples: string[];
}

/**
 * Main compatibility matrix for type conversions
 * Maps JavaScript/API types to SQL database types
 */
const TYPE_MAPPINGS: TypeMapping[] = [
  // String types - Generally compatible
  {
    source: ['string', 'text'],
    target: ['varchar', 'nvarchar', 'char', 'nchar', 'text', 'longtext', 'clob'],
    compatibility: 'compatible',
    description: 'String to text types - direct mapping',
    examples: ['"John Doe" → VARCHAR(255)', '"Long text content" → TEXT']
  },
  {
    source: ['string'],
    target: ['varchar(1)', 'char(1)'],
    compatibility: 'warning',
    description: 'String to single character - potential data loss',
    examples: ['"Hello" → CHAR(1) - truncation warning']
  },

  // Number types - Generally compatible with some warnings
  {
    source: ['number', 'integer', 'int'],
    target: ['int', 'integer', 'bigint', 'smallint', 'tinyint'],
    compatibility: 'compatible',
    description: 'Number to integer types - direct mapping',
    examples: ['42 → INT', '999999999 → BIGINT']
  },
  {
    source: ['number'],
    target: ['decimal', 'numeric', 'float', 'double', 'real'],
    compatibility: 'compatible',
    description: 'Number to decimal/float types - direct mapping',
    examples: ['3.14 → DECIMAL(10,2)', '1.23e10 → DOUBLE']
  },
  {
    source: ['number'],
    target: ['tinyint'],
    compatibility: 'warning',
    description: 'Number to tinyint - potential overflow',
    examples: ['300 → TINYINT - overflow warning (max 255)']
  },

  // Boolean types
  {
    source: ['boolean', 'bool'],
    target: ['bit', 'boolean', 'tinyint(1)'],
    compatibility: 'compatible',
    description: 'Boolean to bit/boolean types - direct mapping',
    examples: ['true → BIT(1)', 'false → BOOLEAN']
  },

  // Date/Time types
  {
    source: ['date', 'datetime', 'timestamp'],
    target: ['date', 'datetime', 'timestamp', 'datetime2', 'time'],
    compatibility: 'compatible',
    description: 'Date to date/time types - direct mapping',
    examples: ['"2024-01-01" → DATE', '"2024-01-01T10:30:00Z" → DATETIME']
  },
  {
    source: ['string'],
    target: ['date', 'datetime', 'timestamp'],
    compatibility: 'warning',
    description: 'String to date - requires format validation',
    examples: ['"2024-01-01" → DATE - format validation needed']
  },

  // JSON/Object types
  {
    source: ['object', 'json'],
    target: ['json', 'jsonb', 'text', 'varchar(max)'],
    compatibility: 'compatible',
    description: 'Object/JSON to JSON types - direct mapping',
    examples: ['{"name": "John"} → JSON', '{"data": []} → JSONB']
  },
  {
    source: ['array'],
    target: ['json', 'jsonb', 'text'],
    compatibility: 'compatible',
    description: 'Array to JSON types - direct mapping',
    examples: ['["item1", "item2"] → JSON', '[1,2,3] → JSONB']
  },

  // Binary types
  {
    source: ['buffer', 'binary', 'blob'],
    target: ['blob', 'varbinary', 'binary', 'image'],
    compatibility: 'compatible',
    description: 'Binary to binary types - direct mapping',
    examples: ['Buffer data → BLOB', 'Binary data → VARBINARY(MAX)']
  },

  // Incompatible types
  {
    source: ['function', 'undefined', 'symbol'],
    target: ['varchar', 'text'],
    compatibility: 'error',
    description: 'Non-serializable types - cannot be stored',
    examples: ['function() {} → VARCHAR - serialization error']
  }
];

/**
 * Special format validation rules
 */
const FORMAT_VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
    suggestions: ['Use VARCHAR(255) with email validation', 'Consider UNIQUE constraint']
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Invalid phone number format',
    suggestions: ['Use VARCHAR(20) for international numbers', 'Consider format standardization']
  },
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Invalid URL format',
    suggestions: ['Use VARCHAR(2083) for full URLs', 'Consider URL validation']
  },
  uuid: {
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message: 'Invalid UUID format',
    suggestions: ['Use CHAR(36) or UUID type', 'Consider UNIQUE constraint']
  },
  ip: {
    pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    message: 'Invalid IP address format',
    suggestions: ['Use VARCHAR(15) for IPv4', 'Use VARCHAR(39) for IPv6']
  }
};

/**
 * Size and precision validation rules
 */
const SIZE_VALIDATION_RULES = {
  varchar: {
    maxLength: 65535,
    warningThreshold: 255,
    message: 'VARCHAR length considerations'
  },
  text: {
    maxLength: 65535,
    warningThreshold: 1000,
    message: 'TEXT field size considerations'
  },
  decimal: {
    maxPrecision: 65,
    maxScale: 30,
    message: 'DECIMAL precision and scale limits'
  },
  int: {
    range: [-2147483648, 2147483647],
    message: 'INT range limitations'
  },
  bigint: {
    range: [-9223372036854775808, 9223372036854775807],
    message: 'BIGINT range considerations'
  }
} as const;

/**
 * Check compatibility between source and target types
 */
export function checkCompatibility(sourceType: string, targetType: string): CompatibilityLevel {
  const source = sourceType.toLowerCase();
  const target = targetType.toLowerCase();

  // Find matching mapping
  const mapping = TYPE_MAPPINGS.find(m => 
    m.source.some(s => source.includes(s)) && 
    m.target.some(t => target.includes(t))
  );

  if (!mapping) {
    return 'error';
  }

  return mapping.compatibility;
}

/**
 * Get color code for compatibility level
 */
export function getCompatibilityColor(level: CompatibilityLevel): string {
  const colors = {
    compatible: '#4caf50',    // Green
    warning: '#ff9800',       // Orange
    error: '#f44336'          // Red
  };
  return colors[level];
}

/**
 * Get detailed compatibility result with suggestions
 */
export function getCompatibilityResult(sourceType: string, targetType: string): TypeCompatibilityResult {
  const level = checkCompatibility(sourceType, targetType);
  const color = getCompatibilityColor(level);
  const suggestions = getSuggestions(sourceType, targetType);
  
  let message = '';
  switch (level) {
    case 'compatible':
      message = `Direct mapping from ${sourceType} to ${targetType}`;
      break;
    case 'warning':
      message = `Compatible with warnings: ${sourceType} → ${targetType}`;
      break;
    case 'error':
      message = `Incompatible types: ${sourceType} → ${targetType}`;
      break;
  }

  return {
    level,
    message,
    suggestions,
    color
  };
}

/**
 * Get transformation suggestions for type conversion
 */
export function getSuggestions(sourceType: string, targetType: string): string[] {
  const suggestions: string[] = [];
  const source = sourceType.toLowerCase();
  const target = targetType.toLowerCase();

  // Find matching mapping for specific suggestions
  const mapping = TYPE_MAPPINGS.find(m => 
    m.source.some(s => source.includes(s)) && 
    m.target.some(t => target.includes(t))
  );

  if (mapping) {
    suggestions.push(...mapping.examples);
  }

  // Add general suggestions based on type categories
  if (source.includes('string') && target.includes('varchar')) {
    suggestions.push('Consider VARCHAR length based on expected data size');
    suggestions.push('Use VARCHAR(255) for names, VARCHAR(500) for descriptions');
  }

  if (source.includes('number') && target.includes('decimal')) {
    suggestions.push('Specify precision and scale: DECIMAL(10,2) for currency');
    suggestions.push('Consider rounding for decimal conversions');
  }

  if (source.includes('date') || source.includes('string')) {
    if (target.includes('date') || target.includes('datetime')) {
      suggestions.push('Validate date format before conversion');
      suggestions.push('Consider timezone handling for datetime');
    }
  }

  if (source.includes('object') || source.includes('array')) {
    if (target.includes('json')) {
      suggestions.push('Use JSON type for structured data');
      suggestions.push('Consider JSONB for better performance (PostgreSQL)');
    }
  }

  // Add format-specific suggestions
  if (source.includes('email')) {
    suggestions.push('Validate email format before storage');
    suggestions.push('Consider UNIQUE constraint for email fields');
  }

  if (source.includes('phone')) {
    suggestions.push('Standardize phone number format');
    suggestions.push('Use VARCHAR(20) for international numbers');
  }

  return suggestions;
}

/**
 * Validate special format fields
 */
export function validateFormat(value: string, expectedFormat?: string): {
  isValid: boolean;
  message: string;
  suggestions: string[];
} {
  if (!expectedFormat) {
    return { isValid: true, message: '', suggestions: [] };
  }

  const format = expectedFormat.toLowerCase();
  const rule = FORMAT_VALIDATION_RULES[format as keyof typeof FORMAT_VALIDATION_RULES];

  if (!rule) {
    return { isValid: true, message: '', suggestions: [] };
  }

  const isValid = rule.pattern.test(value);
  const message = isValid ? '' : rule.message;
  const suggestions = isValid ? [] : rule.suggestions;

  return { isValid, message, suggestions };
}

/**
 * Check size and precision constraints
 */
export function validateSizeConstraints(fieldType: string, value: any): {
  isValid: boolean;
  message: string;
  suggestions: string[];
} {
  const type = fieldType.toLowerCase();
  const rule = SIZE_VALIDATION_RULES[type as keyof typeof SIZE_VALIDATION_RULES];

  if (!rule) {
    return { isValid: true, message: '', suggestions: [] };
  }

  let isValid = true;
  let message = '';
  const suggestions: string[] = [];

  if (type.includes('varchar') || type.includes('text')) {
    const length = typeof value === 'string' ? value.length : 0;
    if ('maxLength' in rule && length > rule.maxLength) {
      isValid = false;
      message = `Value too long for ${type} (${length} > ${rule.maxLength})`;
      suggestions.push('Consider using TEXT or LONGTEXT for longer content');
    } else if ('warningThreshold' in rule && length > rule.warningThreshold) {
      suggestions.push(`Consider using TEXT for content longer than ${rule.warningThreshold} characters`);
    }
  }

  if (type.includes('int')) {
    const numValue = typeof value === 'number' ? value : parseInt(value);
    if ('range' in rule && (numValue < rule.range[0] || numValue > rule.range[1])) {
      isValid = false;
      message = `Value out of range for ${type}`;
      suggestions.push('Consider using BIGINT for larger numbers');
    }
  }

  return { isValid, message, suggestions };
}

/**
 * Get all compatible target types for a source type
 */
export function getCompatibleTargetTypes(sourceType: string): string[] {
  const source = sourceType.toLowerCase();
  const compatibleTypes: string[] = [];

  TYPE_MAPPINGS.forEach(mapping => {
    if (mapping.source.some(s => source.includes(s))) {
      compatibleTypes.push(...mapping.target);
    }
  });

  return [...new Set(compatibleTypes)]; // Remove duplicates
}

/**
 * Get all compatible source types for a target type
 */
export function getCompatibleSourceTypes(targetType: string): string[] {
  const target = targetType.toLowerCase();
  const compatibleTypes: string[] = [];

  TYPE_MAPPINGS.forEach(mapping => {
    if (mapping.target.some(t => target.includes(t))) {
      compatibleTypes.push(...mapping.source);
    }
  });

  return [...new Set(compatibleTypes)]; // Remove duplicates
}

/**
 * Get comprehensive type mapping information
 */
export function getTypeMappingInfo(sourceType: string, targetType: string): {
  mapping: TypeMapping | undefined;
  compatibility: CompatibilityLevel;
  suggestions: string[];
  warnings: string[];
} {
  const source = sourceType.toLowerCase();
  const target = targetType.toLowerCase();

  const mapping = TYPE_MAPPINGS.find(m => 
    m.source.some(s => source.includes(s)) && 
    m.target.some(t => target.includes(t))
  );

  const compatibility = mapping ? mapping.compatibility : 'error';
  const suggestions = getSuggestions(sourceType, targetType);
  const warnings: string[] = [];

  // Add specific warnings
  if (source.includes('string') && target.includes('char(1)')) {
    warnings.push('Data truncation may occur for strings longer than 1 character');
  }

  if (source.includes('number') && target.includes('tinyint')) {
    warnings.push('Number overflow may occur for values greater than 255');
  }

  if (source.includes('date') && target.includes('varchar')) {
    warnings.push('Date stored as string - consider using proper date type');
  }

  return {
    mapping,
    compatibility,
    suggestions,
    warnings
  };
}

/**
 * Example usage and common patterns
 */
export const COMMON_PATTERNS = {
  // User data mapping
  userProfile: {
    name: { source: 'string', target: 'varchar(100)', compatibility: 'compatible' },
    email: { source: 'string', target: 'varchar(255)', compatibility: 'compatible' },
    age: { source: 'number', target: 'int', compatibility: 'compatible' },
    isActive: { source: 'boolean', target: 'bit', compatibility: 'compatible' },
    createdAt: { source: 'date', target: 'datetime', compatibility: 'compatible' }
  },
  
  // Product data mapping
  product: {
    id: { source: 'string', target: 'varchar(36)', compatibility: 'compatible' },
    name: { source: 'string', target: 'varchar(255)', compatibility: 'compatible' },
    price: { source: 'number', target: 'decimal(10,2)', compatibility: 'compatible' },
    description: { source: 'string', target: 'text', compatibility: 'compatible' },
    metadata: { source: 'object', target: 'json', compatibility: 'compatible' }
  },
  
  // API response mapping
  apiResponse: {
    status: { source: 'number', target: 'int', compatibility: 'compatible' },
    message: { source: 'string', target: 'varchar(500)', compatibility: 'compatible' },
    data: { source: 'array', target: 'json', compatibility: 'compatible' },
    timestamp: { source: 'string', target: 'datetime', compatibility: 'warning' }
  }
};

export default {
  checkCompatibility,
  getCompatibilityColor,
  getSuggestions,
  getCompatibilityResult,
  validateFormat,
  validateSizeConstraints,
  getCompatibleTargetTypes,
  getCompatibleSourceTypes,
  getTypeMappingInfo,
  COMMON_PATTERNS
};

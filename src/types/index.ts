// Common types and interfaces for the application

// Authentication Configuration Interface
export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'oauth2';
  credentials: any; // Will be encrypted
}

// API Configuration Interface
export interface ApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authentication: AuthConfig;
  headers?: Record<string, string>;
  extractedFields?: ApiField[];
}

// Database Configuration Interface
export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'mssql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  schema?: string; // PostgreSQL specific
  instance?: string; // MS SQL specific
}

// Connection Profile Interface
export interface ConnectionProfile {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mssql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string; // Encrypted
  ssl: boolean;
  schema?: string;
  instance?: string;
  createdAt: Date;
  lastUsed?: Date;
}

// Drag and Drop Types
export interface DraggedField {
  id: string;
  name: string;
  type: string;
  source: 'api' | 'database';
  nullable?: boolean;
  constraints?: string[];
  schema?: string;
  table?: string;
}

export interface DropResult {
  field: DraggedField;
  targetId: string;
  position?: number;
}

export interface DragDropEvent {
  type: 'dragstart' | 'dragend' | 'drop';
  field: DraggedField;
  targetId?: string;
  position?: number;
}

export interface FieldMapping {
  id: string;
  sourceField: DraggedField;
  targetField: DraggedField;
  transformation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Field Interface
export interface ApiField {
  name: string;
  type: string;
  path: string;
  nested?: ApiField[];
}

// Database Column Interface
export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  constraints?: string[];
}

// Legacy Field Mapping Interface (for backward compatibility)
export interface LegacyFieldMapping {
  sourceField: ApiField;
  targetColumn: DatabaseColumn;
  transformation?: string;
}

// Legacy Mapping Config (for backward compatibility)
export interface MappingConfig {
  sourceFields: { id: string; value: string }[];
  targetFields: { id: string; value: string }[];
  transformations?: Record<string, string>;
}

// Test Result Interface
export interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
  timestamp: Date;
}

// Navigation types
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
  validation?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Enhanced types for the application state
export interface AppState {
  apiConfig: ApiConfig | null;
  databaseConfig: DatabaseConfig | null;
  mappingConfig: MappingConfig | null;
  fieldMappings: FieldMapping[];
  testResults: TestResult[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  user: string | null;
}

// Action types for state management
export type AppAction = 
  | { type: 'SET_API_CONFIG'; payload: ApiConfig }
  | { type: 'SET_DATABASE_CONFIG'; payload: DatabaseConfig }
  | { type: 'SET_MAPPING_CONFIG'; payload: MappingConfig }
  | { type: 'SET_FIELD_MAPPINGS'; payload: FieldMapping[] }
  | { type: 'ADD_TEST_RESULT'; payload: TestResult }
  | { type: 'CLEAR_TEST_RESULTS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' };
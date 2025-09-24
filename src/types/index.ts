// Common types and interfaces for the application

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface MappingConfig {
  sourceFields: { id: string; value: string }[];
  targetFields: { id: string; value: string }[];
  transformations?: Record<string, string>;
}

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

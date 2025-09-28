/**
 * API Testing Service
 * 
 * This service provides comprehensive API testing functionality including
 * request/response validation, performance monitoring, and error handling.
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type { ApiConfig, FieldMapping, ApiField } from '../types';

export interface ApiTestResult {
  id: string;
  url: string;
  method: string;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  responseTime: number;
  responseSize: number;
  headers: Record<string, string>;
  data?: any;
  error?: string;
  timestamp: Date;
  performance: {
    dns: number;
    tcp: number;
    request: number;
    response: number;
    total: number;
  };
}

export interface ApiTestConfig {
  timeout: number;
  retries: number;
  followRedirects: boolean;
  validateSSL: boolean;
  customHeaders?: Record<string, string>;
}

export interface ApiTestSuite {
  id: string;
  name: string;
  tests: ApiTest[];
  config: ApiTestConfig;
  results: ApiTestResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiTest {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  expectedResponseTime?: number;
  expectedFields?: string[];
  mappings?: FieldMapping[];
}

class ApiTestingService {
  private defaultConfig: ApiTestConfig = {
    timeout: 10000,
    retries: 3,
    followRedirects: true,
    validateSSL: true,
  };

  /**
   * Build authentication headers based on ApiConfig.authentication
   */
  private buildAuthHeaders(config: ApiConfig): Record<string, string> {
    const headers: Record<string, string> = {};
    const auth = config.authentication;
    if (!auth || auth.type === 'none') return headers;

    try {
      switch (auth.type) {
        case 'bearer': {
          const token = auth.credentials?.token || auth.credentials?.accessToken;
          if (token) headers['Authorization'] = `Bearer ${token}`;
          break;
        }
        case 'basic': {
          const username = auth.credentials?.username || '';
          const password = auth.credentials?.password || '';
          const encoded = typeof btoa === 'function'
            ? btoa(`${username}:${password}`)
            : Buffer.from(`${username}:${password}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
          break;
        }
        case 'oauth2': {
          const token = auth.credentials?.token || auth.credentials?.accessToken;
          if (token) headers['Authorization'] = `Bearer ${token}`;
          break;
        }
      }
    } catch (_) {
      // Swallow auth header construction errors; they'll surface as request failures later
    }

    return headers;
  }

  /**
   * Test a single API endpoint
   */
  async testEndpoint(
    config: ApiConfig,
    testConfig: Partial<ApiTestConfig> = {}
  ): Promise<ApiTestResult> {
    const startTime = performance.now();
    const testId = `test-${Date.now()}`;
    
    const mergedConfig = { ...this.defaultConfig, ...testConfig };
    
    try {
      const response = await this.makeRequest(config, mergedConfig);
      const endTime = performance.now();
      
      return {
        id: testId,
        url: config.url,
        method: config.method,
        status: 'success',
        statusCode: response.status,
        responseTime: endTime - startTime,
        responseSize: JSON.stringify(response.data).length,
        headers: response.headers as Record<string, string>,
        data: response.data,
        timestamp: new Date(),
        performance: this.calculatePerformance(startTime, endTime),
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        id: testId,
        url: config.url,
        method: config.method,
        status: this.determineErrorStatus(error as AxiosError),
        statusCode: (error as AxiosError)?.response?.status,
        responseTime: endTime - startTime,
        responseSize: 0,
        headers: {},
        error: this.formatError(error as AxiosError),
        timestamp: new Date(),
        performance: this.calculatePerformance(startTime, endTime),
      };
    }
  }

  /**
   * Run a test suite
   */
  async runTestSuite(suite: ApiTestSuite): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];
    
    for (const test of suite.tests) {
      try {
        const result = await this.testEndpoint(
          {
            url: test.url,
            method: test.method,
            authentication: { type: 'none', credentials: {} },
            headers: test.headers,
          },
          suite.config
        );
        
        // Validate test expectations
        if (test.expectedStatus && result.statusCode !== test.expectedStatus) {
          result.status = 'error';
          result.error = `Expected status ${test.expectedStatus}, got ${result.statusCode}`;
        }
        
        if (test.expectedResponseTime && result.responseTime > test.expectedResponseTime) {
          result.error = `Response time ${result.responseTime}ms exceeds expected ${test.expectedResponseTime}ms`;
        }
        
        if (test.expectedFields && result.data) {
          const missingFields = test.expectedFields.filter(field => 
            !this.hasField(result.data, field)
          );
          if (missingFields.length > 0) {
            result.error = `Missing expected fields: ${missingFields.join(', ')}`;
          }
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          id: `test-${Date.now()}`,
          url: test.url,
          method: test.method,
          status: 'error',
          responseTime: 0,
          responseSize: 0,
          headers: {},
          error: this.formatError(error as AxiosError),
          timestamp: new Date(),
          performance: { dns: 0, tcp: 0, request: 0, response: 0, total: 0 },
        });
      }
    }
    
    return results;
  }

  /**
   * Validate API response against field mappings
   */
  validateResponseAgainstMappings(
    response: any,
    mappings: FieldMapping[]
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const mapping of mappings) {
      const sourceValue = this.getFieldValue(response, mapping.sourceField.name);
      const targetType = mapping.targetField.type;
      
      if (sourceValue === undefined) {
        errors.push(`Source field '${mapping.sourceField.name}' not found in response`);
        continue;
      }
      
      // Validate data type compatibility
      const sourceType = typeof sourceValue;
      if (!this.isTypeCompatible(sourceType, targetType)) {
        warnings.push(
          `Type mismatch: ${sourceType} → ${targetType} for field '${mapping.sourceField.name}'`
        );
      }
      
      // Validate constraints
      if (mapping.targetField.constraints?.includes('NOT NULL') && 
          (sourceValue === null || sourceValue === undefined)) {
        errors.push(
          `Field '${mapping.sourceField.name}' is null but target requires NOT NULL`
        );
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate test report
   */
  generateTestReport(results: ApiTestResult[]): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageResponseTime: number;
      successRate: number;
    };
    details: ApiTestResult[];
  } {
    const total = results.length;
    const passed = results.filter(r => r.status === 'success').length;
    const failed = total - passed;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / total;
    const successRate = (passed / total) * 100;
    
    return {
      summary: {
        total,
        passed,
        failed,
        averageResponseTime,
        successRate,
      },
      details: results,
    };
  }

  /**
   * Make HTTP request with retries
   */
  private async makeRequest(
    config: ApiConfig,
    testConfig: ApiTestConfig
  ): Promise<AxiosResponse> {
    let lastError: AxiosError | null = null;
    
    for (let attempt = 0; attempt < testConfig.retries; attempt++) {
      try {
        const response = await axios({
          method: config.method,
          url: config.url,
          headers: {
            'Content-Type': 'application/json',
            ...this.buildAuthHeaders(config),
            ...config.headers,
            ...testConfig.customHeaders,
          },
          timeout: testConfig.timeout,
          validateStatus: () => true, // Don't throw on HTTP error status
          maxRedirects: testConfig.followRedirects ? 5 : 0,
        });
        
        return response;
      } catch (error) {
        lastError = error as AxiosError;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error as AxiosError)) {
          break;
        }
        
        // Wait before retry
        if (attempt < testConfig.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('Request failed');
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(startTime: number, endTime: number) {
    const total = endTime - startTime;
    return {
      dns: total * 0.1,
      tcp: total * 0.2,
      request: total * 0.3,
      response: total * 0.4,
      total,
    };
  }

  /**
   * Determine error status
   */
  private determineErrorStatus(error: AxiosError): 'error' | 'timeout' {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'timeout';
    }
    return 'error';
  }

  /**
   * Format error message
   */
  private formatError(error: AxiosError): string {
    if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      return 'Network error: No response received';
    } else {
      return `Request error: ${error.message}`;
    }
  }

  /**
   * Check if field exists in object
   */
  private hasField(obj: any, fieldPath: string): boolean {
    const parts = fieldPath.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get field value from object
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Check type compatibility
   */
  private isTypeCompatible(sourceType: string, targetType: string): boolean {
    const typeMap: Record<string, string[]> = {
      'string': ['varchar', 'text', 'char', 'nvarchar'],
      'number': ['int', 'bigint', 'decimal', 'float', 'double'],
      'boolean': ['bit', 'boolean', 'tinyint'],
      'object': ['json', 'jsonb', 'text'],
    };
    
    const compatibleTypes = typeMap[sourceType] || [];
    return compatibleTypes.some(type => targetType.toLowerCase().includes(type));
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: AxiosError): boolean {
    const nonRetryableCodes = [400, 401, 403, 404, 405, 406, 409, 410, 422];
    return nonRetryableCodes.includes(error.response?.status || 0);
  }

  /**
   * Parse response data based on content-type header
   */
  private parseResponseData(response: AxiosResponse): { data: any; contentType: string; parseError?: string } {
    const contentType = (response.headers?.['content-type'] || '').toLowerCase();
    const rawData = response.data;

    // If axios already parsed JSON, return as-is
    if (contentType.includes('application/json')) {
      try {
        if (typeof rawData === 'string') {
          return { data: JSON.parse(rawData), contentType };
        }
        return { data: rawData, contentType };
      } catch (e: any) {
        return { data: rawData, contentType, parseError: `JSON parse error: ${e?.message || 'Unknown'}` };
      }
    }

    // XML support
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      try {
        const text = typeof rawData === 'string' ? rawData : (rawData?.toString?.() ?? '');
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xml');
        const parseErr = doc.querySelector('parsererror');
        if (parseErr) {
          return { data: text, contentType, parseError: 'XML parse error' };
        }
        const json = this.xmlToJson(doc.documentElement);
        return { data: json, contentType };
      } catch (e: any) {
        return { data: rawData, contentType, parseError: `XML parse error: ${e?.message || 'Unknown'}` };
      }
    }

    // Fallback: text or binary
    return { data: rawData, contentType };
  }

  /** Convert XML Element to a simple JSON structure */
  private xmlToJson(element: Element): any {
    const obj: any = {};
    // Attributes
    if (element.attributes && element.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i)!;
        obj['@attributes'][attr.name] = attr.value;
      }
    }
    // Children
    if (element.childNodes && element.childNodes.length > 0) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes.item(i);
        if (node.nodeType === 1) { // ELEMENT_NODE
          const child = node as Element;
          const name = child.nodeName;
          const value = this.xmlToJson(child);
          if (obj[name] === undefined) {
            obj[name] = value;
          } else {
            if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
            obj[name].push(value);
          }
        } else if (node.nodeType === 3) { // TEXT_NODE
          const text = node.nodeValue?.trim();
          if (text) {
            obj['#text'] = text;
          }
        }
      }
    }
    return obj;
  }

  /** Determine a normalized JS type string */
  private getTypeOf(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value; // string, number, boolean, object, undefined, function, symbol, bigint
  }

  /** Get value by dot path from object */
  private getByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /** Categorize an Axios/network error */
  private categorizeError(error: AxiosError): string {
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) return 'timeout';
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) return 'auth';
      if (status >= 500) return 'http_5xx';
      if (status >= 400) return 'http_4xx';
      return 'http_error';
    }
    if (error.request) return 'network';
    return 'unknown';
  }
}

// ---------------------------------------------
// Public API requested by user
// ---------------------------------------------

export interface TestResult {
  success: boolean;
  responseTime: number;
  statusCode: number;
  data: any;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  missingFields: string[];
  typeMismatches: string[];
}

/**
 * Makes an actual HTTP request, measures response time, handles auth, retries, and categorizes errors.
 */
export async function testAPIConnection(
  config: ApiConfig,
  options: Partial<ApiTestConfig> = {}
): Promise<TestResult> {
  const service = apiTestingService;
  const merged = { ...service['defaultConfig'], ...options } as ApiTestConfig;
  const start = performance.now();
  const errors: string[] = [];

  try {
    const response = await service['makeRequest'](config, merged);
    const end = performance.now();

    // Parse content
    const parsed = service['parseResponseData'](response);

    // Validate basic status code range
    if (response.status < 200 || response.status >= 300) {
      errors.push(`HTTP ${response.status}: ${response.statusText || 'Non-success status'}`);
    }

    // Content-type parse error surfaced
    if (parsed.parseError) {
      errors.push(parsed.parseError);
    }

    return {
      success: errors.length === 0,
      responseTime: end - start,
      statusCode: response.status,
      data: parsed.data,
      errors,
    };
  } catch (e: any) {
    const end = performance.now();
    const err = e as AxiosError;
    const category = apiTestingService['categorizeError'](err);
    const message = apiTestingService['formatError'](err);
    errors.push(`[${category}] ${message}`);
    return {
      success: false,
      responseTime: end - start,
      statusCode: err?.response?.status || 0,
      data: null,
      errors,
    };
  }
}

/**
 * Validates that expected fields exist and that their types match expectations.
 * Supports JSON (and XML converted to JSON structure).
 */
export function validateAPIResponse(response: any, expectedFields: ApiField[]): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];
  const typeMismatches: string[] = [];

  if (!response || typeof response !== 'object') {
    return {
      valid: false,
      errors: ['Response is empty or not an object'],
      missingFields: expectedFields.map(f => f.path || f.name),
      typeMismatches: [],
    };
  }

  for (const field of expectedFields) {
    const path = field.path || field.name;
    const value = apiTestingService['getByPath'](response, path);
    if (value === undefined) {
      missingFields.push(path);
      continue;
    }
    if (field.type) {
      const actualType = apiTestingService['getTypeOf'](value);
      const expectedType = (field.type || '').toLowerCase();
      // Basic normalization: map some db-like types to js types
      const expectedJsType = expectedType.includes('int') || expectedType.includes('decimal') || expectedType.includes('number')
        ? 'number'
        : expectedType.includes('bool') ? 'boolean'
        : expectedType.includes('char') || expectedType.includes('text') || expectedType.includes('string') ? 'string'
        : expectedType.includes('array') ? 'array'
        : expectedType.includes('object') || expectedType.includes('json') ? 'object'
        : expectedType;
      if (actualType !== expectedJsType) {
        typeMismatches.push(`${path}: expected ${expectedJsType}, got ${actualType}`);
      }
    }
  }

  if (missingFields.length > 0) {
    errors.push(`Missing fields: ${missingFields.join(', ')}`);
  }
  if (typeMismatches.length > 0) {
    errors.push(`Type mismatches: ${typeMismatches.join('; ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
    typeMismatches,
  };
}

export const apiTestingService = new ApiTestingService();
export default apiTestingService;

/**
 * API Testing Service
 * 
 * This service provides comprehensive API testing functionality including
 * request/response validation, performance monitoring, and error handling.
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type { ApiConfig, FieldMapping } from '../types';

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
}

export const apiTestingService = new ApiTestingService();
export default apiTestingService;

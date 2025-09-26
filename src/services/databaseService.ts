import type { DatabaseConfig, DatabaseColumn } from '../types';

// API base URL - adjust this to match your backend server
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-api-server.com' 
  : 'http://localhost:3001';

// Database Service using API calls
export const databaseService = {
  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  },

  async getSchemas(config: DatabaseConfig): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/schemas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      if (result.success) {
        return result.schemas;
      } else {
        throw new Error(result.error || 'Failed to get schemas');
      }
    } catch (error) {
      console.error('Failed to get database schemas:', error);
      throw error;
    }
  },

  async getTables(config: DatabaseConfig, schema?: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...config, schema }),
      });
      
      const result = await response.json();
      if (result.success) {
        return result.tables;
      } else {
        throw new Error(result.error || 'Failed to get tables');
      }
    } catch (error) {
      console.error('Failed to get database tables:', error);
      throw error;
    }
  },

  async getColumns(config: DatabaseConfig, table: string, schema?: string): Promise<DatabaseColumn[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...config, table, schema }),
      });
      
      const result = await response.json();
      if (result.success) {
        return result.columns;
      } else {
        throw new Error(result.error || 'Failed to get columns');
      }
    } catch (error) {
      console.error('Failed to get database columns:', error);
      throw error;
    }
  },

  async executeQuery(config: DatabaseConfig, query: string): Promise<{ data: any[], rowCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...config, query }),
      });
      
      const result = await response.json();
      if (result.success) {
        return { data: result.data, rowCount: result.rowCount };
      } else {
        throw new Error(result.error || 'Failed to execute query');
      }
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }
};
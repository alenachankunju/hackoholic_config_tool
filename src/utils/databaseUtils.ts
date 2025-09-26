import CryptoJS from 'crypto-js';
import type { DatabaseConfig, ConnectionProfile } from '../types';

// Encryption key for passwords (in production, this should come from environment variables)
const ENCRYPTION_KEY = 'hackoholics-db-key-2024';

/**
 * Encrypts a password using AES encryption
 */
export function encryptPassword(password: string): string {
  try {
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Password encryption failed:', error);
    return password; // Return original password if encryption fails
  }
}

/**
 * Decrypts a password using AES decryption
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Password decryption failed:', error);
    return encryptedPassword; // Return encrypted password if decryption fails
  }
}

/**
 * Generates a connection string based on database configuration
 */
export function generateConnectionString(config: DatabaseConfig): string {
  const { type, host, port, database, username, password, ssl, schema, instance } = config;
  
  let connectionString = '';
  
  switch (type) {
    case 'mysql':
      connectionString = `mysql://${username}:${password}@${host}:${port}/${database}`;
      if (ssl) {
        connectionString += '?ssl=true';
      }
      break;
      
    case 'postgresql':
      connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      if (schema) {
        connectionString += `?schema=${schema}`;
      }
      if (ssl) {
        connectionString += schema ? '&ssl=true' : '?ssl=true';
      }
      break;
      
    case 'mssql':
      connectionString = `mssql://${username}:${password}@${host}:${port}/${database}`;
      if (instance) {
        connectionString += `?instance=${instance}`;
      }
      if (ssl) {
        connectionString += instance ? '&ssl=true' : '?ssl=true';
      }
      break;
      
    default:
      connectionString = `${type}://${username}:${password}@${host}:${port}/${database}`;
  }
  
  return connectionString;
}

/**
 * Generates a display-friendly connection string (without password)
 */
export function generateDisplayConnectionString(config: DatabaseConfig): string {
  const { type, host, port, database, username, ssl, schema, instance } = config;
  
  let connectionString = '';
  
  switch (type) {
    case 'mysql':
      connectionString = `mysql://${username}:***@${host}:${port}/${database}`;
      if (ssl) {
        connectionString += '?ssl=true';
      }
      break;
      
    case 'postgresql':
      connectionString = `postgresql://${username}:***@${host}:${port}/${database}`;
      if (schema) {
        connectionString += `?schema=${schema}`;
      }
      if (ssl) {
        connectionString += schema ? '&ssl=true' : '?ssl=true';
      }
      break;
      
    case 'mssql':
      connectionString = `mssql://${username}:***@${host}:${port}/${database}`;
      if (instance) {
        connectionString += `?instance=${instance}`;
      }
      if (ssl) {
        connectionString += instance ? '&ssl=true' : '?ssl=true';
      }
      break;
      
    default:
      connectionString = `${type}://${username}:***@${host}:${port}/${database}`;
  }
  
  return connectionString;
}

/**
 * Validates database configuration
 */
export function validateDatabaseConfig(config: Partial<DatabaseConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.host?.trim()) {
    errors.push('Host is required');
  }
  
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }
  
  if (!config.database?.trim()) {
    errors.push('Database name is required');
  }
  
  if (!config.username?.trim()) {
    errors.push('Username is required');
  }
  
  if (!config.password?.trim()) {
    errors.push('Password is required');
  }
  
  // Database-specific validation
  if (config.type === 'postgresql' && config.schema && !config.schema.trim()) {
    errors.push('Schema cannot be empty if provided');
  }
  
  if (config.type === 'mssql' && config.instance && !config.instance.trim()) {
    errors.push('Instance cannot be empty if provided');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a connection profile from database configuration
 */
export function createConnectionProfile(
  config: DatabaseConfig, 
  name: string
): ConnectionProfile {
  return {
    id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type: config.type,
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: encryptPassword(config.password),
    ssl: config.ssl,
    schema: config.schema,
    instance: config.instance,
    createdAt: new Date(),
  };
}

/**
 * Converts a connection profile back to database configuration
 */
export function profileToDatabaseConfig(profile: ConnectionProfile): DatabaseConfig {
  return {
    type: profile.type,
    host: profile.host,
    port: profile.port,
    database: profile.database,
    username: profile.username,
    password: decryptPassword(profile.password),
    ssl: profile.ssl,
    schema: profile.schema,
    instance: profile.instance,
  };
}

/**
 * Saves connection profiles to localStorage
 */
export function saveConnectionProfiles(profiles: ConnectionProfile[]): void {
  try {
    localStorage.setItem('hackoholics_db_profiles', JSON.stringify(profiles));
  } catch (error) {
    console.error('Failed to save connection profiles:', error);
  }
}

/**
 * Loads connection profiles from localStorage
 */
export function loadConnectionProfiles(): ConnectionProfile[] {
  try {
    const stored = localStorage.getItem('hackoholics_db_profiles');
    if (stored) {
      const profiles = JSON.parse(stored);
      // Convert date strings back to Date objects
      return profiles.map((profile: any) => ({
        ...profile,
        createdAt: new Date(profile.createdAt),
        lastUsed: profile.lastUsed ? new Date(profile.lastUsed) : undefined,
      }));
    }
  } catch (error) {
    console.error('Failed to load connection profiles:', error);
  }
  return [];
}

/**
 * Updates a connection profile's last used timestamp
 */
export function updateProfileLastUsed(profileId: string): void {
  const profiles = loadConnectionProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (profile) {
    profile.lastUsed = new Date();
    saveConnectionProfiles(profiles);
  }
}


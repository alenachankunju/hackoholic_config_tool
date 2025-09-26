import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import sql from 'mssql';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection helpers
async function createMySQLConnection(config) {
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined
  });
}

async function createPostgreSQLConnection(config) {
  const client = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined
  });
  return client;
}

async function createMSSQLConnection(config) {
  const pool = await sql.connect({
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    options: {
      encrypt: config.ssl,
      instanceName: config.instance,
      trustServerCertificate: true
    }
  });
  return pool;
}

// API Routes

// Test database connection
app.post('/api/database/test', async (req, res) => {
  try {
    console.log('Testing database connection:', req.body);
    const { type, ...config } = req.body;
    
    if (!type) {
      throw new Error('Database type is required');
    }
    
    switch (type) {
      case 'mysql':
        console.log('Testing MySQL connection...');
        const mysqlConn = await createMySQLConnection(config);
        await mysqlConn.ping();
        await mysqlConn.end();
        console.log('MySQL connection successful');
        break;
      case 'postgresql':
        console.log('Testing PostgreSQL connection...');
        const pgConn = await createPostgreSQLConnection(config);
        await pgConn.query('SELECT 1');
        await pgConn.end();
        console.log('PostgreSQL connection successful');
        break;
      case 'mssql':
        console.log('Testing MS SQL Server connection...');
        const mssqlConn = await createMSSQLConnection(config);
        await mssqlConn.request().query('SELECT 1');
        await mssqlConn.close();
        console.log('MS SQL Server connection successful');
        break;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
    
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get database schemas
app.post('/api/database/schemas', async (req, res) => {
  try {
    console.log('Getting schemas for:', req.body);
    const { type, ...config } = req.body;
    let schemas = [];
    
    if (!type) {
      throw new Error('Database type is required');
    }
    
    switch (type) {
      case 'mysql':
        console.log('Getting MySQL schemas...');
        const mysqlConn = await createMySQLConnection(config);
        const [mysqlRows] = await mysqlConn.execute('SHOW DATABASES');
        await mysqlConn.end();
        schemas = mysqlRows.map(row => row.Database);
        break;
        
      case 'postgresql':
        console.log('Getting PostgreSQL schemas...');
        const pgConn = await createPostgreSQLConnection(config);
        const pgResult = await pgConn.query(`
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          ORDER BY schema_name
        `);
        await pgConn.end();
        schemas = pgResult.rows.map(row => row.schema_name);
        break;
        
      case 'mssql':
        console.log('Getting MS SQL Server schemas...');
        const mssqlConn = await createMSSQLConnection(config);
        const mssqlResult = await mssqlConn.request().query(`
          SELECT name FROM sys.schemas 
          WHERE name NOT IN ('sys', 'INFORMATION_SCHEMA')
        `);
        await mssqlConn.close();
        schemas = mssqlResult.recordset.map(row => row.name);
        break;
        
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
    
    console.log('Schemas found:', schemas);
    res.json({ success: true, schemas });
  } catch (error) {
    console.error('Failed to get schemas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tables for a schema
app.post('/api/database/tables', async (req, res) => {
  try {
    const { type, schema, ...config } = req.body;
    let tables = [];
    
    switch (type) {
      case 'mysql':
        const mysqlConn = await createMySQLConnection(config);
        const databaseName = schema || config.database;
        const [mysqlRows] = await mysqlConn.execute(`SHOW TABLES FROM \`${databaseName}\``);
        await mysqlConn.end();
        tables = mysqlRows.map(row => Object.values(row)[0]);
        break;
        
      case 'postgresql':
        const pgConn = await createPostgreSQLConnection(config);
        const schemaName = schema || 'public';
        const pgResult = await pgConn.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `, [schemaName]);
        await pgConn.end();
        tables = pgResult.rows.map(row => row.table_name);
        break;
        
      case 'mssql':
        const mssqlConn = await createMSSQLConnection(config);
        const mssqlSchemaName = schema || 'dbo';
        const mssqlResult = await mssqlConn.request()
          .input('schema', sql.NVarChar, mssqlSchemaName)
          .query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = @schema
          `);
        await mssqlConn.close();
        tables = mssqlResult.recordset.map(row => row.TABLE_NAME);
        break;
        
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
    
    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get columns for a table
app.post('/api/database/columns', async (req, res) => {
  try {
    const { type, table, schema, ...config } = req.body;
    let columns = [];
    
    switch (type) {
      case 'mysql':
        const mysqlConn = await createMySQLConnection(config);
        const databaseName = schema || config.database;
        const [mysqlRows] = await mysqlConn.execute(`DESCRIBE \`${databaseName}\`.\`${table}\``);
        await mysqlConn.end();
        columns = mysqlRows.map(row => ({
          name: row.Field,
          type: row.Type,
          nullable: row.Null === 'YES',
          constraints: [row.Key, row.Default, row.Extra].filter(Boolean)
        }));
        break;
        
      case 'postgresql':
        const pgConn = await createPostgreSQLConnection(config);
        const schemaName = schema || 'public';
        const pgResult = await pgConn.query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schemaName, table]);
        await pgConn.end();
        columns = pgResult.rows.map(row => ({
          name: row.column_name,
          type: formatPostgreSQLType(row),
          nullable: row.is_nullable === 'YES',
          constraints: getPostgreSQLConstraints(row)
        }));
        break;
        
      case 'mssql':
        const mssqlConn = await createMSSQLConnection(config);
        const mssqlSchemaName = schema || 'dbo';
        const mssqlResult = await mssqlConn.request()
          .input('schema', sql.NVarChar, mssqlSchemaName)
          .input('table', sql.NVarChar, table)
          .query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @table
            ORDER BY ORDINAL_POSITION
          `);
        await mssqlConn.close();
        columns = mssqlResult.recordset.map(row => ({
          name: row.COLUMN_NAME,
          type: row.DATA_TYPE,
          nullable: row.IS_NULLABLE === 'YES',
          constraints: row.COLUMN_DEFAULT ? [row.COLUMN_DEFAULT] : []
        }));
        break;
        
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
    
    res.json({ success: true, columns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions for PostgreSQL
function formatPostgreSQLType(row) {
  let type = row.data_type;
  
  if (row.character_maximum_length) {
    type += `(${row.character_maximum_length})`;
  } else if (row.numeric_precision) {
    if (row.numeric_scale) {
      type += `(${row.numeric_precision},${row.numeric_scale})`;
    } else {
      type += `(${row.numeric_precision})`;
    }
  }
  
  return type;
}

function getPostgreSQLConstraints(row) {
  const constraints = [];
  
  if (row.column_default) {
    constraints.push(`DEFAULT ${row.column_default}`);
  }
  
  if (row.is_nullable === 'NO') {
    constraints.push('NOT NULL');
  }
  
  return constraints;
}

// Execute SQL query
app.post('/api/database/query', async (req, res) => {
  try {
    console.log('Executing query:', req.body);
    const { type, query, ...config } = req.body;
    
    if (!type || !query) {
      throw new Error('Database type and query are required');
    }
    
    let result;
    
    switch (type) {
      case 'mysql':
        console.log('Executing MySQL query...');
        const mysqlConn = await createMySQLConnection(config);
        const [mysqlRows] = await mysqlConn.execute(query);
        await mysqlConn.end();
        result = mysqlRows;
        break;
        
      case 'postgresql':
        console.log('Executing PostgreSQL query...');
        const pgConn = await createPostgreSQLConnection(config);
        const pgResult = await pgConn.query(query);
        await pgConn.end();
        result = pgResult.rows;
        break;
        
      case 'mssql':
        console.log('Executing MS SQL Server query...');
        const mssqlConn = await createMSSQLConnection(config);
        const mssqlResult = await mssqlConn.request().query(query);
        await mssqlConn.close();
        result = mssqlResult.recordset;
        break;
        
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
    
    console.log('Query executed successfully, rows:', result.length);
    res.json({ success: true, data: result, rowCount: result.length });
  } catch (error) {
    console.error('Query execution failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Database API server running on port ${PORT}`);
});

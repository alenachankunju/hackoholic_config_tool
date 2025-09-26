# Hackoholics Setup Guide

## Architecture Overview

The application now uses a **client-server architecture** to handle database operations:

- **Frontend**: React app (browser) - handles UI and makes API calls
- **Backend**: Express.js server - handles database connections and operations

## Setup Instructions

### 1. Frontend Setup (Already Done)

The frontend is already configured and ready to use. It will make API calls to the backend server.

### 2. Backend Server Setup

To enable real database schema loading, you need to set up the backend API server:

#### Option A: Quick Setup (Recommended)

1. **Install server dependencies:**
   ```bash
   # Copy the server package.json
   cp server-package.json package-server.json
   
   # Install server dependencies
   npm install --prefix ./server express cors mysql2 pg mssql nodemon
   ```

2. **Start the backend server:**
   ```bash
   # In a new terminal window
   node server.js
   ```

3. **Start the frontend:**
   ```bash
   # In another terminal window
   npm run dev
   ```

#### Option B: Separate Server Directory

1. **Create server directory:**
   ```bash
   mkdir server
   cd server
   ```

2. **Initialize server project:**
   ```bash
   cp ../server-package.json package.json
   cp ../server.js .
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

### 3. Environment Configuration

The backend server will run on `http://localhost:3001` by default.

For production, update the `API_BASE_URL` in `src/services/databaseService.ts`:

```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-production-api-server.com' 
  : 'http://localhost:3001';
```

## How It Works

### Database Operations Flow:

1. **User configures database connection** in the frontend
2. **Frontend sends API request** to backend server
3. **Backend connects to database** using appropriate driver
4. **Backend executes database queries** (schemas, tables, columns)
5. **Backend returns results** to frontend
6. **Frontend displays real schema data** in the tree view

### Supported Databases:

- **MySQL**: Uses `mysql2` driver
- **PostgreSQL**: Uses `pg` driver  
- **MS SQL Server**: Uses `mssql` driver

### API Endpoints:

- `POST /api/database/test` - Test database connection
- `POST /api/database/schemas` - Get database schemas
- `POST /api/database/tables` - Get tables for a schema
- `POST /api/database/columns` - Get columns for a table

## Troubleshooting

### Common Issues:

1. **"Buffer is not defined" error**: 
   - This means you're trying to run database drivers in the browser
   - Make sure the backend server is running
   - Check that the frontend is making API calls to the backend

2. **CORS errors**:
   - The backend server includes CORS middleware
   - Make sure the backend is running on the correct port

3. **Database connection errors**:
   - Check your database credentials
   - Ensure the database server is accessible
   - Verify firewall settings

### Development vs Production:

- **Development**: Backend runs on `localhost:3001`, frontend on `localhost:5173`
- **Production**: Deploy backend to a server, update `API_BASE_URL` in frontend

## Benefits of This Architecture:

✅ **Security**: Database credentials never leave the server  
✅ **Performance**: Database operations happen on the server  
✅ **Scalability**: Can handle multiple database connections  
✅ **Browser Compatibility**: No Node.js dependencies in browser  
✅ **Real Data**: Actual database schema introspection  

## Next Steps:

1. Start the backend server: `node server.js`
2. Start the frontend: `npm run dev`
3. Configure a database connection in the app
4. See real schema data populate in the tree view!

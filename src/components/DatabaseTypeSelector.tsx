import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Storage as MySQLIcon,
  Storage as PostgreSQLIcon,
  Storage as MSSQLIcon,
} from '@mui/icons-material';

export type DatabaseType = 'mysql' | 'postgresql' | 'mssql';

interface DatabaseTypeSelectorProps {
  selectedType: DatabaseType;
  onTypeChange: (type: DatabaseType) => void;
  disabled?: boolean;
}

const DATABASE_TYPES = [
  {
    value: 'mysql' as DatabaseType,
    label: 'MySQL',
    description: 'Open-source relational database management system',
    icon: <MySQLIcon sx={{ color: '#00758f' }} />,
    color: '#00758f',
    port: 3306,
  },
  {
    value: 'postgresql' as DatabaseType,
    label: 'PostgreSQL',
    description: 'Advanced open-source object-relational database',
    icon: <PostgreSQLIcon sx={{ color: '#336791' }} />,
    color: '#336791',
    port: 5432,
  },
  {
    value: 'mssql' as DatabaseType,
    label: 'MS SQL Server',
    description: 'Microsoft SQL Server database management system',
    icon: <MSSQLIcon sx={{ color: '#cc2927' }} />,
    color: '#cc2927',
    port: 1433,
  },
] as const;

const DatabaseTypeSelector: React.FC<DatabaseTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false,
}) => {
  const selectedDatabase = DATABASE_TYPES.find(db => db.value === selectedType);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Database Type Selection */}
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel sx={{ fontSize: '0.8rem' }}>Database Type</InputLabel>
        <Select
          value={selectedType}
          label="Database Type"
          onChange={(e) => onTypeChange(e.target.value as DatabaseType)}
          sx={{
            '& .MuiSelect-select': { fontSize: '0.8rem' },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' }
          }}
        >
          {DATABASE_TYPES.map((database) => (
            <MenuItem key={database.value} value={database.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box sx={{ color: database.color }}>
                  {database.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {database.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Port: {database.port}
                  </Typography>
                </Box>
                <Chip 
                  label={database.label} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem',
                    backgroundColor: database.color,
                    color: 'white',
                    height: 20
                  }} 
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Selected Database Info */}
      {selectedDatabase && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          p: 1.5,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Tooltip title={selectedDatabase.description} arrow>
            <Box sx={{ color: selectedDatabase.color, cursor: 'help' }}>
              {selectedDatabase.icon}
            </Box>
          </Tooltip>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              {selectedDatabase.label}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Default Port: {selectedDatabase.port}
            </Typography>
          </Box>
          <Chip 
            label={selectedDatabase.label} 
            size="small" 
            sx={{ 
              fontSize: '0.7rem',
              backgroundColor: selectedDatabase.color,
              color: 'white',
              height: 20
            }} 
          />
        </Box>
      )}
    </Box>
  );
};

export default DatabaseTypeSelector;


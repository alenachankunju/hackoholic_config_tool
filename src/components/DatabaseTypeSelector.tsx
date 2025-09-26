import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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
  // Simplified dropdown only; no extra UI elements

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              {database.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DatabaseTypeSelector;


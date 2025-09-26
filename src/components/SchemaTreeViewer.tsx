import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Card,
  CardContent,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Storage as DatabaseIcon,
  TableChart as TableIcon,
  ViewColumn as ColumnIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { databaseService } from '../services/databaseService';
import type { DatabaseConfig, DatabaseColumn } from '../types';

interface SchemaTreeViewerProps {
  config: DatabaseConfig;
  onTableSelect?: (table: string, columns: DatabaseColumn[]) => void;
  onSchemaSelect?: (schema: string) => void;
  onColumnSelect?: (column: DatabaseColumn, table: string, schema: string) => void;
  disabled?: boolean;
}

interface SchemaNode {
  name: string;
  tables: TableNode[];
  loading: boolean;
  error?: string;
  expanded: boolean;
}

interface TableNode {
  name: string;
  columns: DatabaseColumn[];
  loading: boolean;
  error?: string;
  expanded: boolean;
}

interface SearchResult {
  type: 'schema' | 'table' | 'column';
  schema: string;
  table?: string;
  column?: DatabaseColumn;
}

const SchemaTreeViewer: React.FC<SchemaTreeViewerProps> = ({
  config,
  onTableSelect,
  onSchemaSelect,
  onColumnSelect,
  disabled = false,
}) => {
  const [schemas, setSchemas] = useState<SchemaNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    nodeId: string;
    nodeType: 'schema' | 'table' | 'column';
  } | null>(null);

  // Load schemas on component mount or config change
  useEffect(() => {
    if (config.host && config.database && config.username) {
      loadSchemas();
    }
  }, [config]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();
    
    schemas.forEach(schema => {
      if (schema.name.toLowerCase().includes(query)) {
        results.push({ type: 'schema', schema: schema.name });
      }
      
      schema.tables.forEach(table => {
        if (table.name.toLowerCase().includes(query)) {
          results.push({ type: 'table', schema: schema.name, table: table.name });
        }
        
        table.columns.forEach(column => {
          if (column.name.toLowerCase().includes(query) || 
              column.type.toLowerCase().includes(query)) {
            results.push({ 
              type: 'column', 
              schema: schema.name, 
              table: table.name, 
              column 
            });
          }
        });
      });
    });
    
    return results;
  }, [searchQuery, schemas]);

  // Load schemas from database
  const loadSchemas = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const schemaNames = await databaseService.getSchemas(config);
      const schemaNodes: SchemaNode[] = schemaNames.map(name => ({
        name,
        tables: [],
        loading: false,
        expanded: false,
      }));
      
      setSchemas(schemaNodes);
    } catch (err) {
      setError(`Failed to load schemas: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tables for a schema
  const loadTables = async (schemaIndex: number) => {
    const schema = schemas[schemaIndex];
    if (!schema || schema.tables.length > 0) return;

    // Update schema loading state
    setSchemas(prev => prev.map((s, i) => 
      i === schemaIndex ? { ...s, loading: true, error: undefined } : s
    ));

    try {
      const tableNames = await databaseService.getTables(config, schema.name);
      const tableNodes: TableNode[] = tableNames.map(name => ({
        name,
        columns: [],
        loading: false,
        expanded: false,
      }));

      setSchemas(prev => prev.map((s, i) => 
        i === schemaIndex ? { ...s, tables: tableNodes, loading: false, expanded: true } : s
      ));

      // Notify parent of schema selection
      if (onSchemaSelect) {
        onSchemaSelect(schema.name);
      }
    } catch (err) {
      setSchemas(prev => prev.map((s, i) => 
        i === schemaIndex ? { ...s, loading: false, error: `Failed to load tables: ${err}` } : s
      ));
    }
  };

  // Load columns for a table
  const loadColumns = async (schemaIndex: number, tableIndex: number) => {
    const schema = schemas[schemaIndex];
    const table = schema?.tables[tableIndex];
    if (!table || table.columns.length > 0) return;

    // Update table loading state
    setSchemas(prev => prev.map((s, i) => 
      i === schemaIndex ? {
        ...s,
        tables: s.tables.map((t, j) => 
          j === tableIndex ? { ...t, loading: true, error: undefined } : t
        )
      } : s
    ));

    try {
      const columns = await databaseService.getColumns(config, table.name, schema.name);
      
      setSchemas(prev => prev.map((s, i) => 
        i === schemaIndex ? {
          ...s,
          tables: s.tables.map((t, j) => 
            j === tableIndex ? { ...t, columns, loading: false, expanded: true } : t
          )
        } : s
      ));

      // Notify parent of table selection
      if (onTableSelect) {
        onTableSelect(table.name, columns);
      }
    } catch (err) {
      setSchemas(prev => prev.map((s, i) => 
        i === schemaIndex ? {
          ...s,
          tables: s.tables.map((t, j) => 
            j === tableIndex ? { ...t, loading: false, error: `Failed to load columns: ${err}` } : t
          )
        } : s
      ));
    }
  };

  // Handle node expansion
  const handleNodeToggle = (nodeId: string) => {
    if (nodeId.startsWith('schema-')) {
      const schemaIndex = parseInt(nodeId.split('-')[1]);
      setSchemas(prev => prev.map((s, i) => 
        i === schemaIndex ? { ...s, expanded: !s.expanded } : s
      ));
      
      if (!schemas[schemaIndex]?.expanded) {
        loadTables(schemaIndex);
      }
    } else if (nodeId.startsWith('table-')) {
      const [schemaIndex, tableIndex] = nodeId.split('-').slice(1).map(Number);
      setSchemas(prev => prev.map((s, i) => 
        i === schemaIndex ? {
          ...s,
          tables: s.tables.map((t, j) => 
            j === tableIndex ? { ...t, expanded: !t.expanded } : t
          )
        } : s
      ));
      
      if (!schemas[schemaIndex]?.tables[tableIndex]?.expanded) {
        loadColumns(schemaIndex, tableIndex);
      }
    }
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent, nodeId: string, nodeType: 'schema' | 'table' | 'column') => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      nodeId,
      nodeType,
    });
  };

  // Handle context menu close
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (contextMenu?.nodeType === 'schema') {
      const schemaIndex = parseInt(contextMenu.nodeId.split('-')[1]);
      loadTables(schemaIndex);
    } else if (contextMenu?.nodeType === 'table') {
      const [schemaIndex, tableIndex] = contextMenu.nodeId.split('-').slice(1).map(Number);
      loadColumns(schemaIndex, tableIndex);
    } else {
      loadSchemas();
    }
    handleContextMenuClose();
  };

  // Handle column selection
  const handleColumnSelect = (column: DatabaseColumn, table: string, schema: string) => {
    if (onColumnSelect) {
      onColumnSelect(column, table, schema);
    }
  };

  // Get database type color
  const getDatabaseTypeColor = (type: string) => {
    switch (type) {
      case 'mysql': return '#00758f';
      case 'postgresql': return '#336791';
      case 'mssql': return '#cc2927';
      default: return '#666';
    }
  };

  // Get column type color
  const getColumnTypeColor = (type: string) => {
    if (type.includes('int') || type.includes('serial')) return 'primary';
    if (type.includes('varchar') || type.includes('text') || type.includes('nvarchar')) return 'secondary';
    if (type.includes('decimal') || type.includes('money')) return 'success';
    if (type.includes('timestamp') || type.includes('datetime')) return 'warning';
    if (type.includes('boolean') || type.includes('bit')) return 'info';
    return 'default';
  };

  // Get column type background color
  const getColumnTypeBgColor = (type: string) => {
    if (type.includes('int') || type.includes('serial')) return '#e3f2fd';
    if (type.includes('varchar') || type.includes('text') || type.includes('nvarchar')) return '#f3e5f5';
    if (type.includes('decimal') || type.includes('money')) return '#e8f5e8';
    if (type.includes('timestamp') || type.includes('datetime')) return '#fff3e0';
    if (type.includes('boolean') || type.includes('bit')) return '#e1f5fe';
    return '#f5f5f5';
  };

  // Get constraint icon
  const getConstraintIcon = (constraints: string[]) => {
    if (constraints.includes('PRIMARY KEY')) return <KeyIcon sx={{ fontSize: 12, color: 'primary.main' }} />;
    if (constraints.includes('FOREIGN KEY')) return <LockIcon sx={{ fontSize: 12, color: 'secondary.main' }} />;
    if (constraints.includes('UNIQUE')) return <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} />;
    return undefined;
  };

  // Get constraint color
  const getConstraintColor = (constraints: string[]) => {
    if (constraints.includes('PRIMARY KEY')) return 'primary';
    if (constraints.includes('FOREIGN KEY')) return 'secondary';
    if (constraints.includes('UNIQUE')) return 'success';
    return 'default';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DatabaseIcon color="primary" />
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          Database Schema
        </Typography>
        <Chip 
          label={config.type.toUpperCase()} 
          size="small" 
          sx={{ 
            fontSize: '0.7rem',
            backgroundColor: getDatabaseTypeColor(config.type),
            color: 'white'
          }} 
        />
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Refresh Schema">
            <IconButton 
              size="small" 
              onClick={loadSchemas}
              disabled={disabled || isLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search schemas, tables, columns..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ fontSize: '0.8rem' }}
      />

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
              Search Results ({searchResults.length})
            </Typography>
            <List dense>
              {searchResults.map((result, index) => (
                <ListItem 
                  key={index}
                  onClick={() => {
                    if (result.type === 'schema') {
                      const schemaIndex = schemas.findIndex(s => s.name === result.schema);
                      if (schemaIndex !== -1) {
                        handleNodeToggle(`schema-${schemaIndex}`);
                      }
                    } else if (result.type === 'table') {
                      const schemaIndex = schemas.findIndex(s => s.name === result.schema);
                      const tableIndex = schemas[schemaIndex]?.tables.findIndex(t => t.name === result.table);
                      if (schemaIndex !== -1 && tableIndex !== -1) {
                        handleNodeToggle(`table-${schemaIndex}-${tableIndex}`);
                      }
                    } else if (result.type === 'column' && result.column) {
                      handleColumnSelect(result.column, result.table!, result.schema);
                    }
                  }}
                >
                  <ListItemIcon>
                    {result.type === 'schema' && <DatabaseIcon sx={{ fontSize: 16 }} />}
                    {result.type === 'table' && <TableIcon sx={{ fontSize: 16 }} />}
                    {result.type === 'column' && <ColumnIcon sx={{ fontSize: 16 }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.type === 'column' ? result.column?.name : result.table || result.schema}
                    secondary={result.type === 'column' ? `${result.schema}.${result.table}` : result.schema}
                    sx={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            Loading database schema...
          </Typography>
        </Box>
      )}

      {/* Schema Tree */}
      {!isLoading && schemas.length > 0 && (
        <Box sx={{ 
          maxHeight: 500, 
          overflow: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: 'grey.50'
        }}>
          {schemas.map((schema, schemaIndex) => (
            <Box key={schemaIndex}>
              {/* Schema Node */}
              <ListItem
                onClick={() => handleNodeToggle(`schema-${schemaIndex}`)}
                onContextMenu={(e) => handleContextMenu(e, `schema-${schemaIndex}`, 'schema')}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemIcon>
                  {schema.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                  <DatabaseIcon sx={{ fontSize: 16, color: 'primary.main', ml: 1 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {schema.name}
                      </Typography>
                      <Badge badgeContent={schema.tables.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                        <Chip 
                          label="tables" 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      </Badge>
                      {schema.loading && <CircularProgress size={12} />}
                      {schema.error && <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, `schema-${schemaIndex}`, 'schema');
                  }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              {/* Tables */}
              <Collapse in={schema.expanded} timeout="auto" unmountOnExit>
                {schema.tables.map((table, tableIndex) => (
                  <Box key={tableIndex} sx={{ ml: 2 }}>
                    {/* Table Node */}
                    <ListItem
                      onClick={() => handleNodeToggle(`table-${schemaIndex}-${tableIndex}`)}
                      onContextMenu={(e) => handleContextMenu(e, `table-${schemaIndex}-${tableIndex}`, 'table')}
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        {table.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        <TableIcon sx={{ fontSize: 14, color: 'secondary.main', ml: 1 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {table.name}
                            </Typography>
                            <Badge badgeContent={table.columns.length} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                              <Chip 
                                label="columns" 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 16 }}
                              />
                            </Badge>
                            {table.loading && <CircularProgress size={10} />}
                            {table.error && <ErrorIcon sx={{ fontSize: 12, color: 'error.main' }} />}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, `table-${schemaIndex}-${tableIndex}`, 'table');
                        }}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>

                    {/* Columns */}
                    <Collapse in={table.expanded} timeout="auto" unmountOnExit>
                      {table.columns.map((column, columnIndex) => (
                        <ListItem
                          key={columnIndex}
                          onClick={() => handleColumnSelect(column, table.name, schema.name)}
                          onContextMenu={(e) => handleContextMenu(e, `column-${schemaIndex}-${tableIndex}-${columnIndex}`, 'column')}
                          sx={{
                            '&:hover': { backgroundColor: 'action.hover' },
                            ml: 2,
                            borderLeft: '2px solid #e0e0e0'
                          }}
                        >
                          <ListItemIcon>
                            <ColumnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                                  {column.name}
                                </Typography>
                                <Chip 
                                  label={column.type} 
                                  size="small" 
                                  color={getColumnTypeColor(column.type) as any}
                                  sx={{ 
                                    fontSize: '0.65rem', 
                                    height: 16,
                                    backgroundColor: getColumnTypeBgColor(column.type)
                                  }}
                                />
                                {!column.nullable && (
                                  <Chip 
                                    label="NOT NULL" 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem', height: 14 }}
                                  />
                                )}
                                {column.constraints?.map((constraint, idx) => (
                                  <Chip 
                                    key={idx}
                                    label={constraint} 
                                    size="small" 
                                    color={getConstraintColor([constraint]) as any}
                                    icon={getConstraintIcon([constraint])}
                                    sx={{ fontSize: '0.6rem', height: 14 }}
                                  />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </Collapse>
                  </Box>
                ))}
              </Collapse>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && schemas.length === 0 && !error && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 3,
          color: 'text.secondary'
        }}>
          <DatabaseIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            No database connection configured
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            Configure your database connection to view schema
          </Typography>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleRefresh}>
          <RefreshIcon sx={{ mr: 1, fontSize: 16 }} />
          Refresh
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>
          <InfoIcon sx={{ mr: 1, fontSize: 16 }} />
          Properties
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SchemaTreeViewer;

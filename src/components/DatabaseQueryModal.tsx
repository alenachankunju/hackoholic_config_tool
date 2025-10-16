import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { DatabaseConfig } from '../types';
import { databaseService } from '../services/databaseService';

interface DatabaseQueryModalProps {
  open: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  disabled?: boolean;
}

interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
  executionTime?: number;
  rowCount?: number;
}

// Helper function to format cell values for better display
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '(null)';
  }
  
  // Format dates
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  
  // Check if it's an ISO date string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleString();
    } catch {
      return value;
    }
  }
  
  // Format numbers with decimals
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  
  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  // Format objects/arrays
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  // Truncate very long strings
  const strValue = String(value);
  if (strValue.length > 100) {
    return strValue.substring(0, 100) + '...';
  }
  
  return strValue;
};

const DatabaseQueryModal: React.FC<DatabaseQueryModalProps> = ({
  open,
  onClose,
  config,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showFullResults, setShowFullResults] = useState(false);

  // Sample queries for different database types
  const getSampleQueries = () => {
    switch (config.type) {
      case 'postgresql':
        return [
          'SELECT * FROM information_schema.tables WHERE table_schema = \'public\';',
          'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = \'public\' ORDER BY table_name, ordinal_position;',
          'SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats LIMIT 10;',
          'SELECT * FROM pg_stat_activity WHERE state = \'active\';',
        ];
      case 'mysql':
        return [
          'SHOW TABLES;',
          'SELECT * FROM information_schema.tables WHERE table_schema = DATABASE();',
          'SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() ORDER BY table_name, ordinal_position;',
          'SHOW PROCESSLIST;',
        ];
      case 'mssql':
        return [
          'SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\';',
          'SELECT * FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_NAME, ORDINAL_POSITION;',
          'SELECT * FROM sys.dm_exec_sessions WHERE is_user_process = 1;',
          'SELECT * FROM sys.dm_exec_requests WHERE status = \'running\';',
        ];
      default:
        return [];
    }
  };

  const sampleQueries = getSampleQueries();

  // Execute query
  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({
        success: false,
        error: 'Please enter a query to execute',
      });
      return;
    }

    setIsExecuting(true);
    setResult(null);

    const startTime = Date.now();

    try {
      // Add to history
      if (!queryHistory.includes(query.trim())) {
        setQueryHistory(prev => [query.trim(), ...prev.slice(0, 9)]); // Keep last 10 queries
      }

      console.log('Executing query:', query);
      const queryResult = await databaseService.executeQuery(config, query);
      const executionTime = Date.now() - startTime;

      console.log('Query result received:', queryResult);
      console.log('Data length:', queryResult.data?.length);
      console.log('First row:', queryResult.data?.[0]);

      const result: QueryResult = {
        success: true,
        data: queryResult.data,
        columns: queryResult.data.length > 0 ? Object.keys(queryResult.data[0]) : [],
        executionTime,
        rowCount: queryResult.rowCount
      };

      console.log('Final result object:', result);
      setResult(result);
      
      // Show full results view when query executes successfully
      if (result.success && result.data && result.data.length > 0) {
        setShowFullResults(true);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setResult({
        success: false,
        error: `Query execution failed: ${error}`,
        executionTime,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Load sample query
  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  // Load from history
  const loadFromHistory = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  // Clear query
  const clearQuery = () => {
    setQuery('');
    setResult(null);
    setShowFullResults(false);
  };

  // Go back to query editor
  const goBackToEditor = () => {
    setShowFullResults(false);
  };

  // Download results as CSV
  const downloadResults = () => {
    if (!result?.data || result.data.length === 0) return;

    const csvContent = [
      result.columns?.join(','),
      ...result.data.map(row => 
        result.columns?.map(col => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setQuery('');
      setResult(null);
    }
  }, [open]);

  // Debug logging
  console.log('DatabaseQueryModal render:', { open, config: config?.host });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: { 
          height: '95vh',
          width: '95vw',
          maxWidth: showFullResults ? '95vw' : '1400px',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon color="primary" />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
            Database Query Editor
          </Typography>
          <Chip 
            label={config.type.toUpperCase()} 
            size="small" 
            color="primary"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: showFullResults ? 1 : 2, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: showFullResults ? 1 : 2,
        overflow: 'auto',
        flex: 1,
        height: 'calc(90vh - 100px)',
        '&::-webkit-scrollbar': {
          width: '12px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#1976d2',
          borderRadius: '6px',
          '&:hover': {
            background: '#1565c0',
          },
        },
      }}>
        {!showFullResults && (
          /* Scroll Indicator */
          <Box sx={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10, 
            backgroundColor: '#e3f2fd', 
            p: 1, 
            borderRadius: 1, 
            mb: 1,
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ 
              fontSize: '0.7rem', 
              color: '#1976d2',
              fontWeight: 'bold'
            }}>
              📜 Scroll down to see all sections: Query Input → Sample Queries → History → Results
            </Typography>
          </Box>
        )}
        {!showFullResults ? (
          <>
            {/* Connection Info */}
            <Card>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
              Connection: {config.host}:{config.port}/{config.database}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              User: {config.username} | Schema: {config.schema || 'default'}
            </Typography>
          </CardContent>
        </Card>

        {/* Query Input */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
            SQL Query
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            disabled={disabled || isExecuting}
            sx={{
              '& .MuiInputBase-input': { 
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              },
              '& .MuiInputLabel-root': { fontSize: '0.8rem' }
            }}
          />
        </Box>

        {/* Sample Queries */}
        {sampleQueries.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                Sample Queries ({sampleQueries.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {sampleQueries.map((sampleQuery, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => loadSampleQuery(sampleQuery)}
                    disabled={disabled || isExecuting}
                    sx={{ 
                      fontSize: '0.7rem',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      height: 'auto',
                      py: 0.5,
                      minHeight: 'auto'
                    }}
                  >
                    {sampleQuery}
                  </Button>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Query History */}
        {queryHistory.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                Query History ({queryHistory.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {queryHistory.map((historyQuery, index) => (
                  <Button
                    key={index}
                    variant="text"
                    size="small"
                    onClick={() => loadFromHistory(historyQuery)}
                    disabled={disabled || isExecuting}
                    sx={{ 
                      fontSize: '0.7rem',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      height: 'auto',
                      py: 0.5,
                      maxHeight: 60,
                      overflow: 'hidden',
                      minHeight: 'auto'
                    }}
                  >
                    {historyQuery.length > 100 ? `${historyQuery.substring(0, 100)}...` : historyQuery}
                  </Button>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Query Actions */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={isExecuting ? <CircularProgress size={16} /> : <PlayIcon />}
            onClick={executeQuery}
            disabled={disabled || isExecuting || !query.trim()}
            sx={{ 
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isExecuting ? 'Executing...' : 'Execute Query'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={clearQuery}
            disabled={disabled || isExecuting}
            sx={{ fontSize: '0.75rem' }}
          >
            Clear
          </Button>
          {result?.success && result.data && result.data.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={downloadResults}
              disabled={disabled}
              sx={{ fontSize: '0.75rem' }}
            >
              Download CSV
            </Button>
          )}
          {result?.success && result.data && result.data.length > 0 && (
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={() => {
                const resultsElement = document.querySelector('[data-testid="query-results"]');
                if (resultsElement) {
                  resultsElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              📊 View Results
            </Button>
          )}
        </Box>

        {/* Query Results */}
        {result && (
          <Card>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {result.success ? (
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                )}
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {result.success ? 'Query Executed Successfully' : 'Query Failed'}
                </Typography>
                {result.executionTime && (
                  <Chip 
                    label={`${result.executionTime}ms`} 
                    size="small" 
                    color={result.success ? 'success' : 'error'}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {result.rowCount !== undefined && (
                  <Chip 
                    label={`${result.rowCount} rows`} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>

              {result.error && (
                <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
                  {result.error}
                </Alert>
              )}

              {result.success && result.data && result.data.length > 0 && (
                <Box data-testid="query-results">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Query Results ({result.data.length} rows)
                    </Typography>
                    {result.data.length > 10 && (
                      <Chip 
                        label="Scroll to see all data" 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                    )}
                  </Box>
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: 350, 
                      overflow: 'auto',
                      border: '2px solid #1976d2',
                      borderRadius: 2,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      '&::-webkit-scrollbar': {
                        width: '12px',
                        height: '12px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '6px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#1976d2',
                        borderRadius: '6px',
                        '&:hover': {
                          background: '#1565c0',
                        },
                      },
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {result.columns?.map((column, index) => (
                            <TableCell 
                              key={index} 
                              sx={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 'bold',
                                backgroundColor: '#f5f5f5',
                                borderBottom: '2px solid #ddd',
                                whiteSpace: 'nowrap',
                                minWidth: 100,
                                maxWidth: 300,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1
                              }}
                            >
                              {column}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.data.slice(0, 100).map((row, rowIndex) => {
                          console.log(`Rendering row ${rowIndex}:`, row);
                          return (
                            <TableRow 
                              key={rowIndex}
                              sx={{
                                '&:nth-of-type(odd)': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                },
                                '&:hover': {
                                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                },
                              }}
                            >
                              {result.columns?.map((column, colIndex) => {
                                console.log(`Rendering cell ${colIndex} (${column}):`, row[column]);
                                return (
                                  <TableCell 
                                    key={colIndex} 
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      minWidth: 100,
                                      maxWidth: 300,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontFamily: 'monospace',
                                      padding: '8px 12px',
                                    }}
                                    title={row[column]?.toString() || ''}
                                  >
                                    {formatCellValue(row[column])}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {result.data.length > 100 && (
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 1, display: 'block' }}>
                      Showing first 100 rows of {result.data.length} total rows
                    </Typography>
                  )}
                  {result.data.length > 0 && (
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem', 
                      color: '#1976d2', 
                      mt: 1, 
                      display: 'block',
                      fontStyle: 'italic'
                    }}>
                      💡 Tip: Use mouse wheel or scrollbar to view all data
                    </Typography>
                  )}
                </Box>
              )}

              {result.success && (!result.data || result.data.length === 0) && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  Query executed successfully with no results.
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        </>
        ) : (
          /* Full Results View */
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Results Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2,
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  Query Results ({result?.data?.length || 0} rows)
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Execution time: {result?.executionTime}ms
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={goBackToEditor}
                  sx={{ 
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                    },
                  }}
                >
                  ← Back to Query Editor
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={downloadResults}
                  disabled={!result?.data || result.data.length === 0}
                  sx={{ fontSize: '0.75rem' }}
                >
                  📥 Download CSV
                </Button>
              </Box>
            </Box>

            {/* Full Results Table */}
            {result?.success && result.data && result.data.length > 0 && (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  border: '2px solid #1976d2',
                  borderRadius: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  '&::-webkit-scrollbar': {
                    width: '12px',
                    height: '12px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#1976d2',
                    borderRadius: '6px',
                    '&:hover': {
                      background: '#1565c0',
                    },
                  },
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {result.columns?.map((column, index) => (
                        <TableCell 
                          key={index} 
                          sx={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold',
                            backgroundColor: '#f5f5f5',
                            borderBottom: '2px solid #ddd',
                            whiteSpace: 'nowrap',
                            minWidth: 120,
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}
                        >
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.data.map((row, rowIndex) => (
                      <TableRow 
                        key={rowIndex}
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          },
                        }}
                      >
                        {result.columns?.map((column, colIndex) => (
                          <TableCell 
                            key={colIndex} 
                            sx={{ 
                              fontSize: '0.8rem',
                              minWidth: 120,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: 'monospace',
                              padding: '8px 12px',
                            }}
                            title={row[column]?.toString() || ''}
                          >
                            {formatCellValue(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {result?.success && (!result.data || result.data.length === 0) && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '200px',
                backgroundColor: '#f5f5f5',
                borderRadius: 1
              }}>
                <Typography variant="body1" sx={{ fontSize: '1rem', color: 'text.secondary' }}>
                  Query executed successfully with no results.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        pt: 0,
        flexShrink: 0
      }}>
        {showFullResults ? (
          <Button
            onClick={goBackToEditor}
            variant="contained"
            size="small"
            sx={{ 
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
              },
            }}
          >
            ← Back to Query Editor
          </Button>
        ) : (
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DatabaseQueryModal;

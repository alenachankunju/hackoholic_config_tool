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

      const result: QueryResult = {
        success: true,
        data: queryResult.data,
        columns: queryResult.data.length > 0 ? Object.keys(queryResult.data[0]) : [],
        executionTime,
        rowCount: queryResult.rowCount
      };

      setResult(result);
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
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

      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            rows={6}
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
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                      py: 1
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
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                      maxHeight: 100,
                      overflow: 'hidden'
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
            sx={{ fontSize: '0.75rem' }}
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
                <Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
                    Query Results
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {result.columns?.map((column, index) => (
                            <TableCell key={index} sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 'bold',
                              backgroundColor: 'grey.100'
                            }}>
                              {column}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.data.slice(0, 100).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {result.columns?.map((column, colIndex) => (
                              <TableCell key={colIndex} sx={{ fontSize: '0.7rem' }}>
                                {row[column]?.toString() || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {result.data.length > 100 && (
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 1, display: 'block' }}>
                      Showing first 100 rows of {result.data.length} total rows
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
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabaseQueryModal;

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
} from '@mui/material';
import { PlayArrow as PlayIcon, PlayArrow as TestIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';
import type { TestResult } from '../types';

const TestingPage: React.FC = () => {
  const { state, addTestResult, clearTestResults, setLoading } = useAppContext();
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setLoading(true);

    // Simulate running tests
    const testCases = [
      { name: 'API Connection Test', delay: 1000 },
      { name: 'Database Connection Test', delay: 1500 },
      { name: 'Field Mapping Test', delay: 800 },
      { name: 'Data Transformation Test', delay: 1200 },
    ];

    for (const testCase of testCases) {
      await new Promise(resolve => setTimeout(resolve, testCase.delay));
      
      const result: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        name: testCase.name,
        status: Math.random() > 0.2 ? 'pass' : 'fail', // 80% pass rate
        message: Math.random() > 0.2 
          ? 'Test completed successfully' 
          : 'Test failed: Connection timeout',
        timestamp: new Date(),
      };

      addTestResult(result);
    }

    setIsRunning(false);
    setLoading(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusCounts = () => {
    const counts = state.testResults.reduce(
      (acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Test Controls and Results in Horizontal Layout */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        height: '100%'
      }}>
        {/* Test Controls */}
        <Box sx={{ 
          flex: '0 0 180px',
          display: 'flex', 
          flexDirection: 'column',
          gap: 1.5
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1
          }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayIcon />}
              onClick={runTests}
              disabled={isRunning || state.isLoading}
              fullWidth
              size="small"
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={clearTestResults}
              disabled={state.testResults.length === 0}
              fullWidth
              size="small"
            >
              Clear Results
            </Button>
          </Box>

          {/* Test Summary */}
          {state.testResults.length > 0 && (
            <Box sx={{ 
              backgroundColor: 'grey.50', 
              p: 1.5, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                Test Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                    Total:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                    {state.testResults.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'success.main' }}>
                    Passed:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.7rem', color: 'success.main' }}>
                    {statusCounts.pass || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'error.main' }}>
                    Failed:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.7rem', color: 'error.main' }}>
                    {statusCounts.fail || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Pending:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {statusCounts.pending || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Test Results */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {state.testResults.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 3,
              color: 'text.secondary'
            }}>
              <TestIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                No Tests Run Yet
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Click "Run Tests" to validate your configuration
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 1.5
            }}>
              {state.testResults.map((result) => (
                <Card key={result.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 1
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {result.name}
                    </Typography>
                    <Chip
                      label={result.status.toUpperCase()}
                      color={getStatusColor(result.status) as any}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  </Box>
                  
                  {result.message && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem', mb: 1 }}
                    >
                      {result.message}
                    </Typography>
                  )}
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.65rem' }}
                  >
                    {result.timestamp.toLocaleString()}
                  </Typography>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TestingPage;

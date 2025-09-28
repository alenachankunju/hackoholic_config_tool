import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import { PlayArrow as PlayIcon, Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';
import type { TestResult } from '../types';
import { testAPIConnection } from '../services/apiTestingService';
import { databaseService } from '../services/databaseService';
import { validateAllMappings } from '../utils/mappingValidation';

const TestingPage: React.FC = () => {
  const { state, addTestResult, clearTestResults, setLoading } = useAppContext();
  const [isRunning, setIsRunning] = useState(false);
  const [isApiConnRunning, setIsApiConnRunning] = useState(false);
  const [isDbConnRunning, setIsDbConnRunning] = useState(false);
  const [isMappingRunning, setIsMappingRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const [apiConnView, setApiConnView] = useState<null | {
    statusCode: number;
    responseTime: number;
    data: any;
    errors: string[];
  }>(null);

  const [dbConnView, setDbConnView] = useState<null | {
    success: boolean;
    error?: string;
  }>(null);

  const [mappingView, setMappingView] = useState<null | {
    status: 'valid' | 'warning' | 'error';
    summary: ReturnType<typeof validateAllMappings>;
  }>(null);

  const [expandApi, setExpandApi] = useState(false);
  const [expandDb, setExpandDb] = useState(false);
  const [expandMapping, setExpandMapping] = useState(false);

  type SectionStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';
  const [apiStatus, setApiStatus] = useState<SectionStatus>('idle');
  const [dbStatus, setDbStatus] = useState<SectionStatus>('idle');
  const [mappingStatus, setMappingStatus] = useState<SectionStatus>('idle');

	const overallStatusColor = (status: SectionStatus) => {
		switch (status) {
			case 'success': return 'success';
			case 'warning': return 'warning';
			case 'error': return 'error';
			default: return 'default';
		}
	};

  const runTests = async () => {
    setIsRunning(true);
    setLoading(true);
    setProgress(0);
    setApiStatus('idle');
    setDbStatus('idle');
    setMappingStatus('idle');

    await runApiConnectionTest();
    setProgress(33);
    await runDbConnectionTest(true);
    setProgress(66);
    await runMappingValidationTest(true);
    setProgress(100);

    setIsRunning(false);
    setLoading(false);
  };

	const runApiConnectionTest = async () => {
    if (!state.apiConfig) {
      const result: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'API Connection Test',
        status: 'fail',
        message: 'API configuration missing',
        timestamp: new Date(),
      };
      addTestResult(result);
			setApiStatus('error');
      return;
    }

		setIsApiConnRunning(true);
		setApiStatus('running');
    try {
      const r = await testAPIConnection(state.apiConfig, { timeout: 10000, retries: 2 });
      setApiConnView({
        statusCode: r.statusCode,
        responseTime: Math.round(r.responseTime),
        data: r.data,
        errors: r.errors,
      });

      const result: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'API Connection Test',
        status: r.success ? 'pass' : 'fail',
        message: r.success
          ? `HTTP ${r.statusCode}, ${Math.round(r.responseTime)}ms`
          : (r.errors?.join('\n') || 'Unknown error'),
        timestamp: new Date(),
      };
      addTestResult(result);
			setApiStatus(r.success ? 'success' : 'error');
    } catch (e: any) {
      const result: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'API Connection Test',
        status: 'fail',
        message: e?.message || 'Unknown error',
        timestamp: new Date(),
      };
      addTestResult(result);
			setApiStatus('error');
    } finally {
      setIsApiConnRunning(false);
    }
  };

	const runDbConnectionTest = async (partOfRunAll?: boolean) => {
		if (!state.databaseConfig) {
			if (!partOfRunAll) {
				const result: TestResult = {
					id: Math.random().toString(36).substr(2, 9),
					name: 'Database Connection Test',
					status: 'fail',
					message: 'Database configuration missing',
					timestamp: new Date(),
				};
				addTestResult(result);
			}
			setDbStatus('error');
			return;
		}

		setIsDbConnRunning(true);
		setDbStatus('running');
		try {
			const ok = await databaseService.testConnection(state.databaseConfig);
			setDbConnView({ success: ok });
			if (!partOfRunAll) {
				const result: TestResult = {
					id: Math.random().toString(36).substr(2, 9),
					name: 'Database Connection Test',
					status: ok ? 'pass' : 'fail',
					message: ok ? 'Connection successful' : 'Connection failed',
					timestamp: new Date(),
				};
				addTestResult(result);
			}
			setDbStatus(ok ? 'success' : 'error');
		} catch (e: any) {
			setDbConnView({ success: false, error: e?.message });
			if (!partOfRunAll) {
				const result: TestResult = {
					id: Math.random().toString(36).substr(2, 9),
					name: 'Database Connection Test',
					status: 'fail',
					message: e?.message || 'Unknown error',
					timestamp: new Date(),
				};
				addTestResult(result);
			}
			setDbStatus('error');
		} finally {
			setIsDbConnRunning(false);
		}
	};

	const runMappingValidationTest = async (partOfRunAll?: boolean) => {
		setIsMappingRunning(true);
		setMappingStatus('running');
		try {
			const summary = validateAllMappings(state.fieldMappings || []);
			setMappingView({ status: summary.status, summary });
			if (!partOfRunAll) {
				const result: TestResult = {
					id: Math.random().toString(36).substr(2, 9),
					name: 'Mapping Validation Test',
					status: summary.status === 'valid' ? 'pass' : (summary.status === 'warning' ? 'pass' : 'fail'),
					message: `Status: ${summary.status}, Score: ${summary.overallScore}`,
					timestamp: new Date(),
				};
				addTestResult(result);
			}
			setMappingStatus(summary.status === 'valid' ? 'success' : summary.status === 'warning' ? 'warning' : 'error');
		} catch (e: any) {
			if (!partOfRunAll) {
				const result: TestResult = {
					id: Math.random().toString(36).substr(2, 9),
					name: 'Mapping Validation Test',
					status: 'fail',
					message: e?.message || 'Unknown error',
					timestamp: new Date(),
				};
				addTestResult(result);
			}
			setMappingStatus('error');
		} finally {
			setIsMappingRunning(false);
		}
	};

	const exportResults = () => {
		const blob = new Blob([JSON.stringify(state.testResults, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `test_results_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

  // Removed getStatusColor since result cards are no longer shown

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
			{/* Header controls */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
				<Button
					variant="contained"
					color="primary"
					startIcon={<PlayIcon />}
					onClick={runTests}
					disabled={isRunning || state.isLoading}
					size="small"
				>
					{isRunning ? 'Running All...' : 'Run All Tests'}
				</Button>
				<Button
					variant="outlined"
					startIcon={<DownloadIcon />}
					onClick={exportResults}
					size="small"
				>
					Export Results
				</Button>
				<Box sx={{ flex: 1 }} />
			</Box>

			{isRunning && (
				<Box sx={{ mb: 1 }}>
					<LinearProgress variant="determinate" value={progress} />
				</Box>
			)}

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
              variant="outlined"
              startIcon={<PlayIcon />}
              onClick={runApiConnectionTest}
              disabled={isApiConnRunning}
              fullWidth
              size="small"
            >
              {isApiConnRunning ? 'Testing API...' : 'API Connection Test'}
            </Button>
				<Button
					variant="outlined"
					startIcon={<PlayIcon />}
					onClick={() => runDbConnectionTest(false)}
					disabled={isDbConnRunning}
					fullWidth
					size="small"
				>
					{isDbConnRunning ? 'Testing DB...' : 'Database Connection Test'}
				</Button>
				<Button
					variant="outlined"
					startIcon={<PlayIcon />}
					onClick={() => runMappingValidationTest(false)}
					disabled={isMappingRunning}
					fullWidth
					size="small"
				>
					{isMappingRunning ? 'Validating Mapping...' : 'Mapping Validation Test'}
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
				{/* API Section */}
				<Card variant="outlined" sx={{ mb: 1.5 }}>
					<CardContent sx={{ p: 1.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
							<Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
								API Connection Test
							</Typography>
							<Chip label={apiStatus.toUpperCase()} color={overallStatusColor(apiStatus) as any} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
							<Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
								<Button variant="outlined" size="small" onClick={runApiConnectionTest} disabled={isApiConnRunning}>
									{isApiConnRunning ? 'Running...' : 'Run'}
								</Button>
								<IconButton size="small" onClick={() => setExpandApi(v => !v)}>
									<ExpandMoreIcon sx={{ fontSize: 18, transform: expandApi ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
								</IconButton>
							</Box>
						</Box>
						<Collapse in={expandApi} timeout="auto" unmountOnExit>
							{apiConnView && (
								<Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
										<Chip label={`Status ${apiConnView.statusCode}`} size="small" color={apiConnView.statusCode >= 200 && apiConnView.statusCode < 300 ? 'success' : 'error'} sx={{ fontSize: '0.65rem', height: 18 }} />
										<Chip label={`${apiConnView.responseTime}ms`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
									</Box>
									{apiConnView.errors && apiConnView.errors.length > 0 && (
										<Typography variant="body2" color="error" sx={{ fontSize: '0.75rem', mb: 1 }}>
											{apiConnView.errors.join(' | ')}
										</Typography>
									)}
									<Box sx={{ maxHeight: 220, overflow: 'auto', backgroundColor: 'grey.50', p: 1, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
										<pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
											{JSON.stringify(apiConnView.data, null, 2)}
										</pre>
									</Box>
								</Box>
							)}
						</Collapse>
					</CardContent>
				</Card>

				{/* Database Section */}
				<Card variant="outlined" sx={{ mb: 1.5 }}>
					<CardContent sx={{ p: 1.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
							<Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
								Database Connection Test
							</Typography>
							<Chip label={dbStatus.toUpperCase()} color={overallStatusColor(dbStatus) as any} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
							<Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
								<Button variant="outlined" size="small" onClick={() => runDbConnectionTest(false)} disabled={isDbConnRunning}>
									{isDbConnRunning ? 'Running...' : 'Run'}
								</Button>
								<IconButton size="small" onClick={() => setExpandDb(v => !v)}>
									<ExpandMoreIcon sx={{ fontSize: 18, transform: expandDb ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
								</IconButton>
							</Box>
						</Box>
						<Collapse in={expandDb} timeout="auto" unmountOnExit>
							{dbConnView && (
								<Box>
									<Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>
										{dbConnView.success ? 'Connection successful' : (dbConnView.error || 'Connection failed')}
									</Typography>
								</Box>
							)}
						</Collapse>
					</CardContent>
				</Card>

				{/* Mapping Section */}
				<Card variant="outlined" sx={{ mb: 1.5 }}>
					<CardContent sx={{ p: 1.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
							<Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
								Mapping Validation Test
							</Typography>
							<Chip label={mappingStatus.toUpperCase()} color={overallStatusColor(mappingStatus) as any} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
							<Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
								<Button variant="outlined" size="small" onClick={() => runMappingValidationTest(false)} disabled={isMappingRunning}>
									{isMappingRunning ? 'Running...' : 'Run'}
								</Button>
								<IconButton size="small" onClick={() => setExpandMapping(v => !v)}>
									<ExpandMoreIcon sx={{ fontSize: 18, transform: expandMapping ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
								</IconButton>
							</Box>
						</Box>
						<Collapse in={expandMapping} timeout="auto" unmountOnExit>
							{mappingView && (
								<Box>
									<Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>
										Status: {mappingView.summary.status}, Score: {mappingView.summary.overallScore}
									</Typography>
									{mappingView.summary.errors.length > 0 && (
										<Box sx={{ mb: 1 }}>
											<Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'error.main' }}>Errors</Typography>
											<Box component="ul" sx={{ m: 0, pl: 2 }}>
												{mappingView.summary.errors.map((e, i) => (
													<li key={i} style={{ fontSize: '0.75rem' }}>{e}</li>
												))}
											</Box>
										</Box>
									)}
									{mappingView.summary.warnings.length > 0 && (
										<Box sx={{ mb: 1 }}>
											<Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'warning.main' }}>Warnings</Typography>
											<Box component="ul" sx={{ m: 0, pl: 2 }}>
												{mappingView.summary.warnings.map((w, i) => (
													<li key={i} style={{ fontSize: '0.75rem' }}>{w}</li>
												))}
											</Box>
										</Box>
									)}
									{mappingView.summary.suggestions.length > 0 && (
										<Box>
											<Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Suggestions</Typography>
											<Box component="ul" sx={{ m: 0, pl: 2 }}>
												{mappingView.summary.suggestions.map((s, i) => (
													<li key={i} style={{ fontSize: '0.75rem' }}>{s}</li>
												))}
											</Box>
										</Box>
									)}
								</Box>
							)}
						</Collapse>
					</CardContent>
				</Card>
          {/* Results cards removed per request */}
        </Box>
      </Box>
    </Box>
  );
};

export default TestingPage;

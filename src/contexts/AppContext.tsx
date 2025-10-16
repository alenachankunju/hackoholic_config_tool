import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { 
  ApiConfig, 
  DatabaseConfig, 
  MappingConfig, 
  TestResult, 
  FieldMapping,
  AppState,
  AppAction
} from '../types';

// Initial State
const initialState: AppState = {
  apiConfig: null,
  databaseConfig: null,
  mappingConfig: null,
  fieldMappings: [],
  testResults: [],
  isLoading: false,
  error: null,
  isAuthenticated: false,
  user: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_API_CONFIG':
      return { ...state, apiConfig: action.payload, error: null };
    case 'SET_DATABASE_CONFIG':
      return { ...state, databaseConfig: action.payload, error: null };
    case 'SET_MAPPING_CONFIG':
      return { ...state, mappingConfig: action.payload, error: null };
    case 'SET_FIELD_MAPPINGS':
      return { ...state, fieldMappings: action.payload, error: null };
    case 'ADD_TEST_RESULT':
      return { ...state, testResults: [...state.testResults, action.payload] };
    case 'CLEAR_TEST_RESULTS':
      return { ...state, testResults: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'RESET_STATE':
      return initialState;
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    default:
      return state;
  }
};

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setApiConfig: (config: ApiConfig) => void;
  setDatabaseConfig: (config: DatabaseConfig) => void;
  setMappingConfig: (config: MappingConfig) => void;
  setFieldMappings: (mappings: FieldMapping[]) => void;
  addTestResult: (result: TestResult) => void;
  clearTestResults: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  login: (username: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    // Check for existing authentication in localStorage
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    if (storedAuth === 'true' && storedUser) {
      return { ...initial, isAuthenticated: true, user: storedUser };
    }
    return initial;
  });

  // Helper functions
  const setApiConfig = (config: ApiConfig) => {
    dispatch({ type: 'SET_API_CONFIG', payload: config });
  };

  const setDatabaseConfig = (config: DatabaseConfig) => {
    dispatch({ type: 'SET_DATABASE_CONFIG', payload: config });
  };

  const setMappingConfig = (config: MappingConfig) => {
    dispatch({ type: 'SET_MAPPING_CONFIG', payload: config });
  };

  const setFieldMappings = (mappings: FieldMapping[]) => {
    dispatch({ type: 'SET_FIELD_MAPPINGS', payload: mappings });
  };

  const addTestResult = (result: TestResult) => {
    dispatch({ type: 'ADD_TEST_RESULT', payload: result });
  };

  const clearTestResults = () => {
    dispatch({ type: 'CLEAR_TEST_RESULTS' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const login = (username: string) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', username);
    dispatch({ type: 'LOGIN', payload: username });
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const value: AppContextType = {
    state,
    dispatch,
    setApiConfig,
    setDatabaseConfig,
    setMappingConfig,
    setFieldMappings,
    addTestResult,
    clearTestResults,
    setLoading,
    setError,
    resetState,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

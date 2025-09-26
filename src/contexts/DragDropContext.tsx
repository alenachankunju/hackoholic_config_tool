import React, { createContext, useContext, useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { DatabaseColumn } from '../types';

// Drag and Drop Types
export interface DraggedField {
  id: string;
  name: string;
  type: string;
  source: 'api' | 'database';
  nullable?: boolean;
  constraints?: string[];
  schema?: string;
  table?: string;
}

export interface DropResult {
  field: DraggedField;
  targetId: string;
  position?: number;
}

export interface DragDropContextType {
  draggedField: DraggedField | null;
  setDraggedField: (field: DraggedField | null) => void;
  onFieldDrop: (result: DropResult) => void;
  onFieldDragStart: (field: DraggedField) => void;
  onFieldDragEnd: () => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const useDragDropContext = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDropContext must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: React.ReactNode;
  onFieldDrop?: (result: DropResult) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ 
  children, 
  onFieldDrop: externalOnFieldDrop 
}) => {
  const [draggedField, setDraggedField] = useState<DraggedField | null>(null);

  const handleFieldDrop = useCallback((result: DropResult) => {
    if (externalOnFieldDrop) {
      externalOnFieldDrop(result);
    }
    setDraggedField(null);
  }, [externalOnFieldDrop]);

  const handleFieldDragStart = useCallback((field: DraggedField) => {
    setDraggedField(field);
  }, []);

  const handleFieldDragEnd = useCallback(() => {
    setDraggedField(null);
  }, []);

  const contextValue: DragDropContextType = {
    draggedField,
    setDraggedField,
    onFieldDrop: handleFieldDrop,
    onFieldDragStart: handleFieldDragStart,
    onFieldDragEnd: handleFieldDragEnd,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DragDropContext.Provider value={contextValue}>
        {children}
      </DragDropContext.Provider>
    </DndProvider>
  );
};

// Utility function to convert DatabaseColumn to DraggedField
export const convertToDraggedField = (
  column: DatabaseColumn, 
  source: 'api' | 'database',
  schema?: string,
  table?: string
): DraggedField => ({
  id: `${source}-${schema || 'default'}-${table || 'unknown'}-${column.name}`,
  name: column.name,
  type: column.type,
  source,
  nullable: column.nullable,
  constraints: column.constraints,
  schema,
  table,
});

// Utility function to create API field
export const createApiField = (
  name: string,
  type: string,
  nullable: boolean = true
): DraggedField => ({
  id: `api-field-${name}`,
  name,
  type,
  source: 'api',
  nullable,
  constraints: [],
});


import React from 'react';
import { useDrop } from 'react-dnd';
import {
  Box,
  Typography,
  Paper,
  Fade,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Api as ApiIcon,
  Storage as DatabaseIcon,
} from '@mui/icons-material';
import type { DraggedField, DropResult } from '../contexts/DragDropContext';

interface DropZoneProps {
  id: string;
  title: string;
  description?: string;
  acceptedTypes?: string[];
  onDrop: (result: DropResult) => void;
  children?: React.ReactNode;
  maxItems?: number;
  currentItems?: number;
  disabled?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
  onClear?: () => void;
  variant?: 'default' | 'api' | 'database';
}

const DropZone: React.FC<DropZoneProps> = ({
  id,
  title,
  description,
  acceptedTypes = ['field'],
  onDrop,
  children,
  maxItems,
  currentItems = 0,
  disabled = false,
  showAddButton = true,
  onAddClick,
  onClear,
  variant = 'default',
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: acceptedTypes,
    drop: (item: DraggedField) => {
      if (!disabled && (!maxItems || currentItems < maxItems)) {
        onDrop({
          field: item,
          targetId: id,
          position: currentItems,
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'api':
        return {
          borderColor: 'primary.main',
          backgroundColor: 'primary.light',
          '&:hover': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          },
        };
      case 'database':
        return {
          borderColor: 'secondary.main',
          backgroundColor: 'secondary.light',
          '&:hover': {
            backgroundColor: 'secondary.main',
            color: 'secondary.contrastText',
          },
        };
      default:
        return {
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        };
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'api':
        return <ApiIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
      case 'database':
        return <DatabaseIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
      default:
        return <AddIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
    }
  };

  const isAtCapacity = maxItems && currentItems >= maxItems;
  const canAcceptDrop = canDrop && !disabled && !isAtCapacity;

  return (
    <Paper
      ref={(node) => {
        if (drop) {
          drop(node);
        }
      }}
      elevation={isOver && canAcceptDrop ? 8 : 2}
      sx={{
        minHeight: 120,
        border: '2px dashed',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        ...(isOver && canAcceptDrop && {
          borderColor: 'primary.main',
          backgroundColor: 'primary.light',
        }),
        ...(isOver && !canAcceptDrop && {
          borderColor: 'error.main',
          backgroundColor: 'error.light',
        }),
        ...(!isOver && {
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }),
        ...getVariantStyles(),
        ...(disabled && {
          opacity: 0.5,
          cursor: 'not-allowed',
        }),
        ...(isAtCapacity && {
          borderColor: 'warning.main',
          backgroundColor: 'warning.light',
        }),
      }}
    >
      {/* Drop Overlay */}
      {isOver && (
        <Fade in={isOver}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: canAcceptDrop ? 'primary.main' : 'error.main',
              opacity: 0.1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          />
        </Fade>
      )}

      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getVariantIcon()}
          <Box>
            <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Item Count */}
          {maxItems && (
            <Chip
              label={`${currentItems}/${maxItems}`}
              size="small"
              color={isAtCapacity ? 'warning' : 'default'}
              sx={{ fontSize: '0.7rem' }}
            />
          )}

          {/* Add Button */}
          {showAddButton && onAddClick && !disabled && (
            <Tooltip title="Add field manually">
              <IconButton size="small" onClick={onAddClick}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Clear Button */}
          {onClear && currentItems > 0 && (
            <Tooltip title="Clear all fields">
              <IconButton size="small" onClick={onClear}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, pt: 0, position: 'relative', zIndex: 2 }}>
        {children ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {children}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
              textAlign: 'center',
            }}
          >
            {isAtCapacity ? (
              <>
                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                  Maximum capacity reached
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Remove some fields to add more
                </Typography>
              </>
            ) : disabled ? (
              <>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Drop zone disabled
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  This drop zone is currently disabled
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {isOver && canAcceptDrop 
                    ? 'Drop field here' 
                    : 'Drag and drop fields here'
                  }
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {isOver && !canAcceptDrop 
                    ? 'Cannot drop here' 
                    : 'Or click the + button to add manually'
                  }
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Drop Indicator */}
      {isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px solid',
            borderColor: canAcceptDrop ? 'primary.main' : 'error.main',
            borderRadius: 1,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
    </Paper>
  );
};

export default DropZone;

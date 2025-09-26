import React from 'react';
import { useDrag } from 'react-dnd';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Badge,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Api as ApiIcon,
  Storage as DatabaseIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { DraggedField } from '../contexts/DragDropContext';

interface DraggableFieldProps {
  field: DraggedField;
  onDragStart?: (field: DraggedField) => void;
  onDragEnd?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  onDragStart,
  onDragEnd,
  disabled = false,
  compact = false,
}) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'field',
    item: () => {
      onDragStart?.(field);
      return field;
    },
    end: () => {
      onDragEnd?.();
    },
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Get field type color
  const getFieldTypeColor = (type: string) => {
    if (type.includes('int') || type.includes('serial')) return 'primary';
    if (type.includes('varchar') || type.includes('text') || type.includes('nvarchar')) return 'secondary';
    if (type.includes('decimal') || type.includes('money')) return 'success';
    if (type.includes('timestamp') || type.includes('datetime')) return 'warning';
    if (type.includes('boolean') || type.includes('bit')) return 'info';
    return 'default';
  };

  // Get field type background color
  const getFieldTypeBgColor = (type: string) => {
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
    <Card
      ref={(node) => {
        if (preview) {
          preview(node);
        }
      }}
      sx={{
        cursor: disabled ? 'not-allowed' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg)' : 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: isDragging ? 'rotate(5deg)' : 'translateY(-2px)',
          boxShadow: isDragging ? 2 : 4,
        },
        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
        border: isDragging ? '2px dashed' : '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        ...(compact && {
          minHeight: 'auto',
          '& .MuiCardContent-root': {
            padding: 1,
          },
        }),
      }}
    >
      <CardContent sx={{ p: compact ? 1 : 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Drag Handle */}
          <Box
            ref={(node) => {
              if (drag && node) {
                drag(node as any);
              }
            }}
            sx={{
              cursor: disabled ? 'not-allowed' : 'grab',
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <DragIcon sx={{ fontSize: 16 }} />
          </Box>

          {/* Source Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {field.source === 'api' ? (
              <ApiIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            ) : (
              <DatabaseIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
            )}
          </Box>

          {/* Field Name */}
          <Typography
            variant={compact ? 'caption' : 'body2'}
            sx={{
              fontWeight: 'bold',
              fontSize: compact ? '0.7rem' : '0.8rem',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {field.name}
          </Typography>

          {/* Field Type */}
          <Chip
            label={field.type}
            size="small"
            color={getFieldTypeColor(field.type) as any}
            sx={{
              fontSize: compact ? '0.6rem' : '0.7rem',
              height: compact ? 16 : 20,
              backgroundColor: getFieldTypeBgColor(field.type),
            }}
          />

          {/* Constraints */}
          {field.constraints && field.constraints.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {field.constraints.slice(0, 2).map((constraint, index) => (
                <Chip
                  key={index}
                  label={constraint}
                  size="small"
                  color={getConstraintColor([constraint]) as any}
                  icon={getConstraintIcon([constraint])}
                  sx={{
                    fontSize: '0.6rem',
                    height: 14,
                    '& .MuiChip-icon': {
                      fontSize: 10,
                    },
                  }}
                />
              ))}
              {field.constraints.length > 2 && (
                <Badge
                  badgeContent={`+${field.constraints.length - 2}`}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.5rem',
                      height: 12,
                      minWidth: 12,
                    },
                  }}
                >
                  <Chip
                    label="..."
                    size="small"
                    sx={{
                      fontSize: '0.6rem',
                      height: 14,
                      minWidth: 20,
                    }}
                  />
                </Badge>
              )}
            </Box>
          )}

          {/* Nullable Indicator */}
          {!field.nullable && (
            <Chip
              label="NOT NULL"
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.6rem',
                height: 14,
                color: 'error.main',
                borderColor: 'error.main',
              }}
            />
          )}
        </Box>

        {/* Additional Info (only in non-compact mode) */}
        {!compact && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {field.schema && field.table && (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                {field.schema}.{field.table}
              </Typography>
            )}
            <Chip
              label={field.source.toUpperCase()}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.6rem',
                height: 16,
                color: field.source === 'api' ? 'primary.main' : 'secondary.main',
                borderColor: field.source === 'api' ? 'primary.main' : 'secondary.main',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DraggableField;

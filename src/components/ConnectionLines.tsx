import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getCompatibilityResult } from '../utils/typeCompatibility';
import type { FieldMapping } from '../types';

interface ConnectionLinesProps {
  mappings: FieldMapping[];
  sourceRefs: React.RefObject<HTMLDivElement | null>[];
  targetRefs: React.RefObject<HTMLDivElement | null>[];
  containerDimensions: { width: number; height: number };
  onMappingClick?: (mapping: FieldMapping) => void;
  onMappingDelete?: (mappingId: string) => void;
  disabled?: boolean;
}

interface ConnectionPoint {
  x: number;
  y: number;
  id: string;
  type: 'source' | 'target';
}

interface ConnectionLine {
  id: string;
  source: ConnectionPoint;
  target: ConnectionPoint;
  mapping: FieldMapping;
  compatibility: 'compatible' | 'warning' | 'error';
  color: string;
  path: string;
  animatedPath: string;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  mappings,
  sourceRefs,
  targetRefs,
  containerDimensions,
  onMappingClick,
  onMappingDelete,
  disabled = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Calculate connection points from refs
  const calculateConnectionPoints = useCallback((): ConnectionPoint[] => {
    const points: ConnectionPoint[] = [];

    // Calculate source points
    sourceRefs.forEach((ref, index) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const containerRect = svgRef.current?.getBoundingClientRect();
        if (containerRect) {
          points.push({
            x: rect.right - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
            id: `source-${index}`,
            type: 'source',
          });
        }
      }
    });

    // Calculate target points
    targetRefs.forEach((ref, index) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const containerRect = svgRef.current?.getBoundingClientRect();
        if (containerRect) {
          points.push({
            x: rect.left - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
            id: `target-${index}`,
            type: 'target',
          });
        }
      }
    });

    return points;
  }, [sourceRefs, targetRefs]);

  // Calculate SVG path for connection line
  const calculateLinePath = useCallback((source: ConnectionPoint, target: ConnectionPoint): string => {
    const startX = source.x;
    const startY = source.y;
    const endX = target.x;
    const endY = target.y;

    // Calculate control points for smooth curve
    const controlPoint1X = startX + (endX - startX) * 0.3;
    const controlPoint1Y = startY;
    const controlPoint2X = startX + (endX - startX) * 0.7;
    const controlPoint2Y = endY;

    return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  }, []);

  // Calculate animated path for flow indicators
  const calculateAnimatedPath = useCallback((source: ConnectionPoint, target: ConnectionPoint): string => {
    const startX = source.x;
    const startY = source.y;
    const endX = target.x;
    const endY = target.y;

    // Create a slightly offset path for animation
    const offset = 2;
    const controlPoint1X = startX + (endX - startX) * 0.3;
    const controlPoint1Y = startY + offset;
    const controlPoint2X = startX + (endX - startX) * 0.7;
    const controlPoint2Y = endY + offset;

    return `M ${startX} ${startY + offset} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY + offset}`;
  }, []);

  // Get compatibility color
  const getCompatibilityColor = (compatibility: 'compatible' | 'warning' | 'error'): string => {
    switch (compatibility) {
      case 'compatible':
        return '#4caf50'; // Green
      case 'warning':
        return '#ff9800'; // Orange
      case 'error':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Gray
    }
  };

  // Update connections when mappings or refs change
  const updateConnections = useCallback(() => {
    const points = calculateConnectionPoints();
    const newConnections: ConnectionLine[] = [];

    mappings.forEach((mapping) => {
      // Find source and target points
      const sourcePoint = points.find(p => p.id === `source-${mapping.sourceField.id}`);
      const targetPoint = points.find(p => p.id === `target-${mapping.targetField.id}`);

      if (sourcePoint && targetPoint) {
        const compatibilityResult = getCompatibilityResult(
          mapping.sourceField.type,
          mapping.targetField.type
        );

        const connection: ConnectionLine = {
          id: mapping.id,
          source: sourcePoint,
          target: targetPoint,
          mapping,
          compatibility: compatibilityResult.level,
          color: getCompatibilityColor(compatibilityResult.level),
          path: calculateLinePath(sourcePoint, targetPoint),
          animatedPath: calculateAnimatedPath(sourcePoint, targetPoint),
        };

        newConnections.push(connection);
      }
    });

    setConnections(newConnections);
  }, [mappings, calculateConnectionPoints, calculateLinePath, calculateAnimatedPath]);

  // Animate flow indicators
  const animateFlow = useCallback(() => {
    setAnimationFrame(prev => prev + 1);
    requestAnimationFrame(animateFlow);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateConnections();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateConnections]);

  // Update connections when dependencies change
  useEffect(() => {
    updateConnections();
  }, [updateConnections]);

  // Start animation loop
  useEffect(() => {
    const animationId = requestAnimationFrame(animateFlow);
    return () => cancelAnimationFrame(animationId);
  }, [animateFlow]);

  // Handle connection click
  const handleConnectionClick = (connection: ConnectionLine) => {
    if (onMappingClick) {
      onMappingClick(connection.mapping);
    }
  };

  // Handle connection delete
  const handleConnectionDelete = (connectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onMappingDelete) {
      onMappingDelete(connectionId);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* SVG Container */}
      <svg
        ref={svgRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Connection Lines */}
        {connections.map((connection) => (
          <g key={connection.id}>
            {/* Main connection line */}
            <path
              d={connection.path}
              stroke={connection.color}
              strokeWidth={hoveredConnection === connection.id ? 4 : 2}
              fill="none"
              strokeDasharray={connection.compatibility === 'error' ? '5,5' : 'none'}
              style={{
                cursor: 'pointer',
                pointerEvents: 'all',
                transition: 'all 0.2s ease-in-out',
                filter: hoveredConnection === connection.id ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none',
              }}
              onClick={() => handleConnectionClick(connection)}
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            />

            {/* Animated flow indicator */}
            <path
              d={connection.animatedPath}
              stroke={connection.color}
              strokeWidth={1}
              fill="none"
              opacity={0.6}
              style={{
                strokeDasharray: '10,5',
                strokeDashoffset: -(animationFrame * 2) % 15,
                animation: 'flow 2s linear infinite',
              }}
            />

            {/* Connection endpoints */}
            <circle
              cx={connection.source.x}
              cy={connection.source.y}
              r={4}
              fill={connection.color}
              stroke="white"
              strokeWidth={2}
            />
            <circle
              cx={connection.target.x}
              cy={connection.target.y}
              r={4}
              fill={connection.color}
              stroke="white"
              strokeWidth={2}
            />

            {/* Compatibility indicator */}
            <circle
              cx={connection.source.x + (connection.target.x - connection.source.x) * 0.5}
              cy={connection.source.y + (connection.target.y - connection.source.y) * 0.5}
              r={8}
              fill={connection.color}
              stroke="white"
              strokeWidth={2}
              style={{
                cursor: 'pointer',
                pointerEvents: 'all',
              }}
              onClick={() => handleConnectionClick(connection)}
            >
              <title>{connection.compatibility.toUpperCase()}</title>
            </circle>
          </g>
        ))}
      </svg>

      {/* Hover Tooltip */}
      {hoveredConnection && (
        <Tooltip
          open={true}
          title={
            <Box sx={{ p: 1 }}>
              {(() => {
                const connection = connections.find(c => c.id === hoveredConnection);
                if (!connection) return null;

                const compatibilityResult = getCompatibilityResult(
                  connection.mapping.sourceField.type,
                  connection.mapping.targetField.type
                );

                return (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
                      Field Mapping
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {connection.mapping.sourceField.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        →
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {connection.mapping.targetField.name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={compatibilityResult.level.toUpperCase()}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 16,
                          backgroundColor: compatibilityResult.color,
                          color: 'white'
                        }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {connection.mapping.sourceField.type} → {connection.mapping.targetField.type}
                      </Typography>
                    </Box>

                    {compatibilityResult.suggestions.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          💡 {compatibilityResult.suggestions[0]}
                        </Typography>
                      </Box>
                    )}

                    {!disabled && (
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleConnectionDelete(connection.id, e)}
                          sx={{ color: 'error.main' }}
                        >
                          <ErrorIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                );
              })()}
            </Box>
          }
          placement="top"
          arrow
        >
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1 }} />
        </Tooltip>
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes flow {
            0% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: -15;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default ConnectionLines;

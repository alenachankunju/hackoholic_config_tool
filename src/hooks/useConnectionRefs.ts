import { useRef, useCallback, useState, useEffect } from 'react';

interface ConnectionRefs {
  sourceRefs: React.RefObject<HTMLDivElement | null>[];
  targetRefs: React.RefObject<HTMLDivElement | null>[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  registerSourceRef: (id: string) => React.RefObject<HTMLDivElement | null>;
  registerTargetRef: (id: string) => React.RefObject<HTMLDivElement | null>;
  getContainerDimensions: () => { width: number; height: number };
  updateDimensions: () => void;
}

export const useConnectionRefs = (): ConnectionRefs => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sourceRefs, setSourceRefs] = useState<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());
  const [targetRefs, setTargetRefs] = useState<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  // Register a source ref
  const registerSourceRef = useCallback((id: string): React.RefObject<HTMLDivElement | null> => {
    const ref = { current: null as HTMLDivElement | null };
    setSourceRefs(prev => new Map(prev.set(id, ref)));
    return ref;
  }, []);

  // Register a target ref
  const registerTargetRef = useCallback((id: string): React.RefObject<HTMLDivElement | null> => {
    const ref = { current: null as HTMLDivElement | null };
    setTargetRefs(prev => new Map(prev.set(id, ref)));
    return ref;
  }, []);

  // Get container dimensions
  const getContainerDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    return { width: 0, height: 0 };
  }, []);

  // Update dimensions
  const updateDimensions = useCallback(() => {
    // Dimensions are calculated on demand
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  // Initial dimensions
  useEffect(() => {
    updateDimensions();
  }, [updateDimensions]);

  return {
    sourceRefs: Array.from(sourceRefs.values()),
    targetRefs: Array.from(targetRefs.values()),
    containerRef,
    registerSourceRef,
    registerTargetRef,
    getContainerDimensions,
    updateDimensions,
  };
};

export default useConnectionRefs;

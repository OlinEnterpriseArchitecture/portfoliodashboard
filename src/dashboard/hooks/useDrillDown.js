import { useState, useRef, useCallback, useEffect } from 'react';

export function useDrillDown() {
  const ctrlHeld = useRef(false);

  useEffect(() => {
    const down = e => { if (e.key === 'Control' || e.key === 'Meta') ctrlHeld.current = true;  };
    const up   = e => { if (e.key === 'Control' || e.key === 'Meta') ctrlHeld.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  const [drillDown,             setDrillDown]             = useState(() => new Set());
  const [selectedProjectIds,    setSelectedProjectIds]    = useState(() => new Set());
  const [matrixVisibleProjects, setMatrixVisibleProjects] = useState(null);

  const handleDrillDown = useCallback((key, multiOverride) => {
    const multi = multiOverride ?? ctrlHeld.current;
    setDrillDown(prev => {
        const next = new Set(prev);
        if (multi) {
        if (next.has(key)) next.delete(key); else next.add(key);
        } else {
        if (next.size === 1 && next.has(key)) next.clear();
        else { next.clear(); next.add(key); }
        }
        return next;
    });
    if (!multi) setSelectedProjectIds(new Set());
    setMatrixVisibleProjects(null);
    }, []);

  const handleRowSelect = useCallback((projectId) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (ctrlHeld.current) {
        if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
      } else {
        if (next.size === 1 && next.has(projectId)) next.clear();
        else { next.clear(); next.add(projectId); }
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids) => {
    setSelectedProjectIds(new Set(ids));
  }, []);

  const handleClearFilter = useCallback(() => {
    setDrillDown(new Set());
    setMatrixVisibleProjects(null);
    setSelectedProjectIds(new Set());
  }, []);

  const resetForPageChange = useCallback(() => {
    setDrillDown(new Set());
    setSelectedProjectIds(new Set());
    setMatrixVisibleProjects(null);
  }, []);

  const isDrillActive =
    drillDown.size > 0 || matrixVisibleProjects != null || selectedProjectIds.size > 0;

  return {
    drillDown,
    setDrillDown,
    selectedProjectIds,
    setSelectedProjectIds,
    matrixVisibleProjects,
    setMatrixVisibleProjects,
    handleDrillDown,
    handleRowSelect,
    handleSelectAll,
    handleClearFilter,
    resetForPageChange,
    isDrillActive,
  };
}
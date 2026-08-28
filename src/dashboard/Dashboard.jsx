import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveGridLayout } from '../rgl';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  X, Plus, Shield, Pencil, Check, RotateCcw, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useDrillDown }      from './hooks/useDrillDown';
import { useEditLayout }     from './hooks/useEditLayout';
import { useScrollbarTheme } from './hooks/useScrollbarTheme';

// ── Sub-components ────────────────────────────────────────────────────────────
import DashboardTopbar    from './DashboardTopbar';
import DashboardSidebar   from './DashboardSidebar';
import ComingSoon         from './ComingSoon';
import CardPickerModal    from './CardPickerModal';
import AdminPasswordModal from './AdminPasswordModal';

// ── Cards ─────────────────────────────────────────────────────────────────────
import TotalProjectsCard  from '../components/cards/TotalProjectsCard';
import ActiveAlertsCard   from '../components/cards/ActiveAlertsCard';
import PipelineCard       from '../components/cards/PipelineCard';
import ProjectTypeCard    from '../components/cards/ProjectTypeCard';
import HealthCard         from '../components/cards/HealthCard';
import HealthDimCard      from '../components/cards/HealthDimCard';
import MatrixCard         from '../components/cards/MatrixCard';
import BudgetSnapshotCard from '../components/cards/BudgetSnapshotCard';
import FilterBar          from '../components/FilterBar';
import DeptProjectsCard   from '../components/cards/DeptProjectsCard';

// ── Data ──────────────────────────────────────────────────────────────────────
import { usePortfolioData } from '../data/usePortfolioData';
import { useBudgetData }    from '../data/useBudgetData';
import { computeKPIs }      from '../data/kpi';
import {
  DRILL_FILTERS, GLOBAL_FILTER_DEFS, applyGlobalFilters,
} from '../data/filters';
import { parseHealth } from '../data/parseUtils';

// ── Dashboard constants ───────────────────────────────────────────────────────
import {
  ALL_CARD_IDS, DRILL_KEY_LABELS, NAV_GROUPS, PAGE_META,
} from './dashboardConstants';
import { INITIAL_LAYOUTS, loadPrefs, savePrefs } from './dashboardPrefs';

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {

  // ── Global filter state ───────────────────────────────────────────────────
  // Guard both key names: savePrefs historically used 'hiddenGlobalFilters',
  // buildDefaultsJson / dashboardDefaults.json uses 'defaultHiddenGlobalFilters'
  const [activeGlobalFilters, setActiveGlobalFilters] = useState(() => {
    const prefs = loadPrefs();
    const hiddenFilters =
      prefs.defaultHiddenGlobalFilters ??   // JSON-file / new savePrefs path
      prefs.hiddenGlobalFilters        ??   // legacy localStorage path
      [];
    return [
      ...(prefs.defaultGlobalFilters ?? []),
      ...hiddenFilters.map(f => ({ ...f, hidden: true })),
    ];
  });

  // ── Save filter defaults (called from FilterBar's admin long-press) ────────
  // Key aligned to 'defaultHiddenGlobalFilters' so savePrefs and buildDefaultsJson
  // always write the same key — loadPrefs will find it on next load
  // ── Save filter defaults (called from FilterBar's admin long-press) ────────
  const handleSaveFilterDefaults = useCallback(({ adminOnlyFilters, regularFilters }) => {
    const currentPrefs = loadPrefs();   // read current prefs as a plain object
    savePrefs({
      ...currentPrefs,
      defaultGlobalFilters:       regularFilters.map(({ hidden: _hidden, ...f }) => f),
      defaultHiddenGlobalFilters: adminOnlyFilters.map(({ hidden: _hidden, ...f }) => f),
    });
  }, []);

  // ── Edit layout hook ──────────────────────────────────────────────────────
  const {
    layouts,                setLayouts,
    rowHeight,
    visibleCardIds,
    pipelineVisibleStages,  setPipelineVisibleStages,
    healthDimView,          setHealthDimView,
    isEditing,
    showCardPicker,         setShowCardPicker,
    showAdminModal,         setShowAdminModal,
    handleStartEdit,
    handleSaveLayout,
    handleCancelEdit,
    handleResetLayout,
    handleSaveAsDefault,
    handleDeleteCard,
    handleAddCard,
    cancelEditForPageChange,
  } = useEditLayout({
    activeGlobalFilters,
    onResetGlobalFilters: setActiveGlobalFilters,
  });

  // ── Drill-down hook ───────────────────────────────────────────────────────
  const {
    drillDown,
    selectedProjectIds,
    matrixVisibleProjects,  setMatrixVisibleProjects,
    handleDrillDown,
    handleRowSelect,
    handleSelectAll,
    handleClearFilter,
    resetForPageChange,
    isDrillActive,
  } = useDrillDown();

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(true);
  useScrollbarTheme(dark);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [active, setActive] = useState('overview');

  // ── Sidebar state ─────────────────────────────────────────────────────────
  const [pinned,    setPinned]    = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverTimer = useRef(null);

  const showFull    = pinned || hoverOpen;
  const isOverlay   = !pinned && hoverOpen;
  const flowWidth   = pinned ? 220 : 58;

  const onEnter      = () => { clearTimeout(hoverTimer.current); if (!pinned) setHoverOpen(true); };
  const onLeave      = () => { if (!pinned) hoverTimer.current = setTimeout(() => setHoverOpen(false), 200); };
  const handleToggle = () => { if (pinned) { setPinned(false); setHoverOpen(false); } else setPinned(true); };

  // ── Grid width tracking ───────────────────────────────────────────────────
  const [gridWidth, setGridWidth] = useState(800);
  const gridRoRef = useRef(null);

  const gridContainerRef = useCallback((el) => {
    if (gridRoRef.current) {
      gridRoRef.current.disconnect();
      gridRoRef.current = null;
    }
    if (!el) return;
    setGridWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width));
    ro.observe(el);
    gridRoRef.current = ro;
  }, []);

  // ── Page-change effects ───────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (active !== 'overview' && isEditing) cancelEditForPageChange();
  }, [active]);

  useEffect(() => {
    if (active !== 'overview') resetForPageChange();
  }, [active, resetForPageChange]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    healthByDim, healthByDept,
    projects: allProjects,
    KPI: baseKPI,
    lastUpdated,
  } = usePortfolioData();

  const { data: budgetData, lastUpdated: budgetLastUpdated } = useBudgetData();

  // ── Formatted last-updated ────────────────────────────────────────────────
  const formattedLastUpdated = useMemo(() => {
    const candidates = [lastUpdated, budgetLastUpdated].filter(Boolean).map(s => new Date(s));
    if (!candidates.length) return null;
    const d    = new Date(Math.max(...candidates));
    const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `Last updated: ${date} · ${time}`;
  }, [lastUpdated, budgetLastUpdated]);

  // ── Dynamic filter options (enum fields) ──────────────────────────────────
  const dynamicOptions = useMemo(() => {
    const enumDefs = GLOBAL_FILTER_DEFS.filter(d => d.type === 'enum');
    const result   = {};
    enumDefs.forEach(def => {
      result[def.fieldKey] = [
        ...new Set((allProjects ?? []).map(p => p[def.fieldKey]).filter(Boolean))
      ].sort();
    });
    return result;
  }, [allProjects]);

  // ── Filtered projects ─────────────────────────────────────────────────────
  const globalFilteredProjects = useMemo(
    () => applyGlobalFilters(allProjects ?? [], activeGlobalFilters),
    [allProjects, activeGlobalFilters],
  );

  const filteredProjects = useMemo(() => {
    if (!drillDown.size) return globalFilteredProjects;

    const pairKeys   = [...drillDown].filter(k => k.startsWith('pair-'));
    const deptKeys   = [...drillDown].filter(k => k.startsWith('dept-'));
    const healthKeys = [...drillDown].filter(k => k.startsWith('health-'));
    const otherKeys  = [...drillDown].filter(k =>
      !k.startsWith('dept-') &&
      !k.startsWith('health-') &&
      !k.startsWith('pair-'),
    );

    return globalFilteredProjects.filter(p => {
      if (pairKeys.length > 0) {
        const dept = p['IT Department'] || 'Unknown';
        const raw  = parseHealth(p['Overall Health']);
        const hk   = (raw === 'onTrack' || raw === 'atRisk' || raw === 'offTrack') ? raw : 'atRisk';
        if (!pairKeys.some(k => k === `pair-${dept}||${hk}`)) return false;
      }
      if (deptKeys.length > 0) {
        if (!deptKeys.some(k => p['IT Department'] === k.slice(5))) return false;
      }
      if (healthKeys.length > 0) {
        const raw    = parseHealth(p['Overall Health']);
        const mapped = (raw === 'onTrack' || raw === 'atRisk' || raw === 'offTrack') ? raw : 'atRisk';
        if (!healthKeys.some(k => k.slice(7) === mapped)) return false;
      }
      return otherKeys.every(k => DRILL_FILTERS[k]?.(p) ?? true);
    });
  }, [drillDown, globalFilteredProjects]);

  // ── Effective projects ────────────────────────────────────────────────────
  const effectiveProjects = useMemo(() => {
    if (selectedProjectIds.size > 0) {
      return filteredProjects.filter(p =>
        selectedProjectIds.has(String(p['Project ID'] ?? ''))
      );
    }
    return filteredProjects;
  }, [selectedProjectIds, filteredProjects]);

  // ── KPI ───────────────────────────────────────────────────────────────────
  const KPI = useMemo(() => {
    if (selectedProjectIds.size > 0) {
      const pool     = matrixVisibleProjects ?? filteredProjects;
      const selected = pool.filter(p => selectedProjectIds.has(String(p['Project ID'] ?? '')));
      return computeKPIs(selected);
    }
    const source = matrixVisibleProjects ?? filteredProjects;
    return (drillDown.size > 0 || matrixVisibleProjects != null || activeGlobalFilters.some(f => f.values.length > 0))
      ? computeKPIs(source)
      : (baseKPI ?? computeKPIs(source));
  }, [drillDown, matrixVisibleProjects, filteredProjects, baseKPI, selectedProjectIds, activeGlobalFilters]);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const c = {
    bg:      dark ? '#0f172a' : '#f1f5f9',
    sidebar: dark ? '#1e293b' : '#ffffff',
    topbar:  dark ? '#1e293b' : '#ffffff',
    border:  dark ? '#334155' : '#e2e8f0',
    text:    dark ? '#f1f5f9' : '#0f172a',
    sub:     dark ? '#94a3b8' : '#64748b',
    hover:   dark ? '#334155' : '#f1f5f9',
    card:    dark ? '#1e293b' : '#ffffff',
    track:   dark ? '#334155' : '#e2e8f0',
    ph:      dark ? '#475569' : '#cbd5e1',
  };

  const cardShadow = dark
    ? '0 2px 14px rgba(0,0,0,0.55),0 1px 4px rgba(0,0,0,0.4)'
    : '0 2px 14px rgba(15,23,42,0.08),0 1px 4px rgba(15,23,42,0.04)';

  const overlayShadow = dark
    ? '4px 0 28px rgba(0,0,0,0.55)'
    : '4px 0 28px rgba(15,23,42,0.18)';

  const gridCard = {
    background: c.card, borderRadius: 12, boxShadow: cardShadow,
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', transition: 'outline-color 0.2s',
    outline: isEditing
      ? `2px dashed ${dark ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.4)'}`
      : '2px dashed transparent',
  };

  // ── Layout helpers ────────────────────────────────────────────────────────
  const meta = PAGE_META[active] ?? PAGE_META.overview;

  const visibleLayoutItems = (layouts.lg || INITIAL_LAYOUTS.lg).filter(
    l => visibleCardIds.includes(l.i)
  );
  const displayLayouts = isEditing
    ? { lg: visibleLayoutItems }
    : { lg: visibleLayoutItems.map(item => ({ ...item, static: true })) };

  // ── Drill label / count ───────────────────────────────────────────────────
  const drillLabelSummary =
    selectedProjectIds.size > 0
      ? `${selectedProjectIds.size} row${selectedProjectIds.size !== 1 ? 's' : ''} selected`
      : drillDown.size > 0
        ? [...drillDown].map(k => {
            if (k.startsWith('pair-')) {
              const [dept, hk] = k.slice(5).split('||');
              const healthLabel = hk === 'onTrack'  ? 'On Track'
                                : hk === 'atRisk'   ? 'At Risk'
                                : hk === 'offTrack' ? 'Off Track'
                                : hk;
              return `${dept} / ${healthLabel}`;
            }
            if (k.startsWith('dept-'))   return k.slice(5);
            if (k.startsWith('health-')) {
              const hk = k.slice(7);
              return hk === 'onTrack'  ? 'On Track'
                  : hk === 'atRisk'   ? 'At Risk'
                  : hk === 'offTrack' ? 'Off Track'
                  : hk;
            }
            return DRILL_KEY_LABELS[k] ?? k;
          }).join(' + ')
        : matrixVisibleProjects != null
          ? 'Table filter'
          : null;

  const drillFilteredCount =
    selectedProjectIds.size > 0
      ? selectedProjectIds.size
      : matrixVisibleProjects?.length ?? filteredProjects.length;

  // ── Card renderer ─────────────────────────────────────────────────────────
  const cardProps   = { c, dark, isEditing, KPI };
  const activeDrill = drillDown.size > 0 ? drillDown : null;
  const dimSignal   = activeDrill ?? (selectedProjectIds.size > 0 ? selectedProjectIds : null);

  const renderCardContent = (id) => {
    switch (id) {
      case 'total-projects':
        return <TotalProjectsCard {...cardProps} drillDown={activeDrill} onDrillDown={handleDrillDown} />;
      case 'active-alerts':
        return <ActiveAlertsCard {...cardProps} drillDown={dimSignal} onDrillDown={handleDrillDown} />;
      case 'pipeline':
        return (
          <PipelineCard
            {...cardProps}
            visibleStages={pipelineVisibleStages}
            onStagesChange={setPipelineVisibleStages}
            drillDown={dimSignal}
            onDrillDown={handleDrillDown}
          />
        );
      case 'project-type':
        return <ProjectTypeCard {...cardProps} drillDown={activeDrill} onDrillDown={handleDrillDown} />;
      case 'health':
        return <HealthCard {...cardProps} />;
      case 'health-dim':
        return (
          <HealthDimCard
            {...cardProps}
            healthByDim={healthByDim}
            healthByDept={healthByDept}
            view={healthDimView}
            onViewChange={setHealthDimView}
          />
        );
      case 'budget-snapshot':
        return <BudgetSnapshotCard {...cardProps} budgetData={budgetData} lastUpdated={budgetLastUpdated}/>;
      case 'matrix':
        return (
          <MatrixCard
            {...cardProps}
            projects={filteredProjects}
            drillDown={selectedProjectIds.size > 0 ? selectedProjectIds : null}
            onDrillDown={handleRowSelect}
            onSelectAll={handleSelectAll}
            onVisibleProjectsChange={setMatrixVisibleProjects}
          />
        );
      case 'dept-projects':
        return (
          <DeptProjectsCard
            {...cardProps}
            projects={effectiveProjects}
            allProjects={globalFilteredProjects}
            drillDown={activeDrill}
            onDrillDown={handleDrillDown}
          />
        );
      default: return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', height: '100vh', background: c.bg,
      fontFamily: "'Inter',system-ui,sans-serif", fontSize: 14, overflow: 'hidden',
    }}>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', width: flowWidth, flexShrink: 0, zIndex: 300,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <DashboardSidebar
          dark={dark}
          c={c}
          pinned={pinned}
          showFull={showFull}
          isOverlay={isOverlay}
          overlayShadow={overlayShadow}
          active={active}
          setActive={setActive}
          onEnter={onEnter}
          onLeave={onLeave}
          onToggle={handleToggle}
          setPinned={setPinned}
        />
      </div>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        <DashboardTopbar
          dark={dark}
          c={c}
          meta={meta}
          active={active}
          formattedLastUpdated={formattedLastUpdated}
          onToggleDark={() => setDark(d => !d)}
        />

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            >
              {active === 'overview' ? (
                <>
                  {/* ── Overview sub-header ──────────────────────────────── */}
                  <div style={{
                    padding: '10px 20px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: c.bg,
                  }}>
                    {/* Project count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: c.text }}>Overview</span>
                    </div>

                    <FilterBar
                      dark={dark}
                      c={c}
                      activeFilters={activeGlobalFilters}
                      onFiltersChange={setActiveGlobalFilters}
                      dynamicOptions={dynamicOptions}
                      onSaveDefaults={handleSaveFilterDefaults}
                      projects={allProjects ?? []}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

                      {/* Drill chip */}
                      <AnimatePresence>
                        {isDrillActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '3px 6px 3px 9px', borderRadius: 99,
                              background: dark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.06)',
                              border: `1px dashed ${c.border}`,
                              fontSize: 11, color: c.sub, whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: c.text }}>{drillLabelSummary}</span>
                            <span>· {drillFilteredCount}</span>
                            <button
                              onClick={handleClearFilter}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: c.ph, padding: 0,
                                display: 'flex', alignItems: 'center', marginLeft: 1,
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = c.text}
                              onMouseLeave={e => e.currentTarget.style.color = c.ph}
                            >
                              <X size={9} strokeWidth={2.5} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Editing badge */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 99,
                              background: dark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                              border: `1px solid ${dark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}`,
                              fontSize: 11, fontWeight: 600, color: '#3b82f6', flexShrink: 0,
                            }}
                          >
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: '#3b82f6', display: 'inline-block',
                            }} />
                            Editing layout
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Edit / Save / Cancel / Reset */}
                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <motion.div key="edit-actions"
                            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.15 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <motion.button whileTap={{ scale: 0.93 }} onClick={handleSaveLayout}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8,
                                border: 'none', background: '#3b82f6',
                                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                            >
                              <Check size={13} /> Save
                            </motion.button>

                            <motion.button whileTap={{ scale: 0.93 }} onClick={handleCancelEdit}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8,
                                border: `1px solid ${c.border}`, background: 'transparent',
                                color: c.sub, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = c.hover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <X size={13} /> Cancel
                            </motion.button>

                            <motion.button whileTap={{ scale: 0.93 }} onClick={handleResetLayout}
                              title="Reset to the current default config and clear your saved layout"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8,
                                border: `1px solid ${c.border}`, background: 'transparent',
                                color: c.sub, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = c.hover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <RotateCcw size={13} />
                            </motion.button>
                          </motion.div>
                        ) : (
                          <motion.button key="edit-btn"
                            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.15 }}
                            whileTap={{ scale: 0.93 }} onClick={handleStartEdit}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 12px', borderRadius: 8,
                              border: `1px solid ${c.border}`, background: 'transparent',
                              color: c.sub, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = c.hover; e.currentTarget.style.color = c.text; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.sub; }}
                          >
                            <Pencil size={13} /> Edit Layout
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ── Grid ─────────────────────────────────────────────── */}
                  <div ref={gridContainerRef} style={{ padding: '0 20px 40px' }}>
                    <ResponsiveGridLayout
                      key={isEditing ? 'rgl-editing' : 'rgl-locked'}
                      width={gridWidth}
                      layouts={displayLayouts}
                      onLayoutChange={(layout) => { if (isEditing) setLayouts({ lg: layout }); }}
                      breakpoints={{ lg: 0 }}
                      cols={{ lg: 24 }}
                      rowHeight={rowHeight}
                      margin={[8, 8]}
                      containerPadding={[0, 0]}
                      isDraggable={isEditing}
                      isResizable={isEditing}
                      draggableHandle={isEditing ? '.drag-handle' : undefined}
                      compactType="vertical"
                      resizeHandles={['se']}
                    >
                      {ALL_CARD_IDS.filter(id => visibleCardIds.includes(id)).map(id => (
                        <div key={id} style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <div style={gridCard}>
                            {renderCardContent(id)}
                          </div>
                          <AnimatePresence>
                            {isEditing && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.15 }}
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteCard(id)}
                                title="Remove card"
                                style={{
                                  position: 'absolute', top: 7, right: 7, zIndex: 20,
                                  width: 26, height: 26, borderRadius: 7,
                                  background: dark ? 'rgba(239,68,68,0.82)' : 'rgba(220,38,38,0.88)',
                                  backdropFilter: 'blur(6px)',
                                  border: 'none', color: '#fff', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </ResponsiveGridLayout>
                  </div>
                </>
              ) : (
                <ComingSoon active={active} dark={dark} c={c} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Floating FABs ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditing && active === 'overview' && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit   ={{ opacity: 0, scale: 0.75, y: 12 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={() => setShowCardPicker(true)}
              title="Add a card"
              style={{
                position: 'fixed', bottom: 92, right: 28, zIndex: 500,
                width: 52, height: 52, borderRadius: '50%', background: '#3b82f6',
                border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(59,130,246,0.55), 0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Plus size={22} strokeWidth={2.5} />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit   ={{ opacity: 0, scale: 0.75, y: 12 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={() => setShowAdminModal(true)}
              title="Save as global default (Admin)"
              style={{
                position: 'fixed', bottom: 28, right: 28, zIndex: 500,
                width: 52, height: 52, borderRadius: '50%',
                background: dark ? 'rgba(124,58,237,0.92)' : '#7c3aed',
                border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(124,58,237,0.5), 0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Shield size={20} strokeWidth={2} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCardPicker && (
          <CardPickerModal
            dark={dark}
            c={c}
            visibleCardIds={visibleCardIds}
            onAdd={handleAddCard}
            onClose={() => setShowCardPicker(false)}
            KPI={KPI}
            healthByDim={healthByDim}
            healthByDept={healthByDept}
            budgetData={budgetData}
            projects={allProjects}
            pipelineVisibleStages={pipelineVisibleStages}
            healthDimView={healthDimView}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminModal && (
          <AdminPasswordModal
            dark={dark}
            c={c}
            onConfirm={handleSaveAsDefault}
            onClose={() => setShowAdminModal(false)}
            activeFilters={activeGlobalFilters}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
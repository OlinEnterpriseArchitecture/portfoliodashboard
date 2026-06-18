import { useState, useRef, useCallback, useEffect } from 'react';
import DASHBOARD_DEFAULTS from '../../config/dashboardDefaults.json';
import { ALL_CARD_IDS, computeResponsiveRowHeight } from '../dashboardConstants';
import {
  ADMIN_KEY, PREF_KEY, INITIAL_LAYOUTS,
  loadPrefs, savePrefs, loadAdminDefaults, saveAdminDefaults, downloadJson,
} from '../dashboardPrefs';

export function useEditLayout({ activeGlobalFilters, onResetGlobalFilters }) {
  const [layouts, setLayouts] = useState(
    () => loadPrefs().layouts || INITIAL_LAYOUTS
  );
  const [autoSize, setAutoSize] = useState(
    () => !loadPrefs().hasUserOverride
  );
  const [rowHeight, setRowHeight] = useState(() => {
    const p = loadPrefs();
    return p.hasUserOverride ? p.rowHeight : computeResponsiveRowHeight();
  });
  const [visibleCardIds, setVisibleCardIds] = useState(
    () => loadPrefs().visibleCardIds || ALL_CARD_IDS
  );
  const [pipelineVisibleStages, setPipelineVisibleStages] = useState(
    () => loadPrefs().pipelineVisibleStages ?? DASHBOARD_DEFAULTS.pipelineVisibleStages
  );
  const [healthDimView, setHealthDimView] = useState(
    () => loadPrefs().healthDimView ?? DASHBOARD_DEFAULTS.healthDimView
  );
  const [isEditing,      setIsEditing]      = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const preEditLayouts        = useRef(null);
  const preEditPipelineStages = useRef(null);
  const preEditHealthDimView  = useRef(null);
  const preEditVisibleCardIds = useRef(null);

  // ── Auto-resize rowHeight on window resize ────────────────────────────────
  useEffect(() => {
    if (!autoSize) return;
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setRowHeight(computeResponsiveRowHeight()), 150);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [autoSize]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartEdit = useCallback(() => {
    preEditLayouts.current        = JSON.parse(JSON.stringify(layouts));
    preEditPipelineStages.current = [...pipelineVisibleStages];
    preEditHealthDimView.current  = healthDimView;
    preEditVisibleCardIds.current = [...visibleCardIds];
    setIsEditing(true);
  }, [layouts, pipelineVisibleStages, healthDimView, visibleCardIds]);

  const handleSaveLayout = useCallback(() => {
    const adminDefs = loadAdminDefaults();
    const version   = adminDefs?.defaultsVersion ?? DASHBOARD_DEFAULTS.defaultsVersion;
    savePrefs({
      rowHeight, layouts, hasUserOverride: true,
      pipelineVisibleStages, healthDimView, visibleCardIds,
      defaultsVersion: version,
      // ── FIX ──────────────────────────────────────────────────────────────
      // Previously wrote adminDefs?.defaultGlobalFilters ?? [] here, which
      // always discarded the user's active filter state and reverted to the
      // admin default on every save. Now we persist what the user actually has.
      defaultGlobalFilters: activeGlobalFilters,
    });
    setAutoSize(false);
    preEditLayouts.current        = null;
    preEditPipelineStages.current = null;
    preEditHealthDimView.current  = null;
    preEditVisibleCardIds.current = null;
    setIsEditing(false);
    setShowCardPicker(false);
  }, [rowHeight, layouts, pipelineVisibleStages, healthDimView, visibleCardIds, activeGlobalFilters]);

  const handleCancelEdit = useCallback(() => {
    if (preEditLayouts.current)               setLayouts(preEditLayouts.current);
    if (preEditPipelineStages.current)        setPipelineVisibleStages(preEditPipelineStages.current);
    if (preEditHealthDimView.current != null) setHealthDimView(preEditHealthDimView.current);
    if (preEditVisibleCardIds.current)        setVisibleCardIds(preEditVisibleCardIds.current);
    preEditLayouts.current        = null;
    preEditPipelineStages.current = null;
    preEditHealthDimView.current  = null;
    preEditVisibleCardIds.current = null;
    setIsEditing(false);
    setShowCardPicker(false);
  }, []);

  const handleResetLayout = useCallback(() => {
    try { localStorage.removeItem(PREF_KEY);  } catch {}
    try { localStorage.removeItem(ADMIN_KEY); } catch {}
    setLayouts(INITIAL_LAYOUTS);
    setVisibleCardIds(DASHBOARD_DEFAULTS.visibleCardIds);
    setPipelineVisibleStages(DASHBOARD_DEFAULTS.pipelineVisibleStages);
    setHealthDimView(DASHBOARD_DEFAULTS.healthDimView);
    onResetGlobalFilters(DASHBOARD_DEFAULTS.defaultGlobalFilters ?? []);
    setAutoSize(true);
    setRowHeight(computeResponsiveRowHeight());
    preEditLayouts.current        = null;
    preEditPipelineStages.current = null;
    preEditHealthDimView.current  = null;
    preEditVisibleCardIds.current = null;
    setIsEditing(false);
    setShowCardPicker(false);
  }, [onResetGlobalFilters]);

  const handleSaveAsDefault = useCallback((saveOptions) => {
    const existing = loadAdminDefaults() ?? {};
    const prefs = {
      hasUserOverride:       true,
      rowHeight,
      layouts:               saveOptions.cardLayout     ? layouts               : (existing.layouts               ?? INITIAL_LAYOUTS),
      visibleCardIds:        saveOptions.cardLayout     ? visibleCardIds        : (existing.visibleCardIds        ?? DASHBOARD_DEFAULTS.visibleCardIds),
      pipelineVisibleStages: saveOptions.widgetSettings ? pipelineVisibleStages : (existing.pipelineVisibleStages ?? DASHBOARD_DEFAULTS.pipelineVisibleStages),
      healthDimView:         saveOptions.widgetSettings ? healthDimView         : (existing.healthDimView         ?? DASHBOARD_DEFAULTS.healthDimView),
      defaultGlobalFilters:  saveOptions.globalFilters  ? activeGlobalFilters   : (existing.defaultGlobalFilters  ?? []),
    };
    const newVersion = saveAdminDefaults(prefs);
    savePrefs({ ...prefs, defaultsVersion: newVersion });
    downloadJson({
      ...DASHBOARD_DEFAULTS,
      defaultsVersion:       newVersion,
      rowHeightDefault:      prefs.rowHeight,
      pipelineVisibleStages: prefs.pipelineVisibleStages,
      healthDimView:         prefs.healthDimView,
      visibleCardIds:        prefs.visibleCardIds,
      initialLayouts:        { lg: prefs.layouts?.lg ?? INITIAL_LAYOUTS.lg },
      defaultGlobalFilters:  prefs.defaultGlobalFilters,
    });
    setAutoSize(false);
    preEditLayouts.current        = null;
    preEditPipelineStages.current = null;
    preEditHealthDimView.current  = null;
    preEditVisibleCardIds.current = null;
    setIsEditing(false);
    setShowCardPicker(false);
  }, [rowHeight, layouts, visibleCardIds, pipelineVisibleStages, healthDimView, activeGlobalFilters]);

  const handleDeleteCard = useCallback((cardId) => {
    setVisibleCardIds(prev => prev.filter(id => id !== cardId));
    setLayouts(prev => ({ ...prev, lg: (prev.lg || []).filter(item => item.i !== cardId) }));
  }, []);

  const handleAddCard = useCallback((cardId) => {
    if (visibleCardIds.includes(cardId)) return;
    setVisibleCardIds(prev => [...prev, cardId]);
    const defaultItem = INITIAL_LAYOUTS.lg.find(l => l.i === cardId)
      ?? { i: cardId, x: 0, y: 999, w: 8, h: 4, minW: 1, minH: 1 };
    setLayouts(prev => ({ ...prev, lg: [...(prev.lg || []), { ...defaultItem, i: cardId }] }));
  }, [visibleCardIds]);

  // Called by Dashboard when navigating away from overview while editing
  const cancelEditForPageChange = useCallback(() => {
    if (preEditLayouts.current)               setLayouts(preEditLayouts.current);
    if (preEditPipelineStages.current)        setPipelineVisibleStages(preEditPipelineStages.current);
    if (preEditHealthDimView.current != null) setHealthDimView(preEditHealthDimView.current);
    if (preEditVisibleCardIds.current)        setVisibleCardIds(preEditVisibleCardIds.current);
    preEditLayouts.current        = null;
    preEditPipelineStages.current = null;
    preEditHealthDimView.current  = null;
    preEditVisibleCardIds.current = null;
    setIsEditing(false);
    setShowCardPicker(false);
    setShowAdminModal(false);
  }, []);

  return {
    layouts,                setLayouts,
    autoSize,               setAutoSize,
    rowHeight,              setRowHeight,
    visibleCardIds,         setVisibleCardIds,
    pipelineVisibleStages,  setPipelineVisibleStages,
    healthDimView,          setHealthDimView,
    isEditing,              setIsEditing,
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
  };
}
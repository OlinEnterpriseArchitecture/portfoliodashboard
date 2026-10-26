import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronRight, ChevronLeft, Search, Download, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLOBAL_FILTER_DEFS, HEALTH_OPTIONS, STAGE_OPTIONS, TYPE_OPTIONS, STATUS_OPTIONS, STATE_OPTIONS, NULL_SENTINEL } from '../data/filters';
import { parseHealth, parseStage, parseType, parseStatus, parseState } from '../data/parseUtils';
import { buildDefaultsJson, downloadJson } from '../dashboard/dashboardPrefs';

const LONG_PRESS_MS = 750;

export default function FilterBar({ dark, c, activeFilters, onFiltersChange, dynamicOptions, onSaveDefaults, projects = [] }) {
  const [pickerOpen, setPickerOpen]           = useState(false);
  const [editingId, setEditingId]             = useState(null);
  const [step, setStep]                       = useState('categories');
  const [selectedDef, setSelectedDef]         = useState(null);
  const [pendingValues, setPendingValues]     = useState([]);
  const [search, setSearch]                   = useState('');
  const [hiddenUnlocked, setHiddenUnlocked]   = useState(false);
  const [isHiddenSession, setIsHiddenSession] = useState(false);
  const [saveFlash, setSaveFlash]             = useState(false);

  const containerRef  = useRef(null);
  const pressStartRef = useRef(null);
  const rafRef        = useRef(null);
  const isPressing    = useRef(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isHidden = (f) => f.hidden === true;

  // ── Field-level hidden set ────────────────────────────────────────────────
  const hiddenFieldKeys = new Set(
    activeFilters.filter(f => isHidden(f)).map(f => f.fieldKey)
  );

  // Only show chips for filters that actually have values
  const regularChips = activeFilters.filter(f => !isHidden(f) && f.values.length > 0);
  const hiddenChips  = hiddenUnlocked
    ? activeFilters.filter(f => isHidden(f) && f.values.length > 0)
    : [];

  // ── Outside-click ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closePicker();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Picker helpers ────────────────────────────────────────────────────────
  const closePicker = () => {
    setPickerOpen(false); setEditingId(null); setStep('categories');
    setSelectedDef(null); setPendingValues([]); setSearch('');
    setIsHiddenSession(false);
    setHiddenUnlocked(false);
  };

  const openPickerNew = (hiddenSession = false) => {
    if (pickerOpen && step === 'categories' && !editingId) { closePicker(); return; }
    setIsHiddenSession(hiddenSession);
    setEditingId(null); setStep('categories'); setSelectedDef(null);
    setPendingValues([]); setSearch(''); setPickerOpen(true);
  };

  const openEdit = (filter) => {
    const def = GLOBAL_FILTER_DEFS.find(d => d.fieldKey === filter.fieldKey);
    if (!def) return;
    setIsHiddenSession(isHidden(filter));
    setEditingId(filter.id); setSelectedDef(def);
    setPendingValues([...filter.values]); setStep('options');
    setSearch(''); setPickerOpen(true);
  };

  const selectCategory = (def) => {
    setSelectedDef(def); setPendingValues([]); setStep('options'); setSearch('');
    if (def.adminOnly) setIsHiddenSession(true);
  };

  const toggleValue = (val) =>
    setPendingValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const handleApply = () => {
    if (!selectedDef) { closePicker(); return; }

    const shouldBeHidden = isHiddenSession || hiddenFieldKeys.has(selectedDef.fieldKey);

    if (pendingValues.length === 0) {
      if (editingId) {
        const editingFilter = activeFilters.find(f => f.id === editingId);
        if (editingFilter?.hidden) {
          onFiltersChange(activeFilters.map(f =>
            f.id === editingId ? { ...f, values: [] } : f
          ));
        } else {
          onFiltersChange(activeFilters.filter(f => f.id !== editingId));
        }
      }
      closePicker(); return;
    }

    if (editingId) {
      onFiltersChange(activeFilters.map(f =>
        f.id === editingId ? { ...f, values: pendingValues } : f
      ));
    } else {
      const existing = activeFilters.find(f => f.fieldKey === selectedDef.fieldKey);
      if (existing) {
        onFiltersChange(activeFilters.map(f =>
          f.fieldKey === selectedDef.fieldKey
            ? { ...f, values: pendingValues, ...(shouldBeHidden ? { hidden: true } : {}) }
            : f
        ));
      } else {
        onFiltersChange([...activeFilters, {
          id:       `gf-${Date.now()}`,
          fieldKey: selectedDef.fieldKey,
          label:    selectedDef.label,
          type:     selectedDef.type,
          values:   pendingValues,
          ...(shouldBeHidden ? { hidden: true } : {}),
        }]);
      }
    }
    closePicker();
  };

  const removeFilter = (id, e) => {
    e.stopPropagation();
    onFiltersChange(activeFilters.filter(f => f.id !== id));
    if (pickerOpen && editingId === id) closePicker();
  };

  // ── toggleHidden ──────────────────────────────────────────────────────────
  const toggleHidden = (id, e) => {
    e.stopPropagation();
    const filter = activeFilters.find(f => f.id === id);
    if (!filter) return;

    if (filter.hidden) {
      if (filter.values.length === 0) {
        onFiltersChange(activeFilters.filter(f => f.id !== id));
      } else {
        const { hidden: _, ...rest } = filter;
        onFiltersChange(activeFilters.map(f => f.id === id ? rest : f));
      }
    } else {
      onFiltersChange(activeFilters.map(f => f.id === id ? { ...f, hidden: true } : f));
    }
  };

  // ── Download via dashboardPrefs.js ────────────────────────────────────────
  const handleSaveDefaults = () => {
    const hiddenFilters  = activeFilters.filter(f =>  f.hidden);
    const regularFilters = activeFilters.filter(f => !f.hidden);
    onSaveDefaults?.({ adminOnlyFilters: hiddenFilters, regularFilters });
    const payload = buildDefaultsJson({
      defaultGlobalFilters:       regularFilters,
      defaultHiddenGlobalFilters: hiddenFilters,
    });
    downloadJson(payload);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  // ── Long press ────────────────────────────────────────────────────────────
  const startPress = (e) => {
    e.preventDefault();
    isPressing.current    = true;
    pressStartRef.current = Date.now();
    const tick = () => {
      if (!isPressing.current) return;
      if (Date.now() - pressStartRef.current >= LONG_PRESS_MS) {
        isPressing.current = false;
        setHiddenUnlocked(true);
        openPickerNew(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const endPress = () => {
    const elapsed = pressStartRef.current ? Date.now() - pressStartRef.current : 0;
    isPressing.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (elapsed < LONG_PRESS_MS) openPickerNew(false);
  };

  const cancelPress = (e) => {
    isPressing.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const btn = e?.currentTarget;
    if (btn) {
      btn.style.background  = 'transparent';
      btn.style.borderColor = c.border;
      btn.style.color       = c.sub;
    }
  };

  const getOptions = (def) => {
    if (!def) return [];

    let baseOptions;
    const hasNull = projects.some(p => p[def.fieldKey] == null || p[def.fieldKey] === '');

    if      (def.type === 'health') baseOptions = HEALTH_OPTIONS;
    else if (def.type === 'stage')  baseOptions = STAGE_OPTIONS;
    else if (def.type === 'type')   baseOptions = TYPE_OPTIONS;
    else if (def.type === 'status') baseOptions = STATUS_OPTIONS;
    else if (def.type === 'state')  baseOptions = STATE_OPTIONS;
    else baseOptions = (dynamicOptions[def.fieldKey] ?? []).map(v => ({ value: v, label: v }));

    return hasNull
      ? [...baseOptions, { value: NULL_SENTINEL, label: 'No value', isNull: true }]
      : baseOptions;
  };

  const resolveLabel = (type, v) => {
    if (v === NULL_SENTINEL) return 'No value';
    if (type === 'health') return HEALTH_OPTIONS.find(o => o.value === v)?.label ?? v;
    if (type === 'stage')  return STAGE_OPTIONS.find(o => o.value === v)?.label ?? v;
    if (type === 'type')   return TYPE_OPTIONS.find(o => o.value === v)?.label ?? v;
    if (type === 'status') return STATUS_OPTIONS.find(o => o.value === v)?.label ?? v;
    if (type === 'state')  return STATE_OPTIONS.find(o => o.value === v)?.label ?? v;
    return v;
  };

  const formatChipLabel = (filter) => {
    const labels  = filter.values.map(v => resolveLabel(filter.type, v));
    const display = labels.length <= 2
      ? labels.join(', ')
      : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
    return `${filter.label}: ${display}`;
  };

  // ── Filter def buckets ────────────────────────────────────────────────────
  const allMatchingDefs = GLOBAL_FILTER_DEFS.filter(d =>
    d.label.toLowerCase().includes(search.toLowerCase())
  );

  const regularDefs = isHiddenSession
    ? []
    : allMatchingDefs.filter(d => !d.adminOnly && !hiddenFieldKeys.has(d.fieldKey));

  const hiddenDefs = hiddenUnlocked
    ? (isHiddenSession
        ? allMatchingDefs
        : allMatchingDefs.filter(d => d.adminOnly || hiddenFieldKeys.has(d.fieldKey)))
    : [];

  const filteredOptions = getOptions(selectedDef).filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const subtleBtn = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: c.sub, padding: 2, borderRadius: 4,
    display: 'flex', alignItems: 'center', transition: 'color 0.12s',
  };

  // ── Chip ──────────────────────────────────────────────────────────────────
  const renderChip = (f) => {
    const hidden      = isHidden(f);
    const chipColor   = hidden ? (dark ? '#c4b5fd' : '#6d28d9') : (dark ? '#93c5fd' : '#2563eb');
    const chipHoverBg = hidden
      ? (dark ? 'rgba(196,181,253,0.3)' : 'rgba(109,40,217,0.12)')
      : (dark ? 'rgba(147,197,253,0.3)' : 'rgba(37,99,235,0.12)');

    return (
      <motion.button
        key={f.id}
        layout
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.14 }}
        onClick={() => openEdit(f)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 6px 3px 9px', borderRadius: 99,
          background: hidden
            ? (dark ? 'rgba(139,92,246,0.14)' : '#f5f3ff')
            : (dark ? 'rgba(59,130,246,0.14)'  : '#eff6ff'),
          border: `1px solid ${hidden
            ? (dark ? 'rgba(139,92,246,0.38)' : '#ddd6fe')
            : (dark ? 'rgba(59,130,246,0.38)'  : '#bfdbfe')}`,
          color: chipColor,
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', lineHeight: 1,
        }}
      >
        {formatChipLabel(f)}
        <span
          role="button"
          onClick={(e) => removeFilter(f.id, e)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 15, height: 15, borderRadius: '50%',
            flexShrink: 0, transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = chipHoverBg}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={9} strokeWidth={2.5} />
        </span>
      </motion.button>
    );
  };

  // ── Category row ──────────────────────────────────────────────────────────
  const renderCategoryRow = (def, isHiddenSection = false) => {
    const activeFilter    = activeFilters.find(f => f.fieldKey === def.fieldKey) ?? null;
    const isActive        = activeFilter !== null && activeFilter.values.length > 0;
    const currentlyHidden = activeFilter ? isHidden(activeFilter) : false;

    return (
      <button
        key={def.fieldKey}
        onClick={() => selectCategory(def)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px', borderRadius: 7, border: 'none',
          background: 'transparent', color: c.text,
          cursor: 'pointer', fontSize: 12, fontWeight: 500, textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = c.hover}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span>{def.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {isActive && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: isHiddenSection ? (dark ? '#c4b5fd' : '#6d28d9') : '#3b82f6',
              background: isHiddenSection
                ? (dark ? 'rgba(139,92,246,0.28)' : '#ede9fe')
                : (dark ? 'rgba(59,130,246,0.14)' : '#eff6ff'),
              padding: '1px 5px', borderRadius: 99,
            }}>active</span>
          )}

          {isHiddenSection && (
            <span
              role="button"
              title={
                currentlyHidden
                  ? 'Hidden from regular users — click to make visible'
                  : 'Visible to all — click to hide from regular users'
              }
              onClick={(e) => {
                e.stopPropagation();
                if (activeFilter) {
                  toggleHidden(activeFilter.id, e);
                } else {
                  onFiltersChange([...activeFilters, {
                    id:       `gf-${Date.now()}`,
                    fieldKey: def.fieldKey,
                    label:    def.label,
                    type:     def.type,
                    values:   [],
                    hidden:   true,
                  }]);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%',
                color: currentlyHidden
                  ? (dark ? '#c4b5fd' : '#6d28d9')
                  : (dark ? '#64748b'  : '#94a3b8'),
                cursor: 'pointer',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => {
                e.stopPropagation();
                e.currentTarget.style.background = dark
                  ? 'rgba(148,163,184,0.14)' : 'rgba(100,116,139,0.1)';
                e.currentTarget.style.color = currentlyHidden
                  ? (dark ? '#e9d5ff' : '#5b21b6')
                  : (dark ? '#f1f5f9' : '#0f172a');
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = currentlyHidden
                  ? (dark ? '#c4b5fd' : '#6d28d9')
                  : (dark ? '#64748b'  : '#94a3b8');
              }}
            >
              {currentlyHidden
                ? <EyeOff size={10} strokeWidth={2.5} />
                : <Eye    size={10} strokeWidth={2.5} />}
            </span>
          )}

          <ChevronRight size={12} color={c.ph} />
        </div>
      </button>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap' }}
    >

      {/* Regular chips */}
      <AnimatePresence initial={false}>
        {regularChips.map(f => renderChip(f))}
      </AnimatePresence>

      {/* Hidden chips — only visible while hidden session is active */}
      {hiddenUnlocked && hiddenChips.length > 0 && (
        <>
          <div style={{
            width: 1, height: 16, flexShrink: 0, alignSelf: 'center',
            background: dark ? 'rgba(139,92,246,0.35)' : '#ddd6fe',
          }} />
          <AnimatePresence initial={false}>
            {hiddenChips.map(f => renderChip(f))}
          </AnimatePresence>
        </>
      )}

      {/* Add Filter + download */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onTouchCancel={cancelPress}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 99,
            border: `1px dashed ${c.border}`,
            background: 'transparent', color: c.sub,
            cursor: 'pointer', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
            transition: 'background 0.13s, color 0.13s, border-color 0.13s',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background  = c.hover;
            e.currentTarget.style.borderColor = c.sub;
            e.currentTarget.style.color       = c.text;
          }}
        >
          <Plus size={11} strokeWidth={2.5} />
          Add Filter
        </button>

        <AnimatePresence>
          {isHiddenSession && (
            <motion.button
              initial={{ opacity: 0, scale: 0.65, x: -4 }}
              animate={{ opacity: 1, scale: 1,    x: 0   }}
              exit   ={{ opacity: 0, scale: 0.65, x: -4  }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              onClick={handleSaveDefaults}
              title="Download dashboardDefaults.json"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                background: saveFlash
                  ? (dark ? 'rgba(34,197,94,0.25)'  : 'rgba(34,197,94,0.15)')
                  : (dark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)'),
                border: `1px solid ${saveFlash
                  ? (dark ? 'rgba(34,197,94,0.5)'   : '#bbf7d0')
                  : (dark ? 'rgba(139,92,246,0.45)' : '#ddd6fe')}`,
                color: saveFlash
                  ? (dark ? '#86efac' : '#16a34a')
                  : (dark ? '#c4b5fd' : '#6d28d9'),
                cursor: 'pointer', padding: 0, flexShrink: 0,
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (saveFlash) return;
                e.currentTarget.style.background  = dark ? 'rgba(139,92,246,0.3)'  : 'rgba(139,92,246,0.18)';
                e.currentTarget.style.borderColor = dark ? 'rgba(139,92,246,0.6)'  : '#c4b5fd';
                e.currentTarget.style.color       = dark ? '#e9d5ff' : '#5b21b6';
              }}
              onMouseLeave={e => {
                if (saveFlash) return;
                e.currentTarget.style.background  = dark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)';
                e.currentTarget.style.borderColor = dark ? 'rgba(139,92,246,0.45)' : '#ddd6fe';
                e.currentTarget.style.color       = dark ? '#c4b5fd' : '#6d28d9';
              }}
            >
              <Download size={10} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Picker dropdown */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit   ={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0,
              zIndex: 2000, width: 256,
              background: c.card, borderRadius: 12,
              border: `1px solid ${c.border}`,
              boxShadow: dark
                ? '0 20px 60px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5)'
                : '0 20px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '10px 12px 8px', borderBottom: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AnimatePresence initial={false} mode="wait">
                {step === 'options' && !editingId && (
                  <motion.button
                    key="back"
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.12 }}
                    onClick={() => { setStep('categories'); setSelectedDef(null); setSearch(''); }}
                    style={subtleBtn}
                    onMouseEnter={e => e.currentTarget.style.color = c.text}
                    onMouseLeave={e => e.currentTarget.style.color = c.sub}
                  >
                    <ChevronLeft size={14} />
                  </motion.button>
                )}
              </AnimatePresence>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
                  {step === 'categories'
                    ? (isHiddenSession ? 'Add Hidden Filter' : 'Add Filter')
                    : selectedDef?.label}
                </div>
                {step === 'options' && (
                  <div style={{ fontSize: 10, color: c.sub, marginTop: 1 }}>
                    {pendingValues.length === 0
                      ? 'Select one or more · OR within filter'
                      : `${pendingValues.length} selected`}
                  </div>
                )}
              </div>

              <button
                onClick={closePicker}
                style={subtleBtn}
                onMouseEnter={e => e.currentTarget.style.color = c.text}
                onMouseLeave={e => e.currentTarget.style.color = c.sub}
              >
                <X size={13} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '8px 10px 4px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderRadius: 7, padding: '5px 8px',
                border: `1px solid ${c.border}`,
              }}>
                <Search size={11} color={c.ph} style={{ flexShrink: 0 }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={step === 'categories' ? 'Search filters...' : 'Search options...'}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 11, color: c.text, flex: 1, caretColor: '#3b82f6',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.ph, padding: 0, display: 'flex' }}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 8px 6px' }}>
              {step === 'categories' ? (
                regularDefs.length === 0 && hiddenDefs.length === 0
                  ? <div style={{ fontSize: 11, color: c.sub, textAlign: 'center', padding: '20px 0' }}>No filters match</div>
                  : <>
                      {regularDefs.map(def => renderCategoryRow(def, false))}

                      {hiddenDefs.length > 0 && (
                        <>
                          {regularDefs.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px 4px' }}>
                              <div style={{ flex: 1, height: 1, background: c.border }} />
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                                color: c.sub, textTransform: 'uppercase',
                              }}>Hidden</span>
                              <div style={{ flex: 1, height: 1, background: c.border }} />
                            </div>
                          )}
                          {hiddenDefs.map(def => renderCategoryRow(def, true))}
                        </>
                      )}
                    </>
              ) : (
                filteredOptions.length === 0
                  ? <div style={{ fontSize: 11, color: c.sub, textAlign: 'center', padding: '20px 0' }}>No options found</div>
                  : filteredOptions.map((opt, i) => {
                      const checked    = pendingValues.includes(opt.value);
                      const isNullOpt  = opt.value === NULL_SENTINEL;
                      const prevIsNull = i > 0 && !filteredOptions[i - 1].isNull && isNullOpt;

                      return (
                        <div key={opt.value}>
                          {/* Divider before the null option */}
                          {prevIsNull && (
                            <div style={{
                              height: 1, background: c.border,
                              margin: '4px 0',
                            }} />
                          )}
                          <button
                            onClick={() => toggleValue(opt.value)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 8px', borderRadius: 7, border: 'none',
                              background: checked
                                ? (dark ? 'rgba(59,130,246,0.12)' : '#eff6ff')
                                : 'transparent',
                              color: checked
                                ? (dark ? '#93c5fd' : '#1d4ed8')
                                : isNullOpt ? c.sub : c.text,
                              cursor: 'pointer', fontSize: 12,
                              fontWeight: checked ? 600 : 400, textAlign: 'left',
                              fontStyle: isNullOpt ? 'italic' : 'normal',
                              transition: 'background 0.1s, color 0.1s',
                            }}
                            onMouseEnter={e => { if (!checked) e.currentTarget.style.background = c.hover; }}
                            onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{
                              width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                              background: checked ? '#3b82f6' : 'transparent',
                              border: `1.5px solid ${checked ? '#3b82f6' : c.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.12s, border-color 0.12s',
                            }}>
                              {checked && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            {opt.label}
                          </button>
                        </div>
                      );
                    })
              )}
            </div>

            {/* Footer */}
            {step === 'options' && (
              <div style={{
                padding: '7px 10px 9px', borderTop: `1px solid ${c.border}`,
                display: 'flex', gap: 6,
              }}>
                <button
                  onClick={() => setPendingValues([])}
                  disabled={pendingValues.length === 0}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 7,
                    border: `1px solid ${c.border}`, background: 'transparent',
                    color: pendingValues.length === 0 ? c.ph : c.sub,
                    cursor: pendingValues.length === 0 ? 'default' : 'pointer',
                    fontSize: 11, fontWeight: 500,
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={handleApply}
                  style={{
                    flex: 2, padding: '5px 0', borderRadius: 7, border: 'none',
                    background: pendingValues.length > 0 ? '#3b82f6' : (dark ? '#2d3748' : '#e2e8f0'),
                    color: pendingValues.length > 0 ? '#fff' : c.ph,
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (pendingValues.length > 0) e.currentTarget.style.background = '#2563eb'; }}
                  onMouseLeave={e => { if (pendingValues.length > 0) e.currentTarget.style.background = '#3b82f6'; }}
                >
                  Apply
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
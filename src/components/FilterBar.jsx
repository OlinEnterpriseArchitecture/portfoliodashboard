import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLOBAL_FILTER_DEFS, HEALTH_OPTIONS, STAGE_OPTIONS, TYPE_OPTIONS } from '../data/filters'; // ← added TYPE_OPTIONS

export default function FilterBar({ dark, c, activeFilters, onFiltersChange, dynamicOptions }) {
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [step, setStep]                   = useState('categories');
  const [selectedDef, setSelectedDef]     = useState(null);
  const [pendingValues, setPendingValues] = useState([]);
  const [search, setSearch]               = useState('');
  const containerRef                      = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closePicker();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const closePicker = () => {
    setPickerOpen(false); setEditingId(null); setStep('categories');
    setSelectedDef(null); setPendingValues([]); setSearch('');
  };

  const openNew = () => {
    if (pickerOpen && step === 'categories' && !editingId) { closePicker(); return; }
    setEditingId(null); setStep('categories'); setSelectedDef(null);
    setPendingValues([]); setSearch(''); setPickerOpen(true);
  };

  const openEdit = (filter) => {
    const def = GLOBAL_FILTER_DEFS.find(d => d.fieldKey === filter.fieldKey);
    if (!def) return;
    setEditingId(filter.id); setSelectedDef(def);
    setPendingValues([...filter.values]); setStep('options');
    setSearch(''); setPickerOpen(true);
  };

  const selectCategory = (def) => {
    setSelectedDef(def); setPendingValues([]); setStep('options'); setSearch('');
  };

  const toggleValue = (val) =>
    setPendingValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const handleApply = () => {
    if (!selectedDef) { closePicker(); return; }
    if (pendingValues.length === 0) {
      if (editingId) onFiltersChange(activeFilters.filter(f => f.id !== editingId));
      closePicker(); return;
    }
    if (editingId) {
      onFiltersChange(activeFilters.map(f => f.id === editingId ? { ...f, values: pendingValues } : f));
    } else {
      const existing = activeFilters.find(f => f.fieldKey === selectedDef.fieldKey);
      if (existing) {
        onFiltersChange(activeFilters.map(f =>
          f.fieldKey === selectedDef.fieldKey ? { ...f, values: pendingValues } : f
        ));
      } else {
        onFiltersChange([...activeFilters, {
          id: `gf-${Date.now()}`,
          fieldKey: selectedDef.fieldKey,
          label: selectedDef.label,
          type: selectedDef.type,
          values: pendingValues,
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

  // ── Option lists ──────────────────────────────────────────────────────────
  const getOptions = (def) => {
    if (!def) return [];
    if (def.type === 'health') return HEALTH_OPTIONS;
    if (def.type === 'stage')  return STAGE_OPTIONS;
    if (def.type === 'type')   return TYPE_OPTIONS; // ← added
    return (dynamicOptions[def.fieldKey] ?? []).map(v => ({ value: v, label: v }));
  };

  const formatChipLabel = (filter) => {
    let labels = filter.values;
    if (filter.type === 'health')
      labels = filter.values.map(v => HEALTH_OPTIONS.find(o => o.value === v)?.label ?? v);
    else if (filter.type === 'stage')
      labels = filter.values.map(v => STAGE_OPTIONS.find(o => o.value === v)?.label ?? v);
    else if (filter.type === 'type')  // ← added
      labels = filter.values.map(v => TYPE_OPTIONS.find(o => o.value === v)?.label ?? v);
    const display = labels.length <= 2
      ? labels.join(', ')
      : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
    return `${filter.label}: ${display}`;
  };

  const filteredCategories = GLOBAL_FILTER_DEFS.filter(d =>
    d.label.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOptions = getOptions(selectedDef).filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const subtleBtn = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: c.sub, padding: 2, borderRadius: 4,
    display: 'flex', alignItems: 'center', transition: 'color 0.12s',
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap' }}
    >
      <AnimatePresence initial={false}>
        {activeFilters.map(f => (
          <motion.button
            key={f.id}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.14 }}
            onClick={() => openEdit(f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 6px 3px 9px', borderRadius: 99,
              background: dark ? 'rgba(59,130,246,0.14)' : '#eff6ff',
              border: `1px solid ${dark ? 'rgba(59,130,246,0.38)' : '#bfdbfe'}`,
              color: dark ? '#93c5fd' : '#2563eb',
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
                width: 15, height: 15, borderRadius: '50%', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(147,197,253,0.3)' : 'rgba(37,99,235,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={9} strokeWidth={2.5} />
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={openNew}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 99,
          border: `1px dashed ${c.border}`,
          background: 'transparent', color: c.sub,
          cursor: 'pointer', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
          transition: 'background 0.13s, color 0.13s, border-color 0.13s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = c.hover;
          e.currentTarget.style.color = c.text;
          e.currentTarget.style.borderColor = c.sub;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = c.sub;
          e.currentTarget.style.borderColor = c.border;
        }}
      >
        <Plus size={11} strokeWidth={2.5} />
        Add Filter
      </motion.button>

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
                  {step === 'categories' ? 'Add Filter' : selectedDef?.label}
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
                  <button onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.ph, padding: 0, display: 'flex' }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 8px 6px' }}>
              {step === 'categories' ? (
                filteredCategories.length === 0
                  ? <div style={{ fontSize: 11, color: c.sub, textAlign: 'center', padding: '20px 0' }}>No filters match</div>
                  : filteredCategories.map(def => {
                      const isActive = activeFilters.some(f => f.fieldKey === def.fieldKey);
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
                                fontSize: 9, fontWeight: 700, color: '#3b82f6',
                                background: dark ? 'rgba(59,130,246,0.14)' : '#eff6ff',
                                padding: '1px 5px', borderRadius: 99,
                              }}>active</span>
                            )}
                            <ChevronRight size={12} color={c.ph} />
                          </div>
                        </button>
                      );
                    })
              ) : (
                filteredOptions.length === 0
                  ? <div style={{ fontSize: 11, color: c.sub, textAlign: 'center', padding: '20px 0' }}>No options found</div>
                  : filteredOptions.map(opt => {
                      const checked = pendingValues.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleValue(opt.value)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 8px', borderRadius: 7, border: 'none',
                            background: checked
                              ? (dark ? 'rgba(59,130,246,0.12)' : '#eff6ff')
                              : 'transparent',
                            color: checked ? (dark ? '#93c5fd' : '#1d4ed8') : c.text,
                            cursor: 'pointer', fontSize: 12,
                            fontWeight: checked ? 600 : 400, textAlign: 'left',
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
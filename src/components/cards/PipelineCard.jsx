import { useState, useEffect, useRef } from 'react';
import { Inbox, Users, Zap, PackageCheck, SlidersHorizontal, Check } from 'lucide-react';
import { DragBar } from './shared';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_STAGES = [
  { id: 'closeout',  kpiKey: 'inCloseOut',  label: 'Close Out', color: '#10b981', bg: { dark: 'rgba(16,185,129,0.12)',  light: '#f0fdf4' }, Icon: PackageCheck },
  { id: 'execution', kpiKey: 'inExecution', label: 'Execution', color: '#3b82f6', bg: { dark: 'rgba(59,130,246,0.12)',  light: '#eff6ff' }, Icon: Zap         },
  { id: 'steerCo',   kpiKey: 'inSteerCo',   label: 'Steer Co',  color: '#8b5cf6', bg: { dark: 'rgba(139,92,246,0.12)', light: '#f5f3ff' }, Icon: Users        },
  { id: 'intake',    kpiKey: 'inIntake',     label: 'Intake',    color: null,      bg: { dark: 'rgba(100,116,139,0.12)',light: '#f8fafc' }, Icon: Inbox        },
];

const CARD_DIMS = {
  1: { refW: 120, refH: 65  },
  2: { refW: 160, refH: 90  },
  3: { refW: 210, refH: 130 },
  4: { refW: 275, refH: 170 },
};

const DEFAULT_VISIBLE = ['closeout', 'execution', 'steerCo', 'intake'];

export default function PipelineCard({
  c, dark, isEditing, KPI = {},
  visibleStages = DEFAULT_VISIBLE,
  onStagesChange,
  drillDown,
  onDrillDown,
}) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 275, h: 170 });
  const [showConfig, setShowConfig] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef  = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.borderBoxSize?.[0]?.blockSize  ?? entry.contentRect.height;
      const w = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      setDims({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleList = ALL_STAGES.filter(s => visibleStages.includes(s.id));

  const VERT_PAD = 8;

  const { refH } = CARD_DIMS[visibleList.length] ?? CARD_DIMS[4];
  const scale = Math.min(Math.max((dims.h - VERT_PAD * 2) / refH, 0.5), 1.8);
  const fs = (base) => Math.round(base * scale * 10) / 10;
  const sp = (base) => Math.round(base * scale);

  const canDrill = !!onDrillDown && !isEditing;

  useEffect(() => { if (!isEditing) setShowConfig(false); }, [isEditing]);
  useEffect(() => {
    if (!showConfig) return;
    const handler = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        buttonRef.current  && !buttonRef.current.contains(e.target)
      ) setShowConfig(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showConfig]);

  const allChecked  = ALL_STAGES.every(s =>  visibleStages.includes(s.id));
  const someChecked = ALL_STAGES.some(s  =>  visibleStages.includes(s.id)) && !allChecked;

  const toggleStage = (id) => {
    if (!onStagesChange) return;
    if (visibleStages.includes(id)) {
      if (visibleStages.length <= 1) return;
      onStagesChange(visibleStages.filter(s => s !== id));
    } else {
      onStagesChange([...visibleStages, id]);
    }
  };

  const toggleAll = () => {
    if (!onStagesChange) return;
    onStagesChange(allChecked ? [ALL_STAGES[0].id] : ALL_STAGES.map(s => s.id));
  };

  return (
    <>
      <DragBar title="Pipeline Stages" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />

      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: `${VERT_PAD}px ${sp(10)}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: sp(5),
          }}
        >
          {visibleList.map((s) => {
            const color    = s.color ?? (dark ? '#94a3b8' : '#64748b');
            const bg       = s.bg[dark ? 'dark' : 'light'];
            const { Icon } = s;
            const count    = KPI[s.kpiKey] ?? 0;
            const isActive = drillDown?.has('stage-' + s.id) ?? false;
            const isDimmed = drillDown !== null && count === 0;

            return (
              <div
                key={s.id}
                onClick={() => canDrill && onDrillDown('stage-' + s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: sp(10),
                  background: bg,
                  borderRadius: sp(8),
                  padding: `${sp(8)}px ${sp(12)}px`,
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  cursor: canDrill ? 'pointer' : 'default',
                  opacity: isDimmed ? 0.35 : 1,
                  outline: isActive ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: -2,
                  transition: 'opacity 0.2s, outline-color 0.2s',
                }}
              >
                <Icon size={fs(15)} color={color} style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: fs(15), fontWeight: 600, color,
                  flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {s.label}
                </span>
                <span style={{ fontSize: fs(16), fontWeight: 700, color, flexShrink: 0 }}>
                  {count}
                </span>
              </div>
            );
          })}

          {isEditing && (
            <button
              ref={buttonRef}
              onClick={() => setShowConfig(v => !v)}
              title="Configure visible stages"
              style={{
                position: 'absolute', bottom: 6, left: 6,
                width: 22, height: 22, borderRadius: 6, padding: 0,
                background: showConfig
                  ? (dark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)')
                  : (dark ? 'rgba(30,41,59,0.95)'  : 'rgba(255,255,255,0.95)'),
                border: `1px solid ${showConfig ? '#3b82f6' : c.border}`,
                color: showConfig ? '#3b82f6' : c.sub,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <SlidersHorizontal size={11} />
            </button>
          )}

          <AnimatePresence>
            {showConfig && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                exit={{    opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute', bottom: 32, left: 0, width: 210,
                  background: dark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${c.border}`, borderRadius: 12,
                  boxShadow: dark
                    ? '0 16px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)'
                    : '0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                  zIndex: 50, overflow: 'hidden',
                }}
              >
                <div
                  onClick={toggleAll}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${allChecked || someChecked ? '#3b82f6' : (dark ? '#475569' : '#cbd5e1')}`,
                    background: allChecked ? '#3b82f6' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}>
                    {allChecked  && <Check size={9} color="white" strokeWidth={3} />}
                    {someChecked && <div style={{ width: 7, height: 2, background: '#3b82f6', borderRadius: 1 }} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.text, userSelect: 'none' }}>Select All</span>
                </div>

                {ALL_STAGES.map(({ id, label, color }) => {
                  const checked       = visibleStages.includes(id);
                  const isOnly        = visibleStages.length <= 1 && checked;
                  const resolvedColor = color ?? (dark ? '#94a3b8' : '#64748b');
                  return (
                    <div
                      key={id}
                      onClick={() => !isOnly && toggleStage(id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: isOnly ? 'not-allowed' : 'pointer', opacity: isOnly ? 0.4 : 1, transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!isOnly) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${checked ? resolvedColor : (dark ? '#475569' : '#cbd5e1')}`,
                        background: checked ? resolvedColor : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}>
                        {checked && <Check size={9} color="white" strokeWidth={3} />}
                      </div>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: resolvedColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: c.text, flex: 1, lineHeight: 1.3, userSelect: 'none' }}>{label}</span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
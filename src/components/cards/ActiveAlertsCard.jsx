import { useRef, useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { DragBar } from './shared';

const ALERTS = [
  {
    Icon: AlertTriangle, label: 'Open Risks',  kpiKey: 'openRisks',
    color: '#f59e0b', bg: { dark: 'rgba(245,158,11,0.12)', light: '#fffbeb' },
  },
  {
    Icon: AlertCircle,   label: 'Open Issues', kpiKey: 'openIssues',
    color: '#ef4444', bg: { dark: 'rgba(239,68,68,0.12)',  light: '#fef2f2' },
  },
];

const REF_H = 240;

export default function ActiveAlertsCard({ c, dark, isEditing, KPI = {}, drillDown, onDrillDown }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 220, h: 240 });
  const canDrill = !!onDrillDown && !isEditing;

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

  const VERT_PAD = 16;
  const scale = Math.min(Math.max((dims.h - VERT_PAD * 2) / REF_H, 0.5), 1.8);
  const fs = (base) => Math.round(base * scale * 10) / 10;
  const sp = (base) => Math.round(base * scale);

  return (
    <>
      <DragBar title="Active Alerts" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />
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
            inset: `${VERT_PAD}px ${sp(14)}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: sp(10),
          }}
        >
          {ALERTS.map(({ Icon, label, kpiKey, color, bg }) => {
            const value    = KPI[kpiKey] ?? 0;
            const isActive = drillDown?.has(kpiKey) ?? false;
            const isDimmed = drillDown !== null && value === 0;
            return (
              <div
                key={kpiKey}
                onClick={() => canDrill && onDrillDown(kpiKey)}
                style={{
                  flex: 1, minWidth: 0,
                  background: bg[dark ? 'dark' : 'light'],
                  borderRadius: sp(14),
                  padding: `${sp(18)}px ${sp(20)}px`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: sp(6),
                  cursor: canDrill ? 'pointer' : 'default',
                  opacity: isDimmed ? 0.35 : 1,
                  outline: isActive ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: -2,
                  transition: 'opacity 0.2s, outline-color 0.2s',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: sp(4),
                  width: '100%', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <Icon size={fs(14)} color={color} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: fs(16), fontWeight: 700, color,
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', lineHeight: 1.2,
                  }}>
                    {label}
                  </span>
                </div>
                <span style={{ fontSize: fs(40), fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
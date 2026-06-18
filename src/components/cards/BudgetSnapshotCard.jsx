import { useRef, useState, useEffect } from 'react';
import { DragBar } from './shared';

const fmt = (raw) => {
  if (raw == null) return '—';
  const n = Number(raw) * 1000;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${Math.round(n).toLocaleString()}`;
};

const pctFmt = (ratio) => `${Math.round(ratio * 100)}%`;

// Calibrated to the actual natural height of two content sections at base font sizes
const BASE_H = 130;

function BudgetBar({ actualsRatio, totalRatio, color, dark, barH }) {
  return (
    <div style={{
      height: barH, borderRadius: barH / 2,
      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.min(totalRatio * 100, 100)}%`,
        background: `${color}45`,
        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
      }} />
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.min(actualsRatio * 100, 100)}%`,
        background: color,
        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

export default function BudgetSnapshotCard({ c, dark, isEditing, budgetData }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 400, h: BASE_H });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Both fonts/bar AND spacing scale together, so content always fills ~90–95% of the card
  const scale = Math.min(Math.max(dims.h / BASE_H, 0.55), 1.8);
  const fs = (base) => Math.round(base * scale * 10) / 10;
  const sp = (base) => Math.round(base * scale);
  const barH = Math.max(3, sp(6));

  if (!budgetData) {
    return (
      <>
        <DragBar title="Budget Snapshot" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />
        <div ref={containerRef} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.sub, fontSize: 11,
        }}>
          Loading budget data…
        </div>
      </>
    );
  }

  const { capital, expense } = budgetData;

  const sections = [
    {
      label:        'CapEx',
      ytdPlusFcst:  capital.capYTDPlusForecast,
      approved:     capital.budget2026Approved,
      actuals:      capital.capitalActualsYTD,
      forecast:     capital.capitalForecast,
      remaining:    capital.remainingCapBudget,
      utilization:  capital.utilizationCap,
      actualsRatio: capital.capitalActualsYTD / capital.budget2026Approved,
      color:        '#3b82f6',
    },
    {
      label:        'OpEx',
      ytdPlusFcst:  expense.expYTDPlusForecast,
      approved:     expense.budget2026Approved,
      actuals:      expense.expenseActualsYTD,
      forecast:     expense.expenseForecast,
      remaining:    expense.remainingExpBudget,
      utilization:  expense.utilizationExp,
      actualsRatio: expense.expenseActualsYTD / expense.budget2026Approved,
      color:        '#8b5cf6',
    },
  ];

  return (
    <>
      <DragBar title="Budget Snapshot" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `0 ${sp(14)}px`,
        }}
      >
        {sections.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: sp(5),
              paddingTop:    i === 0 ? 0 : sp(11),
              paddingBottom: i < sections.length - 1 ? sp(11) : 0,
              borderBottom:  i < sections.length - 1 ? `1px solid ${c.border}` : 'none',
            }}
          >
            {/* Label | estimate / approved | % badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sp(6) }}>
              <span style={{ fontSize: fs(12), fontWeight: 600, color: c.text, flex: 1 }}>
                {s.label}
              </span>
              <span style={{ fontSize: fs(10.5), color: c.sub, whiteSpace: 'nowrap' }}>
                {fmt(s.ytdPlusFcst)}&thinsp;/&thinsp;{fmt(s.approved)}
              </span>
              <span style={{
                fontSize: fs(10), fontWeight: 700,
                color: s.color,
                background: dark ? `${s.color}22` : `${s.color}15`,
                border: `1.5px solid ${s.color}55`,
                borderRadius: sp(5),
                padding: `1px ${sp(6)}px`,
                whiteSpace: 'nowrap',
              }}>
                {pctFmt(s.utilization)}
              </span>
            </div>

            {/* Bar — width fills container naturally, height scales with card */}
            <BudgetBar
              actualsRatio={s.actualsRatio}
              totalRatio={s.utilization}
              color={s.color}
              dark={dark}
              barH={barH}
            />

            {/* Actuals · Forecast · Remaining */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sp(6) }}>
              <div style={{
                fontSize: fs(10), flex: 1,
                display: 'flex', alignItems: 'center', gap: sp(3), flexWrap: 'wrap',
              }}>
                <span style={{ color: s.color, fontWeight: 600 }}>Actuals</span>
                <span style={{ color: c.sub }}>{fmt(s.actuals)}</span>
                <span style={{ color: c.sub, opacity: 0.45 }}>·</span>
                <span style={{ color: `${s.color}bb`, fontWeight: 600 }}>Forecast</span>
                <span style={{ color: c.sub }}>{fmt(s.forecast)}</span>
              </div>
              <div style={{ fontSize: fs(10), whiteSpace: 'nowrap', color: c.sub }}>
                {fmt(s.remaining)}{' '}
                <span style={{ opacity: 0.6 }}>remaining</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
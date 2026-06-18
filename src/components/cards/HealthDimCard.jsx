import { useRef, useState, useEffect } from 'react';
import ToggleButton      from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { DragBar, hColor } from './shared';

const STATUS = [
  { key: 'onTrack',  bg: '#22c55e', label: 'On Track'  },
  { key: 'atRisk',   bg: '#f59e0b', label: 'At Risk'   },
  { key: 'offTrack', bg: '#ef4444', label: 'Off Track' },
];

const REF_H = { dim: 185, dept: 262 };

function ScorePill({ score, scale }) {
  const color = hColor(score);
  const fs = (b) => Math.round(b * scale * 10) / 10;
  const sp = (b) => Math.round(b * scale);
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      minWidth:       sp(46),
      height:         sp(22),
      borderRadius:   sp(11),
      background:     `${color}20`,
      border:         `1px solid ${color}50`,
      fontSize:       fs(11),
      fontWeight:     800,
      color,
      flexShrink:     0,
      letterSpacing:  0.3,
    }}>
      {score}%
    </span>
  );
}

function CountChip({ count, bg, scale }) {
  const fs = (b) => Math.round(b * scale * 10) / 10;
  const sp = (b) => Math.round(b * scale);
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      minWidth:       sp(22),
      height:         sp(22),
      borderRadius:   sp(11),
      background:     `${bg}1a`,
      fontSize:       fs(11),
      fontWeight:     700,
      color:          bg,
      flexShrink:     0,
    }}>
      {count}
    </span>
  );
}

function TotalChip({ count, scale }) {
  const fs = (b) => Math.round(b * scale * 10) / 10;
  const sp = (b) => Math.round(b * scale);
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      minWidth:       sp(22),
      height:         sp(22),
      borderRadius:   sp(11),
      background:     '#3b82f620',
      fontSize:       fs(11),
      fontWeight:     700,
      color:          '#3b82f6',
      flexShrink:     0,
    }}>
      {count}
    </span>
  );
}

function HealthRow({ dim, score, onTrack, atRisk, offTrack, total = 0, c, showTotal = false, scale }) {
  const counts       = { onTrack, atRisk, offTrack };
  const displayTotal = total || onTrack + atRisk + offTrack;
  const denom        = displayTotal || 1;
  const fs = (b) => Math.round(b * scale * 10) / 10;
  const sp = (b) => Math.round(b * scale);

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        sp(8),
      padding:    `${sp(4)}px 0`,
    }}>
      <span style={{
        width:        sp(68),
        fontSize:     fs(11),
        fontWeight:   600,
        color:        c.text,
        flexShrink:   0,
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        textAlign:    'right',
      }}>
        {dim}
      </span>

      {/* flex:1 — bar shrinks naturally as card narrows */}
      <div style={{
        flex:            1,
        minWidth:        32,
        height:          sp(7),
        borderRadius:    sp(4),
        overflow:        'hidden',
        display:         'flex',
        backgroundColor: c.track,
      }}>
        {STATUS.map(({ key, bg }) =>
          counts[key] > 0 && (
            <div
              key={key}
              style={{
                width:      `${(counts[key] / denom) * 100}%`,
                background: bg,
                transition: 'width 0.35s ease',
              }}
            />
          )
        )}
      </div>

      <ScorePill score={score} scale={scale} />

      <div style={{ display: 'flex', gap: sp(3), flexShrink: 0 }}>
        {showTotal && <TotalChip count={displayTotal} scale={scale} />}
        {STATUS.map(({ key, bg }) => (
          <CountChip key={key} count={counts[key]} bg={bg} scale={scale} />
        ))}
      </div>
    </div>
  );
}

const toggleSx = (c, dark, scale) => {
  const fs = (b) => Math.round(b * scale * 10) / 10;
  const sp = (b) => Math.round(b * scale);
  return {
    borderRadius: '20px !important',
    overflow:     'hidden',
    border:       `1px solid ${c.border} !important`,
    '& .MuiToggleButton-root': {
      color:         c.sub,
      border:        'none !important',
      fontSize:      fs(9),
      fontWeight:    600,
      padding:       `${sp(2)}px ${sp(9)}px`,
      lineHeight:    1.5,
      textTransform: 'none',
      letterSpacing: 0.2,
      transition:    'background 0.15s, color 0.15s',
      '&.Mui-selected': {
        color:           '#fff',
        backgroundColor: '#6b7280',
        '&:hover':       { backgroundColor: '#4b5563' },
      },
      '&:hover:not(.Mui-selected)': {
        backgroundColor: dark
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)',
      },
    },
  };
};

export default function HealthDimCard({
  c, dark, isEditing,
  healthByDim  = [],
  healthByDept = [],
  view         = 'dim',       // ← lifted to Dashboard
  onViewChange,               // ← lifted to Dashboard
}) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 640, h: 185 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows      = view === 'dim' ? healthByDim : healthByDept;
  const showTotal = view === 'dept';

  // Height-only scale — width changes just stretch/shrink the bars
  const refH  = REF_H[view] ?? REF_H.dim;
  const scale = Math.min(Math.max(dims.h / refH, 0.5), 1.8);
  const fs = (b) => Math.round(b * scale * 10) / 10;
  const sp = (b) => Math.round(b * scale);

  return (
    <>
      <DragBar
        title="Portfolio Health"
        textColor={c.sub}
        borderColor={c.border}
        isEditing={isEditing}
      />

      <div
        ref={containerRef}
        style={{
          flex:           1,
          overflow:       'hidden',
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          padding:        `${sp(6)}px ${sp(18)}px ${sp(6)}px ${sp(10)}px`,
        }}
      >
        {/* Rows */}
        <div>
          {rows.map((row, i) => (
            <div
              key={row.dim}
              style={{
                borderBottom: i < rows.length - 1
                  ? `1px solid ${c.border}55`
                  : 'none',
              }}
            >
              <HealthRow {...row} c={c} showTotal={showTotal} scale={scale} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginTop:      sp(4),
          paddingTop:     sp(4),
          borderTop:      `1px solid ${c.border}55`,
        }}>
          {/* Mirrors label column to keep legend centred over bars */}
          <div style={{ width: sp(68), flexShrink: 0 }} />

          <div style={{
            flex:           1,
            display:        'flex',
            justifyContent: 'center',
            gap:            sp(12),
          }}>
            {STATUS.map(({ bg, label }) => (
              <span key={label} style={{
                display:       'flex',
                alignItems:    'center',
                gap:           sp(4),
                fontSize:      fs(9),
                fontWeight:    600,
                color:         c.sub,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                <span style={{
                  width:        sp(6),
                  height:       sp(6),
                  borderRadius: '50%',
                  background:   bg,
                  flexShrink:   0,
                  display:      'inline-block',
                }} />
                {label}
              </span>
            ))}
          </div>

          <ToggleButtonGroup
            value={view}
            exclusive
            size="small"
            onChange={(_, v) => v && onViewChange?.(v)}
            sx={toggleSx(c, dark, scale)}
          >
            <ToggleButton value="dim">By Dim</ToggleButton>
            <ToggleButton value="dept">By Dept</ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    </>
  );
}
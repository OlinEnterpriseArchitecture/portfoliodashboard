import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripHorizontal, Info } from 'lucide-react';

export function hColor(s) { return s >= 80 ? '#22c55e' : s >= 65 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'; }
export function hLabel(s) { return s >= 80 ? 'Strong' : s >= 65 ? 'Good' : s >= 50 ? 'Fair' : 'At Risk'; }

// ── InfoTooltip ───────────────────────────────────────────────────────────────
export const InfoTooltip = ({ content, color = '#94a3b8', style = {} }) => {
  const [show, setShow] = useState(false);
  const [pos,  setPos]  = useState({ bottom: 0, left: 0 });
  const ref             = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({
        bottom: window.innerHeight - r.top + 6,
        left:   Math.min(r.left, window.innerWidth - 228),
      });
    }
    setShow(true);
  };

  return (
    <div
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', ...style }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={13} color={color} style={{ cursor: 'help', opacity: 0.45 }} />
      {show && createPortal(
        <div style={{
          position:      'fixed',
          bottom:        pos.bottom,
          left:          pos.left,
          width:         220,
          background:    '#1a2235',
          border:        '1px solid rgba(255,255,255,0.12)',
          borderRadius:  8,
          padding:       '9px 11px',
          zIndex:        99999,
          boxShadow:     '0 6px 24px rgba(0,0,0,0.45)',
          pointerEvents: 'none',
          color:         '#e2e8f0',
          fontSize:      11,
          lineHeight:    1.65,
          fontFamily:    "'Inter',system-ui,sans-serif",
        }}>
          {content}
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Shared tooltip content for both health cards ──────────────────────────────
// Update this text to match your actual scoring formula.
export const HEALTH_SCORE_INFO = (
  <div>
    <div style={{ fontWeight: 700, marginBottom: 5, color: '#f1f5f9', fontSize: 11.5 }}>
      Portfolio Health Score
    </div>
    <div style={{ opacity: 0.85, lineHeight: 1.65, fontSize: 11, marginBottom: 8 }}>
      Averaged across all projects using Overall Health status only.
    </div>
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           4,
      marginBottom:  8,
      fontSize:      11,
    }}>
      <span><span style={{ color: '#22c55e', fontWeight: 700 }}>On Track</span>{' = 100 pts'}</span>
      <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>At Risk</span>{' = 50 pts'}</span>
      <span><span style={{ color: '#ef4444', fontWeight: 700 }}>Off Track</span>{' = 0 pts'}</span>
    </div>
    <div style={{
      borderTop:  '1px solid rgba(255,255,255,0.1)',
      paddingTop: 6,
      display:    'flex',
      flexWrap:   'wrap',
      gap:        '3px 10px',
      fontSize:   10.5,
    }}>
      <span><span style={{ color: '#22c55e', fontWeight: 700 }}>80–100</span>{' '}Strong</span>
      <span><span style={{ color: '#10b981', fontWeight: 700 }}>65–79</span>{' '}Good</span>
      <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>50–64</span>{' '}Fair</span>
      <span><span style={{ color: '#ef4444', fontWeight: 700 }}>&lt;50</span>{' '}At Risk</span>
    </div>
  </div>
);

export function CardBody({ children, refW, refH, style = {} }) {
  const outerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [outerH, setOuterH] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w <= 0) return;
      if (h > 0) setOuterH(h);
      const zW = w / refW;
      const zH = (refH != null && h > 0) ? h / refH : Infinity;
      setZoom(Math.min(4, Math.max(0.1, Math.min(zW, zH))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [refW, refH]);

  const logicalH = refH != null
    ? refH
    : (outerH > 0 ? outerH / zoom : undefined);

  return (
    <div ref={outerRef} style={{
      flex: 1, overflow: 'hidden', display: 'flex',
      alignItems:     refH != null ? 'center'    : 'flex-start',
      justifyContent: refH != null ? 'center'    : undefined,
    }}>
      <div style={{
        width: refW,
        ...(logicalH != null ? { height: logicalH } : {}),
        zoom,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '10px 12px',
        ...style,
      }}>
        {children}
      </div>
    </div>
  );
}

export const StatusPill = ({ label, count, color, bg, Icon, dot }) => {
  const isZero = count == null || Number(count) === 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', background: bg,
      borderRadius: 7, padding: '5px 8px', gap: 6, width: '100%',
      opacity: isZero ? 0.38 : 1,
      transition: 'opacity 0.2s',
    }}>
      {dot
        ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        : <Icon size={11} color={color} style={{ flexShrink: 0 }} />}
      <span style={{ fontSize: 12, color, fontWeight: 600, whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1, flexShrink: 0 }}>{count}</span>
    </div>
  );
};

export const SubTile = ({ Icon, label, value, subtitle, color, bg }) => {
  const isZero = value == null || Number(value) === 0;
  return (
    <div style={{
      flex: 1, minWidth: 0, background: bg, borderRadius: 8, padding: '10px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      opacity: isZero ? 0.38 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%', justifyContent: 'center', overflow: 'hidden' }}>
        <Icon size={10} color={color} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</span>
      {subtitle && (
        <span style={{ fontSize: 9, color, opacity: 0.65, whiteSpace: 'nowrap', textAlign: 'center' }}>{subtitle}</span>
      )}
    </div>
  );
};

export const DragBar = ({ title, textColor, borderColor, isEditing }) => (
  <div
    className={isEditing ? 'drag-handle' : ''}
    style={{
      padding: '6px 10px', borderBottom: `1px solid ${borderColor}`,
      display: 'flex', alignItems: 'center', gap: 6,
      cursor: isEditing ? 'grab' : 'default',
      userSelect: 'none', flexShrink: 0,
    }}
  >
    <GripHorizontal
      size={12}
      color={textColor}
      style={{ opacity: isEditing ? 1 : 0.25, transition: 'opacity 0.2s' }}
    />
    <span style={{ fontSize: 11, fontWeight: 600, color: textColor }}>{title}</span>
  </div>
);
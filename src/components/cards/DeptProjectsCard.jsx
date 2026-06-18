import { useMemo, useCallback, useRef, useState, useLayoutEffect, memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { DragBar } from './shared';
import { parseHealth } from '../../data/parseUtils';

const SEGMENTS = [
  { key: 'onTrack',  label: 'On Track',  color: '#10b981' },
  { key: 'atRisk',   label: 'At Risk',   color: '#f59e0b' },
  { key: 'offTrack', label: 'Off Track', color: '#ef4444' },
];

const PAD                = { t: 4, r: 2, b: 6, l: 2 };
const RESIZE_DEBOUNCE_MS = 150;
const DIM_OPACITY        = 0.15;
const BAR_RADIUS         = 3;
const PAIR_SEP           = '||';   // ← separates dept from segKey inside a pair key

function roundedTopPath(x, y, w, h, r) {
  if (h <= 0 || w <= 0) return '';
  const cr = Math.min(r, w / 2, h);
  return [
    `M ${x + cr} ${y}`,
    `H ${x + w - cr}`,
    `Q ${x + w} ${y} ${x + w} ${y + cr}`,
    `V ${y + h}`,
    `H ${x}`,
    `V ${y + cr}`,
    `Q ${x} ${y} ${x + cr} ${y}`,
    'Z',
  ].join(' ');
}

function useContainerSize(ref) {
  const [size, setSize]  = useState({ width: 0, height: 0 });
  const timerRef         = useRef(null);
  const pendingRef       = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ width: el.offsetWidth, height: el.offsetHeight });
    const ro = new ResizeObserver(([entry]) => {
      pendingRef.current = entry.contentRect;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const r = pendingRef.current;
        if (r) setSize({ width: r.width, height: r.height });
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return size;
}

function DeptTooltip({ active, payload, label, c, dark }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, e) => s + (e.value || 0), 0);
  return (
    <div style={{
      background: dark ? '#1e293b' : '#ffffff',
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: dark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 12px 32px rgba(0,0,0,0.12)',
      minWidth: 155, fontSize: 12, pointerEvents: 'none',
    }}>
      <div style={{
        fontWeight: 700, color: c.text, marginBottom: 8, fontSize: 13,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
      }}>
        {label}
      </div>
      {SEGMENTS.map(seg => {
        const val = payload.find(p => p.dataKey === seg.key)?.value ?? 0;
        return (
          <div key={seg.key} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 16, marginBottom: 4,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: seg.color, flexShrink: 0, display: 'inline-block',
              }} />
              <span style={{ color: c.sub }}>{seg.label}</span>
            </span>
            <span style={{ fontWeight: 600, color: c.text }}>{val}</span>
          </div>
        );
      })}
      <div style={{
        marginTop: 7, paddingTop: 7, borderTop: `1px solid ${c.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: c.sub, fontWeight: 500, fontSize: 11 }}>Total</span>
        <span style={{ fontWeight: 700, color: c.text, fontSize: 13 }}>{total}</span>
      </div>
    </div>
  );
}

function DeptTick({
  x, y, payload,
  highlightedDepts, isDeptDrillActive, isDimmingActive,
  subColor, onTickClick, canDrill,
}) {
  const dept     = payload?.value ?? '';
  const isActive = !isDimmingActive || highlightedDepts.has(dept);
  const label    = dept.length > 11 ? dept.slice(0, 10) + '…' : dept;

  const textFill = isDeptDrillActive
    ? (isActive ? '#3b82f6' : subColor + '55')
    : isDimmingActive
      ? (isActive ? subColor : subColor + '55')
      : subColor;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={canDrill ? (e) => onTickClick(dept, e) : undefined}
    >
      <text
        x={0} y={0} dy={11}
        textAnchor="middle"
        fontSize={10}
        fontWeight={isDeptDrillActive && isActive ? 700 : 400}
        fill={textFill}
        style={{ transition: 'fill 0.25s' }}
      >
        {label}
      </text>
    </g>
  );
}

function EmptyState({ c }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
      color: c.sub, fontSize: 12,
    }}>
      <span style={{ fontSize: 24, opacity: 0.3 }}>▦</span>
      No department data
    </div>
  );
}

const DeptProjectsCard = memo(function DeptProjectsCard({
  c, dark, isEditing,
  projects    = [],
  allProjects,
  drillDown, onDrillDown,
}) {
  const canDrill = !!onDrillDown && !isEditing;

  // ── Normalise drillDown ────────────────────────────────────────────────
  const drillArr = useMemo(
    () => !drillDown ? [] : Array.isArray(drillDown) ? drillDown : [...drillDown],
    [drillDown],
  );

  // ── Parse pair keys ────────────────────────────────────────────────────
  // Bar-segment clicks emit `pair-{dept}||{segKey}` compound keys so that
  // each (dept, health) selection is self-contained with no cross-product.
  const activePairs = useMemo(() => {
    const s = new Set();
    drillArr.forEach(k => {
      if (k.startsWith('pair-')) s.add(k.slice(5)); // stores "dept||segKey"
    });
    return s;
  }, [drillArr]);

  // ── Derive dept / health sets for tick + legend highlighting ───────────
  const activeDepts = useMemo(() => {
    const s = new Set();
    activePairs.forEach(p => s.add(p.split(PAIR_SEP)[0]));
    drillArr.forEach(k => { if (k.startsWith('dept-')) s.add(k.slice(5)); });
    return s;
  }, [activePairs, drillArr]);

  const activeHealthKeys = useMemo(() => {
    const s = new Set();
    activePairs.forEach(p => s.add(p.split(PAIR_SEP)[1]));
    drillArr.forEach(k => { if (k.startsWith('health-')) s.add(k.slice(7)); });
    return s;
  }, [activePairs, drillArr]);

  const isPairDrillActive   = activePairs.size > 0;
  const isDeptDrillActive   = activeDepts.size > 0;
  const isHealthDrillActive = activeHealthKeys.size > 0;

  const hasExternalDrillKeys = useMemo(
    () => drillArr.some(k =>
      !k.startsWith('dept-') &&
      !k.startsWith('health-') &&
      !k.startsWith('pair-'),
    ),
    [drillArr],
  );

  // ── Raw chart data ─────────────────────────────────────────────────────
  const rawChartData = useMemo(() => {
    const source = allProjects ?? projects;
    const map = {};
    source.forEach(p => {
      const dept   = p['IT Department'] || 'Unknown';
      const health = parseHealth(p['Overall Health']);
      if (!map[dept]) map[dept] = { dept, onTrack: 0, atRisk: 0, offTrack: 0 };
      if (health === 'onTrack' || health === 'atRisk' || health === 'offTrack') {
        map[dept][health]++;
      } else {
        map[dept].atRisk++;
      }
    });
    return Object.values(map)
      .map(d => ({ ...d, total: d.onTrack + d.atRisk + d.offTrack }))
      .sort((a, b) => b.total - a.total);
  }, [allProjects, projects]);

  // ── High-water mark + external-filter detection ────────────────────────
  const snapshotRef = useRef([]);
  const maxCountRef = useRef(0);

  if (!allProjects && projects.length > maxCountRef.current) {
    maxCountRef.current = projects.length;
  }

  const isExternallyFiltered = allProjects
    ? projects.length < allProjects.length
    : maxCountRef.current > 0 && projects.length < maxCountRef.current;

  // ── Stable snapshot ────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (allProjects) {
      snapshotRef.current = rawChartData;
      return rawChartData;
    }
    const shouldFreeze =
      isPairDrillActive || isDeptDrillActive || isHealthDrillActive ||
      hasExternalDrillKeys || isExternallyFiltered;
    if (!shouldFreeze) snapshotRef.current = rawChartData;
    return snapshotRef.current.length > 0 ? snapshotRef.current : rawChartData;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects, rawChartData, isPairDrillActive, isDeptDrillActive, isHealthDrillActive, hasExternalDrillKeys, isExternallyFiltered]);

  // ── Dept + health highlights ───────────────────────────────────────────
  const visibleDepts = useMemo(() => {
    const s = new Set();
    projects.forEach(p => s.add(p['IT Department'] || 'Unknown'));
    return s;
  }, [projects]);

  const visibleHealthSegs = useMemo(() => {
    // In pair mode, SegShape checks pairs directly — no cross-product needed.
    if (isPairDrillActive) return null;
    if (isHealthDrillActive) return activeHealthKeys;
    if (!isExternallyFiltered && !hasExternalDrillKeys) return null;
    const s = new Set();
    projects.forEach(p => {
      const h      = parseHealth(p['Overall Health']);
      const mapped = (h === 'onTrack' || h === 'atRisk' || h === 'offTrack') ? h : 'atRisk';
      s.add(mapped);
    });
    return s.size > 0 ? s : null;
  }, [isPairDrillActive, isHealthDrillActive, activeHealthKeys, isExternallyFiltered, hasExternalDrillKeys, projects]);

  const isDimmingActive =
    isPairDrillActive || isDeptDrillActive || isHealthDrillActive ||
    hasExternalDrillKeys || isExternallyFiltered;

  const highlightedDepts = useMemo(() => {
    if (isDeptDrillActive) return activeDepts;
    if (isDimmingActive)   return visibleDepts;
    return new Set();
  }, [isDeptDrillActive, activeDepts, isDimmingActive, visibleDepts]);

  // ── Per-segment filtered counts (for proportional fill) ───────────────
  const filteredCounts = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      const dept   = p['IT Department'] || 'Unknown';
      const health = parseHealth(p['Overall Health']);
      const key    = (health === 'onTrack' || health === 'atRisk' || health === 'offTrack')
        ? health : 'atRisk';
      if (!map[dept]) map[dept] = { onTrack: 0, atRisk: 0, offTrack: 0 };
      map[dept][key]++;
    });
    return map;
  }, [projects]);

  const snapshotCountsMap = useMemo(() => {
    const map = {};
    chartData.forEach(d => {
      map[d.dept] = { onTrack: d.onTrack, atRisk: d.atRisk, offTrack: d.offTrack };
    });
    return map;
  }, [chartData]);

  // ── Click coordination ─────────────────────────────────────────────────
  const pendingClickRef = useRef(null);

  // ── Shape render ref — updated every render, read by stable shapes ─────
  const shapeRenderRef = useRef(null);
  shapeRenderRef.current = {
    isDimmingActive, highlightedDepts, visibleHealthSegs,
    filteredCounts, snapshotCountsMap,
    activePairs,        // ← pair mode: shapes check exact (dept, segKey) pairs
    canDrill,
    pendingClickRef,
  };

  // ── Stable shape components ────────────────────────────────────────────
  const segmentShapes = useMemo(
    () => SEGMENTS.map((seg, idx) => {
      const isTopSeg = idx === SEGMENTS.length - 1;

      return function SegShape(props) {
        const { x, y, width, height, fill } = props;
        const dept = props.dept;

        if (!width || !height || height <= 0 || width <= 0) return null;

        const {
          isDimmingActive: da,
          highlightedDepts: hd,
          visibleHealthSegs: vhs,
          filteredCounts: fc,
          snapshotCountsMap: sc,
          activePairs: ap,
          canDrill: cd,
          pendingClickRef: pcr,
        } = shapeRenderRef.current;

        const handleClick = !cd ? undefined : (event) => {
          const multi = !!(event?.ctrlKey || event?.metaKey);
          pcr.current = { type: 'bar', dept, segKey: seg.key, multi };
        };

        const TS = { transition: 'opacity 0.25s' };

        const fullBar = (op) => isTopSeg
          ? <path d={roundedTopPath(x, y, width, height, BAR_RADIUS)} fill={fill} opacity={op} style={TS} onClick={handleClick} />
          : <rect x={x} y={y} width={width} height={height} fill={fill} opacity={op} style={TS} onClick={handleClick} />;

        if (!da) return fullBar(1);

        // ── Pair mode: each (dept, segKey) is checked as an atomic pair ────
        // This is the key fix — no cross-product between dept and health sets.
        if (ap.size > 0) {
          const pairId = `${dept}${PAIR_SEP}${seg.key}`;
          if (!ap.has(pairId)) return fullBar(DIM_OPACITY);

          // Pair is active — show with proportional fill
          const filtered = fc[dept]?.[seg.key] ?? 0;
          const total    = sc[dept]?.[seg.key] ?? 0;
          const fraction = total > 0 ? Math.min(1, filtered / total) : 1;

          if (fraction >= 1) return fullBar(1);

          const sliverH = fraction > 0
            ? Math.min(height, Math.max(2, Math.round(fraction * height)))
            : 0;
          const dimH = height - sliverH;

          return (
            <g onClick={handleClick}>
              {dimH > 0 && (isTopSeg
                ? <path d={roundedTopPath(x, y, width, dimH, BAR_RADIUS)} fill={fill} opacity={DIM_OPACITY} style={TS} />
                : <rect x={x} y={y} width={width} height={dimH} fill={fill} opacity={DIM_OPACITY} style={TS} />
              )}
              {sliverH > 0 && (
                <rect x={x} y={y + dimH} width={width} height={sliverH} fill={fill} opacity={1} style={TS} />
              )}
              {sliverH > 0 && dimH > 0 && (
                <line x1={x} x2={x + width} y1={y + dimH} y2={y + dimH}
                  stroke="white" strokeOpacity={0.35} strokeWidth={1} />
              )}
            </g>
          );
        }

        // ── Legacy dept + health cross-product mode (tick / legend clicks) ─
        const deptOk   = hd.has(dept);
        const healthOk = !vhs || vhs.has(seg.key);

        if (!deptOk || !healthOk) return fullBar(DIM_OPACITY);

        const filtered = fc[dept]?.[seg.key] ?? 0;
        const total    = sc[dept]?.[seg.key] ?? 0;
        const fraction = total > 0 ? Math.min(1, filtered / total) : 1;

        if (fraction >= 1) return fullBar(1);

        const sliverH = fraction > 0
          ? Math.min(height, Math.max(2, Math.round(fraction * height)))
          : 0;
        const dimH = height - sliverH;

        return (
          <g onClick={handleClick}>
            {dimH > 0 && (isTopSeg
              ? <path d={roundedTopPath(x, y, width, dimH, BAR_RADIUS)} fill={fill} opacity={DIM_OPACITY} style={TS} />
              : <rect x={x} y={y} width={width} height={dimH} fill={fill} opacity={DIM_OPACITY} style={TS} />
            )}
            {sliverH > 0 && (
              <rect x={x} y={y + dimH} width={width} height={sliverH} fill={fill} opacity={1} style={TS} />
            )}
            {sliverH > 0 && dimH > 0 && (
              <line x1={x} x2={x + width} y1={y + dimH} y2={y + dimH}
                stroke="white" strokeOpacity={0.35} strokeWidth={1} />
            )}
          </g>
        );
      };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Live refs ──────────────────────────────────────────────────────────
  const activePairsRef        = useRef(activePairs);
  activePairsRef.current      = activePairs;
  const drillArrRef           = useRef(drillArr);   // raw array for isOnlyThis check
  drillArrRef.current         = drillArr;
  const activeDeptRef         = useRef(activeDepts);
  activeDeptRef.current       = activeDepts;
  const activeHealthKeysRef   = useRef(activeHealthKeys);
  activeHealthKeysRef.current = activeHealthKeys;
  const onDrillDownRef        = useRef(onDrillDown);
  onDrillDownRef.current      = onDrillDown;

  // ── X-axis tick click ──────────────────────────────────────────────────
  const handleDeptClick = useCallback((dept, event) => {
    if (!canDrill) return;
    event?.stopPropagation?.();
    const multi = !!(event?.ctrlKey || event?.metaKey);
    onDrillDown('dept-' + dept, multi);
  }, [canDrill, onDrillDown]);

  // ── Legend click ───────────────────────────────────────────────────────
  const handleHealthLegendClick = useCallback((segKey, event) => {
    if (!canDrill) return;
    const multi = !!(event?.ctrlKey || event?.metaKey);
    onDrillDown('health-' + segKey, multi);
  }, [canDrill, onDrillDown]);

  // ── BarChart area click — single execution point via microtask ─────────
  const handleChartAreaClick = useCallback((data, event) => {
    if (!canDrill) return;
    const dept = data?.activeLabel;
    if (!dept) return;
    const multi = !!(event?.ctrlKey || event?.metaKey);

    if (!pendingClickRef.current) {
      pendingClickRef.current = { type: 'area', dept, multi };
    }

    queueMicrotask(() => {
      const click = pendingClickRef.current;
      if (!click) return;
      pendingClickRef.current = null;

      const ap   = activePairsRef.current;
      const raw  = drillArrRef.current;
      const ads  = activeDeptRef.current;
      const ahk  = activeHealthKeysRef.current;
      const fire = onDrillDownRef.current;

      if (click.type === 'bar') {
        const { dept: d, segKey: sk, multi: m } = click;
        const pairKey = `pair-${d}${PAIR_SEP}${sk}`;

        if (m) {
          // Ctrl+click: toggle only this pair — never touches any other pair.
          fire(pairKey, true);
        } else {
          // Non-ctrl: if drillDown is exactly this one pair key, deselect it.
          // Otherwise, replace everything with just this pair.
          const isOnlyThis = raw.length === 1 && raw[0] === pairKey;
          if (isOnlyThis) {
            fire(pairKey, true);   // toggle off → drillDown becomes empty
          } else {
            fire(pairKey, false);  // clear all, then select only this pair
          }
        }

      } else {
        // type === 'area': background column click, no specific health segment
        const { dept: d, multi: m } = click;
        if (!m && ads.has(d) && ahk.size > 0) {
          ahk.forEach(hk => fire('health-' + hk, true));
        } else {
          fire('dept-' + d, m);
        }
      }
    });
  }, [canDrill]);

  // ── Container size (debounced) ─────────────────────────────────────────
  const chartAreaRef = useRef(null);
  const { width: areaW, height: areaH } = useContainerSize(chartAreaRef);
  const chartW = Math.max(0, areaW - PAD.l - PAD.r);
  const chartH = Math.max(0, areaH - PAD.t - PAD.b);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .dept-chart-wrap *:focus,
        .dept-chart-wrap *:focus-visible { outline: none !important; }
        .dept-chart-drillable,
        .dept-chart-drillable * { cursor: pointer !important; }
      `}</style>

      <DragBar
        title="Projects by Department"
        textColor={c.sub}
        borderColor={c.border}
        isEditing={isEditing}
      />

      {/* ── Legend ── */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center',
        padding: '3px 12px 0', flexShrink: 0,
      }}>
        {SEGMENTS.map(seg => {
          const isSegActive = !isHealthDrillActive || activeHealthKeys.has(seg.key);
          return (
            <div
              key={seg.key}
              onClick={canDrill ? (e) => handleHealthLegendClick(seg.key, e) : undefined}
              title={canDrill ? `Click to filter ${seg.label} · Ctrl+click to multi-select` : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 10.5,
                color: isHealthDrillActive
                  ? (isSegActive ? c.text : c.sub + '55')
                  : c.sub,
                fontWeight: isSegActive && isHealthDrillActive ? 600 : 400,
                cursor: canDrill ? 'pointer' : 'default',
                userSelect: 'none',
                padding: '2px 6px',
                borderRadius: 5,
                border: `1px solid ${isSegActive && isHealthDrillActive
                  ? seg.color + '70'
                  : 'transparent'}`,
                background: isSegActive && isHealthDrillActive
                  ? seg.color + '12'
                  : 'transparent',
                transition: 'color 0.2s, border-color 0.2s, background 0.2s',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: seg.color,
                opacity: isHealthDrillActive ? (isSegActive ? 1 : 0.25) : 1,
                display: 'inline-block', flexShrink: 0,
                transition: 'opacity 0.2s',
              }} />
              {seg.label}
            </div>
          );
        })}
      </div>

      {/* ── Chart area ── */}
      <div
        ref={chartAreaRef}
        className={`dept-chart-wrap${canDrill ? ' dept-chart-drillable' : ''}`}
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}
      >
        <AnimatePresence mode="wait">
          {chartData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, display: 'flex' }}
            >
              <EmptyState c={c} />
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute', inset: 0,
                padding: `${PAD.t}px ${PAD.r}px ${PAD.b}px ${PAD.l}px`,
              }}
            >
              {chartW > 0 && chartH > 0 && (
                <BarChart
                  width={chartW}
                  height={chartH}
                  data={chartData}
                  margin={{ top: 4, right: 12, bottom: 2, left: 4 }}
                  barCategoryGap="32%"
                  onClick={canDrill ? handleChartAreaClick : undefined}
                >
                  <XAxis
                    dataKey="dept"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={(props) => (
                      <DeptTick
                        {...props}
                        highlightedDepts={highlightedDepts}
                        isDeptDrillActive={isDeptDrillActive}
                        isDimmingActive={isDimmingActive}
                        subColor={c.sub}
                        onTickClick={handleDeptClick}
                        canDrill={canDrill}
                      />
                    )}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: c.sub }}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip
                    content={(props) => <DeptTooltip {...props} c={c} dark={dark} />}
                    cursor={{
                      fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      radius: 4,
                    }}
                  />

                  {SEGMENTS.map((seg, idx) => (
                    <Bar
                      key={seg.key}
                      dataKey={seg.key}
                      name={seg.label}
                      stackId="stack"
                      fill={seg.color}
                      isAnimationActive={false}
                      shape={segmentShapes[idx]}
                    />
                  ))}
                </BarChart>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

export default DeptProjectsCard;
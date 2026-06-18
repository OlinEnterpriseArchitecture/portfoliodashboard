import { useMemo, useCallback, useRef, useState, useLayoutEffect, memo } from 'react';
import {
  DataGrid,
  useGridApiRef,
  GridColumnMenu,
  gridFilteredSortedRowIdsSelector,
} from '@mui/x-data-grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MenuItem, ListItemIcon } from '@mui/material';
import { Square, CheckSquare } from 'lucide-react';
import { DragBar } from './shared';
import { parseHealth } from '../../data/usePortfolioData';

const HEALTH_META = {
  onTrack:  { label: 'On Track',  color: '#16a34a', bg: 'rgba(22,163,74,0.13)'  },
  atRisk:   { label: 'At Risk',   color: '#d97706', bg: 'rgba(217,119,6,0.13)'  },
  offTrack: { label: 'Off Track', color: '#dc2626', bg: 'rgba(220,38,38,0.13)'  },
  unknown:  { label: '—',         color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const HEALTH_ORDER  = { onTrack: 0, atRisk: 1, offTrack: 2, unknown: 3 };
const healthSortCmp = (a, b) => HEALTH_ORDER[parseHealth(a)] - HEALTH_ORDER[parseHealth(b)];

const HealthPill = ({ value }) => {
  const m = HEALTH_META[parseHealth(value)];
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 5,
      background: m.bg, color: m.color,
      fontWeight: 700, fontSize: 11,
      whiteSpace: 'nowrap', display: 'inline-block', lineHeight: '18px',
    }}>
      {m.label}
    </span>
  );
};

const HealthDot = ({ value }) => {
  const m = HEALTH_META[parseHealth(value)];
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10,
      borderRadius: '50%', background: m.color,
    }} />
  );
};

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
});
const fmtUSD = v =>
  v == null || v === '' || v === '—' ? '—' : usd.format(Number(v));

const DOT_FLEX = 1.0;
const DOT_MIN  = 72;

const LEFT = { align: 'left', headerAlign: 'left' };

// ── Debounced container-size hook ─────────────────────────────────────────────
//
// MUI DataGrid runs its own internal ResizeObserver on its root element.
// Every time that element's dimensions change it recalculates column widths,
// row virtualisation, scroll geometry, and more — completely outside React's
// render cycle, so React.memo cannot block it.
//
// The fix mirrors what DeptProjectsCard does for Recharts: give DataGrid an
// inner wrapper with a *debounced* explicit pixel size.  During a drag the
// wrapper size is frozen, so DataGrid's ResizeObserver sees zero changes.
// The grid "snaps" to the new size 150 ms after the handle pauses/releases,
// which is imperceptible at normal resize speeds.
//
const RESIZE_DEBOUNCE_MS = 150;

function useContainerSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const timerRef        = useRef(null);
  const pendingRef      = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Synchronous initial read — correct size before first paint.
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
  // ref.current is stable after mount — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return size;
}

// ─────────────────────────────────────────────────────────────────────────────

function buildColumns(c) {
  const cell = (color = c.sub) => ({ value }) => (
    <span style={{
      fontSize: 14, color,
      overflow: 'hidden', textOverflow: 'ellipsis',
      whiteSpace: 'nowrap', display: 'block', width: '100%',
    }}>
      {value ?? '—'}
    </span>
  );

  const moneyCell = (getColor) => ({ value }) => {
    const n = Number(value);
    const color = getColor ? getColor(n, value) : c.sub;
    return (
      <span style={{ fontSize: 14, color, whiteSpace: 'nowrap' }}>
        {fmtUSD(value)}
      </span>
    );
  };

  return [
    {
      field: 'name', headerName: 'Project',
      flex: 2.5, minWidth: 160,
      ...LEFT,
      renderCell: ({ value }) => (
        <span style={{
          fontWeight: 600, fontSize: 14, color: c.text,
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', display: 'block', width: '100%',
        }}>
          {value}
        </span>
      ),
    },
    { field: 'stage',        headerName: 'Stage',         flex: 1.3, minWidth: 100, ...LEFT, renderCell: cell() },
    { field: 'pm',           headerName: 'PM',            flex: 1.6, minWidth: 120, ...LEFT, renderCell: cell() },
    { field: 'itDepartment', headerName: 'IT Department', flex: 1.6, minWidth: 120, ...LEFT, renderCell: cell() },
    {
      field: 'overallHealth', headerName: 'Overall',
      flex: 1.1, minWidth: 88,
      ...LEFT,
      sortComparator: healthSortCmp,
      renderCell: ({ value }) => <HealthPill value={value} />,
    },
    {
      field: 'budgetHealth', headerName: 'Budget',
      flex: DOT_FLEX, minWidth: DOT_MIN,
      ...LEFT,
      sortComparator: healthSortCmp,
      renderCell: ({ value }) => <HealthDot value={value} />,
    },
    {
      field: 'scheduleHealth', headerName: 'Schedule',
      flex: DOT_FLEX, minWidth: DOT_MIN,
      ...LEFT,
      sortComparator: healthSortCmp,
      renderCell: ({ value }) => <HealthDot value={value} />,
    },
    {
      field: 'resourceHealth', headerName: 'Resources',
      flex: DOT_FLEX, minWidth: DOT_MIN,
      ...LEFT,
      sortComparator: healthSortCmp,
      renderCell: ({ value }) => <HealthDot value={value} />,
    },
    {
      field: 'scopeHealth', headerName: 'Scope',
      flex: DOT_FLEX, minWidth: DOT_MIN,
      ...LEFT,
      sortComparator: healthSortCmp,
      renderCell: ({ value }) => <HealthDot value={value} />,
    },
    {
      field: 'risks', headerName: 'Risks',
      flex: 0.85, minWidth: 65,
      type: 'number',
      ...LEFT,
      renderCell: ({ value }) => (
        <span style={{ fontWeight: 600, fontSize: 14,
          color: value > 0 ? '#f59e0b' : c.sub }}>{value}</span>
      ),
    },
    {
      field: 'issues', headerName: 'Issues',
      flex: 0.85, minWidth: 65,
      type: 'number',
      ...LEFT,
      renderCell: ({ value }) => (
        <span style={{ fontWeight: 600, fontSize: 14,
          color: value > 0 ? '#ef4444' : c.sub }}>{value}</span>
      ),
    },
    { field: 'carNumber',       headerName: 'CAR #',        flex: 1.1, minWidth: 90,  ...LEFT, renderCell: cell() },
    { field: 'budgetTotal',     headerName: 'Total Budget', flex: 1.4, minWidth: 110, type: 'number', ...LEFT, renderCell: moneyCell() },
    { field: 'budgetSpent',     headerName: 'Actuals',      flex: 1.3, minWidth: 100, type: 'number', ...LEFT, renderCell: moneyCell() },
    { field: 'budgetETC',       headerName: 'ETC',          flex: 1.3, minWidth: 100, type: 'number', ...LEFT, renderCell: moneyCell() },
    { field: 'budgetEAC',       headerName: 'EAC',          flex: 1.3, minWidth: 100, type: 'number', ...LEFT, renderCell: moneyCell() },
    { field: 'budgetRemaining', headerName: 'Remaining',    flex: 1.3, minWidth: 100, type: 'number', ...LEFT, renderCell: moneyCell() },
    {
      field: 'budgetVariance', headerName: 'Variance',
      flex: 1.3, minWidth: 100,
      type: 'number',
      ...LEFT,
      renderCell: moneyCell((n, v) =>
        v == null || v === '' || v === '—' ? c.sub
          : n < 0 ? '#ef4444'
          : n > 0 ? '#16a34a'
          : c.sub
      ),
    },
  ];
}

function buildPortalTheme(c, dark) {
  const line    = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const hover   = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const bdColor = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.20)';

  return createTheme({
    palette: {
      mode:       dark ? 'dark' : 'light',
      background: { paper: c.card, default: c.card },
      text:       { primary: c.text, secondary: c.sub },
      divider:    line,
      action:     { hover, selected: hover, focus: hover },
      primary:    { main: c.sub },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: `${c.card} !important`,
            backgroundImage: 'none !important',
            color:           c.text,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          paper: {
            backgroundColor: `${c.card} !important`,
            backgroundImage: 'none',
            color:     c.text,
            border:    `1px solid ${line}`,
            boxShadow: dark
              ? '0 4px 24px rgba(0,0,0,0.55)'
              : '0 4px 24px rgba(0,0,0,0.15)',
          },
          panelWrapper:            { background: c.card, color: c.text },
          panelHeader:             { background: c.card, borderBottom: `1px solid ${line}`, padding: '8px 12px' },
          panelContent:            { background: c.card },
          panelFooter:             { background: c.card, borderTop: `1px solid ${line}` },
          columnsManagement:       { background: c.card },
          columnsManagementHeader: { background: c.card },
          columnsManagementRow: {
            color: c.text,
            '&:hover': { background: hover },
          },
          columnsManagementFooter: { background: c.card },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: 15, color: c.text,
            '&:hover':              { backgroundColor: hover },
            '&.Mui-selected':       { backgroundColor: hover },
            '&.Mui-selected:hover': { backgroundColor: hover },
          },
        },
      },
      MuiListItemIcon:    { styleOverrides: { root: { color: c.sub, minWidth: 36 } } },
      MuiDivider:         { styleOverrides: { root: { borderColor: line } } },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: bdColor,
            '&.Mui-checked':  { color: c.sub },
            '&.Mui-disabled': { opacity: 0.4 },
          },
        },
      },
      MuiFormControlLabel: { styleOverrides: { label: { color: c.text, fontSize: 13 } } },
      MuiInputBase: {
        styleOverrides: {
          root:  { color: c.text, fontSize: 13, backgroundColor: inputBg, borderRadius: 6 },
          input: {
            color: c.text,
            '&::placeholder': { color: c.sub, opacity: 1 },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline':             { borderColor: bdColor },
            '&:hover .MuiOutlinedInput-notchedOutline':       { borderColor: c.sub },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.sub },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontSize: 13 },
          text: { color: c.sub },
        },
      },
      MuiSelect:    { styleOverrides: { select: { color: c.text }, icon: { color: c.sub } } },
      MuiSvgIcon:   { styleOverrides: { root: { color: c.sub } } },
      MuiIconButton: {
        styleOverrides: { root: { color: c.sub, '&.Mui-disabled': { opacity: 0.3 } } },
      },
      MuiFormLabel: { styleOverrides: { root: { color: c.sub, fontSize: 12 } } },
      MuiTablePagination: {
        styleOverrides: {
          root:          { color: c.sub, fontSize: 12, overflow: 'hidden' },
          toolbar:       { minHeight: 48, paddingRight: 8, alignItems: 'center' },
          selectLabel:   { color: c.sub, fontSize: 12 },
          displayedRows: { color: c.sub, fontSize: 12 },
          select:        { color: c.sub },
          selectIcon:    { color: c.sub },
          actions:       { color: c.sub },
        },
      },
    },
  });
}

function buildSx(c, dark, canDrill) {
  const line    = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const sep     = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const sepHv   = dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)';
  const thumb   = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const thumbHv = dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)';

  return {
    border:     'none',
    height:     '100%',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize:   14,
    color:      c.text,
    background: c.card,

    '& .MuiDataGrid-main':                      { background: c.card },
    '& .MuiDataGrid-virtualScroller':           { background: c.card },
    '& .MuiDataGrid-virtualScrollerContent':    { background: c.card },
    '& .MuiDataGrid-virtualScrollerRenderZone': { background: c.card },
    '& .MuiDataGrid-topContainer':              { background: c.card },
    '& .MuiDataGrid-bottomContainer':           { background: c.card },
    '& .MuiDataGrid-filler':                    { background: c.card, borderTop: 'none' },
    '& .MuiDataGrid-scrollbarFiller':           { background: c.card, borderTop: 'none' },
    '& .MuiDataGrid-scrollbarFiller--header':   {
      background:   c.card,
      borderBottom: `1px solid ${line}`,
    },
    '& .MuiDataGrid-withBorderColor': { borderColor: `${line} !important` },

    '& .MuiDataGrid-columnHeader': {
      background:  c.card,
      borderRight: 'none',
    },
    '& .MuiDataGrid-columnHeaders': {
      background:   c.card,
      borderBottom: `1px solid ${line}`,
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight:    700,
      fontSize:      12,
      textTransform: 'none',
      letterSpacing: '0.01em',
      color:         c.sub,
    },
    '& .MuiDataGrid-iconSeparator':   { color: sep },
    '& .MuiDataGrid-columnSeparator': {
      color: sep,
      '&:hover': { color: sepHv },
    },
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-sortIcon':       { color: c.sub },
    '& .MuiDataGrid-menuIconButton': { color: c.sub },

    '& .MuiDataGrid-cell': {
      borderBottom:   `1px solid ${line}`,
      borderRight:    'none',
      color:          c.text,
      fontSize:       14,
      justifyContent: 'flex-start !important',
      '&:focus, &:focus-within': { outline: 'none' },
    },
    '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderTitleContainer': {
      flexDirection: 'row',
    },
    '& .MuiDataGrid-cell--withRightBorder':         { borderRight: 'none' },
    '& .MuiDataGrid-columnHeader--withRightBorder': { borderRight: 'none' },

    '& .MuiDataGrid-scrollbar--vertical':   { display: 'none' },
    '& .MuiDataGrid-scrollbar--horizontal': { display: 'none' },
    '& .MuiDataGrid-virtualScroller': {
      scrollbarWidth: 'thin',
      scrollbarColor: `${thumb} transparent`,
    },
    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar':        { width: 5, height: 5 },
    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track':  { background: 'transparent' },
    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-corner': { background: 'transparent' },
    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb':  {
      background: thumb, borderRadius: 4,
    },
    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
      background: thumbHv,
    },

    '& .MuiDataGrid-row': {
      cursor:     canDrill ? 'pointer' : 'default',
      transition: 'opacity 0.2s',
      '&:nth-of-type(odd)':  { background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)' },
      '&:nth-of-type(even)': { background: 'transparent' },
      '&:hover': {
        background: `${dark ? 'rgba(255,255,255,0.075)' : 'rgba(0,0,0,0.05)'} !important`,
      },
      '&.Mui-selected, &.Mui-selected:hover': { background: 'transparent !important' },
    },

    '& .MuiDataGrid-row.row--active': {
      background: `${dark ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.08)'} !important`,
      boxShadow:  'inset 3px 0 0 #3b82f6',
    },
    '& .MuiDataGrid-row.row--active:hover': {
      background: `${dark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.14)'} !important`,
    },
    '& .MuiDataGrid-row.row--dimmed': {
      opacity: 0.35,
    },

    '& .MuiDataGrid-menu .MuiPaper-root': {
      background:      `${c.card} !important`,
      backgroundImage: 'none !important',
      color:           c.text,
      border:          `1px solid ${line}`,
      boxShadow: dark
        ? '0 4px 20px rgba(0,0,0,0.5)'
        : '0 4px 20px rgba(0,0,0,0.12)',
    },
    '& .MuiDataGrid-menu .MuiMenuItem-root': {
      fontSize: 13, color: c.text,
      '&:hover': { background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
    },
    '& .MuiDataGrid-menu .MuiListItemIcon-root': { color: c.sub },
    '& .MuiDataGrid-menu .MuiDivider-root':      { borderColor: line },

    '& .MuiDataGrid-panelWrapper':            { background: c.card },
    '& .MuiDataGrid-panel':                   { background: c.card },
    '& .MuiDataGrid-panelHeader':             { background: c.card },
    '& .MuiDataGrid-panelContent':            { background: c.card },
    '& .MuiDataGrid-panelFooter':             { background: c.card, borderTop: `1px solid ${line}` },
    '& .MuiDataGrid-columnsManagement':       { background: c.card },
    '& .MuiDataGrid-columnsManagementHeader': { background: c.card },

    '& .MuiDataGrid-footerContainer': {
      borderTop:      `1px solid ${line}`,
      background:     c.card,
      minHeight:      48,
      overflow:       'hidden',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'flex-end',
      paddingRight:   8,
    },
    '& .MuiTablePagination-root':          { color: c.sub, fontSize: 12, overflow: 'hidden' },
    '& .MuiTablePagination-toolbar':       { minHeight: 48, paddingRight: 8, alignItems: 'center' },
    '& .MuiTablePagination-selectLabel':   { fontSize: 12, color: c.sub },
    '& .MuiTablePagination-displayedRows': { fontSize: 12, color: c.sub },
    '& .MuiTablePagination-select':        { color: c.sub },
    '& .MuiTablePagination-selectIcon':    { color: c.sub },
    '& .MuiTablePagination-actions':       { color: c.sub },
    '& .MuiIconButton-root': {
      color: c.sub,
      '&.Mui-disabled': { opacity: 0.3 },
    },
    '& .MuiDataGrid-overlay': { background: c.card, color: c.sub },
  };
}

// ── Custom column menu ─────────────────────────────────────────────────────────

const SelectAllItem = ({ onClick, apiRef, onSelectAll, drillDown }) => {
  const getFilteredIds = () => {
    try {
      return gridFilteredSortedRowIdsSelector(apiRef).map(id => String(id));
    } catch {
      return [...(apiRef?.current?.getRowModels?.() ?? new Map()).keys()].map(String);
    }
  };

  const count = (() => {
    try { return gridFilteredSortedRowIdsSelector(apiRef).length; } catch { return 0; }
  })();

  const selectionCount = drillDown?.size ?? 0;
  const allSelected    = count > 0 && selectionCount === count;

  const handleToggle = () => {
    onSelectAll(allSelected ? [] : getFilteredIds());
    onClick?.();
  };

  return (
    <MenuItem onClick={handleToggle}>
      <ListItemIcon>
        {allSelected
          ? <CheckSquare size={18} />
          : <Square      size={18} />
        }
      </ListItemIcon>
      <span style={{ fontSize: 14 }}>
        Select all{count > 0 ? ` (${count})` : ''}
      </span>
    </MenuItem>
  );
};

SelectAllItem.displayOrder = 40;

function CustomColumnMenu({ hideMenu, colDef, onSelectAll, apiRef, drillDown, ...rest }) {
  return (
    <GridColumnMenu
      hideMenu={hideMenu}
      colDef={colDef}
      {...rest}
      slots={{ columnMenuUserItem: SelectAllItem }}
      slotProps={{
        columnMenuUserItem: {
          displayOrder: 40,
          apiRef,
          onSelectAll,
          drillDown,
        },
      }}
    />
  );
}

// ── Shallow-equal helper for the `c` color-config object ──────────────────────

function shallowEqualObj(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(k => a[k] === b[k]);
}

function propsAreEqual(prev, next) {
  return (
    shallowEqualObj(prev.c, next.c) &&
    prev.dark                    === next.dark                    &&
    prev.isEditing               === next.isEditing               &&
    prev.projects                === next.projects                &&
    prev.drillDown               === next.drillDown               &&
    prev.onDrillDown             === next.onDrillDown             &&
    prev.onSelectAll             === next.onSelectAll             &&
    prev.onVisibleProjectsChange === next.onVisibleProjectsChange
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

const MatrixCard = memo(function MatrixCard({
  c, dark, isEditing,
  projects = [],
  drillDown,
  onDrillDown,
  onSelectAll,
  onVisibleProjectsChange,
}) {
  const canDrill    = !!onDrillDown && !isEditing;
  const apiRef      = useGridApiRef();
  const resizeGuard = useRef(false);

  // ── Debounced container size ───────────────────────────────────────────
  // The outer div flexes to fill the RGL card cell. We measure it with a
  // debounced ResizeObserver and give DataGrid an inner wrapper with explicit
  // pixel dimensions.  During a drag the inner wrapper size is frozen, so
  // DataGrid's own ResizeObserver sees zero changes and skips its expensive
  // column-width / virtualisation recalculations entirely.
  const outerRef                         = useRef(null);
  const { width: stableW, height: stableH } = useContainerSize(outerRef);

  const rows = useMemo(() =>
    projects.map((p, i) => ({
      id:              p['Project ID']               ?? i,
      name:            p['Name']                     ?? '—',
      stage:           p['Current Stage Name']       ?? '—',
      pm:              p['Project Manager']          ?? '—',
      itDepartment:    p['IT Department']            ?? '—',
      carNumber:       p['CAR #'] ?? p['CAR Number'] ?? '—',
      overallHealth:   p['Overall Health']           ?? '',
      budgetHealth:    p['Budget Health']            ?? '',
      scheduleHealth:  p['Schedule Health']          ?? '',
      resourceHealth:  p['Resources Health']         ?? '',
      scopeHealth:     p['Scope Health']             ?? '',
      risks:           p['Active Risks']             ?? 0,
      issues:          p['Active Issues']            ?? 0,
      budgetTotal:     p['Total Budget']     ?? p['Approved Budget']        ?? null,
      budgetSpent:     p['Actuals']          ?? p['Budget Spent']           ?? null,
      budgetETC:       p['ETC']              ?? p['Estimate to Complete']   ?? null,
      budgetEAC:       p['EAC']              ?? p['Estimate at Completion'] ?? null,
      budgetRemaining: p['Budget Remaining'] ?? p['Remaining Budget']       ?? null,
      budgetVariance:  p['Budget Variance']  ?? p['Variance']               ?? null,
    })),
  [projects]);

  const columns     = useMemo(() => buildColumns(c), [c]);
  const sx          = useMemo(() => buildSx(c, dark, canDrill), [c, dark, canDrill]);
  const portalTheme = useMemo(() => buildPortalTheme(c, dark), [c, dark]);

  const onColumnWidthChange = useCallback(({ colDef: changed }) => {
    if (resizeGuard.current) return;
    const api = apiRef.current;
    if (!api) return;
    resizeGuard.current = true;
    api.getVisibleColumns().forEach(col => {
      if (col.field !== changed.field) {
        api.setColumnWidth(col.field, col.computedWidth ?? col.minWidth ?? 80);
      }
    });
    resizeGuard.current = false;
  }, [apiRef]);

  const handleRowClick = useCallback((params, event) => {
    if (!canDrill) return;
    const id = String(params.row.id);
    if (event?.ctrlKey || event?.metaKey) {
      const current = drillDown ? [...drillDown] : [];
      if (drillDown?.has(id)) {
        onSelectAll(current.filter(x => x !== id));
      } else {
        onSelectAll([...current, id]);
      }
      return;
    }
    onDrillDown(id);
  }, [canDrill, onDrillDown, onSelectAll, drillDown]);

  const getRowClassName = useCallback(({ row }) => {
    if (!drillDown || drillDown.size === 0) return '';
    return drillDown.has(String(row.id)) ? 'row--active' : 'row--dimmed';
  }, [drillDown]);

  return (
    <ThemeProvider theme={portalTheme}>
      <DragBar
        title="Project Health Matrix"
        textColor={c.sub}
        borderColor={c.border}
        isEditing={isEditing}
      />

      {/*
        outerRef measures the available space.
        The inner div uses the debounced stableW/stableH as explicit pixel
        dimensions, isolating DataGrid from the 60 fps resize events RGL
        produces while the drag handle is moving.
      */}
      <div
        ref={outerRef}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <div style={{
          width:    stableW > 0 ? stableW : '100%',
          height:   stableH > 0 ? stableH : '100%',
          overflow: 'hidden',
        }}>
          <DataGrid
            apiRef={apiRef}
            rows={rows}
            columns={columns}
            rowHeight={42}
            columnHeaderHeight={42}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            onColumnWidthChange={onColumnWidthChange}
            onRowClick={handleRowClick}
            getRowClassName={getRowClassName}
            slots={{ columnMenu: CustomColumnMenu }}
            slotProps={{
              columnMenu: {
                onSelectAll: isEditing ? undefined : onSelectAll,
                apiRef,
                drillDown,
              },
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              columns: {
                columnVisibilityModel: {
                  carNumber:       false,
                  budgetTotal:     false,
                  budgetSpent:     false,
                  budgetETC:       false,
                  budgetEAC:       false,
                  budgetRemaining: false,
                  budgetVariance:  false,
                },
              },
            }}
            sx={sx}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}, propsAreEqual);

export default MatrixCard;
import DASHBOARD_DEFAULTS from '../config/dashboardDefaults.json';

// ── Download utility ──────────────────────────────────────────────────────────

export function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'dashboardDefaults.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Storage keys ──────────────────────────────────────────────────────────────

export const ADMIN_KEY = 'portfoliohq-dashboard-defaults';
export const PREF_KEY  = 'portfoliohq-dashboard-prefs';

// ── Values sourced from dashboardDefaults.json ────────────────────────────────

export const ADMIN_PASSWORD  = DASHBOARD_DEFAULTS.adminPassword;
export const INITIAL_LAYOUTS = DASHBOARD_DEFAULTS.initialLayouts;

export const PREF_DEFAULTS = {
  rowHeight:             DASHBOARD_DEFAULTS.rowHeightDefault,
  layouts:               null,
  hasUserOverride:       false,
  pipelineVisibleStages: DASHBOARD_DEFAULTS.pipelineVisibleStages,
  healthDimView:         DASHBOARD_DEFAULTS.healthDimView,
  visibleCardIds:        DASHBOARD_DEFAULTS.visibleCardIds,
  defaultsVersion:       DASHBOARD_DEFAULTS.defaultsVersion,
  defaultGlobalFilters:  DASHBOARD_DEFAULTS.defaultGlobalFilters        ?? [],
  hiddenGlobalFilters:   DASHBOARD_DEFAULTS.defaultHiddenGlobalFilters  ?? [],
};

// ── Build a ready-to-download dashboardDefaults.json object ──────────────────

export function buildDefaultsJson({ defaultGlobalFilters, defaultHiddenGlobalFilters } = {}) {
  return {
    ...DASHBOARD_DEFAULTS,
    defaultGlobalFilters:       defaultGlobalFilters       ?? DASHBOARD_DEFAULTS.defaultGlobalFilters       ?? [],
    defaultHiddenGlobalFilters: defaultHiddenGlobalFilters ?? DASHBOARD_DEFAULTS.defaultHiddenGlobalFilters ?? [],
    defaultsVersion:            (DASHBOARD_DEFAULTS.defaultsVersion ?? 0) + 1,
  };
}

// ── Persistence functions ─────────────────────────────────────────────────────

export function loadAdminDefaults() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) {
      const parsed   = JSON.parse(raw);                          // parse once
      const localVer = parsed.defaultsVersion ?? 0;
      const jsonVer  = DASHBOARD_DEFAULTS.defaultsVersion ?? 0;
      if (jsonVer > localVer) {
        localStorage.removeItem(ADMIN_KEY);
        return null;
      }
      return { ...PREF_DEFAULTS, ...parsed };
    }
  } catch {}
  return null;
}

export function saveAdminDefaults(p) {
  try {
    const existing   = loadAdminDefaults();
    const currentVer = existing?.defaultsVersion ?? DASHBOARD_DEFAULTS.defaultsVersion;
    const newVersion = currentVer + 1;
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ ...p, defaultsVersion: newVersion }));
    return newVersion;
  } catch {}
  return DASHBOARD_DEFAULTS.defaultsVersion;
}

export function clearPrefs() {
  try { localStorage.removeItem(PREF_KEY); } catch {}
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const stored    = JSON.parse(raw);
      const adminDefs = loadAdminDefaults();
      const adminVer  = adminDefs?.defaultsVersion ?? DASHBOARD_DEFAULTS.defaultsVersion;
      const userVer   = stored.defaultsVersion ?? 0;

      if (userVer < adminVer) {
        clearPrefs();
        return adminDefs ?? { ...PREF_DEFAULTS };
      }

      const parsed = { ...PREF_DEFAULTS, ...stored };

      // ── Filter defaults are authoritative from the JSON config or saved admin
      // overrides — never from user-level PREF_KEY data, which may be stale,
      // empty, or pre-date the filter configuration being added to the JSON.
      const filterSrc = adminDefs ?? PREF_DEFAULTS;
      parsed.defaultGlobalFilters = filterSrc.defaultGlobalFilters ?? [];
      parsed.hiddenGlobalFilters  = filterSrc.hiddenGlobalFilters  ?? [];

      return parsed;
    }
  } catch {}
  const adminDefs = loadAdminDefaults();
  return adminDefs ?? { ...PREF_DEFAULTS };
}

export function savePrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}
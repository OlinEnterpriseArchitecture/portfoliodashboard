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
  defaultGlobalFilters:  DASHBOARD_DEFAULTS.defaultGlobalFilters ?? [],
};

// ── Persistence functions ─────────────────────────────────────────────────────

export function loadAdminDefaults() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) {
      const parsed   = JSON.parse(raw);
      const localVer = parsed.defaultsVersion ?? 0;
      const jsonVer  = DASHBOARD_DEFAULTS.defaultsVersion ?? 0;
      if (jsonVer > localVer) {
        localStorage.removeItem(ADMIN_KEY);
        return null;
      }
      return { ...PREF_DEFAULTS, ...JSON.parse(raw) };
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
      const parsed    = { ...PREF_DEFAULTS, ...JSON.parse(raw) };
      const adminDefs = loadAdminDefaults();
      const adminVer  = adminDefs?.defaultsVersion ?? DASHBOARD_DEFAULTS.defaultsVersion;
      const userVer   = parsed.defaultsVersion     ?? 0;
      if (userVer < adminVer) {
        clearPrefs();
        return adminDefs ?? { ...PREF_DEFAULTS };
      }
      return parsed;
    }
  } catch {}
  const adminDefs = loadAdminDefaults();
  if (adminDefs) return adminDefs;
  return { ...PREF_DEFAULTS };
}

export function savePrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}
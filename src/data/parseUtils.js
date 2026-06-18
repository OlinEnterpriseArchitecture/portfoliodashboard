export function parseHealth(str) {
  if (!str) return 'unknown';
  if (str.includes('On Track'))  return 'onTrack';
  if (str.includes('At Risk'))   return 'atRisk';
  if (str.includes('Off Track')) return 'offTrack';
  return 'unknown';
}

export function parseStage(stageName) {
  if (!stageName) return 'other';
  const s = stageName.toLowerCase().trim();
  if (s === 'intake' || s === 'intake gate approval' || s === 'intake gate 2') return 'intake';
  if (s === 'it steer co approval')                                             return 'steerCo';
  if (s === 'execution' || s === 'execution gate approval')                     return 'execution';
  if (s === 'project close out' || s === 'project close out gate approval')     return 'closeout';
  return 'other';
}

export function parseType(typeStr) {
  if (!typeStr) return 'other';
  const t = typeStr.toLowerCase().trim();
  if (t === 'implementation') return 'implementation';
  if (t === 'discovery')      return 'discovery';
  return 'other';
}

export const HEALTH_SCORE = { onTrack: 100, atRisk: 50, offTrack: 0, unknown: 50 };

export const HEALTH_DIMS = [
  { key: 'Overall Health',   label: 'Overall'   },
  { key: 'Budget Health',    label: 'Budget'    },
  { key: 'Schedule Health',  label: 'Schedule'  },
  { key: 'Resources Health', label: 'Resources' },
  { key: 'Scope Health',     label: 'Scope'     },
];
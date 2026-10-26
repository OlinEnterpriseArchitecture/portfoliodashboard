import {
  FIELD_OVERALL_HEALTH,
  FIELD_BUDGET_HEALTH,
  FIELD_SCHEDULE_HEALTH,
  FIELD_RESOURCE_HEALTH,
  FIELD_SCOPE_HEALTH,
} from './fieldConstants';

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
  if (s === 'intake' || s === 'intake gate 2' || s === 'intake gate approval')   return 'intake';
  if (s === 'it steer co approval')                                              return 'steerCo';
  if (s === 'execution' || s === 'execution gate approval')                      return 'execution';
  if (
    s === 'project close out' ||
    s === 'project close out gate approval' ||
    s === 'finish'
  )                                                                              return 'closeout';
  return 'other';
} 

export function parseType(typeStr) {
  if (!typeStr) return 'other';
  const t = typeStr.toLowerCase().trim();
  if (t === 'implementation') return 'implementation';
  if (t === 'discovery')      return 'discovery';
  return 'other';
}

export function parseStatus(str) {
  if (!str) return 'unknown';
  const s = str.toLowerCase();
  if (s.includes('active'))    return 'active';
  if (s.includes('closed'))    return 'closed';
  if (s.includes('on hold'))   return 'onHold';
  if (s.includes('cancelled')) return 'cancelled';
  return 'unknown';
}

export function parseState(val) {
  if (val === 0 || val === '0') return 'active';
  if (val === 1 || val === '1') return 'inactive';
  return 'unknown';
}

export const HEALTH_SCORE = { onTrack: 100, atRisk: 50, offTrack: 0, unknown: 50 };

export const HEALTH_DIMS = [
  { key: FIELD_OVERALL_HEALTH,   label: 'Overall'   },
  { key: FIELD_BUDGET_HEALTH,    label: 'Budget'    },
  { key: FIELD_SCHEDULE_HEALTH,  label: 'Schedule'  },
  { key: FIELD_RESOURCE_HEALTH,  label: 'Resources' },
  { key: FIELD_SCOPE_HEALTH,     label: 'Scope'     },
];
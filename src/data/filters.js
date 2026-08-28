import { parseHealth, parseStage, parseType, parseStatus } from './parseUtils';

export const NULL_SENTINEL = '__null__';

export const DRILL_FILTERS = {
  onTrack:  p => parseHealth(p['Overall Health']) === 'onTrack',
  atRisk:   p => parseHealth(p['Overall Health']) === 'atRisk',
  offTrack: p => parseHealth(p['Overall Health']) === 'offTrack',

  'health-onTrack':  p => parseHealth(p['Overall Health']) === 'onTrack',
  'health-atRisk':   p => parseHealth(p['Overall Health']) === 'atRisk',
  'health-offTrack': p => parseHealth(p['Overall Health']) === 'offTrack',

  openRisks:  p => (p['Active Risks']  ?? 0) > 0,
  openIssues: p => (p['Active Issues'] ?? 0) > 0,

  'stage-intake':    p => parseStage(p['Current Stage Name']) === 'intake',
  'stage-steerCo':   p => parseStage(p['Current Stage Name']) === 'steerCo',
  'stage-execution': p => parseStage(p['Current Stage Name']) === 'execution',
  'stage-closeout':  p => parseStage(p['Current Stage Name']) === 'closeout',

  implementation: p => parseType(p['Project Type']) === 'implementation',
  discovery:      p => parseType(p['Project Type']) === 'discovery',
};

export const DRILL_LABELS = {
  onTrack:           'On Track',
  atRisk:            'At Risk',
  offTrack:          'Off Track',
  openRisks:         'Has Active Risks',
  openIssues:        'Has Active Issues',
  'stage-intake':    'Intake',
  'stage-steerCo':   'IT Steer Co',
  'stage-execution': 'Execution',
  'stage-closeout':  'Close Out',
  implementation:    'Implementation',
  discovery:         'Discovery',
};

export const HEALTH_OPTIONS = [
  { value: 'onTrack',  label: 'On Track'  },
  { value: 'atRisk',   label: 'At Risk'   },
  { value: 'offTrack', label: 'Off Track' },
];

export const STAGE_OPTIONS = [
  { value: 'intake',    label: 'Intake'      },
  { value: 'steerCo',  label: 'IT Steer Co' },
  { value: 'execution', label: 'Execution'  },
  { value: 'closeout',  label: 'Close Out'  },
];

export const TYPE_OPTIONS = [
  { value: 'implementation', label: 'Implementation' },
  { value: 'discovery',      label: 'Discovery'      },
];

export const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active'    },
  { value: 'closed',    label: 'Closed'    },
  { value: 'onHold',    label: 'On Hold'   },
  { value: 'cancelled', label: 'Cancelled' },
];

export const GLOBAL_FILTER_DEFS = [
  { fieldKey: 'Project Status',     label: 'Project Status',   type: 'status' },
  { fieldKey: 'Overall Health',     label: 'Overall Health',   type: 'health' },
  { fieldKey: 'Budget Health',      label: 'Budget Health',    type: 'health' },
  { fieldKey: 'Schedule Health',    label: 'Schedule Health',  type: 'health' },
  { fieldKey: 'Resources Health',   label: 'Resources Health', type: 'health' },
  { fieldKey: 'Scope Health',       label: 'Scope Health',     type: 'health' },
  { fieldKey: 'Current Stage Name', label: 'Stage',            type: 'stage'  },
  { fieldKey: 'Project Type',       label: 'Project Type',     type: 'type'   },
  { fieldKey: 'IT Department',      label: 'Department',       type: 'enum'   },
  { fieldKey: 'Portfolio',          label: 'Portfolio',        type: 'enum'   },
  { fieldKey: 'Project Manager',    label: 'Project Manager',  type: 'enum'   },
  { fieldKey: 'Locations Impacted', label: 'Location',         type: 'enum'   },
];

export function applyGlobalFilters(projects, activeFilters) {
  if (!activeFilters || activeFilters.length === 0) return projects;
  return projects.filter(p =>
    activeFilters.every(f => {
      if (!f.values || f.values.length === 0) return true;

      const rawIsNull = p[f.fieldKey] == null || p[f.fieldKey] === '';

      if (f.type === 'health') {
        const parsed = parseHealth(p[f.fieldKey]);
        return f.values.some(v => v === NULL_SENTINEL ? rawIsNull : v === parsed);
      }
      if (f.type === 'stage') {
        const parsed = parseStage(p[f.fieldKey]);
        return f.values.some(v => v === NULL_SENTINEL ? rawIsNull : v === parsed);
      }
      if (f.type === 'type') {
        const parsed = parseType(p[f.fieldKey]);
        return f.values.some(v => v === NULL_SENTINEL ? rawIsNull : v === parsed);
      }
      if (f.type === 'status') {
        const parsed = parseStatus(p[f.fieldKey]);
        return f.values.some(v => v === NULL_SENTINEL ? rawIsNull : v === parsed);
      }
      // enum
      return f.values.some(v => v === NULL_SENTINEL ? rawIsNull : v === p[f.fieldKey]);
    })
  );
}
import { LayoutDashboard, FolderOpen, BarChart3, Settings } from 'lucide-react';

export const ALL_CARD_IDS = [
  'total-projects', 'active-alerts', 'pipeline', 'project-type',
  'health', 'health-dim', 'budget-snapshot', 'matrix',
  'dept-projects',
];

export const CARD_META = {
  'total-projects':  { title: 'Total Projects',   description: 'Portfolio KPI summary'             },
  'active-alerts':   { title: 'Active Alerts',    description: 'Issues and risks overview'         },
  'pipeline':        { title: 'Pipeline',          description: 'Stage-based project funnel'       },
  'project-type':    { title: 'Project Type',      description: 'Projects by category'             },
  'health':          { title: 'Portfolio Health',  description: 'Overall health distribution'      },
  'health-dim':      { title: 'Health Dimensions', description: 'Health by dimension or dept'      },
  'budget-snapshot': { title: 'Budget Snapshot',   description: 'Portfolio financial overview'     },
  'matrix':          { title: 'Project Matrix',    description: 'Full project health matrix table' },
  'dept-projects':   { title: 'Dept Projects',     description: 'Project count & health by department' },
};

export const DRILL_KEY_LABELS = {
  // Bare health keys (HealthCard, TotalProjectsCard, etc.)
  onTrack:        'On Track',
  atRisk:         'At Risk',
  offTrack:       'Off Track',

  // Prefixed health keys (DeptProjectsCard segment clicks)
  'health-onTrack':  'On Track',
  'health-atRisk':   'At Risk',
  'health-offTrack': 'Off Track',

  openRisks:      'Open Risks',
  openIssues:     'Open Issues',
  closeout:       'Closeout',
  execution:      'Execution',
  steerCo:        'SteerCo',
  intake:         'Intake',
  implementation: 'Implementation',
  discovery:      'Discovery',
};

export const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'projects', label: 'Projects', icon: FolderOpen      },
      { id: 'reports',  label: 'Reports',  icon: BarChart3       },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', icon: Settings }],
  },
];

export const PAGE_META = {
  overview: { title: 'Portfolio Dashboard', sub: 'Last updated: —'                        },
  projects: { title: 'Projects',            sub: 'Manage and track your project portfolio' },
  reports:  { title: 'Reports',             sub: 'Analytics and reporting'                 },
  settings: { title: 'Settings',            sub: 'Configure your workspace'                },
};

export const COMING_SOON_CONFIG = {
  projects: { Icon: FolderOpen, desc: 'The Projects module is under development and will be available in a future release.' },
  reports:  { Icon: BarChart3,  desc: 'The Reports module is under development and will be available in a future release.'  },
  settings: { Icon: Settings,   desc: 'The Settings module is under development and will be available in a future release.' },
};

export const ROW_HEIGHT_MIN = 20;
export const ROW_HEIGHT_MAX = 72;

export function computeResponsiveRowHeight() {
  return Math.min(
    ROW_HEIGHT_MAX,
    Math.max(ROW_HEIGHT_MIN, Math.round((window.innerHeight - 273) / 14)),
  );
}
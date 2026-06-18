import rawData from '../../data/json/All_Projects.json';
import { parseHealth, parseStage, HEALTH_SCORE, HEALTH_DIMS } from './parseUtils';
import { computeKPIs } from './kpi';

// Re-export parseHealth so any card that already imports it from here keeps working.
export { parseHealth } from './parseUtils';

const DEPT_FIELD   = 'IT Department';
const HEALTH_DEPTS = ['GIS', 'HR', 'I&O', 'ITSBO', 'Ent Solutions', 'M&E', 'Winchester'];

function buildHealthRow(label, subset) {
  const avg = subset.length === 0 ? 0 : Math.round(
    subset.reduce((s, p) => s + HEALTH_SCORE[parseHealth(p['Overall Health'])], 0) / subset.length,
  );
  return {
    dim:      label,
    score:    avg,
    onTrack:  subset.filter(p => parseHealth(p['Overall Health']) === 'onTrack').length,
    atRisk:   subset.filter(p => parseHealth(p['Overall Health']) === 'atRisk').length,
    offTrack: subset.filter(p => parseHealth(p['Overall Health']) === 'offTrack').length,
    unknown:  subset.filter(p => parseHealth(p['Overall Health']) === 'unknown').length,
    total:    subset.length,
  };
}

export function usePortfolioData() {
  const rootKey  = Object.keys(rawData)[0];
  const all      = rawData[rootKey] ?? [];
  const projects = all.filter(p => p['Project Status'] === 'Active');

  // KPI is now owned by computeKPIs — the hook is just a convenient initial call.
  // The dashboard will re-derive KPI via computeKPIs(filteredProjects) whenever
  // a drill-down filter is active, so this value is only used as the unfiltered default.
  const KPI = computeKPIs(projects);

  // healthByDim and healthByDept intentionally stay unfiltered — they show the
  // full portfolio dimension breakdown regardless of any active drill-down.
  const healthByDim = HEALTH_DIMS.map(({ key, label }) => {
    const avg = projects.length === 0 ? 0 : Math.round(
      projects.reduce((s, p) => s + HEALTH_SCORE[parseHealth(p[key])], 0) / projects.length,
    );
    return {
      dim:      label,
      score:    avg,
      onTrack:  projects.filter(p => parseHealth(p[key]) === 'onTrack').length,
      atRisk:   projects.filter(p => parseHealth(p[key]) === 'atRisk').length,
      offTrack: projects.filter(p => parseHealth(p[key]) === 'offTrack').length,
      unknown:  projects.filter(p => parseHealth(p[key]) === 'unknown').length,
      total:    projects.length,
    };
  });

  const healthByDept = HEALTH_DEPTS.map(dept => {
    const subset = projects.filter(p => p[DEPT_FIELD] === dept);
    return buildHealthRow(dept, subset);
  });

  return { KPI, healthByDim, healthByDept, projects, lastUpdated: rawData?._meta?.lastUpdated ?? null };
}
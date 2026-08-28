import rawData from '../../data/json/projects.json';
import { parseHealth, parseStage, HEALTH_SCORE, HEALTH_DIMS } from './parseUtils';
import { computeKPIs } from './kpi';
import {
  FIELD_IT_DEPARTMENT,
  FIELD_PROJECT_STATUS,
  FIELD_OVERALL_HEALTH,
} from '../data/fieldConstants';

export { parseHealth } from './parseUtils';

const HEALTH_DEPTS = ['GIS', 'HR', 'I&O', 'ITSBO', 'Ent Solutions', 'M&E', 'Winchester'];

function buildHealthRow(label, subset) {
  const avg = subset.length === 0 ? 0 : Math.round(
    subset.reduce((s, p) => s + HEALTH_SCORE[parseHealth(p[FIELD_OVERALL_HEALTH])], 0) / subset.length,
  );
  return {
    dim:      label,
    score:    avg,
    onTrack:  subset.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'onTrack').length,
    atRisk:   subset.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'atRisk').length,
    offTrack: subset.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'offTrack').length,
    unknown:  subset.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'unknown').length,
    total:    subset.length,
  };
}

export function usePortfolioData() {
  const rootKey = Object.keys(rawData)[0];
  const all     = rawData[rootKey] ?? [];

  const projects = all;

  const KPI = computeKPIs(projects);

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
    const subset = projects.filter(p => p[FIELD_IT_DEPARTMENT] === dept);
    return buildHealthRow(dept, subset);
  });

  return {
    KPI,
    healthByDim,
    healthByDept,
    projects,
    lastUpdated: rawData?._meta?.lastUpdated ?? null,
  };
}
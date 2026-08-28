import { parseHealth, parseStage, parseType, HEALTH_SCORE, HEALTH_DIMS } from './parseUtils';
import {
  FIELD_OVERALL_HEALTH,
  FIELD_ACTIVE_RISKS,
  FIELD_ACTIVE_ISSUES,
  FIELD_CURRENT_STAGE,
  FIELD_PROJECT_TYPE,
} from './fieldConstants';

export function computeKPIs(projects = []) {
  const onTrack  = projects.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'onTrack').length;
  const atRisk   = projects.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'atRisk').length;
  const offTrack = projects.filter(p => parseHealth(p[FIELD_OVERALL_HEALTH]) === 'offTrack').length;

  const openRisks  = projects.reduce((n, p) => n + (p[FIELD_ACTIVE_RISKS]  ?? 0), 0);
  const openIssues = projects.reduce((n, p) => n + (p[FIELD_ACTIVE_ISSUES] ?? 0), 0);

  const inIntake    = projects.filter(p => parseStage(p[FIELD_CURRENT_STAGE]) === 'intake').length;
  const inSteerCo   = projects.filter(p => parseStage(p[FIELD_CURRENT_STAGE]) === 'steerCo').length;
  const inExecution = projects.filter(p => parseStage(p[FIELD_CURRENT_STAGE]) === 'execution').length;
  const inCloseOut  = projects.filter(p => parseStage(p[FIELD_CURRENT_STAGE]) === 'closeout').length;

  const implementation = projects.filter(p => parseType(p[FIELD_PROJECT_TYPE]) === 'implementation').length;
  const discovery      = projects.filter(p => parseType(p[FIELD_PROJECT_TYPE]) === 'discovery').length;

  const healthScore = projects.length === 0 ? 0 : Math.round(
    projects.reduce((sum, p) => sum + HEALTH_SCORE[parseHealth(p[FIELD_OVERALL_HEALTH])], 0) /
    projects.length,
  );

  return {
    total: projects.length,
    onTrack, atRisk, offTrack,
    openRisks, openIssues,
    healthScore,
    inExecution, inSteerCo, inIntake, inCloseOut,
    implementation, discovery,
  };
}
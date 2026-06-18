import { parseHealth, parseStage, parseType, HEALTH_SCORE, HEALTH_DIMS } from './parseUtils';

/**
 * Derives the same KPI object shape that usePortfolioData previously computed
 * inline, but from an arbitrary array of projects. The dashboard calls this
 * with filteredProjects so every card automatically reflects the active filter.
 */
export function computeKPIs(projects = []) {
  const onTrack  = projects.filter(p => parseHealth(p['Overall Health']) === 'onTrack').length;
  const atRisk   = projects.filter(p => parseHealth(p['Overall Health']) === 'atRisk').length;
  const offTrack = projects.filter(p => parseHealth(p['Overall Health']) === 'offTrack').length;

  const openRisks  = projects.reduce((n, p) => n + (p['Active Risks']  ?? 0), 0);
  const openIssues = projects.reduce((n, p) => n + (p['Active Issues'] ?? 0), 0);

  const inIntake    = projects.filter(p => parseStage(p['Current Stage Name']) === 'intake').length;
  const inSteerCo   = projects.filter(p => parseStage(p['Current Stage Name']) === 'steerCo').length;
  const inExecution = projects.filter(p => parseStage(p['Current Stage Name']) === 'execution').length;
  const inCloseOut  = projects.filter(p => parseStage(p['Current Stage Name']) === 'closeout').length;

  const implementation = projects.filter(p => parseType(p['Project Type']) === 'implementation').length;
  const discovery      = projects.filter(p => parseType(p['Project Type']) === 'discovery').length;

  const healthScore = projects.length === 0 ? 0 : Math.round(
    projects.reduce((sum, p) => {
      const dimAvg =
        HEALTH_DIMS.reduce((s, d) => s + HEALTH_SCORE[parseHealth(p[d.key])], 0) /
        HEALTH_DIMS.length;
      return sum + dimAvg;
    }, 0) / projects.length,
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
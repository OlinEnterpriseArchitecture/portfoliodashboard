import budgetJson from '../../data/json/recent-budget.json';

export function useBudgetData() {
  return { data: budgetJson, lastUpdated: budgetJson?.lastUpdated ?? null };
}
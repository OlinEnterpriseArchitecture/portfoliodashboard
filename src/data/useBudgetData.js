import budgetJson from '../../data/json/recent-budget.json';

export function useBudgetData() {
  return { data: budgetJson, lastUpdated: budgetJson?._meta?.lastUpdated ?? null };
}
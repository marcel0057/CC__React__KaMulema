const STORAGE_KEY = "ka-molema-disease-analysis-history";

export function getAnalysisHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveAnalysisHistory(item) {
  const nextHistory = [item, ...getAnalysisHistory()].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export function clearAnalysisHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function verifyReports(reports) {
  if (!Array.isArray(reports) || reports.length === 0) {
    throw new Error('Playtest failed: no runs were recorded.');
  }
  for (const report of reports) {
    if (!Array.isArray(report.checks) || report.checks.length === 0) {
      throw new Error('Playtest failed: a run recorded no checks.');
    }
    if (report.failure || report.errors.length || report.external.length || Object.keys(report.problems || {}).length) {
      throw new Error('Playtest failed: check, page, console, request, or layout errors were recorded.');
    }
  }
}

export type CoverageMetric = "lines";

export interface LcovSimpleRatchetConfig {
  minimumCoverage: number;
  metric?: CoverageMetric;
  lcovPath?: string;
  ratchetAbove?: number | string;
}

export interface CoverageResult {
  metric: CoverageMetric;
  covered: number;
  found: number;
  percentage: number;
}

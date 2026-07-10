export interface Metric {
  [key: string]: string;
}

export type Labels = Metric;

export type QueryResult =
  | {
      resultType: 'vector';
      result: InstantSample[];
    }
  | {
      resultType: 'matrix';
      result: RangeSamples[];
    }
  | {
      resultType: 'scalar';
      result: SampleValue;
    }
  | {
      resultType: 'string';
      result: string;
    };

export interface InstantSample {
  metric: Metric;
  value?: SampleValue;
  histogram?: HistogramValue;
}

export interface RangeSamples {
  metric: Metric;
  values?: SampleValue[];
  histograms?: HistogramValue[];
}

export type SampleValue = [number, string];

export interface SampleHistogram {
  count: string;
  sum: string;
  buckets?: SampleHistogramBucket[];
}

// [boundaryRule, leftBoundary, rightBoundary, countInBucket].
export type SampleHistogramBucket = [number, string, string, string];

export type HistogramValue = [number, SampleHistogram];

export interface MergedSamplePoint {
  timestamp: number;
  value?: string;
  histogram?: SampleHistogram;
}

// Merges the float samples and histogram samples of a series (which have
// disjoint timestamps) into a single list ordered by timestamp.
export const mergeSamplePoints = (values?: SampleValue[], histograms?: HistogramValue[]): MergedSamplePoint[] => {
  return [
    ...(values || []).map(([timestamp, value]): MergedSamplePoint => ({ timestamp, value })),
    ...(histograms || []).map(([timestamp, histogram]): MergedSamplePoint => ({ timestamp, histogram })),
  ].sort((a, b) => a.timestamp - b.timestamp);
};

const leftDelim = (boundaryRule: number): string => (boundaryRule === 3 || boundaryRule === 1 ? '[' : '(');
const rightDelim = (boundaryRule: number): string => (boundaryRule === 3 || boundaryRule === 0 ? ']' : ')');

export const bucketRangeString = ([boundaryRule, left, right]: SampleHistogramBucket): string => {
  return `${leftDelim(boundaryRule)}${left} -> ${right}${rightDelim(boundaryRule)}`;
};

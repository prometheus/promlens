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
  value: SampleValue;
}

export interface RangeSamples {
  metric: Metric;
  values: SampleValue[];
}

export type SampleValue = [number, string];

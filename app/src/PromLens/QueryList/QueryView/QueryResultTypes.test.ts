import { HistogramValue, SampleValue, bucketRangeString, mergeSamplePoints } from './QueryResultTypes';

describe('mergeSamplePoints', () => {
  const histogram = {
    count: '10',
    sum: '3.3',
    buckets: [[0, '1', '2', '10']] as [number, string, string, string][],
  };

  it('returns an empty list when both inputs are missing', () => {
    expect(mergeSamplePoints(undefined, undefined)).toEqual([]);
  });

  it('converts float samples only', () => {
    const values: SampleValue[] = [
      [1, '1.5'],
      [2, '2.5'],
    ];
    expect(mergeSamplePoints(values, undefined)).toEqual([
      { timestamp: 1, value: '1.5' },
      { timestamp: 2, value: '2.5' },
    ]);
  });

  it('converts histogram samples only', () => {
    const histograms: HistogramValue[] = [[3, histogram]];
    expect(mergeSamplePoints(undefined, histograms)).toEqual([{ timestamp: 3, histogram }]);
  });

  it('merges float and histogram samples ordered by timestamp', () => {
    const values: SampleValue[] = [
      [1, '1.5'],
      [4, '4.5'],
    ];
    const histograms: HistogramValue[] = [
      [2, histogram],
      [5, histogram],
    ];
    expect(mergeSamplePoints(values, histograms)).toEqual([
      { timestamp: 1, value: '1.5' },
      { timestamp: 2, histogram },
      { timestamp: 4, value: '4.5' },
      { timestamp: 5, histogram },
    ]);
  });
});

describe('bucketRangeString', () => {
  it('formats an open-left bucket', () => {
    expect(bucketRangeString([0, '1', '2', '5'])).toEqual('(1 -> 2]');
  });

  it('formats an open-right bucket', () => {
    expect(bucketRangeString([1, '-2', '-1', '5'])).toEqual('[-2 -> -1)');
  });

  it('formats an open-both bucket', () => {
    expect(bucketRangeString([2, '1', '2', '5'])).toEqual('(1 -> 2)');
  });

  it('formats a closed-both bucket', () => {
    expect(bucketRangeString([3, '-0.001', '0.001', '5'])).toEqual('[-0.001 -> 0.001]');
  });
});

import { parseDuration, formatDuration } from './utils';

describe('parseDuration and formatDuration', () => {
  describe('should parse and format durations correctly', () => {
    const tests: { input: string; output: number; expectedString?: string }[] = [
      {
        input: '0',
        output: 0,
        expectedString: '0s',
      },
      {
        input: '0w',
        output: 0,
        expectedString: '0s',
      },
      {
        input: '0s',
        output: 0,
      },
      {
        input: '324ms',
        output: 324,
      },
      {
        input: '3s',
        output: 3 * 1000,
      },
      {
        input: '5m',
        output: 5 * 60 * 1000,
      },
      {
        input: '1h',
        output: 60 * 60 * 1000,
      },
      {
        input: '4d',
        output: 4 * 24 * 60 * 60 * 1000,
      },
      {
        input: '4d1h',
        output: 4 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000,
      },
      {
        input: '14d',
        output: 14 * 24 * 60 * 60 * 1000,
        expectedString: '2w',
      },
      {
        input: '3w',
        output: 3 * 7 * 24 * 60 * 60 * 1000,
      },
      {
        input: '3w2d1h',
        output: 3 * 7 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
        expectedString: '23d1h',
      },
      {
        input: '1y2w3d4h5m6s7ms',
        output:
          1 * 365 * 24 * 60 * 60 * 1000 +
          2 * 7 * 24 * 60 * 60 * 1000 +
          3 * 24 * 60 * 60 * 1000 +
          4 * 60 * 60 * 1000 +
          5 * 60 * 1000 +
          6 * 1000 +
          7,
        expectedString: '382d4h5m6s7ms',
      },
    ];

    tests.forEach((t) => {
      it(t.input, () => {
        const d = parseDuration(t.input);
        expect(d).toEqual(t.output);
        expect(formatDuration(d)).toEqual(t.expectedString || t.input);
      });
    });
  });

  it('should fail to parse invalid durations', () => {
    const tests = ['1', '1y1m1d', '-1w', '1.5d', 'd', ''];

    tests.forEach((t) => {
      expect(() => parseDuration(t)).toThrowError();
    });
  });
});

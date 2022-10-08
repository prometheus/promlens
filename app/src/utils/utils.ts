export const formatDuration = (d: number): string => {
  let ms = d;
  let r = '';
  if (ms === 0) {
    return '0s';
  }

  const f = (unit: string, mult: number, exact: boolean) => {
    if (exact && ms % mult !== 0) {
      return;
    }
    const v = Math.floor(ms / mult);
    if (v > 0) {
      r += `${v}${unit}`;
      ms -= v * mult;
    }
  };

  // Only format years and weeks if the remainder is zero, as it is often
  // easier to read 90d than 12w6d.
  f('y', 1000 * 60 * 60 * 24 * 365, true);
  f('w', 1000 * 60 * 60 * 24 * 7, true);

  f('d', 1000 * 60 * 60 * 24, false);
  f('h', 1000 * 60 * 60, false);
  f('m', 1000 * 60, false);
  f('s', 1000, false);
  f('ms', 1, false);

  return r;
};

export const parseDuration = (durationStr: string): number => {
  if (durationStr === '') {
    throw new Error('empty duration string');
  }
  if (durationStr === '0') {
    // Allow 0 without a unit.
    return 0;
  }

  const durationRE = new RegExp('^(([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?$');
  const matches = durationStr.match(durationRE);
  if (!matches) {
    throw new Error('invalid duration string');
  }

  let dur = 0;

  // Parse the match at pos `pos` in the regex and use `mult` to turn that
  // into ms, then add that value to the total parsed duration.
  const m = (pos: number, mult: number) => {
    if (matches[pos] === undefined) {
      return;
    }
    const n = parseInt(matches[pos]);
    dur += n * mult;
  };

  m(2, 1000 * 60 * 60 * 24 * 365); // y
  m(4, 1000 * 60 * 60 * 24 * 7); // w
  m(6, 1000 * 60 * 60 * 24); // d
  m(8, 1000 * 60 * 60); // h
  m(10, 1000 * 60); // m
  m(12, 1000); // s
  m(14, 1); // ms

  return dur;
};

export const parsePrometheusFloat = (str: string): number => {
  switch (str) {
    case '+Inf':
      return Infinity;
    case '-Inf':
      return -Infinity;
    default:
      return parseFloat(str);
  }
};

export const formatPrometheusFloat = (num: number): string => {
  switch (num) {
    case Infinity:
      return '+Inf';
    case -Infinity:
      return '-Inf';
    default:
      return num.toString();
  }
};

let nextUniqueID = 0;

export const getUniqueID = (): number => {
  return nextUniqueID++;
};

export const hasCounterSuffix = (name: string) =>
  ['_total', '_count', '_sum', '_bucket'].some((suffix) => name.endsWith(suffix));

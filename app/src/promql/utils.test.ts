import {
  getNonParenNodeType,
  containsPlaceholders,
  nodeValueType,
  escapeString,
  maybeQuoteLabelName,
  isLegacyMetricName,
  aggregatorsWithParam,
} from './utils';
import { nodeType, valueType, binaryOperatorType } from './ast';

describe('getNonParenNodeType', () => {
  it('works for non-paren type', () => {
    expect(getNonParenNodeType({ type: nodeType.numberLiteral, val: '1' })).toBe(nodeType.numberLiteral);
  });

  it('works for single parentheses wrapper', () => {
    expect(
      getNonParenNodeType({
        type: nodeType.parenExpr,
        expr: {
          type: nodeType.numberLiteral,
          val: '1',
        },
      })
    ).toBe(nodeType.numberLiteral);
  });

  it('works for multiple parentheses wrappers', () => {
    expect(
      getNonParenNodeType({
        type: nodeType.parenExpr,
        expr: {
          type: nodeType.parenExpr,
          expr: {
            type: nodeType.parenExpr,
            expr: {
              type: nodeType.numberLiteral,
              val: '1',
            },
          },
        },
      })
    ).toBe(nodeType.numberLiteral);
  });
});

describe('containsPlaceholders', () => {
  it('does not find placeholders in complete expressions', () => {
    expect(
      containsPlaceholders({
        type: nodeType.parenExpr,
        expr: {
          type: nodeType.numberLiteral,
          val: '1',
        },
      })
    ).toBe(false);
  });

  it('finds placeholders at the root', () => {
    expect(
      containsPlaceholders({
        type: nodeType.placeholder,
        children: [],
      })
    ).toBe(true);
  });

  it('finds placeholders in nested expressions with placeholders', () => {
    expect(
      containsPlaceholders({
        type: nodeType.parenExpr,
        expr: {
          type: nodeType.placeholder,
          children: [],
        },
      })
    ).toBe(true);
  });
});

describe('nodeValueType', () => {
  it('works for binary expressions with placeholders', () => {
    expect(
      nodeValueType({
        type: nodeType.binaryExpr,
        op: binaryOperatorType.add,
        lhs: { type: nodeType.placeholder, children: [] },
        rhs: { type: nodeType.placeholder, children: [] },
        matching: null,
        bool: false,
      })
    ).toBeNull();
  });

  it('works for scalar-scalar binops', () => {
    expect(
      nodeValueType({
        type: nodeType.binaryExpr,
        op: binaryOperatorType.add,
        lhs: { type: nodeType.numberLiteral, val: '1' },
        rhs: { type: nodeType.numberLiteral, val: '1' },
        matching: null,
        bool: false,
      })
    ).toBe(valueType.scalar);
  });

  it('works for scalar-vector binops', () => {
    expect(
      nodeValueType({
        type: nodeType.binaryExpr,
        op: binaryOperatorType.add,
        lhs: {
          type: nodeType.vectorSelector,
          name: 'metric_name',
          matchers: [],
          offset: 0,
          offsetExpr: null,
          timestamp: null,
          startOrEnd: null,
          anchored: false,
          smoothed: false,
        },
        rhs: { type: nodeType.numberLiteral, val: '1' },
        matching: null,
        bool: false,
      })
    ).toBe(valueType.vector);
  });

  it('works for vector-vector binops', () => {
    expect(
      nodeValueType({
        type: nodeType.binaryExpr,
        op: binaryOperatorType.add,
        lhs: {
          type: nodeType.vectorSelector,
          name: 'metric_name',
          matchers: [],
          offset: 0,
          offsetExpr: null,
          timestamp: null,
          startOrEnd: null,
          anchored: false,
          smoothed: false,
        },
        rhs: {
          type: nodeType.vectorSelector,
          name: 'metric_name',
          matchers: [],
          offset: 0,
          offsetExpr: null,
          timestamp: null,
          startOrEnd: null,
          anchored: false,
          smoothed: false,
        },
        matching: null,
        bool: false,
      })
    ).toBe(valueType.vector);
  });
});

describe('escapeString', () => {
  it('escapes backslashes and double quotes', () => {
    expect(escapeString('a"b\\c')).toBe('a\\"b\\\\c');
  });

  it('escapes control characters with named escapes', () => {
    expect(escapeString('a\nb\tc\rd')).toBe('a\\nb\\tc\\rd');
    expect(escapeString('\x07\b\f\v')).toBe('\\a\\b\\f\\v');
  });

  it('escapes other non-printable characters as hex', () => {
    expect(escapeString('\x00\x01\x1f\x7f')).toBe('\\x00\\x01\\x1f\\x7f');
    expect(escapeString('\x80\x9f')).toBe('\\u0080\\u009f');
    expect(escapeString('\u00a0\u00ad\u200b\ufeff')).toBe('\\u00a0\\u00ad\\u200b\\ufeff');
    expect(escapeString('\u{e0001}')).toBe('\\U000e0001');
  });

  it('keeps printable unicode as-is', () => {
    expect(escapeString('metric.name 🔥 héhé')).toBe('metric.name 🔥 héhé');
  });
});

describe('maybeQuoteLabelName', () => {
  it('keeps legacy label names unquoted', () => {
    expect(maybeQuoteLabelName('foo')).toBe('foo');
    expect(maybeQuoteLabelName('_foo1')).toBe('_foo1');
  });

  it('quotes non-legacy label names', () => {
    expect(maybeQuoteLabelName('label.name')).toBe('"label.name"');
    expect(maybeQuoteLabelName('0foo')).toBe('"0foo"');
    expect(maybeQuoteLabelName('')).toBe('""');
    expect(maybeQuoteLabelName('a"b')).toBe('"a\\"b"');
  });
});

describe('isLegacyMetricName', () => {
  it('accepts legacy metric names, including colons', () => {
    expect(isLegacyMetricName('foo')).toBe(true);
    expect(isLegacyMetricName('job:foo:rate5m')).toBe(true);
    expect(isLegacyMetricName(':foo:')).toBe(true);
  });

  it('rejects non-legacy metric names', () => {
    expect(isLegacyMetricName('metric.name')).toBe(false);
    expect(isLegacyMetricName('0foo')).toBe(false);
    expect(isLegacyMetricName('')).toBe(false);
  });
});

describe('aggregatorsWithParam', () => {
  it('contains all parameterized aggregators', () => {
    expect(aggregatorsWithParam).toEqual(['topk', 'bottomk', 'quantile', 'count_values', 'limitk', 'limit_ratio']);
  });
});

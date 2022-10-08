import ReactDOM from 'react-dom';
import getNodeAnnotations from './NodeAnnotations';
import ASTNode, { nodeType, aggregationType } from '../../../promql/ast';
import { functionSignatures } from '../../../promql/functionSignatures';
import serializeNode from '../../../promql/serialize';
import { NodeQueryResult } from '../../../state/state';

describe('nodeAnnotations', () => {
  describe('should suggest and apply the right actions', () => {
    const defaultQueryResult: NodeQueryResult = {
      numSeries: 8,
      queryTime: 0,
      labelCardinalities: { instance: 8 },
      labelExamples: {
        instance: [
          { value: 'localhost:10000', count: 1 },
          { value: 'localhost:10001', count: 1 },
          { value: 'localhost:10002', count: 1 },
          { value: 'localhost:10003', count: 1 },
          { value: 'localhost:10004', count: 1 },
          { value: 'localhost:10005', count: 1 },
          { value: 'localhost:10006', count: 1 },
          { value: 'localhost:10007', count: 1 },
        ],
      },
    };

    const tests: {
      desc: string;
      node: ASTNode;
      parent: ASTNode | null;
      queryResult?: NodeQueryResult;
      warningOutputs: string[];
      actionOutputs: Record<string, string>;
    }[] = [
      {
        desc: 'Add rates to counter metrics (vector selector) without parent.',
        node: {
          type: nodeType.vectorSelector,
          name: 'http_requests_total',
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: null,
        warningOutputs: [],
        actionOutputs: {
          'add rate()': 'rate(http_requests_total[5m])',
        },
      },
      {
        desc: 'Add rates to counter metrics (matrix selector) without parent.',
        node: {
          type: nodeType.matrixSelector,
          name: 'http_requests_total',
          matchers: [],
          range: 600 * 1000,
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: null,
        warningOutputs: [],
        actionOutputs: {
          'add rate()': 'rate(http_requests_total[10m])',
        },
      },
      {
        desc: "Do not add rates when there's an existing counter func parent.",
        node: {
          type: nodeType.matrixSelector,
          name: 'http_requests_total',
          range: 300 * 1000,
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['rate'],
          args: [
            {
              type: nodeType.matrixSelector,
              name: 'http_requests_total',
              range: 300 * 1000,
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [],
        actionOutputs: {},
      },
      {
        desc: "Add rates when there's an existing non-counter func parent.",
        node: {
          type: nodeType.vectorSelector,
          name: 'http_requests_total',
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['abs'],
          args: [
            {
              type: nodeType.vectorSelector,
              name: 'http_requests_total',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [],
        actionOutputs: {
          'add rate()': 'rate(http_requests_total[5m])',
        },
      },
      {
        desc: 'Do not show rates for non-counter metrics, add sum instead.',
        node: {
          type: nodeType.vectorSelector,
          name: 'http_requests_current',
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: null,
        warningOutputs: [],
        actionOutputs: {
          'add sum()': 'sum(http_requests_current)',
        },
      },
      {
        desc: 'Show sum() for existing counter-func nodes.',
        node: {
          type: nodeType.call,
          func: functionSignatures['rate'],
          args: [
            {
              type: nodeType.matrixSelector,
              name: 'http_requests_total',
              range: 300 * 1000,
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        parent: null,
        warningOutputs: [],
        actionOutputs: {
          'add sum()': 'sum(rate(http_requests_total[5m]))',
        },
      },
      {
        desc: "Do not show sum() when there's only one series.",
        node: {
          type: nodeType.vectorSelector,
          name: 'http_requests_current',
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: null,
        queryResult: {
          numSeries: 1,
          queryTime: 0,
          labelCardinalities: {},
          labelExamples: {},
        },
        warningOutputs: [],
        actionOutputs: {},
      },
      {
        desc: 'Add histogram_quantile() or rate() to histograms.',
        node: {
          type: nodeType.vectorSelector,
          name: 'http_request_durations_bucket',
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: null,
        warningOutputs: [],
        actionOutputs: {
          'add rate()': 'rate(http_request_durations_bucket[5m])',
          'add histogram_quantile()': 'histogram_quantile(0.9, sum by(le) (rate(http_request_durations_bucket[5m])))',
        },
      },
      {
        desc: "Don't add histogram_quantile() or rate() to histograms when there's a counter func parent.",
        node: {
          type: nodeType.vectorSelector,
          name: 'http_request_durations_bucket',
          matchers: [],
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['rate'],
          args: [
            {
              type: nodeType.vectorSelector,
              name: 'http_request_durations_bucket',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [],
        actionOutputs: {},
      },
      {
        desc: 'Counter functions on non-counter range vector selectors',
        node: {
          type: nodeType.call,
          func: functionSignatures['rate'],
          args: [
            {
              type: nodeType.matrixSelector,
              name: 'memory_usage_bytes',
              range: 300 * 1000,
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        parent: null,
        queryResult: {
          numSeries: 1,
          queryTime: 0,
          labelCardinalities: {},
          labelExamples: {},
        },
        warningOutputs: [
          'rate() is only meant to be used on counter metrics, but memory_usage_bytes does not look like a counter metric. Did you mean deriv()?',
        ],
        actionOutputs: {
          'change to deriv()': 'deriv(memory_usage_bytes[5m])',
        },
      },
      {
        desc: 'Non-counter function on counter range vector selector.',
        node: {
          type: nodeType.call,
          func: functionSignatures['deriv'],
          args: [
            {
              type: nodeType.matrixSelector,
              name: 'http_requests_total',
              range: 300 * 1000,
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        parent: null,
        warningOutputs: [
          'deriv() is not meant to be used on raw counter metrics, but http_requests_total looks like a counter metric. Did you mean to apply rate(), irate(), or increase() instead?',
        ],
        actionOutputs: {},
      },
      {
        desc: 'Non-counter function on counter range instant selector.',
        node: {
          type: nodeType.call,
          func: functionSignatures['scalar'],
          args: [
            {
              type: nodeType.vectorSelector,
              name: 'http_requests_total',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        parent: null,
        warningOutputs: [
          'scalar() is not meant to be used on raw counter metrics, but http_requests_total looks like a counter metric. Did you mean to apply rate(), irate(), or increase() instead?',
        ],
        actionOutputs: {},
      },
      {
        desc: 'Histogram by() aggregation is missing "le" label.',
        node: {
          type: nodeType.aggregation,
          expr: { type: nodeType.placeholder, children: [] },
          param: null,
          op: aggregationType.sum,
          without: false,
          grouping: ['instance', 'job'],
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['histogram_quantile'],
          args: [
            { type: nodeType.numberLiteral, val: '0.9' },
            {
              type: nodeType.vectorSelector,
              name: 'http_requests_total',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [
          'When passing an aggregated histogram into histogram_quantile(), you need to preserve the le ("less-than-or-equal") label in the aggregation.',
        ],
        actionOutputs: {
          'keep le label': 'sum by(instance, job, le) (…)',
        },
      },
      {
        desc: 'Histogram by() aggregation includes "le" label.',
        node: {
          type: nodeType.aggregation,
          expr: { type: nodeType.placeholder, children: [] },
          param: null,
          op: aggregationType.sum,
          without: false,
          grouping: ['instance', 'job', 'le'],
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['histogram_quantile'],
          args: [
            { type: nodeType.numberLiteral, val: '0.9' },
            {
              type: nodeType.vectorSelector,
              name: 'http_requests_total',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [],
        actionOutputs: {},
      },
      {
        desc: 'Histogram without() aggregation includes "le" label.',
        node: {
          type: nodeType.aggregation,
          expr: { type: nodeType.placeholder, children: [] },
          param: null,
          op: aggregationType.sum,
          without: true,
          grouping: ['instance', 'job', 'le'],
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['histogram_quantile'],
          args: [
            { type: nodeType.numberLiteral, val: '0.9' },
            {
              type: nodeType.vectorSelector,
              name: 'http_requests_total',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [
          'When passing an aggregated histogram into histogram_quantile(), you need to preserve the le ("less-than-or-equal") label in the aggregation.',
        ],
        actionOutputs: {
          'keep le label': 'sum without(instance, job) (…)',
        },
      },
      {
        desc: 'Histogram without() aggregation does not include "le" label.',
        node: {
          type: nodeType.aggregation,
          expr: { type: nodeType.placeholder, children: [] },
          param: null,
          op: aggregationType.sum,
          without: true,
          grouping: ['instance', 'job'],
        },
        parent: {
          type: nodeType.call,
          func: functionSignatures['histogram_quantile'],
          args: [
            { type: nodeType.numberLiteral, val: '0.9' },
            {
              type: nodeType.vectorSelector,
              name: 'http_requests_total',
              matchers: [],
              offset: 0,
              timestamp: null,
              startOrEnd: null,
            },
          ],
        },
        warningOutputs: [],
        actionOutputs: {},
      },
    ];

    tests.forEach((t, idx) => {
      describe(`${t.desc}`, () => {
        const [warnings, actions] = getNodeAnnotations(t.node, t.parent, t.queryResult || defaultQueryResult);

        expect(warnings.length).toEqual(t.warningOutputs.length);
        warnings.forEach((w) => {
          const el = document.createElement('span');
          ReactDOM.render(w, el);
          const warningStr = el.textContent;

          it(`warning "${warningStr}"`, () => {
            expect(t.warningOutputs).toContain(warningStr);
          });
        });

        expect(actions.length).toEqual(Object.keys(t.actionOutputs).length);
        actions.forEach((a) => {
          const el = document.createElement('span');
          ReactDOM.render(a.title, el);
          const actionStr = el.textContent!;

          it(`action "${actionStr}"`, () => {
            expect(t.actionOutputs).toHaveProperty(actionStr);

            const output = serializeNode(a.newNode);
            expect(output).toEqual(t.actionOutputs[actionStr]);
          });
        });
      });
    });
  });
});

import React from 'react';
import ASTNode, { nodeType, MatrixSelector, Call, VectorSelector, aggregationType } from '../../../promql/ast';
import { NodeQueryResult } from '../../../state/state';
import { hasCounterSuffix } from '../../../utils/utils';
import { functionSignatures } from '../../../promql/functionSignatures';

interface NodeAction {
  title: React.ReactElement;
  description: React.ReactElement;
  newNode: ASTNode;
}

// Functions that only work on counters.
const strictCounterFuncs = ['rate', 'irate', 'increase', 'resets'];
// Functions that can make sense to run directly on counters.
const counterFuncs = [...strictCounterFuncs, 'absent', 'absent_over_time', 'count_over_time', 'present_over_time'];

const getNodeAnnotations = (
  node: ASTNode,
  parent: ASTNode | null,
  queryResult: NodeQueryResult | null
): [React.ReactElement[], NodeAction[]] => {
  const warnings: React.ReactElement[] = [];
  const actions: NodeAction[] = [];

  // rate()/irate()/... on non-counter metrics.
  if (
    node.type === nodeType.call &&
    strictCounterFuncs.includes(node.func.name) &&
    node.args[0].type === nodeType.matrixSelector &&
    !hasCounterSuffix(node.args[0].name)
  ) {
    warnings.push(
      <>
        <code>{(node as Call).func.name}()</code> is only meant to be used on counter metrics, but{' '}
        <code>{((node as Call).args[0] as MatrixSelector).name}</code> does not look like a counter metric. Did you mean{' '}
        <code>deriv()</code>?
      </>
    );

    actions.push({
      title: (
        <>
          change to <code>deriv()</code>
        </>
      ),
      description: (
        <>
          <code>deriv()</code> is more likely to be the correct function to call on{' '}
          <code>{((node as Call).args[0] as MatrixSelector).name}</code>, since it does not look like a counter metric.
        </>
      ),
      newNode: { ...node, func: { ...node.func, name: 'deriv' } },
    });
  }

  // Non-counter function on counter.
  if (node.type === nodeType.call && !counterFuncs.includes(node.func.name)) {
    node.args
      .filter(
        (arg) => (arg.type === nodeType.vectorSelector || arg.type === nodeType.matrixSelector) && hasCounterSuffix(arg.name)
      )
      .forEach((arg) => {
        warnings.push(
          <>
            <code>{node.func.name}()</code> is not meant to be used on raw counter metrics, but{' '}
            <code>{(arg as VectorSelector | MatrixSelector).name}</code> looks like a counter metric. Did you mean to apply{' '}
            <code>rate()</code>, <code>irate()</code>, or <code>increase()</code> instead?
          </>
        );
      });
  }

  // Counter without counter-function parent (suggest to add "rate()").
  if (
    (parent === null || (parent.type === nodeType.call && !counterFuncs.includes(parent.func.name))) &&
    (node.type === nodeType.vectorSelector || node.type === nodeType.matrixSelector) &&
    hasCounterSuffix(node.name)
  ) {
    actions.push({
      title: (
        <>
          add <code>rate()</code>
        </>
      ),
      description: (
        <>
          <code>{node.name}</code> looks like a counter metric. It usually makes sense to compute a counter's rate of
          increase before using it further.
        </>
      ),
      newNode: {
        type: nodeType.call,
        func: functionSignatures['rate'],
        args: [
          {
            ...node,
            ...(node.type === nodeType.vectorSelector && { type: nodeType.matrixSelector, range: 5 * 60 * 1000 }),
          } as ASTNode, // Required because of https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#conditional-spreads-create-optional-properties
        ],
      },
    });
  }

  // Histogram without any parent, add histogram_quantile().
  // TODO: Also add histogram_quantile() when there's an intermediary aggregation already.
  //       Would need multi-level parent access.
  if (parent === null && node.type === nodeType.vectorSelector && node.name.endsWith('_bucket')) {
    actions.push({
      title: (
        <>
          add <code>histogram_quantile()</code>
        </>
      ),
      description: (
        <>
          <code>{node.name}</code> looks like a histogram metric. Do you want to calculate an aggregated quantile value from
          it?
        </>
      ),
      newNode: {
        type: nodeType.call,
        func: functionSignatures['histogram_quantile'],
        args: [
          { type: nodeType.numberLiteral, val: '0.9' },
          {
            type: nodeType.aggregation,
            op: aggregationType.sum,
            param: null,
            grouping: ['le'],
            expr: {
              type: nodeType.call,
              func: functionSignatures['rate'],
              args: [{ ...node, type: nodeType.matrixSelector, range: 5 * 60 * 1000 }],
            },
            without: false,
          },
        ],
      },
    });
  }

  // Histogram aggregation is missing "le" label.
  if (
    parent?.type === nodeType.call &&
    parent.func.name === 'histogram_quantile' &&
    node.type === nodeType.aggregation &&
    ((node.without && node.grouping.includes('le')) || (!node.without && !node.grouping.includes('le')))
  ) {
    warnings.push(
      <>
        When passing an aggregated histogram into <code>histogram_quantile()</code>, you need to preserve the <code>le</code>{' '}
        ("less-than-or-equal") label in the aggregation.
      </>
    );

    actions.push({
      title: (
        <>
          keep <code>le</code> label
        </>
      ),
      description: (
        <>
          It looks like the <code>le</code> label is not preserved in this aggregation, but <code>histogram_quantile()</code>{' '}
          requires it.
        </>
      ),
      newNode: { ...node, grouping: node.without ? node.grouping.filter((l) => l !== 'le') : [...node.grouping, 'le'] },
    });
  }

  // Non-counter metrics, add sum().
  if (
    queryResult !== null &&
    queryResult.numSeries > 1 &&
    (parent === null || parent.type !== nodeType.aggregation) &&
    ((node.type === nodeType.vectorSelector && !hasCounterSuffix(node.name)) ||
      (node.type === nodeType.call && counterFuncs.includes(node.func.name)))
  ) {
    actions.push({
      title: (
        <>
          add <code>sum()</code>
        </>
      ),
      description: (
        <>This expression yields multiple series. Depending on your goal, it may make sense to aggregate over them.</>
      ),
      newNode: {
        type: nodeType.aggregation,
        op: aggregationType.sum,
        param: null,
        expr: node,
        grouping: [],
        without: false,
      },
    });
  }
  return [warnings, actions];
};

export default getNodeAnnotations;

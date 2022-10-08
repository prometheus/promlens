import React, { FC } from 'react';
import ASTNode, { nodeType } from '../../../promql/ast';
import AggregationExplainView from './Aggregation';
import BinaryExprExplainView from './BinaryExpr/BinaryExpr';
import SelectorExplainView from './Selector';
import { formatDuration } from '../../../utils/utils';
import funcDocs from '../../../promql/functionDocs';
import { Alert } from 'react-bootstrap';
import { escapeString, containsPlaceholders } from '../../../promql/utils';
import { PromAPI } from '../../../promAPI/promAPI';

interface ExplainViewProps {
  node: ASTNode;
  promAPI: PromAPI;
}

const ExplainView: FC<ExplainViewProps> = ({ node, promAPI }) => {
  switch (node.type) {
    case nodeType.aggregation:
      return <AggregationExplainView node={node} />;
    case nodeType.binaryExpr:
      if (containsPlaceholders(node)) {
        return (
          <Alert variant="light">
            Binary expressions with incomplete (placeholder) nodes are not supported yet. Please fill out the placeholders.
          </Alert>
        );
      }

      return <BinaryExprExplainView node={node} promAPI={promAPI} />;
    case nodeType.call:
      return (
        <Alert variant="secondary">
          <p>
            This node calls the{' '}
            <a href={`https://prometheus.io/docs/prometheus/latest/querying/functions/#${node.func.name}`}>
              <span className="promql-code promql-keyword">{node.func.name}()</span>
            </a>{' '}
            function{node.args.length > 0 ? ' on the provided inputs' : ''}.
          </p>
          <hr />
          {funcDocs[node.func.name]}
        </Alert>
      );
    case nodeType.matrixSelector:
      return <SelectorExplainView node={node} promAPI={promAPI} />;
    case nodeType.subquery:
      return (
        <Alert variant="secondary">
          This node evaluates the passed expression as a subquery over the last{' '}
          <span className="promql-code promql-duration">{formatDuration(node.range)}</span> at a query resolution{' '}
          {node.step > 0 ? (
            <>
              of <span className="promql-code promql-duration">{formatDuration(node.step)}</span>
            </>
          ) : (
            'equal to the default rule evaluation interval'
          )}
          {node.timestamp !== null ? (
            <>
              , evaluated relative to an absolute evaluation timestamp of{' '}
              <span className="promql-number">{(node.timestamp / 1000).toFixed(3)}</span>
            </>
          ) : node.startOrEnd !== null ? (
            <>, evaluated relative to the {node.startOrEnd} of the query range</>
          ) : (
            <></>
          )}
          {node.offset === 0 ? (
            <></>
          ) : node.offset > 0 ? (
            <>
              , time-shifted <span className="promql-code promql-duration">{formatDuration(node.offset)}</span> into the past
            </>
          ) : (
            <>
              , time-shifted <span className="promql-code promql-duration">{formatDuration(-node.offset)}</span> into the
              future
            </>
          )}
          .
        </Alert>
      );
    case nodeType.numberLiteral:
      return (
        <Alert variant="secondary">
          A scalar number literal with the value <span className="promql-code promql-number">{node.val}</span>.
        </Alert>
      );
    case nodeType.parenExpr:
      return <Alert variant="secondary">Parentheses that contain a sub-expression to be evaluated.</Alert>;
    case nodeType.stringLiteral:
      return (
        <Alert variant="secondary">
          A string literal with the value <span className="promql-code promql-string">"{escapeString(node.val)}"</span>.
        </Alert>
      );
    case nodeType.unaryExpr:
      return (
        <Alert variant="secondary">
          A unary expression that{' '}
          {node.op === '+'
            ? 'does not affect the expression it is applied to'
            : 'changes the sign of the expression it is applied to'}
          .
        </Alert>
      );
    case nodeType.vectorSelector:
      return <SelectorExplainView node={node} promAPI={promAPI} />;
    case nodeType.placeholder:
      return <Alert variant="secondary">A placeholder node that needs to be filled out.</Alert>;
    default:
      throw new Error('invalid node type');
  }
};

export default ExplainView;

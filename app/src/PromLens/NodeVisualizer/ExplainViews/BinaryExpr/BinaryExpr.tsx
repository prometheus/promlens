import React, { FC } from 'react';
import { BinaryExpr, vectorMatchCardinality } from '../../../../promql/ast';
import { QueryResult } from '../../../QueryList/QueryView/QueryResultTypes';
import serializeNode from '../../../../promql/serialize';
import VectorScalarBinaryExprExplainView from './VectorScalar';
import VectorVectorBinaryExprExplainView from './VectorVector';
import ScalarScalarBinaryExprExplainView from './ScalarScalar';
import { Alert } from 'react-bootstrap';
import { nodeValueType } from '../../../../promql/utils';
import { PromAPI } from '../../../../promAPI/promAPI';

interface BinaryExprExplainViewProps {
  node: BinaryExpr;
  promAPI: PromAPI;
}

const BinaryExprExplainView: FC<BinaryExprExplainViewProps> = ({ node, promAPI }) => {
  const lhs = promAPI.useFetchAPI<QueryResult>(`/api/v1/query?query=${encodeURIComponent(serializeNode(node.lhs))}`);
  const rhs = promAPI.useFetchAPI<QueryResult>(`/api/v1/query?query=${encodeURIComponent(serializeNode(node.rhs))}`);

  if (lhs.loading || rhs.loading) {
    return <Alert variant="info">Loading...</Alert>;
  }

  if (lhs.error !== undefined) {
    return (
      <Alert variant="danger">
        <strong>Error evaluating left-hand side:</strong> {lhs.error.message}
      </Alert>
    );
  }

  if (rhs.error !== undefined) {
    return (
      <Alert variant="danger">
        <strong>Error evaluating right-hand side:</strong> {rhs.error.message}
      </Alert>
    );
  }

  if (lhs.data === undefined || rhs.data === undefined) {
    // TODO: Should this never be allowed to happen?
    throw new Error('Result data is null despite no error');
  }

  if (lhs.data.resultType !== nodeValueType(node.lhs) || rhs.data.resultType !== nodeValueType(node.rhs)) {
    // This can happen for a brief transitionary render when "node" has changed, but "lhs" and "rhs"
    // haven't switched back to loading yet (leading to a crash in e.g. the vector-vector explain view).
    return null;
  }

  // Scalar-scalar binops.
  if (lhs.data.resultType === 'scalar' && rhs.data.resultType === 'scalar') {
    return <ScalarScalarBinaryExprExplainView node={node} lhs={lhs.data.result} rhs={rhs.data.result} />;
  }

  // Vector-scalar binops.
  if (lhs.data.resultType === 'scalar' && rhs.data.resultType === 'vector') {
    return (
      <VectorScalarBinaryExprExplainView node={node} vector={rhs.data.result} scalar={lhs.data.result} scalarLeft={true} />
    );
  }
  if (lhs.data.resultType === 'vector' && rhs.data.resultType === 'scalar') {
    return (
      <VectorScalarBinaryExprExplainView node={node} scalar={rhs.data.result} vector={lhs.data.result} scalarLeft={false} />
    );
  }

  // Vector-vector binops.
  if (lhs.data.resultType === 'vector' && rhs.data.resultType === 'vector') {
    return (
      <VectorVectorBinaryExprExplainView
        // TODO: Currently in the native PromQL parser, the "VectorMatching" field can not be null
        // for vector-vector binops, but it may be null when we create a PromLens-internal AST node
        // in the form editor, or via a snippet, because there it would be hard to dynamically modify
        // the binop parent when a child changes type from vector to scalar. But then we need to
        // ensure that the "default" is filled in here before, because the explain view expects it.
        node={{
          ...node,
          matching:
            node.matching === null
              ? { card: vectorMatchCardinality.oneToOne, include: [], labels: [], on: false }
              : node.matching,
        }}
        lhs={lhs.data.result}
        rhs={rhs.data.result}
      />
    );
  }

  throw new Error('invalid binary operator argument types');
};

export default BinaryExprExplainView;

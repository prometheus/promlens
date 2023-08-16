import React, { FC } from 'react';
import { BinaryExpr } from '../../../../promql/ast';
import { SampleValue } from '../../../QueryList/QueryView/QueryResultTypes';
import { parsePrometheusFloat, formatPrometheusFloat } from '../../../../utils/utils';
import { Table } from 'react-bootstrap';
import { scalarBinOp } from '../../../../promql/binOp';

interface ScalarScalarBinaryExprExplainViewProps {
  node: BinaryExpr;
  lhs: SampleValue;
  rhs: SampleValue;
}

const ScalarScalarBinaryExprExplainView: FC<ScalarScalarBinaryExprExplainViewProps> = ({ node, lhs, rhs }) => {
  const [lhsVal, rhsVal] = [parsePrometheusFloat(lhs[1]), parsePrometheusFloat(rhs[1])];

  return (
    <Table bordered hover size="sm" className="data-table">
      <thead>
        <tr>
          <th>Left value</th>
          <th>Operator</th>
          <th>Right value</th>
          <th></th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="number-cell">{lhs[1]}</td>
          <td className="op-cell">
            {node.op}
            {node.bool && ' bool'}
          </td>
          <td className="number-cell">{rhs[1]}</td>
          <td className="op-cell">=</td>
          <td className="number-cell">{formatPrometheusFloat(scalarBinOp(node.op, lhsVal, rhsVal))}</td>
        </tr>
      </tbody>
    </Table>
  );
};

export default ScalarScalarBinaryExprExplainView;

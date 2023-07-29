import React, { FC } from 'react';
import { BinaryExpr } from '../../../../promql/ast';
import { InstantSample, SampleValue } from '../../../QueryList/QueryView/QueryResultTypes';
import SeriesName from '../../../../utils/SeriesName';
import { parsePrometheusFloat, formatPrometheusFloat } from '../../../../utils/utils';
import { isComparisonOperator } from '../../../../promql/utils';
import { Table, Alert } from 'react-bootstrap';
import { vectorElemBinop } from '../../../../promql/binOp';

interface VectorScalarBinaryExprExplainViewProps {
  node: BinaryExpr;
  scalar: SampleValue;
  vector: InstantSample[];
  scalarLeft: boolean;
}

const VectorScalarBinaryExprExplainView: FC<VectorScalarBinaryExprExplainViewProps> = ({
  node,
  scalar,
  vector,
  scalarLeft,
}) => {
  if (vector.length === 0) {
    return (
      <Alert variant="secondary">One side of the binary operation produces 0 results, no matching information shown.</Alert>
    );
  }

  return (
    <Table bordered hover size="sm" className="data-table">
      <thead>
        <tr>
          {!scalarLeft && <th>Left labels</th>}
          <th>Left value</th>
          <th>Operator</th>
          {scalarLeft && <th>Right labels</th>}
          <th>Right value</th>
          <th></th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {vector.map((sample: InstantSample, idx) => {
          const vecVal = parsePrometheusFloat(sample.value[1]);
          const scalVal = parsePrometheusFloat(scalar[1]);

          let { value, keep } = scalarLeft
            ? vectorElemBinop(node.op, scalVal, vecVal)
            : vectorElemBinop(node.op, vecVal, scalVal);
          if (isComparisonOperator(node.op) && scalarLeft) {
            value = vecVal;
          }
          if (node.bool) {
            value = Number(keep);
            keep = true;
          }

          const scalarCell = <td className="number-cell">{scalar[1]}</td>;
          const vectorCells = (
            <>
              <td>
                <SeriesName labels={sample.metric} format={true} />
              </td>
              <td className="number-cell">{sample.value[1]}</td>
            </>
          );

          return (
            <tr key={idx}>
              {scalarLeft ? scalarCell : vectorCells}
              <td className="op-cell">
                {node.op}
                {node.bool && ' bool'}
              </td>
              {scalarLeft ? vectorCells : scalarCell}
              <td className="op-cell">=</td>
              <td className="number-cell">
                {keep ? formatPrometheusFloat(value) : <span style={{ color: 'grey' }}>dropped</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default VectorScalarBinaryExprExplainView;

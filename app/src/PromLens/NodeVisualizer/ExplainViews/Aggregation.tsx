import React, { FC } from 'react';
import ASTNode, { Aggregation, aggregationType } from '../../../promql/ast';
import { parsePrometheusFloat } from '../../../utils/utils';
import { labelNameList } from '../../../utils/LabelNameList';
import { Alert } from 'react-bootstrap';

const describeAggregationType = (aggrType: aggregationType, param: ASTNode | null) => {
  switch (aggrType) {
    case 'sum':
      return 'sums over the sample values of the input series';
    case 'min':
      return 'takes the minimum of the sample values of the input series';
    case 'max':
      return 'takes the maximum of the sample values of the input series';
    case 'avg':
      return 'calculates the average of the sample values of the input series';
    case 'stddev':
      return 'calculates the population standard deviation of the sample values of the input series';
    case 'stdvar':
      return 'calculates the population standard variation of the sample values of the input series';
    case 'count':
      return 'counts the number of input series';
    case 'group':
      return 'groups the input series by the supplied grouping labels, while setting the sample value to 1';
    case 'count_values':
      if (param === null) {
        throw new Error('encountered count_values() node without label parameter');
      }
      if (param.type !== 'stringLiteral') {
        throw new Error('encountered count_values() node without string literal label parameter');
      }
      return (
        <>
          outputs one time series for each unique sample value in the input series (each counting the number of occurrences
          of that value and indicating the original value in the {labelNameList([param.val])} label)
        </>
      );
    case 'bottomk':
      return 'returns the bottom K series by value';
    case 'topk':
      return 'returns the top K series by value';
    case 'quantile':
      if (param === null) {
        throw new Error('encountered quantile() node without quantile parameter');
      }
      if (param.type === 'numberLiteral') {
        return `calculates the ${param.val}th quantile (${
          parsePrometheusFloat(param.val) * 100
        }th percentile) over the sample values of the input series`;
      }
      return 'calculates a quantile over the sample values of the input series';
    default:
      throw new Error(`invalid aggregation type ${aggrType}`);
  }
};

const describeAggregationGrouping = (grouping: string[], without: boolean) => {
  if (without) {
    return <>aggregating away the [{labelNameList(grouping)}] label dimensions</>;
  }

  if (grouping.length > 0) {
    return <>grouped by their [{labelNameList(grouping)}] label dimensions</>;
  }

  return 'aggregating away any label dimensions';
};

interface AggregationExplainViewProps {
  node: Aggregation;
}

const AggregationExplainView: FC<AggregationExplainViewProps> = ({ node }) => {
  return (
    <Alert variant="secondary">
      This node {describeAggregationType(node.op, node.param)}, {describeAggregationGrouping(node.grouping, node.without)}.
    </Alert>
  );
};

export default AggregationExplainView;

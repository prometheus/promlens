import React, { FC, useMemo, useState, useEffect } from 'react';
import { QueryResult, RangeSamples } from '../QueryList/QueryView/QueryResultTypes';
import ASTNode, { nodeType } from '../../promql/ast';
import serializeNode from '../../promql/serialize';
import moment from 'moment-timezone';
import Graph from './Graph/Graph';
import { Alert } from 'react-bootstrap';
import { PromAPI } from '../../promAPI/promAPI';
import { VectorSelector } from '../../state/ast';

interface GraphVisualizerProps {
  endTime: number | null;
  // Range in milliseconds.
  range: number;
  resolution: number | null;
  stacked: boolean;
  node: ASTNode;
  promAPI: PromAPI;
  retriggerIndex: number;
}

const GraphVisualizer: FC<GraphVisualizerProps> = React.memo(
  ({ node, endTime, range, resolution, stacked, promAPI, retriggerIndex }) => {
    const now = useMemo(
      () => moment().valueOf() / 1000,
      [serializeNode(node), endTime, range, resolution, promAPI, retriggerIndex]
    );
    const end = endTime === null ? now : endTime / 1000;
    const start = end - range / 1000;
    const step = resolution === null ? Math.max(Math.floor(range / 250000), 1) : resolution;

    let graphNode: ASTNode = node;
    if (node.type === nodeType.matrixSelector) {
      graphNode = {
        type: nodeType.vectorSelector,
        name: node.name,
        matchers: node.matchers,
        offset: node.offset,
        timestamp: node.timestamp,
        startOrEnd: node.startOrEnd,
      };
    }

    const params: URLSearchParams = new URLSearchParams({
      query: serializeNode(graphNode),
      start: start.toString(),
      end: end.toString(),
      step: step.toString(),
    });

    const [lastResult, setLastResult] = useState<RangeSamples[] | null>(null);

    useEffect(() => {
      setLastResult(null);
    }, [serializeNode(node)]);

    const query = promAPI.useFetchAPI<QueryResult>(`/api/v1/query_range?${params}`);

    useEffect(() => {
      if (query.data !== undefined) {
        if (query.data.resultType !== 'matrix') {
          // TODO: Change result receiver to be of more limited type so we don't need to check this here.
          throw new Error('Invalid range query result type');
        }
        setLastResult(query.data.result);
      }
    }, [query.data]);

    return (
      <>
        {node.type === nodeType.matrixSelector && (
          <Alert variant="warning">
            <strong>Note:</strong> Range vector selectors can't be graphed, so graphing the equivalent instant vector
            selector instead.
          </Alert>
        )}
        {query.loading && <Alert variant="secondary">Loading...</Alert>}
        {query.error !== undefined && (
          <Alert variant="danger">
            <strong>Error:</strong> {query.error.message}
          </Alert>
        )}
        {lastResult !== null &&
          (lastResult.length > 0 ? (
            <Graph data={lastResult} stacked={stacked} queryParams={{ startTime: start, endTime: end, resolution: step }} />
          ) : (
            <Alert variant="secondary">Empty query result.</Alert>
          ))}
      </>
    );
  }
);

export default GraphVisualizer;

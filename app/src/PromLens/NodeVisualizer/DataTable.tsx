// Some of the code below was adapted from Prometheus:
//
// Copyright 2020 The Prometheus Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { FC, ReactNode } from 'react';
import SeriesName from '../../utils/SeriesName';
import {
  InstantSample,
  RangeSamples,
  QueryResult,
  SampleHistogram,
  bucketRangeString,
  mergeSamplePoints,
} from '../QueryList/QueryView/QueryResultTypes';
import ASTNode from '../../promql/ast';
import serializeNode from '../../promql/serialize';
import { Alert, Table } from 'react-bootstrap';
import { PromAPI } from '../../promAPI/promAPI';

const limitSeries = <S extends InstantSample | RangeSamples>(series: S[]): S[] => {
  const maxSeries = 10000;

  if (series.length > maxSeries) {
    return series.slice(0, maxSeries);
  }
  return series;
};

export const QueryAnnotations: FC<{ warnings?: string[]; infos?: string[] }> = ({ warnings, infos }) => (
  <>
    {warnings !== undefined &&
      warnings.map((warning, idx) => (
        <Alert variant="warning" key={idx}>
          <strong>Warning:</strong> {warning}
        </Alert>
      ))}
    {infos !== undefined &&
      infos.map((info, idx) => (
        <Alert variant="info" key={idx}>
          <strong>Info:</strong> {info}
        </Alert>
      ))}
  </>
);

const HistogramValue: FC<{ histogram: SampleHistogram }> = ({ histogram }) => (
  <>
    <div>
      <strong>Count:</strong> {histogram.count} <strong>Sum:</strong> {histogram.sum}
    </div>
    {histogram.buckets !== undefined && histogram.buckets.length > 0 && (
      <details className="histogram-buckets">
        <summary>
          {histogram.buckets.length} bucket{histogram.buckets.length !== 1 && 's'}
        </summary>
        <Table size="sm" bordered className="data-table histogram-buckets-table">
          <thead>
            <tr>
              <th>Bucket range</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {histogram.buckets.map((b, idx) => (
              <tr key={idx}>
                <td>{bucketRangeString(b)}</td>
                <td>{b[3]}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </details>
    )}
  </>
);

interface DataTableProps {
  node: ASTNode;
  // Eval timestamp in milliseconds.
  evalTime: number | null;
  promAPI: PromAPI;
  retriggerIndex: number;
}

const DataTable: FC<DataTableProps> = React.memo(({ node, evalTime, promAPI, retriggerIndex }) => {
  const evalTimeParam = evalTime === null ? '' : `&time=${evalTime / 1000}`;
  const query = promAPI.useFetchAPI<QueryResult>(
    `/api/v1/query?query=${encodeURIComponent(serializeNode(node))}${evalTimeParam}&refresh=${retriggerIndex}`
  );

  <Alert>{retriggerIndex}</Alert>;

  if (query.loading) {
    return <Alert variant="secondary">Loading...</Alert>;
  }

  if (query.error !== undefined) {
    return (
      <Alert variant="danger">
        <strong>Error:</strong> {query.error.message}
      </Alert>
    );
  }

  const data = query.data;

  if (data === undefined) {
    return <Alert variant="secondary">Empty query result.</Alert>;
    // TODO: Should this never be allowed to happen?
    // It happens in some situations (like aborted fetches), but maybe those situations should be fixed instead.
    // throw new Error('Result data is null despite no error');
  }

  const annotations = <QueryAnnotations warnings={query.warnings} infos={query.infos} />;

  if (data.result === null || data.result.length === 0) {
    return (
      <>
        {annotations}
        <Alert variant="secondary">Empty query result.</Alert>
      </>
    );
  }

  let rows: ReactNode[] = [];
  let limited = false;
  const maxFormattedSeries = 1000;
  const doFormat = data.result.length <= 1000;
  switch (data.resultType) {
    case 'vector':
      rows = (limitSeries(data.result) as InstantSample[]).map((s: InstantSample, index: number): ReactNode => {
        return (
          <tr key={index}>
            <td>
              <SeriesName labels={s.metric} format={doFormat} />
            </td>
            <td>
              {s.value !== undefined && s.value[1]}
              {s.histogram !== undefined && <HistogramValue histogram={s.histogram[1]} />}
            </td>
          </tr>
        );
      });
      limited = rows.length !== data.result.length;
      break;
    case 'matrix':
      rows = (limitSeries(data.result) as RangeSamples[]).map((s, index) => {
        const valueText = mergeSamplePoints(s.values, s.histograms)
          .map((p) => {
            const value = p.histogram !== undefined ? `Count: ${p.histogram.count} Sum: ${p.histogram.sum}` : p.value;
            return value + ' @' + p.timestamp;
          })
          .join('\n');
        return (
          <tr key={index}>
            <td>
              <SeriesName labels={s.metric} format={data.result.length <= 100} />
            </td>
            <td>{valueText}</td>
          </tr>
        );
      });
      limited = rows.length !== data.result.length;
      break;
    case 'scalar':
      rows.push(
        <tr key="0">
          <td>scalar</td>
          <td>{data.result[1]}</td>
        </tr>
      );
      break;
    case 'string':
      rows.push(
        <tr key="0">
          <td>string</td>
          <td>{data.result[1]}</td>
        </tr>
      );
      break;
    default:
      return <Alert variant="danger">Unsupported result value type</Alert>;
  }

  return (
    <>
      {annotations}
      {limited && (
        <Alert variant="danger">
          <strong>Warning:</strong> Fetched {data.result.length} series, only displaying first {rows.length}.
        </Alert>
      )}
      {!doFormat && (
        <Alert variant="secondary">
          <strong>Notice:</strong> Showing more than {maxFormattedSeries} series, turning off label formatting for
          performance reasons.
        </Alert>
      )}
      <div style={{ overflowX: 'auto' }}>
        <Table hover size="sm" className="data-table" bordered>
          <thead>
            <tr>
              <th>Series</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </div>
    </>
  );
});

export default DataTable;

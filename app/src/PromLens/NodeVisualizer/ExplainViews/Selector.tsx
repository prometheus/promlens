import React, { FC, ReactNode } from 'react';
import { VectorSelector, MatrixSelector, nodeType, LabelMatcher, matchType } from '../../../promql/ast';
import { formatDuration } from '../../../utils/utils';
import { Alert } from 'react-bootstrap';
import { escapeString } from '../../../promql/utils';
import { PromAPI } from '../../../promAPI/promAPI';
import { MetricMetadata } from '../../../types/types';

interface SelectorExplainViewProps {
  node: VectorSelector | MatrixSelector;
  promAPI: PromAPI;
}

export const matchingCriteriaList = (name: string, matchers: LabelMatcher[]): ReactNode => {
  return (
    <ul>
      {name.length > 0 && (
        <li>
          The metric name is <span className="promql-metric-name">{name}</span>.
        </li>
      )}
      {matchers
        .filter((m) => !(m.name === '__name__'))
        .map((m) => {
          switch (m.type) {
            case matchType.equal:
              return (
                <li>
                  <span className="promql-code promql-label-name">{m.name}</span>
                  <span className="promql-code promql-operator">{m.type}</span>
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>: The label{' '}
                  <span className="promql-code promql-label-name">{m.name}</span> is exactly{' '}
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>.
                </li>
              );
            case matchType.notEqual:
              return (
                <li>
                  <span className="promql-code promql-label-name">{m.name}</span>
                  <span className="promql-code promql-operator">{m.type}</span>
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>: The label{' '}
                  <span className="promql-code promql-label-name">{m.name}</span> is not{' '}
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>.
                </li>
              );
            case matchType.matchRegexp:
              return (
                <li>
                  <span className="promql-code promql-label-name">{m.name}</span>
                  <span className="promql-code promql-operator">{m.type}</span>
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>: The label{' '}
                  <span className="promql-code promql-label-name">{m.name}</span> matches the regular expression{' '}
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>.
                </li>
              );
            case matchType.matchNotRegexp:
              return (
                <li>
                  <span className="promql-code promql-label-name">{m.name}</span>
                  <span className="promql-code promql-operator">{m.type}</span>
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>: The label{' '}
                  <span className="promql-code promql-label-name">{m.name}</span> does not match the regular expression{' '}
                  <span className="promql-code promql-string">"{escapeString(m.value)}"</span>.
                </li>
              );
            default:
              throw new Error('invalid matcher type');
          }
        })}
    </ul>
  );
};

const SelectorExplainView: FC<SelectorExplainViewProps> = ({ node, promAPI }) => {
  const baseMetricName = node.name.replace(/(_count|_sum|_bucket)$/, '');
  const metricMeta = promAPI.useFetchAPI<MetricMetadata>(`/api/v1/metadata?metric=${baseMetricName}`);

  return (
    <Alert variant="secondary">
      <p>
        {metricMeta.loading ? (
          'Loading metric metadata...'
        ) : metricMeta.error !== undefined ? (
          <>Error loading metric metadata: {metricMeta.error.message}</>
        ) : metricMeta.data === undefined ||
          metricMeta.data[baseMetricName] === undefined ||
          metricMeta.data[baseMetricName].length < 1 ? (
          <>No metric metadata found.</>
        ) : (
          <>
            <strong>Metric help</strong>: {metricMeta.data[baseMetricName][0].help}
            <br />
            <strong>Metric type</strong>: {metricMeta.data[baseMetricName][0].type}
          </>
        )}
      </p>
      <hr />
      <p>
        {node.type === nodeType.vectorSelector ? (
          <>
            This node selects the latest (non-stale) sample value within the last{' '}
            <span className="promql-code promql-duration">5m</span>
          </>
        ) : (
          <>
            This node selects <span className="promql-code promql-duration">{formatDuration(node.range)}</span> of data going
            backward from the evaluation timestamp
          </>
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
            , time-shifted <span className="promql-code promql-duration">{formatDuration(node.offset)}</span> into the past,
          </>
        ) : (
          <>
            , time-shifted <span className="promql-code promql-duration">{formatDuration(-node.offset)}</span> into the
            future,
          </>
        )}{' '}
        for any series that match all of the following criteria:
      </p>
      {matchingCriteriaList(node.name, node.matchers)}
      <p>
        If a series has no values in the last{' '}
        <span className="promql-code promql-duration">
          {node.type === nodeType.vectorSelector ? '5m' : formatDuration(node.range)}
        </span>
        {node.offset > 0 && (
          <>
            {' '}
            (relative to the time-shifted instant{' '}
            <span className="promql-code promql-duration">{formatDuration(node.offset)}</span> in the past)
          </>
        )}
        , the series will not be returned.
      </p>
    </Alert>
  );
};

export default SelectorExplainView;

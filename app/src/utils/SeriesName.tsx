import React, { FC, CSSProperties } from 'react';
import metricToSeriesName from './MetricFormat';
import { escapeString } from '../promql/utils';

interface SeriesNameProps {
  labels: { [key: string]: string } | null;
  format: boolean;
  styleLabel?: (label: string) => CSSProperties;
}

const SeriesName: FC<SeriesNameProps> = ({ labels, format, styleLabel }) => {
  const renderFormatted = (): React.ReactElement => {
    const labelNodes: React.ReactElement[] = [];
    let first = true;
    for (const label in labels) {
      if (label === '__name__') {
        continue;
      }

      labelNodes.push(
        <React.Fragment key={label}>
          {!first && ', '}
          <span
            className={styleLabel !== undefined ? 'highlighted-text' : undefined}
            style={styleLabel !== undefined ? styleLabel(label) : {}}
          >
            <span className="promql-label-name">{label}</span>=
            <span className="promql-string">"{escapeString(labels[label])}"</span>
          </span>
        </React.Fragment>
      );

      if (first) {
        first = false;
      }
    }

    return (
      <span className="promql-code">
        {labels!.__name__ !== undefined && (
          <span
            className={`promql-metric-name${styleLabel !== undefined ? ' highlighted-text' : ''}`}
            style={styleLabel !== undefined ? styleLabel('__name__') : {}}
          >
            {labels!.__name__}
          </span>
        )}
        <span className="promql-brace">{'{'}</span>
        {labelNodes}
        <span className="promql-brace">{'}'}</span>
      </span>
    );
  };

  if (labels === null) {
    return <>scalar</>;
  }

  if (format) {
    return renderFormatted();
  }
  // Return a simple text node. This is much faster to scroll through
  // for longer lists (hundreds of items).
  return <>{metricToSeriesName(labels!)}</>;
};

export default SeriesName;

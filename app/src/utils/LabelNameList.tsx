import React from 'react';
import { maybeQuoteLabelName } from '../promql/utils';

// TODO: All the util helpers are inconsistenly named/capitalized, including the file names. Make this consistent.
export const labelNameList = (labels: string[]): React.ReactNode[] => {
  return labels.map((l, i) => {
    return (
      <span key={i}>
        {i !== 0 && ', '}
        <span className="promql-code promql-label-name">{maybeQuoteLabelName(l)}</span>
      </span>
    );
  });
};

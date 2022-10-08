import React, { FC, CSSProperties, useState } from 'react';
import { BinaryExpr, vectorMatchCardinality } from '../../../../promql/ast';
import { InstantSample } from '../../../QueryList/QueryView/QueryResultTypes';
import SeriesName from '../../../../utils/SeriesName';
import { vectorElemBinop } from './computeBinop';
import { parsePrometheusFloat, formatPrometheusFloat } from '../../../../utils/utils';
import { labelNameList } from '../../../../utils/LabelNameList';
import { isComparisonOperator, isSetOperator } from '../../../../promql/utils';
import { Alert, Table, Form } from 'react-bootstrap';

interface VectorVectorBinaryExprExplainViewProps {
  node: BinaryExpr;
  lhs: InstantSample[];
  rhs: InstantSample[];
}

type Labels = Record<string, string>;

const matchLabels = (metric: Labels, on: boolean, labels: string[]): Labels => {
  const result: Labels = {};
  for (const name in metric) {
    if (labels.includes(name) === on && (on || name !== '__name__')) {
      result[name] = metric[name];
    }
  }
  return result;
};

const signatureFunc = (on: boolean, names: string[]) => {
  // TODO: Make sure this is something collision-safe as a separator in JS strings.
  const sep = '\xff';
  names.sort();

  if (on) {
    return (lset: Labels): string => {
      // TODO: Perf: Use numeric hash?
      return names.map((ln: string) => lset[ln]).join(sep);
    };
  }

  return (lset: Labels): string => {
    // TODO: Perf: Use numeric hash?
    return Object.keys(lset)
      .filter((k) => !names.includes(k) && k !== '__name__')
      .map((k) => lset[k])
      .join(sep);
  };
};

const explanationText = (node: BinaryExpr): React.ReactNode => {
  const matching = node.matching!;
  const [oneSide, manySide] = matching.card === vectorMatchCardinality.oneToMany ? ['left', 'right'] : ['right', 'left'];

  return (
    <>
      <p>
        {isComparisonOperator(node.op) ? (
          <>
            This node filters the series from the left-hand side based on the result of a "
            <span className="promql-operator">{node.op}</span>" comparison with matching series from the right-hand side.
          </>
        ) : (
          <>
            This node calculates the result of applying the "<span className="promql-operator">{node.op}</span>" operator
            between the sample values of matching series from two sets of time series.
          </>
        )}
      </p>
      <ul>
        {(matching.labels.length > 0 || matching.on) &&
          (matching.on ? (
            <li>
              <span className="promql-code promql-keyword">on</span>({labelNameList(matching.labels)}):{' '}
              {matching.labels.length > 0 ? (
                <>series on both sides are matched on the labels {labelNameList(matching.labels)}</>
              ) : (
                <>all series from one side are matched to all series on the other side.</>
              )}
            </li>
          ) : (
            <li>
              <span className="promql-code promql-keyword">ignoring</span>({labelNameList(matching.labels)}): series on both
              sides are matched on all of their labels, except {labelNameList(matching.labels)}.
            </li>
          ))}
        {matching.card === vectorMatchCardinality.oneToOne ? (
          <li>
            One-to-one match. Each series from the left-hand side is allowed to match with at most one series on the
            right-hand side, and vice versa.
          </li>
        ) : (
          <li>
            <span className="promql-code promql-keyword">
              group_{manySide}({labelNameList(matching.include)})
            </span>
            : {matching.card} match. Each series from the {oneSide}-hand side is allowed to match with multiple series from
            the {manySide}-hand side.
            {matching.include.length !== 0 && (
              <>
                {' '}
                Any {labelNameList(matching.include)} labels found on the {oneSide}-hand side are propagated into the result,
                in addition to the match group's labels.
              </>
            )}
          </li>
        )}
        {node.bool && (
          <li>
            <span className="promql-code promql-keyword">bool</span>: Instead of filtering series based on the outcome of the
            comparison for matched series, keep all series, but return the comparison outcome as a boolean{' '}
            <span className="promql-code promql-number">0</span> or <span className="promql-code promql-number">1</span>{' '}
            sample value.
          </li>
        )}
      </ul>
    </>
  );
};

const VectorVectorBinaryExprExplainView: FC<VectorVectorBinaryExprExplainViewProps> = ({ node, lhs, rhs }) => {
  const [allowLineBreaks, setAllowLineBreaks] = useState(false);

  const { matching } = node;
  if (matching === null) {
    // The parent should make sure to only pass in vector-vector binops that have their "matching" field filled out.
    throw new Error('missing matching parameters in vector-to-vector binop');
  }
  const sigf = signatureFunc(matching.on, matching.labels);

  // For the simplifcation of further calculations, we assume that the "one" side of a one-to-many
  // match is always on the right-hand side of the binop and swap otherwise to ensure this.
  const [lhsVec, rhsVec] = matching.card === vectorMatchCardinality.oneToMany ? [rhs, lhs] : [lhs, rhs];

  const rightSigs: {
    [k: string]: {
      rhs: InstantSample;
      lhs: InstantSample[]; // All the LHS samples matched with this RHS sample.
    };
  } = {};

  // const groupColors = [
  //   'rgb(255, 240, 214)',
  //   'rgb(188, 255, 199)',
  //   'rgb(255, 214, 250)',
  //   'rgb(214, 255, 253)',
  //   'rgb(199, 255, 224)',
  // ];

  const groupColors = ['#edc24030', '#afd8f830', '#cb4b4b30', '#4da74d30', '#9440ed30'];

  const styleLabel = (idx: number) => {
    return (label: string): CSSProperties => {
      return matching.on === matching.labels.includes(label) && (matching.on || label !== '__name__')
        ? { backgroundColor: '#edf3ff', fontStyle: 'italic' }
        : { backgroundColor: groupColors[idx % groupColors.length] };
    };
  };

  let matchErr: React.ReactNode | null = null;
  rhsVec.forEach((rs) => {
    const sig = sigf(rs.metric);
    if (sig in rightSigs) {
      const [oneSide, manySide] = matching.card === vectorMatchCardinality.oneToMany ? ['left', 'right'] : ['right', 'left'];
      matchErr = (
        <>
          <Alert variant="danger">
            <strong>Error:</strong> Found more than one series for a match group on the {oneSide}-hand side.
          </Alert>
          <Alert variant="secondary">
            <p>
              When requesting a {matching.card} operation via{' '}
              <span className="promql-code promql-keyword">group_{manySide}()</span>, you need to ensure that the series on
              the {oneSide}-hand side are still unique when only keeping the chosen matching labels, as PromQL does not allow
              many-to-many matching.
            </p>
            <p>
              The following match group (generated from the matching labels applied to series from the {oneSide}-hand side):
            </p>
            <ul>
              <li>
                <SeriesName
                  labels={matchLabels(rs.metric, matching.on, matching.labels)}
                  format={true}
                  styleLabel={styleLabel(0)}
                />
              </li>
            </ul>
            <p>...matches multiple series on the {oneSide}-hand-side ("one" side) of the operation:</p>
            <ul>
              {/* TODO: The margin is needed for highlighted backgrounds to not overlap with the next <li> item. Find better way? */}
              <li style={{ marginBottom: 5 }}>
                <SeriesName labels={rs.metric} format={true} styleLabel={styleLabel(0)} />
              </li>
              <li>
                <SeriesName labels={rightSigs[sig].rhs.metric} format={true} styleLabel={styleLabel(1)} />
              </li>
            </ul>
            <p>
              <strong>Possible fixes:</strong>
            </p>
            <ul>
              <li>
                Consider including more differentiating labels in your matching modifiers (via{' '}
                <span className="promql-code promql-keyword">on()</span> /{' '}
                <span className="promql-code promql-keyword">ignoring()</span>).
              </li>{' '}
              <li>
                Consider aggregating away extra (non-matching) dimensions on the {oneSide}-hand-side before applying the
                binary operation to collapse multiple matching series into one.
              </li>
              <li>
                Consider whether you are using the correct grouping modifier. Perhaps you need to change{' '}
                <span className="promql-code promql-keyword">group_{oneSide}()</span> to{' '}
                <span className="promql-code promql-keyword">group_{manySide}()</span>? The mentioned side in the modifier
                must point to the side with more dimensions.
              </li>
            </ul>
          </Alert>
        </>
      );
    }
    rightSigs[sig] = { rhs: rs, lhs: [] };
  });

  if (matchErr !== null) {
    return matchErr;
  }

  const matchedSigs: { [lhsSig: string]: Set<string> | null } = {};

  // LHS-side series that haven't found a match on the RHS.
  const unmatchedLHS: InstantSample[] = [];

  lhsVec.forEach((ls) => {
    const sig = sigf(ls.metric);
    if (!(sig in rightSigs)) {
      unmatchedLHS.push(ls);
      return;
    }

    if (matching.card === vectorMatchCardinality.oneToOne) {
      if (sig in matchedSigs) {
        matchErr = (
          <>
            multiple matches for labels: many-to-one matching must be explicit (
            <span className="promql-code promql-keyword">group_left()</span> /{' '}
            <span className="promql-code promql-keyword">group_right()</span>)
          </>
        );
      } else {
        matchedSigs[sig] = null;
      }
    } else {
      // TODO: The PromQL engine has more duplicate case checking here, but not sure if this can ever actually happen.
    }

    rightSigs[sig].lhs.push(ls);
  });

  if (matchErr !== null) {
    return <Alert variant="danger">{matchErr}</Alert>;
  }

  const unmatchedRow = (series: InstantSample, swap: boolean) => {
    const seriesCols = (
      <>
        <td>
          <SeriesName labels={series.metric} format={true} styleLabel={styleLabel(0)} />
        </td>
        <td>{series.value[1]}</td>
      </>
    );

    const unmatchedCols = (
      <>
        <td className="number-cell" style={{ color: '#a31515' }}>
          no match
        </td>
        <td className="number-cell" style={{ color: '#a31515' }}>
          no value
        </td>
      </>
    );

    const [leftCols, rightCols] = swap ? [unmatchedCols, seriesCols] : [seriesCols, unmatchedCols];

    return (
      <tbody>
        <tr>
          {leftCols}
          <td className="op-cell">{node.op}</td>
          {rightCols}
          <td className="op-cell">=</td>
          <td className="number-cell" style={{ color: 'grey' }}>
            dropped
          </td>
        </tr>
      </tbody>
    );
  };

  return (
    <>
      <Alert variant="secondary" className="mb-4">
        {explanationText(node)}
      </Alert>

      {/* <Table size="sm" className={`data-table vector-vector-table`}>
        <thead>
          <tr>
            <th colSpan={3}>{formatNode(node.lhs)}</th>
            <th>{formatNode(node, 1)}</th>
            <th colSpan={3}>{formatNode(node.rhs)}</th>
          </tr>
          <tr>
            <th>instance</th>
            <th>mode</th>
            <th>...</th>
            <th></th>
            <th>instance</th>
            <th>mode</th>
            <th>...</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>localhost:10000</td>
            <td>idle</td>
            <td></td>
            <td className="op-cell">{node.op}</td>
            <td>localhost:10000</td>
            <td>idle</td>
            <td></td>
          </tr>
          <tr>
            <td>localhost:10001</td>
            <td>idle</td>
            <td></td>
            <td className="op-cell">{node.op}</td>
            <td>localhost:10001</td>
            <td>idle</td>
            <td></td>
          </tr>
          <tr>
            <td>localhost:10000</td>
            <td>user</td>
            <td></td>
            <td className="op-cell">{node.op}</td>
            <td>localhost:10000</td>
            <td>user</td>
            <td></td>
          </tr>
        </tbody>
      </Table> */}
      {!isSetOperator(node.op) && (
        <>
          <Form.Check
            custom
            className="ml-2"
            type="checkbox"
            id="allow-linebreaks"
            onChange={() => setAllowLineBreaks(!allowLineBreaks)}
            defaultChecked={allowLineBreaks}
            label="Break long lines"
          />
          <Table bordered size="sm" className={`data-table vector-vector-table${allowLineBreaks ? '' : ' table-nobreak'}`}>
            <thead>
              <tr>
                <th>Left labels</th>
                <th>Left value</th>
                <th>Operator</th>
                <th>Right labels</th>
                <th>Right value</th>
                <th></th>
                <th>Result</th>
              </tr>
            </thead>
            {Object.keys(rightSigs).map((rs) => {
              const rhs = rightSigs[rs].rhs;
              const numMatches = rightSigs[rs].lhs.length;
              const rhsCols = (
                <>
                  <td rowSpan={0}>
                    <SeriesName labels={rhs.metric} format={true} styleLabel={styleLabel(0)} />
                  </td>
                  <td className="number-cell" rowSpan={numMatches}>
                    {rhs.value[1]}
                  </td>
                </>
              );

              // "one" side has no matches.
              if (numMatches === 0) {
                return unmatchedRow(rhs, matching.card === vectorMatchCardinality.oneToMany ? false : true);
              }

              return (
                <tbody key={rs}>
                  {rightSigs[rs].lhs.map((lhs, idx) => {
                    const numMatches = rightSigs[rs].lhs.length;
                    const rhs = rightSigs[rs].rhs;

                    const [vl, vr] =
                      matching.card !== vectorMatchCardinality.oneToMany
                        ? [lhs.value[1], rhs.value[1]]
                        : [rhs.value[1], lhs.value[1]];
                    let { value, keep } = vectorElemBinop(node.op, parsePrometheusFloat(vl), parsePrometheusFloat(vr));
                    if (node.bool) {
                      value = keep ? 1.0 : 0.0;
                    }

                    const lhsCols = (
                      <>
                        <td>
                          <SeriesName labels={lhs.metric} format={true} styleLabel={styleLabel(idx)} />
                        </td>
                        <td className="number-cell">
                          <span
                            className="highlighted-text"
                            style={{ backgroundColor: groupColors[idx % groupColors.length] }}
                          >
                            {lhs.value[1]}
                          </span>
                        </td>
                      </>
                    );

                    const condRHSCols = idx === 0 && rhsCols;

                    const [leftCols, rightCols] =
                      matching.card !== vectorMatchCardinality.oneToMany ? [lhsCols, condRHSCols] : [condRHSCols, lhsCols];

                    return (
                      <tr key={idx}>
                        {leftCols}
                        {idx === 0 && (
                          <td rowSpan={numMatches} className="op-cell">
                            {node.op}
                            {node.bool && ' bool'}
                          </td>
                        )}
                        {rightCols}
                        <td className="op-cell">=</td>
                        <td className="number-cell">
                          {keep || node.bool ? (
                            <span style={{ backgroundColor: groupColors[idx % groupColors.length] }}>
                              {formatPrometheusFloat(value)}
                            </span>
                          ) : (
                            <span style={{ color: 'grey' }}>dropped</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}

            {unmatchedLHS.map((lhs) => {
              return unmatchedRow(lhs, matching.card === vectorMatchCardinality.oneToMany ? true : false);
            })}
          </Table>
        </>
      )}
    </>
  );
};

export default VectorVectorBinaryExprExplainView;

import React, { FC, useState } from 'react';
import { BinaryExpr, vectorMatchCardinality } from '../../../../promql/ast';
import { InstantSample, Labels } from '../../../QueryList/QueryView/QueryResultTypes';
import SeriesName from '../../../../utils/SeriesName';
import { labelNameList } from '../../../../utils/LabelNameList';
import { isComparisonOperator, isSetOperator } from '../../../../promql/utils';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';
import {
  VectorMatchError,
  BinOpMatchGroup,
  MatchErrorType,
  computeVectorVectorBinOp,
  filteredSampleValue,
} from '../../../../promql/binOp';
import { formatNode } from '../../../../promql/format';
import { AiOutlineWarning } from 'react-icons/ai';

// We use this color pool for two purposes:
//
// 1. To distinguish different match groups from each other.
// 2. To distinguish multiple series within one match group from each other.
const colorPool = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
  '#393b79',
  '#637939',
  '#8c6d31',
  '#843c39',
  '#d6616b',
  '#7b4173',
  '#ce6dbd',
  '#9c9ede',
  '#c5b0d5',
  '#c49c94',
  '#f7b6d2',
  '#c7c7c7',
  '#dbdb8d',
  '#9edae5',
  '#393b79',
  '#637939',
  '#8c6d31',
  '#843c39',
  '#d6616b',
  '#7b4173',
  '#ce6dbd',
  '#9c9ede',
  '#c5b0d5',
  '#c49c94',
  '#f7b6d2',
  '#c7c7c7',
  '#dbdb8d',
  '#9edae5',
  '#17becf',
  '#393b79',
  '#637939',
  '#8c6d31',
  '#843c39',
  '#d6616b',
  '#7b4173',
  '#ce6dbd',
  '#9c9ede',
  '#c5b0d5',
  '#c49c94',
  '#f7b6d2',
];

const rhsColorOffset = colorPool.length / 2 + 3;
const colorForIndex = (idx: number, offset?: number) => `${colorPool[(idx + (offset || 0)) % colorPool.length]}80`;

interface VectorVectorBinaryExprExplainViewProps {
  node: BinaryExpr;
  lhs: InstantSample[];
  rhs: InstantSample[];
}

const noMatchLabels = (metric: Labels, on: boolean, labels: string[]): Labels => {
  const result: Labels = {};
  for (const name in metric) {
    if (!(labels.includes(name) === on && (on || name !== '__name__'))) {
      result[name] = metric[name];
    }
  }
  return result;
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

const explainError = (binOp: BinaryExpr, mg: BinOpMatchGroup, err: VectorMatchError) => {
  const fixes = (
    <>
      <p>
        <strong>Possible fixes:</strong>
      </p>
      <ul>
        {err.type === MatchErrorType.multipleMatchesForOneToOneMatching && (
          <li>
            <p>
              <strong>Allow {err.dupeSide === 'left' ? 'many-to-one' : 'one-to-many'} matching</strong>: If you want to allow{' '}
              {err.dupeSide === 'left' ? 'many-to-one' : 'one-to-many'} matching, you need to explicitly request it by adding
              a <span className="promql-code promql-keyword">group_{err.dupeSide}()</span> modifier to the operator:
            </p>
            <p className="text-center">
              {formatNode(
                {
                  ...binOp,
                  matching: {
                    ...(binOp.matching ? binOp.matching : { labels: [], on: false, include: [] }),
                    card: err.dupeSide === 'left' ? vectorMatchCardinality.manyToOne : vectorMatchCardinality.oneToMany,
                  },
                },
                true,
                1
              )}
            </p>
          </li>
        )}
        <li>
          <strong>Update your matching parameters:</strong> Consider including more differentiating labels in your matching
          modifiers (via <span className="promql-code promql-keyword">on()</span> /{' '}
          <span className="promql-code promql-keyword">ignoring()</span>) to split multiple series into distinct match
          groups.
        </li>
        <li>
          <strong>Aggregate the input:</strong> Consider aggregating away the extra labels that create multiple series per
          group before applying the binary operation.
        </li>
      </ul>
    </>
  );

  switch (err.type) {
    case MatchErrorType.multipleMatchesForOneToOneMatching:
      return (
        <>
          <p>
            Binary operators only allow <strong>one-to-one</strong> matching by default, but we found{' '}
            <strong>multiple series on the {err.dupeSide} side</strong> for this match group.
          </p>
          {fixes}
        </>
      );
    case MatchErrorType.multipleMatchesOnBothSides:
      return (
        <>
          <p>
            We found <strong>multiple series on both sides</strong> for this match group. Since{' '}
            <strong>many-to-many matching</strong> is not supported, you need to ensure that at least one of the sides only
            yields a single series.
          </p>
          {fixes}
        </>
      );
    case MatchErrorType.multipleMatchesOnOneSide:
      const [oneSide, manySide] =
        binOp.matching!.card === vectorMatchCardinality.oneToMany ? ['left', 'right'] : ['right', 'left'];
      return (
        <>
          <p>
            You requested <strong>{oneSide === 'right' ? 'many-to-one' : 'one-to-many'} matching</strong> via{' '}
            <span className="promql-code promql-keyword">group_{manySide}()</span>, but we also found{' '}
            <strong>multiple series on the {oneSide} side</strong> of the match group. Make sure that the {oneSide} side only
            contains a single series.
          </p>
          {fixes}
        </>
      );
    default:
      throw new Error('unknown match error');
  }
};

const VectorVectorBinaryExprExplainView: FC<VectorVectorBinaryExprExplainViewProps> = ({ node, lhs, rhs }) => {
  const [allowLineBreaks, setAllowLineBreaks] = useLocalStorage<boolean>(
    'promlens.explain.binary-operators.break-long-lines',
    true
  );

  const [showSampleValues, setShowSampleValues] = useLocalStorage<boolean>(
    'promlens.explain.binary-operators.show-sample-values',
    false
  );

  const [maxGroups, setMaxGroups] = useState<number | undefined>(100);
  const [maxSeriesPerGroup, setMaxSeriesPerGroup] = useState<number | undefined>(100);

  const { matching } = node;
  if (matching === null) {
    // The parent should make sure to only pass in vector-vector binops that have their "matching" field filled out.
    throw new Error('missing matching parameters in vector-to-vector binop');
  }

  const { groups: matchGroups, numGroups } = computeVectorVectorBinOp(node.op, matching, node.bool, lhs, rhs, {
    maxGroups: maxGroups,
    maxSeriesPerGroup: maxSeriesPerGroup,
  });
  const errCount = Object.values(matchGroups).filter((mg) => mg.error).length;

  return (
    <>
      <Alert variant="secondary" className="mb-4">
        {explanationText(node)}
      </Alert>

      {!isSetOperator(node.op) && (
        <>
          <Form inline>
            <Form.Check
              custom
              className="ml-2"
              type="checkbox"
              id="allow-linebreaks"
              onChange={() => setAllowLineBreaks(!allowLineBreaks)}
              defaultChecked={allowLineBreaks}
              label="Break long lines"
              style={{ marginBottom: 20 }}
            />
            <Form.Check
              custom
              className="ml-2"
              type="checkbox"
              id="show-sample-values"
              onChange={() => setShowSampleValues(!showSampleValues)}
              defaultChecked={showSampleValues}
              label="Show sample values"
              style={{ marginBottom: 20 }}
            />
          </Form>

          {numGroups > Object.keys(matchGroups).length && (
            <Alert variant="warning" className="mb-4">
              Too many match groups to display, only showing {Object.keys(matchGroups).length} out of {numGroups} groups.
              <Button variant="warning" className="mx-3" onClick={() => setMaxGroups(undefined)}>
                Show all groups
              </Button>
            </Alert>
          )}

          {errCount > 0 && (
            <Alert variant="warning" className="mb-4">
              Found matching issues in {errCount} match group{errCount > 1 ? 's' : ''}. See below for per-group error
              details.
            </Alert>
          )}

          <table className={`binop-table${allowLineBreaks ? '' : ' table-nobreak'}`}>
            <tbody>
              {Object.values(matchGroups).map((mg, mgIdx) => {
                const { groupLabels, lhs, lhsCount, rhs, rhsCount, result, error } = mg;

                const noLHSMatches = lhs.length === 0;
                const noRHSMatches = rhs.length === 0;

                const groupColor = colorPool[mgIdx % colorPool.length];
                const noMatchesColor = '#e0e0e0';
                const lhsGroupColor = noLHSMatches ? noMatchesColor : groupColor;
                const rhsGroupColor = noRHSMatches ? noMatchesColor : groupColor;
                const resultGroupColor = noLHSMatches || noRHSMatches ? noMatchesColor : groupColor;

                const matchGroupTitleRow = (color: string) => (
                  <tr className="group-title-row">
                    <td colSpan={2} style={{ backgroundColor: `${color}25` }}>
                      <SeriesName labels={groupLabels} format={true} />
                    </td>
                  </tr>
                );

                const matchGroupTable = (
                  series: InstantSample[],
                  seriesCount: number,
                  color: string,
                  colorOffset?: number
                ) => (
                  <div className="match-group-table-wrapper" style={{ border: `2px solid ${color}` }}>
                    <table className="binop-group-table">
                      <tbody>
                        {series.length === 0 ? (
                          <tr>
                            <td className="notice-cell">no matching series</td>
                          </tr>
                        ) : (
                          <>
                            {matchGroupTitleRow(color)}
                            {series.map((s, sIdx) => {
                              return (
                                <tr key={sIdx} className="series-row">
                                  <td>
                                    <div
                                      className="series-swatch"
                                      style={{
                                        backgroundColor: colorForIndex(sIdx, colorOffset),
                                      }}
                                    ></div>

                                    <SeriesName
                                      labels={noMatchLabels(s.metric, matching.on, matching.labels)}
                                      format={true}
                                    />
                                  </td>
                                  {showSampleValues && <td className="number-cell">{s.value[1]}</td>}
                                </tr>
                              );
                            })}
                          </>
                        )}
                        {seriesCount > series.length && (
                          <tr>
                            <td className="notice-cell">
                              {seriesCount - series.length} more series omitted –
                              <Button size="sm" variant="link" onClick={() => setMaxSeriesPerGroup(undefined)}>
                                show all
                              </Button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );

                const lhsTable = matchGroupTable(lhs, lhsCount, lhsGroupColor);
                const rhsTable = matchGroupTable(rhs, rhsCount, rhsGroupColor, rhsColorOffset);

                const resultTable = (
                  <div className="match-group-table-wrapper" style={{ border: `2px solid ${resultGroupColor}` }}>
                    <table className="binop-group-table">
                      <tbody>
                        {noLHSMatches || noRHSMatches ? (
                          <tr>
                            <td className="notice-cell">dropped</td>
                          </tr>
                        ) : error !== null ? (
                          <tr>
                            <td className="notice-cell">error, result omitted</td>
                          </tr>
                        ) : (
                          <>
                            {result.map(({ sample, manySideIdx }, resIdx) => {
                              const filtered = sample.value[1] === filteredSampleValue;
                              const [lIdx, rIdx] =
                                matching.card === vectorMatchCardinality.oneToMany ? [0, manySideIdx] : [manySideIdx, 0];

                              return (
                                <tr key={resIdx} className="series-row">
                                  <td
                                    style={{ opacity: filtered ? 0.5 : 1 }}
                                    title={filtered ? 'Series has been filtered by comparison operator' : undefined}
                                  >
                                    <div
                                      className="series-swatch"
                                      style={{
                                        backgroundColor: colorForIndex(lIdx),
                                        marginRight: 0,
                                      }}
                                    ></div>
                                    <span style={{ color: '#aaa' }}>–</span>
                                    <div
                                      className="series-swatch"
                                      style={{
                                        backgroundColor: colorForIndex(rIdx, rhsColorOffset),
                                      }}
                                    ></div>
                                    <SeriesName labels={sample.metric} format={true} />
                                  </td>
                                  {showSampleValues && (
                                    <td className="number-cell">
                                      {filtered ? (
                                        <span style={{ color: 'grey' }}>filtered</span>
                                      ) : (
                                        <span>{sample.value[1]}</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                );

                return (
                  <React.Fragment key={mgIdx}>
                    {mgIdx !== 0 && <tr style={{ height: 30 }}></tr>}
                    <tr>
                      <td colSpan={5}>
                        {error && (
                          <>
                            <Card className={mgIdx === 0 ? 'mb-4' : 'my-4'} style={{ maxWidth: 1000, margin: 'auto' }}>
                              <Card.Header style={{ color: '#721c24', backgroundColor: '#f8d7da', borderColor: '#f5c6cb' }}>
                                <strong>
                                  <AiOutlineWarning style={{ marginBottom: 3 }} /> Error for match group below:
                                </strong>
                              </Card.Header>
                              <Card.Body>{explainError(node, mg, error)}</Card.Body>
                            </Card>
                          </>
                        )}
                      </td>
                    </tr>
                    <tr className="match-group-row">
                      <td className="match-group-cell">{lhsTable}</td>
                      <td className="op-cell">
                        {node.op}
                        {node.bool && ' bool'}
                      </td>
                      <td className="match-group-cell">{rhsTable}</td>
                      <td className="op-cell">=</td>
                      <td className="match-group-cell">{resultTable}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};

export default VectorVectorBinaryExprExplainView;

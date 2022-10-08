import React, { FC, useMemo, useState } from 'react';
import { PromAPI } from '../../../../promAPI/promAPI';
import { Alert, Form, Button, Badge } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { BiArrowBack } from 'react-icons/bi';
import { BsFileArrowUp } from 'react-icons/bs';
import AutosuggestInput from '../../QueryView/NodeEditor/AutosuggestInput';
import { LabelMatcher, matchType, nodeType, VectorSelector } from '../../../../promql/ast';
import serializeNode from '../../../../promql/serialize';
import { Metric } from '../../QueryView/QueryResultTypes';
import { escapeString } from '../../../../promql/utils';
import { formatNode } from '../../../../promql/format';
import { HiOutlineClipboardCopy } from 'react-icons/hi';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';
import { getUniqueID } from '../../../../utils/utils';

interface SeriesExplorerProps {
  promAPI: PromAPI;
  metricName: string;
  hideLabelsExplorer: () => void;
  hideMetricsExplorer: () => void;
  insertText: (text: string) => void;
}

const LabelsExplorer: FC<SeriesExplorerProps> = ({
  promAPI,
  metricName,
  hideMetricsExplorer,
  hideLabelsExplorer,
  insertText,
}) => {
  const id = useMemo<number>(getUniqueID, []);

  const [expandedLabels, setExpandedLabels] = useState<string[]>([]);
  const [matchers, setMatchers] = useState<LabelMatcher[]>([]);
  const [newMatcher, setNewMatcher] = useState<LabelMatcher | null>(null);
  const [sortByCard, setSortByCard] = useLocalStorage<boolean>('promlens.labels-explorer.sort-by-cardinality', true);

  const removeMatcher = (name: string) => {
    setMatchers(matchers.filter((m) => m.name !== name));
  };

  const addMatcher = () => {
    if (newMatcher === null) {
      throw new Error('tried to add null label matcher');
    }

    setMatchers([...matchers, newMatcher]);
    setNewMatcher(null);
  };

  const matcherBadge = (m: LabelMatcher) => (
    <Badge key={m.name} variant="light" style={{ fontSize: 'unset', margin: 2 }}>
      <span style={{ padding: '0 5px', fontWeight: 'normal' }} className="promql-code">
        <span className="promql-label-name">{m.name}</span>
        {m.type}
        <span className="promql-string">"{escapeString(m.value)}"</span>
      </span>
      <Button
        variant="light"
        style={{ marginLeft: 5, padding: 4 }}
        onClick={() => {
          removeMatcher(m.name);
        }}
      >
        <FaTimes />
      </Button>
    </Badge>
  );

  const selector: VectorSelector = {
    type: nodeType.vectorSelector,
    name: metricName,
    matchers,
    offset: 0,
    timestamp: null,
    startOrEnd: null,
  };
  const seriesQuery = promAPI.useFetchAPI<Metric[]>(`/api/v1/series?match[]=${encodeURIComponent(serializeNode(selector))}`);
  const [numSeries, labelCardinalities, labelExamples] = useMemo(() => {
    const labelCardinalities: Record<string, number> = {};
    const labelExamples: Record<string, { value: string; count: number }[]> = {};

    if (seriesQuery.data !== undefined) {
      const labelValuesByName: Record<string, Record<string, number>> = {};

      seriesQuery.data.forEach((series: Metric) => {
        Object.entries(series).forEach(([ln, lv]) => {
          if (ln !== '__name__') {
            if (!labelValuesByName.hasOwnProperty(ln)) {
              labelValuesByName[ln] = { [lv]: 1 };
            } else {
              if (!labelValuesByName[ln].hasOwnProperty(lv)) {
                labelValuesByName[ln][lv] = 1;
              } else {
                labelValuesByName[ln][lv]++;
              }
            }
          }
        });
      });

      Object.entries(labelValuesByName).forEach(([ln, lvs]) => {
        labelCardinalities[ln] = Object.keys(lvs).length;
        // labelExamples[ln] = Array.from({ length: Math.min(5, lvs.size) }, (i => () => i.next().value)(lvs.keys()));
        // Sort label values by their number of occurrences within this label name.
        labelExamples[ln] = Object.entries(lvs)
          .sort(([, aCnt], [, bCnt]) => bCnt - aCnt)
          .map(([lv, cnt]) => ({ value: lv, count: cnt }));
      });
    }

    return [seriesQuery.data?.length, labelCardinalities, labelExamples];
  }, [seriesQuery.data]);

  if (seriesQuery.error) {
    return (
      <Alert variant="danger">
        <strong>Error querying series:</strong> {seriesQuery.error.message}
      </Alert>
    );
  }

  const sortedLabelCards = Object.entries(labelCardinalities).sort((a, b) => (sortByCard ? b[1] - a[1] : 0));

  return (
    <div style={{ fontSize: '0.8em' }}>
      <div>
        <Button variant="light" size="sm" onClick={hideLabelsExplorer}>
          <BiArrowBack /> Explore all metrics
        </Button>
        <Button
          variant="light"
          size="sm"
          style={{ fontSize: '1rem', marginLeft: 5 }}
          className="float-right"
          title="Close metrics explorer"
          onClick={hideMetricsExplorer}
        >
          <FaTimes />
        </Button>
      </div>
      {/* <p style={{ fontSize: '0.8em' }} className="mt-4"> */}
      <div style={{ overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15, marginTop: 25 }}>
          <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>Selector:</div>
          <div>
            <Badge variant="light" style={{ fontSize: 'unset', fontWeight: 'unset' }}>
              <span style={{ wordBreak: 'break-word', whiteSpace: 'unset' }}>{formatNode(selector, false)}</span>
              <Button variant="secondary" size="sm" onClick={() => insertText(serializeNode(selector))} className="ml-3">
                <BsFileArrowUp /> Insert
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigator.clipboard.writeText(serializeNode(selector))}
                className="ml-2"
              >
                <HiOutlineClipboardCopy /> Copy
              </Button>
            </Badge>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
          <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>Filters:</div>
          <div>
            {matchers.length > 0 ? (
              <div style={{ marginLeft: -2 }}>{matchers.map((m) => matcherBadge(m))}</div>
            ) : (
              <>No filters</>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 25 }}>
          <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>Results:</div>
          <div>{numSeries !== undefined ? `${numSeries} series` : 'loading...'}</div>
        </div>
        <div className="float-right">
          <Form.Check
            type="switch"
            id={`sort-by-cardinality-${id}`}
            label="Sort by number of values"
            checked={sortByCard}
            style={{ margin: '0 0 15px 3px' }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSortByCard(e.target.checked)}
          />
        </div>
      </div>
      {/* </p> */}
      {seriesQuery.loading ? (
        <Alert variant="secondary">Loading...</Alert>
      ) : (
        sortedLabelCards.map(([ln, card]) => (
          <div key={ln} style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid lightgrey' }}>
            <div style={{ width: '50%', paddingRight: 50 }}>
              <Form
                onSubmit={(e: React.FormEvent) => {
                  // Without this, the page gets reloaded for forms that only have a single input field, see
                  // https://stackoverflow.com/questions/1370021/why-does-forms-with-single-input-field-submit-upon-pressing-enter-key-in-input.
                  e.preventDefault();
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <strong className="mr-3 promql-code">{ln}</strong>
                  {matchers.some((m) => m.name === ln) ? (
                    matcherBadge(matchers.find((m) => m.name === ln)!)
                  ) : newMatcher?.name === ln ? (
                    <div style={{ display: 'flex' }}>
                      <Form.Control
                        size="sm"
                        className="pending-input-item"
                        style={{ width: 'auto' }}
                        as="select"
                        value={newMatcher.type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setNewMatcher({ ...newMatcher, type: e.currentTarget.value as matchType })
                        }
                      >
                        {Object.values(matchType).map((mt) => (
                          <option key={mt} value={mt}>
                            {mt}
                          </option>
                        ))}
                      </Form.Control>
                      <AutosuggestInput
                        value={newMatcher.value}
                        placeholder="label value"
                        onChange={(value) => setNewMatcher({ ...newMatcher, value: value })}
                        onEnter={addMatcher}
                        inputClass="pending-input-item ml-1"
                        items={labelExamples[ln].map((ex) => ex.value)}
                        autoFocus
                        append
                      />
                      <Button variant="secondary" size="sm" className="ml-1" onClick={() => addMatcher()}>
                        Apply
                      </Button>
                      <Button variant="light" size="sm" className="ml-1" onClick={() => setNewMatcher(null)}>
                        <FaTimes />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="px-3"
                      variant="light"
                      size="sm"
                      onClick={() => setNewMatcher({ name: ln, type: matchType.equal, value: '' })}
                    >
                      Filter...
                    </Button>
                  )}
                </div>
              </Form>
            </div>
            <div style={{ width: '50%' }}>
              <p className="mt-2">
                <strong>
                  {card} value{card > 1 && 's'}
                </strong>
              </p>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                {(expandedLabels.includes(ln) ? labelExamples[ln] : labelExamples[ln].slice(0, 5)).map(
                  ({ value, count }) => (
                    <li key={value}>
                      <span
                        className="promql-code promql-string series-explorer-label-value"
                        onClick={() => {
                          setMatchers([
                            ...matchers.filter((m) => m.name !== ln),
                            { name: ln, type: matchType.equal, value: value },
                          ]);
                          setNewMatcher(null);
                        }}
                        title="Click to filter by value"
                      >
                        "{escapeString(value)}"
                      </span>{' '}
                      ({count} series)
                    </li>
                  )
                )}
                {expandedLabels.includes(ln) ? (
                  <li style={{ listStyle: 'none' }}>
                    <a href="#" onClick={() => setExpandedLabels(expandedLabels.filter((l) => l != ln))}>
                      Hide full values
                    </a>
                  </li>
                ) : (
                  labelExamples[ln].length > 5 && (
                    <>
                      <li>
                        <a href="#" onClick={() => setExpandedLabels([...expandedLabels, ln])}>
                          Show {labelExamples[ln].length - 5} more values...
                        </a>
                      </li>
                      {/* <li style={{ listStyle: 'none' }}>
                          <a href="#" onClick={() => setExpandedLabels([...expandedLabels, ln])}>
                            show all values
                          </a>
                        </li> */}
                    </>
                  )
                )}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default LabelsExplorer;

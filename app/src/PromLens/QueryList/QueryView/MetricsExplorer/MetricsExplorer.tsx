import React, { FC, useState } from 'react';
import { PromAPI } from '../../../../promAPI/promAPI';
import { Table, Alert, Form, Button } from 'react-bootstrap';
import { MetricMetadata } from '../../../../types/types';
import { FaTimes } from 'react-icons/fa';
import { BsFileArrowUp, BsSearch } from 'react-icons/bs';
import { HiOutlineClipboardCopy } from 'react-icons/hi';
import LabelsExplorer from './LabelsExplorer';
import fuzzy from 'fuzzy';

interface MetricsExplorerProps {
  promAPI: PromAPI;
  metricNames: string[];
  hide: () => void;
  insertText: (text: string) => void;
}

const getSearchMatches = (input: string, expressions: string[]) =>
  fuzzy.filter(input.replace(/ /g, ''), expressions, {
    pre: '<b style="color: rgb(0, 102, 191)">',
    post: '</b>',
  });

const MetricsExplorer: FC<MetricsExplorerProps> = ({ promAPI, metricNames, hide, insertText }) => {
  const metricMeta = promAPI.useFetchAPI<MetricMetadata>(`/api/v1/metadata`);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const [filterText, setFilterText] = useState<string>('');

  const getMeta = (m: string) =>
    metricMeta.data === undefined
      ? []
      : metricMeta.data[m.replace(/(_count|_sum|_bucket)$/, '')] || [{ help: 'unknown', type: 'unknown', unit: 'unknown' }];

  if (selectedMetric !== null) {
    return (
      <div className="metrics-explorer">
        <LabelsExplorer
          promAPI={promAPI}
          metricName={selectedMetric}
          hideLabelsExplorer={() => setSelectedMetric(null)}
          hideMetricsExplorer={hide}
          insertText={insertText}
        />
      </div>
    );
  }

  return (
    <div className="metrics-explorer">
      {metricMeta.loading ? (
        <Alert variant="secondary">Loading metric metadata...</Alert>
      ) : (
        <>
          {metricMeta.error !== undefined && (
            <Alert variant="warning">
              <strong>Couldn't load metric metadata:</strong> {metricMeta.error.message} &ndash; Most likely your endpoint
              doesn't support fetching metric metadata? Only showing metric names.
            </Alert>
          )}
          <Form className="small">
            <Form.Group>
              <Form.Label>Filter metrics by:</Form.Label>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filterText}
                  title="Filter by text"
                  placeholder="Enter text to filter metric names by..."
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.currentTarget.value)}
                  className="metric-name-filter"
                  autoFocus
                />
                <Button
                  variant="light"
                  size="sm"
                  style={{ fontSize: '1rem', marginLeft: 5 }}
                  title="Close metrics explorer"
                  onClick={hide}
                >
                  <FaTimes />
                </Button>
              </div>
            </Form.Group>
          </Form>
          <Table hover size="sm" className="data-table" bordered>
            <tbody style={{ borderTop: '1px solid #eee' }}>
              {/* Hoping (but not tested) that skipping the filter() completely for empty filter strings helps with performance. */}
              {(filterText === ''
                ? metricNames.map((m) => ({ original: m, string: m }))
                : getSearchMatches(filterText, metricNames)
              ).map((m) => (
                <tr key={m.original}>
                  <td>
                    <div style={{ float: 'left' }} dangerouslySetInnerHTML={{ __html: m.string }}></div>
                    <div style={{ float: 'right', margin: '-3px 0' }}>
                      <Button
                        variant="light"
                        size="sm"
                        title="Explore metric series"
                        style={{
                          padding: '.1rem .8rem',
                          fontFamily: "'Open Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
                        }}
                        onClick={() => setSelectedMetric(m.original)}
                      >
                        <BsSearch color="#333" onClick={() => setSelectedMetric(m.original)} className="mr-1" /> Explore
                        labels
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        title="Insert metric at cursor position"
                        style={{ padding: '.1rem .2rem', marginLeft: 8 }}
                        onClick={() => insertText(m.original)}
                      >
                        <BsFileArrowUp color="#333" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        title="Copy to clipboard"
                        style={{ padding: '.1rem .2rem', marginLeft: 8 }}
                        onClick={() => navigator.clipboard.writeText(m.original)}
                      >
                        <HiOutlineClipboardCopy color="#333" />
                      </Button>
                    </div>
                  </td>
                  <td className="metadata-type">
                    {getMeta(m.original).map((meta, idx) => (
                      <React.Fragment key={idx}>
                        {meta.type}
                        <br />
                      </React.Fragment>
                    ))}
                  </td>
                  <td className="metadata-help">
                    {getMeta(m.original).map((meta, idx) => (
                      <React.Fragment key={idx}>
                        {meta.help}
                        <br />
                      </React.Fragment>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
};

export default MetricsExplorer;

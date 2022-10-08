import { FC, useState, useMemo, useEffect } from 'react';
import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import ASTNode, {
  MatrixSelector,
  VectorSelector,
  matchType,
  nodeType,
  LabelMatcher,
  valueType,
  Subquery,
} from '../../../../promql/ast';
import DurationEditor from './DurationEditor';
import AutosuggestInput from './AutosuggestInput';
import { NodeConstraints } from '../types';
import { Form, FormGroup, Col, Row, Button } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';
import { Help } from './Help';
import AtAndOffsetEditor from './AtAndOffsetEditor';
import { PromAPI } from '../../../../promAPI/promAPI';

interface SelectionEditorProps {
  node: MatrixSelector | VectorSelector;
  onUpdate: (node: ASTNode) => void;
  metricNames: string[];
  promAPI: PromAPI;
  constraints: NodeConstraints;
}

const defaultNewMatcher = { name: '', type: matchType.equal, value: '' };

const SelectionEditor: FC<SelectionEditorProps> = ({ node, onUpdate, metricNames, promAPI, constraints }) => {
  const id = useMemo<number>(getUniqueID, []);

  const [newMatcher, setNewMatcher] = useState<LabelMatcher>(defaultNewMatcher);
  const labelNamesQuery = promAPI.useFetchAPI<string[]>('/api/v1/labels');

  // ---- OLD CODE
  // const seriesQuery = useFetchAPI<Record<string, string>[]>(
  //   `/api/v1/series?match[]=${encodeURIComponent(node.name !== '' ? node.name : serializeNode(node))}`
  // );

  // useEffect(() => {
  //   if (seriesQuery.data !== undefined) {
  //     const labelNameSet = new Set<string>();
  //     const labelValueSets: { [k: string]: Set<string> } = {};
  //     for (const series of seriesQuery.data) {
  //       Object.entries(series).forEach(([ln, lv]) => {
  //         labelNameSet.add(ln);
  //         if (!labelValueSets.hasOwnProperty(ln)) {
  //           labelValueSets[ln] = new Set();
  //         }
  //         labelValueSets[ln].add(lv);
  //       });
  //     }
  //     setLabelNameSuggestions(Array.from(labelNameSet));
  //     setLabelValueSuggestions(Object.fromEntries(Object.entries(labelValueSets).map(([ln, lvs]) => [ln, Array.from(lvs)])));
  //   }
  // }, [seriesQuery.data]);

  const removeMatcher = (idx: number) => {
    const matchers = [...node.matchers];
    matchers.splice(idx, 1);
    onUpdate({ ...node, matchers });
  };

  const addMatcher = () => {
    // TODO: Proper regex-based validation.
    if (newMatcher.name === '' || newMatcher.value === '') {
      return;
    }
    onUpdate({ ...node, matchers: [...node.matchers, newMatcher] });
    setNewMatcher(defaultNewMatcher);
  };

  const changeMatcher = (idx: number, matcher: LabelMatcher) => {
    const matchers = [...node.matchers];
    matchers[idx] = matcher;
    onUpdate({ ...node, matchers });
  };

  const instantDisabled = !constraints.allowedValueTypes.includes(valueType.vector);
  const rangeDisabled = !constraints.allowedValueTypes.includes(valueType.matrix);

  if (!(instantDisabled && rangeDisabled)) {
    // ^
    // Only switch to the other type if we didn't manage to maneuver ourselves into a situation where
    // a selector node isn't allowed at all in this place (e.g. manually edit scalar child to selector, then open editor).
    // Otherwise we get an infinite loop.

    if (node.type === nodeType.vectorSelector && instantDisabled) {
      onUpdate({ ...node, type: nodeType.matrixSelector, range: 300000 });
    }

    if (node.type === nodeType.matrixSelector && rangeDisabled) {
      onUpdate({ ...node, type: nodeType.vectorSelector });
    }
  }

  return (
    <>
      <Form.Group>
        <Form.Label>Metric name:</Form.Label>
        <AutosuggestInput
          value={node.name}
          placeholder="metric name"
          onChange={(value) =>
            onUpdate({
              ...node,
              name: value,
              matchers: node.matchers.map((lm) => {
                // Disallow two different equals matchers for the metric name.
                if (lm.name === '__name__' && lm.type === matchType.equal) {
                  return {
                    ...lm,
                    value: value,
                  };
                }
                return lm;
              }),
            })
          }
          items={metricNames}
        />
      </Form.Group>
      <FormGroup>
        <Form.Label>Label matchers:</Form.Label>
        <Help text="Label matching criteria to restrict the set of time series returned." />
        {node.matchers.map(
          (lm, idx) =>
            !(lm.name === '__name__' && lm.value === node.name) && (
              // TODO: Deal with duplicate label names.
              <Row key={idx} className="mb-1" noGutters>
                <Col xs="6">
                  <Row noGutters>
                    <Col>
                      <AutosuggestInput
                        value={lm.name}
                        placeholder="label name"
                        onChange={(value) => changeMatcher(idx, { ...lm, name: value })}
                        items={labelNamesQuery.data || []}
                      />
                    </Col>
                    <Col xs="auto" style={{ marginLeft: 3, marginRight: 3 }}>
                      <Form.Control
                        size="sm"
                        as="select"
                        value={lm.type}
                        onChange={(e) => changeMatcher(idx, { ...lm, type: e.currentTarget.value as matchType })}
                      >
                        {Object.values(matchType).map((mt) => (
                          <option key={mt} value={mt}>
                            {mt}
                          </option>
                        ))}
                      </Form.Control>
                    </Col>
                  </Row>
                </Col>

                <Col xs="6">
                  <Row noGutters>
                    <Col>
                      <LabelValueEditor
                        name={lm.name}
                        value={lm.value}
                        onChange={(value) => changeMatcher(idx, { ...lm, value: value })}
                        promAPI={promAPI}
                      />
                    </Col>
                    <Col xs="auto" style={{ marginLeft: 3 }}>
                      <Button variant="secondary" size="sm" onClick={() => removeMatcher(idx)}>
                        <FaTrash />
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            )
        )}

        <Row className="mb-1" noGutters>
          <Col xs="6">
            <Row noGutters>
              <Col>
                <AutosuggestInput
                  value={newMatcher.name}
                  placeholder="label name"
                  onChange={(value) => setNewMatcher({ ...newMatcher, name: value })}
                  onEnter={addMatcher}
                  items={labelNamesQuery.data || []}
                  inputClass="pending-input-item"
                />
              </Col>
              <Col xs="auto" style={{ marginLeft: 3, marginRight: 3 }}>
                <Form.Control
                  size="sm"
                  className="pending-input-item"
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
              </Col>
            </Row>
          </Col>
          <Col xs="6">
            <Row noGutters>
              <Col>
                <LabelValueEditor
                  name={newMatcher.name}
                  value={newMatcher.value}
                  onChange={(value) => setNewMatcher({ ...newMatcher, value: value })}
                  onEnter={addMatcher}
                  inputClass="pending-input-item"
                  promAPI={promAPI}
                />
              </Col>
              <Col xs="auto" style={{ marginLeft: 3 }}>
                <Button variant="secondary" size="sm" onClick={() => addMatcher()}>
                  <FaPlus />
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </FormGroup>

      <Form.Group>
        <Form.Label>Select:</Form.Label>
        <Help text="Whether to select a single sample at the current evaluation timestamp (instant vector) or a range of samples going from the past to the current timestamp (range vector)." />
        <Form.Check
          custom
          type="radio"
          name="radio-selector-type"
          id={`radio-selector-type-vector-${id}`}
          label={`Instant value${instantDisabled ? ' (not applicable here)' : ''}`}
          disabled={instantDisabled}
          checked={node.type === nodeType.vectorSelector}
          onChange={() => onUpdate({ ...node, type: nodeType.vectorSelector })}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-selector-type"
          id={`radio-selector-type-matrix-${id}`}
          label={`Range of values${rangeDisabled ? ' (not applicable here)' : ''}`}
          disabled={rangeDisabled}
          checked={node.type === nodeType.matrixSelector}
          onChange={() => onUpdate({ ...node, type: nodeType.matrixSelector, range: 300000 })}
        />
      </Form.Group>
      {node.type === nodeType.matrixSelector && (
        <FormGroup>
          <Form.Label>Range:</Form.Label>
          <Help text="The time range for which to select samples (going from the past to the current timestamp). E.g. '5m' or '1h'." />
          <DurationEditor duration={node.range} onUpdate={(d: number) => onUpdate({ ...node, range: d })} />
        </FormGroup>
      )}
      <AtAndOffsetEditor node={node} onUpdate={(node: MatrixSelector | VectorSelector | Subquery) => onUpdate(node)} />
    </>
  );
};

interface LabelValueEditorProps {
  name: string;
  value: string;
  onChange: (name: string) => void;
  onEnter?: () => void;
  inputClass?: string;
  promAPI: PromAPI;
}

export const LabelValueEditor: FC<LabelValueEditorProps> = ({ name, value, onChange, onEnter, inputClass, promAPI }) => {
  const labelValuesQuery = promAPI.useFetchAPI<string[]>(`/api/v1/label/${name}/values`, name.trim() === '');

  return (
    <AutosuggestInput
      value={value}
      placeholder="label value"
      onChange={onChange}
      onEnter={onEnter}
      items={labelValuesQuery.data || []}
      inputClass={inputClass}
      append
    />
  );
};

export default SelectionEditor;

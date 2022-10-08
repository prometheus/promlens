import React, { FC, useMemo } from 'react';
import ASTNode, { BinaryExpr, binaryOperatorType, VectorMatching, vectorMatchCardinality } from '../../../../promql/ast';
import LabelListEditor from './LabelListEditor';
import { Form, FormGroup } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';
import { Help } from './Help';
import { isComparisonOperator, isSetOperator } from '../../../../promql/utils';

interface BinaryExprEditorProps {
  node: BinaryExpr;
  onUpdate: (node: ASTNode) => void;
}

const BinaryExprEditor: FC<BinaryExprEditorProps> = ({ node, onUpdate }) => {
  const id = useMemo<number>(getUniqueID, []);

  return (
    <>
      <Form.Group>
        <Form.Label>Operator:</Form.Label>
        <Form.Control
          size="sm"
          as="select"
          id={`select-operator-${id}`}
          value={node.op}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onUpdate({
              ...node,
              op: e.currentTarget.value as binaryOperatorType,
              bool: isComparisonOperator(e.currentTarget.value as binaryOperatorType) ? node.bool : false,
              matching: isSetOperator(e.currentTarget.value as binaryOperatorType)
                ? {
                    include: [],
                    card: vectorMatchCardinality.manyToMany,
                    on: node.matching ? node.matching.on : false,
                    labels: node.matching ? node.matching.labels : [],
                  }
                : // TODO: Ensure that many-to-many gets removed.
                node.matching?.card === vectorMatchCardinality.manyToMany
                ? { ...node.matching, card: vectorMatchCardinality.oneToOne }
                : node.matching,
            })
          }
        >
          {Object.values(binaryOperatorType).map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      {isComparisonOperator(node.op) && (
        <FormGroup>
          <Form.Label>Comparison behavior:</Form.Label>
          <Help text="Choose whether to omit series from the result when the comparison result is negative, or whether to keep the series, but set the sample value to 0 (comparison result is false) or 1 (comparison result is true)." />
          <Form.Check
            custom
            type="radio"
            name="radio-comp-behavior"
            id={`radio-comp-behavior-filter-${id}`}
            label="Filter (omit non-matching series from result)"
            checked={!node.bool}
            onChange={() => onUpdate({ ...node, bool: false })}
          />
          <Form.Check
            custom
            type="radio"
            name="radio-comp-behavior"
            id={`radio-comp-behavior-bool-${id}`}
            label={
              <>
                Return boolean values (<span className="promql-code keyword">bool</span>)
              </>
            }
            checked={node.bool}
            onChange={() => onUpdate({ ...node, bool: true })}
          />
        </FormGroup>
      )}
      <FormGroup>
        <Form.Check
          type="switch"
          id={`enable-vector-matching-${id}`}
          name="enable-vector-matching"
          label="Customize vector matching options"
          className="mb-2"
          checked={node.matching !== null}
          onChange={() =>
            onUpdate({
              ...node,
              matching:
                node.matching === null
                  ? {
                      on: false,
                      labels: [],
                      card: isSetOperator(node.op) ? vectorMatchCardinality.manyToMany : vectorMatchCardinality.oneToOne,
                      include: [],
                    }
                  : null,
            })
          }
        />
        {node.matching !== null && (
          <div style={{ borderRadius: 3, border: '1px solid lightgrey', padding: 14 }}>
            <VectorMatchingEditor matching={node.matching} onUpdate={(m) => onUpdate({ ...node, matching: m })} />
          </div>
        )}
      </FormGroup>
    </>
  );
};

interface VectorMatchingEditorProps {
  matching: VectorMatching;
  onUpdate: (matching: VectorMatching) => void;
}

const VectorMatchingEditor: FC<VectorMatchingEditorProps> = ({ matching, onUpdate }) => {
  const id = useMemo<number>(getUniqueID, []);

  return (
    <>
      <FormGroup>
        <Form.Label>Match on:</Form.Label>
        <Help text="For vector-to-vector binary operations, specify whether to match series between the left and right side of the binary operation on a either specified set of labels or on all labels except some." />
        <Form.Check
          custom
          type="radio"
          name="radio-match"
          id={`radio-match-on-${id}`}
          label={
            <>
              specified labels (<span className="promql-code promql-keyword">on</span>)
            </>
          }
          checked={matching.on}
          onChange={() => onUpdate({ ...matching, on: true })}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-match"
          id={`radio-match-ignoring-${id}`}
          label={
            <>
              all labels except some (<span className="promql-code promql-keyword">ignoring</span>)
            </>
          }
          checked={!matching.on}
          onChange={() => onUpdate({ ...matching, on: false })}
        />
      </FormGroup>

      <FormGroup>
        {matching.on ? (
          <>
            <Form.Label>Match labels:</Form.Label>
            <Help text="The labels that need to match between series on the left and right sides in order for the binary operation to take place between them." />
          </>
        ) : (
          <>
            <Form.Label>Ignore labels:</Form.Label>
            <Help text="The labels to ignore when matching series on the left and right sides in order for the binary operation to take place between them." />
          </>
        )}

        <LabelListEditor labels={matching.labels} onUpdate={(labels: string[]) => onUpdate({ ...matching, labels })} />
      </FormGroup>

      {/* If we already have many-to-many, it's a set op, and they only do many-to-many (but nobody else does). */}
      {matching.card !== vectorMatchCardinality.manyToMany && (
        <FormGroup>
          <Form.Label>Match type:</Form.Label>
          <Help text="When there is not a distinct 1:1 match (given the matching criteria above) between series from the left and right sides of the binary operation, you need to explicitly allow matching multiple series from one side to the same series on the other. Many-to-many matching is only allowed (and required) for set operations." />
          <Form.Control
            size="sm"
            as="select"
            value={matching.card}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onUpdate({ ...matching, card: e.currentTarget.value as vectorMatchCardinality })
            }
          >
            {Object.values(vectorMatchCardinality)
              .filter((c) => c !== vectorMatchCardinality.manyToMany)
              .map((card) => (
                <option key={card} value={card}>
                  {card}
                </option>
              ))}
          </Form.Control>
        </FormGroup>
      )}

      {[vectorMatchCardinality.oneToMany, vectorMatchCardinality.manyToOne].includes(matching.card) && (
        <FormGroup>
          <Form.Label>Include labels:</Form.Label>
          <Help text="When doing a one-to-many or many-to-one match, specify which extra labels from the lower-cardinality ('one') side you would like to include in the result. This does not affect matching behavior." />
          <LabelListEditor
            labels={matching.include}
            onUpdate={(labels: string[]) => onUpdate({ ...matching, include: labels })}
          />
        </FormGroup>
      )}
    </>
  );
};

export default BinaryExprEditor;

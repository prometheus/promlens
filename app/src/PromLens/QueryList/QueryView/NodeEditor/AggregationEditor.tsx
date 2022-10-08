import React, { FC, useMemo } from 'react';
import ASTNode, { Aggregation, aggregationType, nodeType } from '../../../../promql/ast';
import LabelListEditor from './LabelListEditor';
import { aggregatorsWithParam } from '../../../../promql/utils';
import { Form } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';
import { Help } from './Help';

interface AggregationEditorProps {
  node: Aggregation;
  onUpdate: (node: ASTNode) => void;
}

const AggregationEditor: FC<AggregationEditorProps> = ({ node, onUpdate }) => {
  const id = useMemo<number>(getUniqueID, []);

  const changeOp = (newOp: aggregationType) => {
    let param: ASTNode | null = null;
    // Keeping the param argument only makes sense when switching between bottomk/topk.
    if (['topk', 'bottomk'].includes(node.op) && ['topk', 'bottomk'].includes(newOp)) {
      param = node.param;
    }
    if (!aggregatorsWithParam.includes(node.op) && aggregatorsWithParam.includes(newOp)) {
      param = { type: nodeType.placeholder, children: [] };
    }
    onUpdate({ ...node, op: newOp, param });
  };

  return (
    <>
      <Form.Group>
        <Form.Label>Aggregation type:</Form.Label>
        <Form.Control
          size="sm"
          as="select"
          id={`select-aggregation-${id}`}
          value={node.op}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeOp(e.currentTarget.value as aggregationType)}
        >
          {Object.values(aggregationType).map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Preserve:</Form.Label>
        <Help text="Select whether to preserve a list of specified label dimensions in the aggregation, or whether to keep all label dimensions except for the ones that are specified below." />
        <Form.Check
          custom
          type="radio"
          name="radio-grouping"
          id={`radio-grouping-by-${id}`}
          label={
            <>
              Specified labels (<span className="promql-code promql-keyword">by</span>)
            </>
          }
          checked={!node.without}
          onChange={() => onUpdate({ ...node, without: false })}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-grouping"
          id={`radio-grouping-without-${id}`}
          label={
            <>
              All labels except specified (<span className="promql-code promql-keyword">without</span>)
            </>
          }
          checked={node.without}
          onChange={() => onUpdate({ ...node, without: true })}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Grouping labels:</Form.Label>
        <LabelListEditor labels={node.grouping} onUpdate={(labels: string[]) => onUpdate({ ...node, grouping: labels })} />
      </Form.Group>
    </>
  );
};

export default AggregationEditor;

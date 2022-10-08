import React, { FC } from 'react';
import ASTNode, { MatrixSelector, Subquery, VectorSelector } from '../../../../promql/ast';
import DurationEditor from './DurationEditor';
import { Form } from 'react-bootstrap';
import { Help } from './Help';
import AtAndOffsetEditor from './AtAndOffsetEditor';

interface SubqueryEditorProps {
  node: Subquery;
  onUpdate: (node: ASTNode) => void;
}

const SubqueryEditor: FC<SubqueryEditorProps> = ({ node, onUpdate }) => {
  return (
    <>
      <Form.Group>
        <Form.Label>Range:</Form.Label>
        <Help text="The time range for which to run the subquery (going from the past to the current timestamp). E.g. '5m' or '1h'." />
        <DurationEditor duration={node.range} onUpdate={(d: number) => onUpdate({ ...node, range: d })} />
      </Form.Group>

      <AtAndOffsetEditor node={node} onUpdate={(node: MatrixSelector | VectorSelector | Subquery) => onUpdate(node)} />

      <Form.Group>
        <Form.Label>Resolution step:</Form.Label>
        <Help text="The resolution between successive evaluation timestamps within the subquery. If this is set to 0s, the global rule evaluation interval will be used as a default." />
        <DurationEditor duration={node.step} onUpdate={(d: number) => onUpdate({ ...node, step: d })} />
      </Form.Group>
    </>
  );
};

export default SubqueryEditor;

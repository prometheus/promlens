import React, { FC, useMemo } from 'react';
import ASTNode, { UnaryExpr, unaryOperatorType } from '../../../../promql/ast';
import { Form } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';

interface UnaryExprEditorProps {
  node: UnaryExpr;
  onUpdate: (node: ASTNode) => void;
}

const UnaryExprEditor: FC<UnaryExprEditorProps> = ({ node, onUpdate }) => {
  const id = useMemo<number>(getUniqueID, []);

  return (
    <Form.Group>
      <Form.Label>Unary operator type:</Form.Label>
      <Form.Control
        size="sm"
        as="select"
        id={`select-operator-${id}`}
        value={node.op}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onUpdate({ ...node, op: e.currentTarget.value as unaryOperatorType })
        }
      >
        {Object.values(unaryOperatorType).map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </Form.Control>
    </Form.Group>
  );
};

export default UnaryExprEditor;

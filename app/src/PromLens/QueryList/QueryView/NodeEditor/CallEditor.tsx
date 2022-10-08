import React, { FC, useMemo } from 'react';
import ASTNode, { Call, Func, nodeType } from '../../../../promql/ast';
import { functionSignatures } from '../../../../promql/functionSignatures';
import { nodeValueType } from '../../../../promql/utils';
import { NodeConstraints } from '../types';
import { Form } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';
import { functionDescriptions } from '../../../../promql/functionMeta';

interface CallEditorProps {
  node: Call;
  onUpdate: (node: ASTNode) => void;
  constraints: NodeConstraints;
}

export const reassignFuncChildren = (fn: Func, children: ASTNode[]): ASTNode[] =>
  fn.argTypes.map((valueType, idx): ASTNode => {
    if (children.length - 1 < idx || nodeValueType(children[idx]) !== valueType) {
      return { type: nodeType.placeholder, children: [] };
    }
    return children[idx];
  });

const CallEditor: FC<CallEditorProps> = ({ node, onUpdate, constraints }) => {
  const id = useMemo<number>(getUniqueID, []);

  const changeFunction = (name: string) => {
    const fn = functionSignatures[name];
    onUpdate({ ...node, args: reassignFuncChildren(fn, node.args), func: fn });
  };

  return (
    <Form.Group>
      <Form.Label>Function:</Form.Label>
      <Form.Control
        size="sm"
        as="select"
        id={`select-function-${id}`}
        value={node.func.name}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeFunction(e.currentTarget.value)}
      >
        {Object.keys(functionSignatures)
          .sort()
          .map((name) => {
            const disabled = !constraints.allowedValueTypes.includes(functionSignatures[name].returnType);
            return (
              <option key={name} value={name} disabled={disabled}>
                {name}(){disabled && ' (not applicable here)'} — {functionDescriptions[name]}
              </option>
            );
          })}
      </Form.Control>
    </Form.Group>
  );
};

export default CallEditor;

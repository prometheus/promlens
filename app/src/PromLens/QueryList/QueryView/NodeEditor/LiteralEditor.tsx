import React, { FC, useMemo, useState, useEffect } from 'react';
import ASTNode, { NumberLiteral, StringLiteral, nodeType, valueType } from '../../../../promql/ast';
import { NodeConstraints } from '../types';
import { Form } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';

interface LiteralEditorProps {
  node: NumberLiteral | StringLiteral;
  onUpdate: (node: ASTNode) => void;
  constraints: NodeConstraints;
}

const LiteralEditor: FC<LiteralEditorProps> = ({ node, onUpdate, constraints }) => {
  const id = useMemo<number>(getUniqueID, []);

  const [inputValue, setInputValue] = useState<string>(node.val);
  const [floatParsingFailed, setFloatParsingFailed] = useState<boolean>(false);

  useEffect(() => {
    setInputValue(node.val);
    setFloatParsingFailed(false);
  }, [node.val]);

  const changeInputValue = () => {
    if (
      node.type === nodeType.numberLiteral &&
      !['inf', '+inf', '-inf', 'nan'].includes(inputValue.toLowerCase()) &&
      // TODO: JavaScript also parses "1foo" correctly :(
      isNaN(parseFloat(inputValue))
    ) {
      setFloatParsingFailed(true);
    } else {
      setFloatParsingFailed(false);
      onUpdate({ ...node, val: inputValue });
    }
  };

  return (
    <>
      <Form.Group>
        <Form.Label>Value type:</Form.Label>
        <Form.Control
          size="sm"
          as="select"
          id={`select-value-type-${id}`}
          value={node.type}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const isNumber = e.currentTarget.value === nodeType.numberLiteral;
            onUpdate({
              ...node,
              val: isNumber ? '0' : '',
              type: isNumber ? nodeType.numberLiteral : nodeType.stringLiteral,
            });
          }}
        >
          {[nodeType.numberLiteral, nodeType.stringLiteral].map((valType) => {
            const disabled = !constraints.allowedValueTypes.includes(
              valType === nodeType.numberLiteral ? valueType.scalar : valueType.string
            );
            return (
              <option key={valType} value={valType} disabled={disabled}>
                {valType === nodeType.numberLiteral ? 'number (scalar)' : 'string'}
                {disabled && ' (not applicable here)'}
              </option>
            );
          })}
        </Form.Control>
      </Form.Group>

      <Form.Group>
        <Form.Label>{node.type === nodeType.numberLiteral ? 'Numeric' : 'String'} value:</Form.Label>
        <Form.Control
          size="sm"
          type="text"
          isInvalid={floatParsingFailed}
          id={`literal-value-${id}`}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.currentTarget.value)}
          onBlur={changeInputValue}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && changeInputValue()}
        />
        <Form.Control.Feedback type="invalid">Invalid number format.</Form.Control.Feedback>
      </Form.Group>
    </>
  );
};

export default LiteralEditor;

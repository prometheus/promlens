import { FC, useState, useEffect, useMemo } from 'react';
import React from 'react';
import { getUniqueID } from '../../../../utils/utils';
import { MatrixSelector, Subquery, VectorSelector } from '../../../../promql/ast';
import { Form } from 'react-bootstrap';
import { Help } from './Help';
import DurationEditor from './DurationEditor';

interface AtAndOffsetEditorProps {
  node: MatrixSelector | VectorSelector | Subquery;
  onUpdate: (node: MatrixSelector | VectorSelector | Subquery) => void;
}

// TODO: Create general helper for validated inputs?
const AtAndOffsetEditor: FC<AtAndOffsetEditorProps> = ({ node, onUpdate }) => {
  const id = useMemo<number>(getUniqueID, []);

  const [atTimestampInputValue, setAtTimestampInputValue] = useState<string>(
    node.timestamp === null ? '' : (node.timestamp / 1000).toFixed(3)
  );
  const [atTimestampParsingFailed, setAtTimestampParsingFailed] = useState<boolean>(false);

  const changeAtTimestampValue = () => {
    if (
      // TODO: JavaScript also parses "1foo" correctly :(
      isNaN(parseFloat(atTimestampInputValue))
    ) {
      setAtTimestampParsingFailed(true);
    } else {
      setAtTimestampParsingFailed(false);
      onUpdate({ ...node, timestamp: parseFloat(atTimestampInputValue) * 1000 });
    }
  };

  useEffect(() => {
    setAtTimestampInputValue(node.timestamp === null ? '' : (node.timestamp / 1000).toFixed(3));
    setAtTimestampParsingFailed(false);
  }, [node.timestamp]);

  return (
    <>
      <Form.Group>
        <Form.Label>Offset:</Form.Label>
        <Help text="Duration by which the expression is time-shifted. E.g. '5m' or '1h'." />
        <DurationEditor
          duration={Math.abs(node.offset)}
          onUpdate={(d: number) => onUpdate({ ...node, offset: node.offset >= 0 ? d : -d })}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Offset direction:</Form.Label>
        <Help text="Whether to offset the expression into the past or the future." />
        <Form.Check
          custom
          type="radio"
          name="radio-offset-direction"
          id={`radio-positive-offset-${id}`}
          label="Shift past data into the present (positive offset)."
          checked={node.offset >= 0}
          onChange={() => onUpdate({ ...node, offset: -node.offset })}
          disabled={node.offset === 0}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-offset-direction"
          id={`radio-negative-offset-${id}`}
          label="Shift future data into the present (negative offset)."
          checked={node.offset < 0}
          onChange={() => onUpdate({ ...node, offset: -node.offset })}
          disabled={node.offset === 0}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Evaluation timestamp:</Form.Label>
        <Help text="Whether to evaluate the expression relative to the overall query resolution step, or an absolute timestamp." />

        <Form.Check
          custom
          type="radio"
          name="radio-at-modifier"
          id={`radio-at-modifier-none-${id}`}
          label="Relative to the current query resolution step."
          checked={node.timestamp === null && node.startOrEnd === null}
          onChange={() => onUpdate({ ...node, timestamp: null, startOrEnd: null })}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-at-modifier"
          id={`radio-at-modifier-start-${id}`}
          label="Relative to the start of the query range."
          checked={node.startOrEnd === 'start'}
          onChange={() => onUpdate({ ...node, timestamp: null, startOrEnd: 'start' })}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-at-modifier"
          id={`radio-at-modifier-end-${id}`}
          label="Relative to the end of the query range."
          checked={node.startOrEnd === 'end'}
          onChange={() => onUpdate({ ...node, timestamp: null, startOrEnd: 'end' })}
        />
        <Form.Check
          custom
          type="radio"
          name="radio-at-modifier"
          id={`radio-at-modifier-absolute-${id}`}
          label="Relative to an absolute timestamp."
          checked={node.timestamp !== null}
          onChange={() => onUpdate({ ...node, timestamp: new Date().getTime(), startOrEnd: null })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Absolute timestamp:</Form.Label>
        <Form.Control
          size="sm"
          type="text"
          isInvalid={atTimestampParsingFailed}
          id={`absolute-at-timestamp-${id}`}
          value={atTimestampInputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAtTimestampInputValue(e.currentTarget.value)}
          onBlur={changeAtTimestampValue}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && changeAtTimestampValue()}
          disabled={node.timestamp === null}
        />
        <Form.Control.Feedback type="invalid">Invalid number format.</Form.Control.Feedback>
      </Form.Group>
    </>
  );
};

export default AtAndOffsetEditor;

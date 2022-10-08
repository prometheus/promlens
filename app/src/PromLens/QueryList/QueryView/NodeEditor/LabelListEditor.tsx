import { FC, useState } from 'react';
import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { Form, InputGroup, Button } from 'react-bootstrap';

interface LabelListEditorProps {
  labels: string[];
  onUpdate: (labels: string[]) => void;
}

const LabelListEditor: FC<LabelListEditorProps> = ({ labels, onUpdate }) => {
  const [newLabelName, setNewLabelName] = useState<string>('');

  const removeLabel = (idx: number) => {
    const newLabels = [...labels];
    newLabels.splice(idx, 1);
    onUpdate(newLabels);
  };

  const addLabel = () => {
    // TODO: Do proper regex match here.
    if (newLabelName.trim() === '' || labels.includes(newLabelName)) {
      return;
    }
    onUpdate([...labels, newLabelName]);
    setNewLabelName('');
  };

  const changeLabel = (idx: number, value: string) => {
    const newLabels = [...labels];
    newLabels[idx] = value;
    onUpdate(newLabels);
  };

  return (
    <>
      <Form.Group>
        {labels.map((l, idx) => (
          // TODO: For key (and in general), handle duplicate label names.
          <InputGroup key={idx} className="mb-1">
            <Form.Control
              size="sm"
              type="text"
              placeholder="label name"
              value={l}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeLabel(idx, e.currentTarget.value)}
            />
            <InputGroup.Append>
              <Button variant="outline-secondary" size="sm" onClick={() => removeLabel(idx)}>
                <FaTimes />
              </Button>
            </InputGroup.Append>
          </InputGroup>
        ))}
        <InputGroup>
          <Form.Control
            size="sm"
            className="pending-input-item"
            type="text"
            placeholder="add label name"
            value={newLabelName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLabelName(e.currentTarget.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              e.key === 'Enter' && addLabel();
            }}
          />
          <InputGroup.Append>
            <Button variant="outline-secondary" size="sm" onClick={() => addLabel()}>
              <FaPlus />
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </>
  );
};

export default LabelListEditor;

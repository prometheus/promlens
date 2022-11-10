import { FC, useState, useEffect, useMemo } from 'react';
import React from 'react';
import { formatDuration, parseDuration, getUniqueID } from '../../../../utils/utils';
import { Form } from 'react-bootstrap';

interface DurationEditorProps {
  duration: number;
  onUpdate: (duration: number) => void;
}

// TODO: Create general helper for validated inputs?
const DurationEditor: FC<DurationEditorProps> = ({ duration: initialDuration, onUpdate }) => {
  const id = useMemo<number>(getUniqueID, []);

  const [duration, setDuration] = useState<string>(formatDuration(initialDuration));
  const [durationError, setDurationError] = useState<string>('');

  useEffect(() => {
    setDuration(formatDuration(initialDuration));
  }, [initialDuration]);

  const changeDuration = () => {
    try {
      onUpdate(parseDuration(duration));
      setDurationError('');
    } catch (error) {
      setDurationError((error as Error).message);
    }
  };

  return (
    <>
      <Form.Control
        size="sm"
        type="text"
        id={`range-${id}`}
        value={duration}
        isInvalid={durationError !== ''}
        title={durationError !== '' ? durationError : ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.currentTarget.value)}
        onBlur={changeDuration}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && changeDuration()}
      />
      <Form.Control.Feedback type="invalid">Unable to parse duration string: {durationError}</Form.Control.Feedback>
    </>
  );
};

export default DurationEditor;

import { FC, useState } from 'react';
import React from 'react';
import Autosuggest, { ChangeEvent, RenderInputComponentProps } from 'react-autosuggest';
import { Form } from 'react-bootstrap';
import InputGroup from 'react-bootstrap/InputGroup';

interface AutosuggestInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  items: string[];
  inputClass?: string;
  prepend?: boolean;
  append?: boolean;
  autoFocus?: boolean;
}

const AutosuggestInput: FC<AutosuggestInputProps> = ({
  placeholder,
  value,
  onChange,
  onEnter,
  items,
  inputClass,
  prepend,
  append,
  autoFocus,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [enterShouldCallOnEnter, setEnterShouldCallOnEnter] = useState<boolean>(true);

  const getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? items : items.filter((name) => name.toLowerCase().slice(0, inputLength) === inputValue);
  };
  return (
    <>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value))}
        onSuggestionsClearRequested={() => setSuggestions([])}
        getSuggestionValue={(s) => s}
        renderSuggestion={(s) => <div>{s}</div>}
        highlightFirstSuggestion
        // Only call the onEnter callback when it's a real Enter, not one we're using to do a selection.
        onSuggestionHighlighted={({ suggestion }) => setEnterShouldCallOnEnter(suggestion === null)}
        shouldRenderSuggestions={(value, reason) => true}
        inputProps={{
          className: `${inputClass !== undefined ? ` ${inputClass}` : ''}`,
          type: 'text',
          placeholder: placeholder,
          value: value,
          autoFocus,
          onChange: (e: React.FormEvent<HTMLElement>, params: ChangeEvent) => onChange(params.newValue),
          onSubmit: () => onEnter !== undefined && onEnter(),
          onKeyDown: (e) => {
            e.key === 'Enter' && onEnter !== undefined && enterShouldCallOnEnter && onEnter();
          },
        }}
        renderInputComponent={(inputProps: RenderInputComponentProps) => {
          const input = <Form.Control size="sm" {...(inputProps as any)} />;
          if (append) {
            return <InputGroup.Append>{input}</InputGroup.Append>;
          }
          if (prepend) {
            return <InputGroup.Prepend>{input}</InputGroup.Prepend>;
          }
          return input;
        }}
      />
    </>
  );
};

export default AutosuggestInput;

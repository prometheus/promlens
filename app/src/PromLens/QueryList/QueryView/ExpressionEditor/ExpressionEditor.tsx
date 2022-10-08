import React, { FC, useRef, useState, useEffect, useContext } from 'react';

import { EditorView } from '@codemirror/view';
import { EditorState, StateEffect } from '@codemirror/state';

import ASTNode, { valueType } from '../../../../promql/ast';
import { NodeConstraints } from '../types';
import { PathPrefixProps } from '../../../../types/types';
import { nodeValueType, humanizedValueType } from '../../../../promql/utils';
import { Alert, Button } from 'react-bootstrap';
import { PromAPI } from '../../../../promAPI/promAPI';
import { Settings, SettingsContext } from '../../../SettingsEditor';
import { getExtensions } from './Extensions';
import { MdKeyboardReturn } from 'react-icons/md';
import { FaSync } from 'react-icons/fa';

interface ExpressionEditorProps {
  initialExpr: string;
  initialTrigger: boolean;
  exprStale?: boolean;
  placeholder?: string;
  initialFocus: boolean;
  promAPI: PromAPI;
  insertTextRef: React.MutableRefObject<(text: string) => void> | null;
  onChange: (expr: string, ast: ASTNode | null) => void;
  onEscape?: () => void;
  onSyncExpr?: () => void;
  constraints: NodeConstraints;
}

// TODO: This global state is ugly. But currently needed to not close over the first render's
// retriggerCounter in the non-React event handler. Can we find a better way though?
export let retriggerIdx = 0;

const ExpressionEditor: FC<ExpressionEditorProps & PathPrefixProps> = ({
  pathPrefix,
  initialExpr,
  initialTrigger,
  exprStale,
  placeholder,
  initialFocus,
  promAPI,
  insertTextRef,
  onChange,
  onEscape,
  onSyncExpr,
  constraints,
}) => {
  const settings = useContext<Settings>(SettingsContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // This is set when pressing "Enter".
  const [expr, setExpr] = useState(initialTrigger ? initialExpr : '');

  // When exprStale = true, we want to retrigger evaluation when return is pressed even
  // if the expr hasn't changed at all. TODO: Can this be improved?
  const [retriggerCounter, setRetriggerCounter] = useState<number>(retriggerIdx);
  const [parseError, setParseError] = useState<string | null>(null);

  // Show initial expression.
  useEffect(() => {
    const view = viewRef.current;
    // Prevent the cursor position from being re-set when we just submit an expression (which then gets looped back to here).
    if (view && view.state.doc.toString() !== initialExpr) {
      view.dispatch(view.state.update({ changes: { from: 0, to: view.state.doc.length, insert: initialExpr } }));
    }
  }, [initialExpr]);

  // Execute expression and submit it when it's valid.
  useEffect(() => {
    setParseError(null);
    if (expr === '') {
      return;
    }

    fetch(`${pathPrefix}/api/parse?expr=${encodeURIComponent(expr)}`)
      .then((res) => res.json())
      .then((res: ASTNode | { type: 'error'; message: string }) => {
        // TODO: Catch HTTP errors here, such as PaymentRequired.
        if (res.type === 'error') {
          setParseError(res.message);
        } else if (!constraints.allowedValueTypes.includes(nodeValueType(res) as valueType)) {
          // "as" cast ok here because parsed expressions cannot be of null / placeholder type.
          setParseError(
            `Expression of type ${humanizedValueType[nodeValueType(res) as valueType]} not allowed here. Expected ${
              constraints.allowedValueTypes.length === 1
                ? `${humanizedValueType[constraints.allowedValueTypes[0]]}`
                : `one of ${constraints.allowedValueTypes.map((vt) => humanizedValueType[vt]).join(', ')}`
            }.`
          );
        } else {
          onChange(expr, res);
        }
      })
      .catch((err) => setParseError(err.message));
    // TODO: Adding onChange() below causes endless loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retriggerCounter, expr]);

  // (Re)initialize autocompleter based on the selected Prometheus server.
  useEffect(() => {
    const extensions = getExtensions(
      placeholder,
      settings.enableHighlighting,
      settings.enableAutocomplete,
      settings.enableLinter,
      promAPI,
      onEscape,
      (newExpr: string) => {
        if (newExpr === expr) {
          retriggerIdx++;
          setRetriggerCounter(retriggerIdx);
        } else {
          setExpr(newExpr);
        }
      }
    );

    const view = viewRef.current;
    if (view === null) {
      // If the editor does not exist yet, create it.
      if (!containerRef.current) {
        throw new Error('expected CodeMirror container element to exist');
      }

      const startState = EditorState.create({
        doc: initialExpr,
        extensions: extensions,
      });

      const view = new EditorView({
        state: startState,
        parent: containerRef.current,
      });

      if (initialFocus) {
        view.focus();
      }

      viewRef.current = view;
      if (insertTextRef !== null) {
        insertTextRef.current = (text: string) => {
          view.dispatch(
            view.state.update({
              changes: { from: view.state.selection.ranges[0].from, to: view.state.selection.ranges[0].to, insert: text },
            })
          );
        };
      }
    } else {
      // The editor already exists, just reconfigure it.
      view.dispatch(
        view.state.update({
          effects: [StateEffect.reconfigure.of(extensions)],
        })
      );
    }
  }, [
    onEscape,
    promAPI,
    settings,
    settings.enableHighlighting,
    settings.enableAutocomplete,
    settings.enableLinter,
    initialExpr,
    initialFocus,
    insertTextRef,
  ]);

  useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, []);

  return (
    // TODO: The e.stopPropagation() below is needed so that node selection doesn't get toggled when
    // editing a node in text mode. Is there a better way?
    <div className="expression-input-wrapper">
      <div onClick={(e) => e.stopPropagation()} className={`expression-input${exprStale ? ' expression-input-stale' : ''}`}>
        {exprStale && (
          <Button
            size="sm"
            variant="light"
            title="Update input from tree"
            onClick={onSyncExpr}
            className="expression-input-sync-btn"
            // style={{ position: 'absolute', top: 3, left: 3, bottom: 3, zIndex: 1 }}
          >
            <FaSync />
          </Button>
        )}
        <div ref={containerRef} className="cm-expression-input"></div>
        <div className="expression-input-enter" title="Hit <Enter> to execute query, <Shift>+<Enter> to insert newline">
          <MdKeyboardReturn style={{ color: '#bbb' }} />
        </div>
      </div>
      {parseError && (
        <Alert variant="danger" className="parse-error">
          <strong>Error:</strong> {parseError}
        </Alert>
      )}
    </div>
  );
};

export default ExpressionEditor;

import { EditorView, highlightSpecialChars, keymap, placeholder } from '@codemirror/view';
import { indentOnInput } from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/history';
import { defaultKeymap, insertNewlineAndIndent } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { searchKeymap } from '@codemirror/search';
import { commentKeymap } from '@codemirror/comment';
import { rectangularSelection } from '@codemirror/rectangular-selection';
import { highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { EditorState, Prec, Extension } from '@codemirror/state';
import { PromQLExtension } from 'codemirror-promql';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { theme, promqlHighlighter } from './Theme';
import { HTTPPrometheusClient } from 'codemirror-promql/dist/esm/client/prometheus';
import { PromAPI } from '../../../../promAPI/promAPI';

const promqlExtension = new PromQLExtension();

export const getExtensions = (
  placeholderStr: string | undefined,
  enableHighlighting: boolean,
  enableAutocomplete: boolean,
  enableLinter: boolean,
  promAPI: PromAPI,
  onEscape: undefined | (() => void),
  submit: (expr: string) => void
): Extension => {
  promqlExtension.activateCompletion(enableAutocomplete);
  promqlExtension.activateLinter(enableLinter);
  promqlExtension.setComplete({
    remote: new HTTPPrometheusClient({
      url: '',
      httpErrorHandler: (error: Error) => {
        console.log('Error while autocompleting:', error);
      },
      lookbackInterval: 12 * 60 * 60 * 1000,
      fetchFn: (input: RequestInfo, init?: RequestInit): Promise<Response> => {
        if (init?.method === 'post') {
          input = `${input}?${init.body}`;
          init.method = 'get';
          init.body = undefined;
        }
        return promAPI.fetch(input, init);
      },
    }),
  });

  return [
    theme,
    highlightSpecialChars(),
    history(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    enableHighlighting ? promqlHighlighter : [],
    placeholderStr ? placeholder(placeholderStr) : [],
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...commentKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    promqlExtension.asExtension(),
    // This keymap is added without precedence so that closing the autocomplete dropdown
    // via Escape works without blurring the editor.
    keymap.of([
      {
        key: 'Escape',
        run: (v: EditorView): boolean => {
          if (onEscape !== undefined) {
            onEscape();
          } else {
            v.contentDOM.blur();
          }
          return false;
        },
      },
    ]),
    Prec.override(
      keymap.of([
        {
          key: 'Enter',
          run: (v: EditorView): boolean => {
            submit(v.state.doc.toString());
            return true;
          },
        },
        {
          key: 'Shift-Enter',
          run: insertNewlineAndIndent,
        },
      ])
    ),
  ];
};

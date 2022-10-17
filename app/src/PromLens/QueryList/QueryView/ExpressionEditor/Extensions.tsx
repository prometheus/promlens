import { EditorView, highlightSpecialChars, keymap, placeholder, rectangularSelection } from '@codemirror/view';
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { defaultKeymap, historyKeymap, history, insertNewlineAndIndent } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { EditorState, Prec, Extension } from '@codemirror/state';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { theme, promqlHighlighter } from './Theme';
import { PromAPI } from '../../../../promAPI/promAPI';
import { PromQLExtension } from '@prometheus-io/codemirror-promql';
import { HTTPPrometheusClient } from '@prometheus-io/codemirror-promql/dist/esm/client/prometheus';

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
    enableHighlighting ? syntaxHighlighting(promqlHighlighter) : [],
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
    Prec.highest(
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

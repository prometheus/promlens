import React, { FC, useState, useEffect } from 'react';
import ASTNode, {
  binaryOperatorType,
  aggregationType,
  valueType,
  unaryOperatorType,
  nodeType,
} from '../../../../promql/ast';
import SelectionEditor from './SelectionEditor';
import BinaryExprEditor from './BinaryExprEditor';
import AggregationEditor from './AggregationEditor';
import CallEditor, { reassignFuncChildren } from './CallEditor';
import LiteralEditor from './LiteralEditor';
import SubqueryEditor from './SubqueryEditor';
import UnaryExprEditor from './UnaryExprEditor';
import { formatNode } from '../../../../promql/format';
import { QueryID, NodeID, AppState, NodeEditMode } from '../../../../state/state';
import { connect } from 'react-redux';
import * as actions from '../../../../state/actions';
import { denormalizeAST } from '../../../../state/normalizeAST';
import { FaCheck } from 'react-icons/fa';
import { allowedChildValueTypes, getNodeChildren, nodeValueType, anyValueType } from '../../../../promql/utils';
import { NodeConstraints } from '../types';
import { functionSignatures } from '../../../../promql/functionSignatures';
import { Form, Button, Tabs, Tab } from 'react-bootstrap';
import { PromAPI } from '../../../../promAPI/promAPI';

export interface NodeEditorOwnProps {
  queryID: QueryID;
  nodeID: NodeID;
  metricNames: string[];
  promAPI: PromAPI;
}

export interface NodeEditorStateProps {
  node: ASTNode;
  constraints: NodeConstraints;
}

export interface NodeEditorDispatchProps {
  updateNode: (queryID: QueryID, nodeID: NodeID, node: ASTNode) => void;
  deleteNode: (queryID: QueryID, nodeID: NodeID) => void;
  copyNode: (queryID: QueryID, nodeID: NodeID) => void;
  cutNode: (queryID: QueryID, nodeID: NodeID) => void;
  pasteNode: (queryID: QueryID, nodeID: NodeID) => void;
  setEditMode: (queryID: QueryID, nodeID: NodeID, mode: NodeEditMode) => void;
}

enum QueryType {
  Placeholder = 'placeholder',
  Selection = 'selection',
  Aggregation = 'aggregation',
  BinaryExpr = 'binary-expr',
  Call = 'call',
  Literal = 'literal',
  Subquery = 'subquery',
  ParenExpr = 'paren-expr',
  UnaryExpr = 'unary-expr',
}

const queryTypeToName: Record<QueryType, string> = {
  [QueryType.Placeholder]: '-- chose query type --',
  [QueryType.Selection]: 'Select data',
  [QueryType.Aggregation]: 'Aggregate over labels',
  [QueryType.BinaryExpr]: 'Binary operation',
  [QueryType.Call]: 'Call function',
  [QueryType.Literal]: 'Literal value',
  [QueryType.Subquery]: 'Subquery',
  [QueryType.ParenExpr]: 'Parentheses',
  [QueryType.UnaryExpr]: 'Unary expression',
};

const queryTypeToPossibleReturnTypes: Record<QueryType, valueType[]> = {
  [QueryType.Placeholder]: [],
  [QueryType.Selection]: [valueType.vector, valueType.matrix],
  [QueryType.Aggregation]: [valueType.vector],
  [QueryType.BinaryExpr]: [valueType.scalar, valueType.vector],
  // TODO: This is only true at the moment. Revise when any function with
  // string/matrix return value gets added to PromQL.
  [QueryType.Call]: [valueType.scalar, valueType.vector],
  [QueryType.Literal]: [valueType.scalar, valueType.string],
  [QueryType.Subquery]: [valueType.matrix],
  [QueryType.ParenExpr]: [],
  [QueryType.UnaryExpr]: [valueType.scalar, valueType.vector],
};

const nodeTypeToQueryType: { [qt: string]: QueryType } = {
  aggregation: QueryType.Aggregation,
  binaryExpr: QueryType.BinaryExpr,
  call: QueryType.Call,
  matrixSelector: QueryType.Selection,
  subquery: QueryType.Subquery,
  numberLiteral: QueryType.Literal,
  stringLiteral: QueryType.Literal,
  parenExpr: QueryType.ParenExpr,
  unaryExpr: QueryType.UnaryExpr,
  vectorSelector: QueryType.Selection,
  placeholder: QueryType.Placeholder,
};

// TODO: Can we do better than "any" here?
const queryTypeToComponent: Record<QueryType, any> = {
  [QueryType.Selection]: SelectionEditor,
  [QueryType.Aggregation]: AggregationEditor,
  [QueryType.BinaryExpr]: BinaryExprEditor,
  [QueryType.Call]: CallEditor,
  [QueryType.Literal]: LiteralEditor,
  [QueryType.Subquery]: SubqueryEditor,
  [QueryType.ParenExpr]: () => null,
  [QueryType.UnaryExpr]: UnaryExprEditor,
  [QueryType.Placeholder]: () => null,
};

const snippets: Record<string, ASTNode> = {
  'calculate rate of increase over counter': {
    type: nodeType.call,
    func: {
      name: 'rate',
      argTypes: [valueType.matrix],
      variadic: 0,
      returnType: valueType.vector,
    },
    args: [{ type: nodeType.placeholder, children: [] }],
  },
  'calculate the ratio of two summed rates': {
    type: nodeType.binaryExpr,
    op: binaryOperatorType.div,
    lhs: {
      type: nodeType.aggregation,
      expr: {
        type: nodeType.call,
        func: {
          name: 'rate',
          argTypes: [valueType.matrix],
          variadic: 0,
          returnType: valueType.vector,
        },
        args: [{ type: nodeType.placeholder, children: [] }],
      },
      op: aggregationType.sum,
      param: null,
      grouping: ['job'],
      without: false,
    },
    rhs: {
      type: nodeType.aggregation,
      expr: {
        type: nodeType.call,
        func: {
          name: 'rate',
          argTypes: [valueType.matrix],
          variadic: 0,
          returnType: valueType.vector,
        },
        args: [{ type: nodeType.placeholder, children: [] }],
      },
      op: aggregationType.sum,
      param: null,
      grouping: ['job'],
      without: false,
    },
    matching: null,
    bool: false,
  },
  'calculate quantile from histogram': {
    type: nodeType.call,
    func: {
      name: 'histogram_quantile',
      argTypes: [valueType.scalar, valueType.vector],
      variadic: 0,
      returnType: valueType.vector,
    },
    args: [
      { type: nodeType.placeholder, children: [] },
      {
        type: nodeType.aggregation,
        op: aggregationType.sum,
        expr: { type: nodeType.placeholder, children: [] },
        without: false,
        param: null,
        grouping: ['le'],
      },
    ],
  },
};

const returnTypeAllowed = (returnTypes: valueType[], constraints: NodeConstraints): boolean => {
  if (returnTypes.length === 0) {
    return true;
  }

  const allowedTypes = new Set(constraints.allowedValueTypes);
  return returnTypes.filter((t) => allowedTypes.has(t)).length > 0;
};

const NodeEditor: FC<NodeEditorOwnProps & NodeEditorStateProps & NodeEditorDispatchProps> = ({
  queryID,
  nodeID,
  node: initialNode,
  promAPI,
  metricNames,
  updateNode,
  deleteNode,
  copyNode,
  pasteNode,
  cutNode,
  constraints,
}) => {
  // const queryType = nodeTypeToQueryType[node.type];
  const [node, setNode] = useState<ASTNode>(initialNode);

  useEffect(() => {
    setNode(initialNode);
  }, [initialNode]);

  const setQueryType = (qt: QueryType) => {
    if (nodeTypeToQueryType[initialNode.type] === qt) {
      setNode(initialNode);
      return;
    }

    const children = getNodeChildren(initialNode);
    const childTypes = children.map((c) => nodeValueType(c));
    switch (qt) {
      case QueryType.Selection:
        setNode({ type: nodeType.vectorSelector, name: '', matchers: [], offset: 0, timestamp: null, startOrEnd: null });
        break;
      case QueryType.Aggregation:
        let expr: ASTNode = { type: nodeType.placeholder, children: [] };
        let param: ASTNode | null = null;
        if (children.length === 1 && childTypes[0] === valueType.vector) {
          expr = children[0];
        }
        if (children.length === 2 && childTypes[0] === valueType.scalar && childTypes[1] === valueType.vector) {
          param = children[0];
          expr = children[1];
        }

        setNode({
          type: nodeType.aggregation,
          // TODO: Do "smart" (type- and number-based) child adoption here and for any of the other query types.
          expr,
          op: aggregationType.sum,
          param,
          grouping: [],
          without: false,
        });
        break;
      case QueryType.BinaryExpr:
        let lhs: ASTNode | null = { type: nodeType.placeholder, children: [] };
        const rhs: ASTNode | null = { type: nodeType.placeholder, children: [] };

        if (children.length > 0 && (childTypes[0] === valueType.scalar || childTypes[0] === valueType.vector)) {
          lhs = children[0];
        }
        if (children.length > 1 && (childTypes[1] === valueType.scalar || childTypes[1] === valueType.vector)) {
          lhs = children[1];
        }

        setNode({
          type: nodeType.binaryExpr,
          op: binaryOperatorType.div,
          lhs,
          rhs,
          matching: null,
          bool: false,
        });
        break;
      case QueryType.Call:
        setNode({
          type: nodeType.call,
          func: functionSignatures['rate'],
          args: reassignFuncChildren(functionSignatures['rate'], children),
        });
        break;
      case QueryType.Literal:
        setNode({ type: nodeType.numberLiteral, val: '0' });
        break;
      case QueryType.Subquery:
        setNode({
          type: nodeType.subquery,
          expr:
            children.length > 0 && childTypes[0] === valueType.vector
              ? children[0]
              : { type: nodeType.placeholder, children: [] },
          range: 3600000,
          offset: 0,
          step: 0,
          timestamp: null,
          startOrEnd: null,
        });
        break;
      case QueryType.ParenExpr:
        setNode({
          type: nodeType.parenExpr,
          expr: children.length > 0 ? children[0] : { type: nodeType.placeholder, children: getNodeChildren(initialNode) },
        });
        break;
      case QueryType.UnaryExpr:
        setNode({
          type: nodeType.unaryExpr,
          op: unaryOperatorType.minus,
          expr:
            children.length > 0 && (childTypes[0] === valueType.scalar || childTypes[0] === valueType.vector)
              ? children[0]
              : { type: nodeType.placeholder, children: [] },
        });
        break;
    }
    return null;
  };

  if (
    node.type === nodeType.placeholder &&
    constraints.allowedValueTypes.filter((vt) => [valueType.vector, valueType.matrix].includes(vt)).length > 0
  ) {
    setQueryType(QueryType.Selection);
  }

  const queryType = nodeTypeToQueryType[node.type];
  const QueryTypeEditorComponent = queryTypeToComponent[queryType];

  const [snippet, setSnippet] = useState<string>('');

  const tabs = [
    {
      name: 'edit',
      title: 'Edit',
      content: (
        <Form
          className="small"
          onSubmit={(e: React.FormEvent) => {
            // Without this, the page gets reloaded for forms that only have a single input field, see
            // https://stackoverflow.com/questions/1370021/why-does-forms-with-single-input-field-submit-upon-pressing-enter-key-in-input.
            e.preventDefault();
          }}
        >
          <div>
            <Form.Label>Preview:</Form.Label>
            <p>{formatNode(node, true, 3)}</p>
          </div>
          <Form.Group>
            <Form.Label>Query type:</Form.Label>
            <Form.Control
              size="sm"
              as="select"
              id={`select-operation-${nodeID}`}
              value={queryType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQueryType(e.currentTarget.value as QueryType)}
            >
              {Object.keys(queryTypeToName).map((qt) => {
                const disallowed = !returnTypeAllowed(queryTypeToPossibleReturnTypes[qt as QueryType], constraints);
                return (
                  <option
                    key={qt}
                    value={qt}
                    disabled={qt === QueryType.Placeholder || disallowed}
                    hidden={qt === QueryType.Placeholder}
                  >
                    {queryTypeToName[qt as QueryType]}
                    {disallowed && '  (not applicable here)'}
                  </option>
                );
              })}
            </Form.Control>
          </Form.Group>
          {/* TODO: We're just passing in props below into components that don't all define all of these props */}
          <QueryTypeEditorComponent
            node={node}
            onUpdate={setNode}
            metricNames={metricNames}
            constraints={constraints}
            promAPI={promAPI}
          />
          <Button variant="secondary" size="sm" onClick={() => updateNode(queryID, nodeID, node)} title="Apply changes">
            <FaCheck className="mr-1" /> Apply changes
          </Button>
        </Form>
      ),
    },
    {
      name: 'snippets',
      title: 'Snippets',
      content: (
        <Form className="small">
          <Form.Group>
            <Form.Label>Snippet:</Form.Label>
            <Form.Control
              size="sm"
              as="select"
              id={`select-snippet-${nodeID}`}
              value={snippet}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSnippet(e.currentTarget.value)}
            >
              <option value="" disabled hidden>
                -- choose snippet --
              </option>
              {Object.keys(snippets).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          {snippet !== '' && (
            <div>
              <Form.Label>Preview:</Form.Label>
              <p>{formatNode(snippets[snippet], true)}</p>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => updateNode(queryID, nodeID, snippets[snippet])}>
            Apply snippet
          </Button>
        </Form>
      ),
    },
    {
      name: 'actions',
      title: 'Actions',
      content: (
        <>
          <Button block variant="light" size="sm" onClick={() => copyNode(queryID, nodeID)}>
            Copy node (Ctrl-C)
          </Button>
          <Button block variant="light" size="sm" onClick={() => pasteNode(queryID, nodeID)}>
            Paste node (Ctrl-V)
          </Button>
          <Button block variant="light" size="sm" onClick={() => cutNode(queryID, nodeID)}>
            Cut node (Ctrl-X)
          </Button>
          <Button block variant="light" size="sm" onClick={() => deleteNode(queryID, nodeID)}>
            Delete node (Del)
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="node-editor">
      <Tabs defaultActiveKey="edit" id={`node-editor-tabs-edit"-${nodeID}`}>
        {tabs.map(({ name, title, content }) => (
          <Tab key={name} eventKey={name} title={title}>
            {content}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

const mapStateToProps = (state: AppState, ownProps: NodeEditorOwnProps): NodeEditorStateProps => {
  const { queryID, nodeID } = ownProps;
  const parentID = state.queries[queryID].tree.nodes[nodeID].parentID;
  const parent: ASTNode | null = parentID !== null ? denormalizeAST(state.queries[queryID].tree, parentID) : null;
  return {
    node: denormalizeAST(state.queries[queryID].tree, nodeID),
    constraints: {
      allowedValueTypes:
        parent === null
          ? anyValueType
          : // TODO: Super ugly, make better?
            allowedChildValueTypes(parent, state.queries[queryID].tree.nodes[parentID!].childIDs.indexOf(nodeID)),
    },
  };
};

const ConnectedNodeEditor = connect<NodeEditorStateProps, NodeEditorDispatchProps, NodeEditorOwnProps, AppState>(
  mapStateToProps,
  actions
)(NodeEditor);
export default ConnectedNodeEditor;

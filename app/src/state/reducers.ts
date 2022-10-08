import { AppState, Query, Tree, NodeID, Node, QueryID, GlobalNodeID, ServerSettings, NodeVisualizerState } from './state';
import { Action, actions, deleteNode, copyNode, updateNode, deleteQuery } from './actions';
import normalizeAST, { denormalizeAST } from './normalizeAST';
import ASTNode, { nodeType } from '../promql/ast';
import { getOrderedNodeIDs } from './utils';
import { getNodeChildren } from '../promql/utils';

const makeNewQuery = (): Query => {
  return {
    expr: '',
    exprStale: false,
    showMetricsExplorer: false,
    tree: normalizeAST({ type: nodeType.placeholder, children: [] }),
  };
};

export const getAllDescendantIDs = (tree: Tree, nodeID: NodeID): NodeID[] =>
  tree.nodes[nodeID].childIDs.reduce<NodeID[]>((acc, id) => [...acc, id, ...getAllDescendantIDs(tree, id)], []);

export const deleteNodes = (tree: Tree, nodeIDs: NodeID[]): Record<NodeID, Node> => {
  const nodes = { ...tree.nodes };
  nodeIDs.forEach((id) => delete nodes[id]);
  return nodes;
};

const replaceNode = (state: AppState, queryID: QueryID, nodeID: NodeID, newNode: ASTNode): AppState => {
  const query = state.queries[queryID];
  const tree = query.tree;
  const node = query.tree.nodes[nodeID];
  const { parentID, editMode } = node;

  let newTree = normalizeAST(newNode);
  // Without this, any automatic refresh when editing a node switches that node to tree view again.
  newTree.nodes[newTree.rootID].editMode = editMode;
  // TODO: This is to keep the node ID of where we insert. Make this nicer.
  newTree.nodes[newTree.rootID].id = nodeID;
  newTree.nodes[newTree.rootID].childIDs.forEach((id) => (newTree.nodes[id].parentID = nodeID));
  newTree.nodes[nodeID] = newTree.nodes[newTree.rootID];
  delete newTree.nodes[newTree.rootID];
  newTree.rootID = nodeID;

  // If we're not inserting at the root node, we need to rearrange children/parents.
  if (parentID !== null) {
    newTree.nodes[newTree.rootID].parentID = parentID;
    const parent = tree.nodes[parentID];

    newTree = {
      ...tree,
      nodes: {
        ...deleteNodes(tree, [nodeID, ...getAllDescendantIDs(tree, nodeID)]),
        ...newTree.nodes,
        [parentID]: {
          ...parent,
          childIDs: parent.childIDs.map((id) => (id === nodeID ? newTree.rootID : id)),
        },
      },
    };
  }

  return {
    ...state,
    queries: state.queries.map((query, idx) => (idx === queryID ? { ...query, tree: newTree } : query)),
    selectedNodeID:
      state.selectedNodeID === null
        ? null
        : queryID === state.selectedNodeID.queryID && !newTree.nodes.hasOwnProperty(state.selectedNodeID.nodeID)
        ? null
        : state.selectedNodeID,
  };
};

const initialNode = makeNewQuery();

const initialState: AppState = {
  serverSettings: {
    url: 'https://demo.promlabs.com',
    access: 'direct',
    datasourceID: null,
    withCredentials: false,
  },
  queries: [initialNode],
  queryHistory: {
    past: [],
    future: [],
  },
  selectedNodeID: { queryID: 0, nodeID: initialNode.tree.rootID },
  copiedNode: null,
  nodeVisualizer: {
    activeTab: 'table',
    endTime: null,
    range: 3600 * 1000,
    resolution: null,
    stacked: false,
  },
};

const appReducer = (state = initialState, action: Action): AppState => {
  switch (action.type) {
    case actions.IMPORT_STATE:
      return importState(action.state);

    case actions.SET_SERVER_SETTINGS:
      return {
        ...state,
        serverSettings: action.settings,
      };

    case actions.SET_EXPR:
      return {
        ...state,
        queries: state.queries.map((query, idx) =>
          idx === action.id ? { ...query, exprStale: false, expr: action.expr } : query
        ),
      };

    case actions.SET_SHOW_METRICS_EXPLORER:
      return {
        ...state,
        queries: state.queries.map((query, idx) =>
          idx === action.id ? { ...query, showMetricsExplorer: action.show } : query
        ),
      };

    // TODO: SET_TREE has overlap in usage and effects with SET_EXPR, consolidate.
    case actions.SET_TREE:
      return {
        ...state,
        selectedNodeID: { queryID: action.id, nodeID: action.tree.rootID },
        queries: state.queries.map((query, idx) =>
          idx === action.id ? { ...query, exprStale: false, tree: action.tree } : query
        ),
      };

    case actions.SET_NODE_QUERY_STATE: {
      const tree = state.queries[action.id.queryID].tree;

      return {
        ...state,
        queries: state.queries.map((query, idx) =>
          idx === action.id.queryID
            ? {
                ...query,
                tree: {
                  ...tree,
                  nodes: {
                    ...tree.nodes,
                    [action.id.nodeID]: {
                      ...tree.nodes[action.id.nodeID],
                      queryState: action.state,
                    },
                  },
                },
              }
            : query
        ),
      };
    }

    case actions.SET_EDIT_MODE: {
      const tree = state.queries[action.id.queryID].tree;

      return {
        ...state,
        queries: state.queries.map((query, idx) =>
          idx === action.id.queryID
            ? {
                ...query,
                tree: {
                  ...tree,
                  nodes: {
                    ...tree.nodes,
                    [action.id.nodeID]: {
                      ...tree.nodes[action.id.nodeID],
                      editMode: action.editMode,
                    },
                  },
                },
              }
            : query
        ),
      };
    }

    case actions.SELECT_NODE:
      return {
        ...state,
        selectedNodeID: action.id,
      };

    case actions.DESELECT_NODE:
      return {
        ...state,
        selectedNodeID: null,
      };

    case actions.UPDATE_NODE:
      const { queryID, nodeID } = action.id;
      return replaceNode(state, queryID, nodeID, action.node);

    case actions.DELETE_NODE: {
      const { queryID, nodeID } = action.id;
      if (queryID > 0 && state.queries[queryID].tree.rootID === nodeID) {
        return appReducer(state, deleteQuery(queryID));
      }
      return replaceNode(state, queryID, nodeID, { type: nodeType.placeholder, children: [] });
    }

    case actions.COPY_NODE: {
      const { queryID, nodeID } = action.id;
      return { ...state, copiedNode: denormalizeAST(state.queries[queryID].tree, nodeID) };
    }

    case actions.CUT_NODE: {
      const { queryID, nodeID } = action.id;
      return appReducer(appReducer(state, copyNode(queryID, nodeID)), deleteNode(queryID, nodeID));
    }

    case actions.PASTE_NODE: {
      if (state.copiedNode === null) {
        return state;
      }

      const { queryID, nodeID } = action.id;
      return appReducer(state, updateNode(queryID, nodeID, state.copiedNode));
    }

    case actions.MOVE_NODE: {
      const { source, target } = action;
      const srcTree = state.queries[source.queryID].tree;
      const newState = appReducer(state, updateNode(target.queryID, target.nodeID, denormalizeAST(srcTree, source.nodeID)));
      // If the node hasn't replaced one of its ancestors and thus still exists, then remove it.
      if (newState.queries[source.queryID].tree.nodes.hasOwnProperty(source.nodeID)) {
        return replaceNode(newState, source.queryID, source.nodeID, { type: nodeType.placeholder, children: [] });
      }
      return newState;
    }

    case actions.ADD_QUERY:
      const newQuery = makeNewQuery();
      return {
        ...state,
        queries: [...state.queries, newQuery],
        selectedNodeID: { queryID: state.queries.length, nodeID: newQuery.tree.rootID },
      };

    case actions.INSERT_QUERY:
      return {
        ...state,
        queries: [
          ...state.queries.slice(0, action.id),
          {
            expr: action.expr,
            exprStale: false,
            showMetricsExplorer: false,
            tree: normalizeAST({ type: nodeType.placeholder, children: [] }),
          },
          ...state.queries.slice(action.id),
        ],
        selectedNodeID: null,
      };

    case actions.DELETE_QUERY:
      if (state.queries.length === 1) {
        return { ...state, queries: [makeNewQuery()], selectedNodeID: null };
      }

      let selectedNodeID = state.selectedNodeID;
      if (selectedNodeID !== null) {
        if (selectedNodeID.queryID === action.id) {
          selectedNodeID = null;
        } else if (selectedNodeID.queryID > action.id) {
          selectedNodeID = { ...selectedNodeID, queryID: selectedNodeID.queryID - 1 };
        }
      }

      return {
        ...state,
        queries: state.queries.filter((_, idx) => idx !== action.id),
        selectedNodeID: selectedNodeID,
      };

    case actions.SET_NODE_VISUALIZER_STATE:
      return { ...state, nodeVisualizer: action.state };

    default:
      return state;
  }
};

const markExprStale = (state = initialState, queryID: QueryID): AppState => {
  return {
    ...state,
    queries: state.queries.map((q, idx) => (idx === queryID ? { ...q, exprStale: true } : q)),
  };
};

const markExprStaleReducer = (state = initialState, action: Action): AppState => {
  const newState = appReducer(state, action);

  switch (action.type) {
    case actions.UPDATE_NODE:
    case actions.DELETE_NODE:
    case actions.CUT_NODE:
    case actions.PASTE_NODE:
      return markExprStale(newState, action.id.queryID);
    case actions.MOVE_NODE:
      return markExprStale(markExprStale(newState, action.source.queryID), action.target.queryID);
  }
  return newState;
};

const MAX_UNDO_ITEMS = 20;

// TODO: Make this a reducer enhancer? I don't see a good reason at the moment though.
const treeUndoReducer = (state = initialState, action: Action): AppState => {
  const { past, future } = state.queryHistory;

  switch (action.type) {
    case actions.SET_TREE:
    case actions.SET_EXPR:
    case actions.SET_EDIT_MODE:
    case actions.UPDATE_NODE:
    case actions.DELETE_NODE:
    case actions.CUT_NODE:
    case actions.PASTE_NODE:
    case actions.MOVE_NODE:
    case actions.ADD_QUERY:
    case actions.INSERT_QUERY:
    case actions.DELETE_QUERY:
      const newState: AppState = {
        ...state,
        queryHistory: {
          past: [...past.slice(Math.max(0, 1 + past.length - MAX_UNDO_ITEMS)), state.queries],
          future: [],
        },
      };
      return markExprStaleReducer(newState, action);
    case actions.UNDO:
      if (past.length === 0) {
        break;
      }

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        ...state,
        queries: previous,
        queryHistory: {
          past: newPast,
          future: [state.queries, ...future],
        },
        selectedNodeID: null,
      };
    case actions.REDO:
      if (future.length === 0) {
        break;
      }

      const next = future[0];
      const newFuture = future.slice(1);
      return {
        ...state,
        queries: next,
        queryHistory: {
          past: [...past, state.queries],
          future: newFuture,
        },
        selectedNodeID: null,
      };
  }
  return markExprStaleReducer(state, action);
};

export interface ExportedStateV1 {
  version: 1;
  serverURL: string;
  queries: {
    expr: string;
    exprStale: boolean;
    ast: ASTNode;
  }[];
  selectedNodeIdx: null | {
    queryID: QueryID;
    nodeIdx: number;
  };
  nodeVisualizer: NodeVisualizerState;
}

export interface ExportedStateV2orV3 {
  version: 2 | 3;
  serverSettings: ServerSettings;
  queries: {
    expr: string;
    exprStale: boolean;
    // In v2 the AST nodes didn't contain @-modifier-relevant fields yet ("timestamp" and "startOrEnd"),
    // so they need to be filled in with default null values rather than be left undefined after importing.
    ast: ASTNode;
  }[];
  selectedNodeIdx: null | {
    queryID: QueryID;
    nodeIdx: number;
  };
  nodeVisualizer: NodeVisualizerState;
}

// TODO: Move these functions to the state loader / link sharer?
export const exportState = (state: AppState): ExportedStateV2orV3 => {
  const { queries, selectedNodeID } = state;

  return {
    version: 3,
    serverSettings: state.serverSettings,
    queries: state.queries.map((query) => ({
      expr: query.expr,
      exprStale: query.exprStale,
      ast: denormalizeAST(query.tree),
    })),
    selectedNodeIdx:
      selectedNodeID !== null
        ? {
            queryID: selectedNodeID.queryID,
            nodeIdx: getOrderedNodeIDs(queries[selectedNodeID.queryID].tree).indexOf(selectedNodeID.nodeID),
          }
        : null,
    nodeVisualizer: state.nodeVisualizer,
  };
};

const setAtModifierDefaults = (node: ASTNode) => {
  if (node.type === nodeType.vectorSelector || node.type === nodeType.matrixSelector || node.type === nodeType.subquery) {
    node.timestamp = null;
    node.startOrEnd = null;
  }

  getNodeChildren(node).forEach((node) => {
    setAtModifierDefaults(node);
  });
};

const importState = (state: ExportedStateV1 | ExportedStateV2orV3): AppState => {
  const { version, queries: expQueries, selectedNodeIdx, nodeVisualizer } = state;

  if (![1, 2, 3].includes(version)) {
    throw new Error('Unsupported exported state version');
  }

  const serverSettings: ServerSettings =
    state.version === 1
      ? { url: state.serverURL, access: 'direct', datasourceID: null, withCredentials: false }
      : state.serverSettings;

  if (state.version < 3) {
    // This modifies in-place, which is not as elegant as returning a new copy, but is shorter code and
    // ok for a one-time import.
    expQueries.forEach((q) => setAtModifierDefaults(q.ast));
  }

  const queries = expQueries.map((query) => ({
    expr: query.expr,
    exprStale: query.exprStale,
    showMetricsExplorer: false,
    tree: normalizeAST(query.ast),
  }));

  let selectedNodeID: null | GlobalNodeID = null;
  if (selectedNodeIdx !== null) {
    selectedNodeID = {
      queryID: selectedNodeIdx.queryID,
      nodeID: getOrderedNodeIDs(queries[selectedNodeIdx.queryID].tree)[selectedNodeIdx.nodeIdx],
    };
  }

  return {
    ...initialState,
    serverSettings,
    queries,
    selectedNodeID,
    nodeVisualizer,
  };
};

export default treeUndoReducer;

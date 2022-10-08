import {
  GlobalNodeID,
  QueryID,
  NodeID,
  Tree,
  NodeEditMode,
  ServerSettings,
  NodeQueryState,
  NodeVisualizerState,
} from './state';
import ASTNode from '../promql/ast';
import { ExportedStateV1, ExportedStateV2orV3 } from './reducers';

export enum actions {
  IMPORT_STATE,
  SET_SERVER_SETTINGS,
  SET_EXPR,
  SET_SHOW_METRICS_EXPLORER,
  SET_TREE,
  SET_NODE_QUERY_STATE,
  SET_EDIT_MODE,
  SELECT_NODE,
  DESELECT_NODE,
  UPDATE_NODE,
  DELETE_NODE,
  COPY_NODE,
  CUT_NODE,
  PASTE_NODE,
  MOVE_NODE,
  UNDO,
  REDO,
  SELECT_ROOT,
  ADD_QUERY,
  INSERT_QUERY,
  DELETE_QUERY,
  SET_NODE_VISUALIZER_STATE,
}

interface SetServerSettingsAction {
  type: actions.SET_SERVER_SETTINGS;
  settings: ServerSettings;
}

interface ImportStateAction {
  type: actions.IMPORT_STATE;
  state: ExportedStateV1 | ExportedStateV2orV3;
}

interface SetTreeAction {
  type: actions.SET_TREE;
  id: QueryID;
  tree: Tree;
}

interface SetExprAction {
  type: actions.SET_EXPR;
  id: QueryID;
  expr: string;
}

interface SetShowMetricsExplorerAction {
  type: actions.SET_SHOW_METRICS_EXPLORER;
  id: QueryID;
  show: boolean;
}

interface SetNodeQueryStateAction {
  type: actions.SET_NODE_QUERY_STATE;
  id: GlobalNodeID;
  state: NodeQueryState;
}

interface SetEditModeAction {
  type: actions.SET_EDIT_MODE;
  id: GlobalNodeID;
  editMode: NodeEditMode;
}

interface SelectNodeAction {
  type: actions.SELECT_NODE;
  id: GlobalNodeID;
}

interface DeselectNodeAction {
  type: actions.DESELECT_NODE;
}

interface UpdateNodeAction {
  type: actions.UPDATE_NODE;
  id: GlobalNodeID;
  node: ASTNode;
}

interface DeleteNodeAction {
  type: actions.DELETE_NODE;
  id: GlobalNodeID;
}

interface CopyNodeAction {
  type: actions.COPY_NODE;
  id: GlobalNodeID;
}

interface CutNodeAction {
  type: actions.CUT_NODE;
  id: GlobalNodeID;
}

interface PasteNodeAction {
  type: actions.PASTE_NODE;
  id: GlobalNodeID;
}

interface MoveNodeAction {
  type: actions.MOVE_NODE;
  source: GlobalNodeID;
  target: GlobalNodeID;
}

interface UndoAction {
  type: actions.UNDO;
}

interface RedoAction {
  type: actions.REDO;
}

interface AddQueryAction {
  type: actions.ADD_QUERY;
}

interface InsertQueryAction {
  type: actions.INSERT_QUERY;
  id: QueryID;
  expr: string;
}

interface DeleteQueryAction {
  type: actions.DELETE_QUERY;
  id: QueryID;
}

interface SetNodeVisualizerStateAction {
  type: actions.SET_NODE_VISUALIZER_STATE;
  state: NodeVisualizerState;
}

export const importState = (state: ExportedStateV1 | ExportedStateV2orV3): ImportStateAction => {
  return {
    type: actions.IMPORT_STATE,
    state,
  };
};

export const setServerSettings = (settings: ServerSettings): SetServerSettingsAction => {
  return {
    type: actions.SET_SERVER_SETTINGS,
    settings,
  };
};

// TODO: Why does this take a tree while updateNode() takes an ASTNode? Do we even need both?
export const setTree = (id: QueryID, tree: Tree): SetTreeAction => {
  return {
    type: actions.SET_TREE,
    id,
    tree,
  };
};

export const setExpr = (id: QueryID, expr: string): SetExprAction => {
  return {
    type: actions.SET_EXPR,
    id,
    expr,
  };
};

export const setShowMetricsExplorer = (id: QueryID, show: boolean): SetShowMetricsExplorerAction => {
  return {
    type: actions.SET_SHOW_METRICS_EXPLORER,
    id,
    show,
  };
};

export const setNodeQueryState = (queryID: QueryID, nodeID: NodeID, state: NodeQueryState): SetNodeQueryStateAction => {
  return {
    type: actions.SET_NODE_QUERY_STATE,
    id: { queryID, nodeID },
    state,
  };
};

export const setEditMode = (queryID: QueryID, nodeID: NodeID, editMode: NodeEditMode): SetEditModeAction => {
  return {
    type: actions.SET_EDIT_MODE,
    id: { queryID, nodeID },
    editMode,
  };
};

export const selectNode = (queryID: QueryID, nodeID: NodeID): SelectNodeAction => {
  return {
    type: actions.SELECT_NODE,
    id: { queryID, nodeID },
  };
};

export const deselectNode = (): DeselectNodeAction => {
  return {
    type: actions.DESELECT_NODE,
  };
};

export const updateNode = (queryID: QueryID, nodeID: NodeID, node: ASTNode): UpdateNodeAction => {
  return {
    type: actions.UPDATE_NODE,
    id: { queryID, nodeID },
    node,
  };
};

export const deleteNode = (queryID: QueryID, nodeID: NodeID): DeleteNodeAction => {
  return {
    type: actions.DELETE_NODE,
    id: { queryID, nodeID },
  };
};

export const copyNode = (queryID: QueryID, nodeID: NodeID): CopyNodeAction => {
  return {
    type: actions.COPY_NODE,
    id: { queryID, nodeID },
  };
};

export const cutNode = (queryID: QueryID, nodeID: NodeID): CutNodeAction => {
  return {
    type: actions.CUT_NODE,
    id: { queryID, nodeID },
  };
};

export const pasteNode = (queryID: QueryID, nodeID: NodeID): PasteNodeAction => {
  return {
    type: actions.PASTE_NODE,
    id: { queryID, nodeID },
  };
};

export const moveNode = (srcQueryID: QueryID, srcNodeID: NodeID, tgtQueryID: QueryID, tgtNodeID: NodeID): MoveNodeAction => {
  return {
    type: actions.MOVE_NODE,
    source: { queryID: srcQueryID, nodeID: srcNodeID },
    target: { queryID: tgtQueryID, nodeID: tgtNodeID },
  };
};

export const undo = (): UndoAction => {
  return {
    type: actions.UNDO,
  };
};

export const redo = (): RedoAction => {
  return {
    type: actions.REDO,
  };
};

export const addQuery = (): AddQueryAction => {
  return {
    type: actions.ADD_QUERY,
  };
};

export const insertQuery = (id: QueryID, expr: string): InsertQueryAction => {
  return {
    type: actions.INSERT_QUERY,
    id,
    expr,
  };
};

export const deleteQuery = (id: QueryID): DeleteQueryAction => {
  return {
    type: actions.DELETE_QUERY,
    id,
  };
};

export const setNodeVisualizerState = (state: NodeVisualizerState): SetNodeVisualizerStateAction => {
  return {
    type: actions.SET_NODE_VISUALIZER_STATE,
    state,
  };
};

export type Action =
  | ImportStateAction
  | SetServerSettingsAction
  | SetExprAction
  | SetShowMetricsExplorerAction
  | SetTreeAction
  | SetNodeQueryStateAction
  | SetEditModeAction
  | SelectNodeAction
  | DeselectNodeAction
  | UpdateNodeAction
  | DeleteNodeAction
  | CopyNodeAction
  | CutNodeAction
  | PasteNodeAction
  | MoveNodeAction
  | UndoAction
  | RedoAction
  | AddQueryAction
  | InsertQueryAction
  | DeleteQueryAction
  | SetNodeVisualizerStateAction;

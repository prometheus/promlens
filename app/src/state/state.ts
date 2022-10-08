import ASTNode from '../state/ast';
import RawASTNode from '../promql/ast';

export interface ServerSettings {
  url: string;
  access: 'proxy' | 'direct';
  datasourceID: number | null;
  withCredentials: boolean;
}

export type QueryID = number;
export type NodeID = number;

// The query result for each individual node in the tree view.
export interface NodeQueryResult {
  numSeries: number;
  queryTime: number;
  labelCardinalities: Record<string, number>;
  labelExamples: Record<string, { value: string; count: number }[]>;
}

// The query status for each individual node in the tree view.
export enum NodeQueryStatus {
  Success,
  Error,
  Running,
  NodeIncomplete,
}

export type NodeQueryState =
  | { status: NodeQueryStatus.Success; result: NodeQueryResult }
  | { status: NodeQueryStatus.Error; error: string }
  | { status: NodeQueryStatus.Running }
  | { status: NodeQueryStatus.NodeIncomplete };

// The edit mode for each individual node in the tree view.
export enum NodeEditMode {
  None,
  Text,
  Form,
}

// A container for each AST node in the denormalized representation for the
// tree view UI. Child nodes are tracked by numeric IDs, vs. directly as a
// recursive sub-oject of the `node` property.
export interface Node {
  id: NodeID;
  parentID: NodeID | null;
  childIDs: NodeID[];
  node: ASTNode;
  queryState: NodeQueryState;
  editMode: NodeEditMode;
}

// GlobaNodeID identifies a single tree view node across multiple queries.
export interface GlobalNodeID {
  queryID: QueryID;
  nodeID: NodeID;
}

// A Tree stores the denormalized representation of a single query's PromQL AST
// (see https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape),
// along with properties needed by the tree view UI (like query and editing states).
export type Tree = {
  nodes: Record<NodeID, Node>;
  rootID: NodeID;
};

export type Query = {
  expr: string;
  exprStale: boolean;
  showMetricsExplorer: boolean;
  tree: Tree;
};

export interface NodeVisualizerState {
  activeTab: 'table' | 'graph' | 'explain';
  endTime: number | null;
  range: number;
  resolution: number | null;
  stacked: boolean;
}

export interface AppState {
  // The global server settings. Can be either a single manually entered URL
  // or reference a datasource ID from Grafana.
  serverSettings: ServerSettings;

  // State data for individual "Query" panes.
  queries: Query[];
  // Undo history for "Query" panes.
  queryHistory: {
    past: Query[][];
    future: Query[][];
  };
  // The ID of the currently selected (e.g. clicked-on) tree view node.
  selectedNodeID: GlobalNodeID | null;
  // The copied tree view node (e.g. via Ctrl-C), stored in a denormalized way.
  copiedNode: RawASTNode | null;

  // The state for the Table/Graph/Explain pane at the bottom.
  nodeVisualizer: NodeVisualizerState;
}

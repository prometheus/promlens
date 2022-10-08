import { Node, NodeID, Tree, NodeQueryStatus, NodeEditMode } from './state';
import { getAllDescendantIDs, deleteNodes } from './reducers';
import { nodeType } from '../promql/ast';

const makeDummyNode = (): Node => {
  return {
    id: 0,
    parentID: null,
    childIDs: [],
    node: { type: nodeType.placeholder },
    // TODO: Why not allow null for the query result...
    queryResult: { numSeries: 0, queryTime: 0, labelCardinalities: {}, labelExamples: {}, error: null, loading: false },
    queryStatus: NodeQueryStatus.Success,
    editMode: NodeEditMode.None,
  };
};

const makeTreeFromConnections = (nodes: Record<NodeID, NodeID[]>, rootID = 0): Tree => {
  const tree: Tree = {
    nodes: {},
    rootID,
  };

  Object.entries(nodes).forEach(([parentID, childIDs]) => {
    tree.nodes[parseInt(parentID)] = {
      ...makeDummyNode(),
      childIDs,
    };
  });

  return tree;
};

const getConnectionsFromNodes = (nodes: Record<NodeID, Node>): Record<NodeID, NodeID[]> => {
  const connections: Record<NodeID, NodeID[]> = {};

  Object.entries(nodes).forEach(([nodeID, node]) => {
    connections[parseInt(nodeID)] = node.childIDs;
  });

  return connections;
};

const bigTree = makeTreeFromConnections({
  0: [1, 2],
  1: [3],
  2: [6],
  3: [4, 5],
  4: [],
  5: [],
  6: [],
});

describe('getAllDescendantIDs', () => {
  it('should return correct descendant IDs for subtree with children', () => {
    expect(getAllDescendantIDs(bigTree, 0).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getAllDescendantIDs(bigTree, 1).sort()).toEqual([3, 4, 5]);
  });

  it('should return no descendant IDs for subtree without children', () => {
    expect(getAllDescendantIDs(bigTree, 6)).toEqual([]);
  });
});

describe('deleteNodes', () => {
  it('should delete nodes with all children', () => {
    expect(getConnectionsFromNodes(deleteNodes(bigTree, [1, 3, 4, 5]))).toEqual({
      0: [1, 2],
      2: [6],
      6: [],
    });
  });
});

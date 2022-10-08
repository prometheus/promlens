import ASTNode, { nodeType } from '../promql/ast';
import NormalizedASTNode from '../state/ast';
import { NodeID, Tree, NodeQueryStatus, NodeEditMode } from './state';
import { aggregatorsWithParam, getNodeChildren } from '../promql/utils';

let nextID = 1;

// normalizeAST() transforms a recursive PromQL AST node hierarchy into a set of independent node objects
// indexed by a numeric ID in a Tree object, to be able to better handle tree state updates.
// See also https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape.
const normalizeAST = (node: ASTNode, tree: Tree = { nodes: {}, rootID: nextID }): Tree => {
  const nodeID = nextID++;

  const children = getNodeChildren(node);
  const childIDs = children.map((child) => normalizeAST(child, tree).rootID);
  childIDs.forEach((id) => (tree.nodes[id].parentID = nodeID));

  tree.nodes[nodeID] = {
    id: nodeID,
    parentID: null,
    childIDs: childIDs,
    // This type assertion works because the normalized AST node objects are mostly the
    // same as the non-normalized ones, but without recursive child fields. So after the
    // type cast, those fields will simply not be accessible anymore.
    //
    // TODO: Would it be better to manually copy over the object properties into the target interface?
    node: node as NormalizedASTNode,
    queryState: { status: NodeQueryStatus.Running },
    editMode: NodeEditMode.None,
  };

  return { ...tree, rootID: nodeID };
};

// denormalizeAST() re-builds a recursive AST node object tree from its normalized representation.
//
// The shallow-copying relies on the fact that relevant bits (like vector matching options) are
// replaced completely in other places, vs. mutated directly.
export const denormalizeAST = (tree: Tree, rootID: NodeID = tree.rootID): ASTNode => {
  const root = tree.nodes[rootID];
  const node = root.node;
  const denormChild = (idx: number): ASTNode => denormalizeAST(tree, root.childIDs[idx]);

  switch (node.type) {
    case nodeType.aggregation:
      return {
        ...node,
        expr: denormChild(root.childIDs.length - 1),
        param: aggregatorsWithParam.includes(node.op) ? denormChild(0) : null,
      };
    case nodeType.subquery:
    case nodeType.parenExpr:
    case nodeType.unaryExpr:
      return {
        ...node,
        expr: denormChild(0),
      };
    case nodeType.call:
      return {
        ...node,
        args: root.childIDs.map((_, idx) => denormChild(idx)),
      };
    case nodeType.matrixSelector:
    case nodeType.vectorSelector:
    case nodeType.numberLiteral:
    case nodeType.stringLiteral:
      return { ...node };
    case nodeType.placeholder:
      return {
        ...node,
        children: root.childIDs.map((_, idx) => denormChild(idx)),
      };
    case nodeType.binaryExpr:
      return {
        ...node,
        lhs: denormChild(0),
        rhs: denormChild(1),
      };
    default:
      throw new Error('unsupported node type');
  }
};

export default normalizeAST;

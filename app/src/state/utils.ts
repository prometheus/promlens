import { Tree, NodeID, ServerSettings } from './state';
import { nodeType } from '../promql/ast';
import { GrafanaDataSourceSettings } from '../types/types';

export const getOrderedNodeIDs = (tree: Tree, rootID = tree.rootID): NodeID[] => {
  const node = tree.nodes[rootID];
  if (node.node.type === nodeType.binaryExpr) {
    return [...getOrderedNodeIDs(tree, node.childIDs[0]), rootID, ...getOrderedNodeIDs(tree, node.childIDs[1])];
  }
  return [rootID, ...node.childIDs.map((id) => getOrderedNodeIDs(tree, id)).flat()];
};

export const grafanaDatasourceToServerSettings = (ds: GrafanaDataSourceSettings): ServerSettings => ({
  url: ds.url,
  access: ds.access,
  datasourceID: ds.id,
  withCredentials: ds.withCredentials ? ds.withCredentials : false,
});

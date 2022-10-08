import React, { FC, useState } from 'react';
import ASTNode, { nodeType } from '../../promql/ast';
import { GlobalHotKeys, getApplicationKeyMap, ActionName, KeySequence } from 'react-hotkeys';
import { connect } from 'react-redux';
import { QueryID, NodeID, GlobalNodeID, Tree, AppState, NodeEditMode, Query } from '../../state/state';
import * as actions from '../../state/actions';
import { FaPlus } from 'react-icons/fa';
import { denormalizeAST } from '../../state/normalizeAST';
import { getOrderedNodeIDs } from '../../state/utils';
import { Col, Row, Button } from 'react-bootstrap';
import { PromAPI } from '../../promAPI/promAPI';
import { PathPrefixProps } from '../../types/types';
import QueryView from './QueryView/QueryView';

interface TreeViewOwnProps {
  metricNames: string[];
  promAPI: PromAPI;
  initialTrigger: boolean;
}

interface TreeViewStateProps {
  queries: Query[];
  selectedNodeID: GlobalNodeID | null;
}

interface TreeViewDispatchProps {
  selectNode: (queryID: QueryID, nodeID: NodeID) => void;
  deselectNode: () => void;
  updateNode: (queryID: QueryID, nodeID: NodeID, node: ASTNode) => void;
  deleteNode: (queryID: QueryID, nodeID: NodeID) => void;
  copyNode: (queryID: QueryID, nodeID: NodeID) => void;
  cutNode: (queryID: QueryID, nodeID: NodeID) => void;
  pasteNode: (queryID: QueryID, nodeID: NodeID) => void;
  undo: () => void;
  redo: () => void;
  addQuery: () => void;
  setEditMode: (queryID: QueryID, nodeID: NodeID, editMode: NodeEditMode) => void;
  setShowMetricsExplorer: (queryID: QueryID, show: boolean) => void;
}

const QueryList: FC<TreeViewOwnProps & TreeViewStateProps & TreeViewDispatchProps & PathPrefixProps> = ({
  pathPrefix,
  queries,
  selectedNodeID,
  metricNames,
  promAPI,
  initialTrigger,
  selectNode,
  deselectNode,
  updateNode,
  deleteNode,
  copyNode,
  cutNode,
  pasteNode,
  addQuery,
  undo,
  redo,
  setEditMode,
  setShowMetricsExplorer,
}) => {
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const keyMap: { [key in ActionName]: KeySequence } = {
    // Extra "sequence" and "action" fields are required due to a bug in react-hotkeys' TypeScript definitions.
    TOGGLE_METRICS_EXPLORER: { name: 'Toggle metrics explorer', sequences: ['m'], sequence: '', action: 'keydown' },
    COPY_NODE: { name: 'Copy node', sequences: ['ctrl+c', 'command+c'], sequence: '', action: 'keydown' },
    PASTE_NODE: { name: 'Paste node', sequences: ['ctrl+v', 'command+v'], sequence: '', action: 'keydown' },
    CUT_NODE: { name: 'Cut node', sequences: ['ctrl+x', 'command+x'], sequence: '', action: 'keydown' },
    DELETE_NODE: { name: 'Delete node', sequences: ['del', 'backspace'], sequence: '', action: 'keydown' },
    INSERT_PARENT: { name: 'Insert parent node', sequences: ['i'], sequence: '', action: 'keydown' },
    UNDO: { name: 'Undo tree action', sequences: ['ctrl+z', 'command+z'], sequence: '', action: 'keydown' },
    REDO: { name: 'Redo tree action', sequences: ['ctrl+y', 'command+y'], sequence: '', action: 'keydown' },
    TOGGLE_EDITOR: { name: 'Toggle node editor', sequences: ['e'], sequence: '', action: 'keydown' },
    TOGGLE_EDIT_AS_TEXT: { name: 'Toggle editing node as text', sequences: ['Enter', 't'], sequence: '', action: 'keydown' },
    CLOSE_EDITOR: { name: 'Close node editor', sequences: ['esc'], sequence: '', action: 'keydown' },
    SELECT_ROOT: { name: 'Select root node', sequences: ['r'], sequence: '', action: 'keydown' },
    SELECT_PREV_NODE: { name: 'Select previous node', sequences: ['k'], sequence: '', action: 'keydown' },
    SELECT_NEXT_NODE: { name: 'Select next node', sequences: ['j'], sequence: '', action: 'keydown' },
    SELECT_PREV_QUERY: { name: 'Select previous query', sequences: ['p'], sequence: '', action: 'keydown' },
    SELECT_NEXT_QUERY: { name: 'Select next query', sequences: ['n'], sequence: '', action: 'keydown' },
    ADD_NEW_QUERY: { name: 'Add new query', sequences: ['a'], sequence: '', action: 'keydown' },
    TOGGLE_HELP: { name: 'Show help', sequences: ['shift+?'], sequence: '', action: 'keydown' },
  };

  const handlers = {
    TOGGLE_METRICS_EXPLORER: () => {
      const queryID = selectedNodeID?.queryID || 0;
      setShowMetricsExplorer(queryID, !queries[queryID].showMetricsExplorer);
    },
    COPY_NODE: () => {
      if (selectedNodeID !== null) {
        copyNode(selectedNodeID.queryID, selectedNodeID.nodeID);
      }
    },
    PASTE_NODE: () => {
      if (selectedNodeID !== null) {
        pasteNode(selectedNodeID.queryID, selectedNodeID.nodeID);
      }
    },
    CUT_NODE: () => {
      if (selectedNodeID !== null) {
        cutNode(selectedNodeID.queryID, selectedNodeID.nodeID);
      }
    },
    DELETE_NODE: () => {
      if (selectedNodeID !== null) {
        deleteNode(selectedNodeID.queryID, selectedNodeID.nodeID);
      }
    },
    INSERT_PARENT: () => {
      if (selectedNodeID !== null) {
        const { queryID, nodeID } = selectedNodeID;
        updateNode(queryID, nodeID, {
          type: nodeType.placeholder,
          children: [denormalizeAST(queries[queryID].tree, nodeID)],
        });
      }
    },
    UNDO: () => {
      undo();
    },
    REDO: () => {
      redo();
    },
    TOGGLE_EDITOR: () => {
      if (selectedNodeID !== null) {
        const { queryID, nodeID } = selectedNodeID;
        setEditMode(
          queryID,
          nodeID,
          queries[queryID].tree.nodes[nodeID].editMode === NodeEditMode.Form ? NodeEditMode.None : NodeEditMode.Form
        );
      }
    },
    TOGGLE_EDIT_AS_TEXT: () => {
      // TODO: This is required to not trigger node text editing when the user just wants to use the
      // Enter key to trigger an action. I couldn't find any other way of stopping the propagation of
      // keyboard events from such elements to react-hotkeys. Is there a better way? Is the "button"
      // tag sufficient for elements that trigger actions by default when Enter is pressed on them?
      // (inputs etc. are already excepted automatically by react-hotkeys)
      if (document.activeElement !== null && document.activeElement.tagName.toLowerCase() === 'button') {
        return;
      }

      if (selectedNodeID !== null) {
        const { queryID, nodeID } = selectedNodeID;
        setEditMode(
          queryID,
          nodeID,
          queries[queryID].tree.nodes[nodeID].editMode === NodeEditMode.Text ? NodeEditMode.None : NodeEditMode.Text
        );
      }
    },
    CLOSE_EDITOR: () => {
      if (selectedNodeID !== null) {
        const { queryID, nodeID } = selectedNodeID;
        setEditMode(queryID, nodeID, NodeEditMode.None);
      }
    },
    SELECT_ROOT: () => {
      if (selectedNodeID !== null) {
        const { queryID, nodeID } = selectedNodeID;
        if (nodeID === queries[queryID].tree.rootID) {
          deselectNode();
        } else {
          selectNode(queryID, queries[queryID].tree.rootID);
        }
      } else {
        selectNode(0, queries[0].tree.rootID);
      }
    },
    SELECT_PREV_NODE: () => {
      if (selectedNodeID !== null) {
        const orderedNodeIDs = getOrderedNodeIDs(queries[selectedNodeID.queryID].tree);
        const curIdx = orderedNodeIDs.indexOf(selectedNodeID.nodeID);
        // TODO: Skip hidden nodes here (child nodes of textually edited nodes).
        const newIdx = (curIdx - 1 + orderedNodeIDs.length) % orderedNodeIDs.length;
        selectNode(selectedNodeID.queryID, orderedNodeIDs[newIdx]);
      } else {
        selectNode(0, queries[0].tree.rootID);
      }
    },
    SELECT_NEXT_NODE: () => {
      if (selectedNodeID !== null) {
        const orderedNodeIDs = getOrderedNodeIDs(queries[selectedNodeID.queryID].tree);
        const curIdx = orderedNodeIDs.indexOf(selectedNodeID.nodeID);
        // TODO: Skip hidden nodes here (child nodes of textually edited nodes).
        const newIdx = (curIdx + 1) % orderedNodeIDs.length;
        selectNode(selectedNodeID.queryID, orderedNodeIDs[newIdx]);
      } else {
        selectNode(0, queries[0].tree.rootID);
      }
    },
    SELECT_PREV_QUERY: () => {
      if (selectedNodeID !== null) {
        const newQueryID = (selectedNodeID.queryID - 1 + queries.length) % queries.length;
        selectNode(newQueryID, queries[newQueryID].tree.rootID);
      } else {
        selectNode(0, queries[0].tree.rootID);
      }
    },
    SELECT_NEXT_QUERY: () => {
      if (selectedNodeID !== null) {
        const newQueryID = (selectedNodeID.queryID + 1) % queries.length;
        selectNode(newQueryID, queries[newQueryID].tree.rootID);
      } else {
        selectNode(0, queries[0].tree.rootID);
      }
    },
    ADD_NEW_QUERY: () => {
      addQuery();
    },
    TOGGLE_HELP: () => {
      setShowHelp(!showHelp);
    },
  };

  const helpKeyMap = getApplicationKeyMap();

  return (
    <>
      <GlobalHotKeys keyMap={keyMap} handlers={handlers} allowChanges={true} />
      {showHelp && (
        <div className="help-dialog">
          <h4>Keyboard shortcuts</h4>
          <table className="table">
            <tbody>
              {Object.keys(helpKeyMap).map((actionName: string) => {
                const { sequences, name } = helpKeyMap[actionName];

                return (
                  <tr key={name || actionName}>
                    <td>{name}</td>
                    <td className="help-dialog-key">
                      {sequences.map(({ sequence }, idx) => (
                        <span key={sequence.toString()}>
                          {idx > 0 && ', '}
                          {sequence}
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Col className="ast-visualizer">
        {queries.map((_, queryID) => (
          <QueryView
            key={queryID}
            pathPrefix={pathPrefix}
            metricNames={metricNames}
            promAPI={promAPI}
            initialTrigger={initialTrigger}
            queryID={queryID}
          />
        ))}
        <Row style={{ marginTop: 20 }}>
          <Col>
            <Button size="sm" variant="light" onClick={addQuery} className="px-4">
              <FaPlus />
              &nbsp;&nbsp;Add another query
            </Button>
          </Col>
        </Row>
      </Col>
    </>
  );
};

const mapStateToProps = (state: AppState): TreeViewStateProps => {
  return {
    queries: state.queries,
    selectedNodeID: state.selectedNodeID,
  };
};

export default connect<TreeViewStateProps, TreeViewDispatchProps, TreeViewOwnProps, AppState>(
  mapStateToProps,
  actions
)(QueryList);

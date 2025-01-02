import React, { FC, useState, useRef, useLayoutEffect, CSSProperties, useEffect, useContext, ReactNode } from 'react';
import { FaSpinner, FaPlus, FaTimes, FaMinus, FaChild } from 'react-icons/fa';
import { AiFillEdit, AiOutlineWarning } from 'react-icons/ai';
import { CgOptions } from 'react-icons/cg';

import { GoDotFill } from 'react-icons/go';

import ASTNode, { nodeType } from '../../../promql/ast';
import serializeNode from '../../../promql/serialize';
import {
  getNonParenNodeType,
  childDescription,
  allowedChildValueTypes,
  canAddVarArg,
  canRemoveVarArg,
  anyValueType,
  humanizedValueType,
  escapeString,
} from '../../../promql/utils';
import { InstantSample, RangeSamples } from './QueryResultTypes';
import { formatNode } from '../../../promql/format';
import { NodeConstraints } from './types';
import ExpressionEditor from './ExpressionEditor/ExpressionEditor';
import {
  GlobalNodeID,
  QueryID,
  NodeID,
  Node,
  AppState,
  NodeQueryStatus,
  Tree,
  NodeEditMode,
  NodeQueryState,
} from '../../../state/state';
import { connect } from 'react-redux';
import * as actions from '../../../state/actions';
import { denormalizeAST } from '../../../state/normalizeAST';
import { useDrag, useDrop, DragSourceMonitor } from 'react-dnd';
import { getAllDescendantIDs } from '../../../state/reducers';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import NodeEditor from './NodeEditor/NodeEditor';
import ReactResizeDetector from 'react-resize-detector';
import { functionSignatures } from '../../../promql/functionSignatures';
import { PromAPI } from '../../../promAPI/promAPI';
import { PathPrefixProps } from '../../../types/types';
import { Settings, SettingsContext } from '../../../PromLens/SettingsEditor';
import getNodeAnnotations from './NodeAnnotations';
import { FaSearch } from 'react-icons/fa';

interface NodeContainerOwnProps {
  queryID: QueryID;
  nodeID: NodeID;
  name: string; // The node's name / purpose, with respect to the parent.
  constraints: NodeConstraints;
  parentRef?: React.RefObject<HTMLDivElement>;
  reverse: boolean;
  metricNames: string[];
  promAPI: PromAPI;
  resizeGeneration: number;
  onResize: () => void;
}

interface NodeContainerStateProps {
  node: Node;
  tree: Tree;
  parent: Node | null;
  children: Node[];
  childQueryStatus: NodeQueryStatus;
  selected: boolean;
}

interface NodeContainerDispatchProps {
  selectNode: (queryID: QueryID, nodeID: NodeID) => void;
  deselectNode: () => void;
  updateNode: (queryID: QueryID, nodeID: NodeID, node: ASTNode) => void;
  setNodeQueryState: (queryID: QueryID, nodeID: NodeID, state: NodeQueryState) => void;
  moveNode: (srcQueryID: QueryID, srcNodeID: NodeID, tgtQueryID: QueryID, tgtNodeID: NodeID) => void;
  setEditMode: (queryID: QueryID, nodeID: NodeID, editMode: NodeEditMode) => void;
  insertQuery: (id: QueryID, expr: string) => void;
}

interface DragItem {
  type: 'node';
  queryID: QueryID;
  nodeID: NodeID;
}

const NodeContainer: FC<NodeContainerOwnProps & NodeContainerStateProps & NodeContainerDispatchProps & PathPrefixProps> = ({
  pathPrefix,
  promAPI,
  queryID,
  nodeID,
  node,
  tree,
  parent,
  children,
  childQueryStatus,
  name,
  constraints,
  reverse,
  parentRef,
  selected,
  selectNode,
  deselectNode,
  updateNode,
  setNodeQueryState,
  moveNode,
  setEditMode,
  insertQuery,
  metricNames,
  resizeGeneration,
  onResize,
}) => {
  const settings = useContext<Settings>(SettingsContext);

  const nodeRef = useRef<HTMLDivElement>(null);
  const [connectorStyle, setConnectorStyle] = useState<CSSProperties>({});

  const astNode = denormalizeAST(tree, nodeID);
  // TODO: This is just needed for node action buttons - does this extra cost matter? If yes, we could pass down the astNode from the current node to the child instead?
  const parentASTNode = parent === null ? null : denormalizeAST(tree, parent.id);
  const { editMode } = node;

  // Implement drag & drop. Any node can be dragged, but nodes can't be dropped into
  // a subtree of themselves.
  const [{ opacity }, dragRef] = useDrag({
    item: { type: 'node', queryID, nodeID },
    end: (item: GlobalNodeID | undefined, monitor: DragSourceMonitor) => {
      const targetNode: GlobalNodeID | null = monitor.getDropResult();
      if (item !== undefined && targetNode !== null) {
        moveNode(item.queryID, item.nodeID, targetNode.queryID, targetNode.nodeID);
      }
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1,
    }),
  });
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'node',
    canDrop: (item: DragItem) => {
      if (item.queryID !== queryID) {
        return true;
      }

      return item.queryID !== queryID || ![item.nodeID, ...getAllDescendantIDs(tree, item.nodeID)].includes(nodeID);
    },
    drop: (): GlobalNodeID => ({ queryID, nodeID }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  const setNodeRef = (ref: HTMLDivElement | null) => {
    (nodeRef as any).current = ref;
    (dragRef as any)(ref);
  };

  // Update the size and position of tree connector lines based on the node's and its parent's position.
  useLayoutEffect(() => {
    if (parentRef === undefined) {
      // We're the root node.
      return;
    }
    setTimeout(() => {
      if (parentRef.current === null || nodeRef.current === null) {
        return;
      }
      const parentRect = parentRef.current.getBoundingClientRect();
      const nodeRect = nodeRef.current.getBoundingClientRect();
      setConnectorStyle({
        top: reverse ? undefined : parentRect.bottom - nodeRect.top + 3,
        bottom: reverse ? nodeRect.bottom - parentRect.top : undefined,
      });
    }, 0); // TODO: Meh, what a hack. But without the setTimeout(), this is executed to early. Find a better way.
  }, [tree, resizeGeneration]);

  // Execute the PromQL query that this AST node represents, then collect result stats.
  useEffect(() => {
    const setQueryState = (state: NodeQueryState) => {
      setNodeQueryState(queryID, nodeID, state);
    };

    if ([nodeType.stringLiteral, nodeType.numberLiteral].includes(getNonParenNodeType(astNode))) {
      setQueryState({
        status: NodeQueryStatus.Success,
        result: { numSeries: 0, queryTime: 0, labelCardinalities: {}, labelExamples: {} },
      });
      return;
    }

    if (node.node.type === nodeType.placeholder) {
      setQueryState({ status: NodeQueryStatus.NodeIncomplete });
      return;
    }

    if (childQueryStatus === NodeQueryStatus.NodeIncomplete || childQueryStatus === NodeQueryStatus.Running) {
      setQueryState({ status: childQueryStatus });
      return;
    }

    if (childQueryStatus === NodeQueryStatus.Error) {
      setQueryState({ status: childQueryStatus, error: '' });
      return;
    }

    setQueryState({ status: NodeQueryStatus.Running });

    const abortController = new AbortController();

    // Optimize certain node fetches. E.g. 'foo[7w]' can be expensive to fully fetch,
    // but wrapping it in 'count_over_time(foo[7w])' also gives us the information we
    // need (number of series and labels).
    let queryNode: ASTNode = astNode;
    if (queryNode.type === nodeType.matrixSelector) {
      queryNode = {
        type: nodeType.call,
        func: functionSignatures['count_over_time'],
        args: [astNode],
      };
    }

    const queryStart = Date.now();
    promAPI
      .fetch(`/api/v1/query?query=${encodeURIComponent(serializeNode(queryNode))}`, {
        signal: abortController.signal,
      })
      .then((resp) => resp.json())
      .then((json) => {
        if (json.status !== 'success') {
          throw new Error(json.error || 'invalid response JSON');
        }

        let resultSeries = 0;
        const labelValuesByName: Record<string, Record<string, number>> = {};
        if (json.data) {
          const { resultType, result } = json.data;
          if (resultType === 'scalar') {
            resultSeries = 1;
          } else if (result && result.length > 0) {
            resultSeries = result.length;
            result.forEach((s: InstantSample | RangeSamples) => {
              Object.entries(s.metric).forEach(([ln, lv]) => {
                // TODO: If we ever want to include __name__ here again, we cannot use the
                // count_over_time(foo[7d]) optimization since that removes the metric name.
                if (ln !== '__name__') {
                  if (!labelValuesByName.hasOwnProperty(ln)) {
                    labelValuesByName[ln] = { [lv]: 1 };
                  } else {
                    if (!labelValuesByName[ln].hasOwnProperty(lv)) {
                      labelValuesByName[ln][lv] = 1;
                    } else {
                      labelValuesByName[ln][lv]++;
                    }
                  }
                }
              });
            });
          }
        }

        const labelCardinalities: Record<string, number> = {};
        const labelExamples: Record<string, { value: string; count: number }[]> = {};
        Object.entries(labelValuesByName).forEach(([ln, lvs]) => {
          labelCardinalities[ln] = Object.keys(lvs).length;
          // labelExamples[ln] = Array.from({ length: Math.min(5, lvs.size) }, (i => () => i.next().value)(lvs.keys()));
          // Sort label values by their number of occurrences within this label name.
          labelExamples[ln] = Object.entries(lvs)
            .sort(([, aCnt], [, bCnt]) => bCnt - aCnt)
            .slice(0, 5)
            .map(([lv, cnt]) => ({ value: lv, count: cnt }));
        });

        setQueryState({
          status: NodeQueryStatus.Success,
          result: {
            numSeries: resultSeries,
            queryTime: Date.now() - queryStart,
            labelCardinalities,
            labelExamples,
          },
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          // Aborts are expected, don't show an error for them.
          // TODO: Set query result to null here or do nothing?
          return;
        }
        setQueryState({
          status: NodeQueryStatus.Error,
          error: 'Error executing query: ' + error.message,
        });
      });

    return () => {
      abortController.abort();
    };
    // TODO: Better way to do this? Without disabling this check here, reportQueryStatus() is
    // also put into the dependency array, which leads to an infinite loop.
    //
    // TODO: The query result should be invalidated on more than the below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promAPI, childQueryStatus, node.id, node.node, nodeID, setNodeQueryState, queryID]);

  const outerNodeProps: React.HTMLAttributes<HTMLDivElement> = {
    className: `ast-node${selected ? ' ast-node-selected' : ''}${parentRef === undefined ? ' ast-node-root' : ''}`,
  };

  // Function to draw the query status indicator (loading / error / blocked / ...) and query result stats next to the node.
  const queryIndicator = (): React.ReactNode => {
    switch (getNonParenNodeType(astNode)) {
      case 'numberLiteral':
      case 'stringLiteral':
    }

    switch (childQueryStatus) {
      case NodeQueryStatus.NodeIncomplete:
        return (
          <>
            <GoDotFill className="ast-query-icon" color="orange" title="Please fill out missing child nodes" />{' '}
            <span className="ast-node-child-query-error-message">Please fill out missing child nodes</span>
          </>
        );
      case NodeQueryStatus.Running:
        return <GoDotFill className="ast-query-icon" color="#ccc" title="Waiting for child query to complete" />;
      case NodeQueryStatus.Error:
        return (
          <>
            <GoDotFill className="ast-query-icon" color="orange" title="Blocked on child query error" />{' '}
            <span className="ast-node-child-query-error-message">Blocked on child query error</span>
          </>
        );
      case NodeQueryStatus.Success:
        if (node.queryState.status === NodeQueryStatus.NodeIncomplete) {
          return null;
        }
        if (node.queryState.status === NodeQueryStatus.Running) {
          return <FaSpinner className="ast-query-icon icon-spin" title="Query running" style={{ marginRight: 15 }} />;
        }
        if (node.queryState.status === NodeQueryStatus.Error) {
          return (
            <>
              <GoDotFill className="ast-query-icon" color="#a31515" title={node.queryState.error} />{' '}
              <span className="ast-node-query-error-message">{node.queryState.error}</span>
            </>
          );
        }

        const queryResult = node.queryState.result;
        const len = queryResult.labelCardinalities.length;
        const maxLabels = 10;
        const sortedLabelCards = Object.entries(queryResult.labelCardinalities).sort((a, b) => b[1] - a[1]);
        const labelNames: React.ReactNode[] = [
          ...sortedLabelCards.slice(0, maxLabels).map(([ln, card]) => (
            <OverlayTrigger
              popperConfig={{ strategy: 'fixed' }}
              placement="bottom"
              overlay={(props: any) => (
                <Tooltip id="label-tooltip" {...props}>
                  <p>
                    <FaSearch /> Click to query all values.
                  </p>
                  <ul>
                    {queryResult.labelExamples[ln].map(({ value, count }) => (
                      <li key={value}>
                        <code>{escapeString(value)}</code> ({count}x)
                      </li>
                    ))}
                    {queryResult.labelCardinalities[ln] > 5 && <li>...</li>}
                  </ul>
                </Tooltip>
              )}
            >
              <div
                className="ast-node-label-stats"
                onClick={() => {
                  let queryNode: ASTNode = astNode;
                  if (queryNode.type === nodeType.matrixSelector) {
                    queryNode = {
                      type: nodeType.call,
                      func: functionSignatures['count_over_time'],
                      args: [astNode],
                    };
                  }
                  insertQuery(queryID + 1, `sort_desc(count by(${ln}) (${serializeNode(queryNode)}))`);
                }}
              >
                <span className="promql-code promql-label-name" style={{ color: 'green' }}>
                  {ln}
                </span>
                :{card}
              </div>
            </OverlayTrigger>
          )),
          ...(len > maxLabels ? [`...${len - maxLabels} more...`] : []),
        ];

        const nodeInfos: ReactNode[] = [
          // Number of results.
          settings.showNumResults && (
            <>
              {queryResult.numSeries} result{queryResult.numSeries !== 1 && 's'}
            </>
          ),

          // Evaluation time.
          settings.showEvalTime && <>{queryResult.queryTime}ms</>,

          // Label details.
          settings.showLabels && queryResult.numSeries > 0 && (
            <>
              {labelNames.length > 0 ? (
                labelNames.map((v, idx) => (
                  <React.Fragment key={idx}>
                    {idx !== 0 && ', '}
                    {v}
                  </React.Fragment>
                ))
              ) : (
                <>no labels</>
              )}
            </>
          ),
        ].filter((n) => n); // Don't include disabled / null results.

        if (nodeInfos.length === 0) {
          return null;
        }

        return (
          <span className="ast-node-stats">
            {nodeInfos.reduce((prev, curr) => [
              <React.Fragment key="prev">{prev}</React.Fragment>,
              <React.Fragment key="dash"> &ndash; </React.Fragment>,
              <React.Fragment key="curr">{curr}</React.Fragment>,
            ])}
          </span>
        );
    }
  };

  // Assemble node annotations (e.g. warnings) and quick action buttons.
  const [nodeWarnings, nodeActions] = getNodeAnnotations(
    astNode,
    parentASTNode,
    node.queryState.status === NodeQueryStatus.Success ? node.queryState.result : null
  );

  const innerNode = (
    <div className="ast-node-inner-wrapper" ref={dropRef}>
      {parentRef && <div className={`ast-connector ast-connector-${reverse ? 'down' : 'up'}`} style={connectorStyle} />}
      {
        <FaPlus
          className={`ast-connector-plus ast-connector-plus-${reverse ? 'down' : 'up'}`}
          title="Wrap in parent query"
          onClick={() => updateNode(queryID, nodeID, { type: nodeType.placeholder, children: [astNode] })}
        />
      }
      <div
        ref={setNodeRef}
        style={{
          opacity,
          backgroundColor:
            (isOver && !canDrop && '#f8d7da') ||
            (!isOver && canDrop && undefined) ||
            (isOver && canDrop && '#c3f1c3') ||
            undefined,
        }}
        className={`ast-node-inner${node.queryState.status === NodeQueryStatus.Error ? ' ast-node-inner-query-error' : ''}${
          node.node.type === nodeType.placeholder ? ' ast-node-inner-placeholder' : ''
        } ${editMode === NodeEditMode.Text ? 'ast-node-inner-editor-view' : 'ast-node-inner-tree-view'}`}
      >
        <div className="ast-node-inner-top">
          <div
            className="ast-node-inner-text"
            onClick={() => {
              if (selected) {
                deselectNode();
              } else {
                selectNode(queryID, nodeID);
              }
            }}
            onDoubleClick={
              editMode === NodeEditMode.Text ? undefined : () => setEditMode(queryID, nodeID, NodeEditMode.Text)
            }
          >
            {node.node.type === nodeType.placeholder ? (
              <>
                <span className="ast-placeholder">
                  {name}
                  {constraints.allowedValueTypes.length !== anyValueType.length &&
                    `: ${constraints.allowedValueTypes.map((vt) => humanizedValueType[vt]).join(' or ')}`}
                </span>
              </>
            ) : (
              formatNode(astNode, false, 1)
            )}
          </div>

          <Button
            className="ast-node-inner-action-btn"
            variant="outline-secondary"
            size="sm"
            title={editMode === NodeEditMode.Form ? 'Close form editor (Esc)' : 'Edit as form (E)'}
            onClick={() =>
              setEditMode(queryID, nodeID, editMode === NodeEditMode.Form ? NodeEditMode.None : NodeEditMode.Form)
            }
          >
            <span>{editMode === NodeEditMode.Form ? <FaTimes /> : <CgOptions />}</span> Form
          </Button>

          <Button
            className="ast-node-inner-action-btn"
            variant="outline-secondary"
            size="sm"
            title={editMode === NodeEditMode.Text ? 'Close inline PromQL editor (Esc)' : 'Edit PromQL inline (T)'}
            onClick={() =>
              setEditMode(queryID, nodeID, editMode === NodeEditMode.Text ? NodeEditMode.None : NodeEditMode.Text)
            }
          >
            <span>{editMode === NodeEditMode.Text ? <FaTimes /> : <AiFillEdit />}</span> PromQL
          </Button>

          {astNode.type === nodeType.call && canRemoveVarArg(astNode) && (
            <Button
              className="ast-node-inner-action-btn"
              variant="outline-secondary"
              size="sm"
              title="Remove variadic argument"
              onClick={() =>
                updateNode(queryID, nodeID, {
                  ...astNode,
                  args: [...astNode.args.slice(0, astNode.args.length - 1)],
                })
              }
              style={{ float: 'right' }}
            >
              <FaMinus />
              <FaChild />
            </Button>
          )}
          {astNode.type === nodeType.call && canAddVarArg(astNode) && (
            <Button
              className="ast-node-inner-action-btn"
              variant="outline-secondary"
              size="sm"
              title="Add variadic argument"
              onClick={() =>
                updateNode(queryID, nodeID, {
                  ...astNode,
                  args: [...astNode.args, { type: nodeType.placeholder, children: [] }],
                })
              }
              style={{ float: 'right' }}
            >
              <FaPlus />
              <FaChild />
            </Button>
          )}
        </div>

        {editMode === NodeEditMode.Form && (
          <ReactResizeDetector handleHeight onResize={onResize}>
            <div>
              <NodeEditor promAPI={promAPI} queryID={queryID} nodeID={nodeID} metricNames={metricNames} />
            </div>
          </ReactResizeDetector>
        )}
        {editMode === NodeEditMode.Text && (
          // The placeholder text doesn't affect the width of text input and can overflow, thus this minWidth is needed.
          <ReactResizeDetector handleHeight onResize={onResize}>
            <div style={{ minWidth: 400 }}>
              {/* TODO: Move expression editor out of ast-node-inner-text */}
              <ExpressionEditor
                pathPrefix={pathPrefix}
                initialExpr={astNode.type === nodeType.placeholder ? '' : serializeNode(astNode, 0, true)}
                initialTrigger={false}
                promAPI={promAPI}
                placeholder="Enter PromQL query (<Esc> to close)..."
                constraints={constraints}
                initialFocus
                insertTextRef={null}
                onChange={(expr: string, ast: ASTNode | null) => {
                  if (ast !== null) {
                    updateNode(queryID, nodeID, ast);
                  }
                }}
                onEscape={() => setEditMode(queryID, nodeID, NodeEditMode.None)}
              />
              {/* <div className="ast-node-num-series" style={{ textDecoration: 'none' }}>
            <strong>Enter:</strong> apply query, <strong>Ctrl+enter:</strong> apply and close,{' '}
            <strong>Shift+enter:</strong> newline, <strong>Esc:</strong> close inline editor.
          </div> */}
            </div>
          </ReactResizeDetector>
        )}
      </div>
      <div className="ast-node-infos">
        {settings.showHints && nodeWarnings.length > 0 && (
          <div className="ast-node-warnings">
            <OverlayTrigger
              popperConfig={{ strategy: 'fixed' }}
              placement="bottom"
              overlay={(props: any) => (
                <Tooltip id={`warning-tooltip`} {...props}>
                  {nodeWarnings.map((w, idx) => (
                    <React.Fragment key={idx}>{w}</React.Fragment>
                  ))}
                </Tooltip>
              )}
            >
              <AiOutlineWarning color="#e2a22e" />
            </OverlayTrigger>
          </div>
        )}
        {settings.showActions && nodeActions.length > 0 && (
          <div className="ast-node-actions">
            {nodeActions.map(({ title, description, newNode }, idx) => (
              <React.Fragment key={idx}>
                <OverlayTrigger
                  popperConfig={{ strategy: 'fixed' }}
                  placement="bottom"
                  overlay={(props: any) => (
                    <Tooltip id={`warning-tooltip`} {...props}>
                      {description}
                    </Tooltip>
                  )}
                >
                  <Button key={idx} variant="link" onClick={() => updateNode(queryID, nodeID, newNode)}>
                    {title}
                  </Button>
                </OverlayTrigger>
              </React.Fragment>
            ))}
          </div>
        )}
        {![nodeType.stringLiteral, nodeType.numberLiteral].includes(getNonParenNodeType(astNode)) &&
          node.node.type !== nodeType.placeholder && <div className="ast-node-query-info">{queryIndicator()}</div>}
      </div>
    </div>
  );

  if (editMode === NodeEditMode.Text) {
    return (
      <div {...outerNodeProps}>
        {/* <div style={{ marginLeft: 4, fontSize: '0.8em', color: 'rgb(146, 146, 146)' }}>
          Enter PromQL expression below (Enter: apply, Esc: switch to tree view).
        </div> */}
        {innerNode}
      </div>
    );
  }

  const renderChild = (idx: number, reverse = false) => (
    <ConnectedNodeContainer
      pathPrefix={pathPrefix}
      key={children[idx].id}
      parentRef={nodeRef}
      reverse={reverse}
      queryID={queryID}
      name={childDescription(astNode, idx)}
      constraints={{ allowedValueTypes: allowedChildValueTypes(astNode, idx) }}
      nodeID={children[idx].id}
      metricNames={metricNames}
      promAPI={promAPI}
      resizeGeneration={resizeGeneration}
      onResize={onResize}
    />
  );

  if (node.node.type === nodeType.binaryExpr) {
    return (
      <div {...outerNodeProps}>
        {renderChild(0, true)}
        {innerNode}
        {renderChild(1)}
      </div>
    );
  } else {
    return (
      <div {...outerNodeProps}>
        {innerNode}
        {children.map((child, idx) => renderChild(idx))}
      </div>
    );
  }
};

const mapStateToProps = (state: AppState, ownProps: NodeContainerOwnProps): NodeContainerStateProps => {
  const { queryID, nodeID } = ownProps;
  const node = state.queries[queryID].tree.nodes[nodeID];
  const children = node.childIDs.map((childID) => state.queries[queryID].tree.nodes[childID]);
  const cqs = children.map((c) => c.queryState.status);
  return {
    node: node,
    tree: state.queries[queryID].tree,
    parent: node.parentID === null ? null : state.queries[queryID].tree.nodes[node.parentID],
    children,
    childQueryStatus:
      node.editMode === NodeEditMode.Text
        ? NodeQueryStatus.Success
        : cqs.includes(NodeQueryStatus.NodeIncomplete)
        ? NodeQueryStatus.NodeIncomplete
        : cqs.includes(NodeQueryStatus.Error)
        ? NodeQueryStatus.Error
        : cqs.includes(NodeQueryStatus.Running)
        ? NodeQueryStatus.Running
        : NodeQueryStatus.Success,
    selected:
      state.selectedNodeID !== null && state.selectedNodeID.queryID === queryID && state.selectedNodeID.nodeID === nodeID,
  };
};

const ConnectedNodeContainer = connect<NodeContainerStateProps, NodeContainerDispatchProps, NodeContainerOwnProps, AppState>(
  mapStateToProps,
  actions
)(NodeContainer);
export default ConnectedNodeContainer;

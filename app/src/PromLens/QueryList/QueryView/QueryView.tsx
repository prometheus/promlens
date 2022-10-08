import React, { FC, useState, useRef } from 'react';
import NodeContainer from './NodeContainer';
import ASTNode from '../../../promql/ast';
import { connect } from 'react-redux';
import { QueryID, Query, Tree, AppState } from '../../../state/state';
import * as actions from '../../../state/actions';
import { FaTimes, FaRegMap } from 'react-icons/fa';
import ExpressionEditor from './ExpressionEditor/ExpressionEditor';
import serializeNode from '../../../promql/serialize';
import normalizeAST, { denormalizeAST } from '../../../state/normalizeAST';
import { Col, Row, Button } from 'react-bootstrap';
import { anyValueType } from '../../../promql/utils';
import { PromAPI } from '../../../promAPI/promAPI';
import { PathPrefixProps } from '../../../types/types';
import MetricsExplorer from './MetricsExplorer/MetricsExplorer';

interface QueryViewOwnProps {
  metricNames: string[];
  promAPI: PromAPI;
  initialTrigger: boolean;
  queryID: QueryID;
}

interface QueryViewStateProps {
  queries: Query[];
}

interface QueryViewDispatchProps {
  setExpr: (queryID: QueryID, expr: string) => void;
  setTree: (queryID: QueryID, tree: Tree) => void;
  deleteQuery: (queryID: QueryID) => void;
  setShowMetricsExplorer: (queryID: QueryID, show: boolean) => void;
}

// TODO: The node editor figures out allowed value types by looking at the parent. Should we do the same here?
// Should be consolidated somehow.
const rootConstraints = { allowedValueTypes: anyValueType };

const QueryView: FC<QueryViewOwnProps & QueryViewStateProps & QueryViewDispatchProps & PathPrefixProps> = ({
  pathPrefix,
  metricNames,
  promAPI,
  initialTrigger,
  queryID,
  queries,
  setExpr,
  setTree,
  deleteQuery,
  setShowMetricsExplorer,
}) => {
  const [resizeGeneration, setResizeGeneration] = useState<number>(0);
  const { expr, exprStale, tree, showMetricsExplorer } = queries[queryID];
  const insertTextRef = useRef<(text: string) => void>((text: string) => {
    return;
  });

  return (
    <>
      {queryID !== 0 && (
        <Row>
          <Col>
            <div
              style={{
                borderTop: '1px dashed rgba(52, 79, 113, 0.2)',
                width: '100%',
                marginTop: 15,
                marginBottom: 15,
                height: 2,
              }}
            ></div>
          </Col>
        </Row>
      )}
      <div className="query-top-bar">
        <ExpressionEditor
          pathPrefix={pathPrefix}
          initialExpr={expr}
          exprStale={exprStale}
          onSyncExpr={() => {
            setExpr(queryID, serializeNode(denormalizeAST(tree), 0, true));
          }}
          promAPI={promAPI}
          initialTrigger={initialTrigger}
          placeholder="Enter query or edit tree view below..."
          constraints={rootConstraints}
          initialFocus={queryID === queries.length - 1}
          insertTextRef={insertTextRef}
          onChange={(expr: string, ast: ASTNode | null) => {
            setExpr(queryID, expr);
            if (ast !== null) {
              setTree(queryID, normalizeAST(ast));
            }
          }}
        />
        <Button
          size="sm"
          title={showMetricsExplorer ? 'Close metrics explorer' : 'Open metrics explorer'}
          variant="light"
          onClick={() => {
            setShowMetricsExplorer(queryID, !showMetricsExplorer);
          }}
          className="query-top-bar-btn"
        >
          <FaRegMap />
        </Button>

        <Button
          size="sm"
          title="Remove query"
          variant="light"
          onClick={() => deleteQuery(queryID)}
          className="query-top-bar-btn"
        >
          <FaTimes />
        </Button>
      </div>
      {showMetricsExplorer && (
        <MetricsExplorer
          metricNames={metricNames}
          promAPI={promAPI}
          hide={() => {
            setShowMetricsExplorer(queryID, false);
          }}
          insertText={insertTextRef.current}
        />
      )}
      <Row>
        <Col>
          <NodeContainer
            pathPrefix={pathPrefix}
            queryID={queryID}
            nodeID={tree.rootID}
            name="start query:"
            constraints={rootConstraints}
            reverse={false}
            metricNames={metricNames}
            promAPI={promAPI}
            resizeGeneration={resizeGeneration}
            onResize={() => setResizeGeneration(resizeGeneration + 1)}
          />
        </Col>
      </Row>
    </>
  );
};

const mapStateToProps = (state: AppState): QueryViewStateProps => {
  return {
    queries: state.queries,
  };
};

export default connect<QueryViewStateProps, QueryViewDispatchProps, QueryViewOwnProps, AppState>(
  mapStateToProps,
  actions
)(QueryView);

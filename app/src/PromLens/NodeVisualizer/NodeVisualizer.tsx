import React, { FC } from 'react';
import ExplainView from './ExplainViews/ExplainView';
import ASTNode from '../../promql/ast';
import DataTable from './DataTable';
import { containsPlaceholders } from '../../promql/utils';
import GraphVisualizer from './GraphVisualizer';
import { Alert, Col, Tabs, Tab } from 'react-bootstrap';
import TimeInput from './TimeInput';
import GraphControls from './Graph/GraphControls';
import { connect } from 'react-redux';
import { AppState, NodeVisualizerState } from '../../state/state';
import * as actions from '../../state/actions';
import { PromAPI } from '../../promAPI/promAPI';

interface NodeVisualizerStateProps {
  state: NodeVisualizerState;
}

interface NodeVisualizerOwnProps {
  node: ASTNode | null;
  retriggerIndex: number;
  promAPI: PromAPI;
}

interface NodeVisualizerDispatchProps {
  setNodeVisualizerState: (state: NodeVisualizerState) => void;
}

const NodeVisualizer: FC<NodeVisualizerOwnProps & NodeVisualizerStateProps & NodeVisualizerDispatchProps> = ({
  state,
  node,
  retriggerIndex,
  promAPI,
  setNodeVisualizerState,
}) => {
  // const [activeTab, setActiveTab] = useState('table');

  // const [endTime, setEndTime] = useState<number | null>(null);
  // const [range, setRange] = useState<number>(3600 * 1000);
  // const [resolution, setResolution] = useState<number | null>(null);
  // const [stacked, setStacked] = useState<boolean>(false);

  const { activeTab, endTime, range, resolution, stacked } = state;

  const changeActiveTab = (tab: string) => {
    if (activeTab !== tab) {
      setNodeVisualizerState({ ...state, activeTab: tab as 'table' | 'graph' | 'explain' });
    }
  };

  const tabs = [
    {
      name: 'table',
      title: 'Table',
      content: node !== null && (
        <>
          <div className="table-controls">
            <TimeInput
              time={endTime}
              useLocalTime={false}
              range={range}
              placeholder="Evaluation time"
              onChangeTime={(endTime) => setNodeVisualizerState({ ...state, endTime })}
            />
          </div>
          <DataTable evalTime={endTime} node={node!} promAPI={promAPI} retriggerIndex={retriggerIndex} />
        </>
      ),
    },
    {
      name: 'graph',
      title: 'Graph',
      content: (
        <>
          <GraphControls
            range={range}
            endTime={endTime}
            useLocalTime={false}
            resolution={resolution}
            stacked={stacked}
            onChangeRange={(range) => setNodeVisualizerState({ ...state, range })}
            onChangeEndTime={(endTime) => setNodeVisualizerState({ ...state, endTime })}
            onChangeResolution={(resolution) => setNodeVisualizerState({ ...state, resolution })}
            onChangeStacking={(stacked) => setNodeVisualizerState({ ...state, stacked })}
          />
          <GraphVisualizer
            endTime={endTime}
            range={range}
            resolution={resolution}
            stacked={stacked}
            node={node!}
            promAPI={promAPI}
            retriggerIndex={retriggerIndex}
          />
        </>
      ),
    },
    {
      name: 'explain',
      title: 'Explain',
      content: <ExplainView node={node!} promAPI={promAPI} />,
    },
  ];

  return (
    <Col>
      <Tabs
        id="node-visualizer-tabs"
        activeKey={activeTab}
        onSelect={(name: string | null) => {
          if (name === null) {
            return;
          }
          changeActiveTab(name);
        }}
      >
        {tabs.map(({ name, title, content }) => (
          <Tab key={name} eventKey={name} title={title}>
            {activeTab === name && node !== null ? (
              containsPlaceholders(node) && name !== 'explain' ? (
                <Alert variant="light">
                  Selected query is incomplete. To visualize it, please fill out the placeholders.
                </Alert>
              ) : (
                content
              )
            ) : (
              <Alert variant="light">Select part of a query above to visualize it.</Alert>
            )}
          </Tab>
        ))}
      </Tabs>
    </Col>
  );
};

const mapStateToProps = (state: AppState, ownProps: NodeVisualizerOwnProps): NodeVisualizerStateProps => {
  return {
    state: state.nodeVisualizer,
  };
};

const ConnectedNodeVisualizer = connect<
  NodeVisualizerStateProps,
  NodeVisualizerDispatchProps,
  NodeVisualizerOwnProps,
  AppState
>(
  mapStateToProps,
  actions
)(NodeVisualizer);
export default ConnectedNodeVisualizer;

import React, { FC, useState, useMemo } from 'react';

import ASTNode from '../promql/ast';
import QueryList from './QueryList/QueryList';
import NodeVisualizer from './NodeVisualizer/NodeVisualizer';
import { denormalizeAST } from '../state/normalizeAST';
import { connect } from 'react-redux';
import { AppState, ServerSettings } from '../state/state';
import ServerOptionsEditor from './ServerOptionsEditor';
import { Row, Col, Alert, Button, Toast } from 'react-bootstrap';
import LinkSharer from './LinkSharer/LinkSharer';
import { GrafanaDataSourceSettings, PathPrefixProps } from '../types/types';
import { PromAPI } from '../promAPI/promAPI';
import { FaCog } from 'react-icons/fa';
import SettingsEditor, { SettingsContext, Settings } from './SettingsEditor';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PromLensUIStateProps {
  serverSettings: ServerSettings;
  selectedNode: ASTNode | null;
  retriggerIndex: number;
}

interface PromLensUIOwnProps {
  datasources: GrafanaDataSourceSettings[];
  initialTrigger: boolean;
}

const PromLens: FC<PromLensUIStateProps & PromLensUIOwnProps & PathPrefixProps> = ({
  pathPrefix,
  serverSettings,
  datasources,
  selectedNode,
  initialTrigger,
  retriggerIndex,
}) => {
  // Construct Prometheus API client from datasources list and selected server settings.
  const promAPI = useMemo<PromAPI>(() => new PromAPI(serverSettings, pathPrefix), [serverSettings, pathPrefix]);
  const [showExamplePageLink, setShowExamplePageLink] = useLocalStorage<boolean>('promlens.show-example-page-link', true);

  const metricNamesQuery = promAPI.useFetchAPI<string[]>(`/api/v1/label/__name__/values`);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<Settings>({
    showNumResults: true,
    showEvalTime: true,
    showLabels: true,
    showHints: true,
    showActions: true,
    enableHighlighting: true,
    enableAutocomplete: true,
    enableLinter: true,
  });

  return (
    <SettingsContext.Provider value={settings}>
      <Row className="server-settings" noGutters>
        <Col>
          <div>
            <ServerOptionsEditor datasources={datasources} pathPrefix={pathPrefix} />
          </div>
        </Col>
        <Col xs="auto">
          <Button className="ml-2" variant="light" title="Settings" onClick={() => setShowSettings(!showSettings)}>
            <FaCog />
          </Button>

          <LinkSharer pathPrefix={pathPrefix} />
          <div className="ml-2 show-hotkeys">Show hotkeys: ?</div>
        </Col>
      </Row>
      <SettingsEditor shown={showSettings} onChange={setSettings} hide={() => setShowSettings(false)} />
      <Row className="top-alerts">
        <Col>
          {metricNamesQuery.error !== undefined && (
            <Alert variant="warning">
              <strong>Warning:</strong> Couldn't fetch metric names from server: {metricNamesQuery.error.message}
            </Alert>
          )}
          {metricNamesQuery.loading && <Alert variant="secondary">Loading metric names...</Alert>}
        </Col>
      </Row>
      <Toast
        style={{ marginTop: 15, marginBottom: 0, borderRadius: 0, maxWidth: 500 }}
        show={showExamplePageLink}
        onClose={() => setShowExamplePageLink(false)}
      >
        <Toast.Header>
          <strong className="mr-auto">First time here?</strong>
        </Toast.Header>
        <Toast.Body>
          Check out an <a href="/?example">example page</a> with multiple queries or take a{' '}
          <a href="https://promlens.com/">feature tour</a>.
        </Toast.Body>
      </Toast>
      <Row>
        <QueryList
          pathPrefix={pathPrefix}
          metricNames={metricNamesQuery.data || []}
          promAPI={promAPI}
          initialTrigger={initialTrigger}
        />
      </Row>
      <Row className="node-visualizer-wrapper">
        <NodeVisualizer node={selectedNode} retriggerIndex={retriggerIndex} promAPI={promAPI} />
      </Row>
    </SettingsContext.Provider>
  );
};

const mapStateToProps = (state: AppState): PromLensUIStateProps => {
  return {
    serverSettings: state.serverSettings,
    retriggerIndex: state.selectedNodeID === null ? 0 : state.queries[state.selectedNodeID.queryID].tree.rootID,
    selectedNode:
      state.selectedNodeID === null
        ? null
        : denormalizeAST(state.queries[state.selectedNodeID.queryID].tree, state.selectedNodeID.nodeID),
  };
};
const ConnectedPromLensUI = connect<PromLensUIStateProps, unknown, unknown, AppState>(mapStateToProps)(PromLens);

export default ConnectedPromLensUI;

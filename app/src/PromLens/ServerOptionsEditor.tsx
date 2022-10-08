import React, { FC, useState, useEffect, useMemo } from 'react';

import { FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';
import { connect } from 'react-redux';
import * as actions from '../state/actions';
import { AppState, ServerSettings } from '../state/state';
import { Form, InputGroup, Alert, FormControl } from 'react-bootstrap';
import { GrafanaDataSourceSettings, PathPrefixProps } from '../types/types';
import { PromAPI } from '../promAPI/promAPI';
import { grafanaDatasourceToServerSettings } from '../state/utils';
import { QueryResult } from './QueryList/QueryView/QueryResultTypes';

interface ServerOptionsEditorStateProps {
  serverSettings: ServerSettings;
}

interface ServerOptionsEditorOwnProps {
  datasources: GrafanaDataSourceSettings[];
}

interface ServerOptionsEditorDispatchProps {
  setServerSettings: (settings: ServerSettings) => void;
}

const ServerOptionsEditor: FC<
  ServerOptionsEditorStateProps & ServerOptionsEditorOwnProps & ServerOptionsEditorDispatchProps & PathPrefixProps
> = ({ serverSettings, datasources, setServerSettings, pathPrefix }) => {
  const [inputURL, setInputURL] = useState(serverSettings.url);

  // Server settings go from:
  //   Input field => Health check (tentative) => Apply globally.
  const [tentativeServerSettings, setTentativeServerSettings] = useState(serverSettings);

  const healthCheckPromAPI = useMemo(() => new PromAPI(tentativeServerSettings, pathPrefix), [tentativeServerSettings]);
  const healthQuery = healthCheckPromAPI.useFetchAPI<QueryResult>(`/api/v1/query?query=1`);

  const applyURL = (url: string) => {
    // Only apply URL when it has changed, or when we are switching away from a pre-defined datasource
    // (with potentially same URL, but different settings).
    if (url !== tentativeServerSettings.url || tentativeServerSettings.datasourceID !== null) {
      setTentativeServerSettings({
        url: url.replace(/\/$/, ''),
        access: 'direct',
        datasourceID: null,
        withCredentials: false,
      });
    }
  };

  useEffect(() => {
    setInputURL(serverSettings.url);
    setTentativeServerSettings(serverSettings);
  }, [serverSettings]);

  useEffect(() => {
    if (!healthQuery.loading && healthQuery.data !== undefined) {
      setServerSettings(tentativeServerSettings);
    }
    // TODO: Deps check disabled because depending on tentativeServerSettings would trigger
    // two updates. Solve this more cleanly.
    //
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthQuery.data, healthQuery.loading]);

  const grafanaDatasourceSelector = (
    <Form.Control
      as="select"
      id="select-server"
      // TODO: If someone has a saved datasource ID, we need to check if it still exists.
      value={tentativeServerSettings.datasourceID !== null ? tentativeServerSettings.datasourceID.toString() : 'manual'}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.currentTarget.value === 'manual') {
          setTentativeServerSettings({
            ...tentativeServerSettings,
            access: 'direct',
            datasourceID: null,
          });
        } else {
          const ds = datasources.find((ds) => ds.id === parseInt(e.currentTarget.value));
          if (ds === undefined) {
            throw new Error(`Could not look up Grafana datasource with id ${e.currentTarget.value}`);
          }

          setTentativeServerSettings(grafanaDatasourceToServerSettings(ds));
        }
      }}
      style={{ borderRadius: 0, width: 'auto' }}
    >
      <option key="manual" value="manual">
        Manual server entry
      </option>
      <option disabled>--- Datasources from Grafana ---</option>
      {datasources.map(({ name, id }) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </Form.Control>
  );

  return (
    <Form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        applyURL(inputURL);
      }}
    >
      <InputGroup>
        <InputGroup.Prepend
          title={
            healthQuery.error
              ? healthQuery.error.message
              : healthQuery.data
              ? 'Server validated successfully'
              : 'Validating server'
          }
        >
          <InputGroup.Text style={{ backgroundColor: 'white', borderRight: 0, borderRadius: 0 }}>
            {healthQuery.loading && <FaSpinner className="icon-spin" />}
            {healthQuery.data && <FaCheck color="green" />}
            {healthQuery.error && <FaTimes color="red" />}
          </InputGroup.Text>
        </InputGroup.Prepend>
        {tentativeServerSettings.datasourceID === null && (
          <FormControl
            placeholder="Enter Prometheus server URL or append ?s=<url> to the page URL"
            value={inputURL}
            onBlur={() => applyURL(inputURL)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputURL(e.currentTarget.value)}
            style={{ borderColor: 'rgba(52, 79, 113, 0.2)', borderRadius: 0 }}
          />
        )}
        {datasources.length > 0 &&
          (tentativeServerSettings.datasourceID === null ? (
            <InputGroup.Append>{grafanaDatasourceSelector}</InputGroup.Append>
          ) : (
            <>{grafanaDatasourceSelector}</>
          ))}
      </InputGroup>

      {healthQuery.error && (
        /* TODO: parse-error class now used in multiple places where it's not about parse errors, fix this. */
        <Alert variant="danger" className="parse-error">
          <strong>Error validating server health:</strong> {healthQuery.error.message}
        </Alert>
      )}

      {(() => {
        const ds = datasources.find((ds) => ds.id === tentativeServerSettings.datasourceID);
        if (ds === undefined || ds.access === 'proxy') {
          return null;
        }

        return (
          <>
            {ds.basicAuth && (
              <Alert variant="warning" className="parse-error">
                <strong>Warning:</strong> This Grafana datasource uses basic authentication in combination with direct
                browser-based access. This is not yet supported in PromLens (Grafana does not supply the required credentials
                via its API). However, your browser may still prompt you to enter credentials manually.
              </Alert>
            )}

            {ds.jsonData && ds.jsonData.hasOwnProperty('httpHeaderName1') && (
              <Alert variant="warning" className="parse-error">
                <strong>Warning:</strong> This Grafana datasource uses custom headers in combination with direct
                browser-based access. This is not yet supported in PromLens (Grafana does not supply the required header
                information via its API). Disabling custom headers for this datasource.
              </Alert>
            )}
          </>
        );
      })()}
    </Form>
  );
};

const mapStateToProps = (state: AppState): ServerOptionsEditorStateProps => {
  return {
    serverSettings: state.serverSettings,
  };
};

const ConnectedServerOptionsEditor = connect<
  ServerOptionsEditorStateProps,
  ServerOptionsEditorDispatchProps,
  unknown,
  AppState
>(
  mapStateToProps,
  actions
)(ServerOptionsEditor);

export default ConnectedServerOptionsEditor;

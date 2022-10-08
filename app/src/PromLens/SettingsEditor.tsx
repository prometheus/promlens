import React, { FC, useEffect } from 'react';

import { Button, Collapse, Form, Card, Row, Col } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface Settings {
  showNumResults: boolean;
  showEvalTime: boolean;
  showLabels: boolean;
  showHints: boolean;
  showActions: boolean;
  enableHighlighting: boolean;
  enableAutocomplete: boolean;
  enableLinter: boolean;
}

export const SettingsContext = React.createContext<Settings>({
  showNumResults: true,
  showEvalTime: true,
  showLabels: true,
  showHints: true,
  showActions: true,
  enableHighlighting: true,
  enableAutocomplete: true,
  enableLinter: true,
});

export interface SettingsEditorProps {
  shown: boolean;
  onChange: (settings: Settings) => void;
  hide: () => void;
}

const SettingsEditor: FC<SettingsEditorProps> = ({ onChange, shown, hide }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('promlens.settings', {
    showNumResults: true,
    showEvalTime: true,
    showLabels: true,
    showHints: true,
    showActions: true,
    enableHighlighting: true,
    enableAutocomplete: true,
    enableLinter: true,
  });

  // The three editor flags were introduced together. If one of them is missing in the
  // local storage settings object, all of them will be missing. Default them all to true.
  if (settings.enableAutocomplete === undefined) {
    setSettings({
      ...settings,
      enableHighlighting: true,
      enableAutocomplete: true,
      enableLinter: true,
    });
  }

  // These two settings were introduced together. If one of them is missing in the
  // local storage settings object, all of them will be missing. Default them all to true.
  if (settings.showHints === undefined) {
    setSettings({
      ...settings,
      showHints: true,
      showActions: true,
    });
  }

  useEffect(() => {
    onChange(settings);
  }, [settings, onChange]);

  // TODO: Add node evaluation options:
  //   - manual eval
  //   - eval time
  //   - use local time
  //   - timeout
  return (
    <Collapse in={shown}>
      <Card style={{ width: '100%', borderRadius: 0 }} className="promlens-settings">
        <Card.Header>
          Settings
          <Button variant="light" size="sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={hide}>
            <FaTimes />
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col>
              <Form.Group controlId="display-per-node" style={{ marginBottom: 0 }}>
                <Form.Label>Text editor options:</Form.Label>
                <Form.Check
                  custom
                  type="checkbox"
                  id="enable-highlighting"
                  label="Enable highlighting"
                  checked={settings.enableHighlighting}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, enableHighlighting: e.target.checked })
                  }
                />
                <Form.Check
                  custom
                  type="checkbox"
                  id="enable-autocomplete"
                  label="Enable autocomplete"
                  checked={settings.enableAutocomplete}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, enableAutocomplete: e.target.checked })
                  }
                />
                <Form.Check
                  custom
                  type="checkbox"
                  id="enable-linter"
                  label="Enable linter"
                  checked={settings.enableLinter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, enableLinter: e.target.checked })
                  }
                />
              </Form.Group>
            </Col>

            <Col>
              <Form.Group controlId="display-per-node" style={{ marginBottom: 0 }}>
                <Form.Label>Tree node display options:</Form.Label>
                <Form.Check
                  custom
                  type="checkbox"
                  id="show-num-results"
                  label="Show number of results"
                  checked={settings.showNumResults}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, showNumResults: e.target.checked })
                  }
                />
                <Form.Check
                  custom
                  type="checkbox"
                  id="show-eval-time"
                  label="Show evaluation time"
                  checked={settings.showEvalTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, showEvalTime: e.target.checked })
                  }
                />
                <Form.Check
                  custom
                  type="checkbox"
                  id="show-labels"
                  label="Show labels"
                  checked={settings.showLabels}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, showLabels: e.target.checked })
                  }
                />
                <Form.Check
                  custom
                  type="checkbox"
                  id="show-hints"
                  label="Show query hints"
                  checked={settings.showHints}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, showHints: e.target.checked })
                  }
                />
                <Form.Check
                  custom
                  type="checkbox"
                  id="show-actions"
                  label="Show action buttons"
                  checked={settings.showActions}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, showActions: e.target.checked })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Collapse>
  );
};

export default SettingsEditor;

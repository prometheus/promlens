import React, { FC, useState, useEffect, useRef } from 'react';

import { FaSpinner, FaShareAlt } from 'react-icons/fa';
import { connect } from 'react-redux';
import * as actions from '../../state/actions';
import { AppState } from '../../state/state';
import { FormControl, Button, Popover, Overlay } from 'react-bootstrap';
import { exportState } from '../../state/reducers';
import { PathPrefixProps } from '../../types/types';

interface LinkSharerStateProps {
  state: AppState;
}

const LinkSharer: FC<LinkSharerStateProps & PathPrefixProps> = ({ state, pathPrefix }) => {
  const shareButtonRef = useRef<React.ReactNode>(null);

  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [createShareLinkError, setCreateShareLinkError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // TODO: Abort running requests etc.
  const resetShareState = () => {
    setCreatingShareLink(false);
    setCreateShareLinkError(null);
    setShareLink(null);
  };

  const createShareLink = () => {
    if (creatingShareLink) {
      return;
    }

    resetShareState();
    setCreatingShareLink(true);

    let statusCode = 0;
    let statusText = '';
    fetch(`${pathPrefix}/api/link`, { method: 'post', body: JSON.stringify(exportState(state)) })
      .then((res) => {
        statusCode = res.status;
        statusText = res.statusText;
        return res;
      })
      .then((res) => res.text())
      .then((res) => {
        if (statusCode !== 200) {
          throw new Error(`${statusText}${res !== '' ? `: ${res}` : ''}`);
        }

        window.history.pushState({}, '', `?l=${res}`);
        setShareLink(window.location.toString());
      })
      .catch((err) => setCreateShareLinkError(err.message))
      .finally(() => setCreatingShareLink(false));
  };

  useEffect(() => {
    setShareLink(null);
  }, [state]);

  return (
    <>
      <Button ref={shareButtonRef as any} className="ml-2" variant="light" onClick={createShareLink} title="Share page">
        <FaShareAlt />
      </Button>
      <Overlay
        target={shareButtonRef.current as any}
        show={createShareLinkError !== null || shareLink !== null || creatingShareLink}
        placement="bottom"
        rootClose
        onHide={resetShareState}
      >
        <Popover id="share-popover">
          {createShareLinkError && (
            <>
              <Popover.Title>Error creating shareable link:</Popover.Title>
              <Popover.Content>{createShareLinkError}</Popover.Content>
            </>
          )}
          {shareLink && (
            <>
              <Popover.Title>Shareable link:</Popover.Title>
              <Popover.Content>
                <FormControl
                  value={shareLink}
                  readOnly
                  onFocus={(e: any) => {
                    e.target.select();
                    document.execCommand('copy');
                  }}
                  autoFocus
                />
              </Popover.Content>
            </>
          )}
          {creatingShareLink && (
            <>
              <Popover.Title>Creating shareable link:</Popover.Title>
              <Popover.Content style={{ textAlign: 'center' }}>
                <FaSpinner className="icon-spin" />
              </Popover.Content>
            </>
          )}
        </Popover>
      </Overlay>
    </>
  );
};

const mapStateToProps = (state: AppState): LinkSharerStateProps => {
  return {
    state,
  };
};

const ConnectedLinkSharer = connect<LinkSharerStateProps, unknown, unknown, AppState>(mapStateToProps, actions)(LinkSharer);

export default ConnectedLinkSharer;

import React, { FC, useMemo } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getUniqueID } from '../../../../utils/utils';

interface HelpProps {
  text: string;
}

export const Help: FC<HelpProps> = ({ text }) => {
  const id = useMemo<number>(getUniqueID, []);

  return (
    <OverlayTrigger
      popperConfig={{ strategy: 'fixed' }}
      overlay={(props: any) => (
        <Tooltip id={`tooltip-${id}`} popper {...props}>
          {text}
        </Tooltip>
      )}
    >
      <FaQuestionCircle color="#6c757d" style={{ float: 'right' }} />
    </OverlayTrigger>
  );
};

import React, { FC } from 'react';

import TopNav from './TopNav';
import PromLens from './pages/PromLens';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PathPrefixProps } from './types/types';

const App: FC<PathPrefixProps> = ({ pathPrefix }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TopNav pathPrefix={pathPrefix} />
      {/* Without primary={false}, the page doesn't scroll to the top upon page change.
        See https://github.com/reach/router/issues/242#issuecomment-467082358 */}
      <PromLens pathPrefix={pathPrefix} />
    </DndProvider>
  );
};

export default App;

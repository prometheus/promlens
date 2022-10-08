import './globals';
import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './fonts/codicon.ttf';
import './fonts/DejaVuSansMono-webfont.woff';
import './index.css';
import App from './App';

// Declared/defined in public/index.html, value replaced by Prometheus when serving bundle.
declare const GLOBAL_PATH_PREFIX: string;

let prefix = GLOBAL_PATH_PREFIX;

if (GLOBAL_PATH_PREFIX === 'PATH_PREFIX_PLACEHOLDER' || GLOBAL_PATH_PREFIX === '/' || GLOBAL_PATH_PREFIX === undefined) {
  // Either we are running the app outside of PromLens, so the placeholder value in
  // the index.html didn't get replaced, or we have a '/' prefix, which we also need to
  // normalize to '' to make concatenations work (prefixes like '/foo/bar/' already get
  // their trailing slash stripped by Prometheus).
  prefix = '';
}

ReactDOM.render(<App pathPrefix={prefix} />, document.getElementById('root'));

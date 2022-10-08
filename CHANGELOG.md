## 1.1.0 / 2021-12-21

* [FEATURE]: Added new `--grafana.default-datasource-id` command-line flag to override Grafana's default datasource.
* [FEATURE]: Update PromQL features to those in Prometheus 2.32. This adds support for `present_over_time()` and trigonometric functions.
* [FEATURE]: Docker images are now available not only for `linux/amd64`, but also for the `linux/arm/v7` and `linux/arm64` architectures.
* [ENHANCEMENT]: Updated function documentations from upstream Prometheus project.
* [ENHANCEMENT]: When trying to graph a range vector selector (which cannot be directly graphed), PromLens now helpfully graphs the equivalent instant vector selector instead of showing an error.
* [ENHANCEMENT]: Added support for Prometheus versions <2.6.0 as data sources by switching the server health check endpoint from `/api/v1/labels` (which was only introduced in Prometheus 2.6.0) to the always-available `/api/v1/query?query=1`.

## 1.0.0 / 2021-05-26

* [FEATURE]: Added new labels explorer within the metrics explorer that allows inspecting and filtering down on a metric name's labels.
* [FEATURE]: PromQL: Added support for new functions `last_over_time()`, `sgn()`, and `clamp()`, that were added in Prometheus 2.26.0.
* [FEATURE]: PromQL: Added support for experimental negative offsets that were added in Prometheus 2.26.0.
* [FEATURE]: PromQL: Added support for experimental `@` modifier that was added in Prometheus 2.25.0.
* [ENHANCEMENT]: Updated the `codemirror-promql` dependency that powers the PromQL text editor from 0.11.0 to 0.16.0, yielding better autocompletion, more language features, and minor fixes. See https://github.com/prometheus-community/codemirror-promql/releases for details.
* [ENHANCEMENT]: Updated various frontend and backend dependency versions.
* [CLEANUP]: Removed loading of an unneeded external script in the self-hosted version of PromLens.

## 0.11.1 / 2021-01-22

* [BUGFIX]: Correctly show query error messages underneath the query field, not next to it.

## 0.11.0 / 2020-12-15

**Breaking Change:** When upgrading using an existing SQLite3 database to store shared links, you need to manually update the schema of the `views` table to the following (the `ON DELETE CASCADE` is new):

```sql
CREATE TABLE view(
  id INT AUTO_INCREMENT PRIMARY KEY,
  link_id INTEGER,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(link_id) REFERENCES link(id) ON DELETE CASCADE
)
```

You may also simply delete the `views` table to have PromLens recreate it for you.

* [FEATURE]: Tree nodes are now annotated with warning hints for query constructs that are likely erroneous or unintended (e.g. using `rate()` on a gauge metric). Hovering over the hint shows details. Showing of hints is configurable in the global settings menu.
* [FEATURE]: There are now more quick action buttons on tree nodes for common query actions, and hovering over an action button explains the action in more detail.
* [FEATURE]: When hovering over a label name in the tree view, a popup now shows the top 5 label values by occurrence count.
* [FEATURE]: When clicking on a label name in the tree view, a query is inserted that shows all values for that label, sorted by their number of occurrences in the respective original expression.
* [FEATURE]: For SQL-based link-sharing databases, a new `--shared-links.sql.retention` flag allows setting a maximum retention time. A periodic cleanup loop deletes any links older than the configured retention time.
* [ENHANCEMENT]: The first query on the page can now also be removed / cleared.
* [ENHANCEMENT]: A new "Enter" icon at the end of the expression input indicates how to execute the expression and shows further information on hover.
* [ENHANCEMENT]: An improved error message is shown when trying to use a HTTP-based datasource URL while PromLens is being served via HTTPS.
* [ENHANCEMENT]: Minor style cleanups.
* [ENHANCEMENT]: The `bool` keyword is now autocompleted (part of https://github.com/prometheus-community/codemirror-promql/releases/tag/0.11.0).
* [ENHANCEMENT]: The autocompletion now uses an LRU cache to limit the amount of cached items (part of https://github.com/prometheus-community/codemirror-promql/releases/tag/0.11.0).
* [BUGFIX]: Fixed a visual glitch in the graph mouse hover detail popup.
* [BUGFIX]: Switching to the "Explain" tab for vector-to-vector binary operators that were created using the form-based editor works now and no longer causes an error.

## 0.10.0 / 2020-10-19

* [FEATURE]: In autocomplete, show the metric type and docstring for every metric (provided the datasource can provide them).
* [FEATURE]: In autocomplete, show help strings for functions, keywords, aggregators, etc..
* [FEATURE]: Add new metrics explorer, which allows showing and filtering all metric names, showing their type and docstring, and inserting/copying metric names.
* [FEATURE]: Add new `q` URL query parameter which allows supplying an initial query, e.g. `?q=up`. This can be used to generate direct links to queries without having to persist a shared page link.
* [FEATURE]: Show an alert to first-time visitors with an option to view an example query page. Dismissal of the alert is saved in local storage.
* [FEATURE]: Allow enabling/disabling the text editor's syntax highlighting, autocompletion, and linting features, from the global settings menu.
* [ENHANCEMENT]: Speed up autocompleting of label names and values on metrics with many series.
* [ENHANCEMENT]: Clean up the textual PromQL representation of nodes in the tree view to omit child indicators rather than rendering them as an ellipsis (…).
* [ENHANCEMENT]: Make the tree node edit buttons clearer by adding textual labels.
* [ENHANCEMENT]: Always display tree node edit buttons on placeholder nodes, not just when hovering over the node.
* [ENHANCEMENT]: Improve styling minorly throughout the app.
* [ENHANCEMENT]: Include correct monospace font in app, so that monospace code looks the same everywhere.
* [ENHANCEMENT]: Autocomplete more PromQL grammatical cases and do so more correctly.
* [ENHANCEMENT]: Generally improved editor and autocomplete styling consistency across browsers.
* [ENHANCEMENT]: Autocomplete dropdowns now don't get cut off at the bottom when the height of the current query view is too short to contain the full dropdown.

## 0.9.1 / 2020-09-08

* [BUGFIX]: Pull in changes from latest `codemirror-promql` package that make snippet placeholder texts syntactically problematic for PromQL (by not including `<` and `>` around the placeholder text). Besides avoiding extraneous linter errors, this avoids a JavaScript error in the CodeMirror Next linter which could happen during autocomplete in a broken expression, and which still needs to be tracked down upstream.

## 0.9.0 / 2020-09-07

* [FEATURE]: The Monaco-based PromQL text editor has been completely replaced with a CodeMirror-Next-based one. This introduces a full parser system that allows for **contextual autocompletion of metric names, label names/values, function names, operators, and other keywords**. It also introduces an **offline linter, showing many common PromQL errors** directly in the text input field.
* [FEATURE]: Show query time for each tree node.
* [FEATURE]: Add global settings menu to customize the per-node information display (query evaluation time, number of results, and labels).
* [FEATURE]: Show metric `HELP` and `TYPE` metadata in the "Explain" tab for vector selectors.
* [FEATURE]: Add support for the new human-friendly duration syntax (e.g. `1h30m`) introduced in Prometheus 2.21.0 (see https://github.com/prometheus/prometheus/pull/7713 and https://github.com/prometheus/prometheus/pull/7833).
* [FEATURE]: Add support for the new `group()` aggregator introduced in Prometheus 2.20.0 (see https://github.com/prometheus/prometheus/pull/7480).
* [ENHANCEMENT]: Don't show a quick action button to add `sum()` around nodes that only return one time series.
* [ENHANCEMENT]: Update function documentations from upstream Prometheus project.
* [ENHANCEMENT]: Improve alignment and rendering of quick action buttons.
* [BUGFIX]: Use correct back/forward skip duration for the instant query timestamp selector.
* [BUGFIX]: Fix bug in applying URL-supplied Prometheus server settings when there is also a default Grafana datasource.
* [BUGFIX]: Don't display a license error when the page configuration cannot be loaded.
* [MISC]: Updated PromLens logo, dropped the "Preview" text.

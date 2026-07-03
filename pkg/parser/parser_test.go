// Copyright The Prometheus Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package parser

import (
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func parseQuery(t *testing.T, expr string) (int, string) {
	t.Helper()
	req := httptest.NewRequest("POST", "/parse", strings.NewReader(url.Values{"expr": {expr}}.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	w := httptest.NewRecorder()
	Handle(w, req)
	return w.Code, w.Body.String()
}

func TestHandle(t *testing.T) {
	tests := []struct {
		expr string
		// contains is a list of substrings that must appear in the JSON output.
		contains []string
	}{
		{
			expr:     `rate(demo_cpu_usage_seconds_total[5m])`,
			contains: []string{`"type":"matrixSelector"`, `"range":300000`},
		},
		// UTF-8 metric and label names end up as matchers, not as the name.
		{
			expr:     `{"metric.with.dots", "label with spaces"="value"}`,
			contains: []string{`{"name":"__name__","type":"=","value":"metric.with.dots"}`, `{"name":"label with spaces","type":"=","value":"value"}`},
		},
		// Experimental functions.
		{
			expr:     `info(rate(http_request_counter_total{cluster="us-east"}[2m]))`,
			contains: []string{`"name":"info"`},
		},
		{
			expr:     `sort_by_label(node_uname_info, "instance")`,
			contains: []string{`"name":"sort_by_label"`},
		},
		{
			expr:     `histogram_avg(rate(http_request_duration_seconds[5m]))`,
			contains: []string{`"name":"histogram_avg"`},
		},
		{
			expr:     `double_exponential_smoothing(demo_cpu[5m], 0.5, 0.5)`,
			contains: []string{`"name":"double_exponential_smoothing"`},
		},
		// Extended range selectors.
		{
			expr:     `rate(demo_cpu[5m] anchored)`,
			contains: []string{`"anchored":true`},
		},
		{
			expr:     `increase(demo_cpu[5m] smoothed)`,
			contains: []string{`"smoothed":true`},
		},
		// Duration expressions.
		{
			expr:     `rate(demo_cpu[step() * 4])`,
			contains: []string{`"rangeExpr":"step() * 4"`},
		},
		{
			expr:     `demo_cpu offset (5m * 2)`,
			contains: []string{`"offsetExpr":"(5m * 2)"`},
		},
		{
			expr:     `max_over_time(demo_cpu[max_of(1h, range()):step() / 2])`,
			contains: []string{`"rangeExpr":"max_of(1h, range())"`, `"stepExpr":"step() / 2"`},
		},
	}

	for _, test := range tests {
		code, body := parseQuery(t, test.expr)
		if code != 200 {
			t.Errorf("%s: got status %d: %s", test.expr, code, body)
			continue
		}
		for _, want := range test.contains {
			if !strings.Contains(body, want) {
				t.Errorf("%s: output does not contain %q: %s", test.expr, want, body)
			}
		}
	}
}

func TestHandleError(t *testing.T) {
	code, body := parseQuery(t, `rate(demo_cpu[5m)`)
	if code != 400 {
		t.Errorf("expected status 400 for invalid query, got %d: %s", code, body)
	}
}

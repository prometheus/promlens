// Copyright 2022 The Prometheus Authors
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

package grafana

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"golang.org/x/net/context"
)

type Backend struct {
	proxy     *httputil.ReverseProxy
	url       string
	authToken string
}

type DatasourceSettings struct {
	ID                int64                  `json:"id"`
	OrgID             int64                  `json:"orgID"`
	Name              string                 `json:"name"`
	Type              string                 `json:"type"`
	Access            string                 `json:"access"`
	URL               string                 `json:"url"`
	Password          string                 `json:"password"`
	User              string                 `json:"user"`
	BasicAuth         bool                   `json:"basicAuth"`
	BasicAuthUser     string                 `json:"basicAuthUser,omitempty"`
	BasicAuthPassword string                 `json:"basicAuthPassword,omitempty"`
	WithCredentials   bool                   `json:"withCredentials,omitempty"`
	IsDefault         bool                   `json:"isDefault"`
	JSONData          map[string]interface{} `json:"jsonData"`
}

var (
	datasourceLookups = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "promlens_grafana_datasource_lookups_total",
		Help: "The total number of requests to Grafana to look up all datasources.",
	})
	datasourceLookupErrors = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "promlens_grafana_datasource_lookup_errors_total",
		Help: "The total number of errors while looking up the Grafana datasources.",
	})
)

func init() {
	prometheus.MustRegister(datasourceLookups, datasourceLookupErrors)
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}

func NewBackend(grafanaURL string, authToken string) (*Backend, error) {
	target, err := url.Parse(grafanaURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Grafana URL: %w", err)
	}

	return &Backend{
		proxy: &httputil.ReverseProxy{
			Director: func(req *http.Request) {
				req.URL.Scheme = target.Scheme
				req.URL.Host = target.Host
				req.Host = target.Host
				req.URL.Path = singleJoiningSlash(target.Path, strings.TrimPrefix(req.URL.Path, "/api/grafana/"))
				log.Printf("Proxying to Grafana at %s...", req.URL.Path)
				req.Header.Set("Authorization", "Bearer "+authToken)
				if _, ok := req.Header["User-Agent"]; !ok {
					// explicitly disable User-Agent so it's not set to default value
					req.Header.Set("User-Agent", "")
				}
			},
		},
		url:       grafanaURL,
		authToken: authToken,
	}, nil
}

func (b *Backend) GetDatasources() (dsSettings []DatasourceSettings, err error) {
	datasourceLookups.Inc()
	defer func() {
		if err != nil {
			datasourceLookupErrors.Inc()
		}
	}()

	// TODO: Make timeout configurable.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, "GET", singleJoiningSlash(b.url, "/api/datasources"), nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+b.authToken)

	c := &http.Client{}
	resp, err := c.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error fetching datasources: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("bad response status: %v", resp.Status)
	}

	var ds []DatasourceSettings
	if err = json.NewDecoder(resp.Body).Decode(&ds); err != nil {
		return nil, fmt.Errorf("error unmarshaling datasources: %w", err)
	}

	promDS := make([]DatasourceSettings, 0, len(ds))
	for _, s := range ds {
		if s.Type == "prometheus" {
			promDS = append(promDS, s)
		}
	}

	return promDS, nil
}

func (b *Backend) Handle(routePrefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = strings.TrimPrefix(r.URL.Path, routePrefix)
		// Only allow datasource proxy requests and nothing else (since the Grafana token is an admin token and thus powerful).
		//
		// From https://golang.org/pkg/net/http/#ServeMux:
		//
		// ----------------
		// ServeMux also takes care of sanitizing the URL request path and the Host header, stripping
		// the port number and redirecting any request containing . or .. elements or repeated slashes
		// to an equivalent, cleaner URL.
		// ----------------
		//
		// Tested this and it works.
		// TODO: If we only want to proxy datasource requests, why not just register the entire Grafana backend on that path?
		if strings.HasPrefix(r.URL.Path, "/api/grafana/api/datasources/proxy/") {
			b.proxy.ServeHTTP(w, r)
		} else {
			http.Error(w, "Bad Request", http.StatusBadRequest)
		}
	}
}

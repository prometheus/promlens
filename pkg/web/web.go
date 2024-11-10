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

package web

import (
	"log/slog"
	"net/http"
	"net/url"

	"github.com/prometheus/client_golang/prometheus"
	versioncollector "github.com/prometheus/client_golang/prometheus/collectors/version"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	toolkitweb "github.com/prometheus/exporter-toolkit/web"

	"github.com/prometheus/promlens/pkg/grafana"
	"github.com/prometheus/promlens/pkg/pageconfig"
	"github.com/prometheus/promlens/pkg/parser"
	"github.com/prometheus/promlens/pkg/react"
	"github.com/prometheus/promlens/pkg/sharer"
)

// Config configures the PromLens web UI and API.
type Config struct {
	Logger                     *slog.Logger
	ToolkitConfig              *toolkitweb.FlagConfig
	RoutePrefix                string
	ExternalURL                *url.URL
	Sharer                     sharer.Sharer
	GrafanaBackend             *grafana.Backend
	DefaultPrometheusURL       string
	DefaultGrafanaDatasourceID int64
}

// Serve serves the PromLens web UI and API.
func Serve(cfg *Config) error {
	prometheus.MustRegister(versioncollector.NewCollector("promlens"))
	requestsTotal := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "promlens_http_requests_total",
			Help: "Total count of handled HTTP requests by PromLens.",
		},
		[]string{"handler", "code"},
	)
	requestDuration := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "promlens_http_request_duration_seconds",
			Help:    "Histogram of latencies for HTTP requests handled by PromLens.",
			Buckets: []float64{0.005, .01, .05, .1, .2, .5, 1, 5, 10, 15, 30, 60, 120},
		},
		[]string{"handler"},
	)
	prometheus.MustRegister(requestsTotal, requestDuration)

	instr := func(handlerName string, handler http.HandlerFunc) http.HandlerFunc {
		return promhttp.InstrumentHandlerCounter(
			requestsTotal.MustCurryWith(prometheus.Labels{"handler": handlerName}),
			promhttp.InstrumentHandlerDuration(
				requestDuration.MustCurryWith(prometheus.Labels{"handler": handlerName}),
				handler,
			),
		)
	}

	if cfg.RoutePrefix != "/" {
		// If the prefix is missing for the root path, prepend it.
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, cfg.RoutePrefix, http.StatusFound)
		})
	}

	// TODO: Clean this up.
	if cfg.RoutePrefix == "/" {
		cfg.RoutePrefix = ""
	}

	http.HandleFunc(cfg.RoutePrefix+"/api/page_config", instr("/api/page_config", pageconfig.Handle(cfg.Sharer, cfg.GrafanaBackend, cfg.DefaultPrometheusURL, cfg.DefaultGrafanaDatasourceID)))
	http.HandleFunc(cfg.RoutePrefix+"/api/link", instr("/api/link", sharer.Handle(cfg.Logger, cfg.Sharer)))
	http.HandleFunc(cfg.RoutePrefix+"/api/parse", instr("/api/parse", parser.Handle))
	if cfg.GrafanaBackend != nil {
		http.HandleFunc(cfg.RoutePrefix+"/api/grafana/", instr("/api/grafana", cfg.GrafanaBackend.Handle(cfg.RoutePrefix)))
	}
	http.HandleFunc(cfg.RoutePrefix+"/metrics", instr("/metrics", promhttp.Handler().ServeHTTP))
	http.HandleFunc(cfg.RoutePrefix+"/", instr("static", react.Handle(cfg.RoutePrefix, cfg.ExternalURL)))

	server := &http.Server{}
	return toolkitweb.ListenAndServe(server, cfg.ToolkitConfig, cfg.Logger)
}

package web

import (
	"net/http"
	"net/url"

	"github.com/go-kit/kit/log"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/prometheus/promlens/pkg/grafana"
	"github.com/prometheus/promlens/pkg/page_config"
	"github.com/prometheus/promlens/pkg/parser"
	"github.com/prometheus/promlens/pkg/react"
	"github.com/prometheus/promlens/pkg/sharer"
)

// Config configures the PromLens web UI and API.
type Config struct {
	Logger                     log.Logger
	ListenAddr                 string
	RoutePrefix                string
	ExternalURL                *url.URL
	Sharer                     sharer.Sharer
	GrafanaBackend             *grafana.Backend
	DefaultPrometheusURL       string
	DefaultGrafanaDatasourceID int64
}

// Serve serves the PromLens web UI and API.
func Serve(cfg *Config) error {
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

	http.HandleFunc(cfg.RoutePrefix+"/api/page_config", instr("/api/page_config", page_config.Handle(cfg.Sharer, cfg.GrafanaBackend, cfg.DefaultPrometheusURL, cfg.DefaultGrafanaDatasourceID)))
	http.HandleFunc(cfg.RoutePrefix+"/api/link", instr("/api/link", sharer.Handle(cfg.Logger, cfg.Sharer)))
	http.HandleFunc(cfg.RoutePrefix+"/api/parse", instr("/api/parse", parser.Handle))
	if cfg.GrafanaBackend != nil {
		http.HandleFunc(cfg.RoutePrefix+"/api/grafana/", instr("/api/grafana", cfg.GrafanaBackend.Handle(cfg.RoutePrefix)))
	}
	http.HandleFunc(cfg.RoutePrefix+"/metrics", instr("/metrics", promhttp.Handler().ServeHTTP))
	http.HandleFunc(cfg.RoutePrefix+"/", instr("static", react.Handle(cfg.RoutePrefix, cfg.ExternalURL)))

	return http.ListenAndServe(cfg.ListenAddr, nil)
}

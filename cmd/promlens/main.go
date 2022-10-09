package main

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"github.com/pkg/errors"
	"github.com/prometheus/common/promlog"
	promlogflag "github.com/prometheus/common/promlog/flag"
	"github.com/prometheus/promlens/pkg/grafana"
	"github.com/prometheus/promlens/pkg/sharer"
	"github.com/prometheus/promlens/pkg/web"
	"gopkg.in/alecthomas/kingpin.v2"
)

// TODO: This and computeExternalURL taken from Prometheus.
func startsOrEndsWithQuote(s string) bool {
	return strings.HasPrefix(s, "\"") || strings.HasPrefix(s, "'") ||
		strings.HasSuffix(s, "\"") || strings.HasSuffix(s, "'")
}

// computeExternalURL computes a sanitized external URL from a raw input. It infers unset
// URL parts from the OS and the given listen address.
func computeExternalURL(u, listenAddr string) (*url.URL, error) {
	if u == "" {
		hostname, err := os.Hostname()
		if err != nil {
			return nil, err
		}
		_, port, err := net.SplitHostPort(listenAddr)
		if err != nil {
			return nil, err
		}
		u = fmt.Sprintf("http://%s:%s/", hostname, port)
	}

	if startsOrEndsWithQuote(u) {
		return nil, errors.New("URL must not begin or end with quotes")
	}

	eu, err := url.Parse(u)
	if err != nil {
		return nil, err
	}

	ppref := strings.TrimRight(eu.Path, "/")
	if ppref != "" && !strings.HasPrefix(ppref, "/") {
		ppref = "/" + ppref
	}
	eu.Path = ppref

	return eu, nil
}

func getLinkSharer(logger log.Logger, gcsBucket string, sqlDriver string, sqlDSN string, createTables bool, sqlRetention time.Duration) (sharer.Sharer, error) {
	if sqlDSN == "" && gcsBucket == "" {
		return nil, nil
	}

	if sqlDSN != "" && gcsBucket != "" {
		return nil, errors.New("multiple link sharing backends are configured - please specify only one")
	}

	if sqlDSN != "" {
		if sqlDriver != "mysql" && sqlDriver != "sqlite3" {
			return nil, errors.Errorf("unsupported SQL driver %q, supported values are 'mysql' and 'sqlite3'", sqlDriver)
		}

		s, err := sharer.NewSQLSharer(logger, sqlDriver, sqlDSN, createTables, sqlRetention)
		if err != nil {
			return nil, errors.Wrap(err, "error creating SQL link sharer")
		}

		return s, nil
	}

	s, err := sharer.NewGCSSharer(gcsBucket)
	if err != nil {
		return nil, errors.Wrap(err, "error creating GCS link sharer")
	}
	return s, nil
}

func getGrafanaBackend(url string, token string, tokenFile string) (*grafana.Backend, error) {
	if url == "" {
		return nil, nil
	}

	if token == "" && tokenFile == "" {
		return nil, errors.New("specify one of --grafana.api-token or --grafana.api-token-file when setting a Grafana URL")
	}

	if token != "" && tokenFile != "" {
		return nil, errors.New("can't specify both --grafana.api-token and --grafana.api-token-file - please specify only one")
	}

	if tokenFile != "" {
		tokenBuf, err := os.ReadFile(tokenFile)
		if err != nil {
			return nil, errors.Wrapf(err, "error reading Grafana API token file %q", tokenFile)
		}
		token = string(tokenBuf)
	}

	gb, err := grafana.NewBackend(url, token)
	if err != nil {
		return nil, err
	}
	return gb, nil
}

func main() {
	app := kingpin.New(filepath.Base(os.Args[0]), "The PromLens server")
	app.HelpFlag.Short('h')

	sharedLinksGCSBucket := app.Flag("shared-links.gcs.bucket", "Name of the GCS bucket for storing shared links. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to point to the JSON file defining your service account credentials (needs to have permission to create, delete, and view objects in the provided bucket).").Default("").String()
	sharedLinksSQLDriver := app.Flag("shared-links.sql.driver", "The SQL driver to use for storing shared links in a SQL database. Supported values: [mysql, sqlite3].").Default("").String()
	sharedLinksSQLDSN := app.Flag("shared-links.sql.dsn", "SQL Data Source Name when using a SQL database to shared links (see https://github.com/go-sql-driver/mysql#dsn-data-source-name) for MySQL, https://github.com/mattn/go-sqlite3#dsn-examples for SQLite3). Alternatively, use the environment variable PROMLENS_SHARED_LINKS_DSN to indicate this value.").Default("").String()
	createSharedLinksTables := app.Flag("shared-links.sql.create-tables", "Whether to automatically create the required tables when using a SQL database for shared links.").Default("true").Bool()
	sharedLinksRetention := app.Flag("shared-links.sql.retention", "The maximum retention time for shared links when using a SQL database (e.g. '10m', '12h'). Set to 0 for infinite retention.").Default("0").Duration()

	grafanaURL := app.Flag("grafana.url", "The URL of your Grafana installation, to enable the Grafana datasource selector.").Default("").String()
	grafanaToken := app.Flag("grafana.api-token", "The auth token to pass to the Grafana API.").Default("").String()
	grafanaTokenFile := app.Flag("grafana.api-token-file", "A file containing the auth token to pass to the Grafana API.").Default("").String()
	grafanaDefaultDatasourceID := app.Flag("grafana.default-datasource-id", "The default Grafana datasource ID to use (overrides Grafana's own default).").Default("0").Int64()

	listenAddr := app.Flag("web.listen-address", "The address to listen on for the web API.").Default(":8080").String()
	promlensURL := app.Flag("web.external-url", "The URL under which PromLens is externally reachable (for example, if PromLens is served via a reverse proxy). Used for generating relative and absolute links back to PromLens itself. If the URL has a path portion, it will be used to prefix all HTTP endpoints served by PromLens. If omitted, relevant URL components will be derived automatically.").Default("").String()
	routePrefix := app.Flag("web.route-prefix", "Prefix for the internal routes of web endpoints. Defaults to path of --web.external-url.").Default("").String()

	defaultPrometheusURL := app.Flag("web.default-prometheus-url", "The default Prometheus URL to load PromLens with.").Default("").String()

	var logCfg promlog.Config
	promlogflag.AddFlags(app, &logCfg)

	_, err := app.Parse(os.Args[1:])
	if err != nil {
		fmt.Fprintln(os.Stderr, errors.Wrapf(err, "error parsing commandline arguments"))
		app.Usage(os.Args[1:])
		os.Exit(2)
	}

	logger := promlog.New(&logCfg)

	externalURL, err := computeExternalURL(*promlensURL, *listenAddr)
	if err != nil {
		level.Error(logger).Log("msg", "Error parsing external URL.", "err", err, "url", *promlensURL)
		os.Exit(2)
	}

	// Default --web.route-prefix to path of --web.external-url.
	if *routePrefix == "" {
		*routePrefix = externalURL.Path
	}
	// RoutePrefix must always be at least '/'.
	*routePrefix = "/" + strings.Trim(*routePrefix, "/")

	// Initialize link sharer.
	if *sharedLinksSQLDSN == "" && os.Getenv("PROMLENS_SHARED_LINKS_DSN") != "" {
		*sharedLinksSQLDSN = os.Getenv("PROMLENS_SHARED_LINKS_DSN")
	}
	shr, err := getLinkSharer(logger, *sharedLinksGCSBucket, *sharedLinksSQLDriver, *sharedLinksSQLDSN, *createSharedLinksTables, *sharedLinksRetention)
	if err != nil {
		level.Error(logger).Log("msg", "Error initializing link sharer.", "err", err)
		os.Exit(2)
	}
	if shr == nil {
		level.Info(logger).Log("msg", "No link sharing backends are enabled - disabling link sharing functionality.")
	} else {
		defer func() {
			level.Info(logger).Log("msg", "Closing link sharer.")
			shr.Close()
		}()
	}

	gb, err := getGrafanaBackend(*grafanaURL, *grafanaToken, *grafanaTokenFile)
	if err != nil {
		level.Error(logger).Log("msg", "Error initializing Grafana backend.", "err", err)
		os.Exit(2)
	}
	if gb == nil {
		level.Info(logger).Log("msg", "No Grafana backend enabled - disabling Grafana datasource integration.")
	}

	level.Error(logger).Log("msg", "Running HTTP server failed.", "err", web.Serve(&web.Config{
		Logger:                     logger,
		ListenAddr:                 *listenAddr,
		RoutePrefix:                *routePrefix,
		ExternalURL:                externalURL,
		Sharer:                     shr,
		GrafanaBackend:             gb,
		DefaultPrometheusURL:       strings.TrimRight(*defaultPrometheusURL, "/"),
		DefaultGrafanaDatasourceID: *grafanaDefaultDatasourceID,
	}))
}

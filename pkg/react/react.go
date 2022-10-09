package react

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/rakyll/statik/fs"

	// Register static assets.
	_ "github.com/prometheus/promlens/pkg/react/statik"
)

//go:generate statik -src=../../app/build

var reactRouterPaths = []string{
	"/",
	"/about",
	"/terms",
	"/features",
	"/pricing",
	"/feedback",
	"/imprint",
	"/privacy",
}

// TODO: Make this non-global.
var statikFS http.FileSystem

func init() {
	var err error
	statikFS, err = fs.New()
	if err != nil {
		log.Fatal(err)
	}
}

func Handle(routePrefix string, externalURL *url.URL) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// For paths that the React/Reach router handles, we want to serve the
		// index.html, but with replaced path prefix placeholder.
		for _, rp := range reactRouterPaths {
			if r.URL.Path != routePrefix+rp {
				continue
			}

			f, err := statikFS.Open("/index.html")
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, "Error opening React index.html: %v", err)
				return
			}
			idx, err := ioutil.ReadAll(f)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, "Error reading React index.html: %v", err)
				return
			}

			prefixedIdx := bytes.ReplaceAll(idx, []byte("PATH_PREFIX_PLACEHOLDER"), []byte(externalURL.Path))
			w.Write(prefixedIdx)
			return
		}

		// For all other paths, serve auxiliary assets.
		r.URL.Path = strings.TrimPrefix(r.URL.Path, routePrefix)
		http.FileServer(statikFS).ServeHTTP(w, r)
	}
}

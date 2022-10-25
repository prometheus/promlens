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

package react

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/prometheus/common/server"

	ui "github.com/prometheus/promlens/app"
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

func Handle(routePrefix string, externalURL *url.URL) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// For paths that the React/Reach router handles, we want to serve the
		// index.html, but with replaced path prefix placeholder.
		for _, rp := range reactRouterPaths {
			if r.URL.Path != routePrefix+rp {
				continue
			}

			f, err := ui.Assets.Open("/build/index.html")
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, "Error opening React index.html: %v", err)
				return
			}
			idx, err := io.ReadAll(f)
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
		r.URL.Path = path.Join("/build", r.URL.Path)
		server.StaticFileServer(ui.Assets).ServeHTTP(w, r)
	}
}

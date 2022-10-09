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

package pageconfig

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/prometheus/promlens/pkg/grafana"
	"github.com/prometheus/promlens/pkg/sharer"
)

type pageConfig struct {
	Now                  int64                        `json:"now"`
	GrafanaDatasources   []grafana.DatasourceSettings `json:"grafanaDatasources"`
	PageState            map[string]interface{}       `json:"pageState"`
	DefaultPrometheusURL string                       `json:"defaultPrometheusURL"`
}

func Handle(
	shr sharer.Sharer,
	gb *grafana.Backend,
	defaultPrometheusURL string,
	defaultGrafanaDatasourceID int64,
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ds := []grafana.DatasourceSettings{}
		var err error
		if gb != nil {
			ds, err = gb.GetDatasources()
			if err != nil {
				w.WriteHeader(http.StatusBadGateway)
				fmt.Fprintf(w, "Error fetching datasources from Grafana: %v", err)
				return
			}

			if defaultGrafanaDatasourceID != 0 {
				for i := range ds {
					if ds[i].ID == defaultGrafanaDatasourceID {
						ds[i].IsDefault = true
					} else {
						ds[i].IsDefault = false
					}
				}
			}
		}

		var pageState map[string]interface{}
		if name := r.FormValue("l"); name != "" {
			if shr == nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				fmt.Fprintf(w, "Link sharing disabled in this PromLens instance")
				return
			}

			jsonState, err := shr.GetLink(name)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, "Error fetching shared link state: %v", err)
				return
			}

			if err := json.Unmarshal([]byte(jsonState), &pageState); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, "Error unmarshaling shared page state from JSON: %v", err)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		// TODO do something with this error
		_ = json.NewEncoder(w).Encode(pageConfig{
			Now:                  time.Now().Unix(),
			GrafanaDatasources:   ds,
			PageState:            pageState,
			DefaultPrometheusURL: defaultPrometheusURL,
		})
	}
}

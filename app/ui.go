package ui

import (
	"net/http"

	"github.com/prometheus/common/assets"
)

var Assets = http.FS(assets.New(embedFS))

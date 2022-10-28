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

package sharer

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"time"

	"cloud.google.com/go/storage"
	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"github.com/prometheus/client_golang/prometheus"

	// Load SQL drivers.
	_ "github.com/glebarez/go-sqlite"
	_ "github.com/go-sql-driver/mysql"
)

const maxPageStateSize = 512 * 1024

var (
	linkCreations = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "promlens_share_link_creations_total",
		Help: "The total number of shared link creations.",
	})
	linkCreationErrors = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "promlens_share_link_creation_errors_total",
		Help: "The total number of errors while creating shared links.",
	})

	linkLookups = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "promlens_share_link_lookups_total",
		Help: "The total number of shared link lookups.",
	})
	linkLookupErrors = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "promlens_share_link_lookup_errors_total",
		Help: "The total number of errors while looking up shared links.",
	})
)

func init() {
	prometheus.MustRegister(linkCreations, linkCreationErrors, linkLookups, linkLookupErrors)
}

type Sharer interface {
	CreateLink(name string, pageState string) error
	GetLink(name string) (string, error)
	Close()
}

type GCSSharer struct {
	bucket string
	client *storage.Client
}

func NewGCSSharer(bucket string) (*GCSSharer, error) {
	client, err := storage.NewClient(context.Background())
	if err != nil {
		return nil, fmt.Errorf("error creating GCS client: %v", err)
	}
	return &GCSSharer{
		bucket: bucket,
		client: client,
	}, nil
}

func (s GCSSharer) CreateLink(name string, pageState string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	wc := s.client.Bucket(s.bucket).Object(name).NewWriter(ctx)
	if _, err := wc.Write([]byte(pageState)); err != nil {
		return fmt.Errorf("error writing GCS object: %v", err)
	}
	if err := wc.Close(); err != nil {
		return fmt.Errorf("error closing GCS object writer: %v", err)
	}
	return nil
}

func (s GCSSharer) GetLink(name string) (pageState string, err error) {
	linkLookups.Inc()
	defer func() {
		if err != nil {
			linkLookupErrors.Inc()
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rc, err := s.client.Bucket(s.bucket).Object(name).NewReader(ctx)
	if err != nil {
		return "", fmt.Errorf("error creating GCS bucket reader: %v", err)
	}
	ps, err := io.ReadAll(rc)
	if err != nil {
		return "", fmt.Errorf("error reading GCS object: %v", err)
	}
	if err := rc.Close(); err != nil {
		return "", fmt.Errorf("error closing GCS object reader: %v", err)
	}
	return string(ps), nil
}

func (s GCSSharer) Close() {
}

type SQLSharer struct {
	driver  string
	db      *sql.DB
	closeCh chan struct{}
	doneCh  <-chan struct{}
	logger  log.Logger
}

func NewSQLSharer(logger log.Logger, driver string, dsn string, createTables bool, retention time.Duration) (*SQLSharer, error) {
	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, fmt.Errorf("error connecting to %q database: %v", driver, err)
	}

	switch driver {
	case "mysql":
		db.SetConnMaxLifetime(0)
		db.SetMaxIdleConns(3)
		db.SetMaxOpenConns(3)

		if createTables {
			_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS link (
			id INT AUTO_INCREMENT PRIMARY KEY,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			short_name VARCHAR(11) UNIQUE,
			page_state TEXT
		)`)
			if err != nil {
				return nil, fmt.Errorf("error creating link table: %v", err)
			}
			_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS view(
			id INT AUTO_INCREMENT PRIMARY KEY,
			link_id INTEGER,
			viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(link_id) REFERENCES link(id) ON DELETE CASCADE
		)`,
			)
			if err != nil {
				return nil, fmt.Errorf("Error creating view table: %v", err)
			}
		}

	case "sqlite":
		_, err := db.Exec("PRAGMA foreign_keys = ON")
		if err != nil {
			return nil, fmt.Errorf("error enabling foreign key support: %v", err)
		}

		if createTables {
			_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS link (
			id INTEGER NOT NULL PRIMARY KEY,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			short_name TEXT UNIQUE,
			page_state TEXT
		)`)
			if err != nil {
				return nil, fmt.Errorf("error creating link table: %v", err)
			}
			_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS view(
			id INTEGER NOT NULL PRIMARY KEY,
			link_id INTEGER,
			viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(link_id) REFERENCES link(id) ON DELETE CASCADE
		)`,
			)
			if err != nil {
				return nil, fmt.Errorf("Error creating view table: %v", err)
			}
		}
	default:
		return nil, fmt.Errorf("Unsupported SQL driver %q", driver)
	}

	closeCh := make(chan struct{})
	doneCh := make(chan struct{})

	shr := &SQLSharer{
		driver:  driver,
		db:      db,
		closeCh: closeCh,
		doneCh:  doneCh,
		logger:  logger,
	}

	if retention != 0 {
		go func() {
			for {
				t := time.NewTicker(15 * time.Minute)
				select {
				case <-t.C:
					level.Info(logger).Log("msg", "Cleaning up old shared links", "retention", retention)
					if n, err := shr.cleanupOldLinks(retention); err != nil {
						level.Error(logger).Log("msg", "Error cleaning up old shared links", "err", err)
					} else {
						level.Info(logger).Log("msg", "Deleted old shared links", "count", n)
					}
				case <-closeCh:
					close(doneCh)
					return
				}
			}
		}()
	} else {
		close(doneCh)
	}

	return shr, nil
}

func (s SQLSharer) cleanupOldLinks(retention time.Duration) (int64, error) {
	timestampFn := "DATETIME"
	if s.driver == "mysql" {
		timestampFn = "TIMESTAMP"
	}

	res, err := s.db.Exec(`
		DELETE FROM link WHERE created_at < `+timestampFn+`(?)`,
		time.Now().Add(-retention),
	)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (s SQLSharer) Close() {
	close(s.closeCh)
	<-s.doneCh

	_ = s.db.Close()
}

func (s SQLSharer) CreateLink(name string, pageState string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("error beginning transaction: %v", err)
	}
	id := 0
	err = tx.QueryRow("SELECT id FROM link WHERE short_name = ?", name).Scan(&id)
	if err == nil {
		// TODO: Check rollback errors.
		_ = tx.Rollback()
		// Entry already exists.
		level.Warn(s.logger).Log("msg", "Short link already exists", "link", name)
		return nil
	}

	if err != sql.ErrNoRows {
		// TODO: Check rollback errors.
		_ = tx.Rollback()
		return fmt.Errorf("error checking for link existence: %v", err)
	}

	_, err = tx.Exec("INSERT INTO link(short_name, page_state) values(?, ?)", name, pageState)
	if err != nil {
		// TODO: Check rollback errors.
		_ = tx.Rollback()
		return fmt.Errorf("error inserting new link: %v", err)
	}
	_ = tx.Commit()

	return nil
}

func (s SQLSharer) GetLink(name string) (pageState string, err error) {
	linkLookups.Inc()
	defer func() {
		if err != nil {
			linkLookupErrors.Inc()
		}
	}()

	stmt, err := s.db.Prepare("SELECT id, page_state FROM link WHERE short_name = ?")
	if err != nil {
		return "", fmt.Errorf("error preparing statement: %v", err)
	}
	defer stmt.Close()

	var id int
	err = stmt.QueryRow(name).Scan(&id, &pageState)
	if err != nil {
		// TODO: This error is special, caller depends on value.
		return "", err
	}

	_, err = s.db.Exec("INSERT INTO view(link_id) values(?)", id)
	if err != nil {
		return "", fmt.Errorf("error inserting view: %v", err)
	}

	return pageState, nil
}

func shortName(pageState string) string {
	h := sha256.New()
	h.Write([]byte(pageState))
	sum := h.Sum(nil)
	b := make([]byte, base64.URLEncoding.EncodedLen(len(sum)))
	base64.URLEncoding.Encode(b, sum)
	// Web sites don’t always linkify a trailing underscore, making it seem like
	// the link is broken. If there is an underscore at the end of the substring,
	// extend it until there is not.
	hashLen := 11
	for hashLen <= len(b) && b[hashLen-1] == '_' {
		hashLen++
	}
	return string(b)[:hashLen]
}

func Handle(logger log.Logger, s Sharer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if s == nil {
			http.Error(w, "No link sharing backend configured.", http.StatusServiceUnavailable)
			return
		}

		switch r.Method {
		case "POST":
			linkCreations.Inc()

			var body bytes.Buffer
			_, err := io.Copy(&body, io.LimitReader(r.Body, maxPageStateSize+1))
			_ = r.Body.Close()
			if err != nil {
				level.Error(logger).Log("msg", "Error reading body", "err", err)
				linkCreationErrors.Inc()

				http.Error(w, "Server Error", http.StatusInternalServerError)
				return
			}
			if body.Len() > maxPageStateSize {
				linkCreationErrors.Inc()

				http.Error(w, "Page is too large to save, sorry", http.StatusRequestEntityTooLarge)
				return
			}

			level.Info(logger).Log("msg", "Creating short link...")
			pageState := body.String()
			name := shortName(pageState)
			err = s.CreateLink(name, pageState)
			if err != nil {
				level.Error(logger).Log("msg", "Error creating short link", "err", err)
				linkCreationErrors.Inc()

				http.Error(w, "Server Error", http.StatusInternalServerError)
				return
			}

			fmt.Fprint(w, name)

		default:
			http.Error(w, "Invalid HTTP method, use POST", http.StatusMethodNotAllowed)
			return
		}
	}
}

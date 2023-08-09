# Copyright 2022 The Prometheus Authors
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Needs to be defined before including Makefile.common to auto-generate targets
DOCKER_ARCHS ?= amd64 armv7 arm64 ppc64le s390x

REACT_APP_PATH = app
REACT_APP_NODE_MODULES_PATH = $(REACT_APP_PATH)/node_modules
REACT_APP_NPM_LICENSES_TARBALL = "npm_licenses.tar.bz2"

include Makefile.common

DOCKER_IMAGE_NAME ?= promlens

.PHONY: assets-compress
assets-compress:
	@echo '>> compressing assets'
	scripts/compress_assets.sh

.PHONY: ui-install
ui-install:
	cd $(REACT_APP_PATH) && npm install

.PHONY: build-ui
build-ui:
	CI=false PUBLIC_URL=. ./scripts/build_ui.sh

.PHONY: npm_licenses
npm_licenses: ui-install
	@echo ">> bundling npm licenses"
	rm -f $(REACT_APP_NPM_LICENSES_TARBALL) npm_licenses
	ln -s . npm_licenses
	find npm_licenses/$(REACT_APP_NODE_MODULES_PATH) -iname "license*" | tar cfj $(REACT_APP_NPM_LICENSES_TARBALL) --files-from=-
	rm -f npm_licenses

.PHONY: tarball
tarball: npm_licenses common-tarball

.PHONY: docker
docker: npm_licenses common-docker

.PHONY: clean
clean:
	rm -rf ./app/build
	rm ./app/embed.go

.PHONY: lint
lint: build common-lint

.PHONY: build
build: build-ui assets-compress npm_licenses common-build

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

.PHONY: build-ui
build-ui:
	cd $(REACT_APP_PATH) && npm i --legacy-peer-deps
	cd $(REACT_APP_PATH) && PUBLIC_URL=. npm run build

.PHONY: npm_licenses
npm_licenses: $(REACT_APP_NODE_MODULES_PATH)
	@echo ">> bundling npm licenses"
	rm -f $(REACT_APP_NPM_LICENSES_TARBALL)
	find $(REACT_APP_NODE_MODULES_PATH) -iname "license*" | tar cfj $(REACT_APP_NPM_LICENSES_TARBALL) --transform 's/^/npm_licenses\//' --files-from=-

.PHONY: docker-build-hosted
docker-build-hosted:
	docker build -t prom/promlens -f ./Dockerfile ./

docker-build-onprem:
	docker buildx build --platform linux/arm/v7,linux/arm64/v8,linux/amd64 --push --build-arg=REACT_APP_PROMLENS_ENV=onprem -t prom/promlens -f ./Dockerfile.buildx ./

.PHONY: clean
clean:
	rm -rf ./app/build
	rm ./app/embed.go

.PHONY: build
build: build-ui assets-compress npm_licenses common-build

.PHONY: lint
lint: assets-compress common-lint

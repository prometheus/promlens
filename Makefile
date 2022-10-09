REACT_APP_PATH = app
REACT_APP_NODE_MODULES_PATH = $(REACT_APP_PATH)/node_modules
REACT_APP_NPM_LICENSES_TARBALL = "npm_licenses.tar.gz"

.PHONY:
build:
	cd $(REACT_APP_PATH) && npm i --legacy-peer-deps
	cd $(REACT_APP_PATH) && PUBLIC_URL=. npm run build
	go generate ./pkg/react
	go build ./cmd/promlens

.PHONY: npm_licenses
npm_licenses: $(REACT_APP_NODE_MODULES_PATH)
	@echo ">> bundling npm licenses"
	rm -f $(REACT_APP_NPM_LICENSES_TARBALL)
	find $(REACT_APP_NODE_MODULES_PATH) -iname "license*" | tar cfz $(REACT_APP_NPM_LICENSES_TARBALL) --transform 's/^/npm_licenses\//' --files-from=-

.PHONY:
docker-build-hosted:
	docker build -t prom/promlens -f ./Dockerfile ./

docker-build-onprem:
	docker buildx build --platform linux/arm/v7,linux/arm64/v8,linux/amd64 --push --build-arg=REACT_APP_PROMLENS_ENV=onprem -t prom/promlens -f ./Dockerfile.buildx ./

.PHONY:
clean:
	rm ./pkg/react/statik/statik.go
	rm -rf ./app/node_modules

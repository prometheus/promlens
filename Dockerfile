FROM --platform=$BUILDPLATFORM tonistiigi/xx:1.1.0 AS xx

# Use the official Golang image to create a build artifact.
# This is based on Debian and sets the GOPATH to /go.
# https://hub.docker.com/_/golang
FROM --platform=$BUILDPLATFORM golang:1.17-alpine as builder

COPY --from=xx / /

# Create and change to the app directory.
WORKDIR /app
ARG REACT_APP_PROMLENS_ENV=hosted

# Retrieve application dependencies.
# This allows the container build to reuse cached dependencies.
COPY . /app

RUN go mod download \
  && go install github.com/rakyll/statik \
  && apk add curl nodejs npm make tar \
  && (cd app && CYPRESS_INSTALL_BINARY=0 npm i && PUBLIC_URL=. REACT_APP_PROMLENS_ENV=${REACT_APP_PROMLENS_ENV} npm run build) \
  && make npm_licenses \
  && GOOS=linux PATH=$PATH:/go/bin go generate -mod=readonly -v ./pkg/react

RUN apk add clang lld

ARG TARGETPLATFORM
RUN xx-apk add gcc musl-dev
ENV CGO_ENABLED=1
RUN xx-go build -mod=readonly -v ./cmd/promlens

# Use the official Alpine image for a lean production container.
# https://hub.docker.com/_/alpine
# https://docs.docker.com/develop/develop-images/multistage-build/#use-multi-stage-builds
FROM alpine:3
RUN apk add --no-cache ca-certificates

# Copy the binary to the production image from the builder stage.
COPY --from=builder /app/promlens /promlens
COPY --from=builder /app/npm_licenses.tar.gz /
COPY ./NOTICE /NOTICE

# Run the web service on container startup.
ENTRYPOINT [ "/promlens" ]

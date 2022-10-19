ARG ARCH="amd64"
ARG OS="linux"
FROM quay.io/prometheus/busybox-${OS}-${ARCH}:latest
LABEL maintainer="The Prometheus Authors <prometheus-developers@googlegroups.com>"

ARG ARCH="amd64"
ARG OS="linux"
COPY .build/${OS}-${ARCH}/promlens      /bin/promlens
COPY LICENSE                            /LICENSE
COPY NOTICE                             /NOTICE
COPY npm_licenses.tar.bz2               /npm_licenses.tar.bz2

USER       nobody
EXPOSE     8080
ENTRYPOINT [ "/bin/promlens" ]

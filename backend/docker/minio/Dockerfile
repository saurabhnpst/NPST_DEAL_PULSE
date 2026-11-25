FROM alpine:3.20
ARG MINIO_RELEASE=RELEASE.2024-11-07T00-52-20Z
RUN apk add --no-cache curl ca-certificates \
  && curl -fsSL "https://github.com/minio/minio/releases/download/${MINIO_RELEASE}/minio.linux-amd64" -o /usr/local/bin/minio \
  && chmod +x /usr/local/bin/minio
VOLUME /data
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/minio"]
CMD ["server", "/data", "--address", ":9000"]
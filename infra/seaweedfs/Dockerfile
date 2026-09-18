FROM chrislusf/seaweedfs:4.47@sha256:f83509b0721dfd8e2e07faf76c0a899f67a8a889c89abe2fa0a5227ba1320362

COPY --chmod=0755 infra/seaweedfs/entrypoint.sh /usr/local/bin/sukoon-seaweedfs

EXPOSE 8333
ENTRYPOINT ["/usr/local/bin/sukoon-seaweedfs"]

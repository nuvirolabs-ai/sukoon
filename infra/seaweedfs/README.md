# Sukoon private staging object storage

The staging Blueprint uses SeaweedFS Community Edition `4.47`, from the official
`chrislusf/seaweedfs` image, pinned to the inspected amd64 image digest in the
Dockerfile. SeaweedFS is Apache-2.0 licensed and implements the S3 object API.
Source and licence: <https://github.com/seaweedfs/seaweedfs>.

This service runs the official `weed mini` single-node mode on Render's private
service network. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `S3_BUCKET` are
injected by Render; the entrypoint refuses any bucket other than
`sukoon-demo-staging`. The official mode creates that bucket on first start.
There is no anonymous S3 identity and no public storage URL. The application
uses path-style S3 requests with the generated credentials over the private
`sukoon-storage:8333` hostport.

Operational limitations are intentional for a client-demo staging resource:

- one persistent-disk node; no high availability or cross-region replication;
- the 10 GB Render disk is a capacity limit, not a backup;
- backups, restore drills, retention and cleanup remain operator duties;
- the SeaweedFS Admin/WebDAV surfaces are not part of the application contract;
  the private service has no public ingress, but workspace operators must still
  treat private-service shell access as sensitive;
- this is not production storage and is not a replacement for an approved
  managed object-storage service.

The application continues to enforce object-key containment, private endpoint
validation, exact-byte hashes, erasure gates and fail-closed storage errors.

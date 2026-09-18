# Sukoon private staging ClamAV

The staging Blueprint builds from the official Cisco Talos image
`clamav/clamav-debian:stable`, pinned to the inspected amd64 digest in the
Dockerfile. The ClamAV Docker image and daemon are GPL-2.0-or-later; the source
and official image guidance are maintained at
<https://github.com/Cisco-Talos/clamav-docker> and
<https://github.com/Cisco-Talos/clamav>.

The service is a Render private service in Singapore. Only the web/worker
services in the isolated `demo-staging` environment should connect to its
private `sukoon-clamav:3310` hostport. ClamAV's clamd TCP protocol has no
authentication or encryption, so private-network restriction is the boundary;
no public ClamAV endpoint or application-level authentication is introduced in
this slice.

The Blueprint turns off the optional milter, refreshes official signatures once
per day, binds clamd to the private service interface, and sets bounded stream,
file-size, scan-time and encrypted/broken-content alerts through the image's
supported `CLAMD_CONF_*` environment mechanism. The 5 GB persistent disk is
mounted at `/var/lib/clamav`, so FreshClam does not redownload the full database
on every restart. Application acceptance additionally requires signature
metadata to be no more than 72 hours old and binds each verdict to the exact
document-version ID, content hash and scan timestamp.

If clamd reports a threat, malformed result, timeout, unavailable service,
stale/future signatures, a hash mismatch or a configured scan limit, Sukoon
records a bounded unavailable/rejected result and keeps the document
inaccessible. A successful process exit alone is never a clean verdict.

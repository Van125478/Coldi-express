# IMG-01 technical limits

Status: **TECHNICAL PROPOSAL**. These limits are not approved business policy.

The approved rule is already implemented: a shipment created through the shipper publish API needs at least 1 and at most 5 cargo images. Older shipments stay readable with no images and are not backfilled.

## Proposed limits used so the approved count can be tested

| Limit | Proposal | Approval |
|---|---|---|
| Formats | JPG, PNG, WebP, checked by declared type and file signature | OPEN |
| Max file size | 2 MB per image | OPEN |
| Storage | Private server directory. `CARGO_IMAGE_DIR` must be absolute in production. If it is unset in production, upload returns 503. Non-production uses the operating-system temp directory. | OPEN |
| Retrieval | Authenticated. Owner, the shipper of the attached shipment, a carrier viewing a published unclaimed shipment, the claimed carrier, and the assigned driver. No public file URL. | Required protection for this implementation, not a retention policy |
| Retention of unattached uploads | Unattached, unreserved files older than 24 hours are deleted by the next upload | OPEN |
| Client path | The server generates the storage name. The API does not accept or return a storage path. | Required protection for this implementation |

Production upload is fail-closed until an absolute `CARGO_IMAGE_DIR` is configured on the server. This proposal does not choose a cloud provider or a legal retention period.

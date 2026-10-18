# Second-wave items still waiting for approval

These notes do not change the product. They are not included as behavior in the second-wave UX fix.

## INC-IMG-01 — Incident evidence upload

Status: **APPROVED as optional evidence. Retention period remains a technical proposal.**

The Product Owner approved optional incident evidence photos. A report with no image is still valid. Cargo images for a new shipment remain a separate rule.

Proposed later behavior, if approved:

- Evidence images are optional.
- Storage is private and checked the same way as other private files.
- Only parties already allowed to see the incident can view the files.
- The report form can preview, remove, and show an upload error.
- Uploading evidence does not change the shipment, the listed price, or the commission snapshot.

## INC-UX-01 — Create an incident from the incident list

Status: **RECOMMENDATION ONLY.**

The incident list has no global create button. A report is started from a shipment the user is allowed to report on. That keeps the shipment relationship explicit.

Recommendation: leave creation on the shipment until there is a need to report without already having that shipment open. A list button would need a shipment picker and the same authorization rules. Do not add that flow until it is approved.

## CHAT-UX-02 — Empty chat height

Status: **WAITING FOR PRODUCT OWNER REVIEW.**

Carrier shipment detail uses a message list with a fixed height of 20rem (`h-80`). When there are no messages, `Chưa có tin nhắn` sits inside that tall area.

Proposed visual change, not applied in this patch:

- Use a short empty state.
- Keep the composer visible.
- Let the list grow and scroll after messages exist.
- Do not change who can read or send messages.

## PKG-BIZ-01 — Public prices

Status: **APPROVED AND IMPLEMENTED.**

Shipper Enterprise is 6.990.000 VND/tháng at 2,5% with no vehicle quota. Carrier Business is 2.990.000 VND/tháng at 3% with 30 ACTIVE vehicles. Carrier Enterprise is 7.990.000 VND/tháng at 2% with 100 ACTIVE vehicles. There is no annual Enterprise package. The pre-approval proposal remains `PKG_BIZ_01_TRANSPARENT_PRICING_PROPOSAL.md`. The versioned policy delta is `PKG_BIZ_01_APPROVED_POLICY.md`. Business Documentation v2.10 is unchanged.

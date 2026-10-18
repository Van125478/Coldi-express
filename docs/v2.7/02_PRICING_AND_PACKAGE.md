# 02 — Package pricing, caps and versioning

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


## SHIPPER
| Tier | Subscription list price | Commission | Terms |
|---|---:|---:|---|
| Free | 0 VND/month | 5% | fixed |
| Pro Monthly | 799,000 VND/month | 4% | fixed |
| Pro Annual | 7,990,000 VND/year | 3.5% | fixed |
| Enterprise | indicative 5–15 million VND/month+ | contract-specific 2–3% | quote required |

## CARRIER
| Tier | Subscription list price | Commission | ACTIVE vehicle cap |
|---|---:|---:|---:|
| Free | 0 VND/month | 5% | 2 |
| Pro Monthly | 999,000 VND/month | 4% | 10 |
| Pro Annual | 9,990,000 VND/year | 3.5% | 10 |
| Business | indicative 2–5 million VND/month | contract-specific 2.5–3% | 30 |
| Enterprise | indicative 5–20 million VND/month+ | contract-specific 1.5–2.5% | contract |

Annual saving relative to 12 separate monthly payments is ~16.67% for both; monthly equivalent informational only. No min vehicle counts, just maximum. Shipper monthly shipment cap **NOT APPROVED**, do not invent one. Do not advertise unbuilt premium features as active. Enterprise multi-branch is future Organization, not automatically provided in account-based MVP.

## Price versioning
`PlanDefinition(code, audience, billingCycle, contractRequired)` -> immutable `PlanVersion(revision, priceVnd, commissionRateBps, vehicleCap, entitlements, effectiveFrom, status)` -> `AccountSubscription(accountId, planVersionId, start, end, activationSource, environmentId)`.
Draft -> approved -> scheduled -> published -> retired. Never edit a published version in place; no overlapping availability window for new activations within same environment/tier. Existing subscription keeps signed/current-period terms; effective new activations use published new version. Business/Enterprise require explicit negotiated `ContractTerms(priceVnd, rateBps, cap, validity)`; **never midpoint or range**. Plan list/catalog does not imply payment or production availability.

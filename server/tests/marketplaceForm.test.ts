import assert from "node:assert/strict";
import test from "node:test";
import { allowedMarketplaceSearch, emptyMarketplaceForm, hasAdvancedMarketplaceFilters, searchFromForm } from "../../web/src/features/shipments/marketplaceForm.ts";

test("marketplace search trims fields and keeps the selected sort", () => {
  const search = searchFromForm({
    ...emptyMarketplaceForm,
    q: "  Thủy sản  ",
    temperature: "FROZEN",
    weightMin: "1,5",
    weightMax: "8",
    sort: "price",
  });
  const params = new URLSearchParams(search);
  assert.equal(params.get("q"), "Thủy sản");
  assert.equal(params.get("temperature"), "FROZEN");
  assert.equal(params.get("weightMin"), "1.5");
  assert.equal(params.get("weightMax"), "8");
  assert.equal(params.get("sort"), "price");
});

test("marketplace search rejects a reversed weight range before building a query", () => {
  assert.throws(() => searchFromForm({ ...emptyMarketplaceForm, weightMin: "9", weightMax: "1" }), /Tải trọng từ/);
});

test("marketplace request drops keys outside the allowlist", () => {
  const search = searchFromForm(emptyMarketplaceForm);
  assert.equal(search.includes("xem-truoc"), false);
  const allowed = new URLSearchParams(allowedMarketplaceSearch(new URLSearchParams("q=thủy sản&xem-truoc-bo-cuc=1&sort=price")));
  assert.equal(allowed.get("q"), "thủy sản");
  assert.equal(allowed.get("sort"), "price");
  assert.equal(allowed.has("xem-truoc-bo-cuc"), false);
  assert.equal(hasAdvancedMarketplaceFilters(emptyMarketplaceForm), false);
  assert.equal(hasAdvancedMarketplaceFilters({ ...emptyMarketplaceForm, pickupFrom: "2026-10-20" }), true);
});

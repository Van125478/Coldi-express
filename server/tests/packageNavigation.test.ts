import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { planCatalog, toCatalogDto } from "../src/packages/catalog.ts";
import { destinationAfterLogin } from "../../web/src/features/auth/driverAccess.ts";
import { formatVnd } from "../../web/src/features/packages/formatPlan.ts";
import { catalogPrimaryCta, packageAwareNext, publicPackageNav } from "../../web/src/features/packages/packageNavigation.ts";
import { activeVehicleText, commissionText, isProPlan, paymentNote, planTitle, priceBlock, termCopy, vehicleCapText } from "../../web/src/features/packages/planPresentation.ts";

const catalog = planCatalog.map(toCatalogDto);

function plan(code: string) {
  const found = catalog.find((item) => item.code === code);
  assert.ok(found, code);
  return found;
}

test("public package links follow the signed-in role and keep drivers out of purchasing", () => {
  assert.deepEqual(publicPackageNav(null), { href: "/goi-dich-vu", label: "Gói dịch vụ" });
  assert.deepEqual(publicPackageNav("ADMIN"), { href: "/goi-dich-vu", label: "Gói dịch vụ" });
  assert.deepEqual(publicPackageNav("SHIPPER"), { href: "/shipper/goi", label: "Gói dịch vụ" });
  assert.deepEqual(publicPackageNav("CARRIER"), { href: "/carrier/goi", label: "Gói dịch vụ" });
  assert.equal(publicPackageNav("DRIVER"), null);
  assert.equal(catalogPrimaryCta(null).href, "/dang-nhap?next=%2Fgoi-dich-vu");
  assert.equal(catalogPrimaryCta("SHIPPER").href, "/shipper/goi");
  assert.equal(catalogPrimaryCta("CARRIER").href, "/carrier/goi");
  assert.equal(catalogPrimaryCta("DRIVER").href, "/driver");
  assert.equal(catalogPrimaryCta("ADMIN").href, "/admin");
  assert.equal(packageAwareNext("SHIPPER", "/goi-dich-vu"), "/shipper/goi");
  assert.equal(packageAwareNext("CARRIER", "/goi-dich-vu"), "/carrier/goi");
  assert.equal(packageAwareNext("DRIVER", "/goi-dich-vu"), null);
  assert.equal(packageAwareNext("ADMIN", "/goi-dich-vu"), null);
  assert.equal(packageAwareNext("SHIPPER", "/shipper/tao-don"), "/shipper/tao-don");
});

test("login from the catalog opens the role plan and leaves other destinations alone", () => {
  assert.equal(destinationAfterLogin({ role: "SHIPPER" }, "/goi-dich-vu"), "/shipper/goi");
  assert.equal(destinationAfterLogin({ role: "CARRIER" }, "/goi-dich-vu"), "/carrier/goi");
  assert.equal(destinationAfterLogin({ role: "DRIVER" }, "/goi-dich-vu"), "/driver");
  assert.equal(destinationAfterLogin({ role: "ADMIN" }, "/goi-dich-vu"), "/admin");
  assert.equal(destinationAfterLogin({ role: "DRIVER", mustChangePassword: true }, "/goi-dich-vu"), "/driver/doi-mat-khau");
  assert.equal(destinationAfterLogin({ role: "SHIPPER" }, "/shipper/tao-don"), "/shipper/tao-don");
  assert.equal(destinationAfterLogin({ role: "CARRIER" }, null), "/carrier");
});

test("catalog copy keeps approved prices, cycles, commission and the enterprise vehicle cap", () => {
  const shipperMonth = plan("shipper-pro-monthly");
  const shipperYear = plan("shipper-pro-annual");
  const carrierMonth = plan("carrier-pro-monthly");
  const carrierYear = plan("carrier-pro-annual");
  const carrierEnterprise = plan("carrier-enterprise");
  const shipperEnterprise = plan("shipper-enterprise");
  const carrierBusiness = plan("carrier-business");

  assert.equal(shipperMonth.priceVnd, 799_000);
  assert.equal(priceBlock(shipperMonth).amount, formatVnd(799_000));
  assert.equal(priceBlock(shipperMonth).cycle, "Mỗi tháng");
  assert.equal(commissionText(shipperMonth), "4%");
  assert.equal(vehicleCapText(shipperMonth), null);

  assert.equal(shipperYear.priceVnd, 7_990_000);
  assert.equal(priceBlock(shipperYear).cycle, "Mỗi năm");
  assert.equal(commissionText(shipperYear), "3,5%");

  assert.equal(carrierMonth.priceVnd, 999_000);
  assert.equal(priceBlock(carrierMonth).cycle, "Mỗi tháng");
  assert.equal(carrierMonth.vehicleCap, 10);
  assert.equal(vehicleCapText(carrierMonth), "10 xe ACTIVE");
  assert.equal(carrierYear.priceVnd, 9_990_000);
  assert.equal(priceBlock(carrierYear).cycle, "Mỗi năm");
  assert.equal(vehicleCapText(plan("carrier-free")), "2 xe ACTIVE");
  assert.equal(carrierBusiness.priceVnd, 2_990_000);
  assert.equal(carrierBusiness.rateBps, 300);
  assert.equal(carrierBusiness.billingCycle, "MONTH");
  assert.equal(carrierBusiness.vehicleCap, 30);
  assert.equal(carrierBusiness.quoteRequired, false);
  assert.equal(priceBlock(carrierBusiness).quoted, false);
  assert.equal(priceBlock(carrierBusiness).amount, formatVnd(2_990_000));
  assert.equal(priceBlock(carrierBusiness).cycle, "Mỗi tháng");
  assert.equal(commissionText(carrierBusiness), "3%");
  assert.equal(vehicleCapText(carrierBusiness), "30 xe ACTIVE");

  assert.equal(carrierEnterprise.priceVnd, 7_990_000);
  assert.equal(carrierEnterprise.rateBps, 200);
  assert.equal(carrierEnterprise.billingCycle, "MONTH");
  assert.equal(carrierEnterprise.vehicleCap, 100);
  assert.equal(carrierEnterprise.quoteRequired, false);
  assert.equal(priceBlock(carrierEnterprise).amount, formatVnd(7_990_000));
  assert.equal(priceBlock(carrierEnterprise).cycle, "Mỗi tháng");
  assert.equal(commissionText(carrierEnterprise), "2%");
  assert.equal(vehicleCapText(carrierEnterprise), "100 xe ACTIVE");

  assert.equal(shipperEnterprise.priceVnd, 6_990_000);
  assert.equal(shipperEnterprise.rateBps, 250);
  assert.equal(shipperEnterprise.billingCycle, "MONTH");
  assert.equal(shipperEnterprise.vehicleCap, null);
  assert.equal(shipperEnterprise.quoteRequired, false);
  assert.equal(priceBlock(shipperEnterprise).amount, formatVnd(6_990_000));
  assert.equal(priceBlock(shipperEnterprise).cycle, "Mỗi tháng");
  assert.equal(commissionText(shipperEnterprise), "2,5%");
  assert.equal(vehicleCapText(shipperEnterprise), null);
  assert.equal(priceBlock(shipperEnterprise).quoted, false);
  assert.equal(catalog.some((item) => item.code === "shipper-enterprise-annual"), false);

  assert.equal(isProPlan(shipperMonth), true);
  assert.equal(isProPlan(carrierEnterprise), false);
  assert.equal(planTitle(shipperMonth), "Pro tháng");
  assert.equal(planTitle(shipperYear), "Pro năm");
  assert.equal(activeVehicleText(3, null), "3 xe ACTIVE · trần theo hợp đồng");
  assert.equal(activeVehicleText(1, 2), "1 / 2 xe ACTIVE");
  assert.match(paymentNote(catalog) ?? "", /chưa thu tiền/i);
  assert.equal(termCopy(null, new Date()).label, "Không thời hạn");
  assert.equal(termCopy("2000-01-01T00:00:00.000Z", new Date()).label, "Đã hết hạn");

  const rendered = catalog.flatMap((item) => [priceBlock(item).amount, priceBlock(item).cycle, commissionText(item), vehicleCapText(item) ?? ""]).join("\n");
  assert.doesNotMatch(rendered, /Không áp trần|Không giới hạn|Premium|giảm|thanh toán thành công/i);
});

test("package entry points stay in the header, landing page, footer and role sidebars", () => {
  const root = new URL("../../web/src/", import.meta.url);
  const header = readFileSync(new URL("components/layout/SiteHeader.tsx", root), "utf8");
  const landing = readFileSync(new URL("features/guest/home/FinalCTA.tsx", root), "utf8");
  const footer = readFileSync(new URL("components/layout/SiteFooter.tsx", root), "utf8");
  const layout = readFileSync(new URL("components/layout/WorkspaceLayout.tsx", root), "utf8");
  assert.match(header, /publicPackageNav/);
  assert.match(landing, /publicPackageNav/);
  assert.match(landing, /Xem gói dịch vụ/);
  assert.match(footer, /Gói dịch vụ/);
  assert.match(footer, /paths\.packages/);
  assert.match(layout, /shipperPlan/);
  assert.match(layout, /carrierPlan/);
  const navigationStart = layout.indexOf("const navigation");
  const driverNav = layout.slice(layout.indexOf("DRIVER:", navigationStart), layout.indexOf("ADMIN:", navigationStart));
  assert.equal(driverNav.includes("Plan"), false);
  assert.equal(driverNav.includes("goi"), false);
});

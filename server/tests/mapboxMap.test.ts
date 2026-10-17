import assert from "node:assert/strict";
import test from "node:test";
import { bindLiveMap, presentLocation, readPublicMapboxToken, toMapboxPosition, type LngLat, type MapHandle } from "../../web/src/features/workspace/gps/mapPresentation.ts";

test("map coordinates use longitude then latitude", () => {
  assert.deepEqual(toMapboxPosition(10.7769, 106.7009), [106.7009, 10.7769]);
  assert.equal(toMapboxPosition(undefined, 106), null);
  assert.equal(toMapboxPosition(10, undefined), null);
  assert.equal(toMapboxPosition(Number.NaN, 106), null);
  assert.equal(toMapboxPosition(91, 106), null);
  assert.equal(toMapboxPosition(10, 181), null);
  assert.equal(presentLocation({ apiProblem: false, phase: "current", latitude: 91, longitude: 106, token: "pk.public-example", webglSupported: true, loadFailed: false }).kind, "waiting");
});

test("location presentation keeps stale, ended, missing and failed states honest", () => {
  assert.deepEqual(presentLocation({ apiProblem: false, phase: "not_started", latitude: 10, longitude: 106, token: "pk.public-example", webglSupported: true, loadFailed: false }), { kind: "inactive" });
  assert.deepEqual(presentLocation({ apiProblem: false, phase: "waiting_for_fix", latitude: null, longitude: null, token: "pk.public-example", webglSupported: true, loadFailed: false }), { kind: "waiting" });
  assert.deepEqual(presentLocation({ apiProblem: true, phase: "current", latitude: 10, longitude: 106, token: "pk.public-example", webglSupported: true, loadFailed: false }), { kind: "api_error" });

  const current = presentLocation({ apiProblem: false, phase: "current", latitude: 10.5, longitude: 106.7, token: "pk.public-example", webglSupported: true, loadFailed: false });
  assert.equal(current.kind, "coordinates");
  if (current.kind === "coordinates") {
    assert.deepEqual(current.position, [106.7, 10.5]);
    assert.equal(current.tone, "current");
    assert.equal(current.map, "ready");
  }

  const stale = presentLocation({ apiProblem: false, phase: "stale", latitude: 10.5, longitude: 106.7, token: "pk.public-example", webglSupported: true, loadFailed: false });
  assert.equal(stale.kind, "coordinates");
  if (stale.kind === "coordinates") assert.equal(stale.tone, "stale");
  const ended = presentLocation({ apiProblem: false, phase: "ended", latitude: 10.5, longitude: 106.7, token: "pk.public-example", webglSupported: true, loadFailed: false });
  assert.equal(ended.kind, "coordinates");
  if (ended.kind === "coordinates") assert.equal(ended.tone, "historical");
  assert.equal(presentLocation({ apiProblem: false, phase: "ended", latitude: null, longitude: null, token: "pk.public-example", webglSupported: true, loadFailed: false }).kind, "inactive");

  const missingToken = presentLocation({ apiProblem: false, phase: "current", latitude: 10, longitude: 106, token: null, webglSupported: true, loadFailed: false });
  assert.equal(missingToken.kind, "coordinates");
  if (missingToken.kind === "coordinates") assert.equal(missingToken.map, "missing_token");
  const webgl = presentLocation({ apiProblem: false, phase: "current", latitude: 10, longitude: 106, token: "pk.public-example", webglSupported: false, loadFailed: false });
  assert.equal(webgl.kind, "coordinates");
  if (webgl.kind === "coordinates") assert.equal(webgl.map, "webgl");
  const failed = presentLocation({ apiProblem: false, phase: "current", latitude: 10, longitude: 106, token: "pk.public-example", webglSupported: true, loadFailed: true });
  assert.equal(failed.kind, "coordinates");
  if (failed.kind === "coordinates") assert.equal(failed.map, "load_failed");
});

test("only a public pk token is accepted", () => {
  assert.equal(readPublicMapboxToken("pk.public-example"), "pk.public-example");
  assert.equal(readPublicMapboxToken("  pk.public-example  "), "pk.public-example");
  assert.equal(readPublicMapboxToken("sk.secret-example"), null);
  assert.equal(readPublicMapboxToken("pk."), null);
  assert.equal(readPublicMapboxToken(""), null);
  assert.equal(readPublicMapboxToken(undefined), null);
});

test("a location poll moves the marker without creating another map", () => {
  const positions: LngLat[] = [];
  let removed = 0;
  const session = bindLiveMap((initial) => {
    const handle: MapHandle = {
      setPosition(position) {
        positions.push(position);
      },
      recenter(position) {
        positions.push(position);
      },
      remove() {
        removed += 1;
      },
    };
    positions.push(initial);
    return handle;
  });

  session.sync([106.1, 10.1]);
  session.sync([106.2, 10.2]);
  session.sync([106.3, 10.3]);
  assert.equal(session.creates, 1);
  assert.equal(session.alive, true);
  assert.deepEqual(positions, [
    [106.1, 10.1],
    [106.2, 10.2],
    [106.3, 10.3],
  ]);
  session.sync(null);
  assert.equal(session.creates, 1);
  session.destroy();
  assert.equal(session.alive, false);
  assert.equal(removed, 1);
  session.destroy();
  assert.equal(removed, 1);
});

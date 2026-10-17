import assert from "node:assert/strict";
import test from "node:test";
import { composerAction } from "../../web/src/features/workspace/chat/composer.ts";

test("Enter sends, Shift+Enter stays a newline, and IME composition does not send", () => {
  assert.equal(composerAction({ key: "Enter", shiftKey: false, isComposing: false, keyCode: 13 }), "send");
  assert.equal(composerAction({ key: "Enter", shiftKey: true, isComposing: false, keyCode: 13 }), "newline");
  assert.equal(composerAction({ key: "Enter", shiftKey: false, isComposing: true, keyCode: 13 }), "ignore");
  assert.equal(composerAction({ key: "Enter", shiftKey: false, isComposing: false, keyCode: 229 }), "ignore");
  assert.equal(composerAction({ key: "a", shiftKey: false, isComposing: false, keyCode: 65 }), "ignore");
});

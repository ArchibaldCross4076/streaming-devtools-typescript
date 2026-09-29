import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticFor } from "../src/devtools_stream.js";

test("empty model output becomes an error diagnostic", () => {
  assert.deepEqual(diagnosticFor("   "), {
    type: "diagnostic",
    level: "error",
    message: "Model returned no output"
  });
});

test("non-empty output becomes an informational diagnostic", () => {
  assert.equal(diagnosticFor("ship it").level, "info");
});

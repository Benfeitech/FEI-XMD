import test from "node:test";
import assert from "node:assert/strict";

import {
  extractApiText,
  unicodeBox,
  withPoweredFooter
} from "../lib/api-client.js";

test("extracts text from common AI response shapes", () => {
  assert.equal(extractApiText({ response: "hello" }), "hello");
  assert.equal(extractApiText({ data: { answer: "world" } }), "world");
  assert.equal(extractApiText({ result: "done" }), "done");
});

test("formats WhatsApp output and appends the Benfei Tech footer", () => {
  const boxed = unicodeBox("AI RESULT", "A useful answer.", { footer: false });
  assert.ok(boxed.includes("AI RESULT"));
  assert.ok(boxed.includes("A useful answer."));
  assert.ok(withPoweredFooter(boxed).includes("ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴇɴꜰᴇɪ ᴛᴇᴄʜ"));
});

test("rejects an empty text response", () => {
  assert.throws(() => extractApiText({ data: {} }), /text response/);
});

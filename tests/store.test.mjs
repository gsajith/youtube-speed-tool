// Store rules that fail a submission or quietly break a listing. CHROMEWEBSTORE.md explains them.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFile(path.join(root, file));

test("the manifest name and description fit the store limits", async () => {
  const manifest = JSON.parse(await read("src/manifest.json"));
  assert.ok(manifest.name.length <= 75, `name is ${manifest.name.length} characters, the limit is 75`);
  // Chrome's short description limit. Firefox's summary allows 250, so this covers both.
  assert.ok(
    manifest.description.length <= 132,
    `description is ${manifest.description.length} characters, the limit is 132`,
  );
});

test("the detailed description is plain text within Chrome's limit", async () => {
  const description = (await read("store/description.txt")).toString();
  assert.ok(description.length <= 16_000, `description.txt is ${description.length} characters`);
  // Both stores show markdown syntax as literal characters.
  assert.doesNotMatch(description, /\*\*|^#+ |\]\(/m, "description.txt contains markdown");
});

test("every store image exists at the size the store requires", async () => {
  const images = {
    "store/icon-128.png": [128, 128],
    "store/screenshot-1.png": [1280, 800],
    "store/screenshot-2.png": [1280, 800],
    "store/screenshot-3.png": [1280, 800],
    "store/promo-440x280.png": [440, 280],
  };
  for (const [file, [width, height]] of Object.entries(images)) {
    const png = await read(file);
    // A PNG's width and height are the big-endian integers at bytes 16 and 20.
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [width, height], file);
  }
});

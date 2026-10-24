// Loads the unpacked extension into Playwright's Chromium and drives it on a local test page.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const extensionDir = path.join(root, "src");
const clip = await readFile(path.join(root, "tests/fixtures/clip.webm"));

const PAGE = `<!doctype html>
<body style="margin: 0">
  <video src="/clip.webm" muted loop autoplay playsinline width="640" height="360"
    style="display: block; margin: 40px"></video>
  <input id="text" />
</body>`;

let context;
let extensionId;
let page;

const playbackRate = () => page.$eval("video", (v) => v.playbackRate);
const expectRate = async (expected) => assert.equal(await playbackRate(), expected);

before(async () => {
  context = await chromium.launchPersistentContext("", {
    channel: "chromium", // The full build; the headless shell can't load extensions.
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
  });
  // Content scripts only match http(s), so serve the test page from a fake https origin.
  await context.route("https://test.local/**", (route) =>
    new URL(route.request().url()).pathname === "/clip.webm"
      ? route.fulfill({ body: clip, contentType: "video/webm" })
      : route.fulfill({ body: PAGE, contentType: "text/html" }),
  );
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  extensionId = new URL(worker.url()).host;
});

after(() => context.close());

beforeEach(async () => {
  await page?.close();
  page = await context.newPage();
  await page.goto("https://test.local/");
  await page.locator(".rate").waitFor({ state: "attached" });
});

test("keyboard shortcuts change and reset the speed", async () => {
  await page.keyboard.press("=");
  await page.keyboard.press("=");
  await expectRate(1.5);
  await page.keyboard.press("-");
  await expectRate(1.25);
  await page.keyboard.press("*");
  await expectRate(1);
});

test("typing in a text field leaves the speed alone", async () => {
  await page.click("#text");
  await page.keyboard.press("=");
  await expectRate(1);
  assert.equal(await page.inputValue("#text"), "=");
});

test("the control appears on hover and its buttons work", async () => {
  const pill = page.locator(".pill");
  await assert.doesNotReject(pill.waitFor({ state: "hidden" }));
  await page.hover("video");
  await pill.waitFor({ state: "visible" });
  await page.click(".inc");
  await expectRate(1.25);
  // The label follows the video's ratechange event, which fires asynchronously.
  await page.locator(".rate", { hasText: "1.25x" }).waitFor();
  await page.click(".rate");
  await expectRate(1);
});

test("stepping from a rate the site set lands back on 1x plus whole steps", async () => {
  await page.$eval("video", (v) => (v.playbackRate = 1.4));
  await page.keyboard.press("=");
  await expectRate(1.5);
  await page.$eval("video", (v) => (v.playbackRate = 1.12));
  await page.keyboard.press("-");
  await expectRate(1);
});

test("a small video that starts playing doesn't take over the shortcuts", async () => {
  await page.evaluate(async () => {
    const preview = Object.assign(document.createElement("video"), { src: "/clip.webm", muted: true });
    preview.style.cssText = "width: 120px; height: 68px";
    document.body.append(preview);
    await preview.play();
  });
  await page.keyboard.press("=");
  await expectRate(1.25);
});

test("an always-on control comes back after its video was hidden", async () => {
  const worker = context.serviceWorkers()[0];
  await worker.evaluate(() => chrome.storage.sync.set({ display: "always" }));
  const pill = page.locator(".pill");
  await pill.waitFor({ state: "visible" });
  await page.$eval("video", (v) => (v.style.display = "none"));
  await pill.waitFor({ state: "hidden" });
  await page.$eval("video", (v) => (v.style.display = "block"));
  await pill.waitFor({ state: "visible", timeout: 2000 });
  await worker.evaluate(() => chrome.storage.sync.clear());
});

test("time saved is recorded while watching faster", async () => {
  await page.$eval("video", (v) => (v.playbackRate = 4));
  // Build up some saved time first: Chrome may pause video-only media once this tab is in the
  // background. The content script saves every 10 seconds, or sooner when the tab is hidden.
  await page.waitForTimeout(2000);
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForFunction(() => document.getElementById("time-saved").textContent !== "0s", null, {
    timeout: 15_000,
  });
  await options.close();
});

test("turning off the buttons removes them from the mode previews", async () => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  const visibleCount = (selector) =>
    options.locator(selector).evaluateAll((els) => els.filter((el) => el.checkVisibility()).length);
  await options.locator(".preview .gear").first().waitFor({ state: "visible" });
  await options.click('[data-setting="showSpeedButtons"]');
  await options.click('[data-setting="showSettingsButton"]');
  assert.equal(await visibleCount(".preview .step"), 0);
  assert.equal(await visibleCount(".preview .gear"), 0);
  assert.equal(await visibleCount(".preview b"), 2); // The speed itself stays.
  await options.close();
  await context.serviceWorkers()[0].evaluate(() => chrome.storage.sync.clear());
});

test("speed only on hover: the buttons hide but the speed still shows", async () => {
  await context.serviceWorkers()[0].evaluate(() =>
    chrome.storage.sync.set({ showSpeedButtons: false, showSettingsButton: false }),
  );
  await page.hover("video");
  await page.locator(".rate").waitFor({ state: "visible" });
  assert.equal(await page.locator(".inc").isVisible(), false);
  assert.equal(await page.locator(".gear").isVisible(), false);
  await context.serviceWorkers()[0].evaluate(() => chrome.storage.sync.clear());
});

test("changes on the options page apply to open videos", async () => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.click("text=Always");
  await options.click('[data-setting="increaseKey"]');
  await options.keyboard.press("ArrowUp");
  assert.equal(await options.textContent('[data-setting="increaseKey"]'), "↑");
  await options.close();

  await page.bringToFront();
  await page.mouse.move(0, 0);
  await page.locator(".pill").waitFor({ state: "visible" });
  await page.keyboard.press("ArrowUp");
  await expectRate(1.25);

  await context.serviceWorkers()[0].evaluate(() => chrome.storage.sync.clear());
});

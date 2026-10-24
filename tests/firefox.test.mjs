// Installs the extension into the local Firefox as a temporary add-on over WebDriver BiDi.
// Playwright can't load extensions into Firefox, so this file uses puppeteer-core.
// Set FIREFOX_PATH to point at a different Firefox binary.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { after, before, test } from "node:test";
import puppeteer from "puppeteer-core";

const firefoxPath = process.env.FIREFOX_PATH ?? "/Applications/Firefox.app/Contents/MacOS/firefox";
// Skip when Firefox isn't installed, unless FIREFOX_PATH names it, as CI does. Then a missing
// binary fails the run instead of passing quietly.
const skip = !process.env.FIREFOX_PATH && !existsSync(firefoxPath);
const root = path.resolve(import.meta.dirname, "..");
const clip = await readFile(path.join(root, "tests/fixtures/clip.webm"));

const PAGE = `<!doctype html>
<body style="margin: 0">
  <video src="/clip.webm" muted loop autoplay playsinline width="640" height="360"
    style="display: block; margin: 40px"></video>
</body>`;

let server;
let browser;
let page;
const playbackRate = () => page.$eval("video", (v) => v.playbackRate);

before(async () => {
  if (skip) return;
  server = http.createServer((req, res) => {
    const isClip = req.url === "/clip.webm";
    res.writeHead(200, { "content-type": isClip ? "video/webm" : "text/html" });
    res.end(isClip ? clip : PAGE);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await puppeteer.launch({ browser: "firefox", executablePath: firefoxPath, headless: true });
  await browser.installExtension(path.join(root, "src"));
  page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForSelector("pierce/.rate");
});

after(async () => {
  await browser?.close();
  server?.close();
});

test("shortcuts and the control work in Firefox", { skip }, async () => {
  await page.keyboard.press("=");
  await page.keyboard.press("=");
  assert.equal(await playbackRate(), 1.5);
  await page.keyboard.press("*");
  assert.equal(await playbackRate(), 1);

  await page.hover("video");
  await page.waitForSelector("pierce/.pill", { visible: true });
  await page.click("pierce/.inc");
  assert.equal(await playbackRate(), 1.25);
});

test("the settings button opens the options page in Firefox", { skip }, async () => {
  const opened = new Promise((resolve) => browser.once("targetcreated", resolve));
  await page.click("pierce/.gear");
  await opened;
});

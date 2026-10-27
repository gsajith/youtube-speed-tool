// Renders the store screenshots and promo tile into store/. The speed control in each shot is
// the real extension, loaded into Playwright's Chromium. Run: npm run store-assets
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const extensionDir = path.join(root, "src");
const out = path.join(root, "store");

// A sunset over hills, used as the poster of every fake video.
const POSTER = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2b1b4a"/><stop offset="0.55" stop-color="#c2456b"/><stop offset="1" stop-color="#f6a35b"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <circle cx="860" cy="430" r="120" fill="#ffd28a" opacity="0.9"/>
  <path d="M0 470 C200 400 340 430 520 380 S880 330 1280 420 V720 H0Z" fill="#7a2f5c"/>
  <path d="M0 540 C180 500 380 520 560 480 S960 450 1280 520 V720 H0Z" fill="#4e1f4a"/>
  <path d="M0 620 C220 590 460 610 700 580 S1080 570 1280 610 V720 H0Z" fill="#2a1233"/>
</svg>`)}`;

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; width: 1280px; height: 800px; overflow: hidden;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  .player { position: relative; border-radius: 14px; overflow: hidden; background: #000;
    box-shadow: 0 24px 60px rgb(0 0 0 / 0.45); }
  .player video { display: block; width: 100%; height: 100%; object-fit: cover; }
  .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 48px; display: flex; align-items: center;
    gap: 14px; padding: 0 16px; background: linear-gradient(transparent, rgb(0 0 0 / 0.6)); color: #fff; font-size: 13px; }
  .bar .track { flex: 1; height: 4px; border-radius: 2px; background: rgb(255 255 255 / 0.3); }
  .bar .track i { display: block; width: 38%; height: 100%; border-radius: 2px; background: #f2604c; }
  .play { width: 0; height: 0; border-left: 12px solid #fff; border-top: 8px solid transparent; border-bottom: 8px solid transparent; }
  h1 { margin: 0 0 18px; font-size: 54px; line-height: 1.05; letter-spacing: -0.02em; }
  p.sub { margin: 0; font-size: 22px; line-height: 1.4; }
`;

const player = (width, height, time) => `
  <div class="player" style="width: ${width}px; height: ${height}px">
    <video poster="${POSTER}"></video>
    <div class="bar"><span class="play"></span><span>${time}</span><span class="track"><i></i></span></div>
  </div>`;

const SCENES = {
  // 1: the keys and the control.
  keys: () => `<style>${BASE_CSS}
    body { display: flex; align-items: center; gap: 64px; padding: 0 72px; background: #141312; color: #f1efec; }
    .copy { flex: 0 0 380px; }
    .sub { color: #a19d97; }
    .keys { display: flex; gap: 18px; margin-top: 40px; }
    .key { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #a19d97; font-size: 16px; }
    kbd { display: grid; place-items: center; width: 72px; height: 72px; border: 1px solid #3a3835; border-bottom-width: 4px;
      border-radius: 14px; background: #24221f; color: #fff; font: 600 34px ui-monospace, Menlo, monospace; }
  </style>
  <div class="copy">
    <h1>Watch a <span style="white-space: nowrap">40-minute</span> video in 20.</h1>
    <p class="sub">Press + to speed up and - to slow down. The speed shows right on the video.</p>
    <div class="keys">
      <div class="key"><kbd>−</kbd>slower</div>
      <div class="key"><kbd>+</kbd>faster</div>
    </div>
  </div>
  ${player(704, 396, "14:20 / 40:00")}`,

  // 2: the settings page, captured separately and dropped in.
  settings: (image) => `<style>${BASE_CSS}
    body { display: flex; align-items: center; gap: 56px; padding: 0 72px; background: #f6f5f3; color: #1c1b1a; }
    .copy { flex: 0 0 360px; }
    .sub { color: #6b6864; }
    .shot { flex: 1; height: 720px; overflow: hidden; border: 1px solid #e6e3df; border-radius: 14px;
      box-shadow: 0 24px 60px rgb(0 0 0 / 0.12); background: #f6f5f3; }
    .shot img { display: block; width: 100%; }
  </style>
  <div class="copy">
    <h1>See the hours you've saved.</h1>
    <p class="sub">The settings page keeps a running total. It's also where you pick your keys, the step and where the control sits.</p>
  </div>
  <div class="shot"><img src="${image}" alt="" /></div>`,

  // 3: a site that isn't YouTube, with the control in another position and style.
  anywhere: () => `<style>${BASE_CSS}
    body { background: #eef1f5; color: #1d2430; }
    nav { display: flex; align-items: center; gap: 28px; height: 64px; padding: 0 56px; background: #fff;
      border-bottom: 1px solid #dde3ea; font-size: 15px; color: #56627a; }
    nav b { color: #1d2430; font-size: 18px; margin-right: 12px; }
    main { display: flex; gap: 48px; padding: 40px 56px; }
    .lesson { flex: 0 0 760px; }
    .lesson small { color: #56627a; font-size: 15px; }
    .lesson h2 { margin: 6px 0 20px; font-size: 28px; }
    .side { flex: 1; padding-top: 96px; }
    .side h1 { font-size: 46px; }
    .side .sub { color: #56627a; font-size: 20px; }
  </style>
  <nav><b>Coursebook</b><span>Courses</span><span>Paths</span><span>Notes</span></nav>
  <main>
    <div class="lesson">
      <small>Intro to algorithms · Lesson 4 of 12</small>
      <h2>Recursion, step by step</h2>
      ${player(760, 428, "8:02 / 41:55")}
    </div>
    <div class="side">
      <h1>Even on sites with no speed menu.</h1>
      <p class="sub">Course sites, news clips, players embedded in blogs, and YouTube. The same two keys work on all of them.</p>
    </div>
  </main>`,

  promo: () => `<style>${BASE_CSS}
    body { width: 440px; height: 280px; display: flex; flex-direction: column; justify-content: center; gap: 14px;
      padding: 0 36px; background: linear-gradient(135deg, #f25840, #b8281a); color: #fff; }
    .row { display: flex; align-items: center; gap: 14px; }
    .row img { width: 56px; height: 56px; border-radius: 12px; box-shadow: 0 6px 16px rgb(0 0 0 / 0.25); }
    .row b { font-size: 30px; letter-spacing: -0.01em; }
    p { margin: 0; font-size: 18px; line-height: 1.35; }
    p.pitch { font-size: 28px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em; }
    kbd { display: inline-grid; place-items: center; min-width: 30px; height: 30px; padding: 0 6px; border-radius: 7px;
      background: rgb(255 255 255 / 0.2); font: 600 18px ui-monospace, Menlo, monospace; }
  </style>
  <div class="row"><img src="/icon.png" alt="" /><b>Video Speed Tool</b></div>
  <p class="pitch">Watch videos in<br />half the time.</p>
  <p><kbd>+</kbd> faster &nbsp; <kbd>−</kbd> slower</p>`,
};

const context = await chromium.launchPersistentContext("", {
  channel: "chromium",
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
});
const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
const extensionId = new URL(worker.url()).host;
const setSettings = (settings) =>
  worker.evaluate(async (s) => {
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(s);
  }, settings);

let settingsImage = "";
await context.route("https://store.local/**", (route) => {
  const { pathname } = new URL(route.request().url());
  if (pathname === "/icon.png") return route.fulfill({ path: path.join(extensionDir, "icons/icon-128.png") });
  const scene = SCENES[pathname.slice(1)];
  return route.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset="utf-8">${scene(settingsImage)}` });
});

async function shoot(name, file, { rate, settings = {}, size } = {}) {
  await setSettings({ display: "always", ...settings });
  const page = await context.newPage();
  if (size) await page.setViewportSize(size);
  await page.goto(`https://store.local/${name}`);
  if (rate) {
    await page.locator(".rate").waitFor({ state: "attached" });
    await page.$eval("video", (v, r) => (v.playbackRate = r), rate);
    await page.locator(".rate", { hasText: `${rate}x` }).waitFor();
  }
  await page.waitForTimeout(400); // Let the fade-in finish.
  await page.screenshot({ path: path.join(out, file) });
  await page.close();
  console.log(`wrote store/${file}`);
}

await mkdir(out, { recursive: true });

// The settings page, at the size it appears in screenshot 2, with a sample time-saved total.
await setSettings({});
await worker.evaluate(() => chrome.storage.local.set({ timeSaved: 2 * 3600 + 14 * 60 }));
const options = await context.newPage();
await options.setViewportSize({ width: 760, height: 1100 });
await options.goto(`chrome-extension://${extensionId}/options.html`);
await options.waitForTimeout(300);
settingsImage = `data:image/png;base64,${(await options.screenshot({ clip: { x: 40, y: 0, width: 680, height: 1100 } })).toString("base64")}`;
await options.close();

await shoot("keys", "screenshot-1.png", { rate: 2 });
await shoot("settings", "screenshot-2.png");
await shoot("anywhere", "screenshot-3.png", {
  rate: 2,
  settings: { position: "bottom-left", showSpeedButtons: false, showSettingsButton: false },
});
await shoot("promo", "promo-440x280.png", { size: { width: 440, height: 280 } });

await setSettings({});
await worker.evaluate(() => chrome.storage.local.clear());
await context.close();

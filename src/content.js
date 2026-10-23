// Styles for the on-video control. They live in its shadow root.
const OVERLAY_CSS = `
  :host { all: initial; }
  .frame {
    position: fixed;
    z-index: 2147483647;
    display: flex;
    box-sizing: border-box;
    padding: 10px;
    pointer-events: none;
  }
  .top { align-items: flex-start; }
  .bottom { align-items: flex-end; }
  .left { justify-content: flex-start; }
  .middle { justify-content: center; }
  .right { justify-content: flex-end; }
  .pill {
    display: flex;
    align-items: stretch;
    height: 28px;
    overflow: hidden;
    border-radius: 8px;
    background: rgb(15 15 15 / 0.8);
    box-shadow: 0 1px 6px rgb(0 0 0 / 0.35);
    color: #fff;
    font: 500 13px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    opacity: 0;
    visibility: hidden;
  }
  .show .pill { opacity: 1; visibility: visible; pointer-events: auto; }
  .fade .pill { transition: opacity 0.2s, visibility 0.2s; }
  button {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0 9px;
    cursor: pointer;
    color: rgb(255 255 255 / 0.72);
    font-size: 15px;
  }
  button:hover { background: rgb(255 255 255 / 0.14); color: #fff; }
  .rate {
    min-width: 2.6em;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .gear { font-size: 18px; }
  .simple .dec, .simple .inc, .simple .gear, .no-gear .gear { display: none; }
`;

// Runs in every frame of every http(s) page. Attaches one speed control to the "active" video:
// the one that last started playing, or the largest one on the page.
(async () => {
  const MIN_RATE = 0.0625; // Browser limits for playbackRate.
  const MAX_RATE = 16;
  const FLASH_MS = 300; // How long a hidden control shows after the speed changes.
  const MIN_VIDEO_WIDTH = 160; // Skip thumbnails and tiny previews.
  const MIN_VIDEO_HEIGHT = 90;
  const WHEEL_THRESHOLD = 50; // Pixels of scroll per speed step, so trackpads don't race.

  const settings = await loadSettings();
  let video = null;
  let hovering = false;
  let flashUntil = 0;
  let wheelDelta = 0;
  let unsavedSeconds = 0;
  const lastTimes = new WeakMap(); // video -> currentTime at its previous timeupdate

  // Overlay. Built with DOM calls inside a shadow root so page CSS can't reach it.
  const host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = OVERLAY_CSS;
  const frame = element("div", "frame");
  const pill = element("div", "pill");
  const dec = element("button", "dec", "«", "Slower");
  const rate = element("button", "rate", "1x", "Reset to 1x");
  const inc = element("button", "inc", "»", "Faster");
  const gear = element("button", "gear", "⚙︎", "Speed settings");
  pill.append(dec, rate, inc, gear);
  frame.append(pill);
  root.append(style, frame);

  dec.addEventListener("click", () => video && stepRate(video, -1));
  inc.addEventListener("click", () => video && stepRate(video, 1));
  rate.addEventListener("click", () => video && setRate(video, 1));
  gear.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "open-options" }).catch(() => {});
  });
  // Keep clicks on the control away from the player (no pause toggle) and keep focus on the
  // page, so Space still reaches the player afterwards.
  for (const type of ["mousedown", "pointerdown", "mouseup", "pointerup", "click", "dblclick"]) {
    pill.addEventListener(type, (e) => {
      if (type === "mousedown") e.preventDefault();
      e.stopPropagation();
    });
  }

  function element(tag, className, text = "", title = "") {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    if (title) el.title = title;
    return el;
  }

  function isVideo(target) {
    return target?.localName === "video";
  }

  function isBig(rect) {
    return rect.width >= MIN_VIDEO_WIDTH && rect.height >= MIN_VIDEO_HEIGHT;
  }

  function contains(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function setVideo(next) {
    if (next === video) return;
    video = next;
    rate.textContent = formatRate(video.playbackRate);
    mount();
  }

  // The current video, or the largest one on the page if we don't have one yet.
  function activeVideo() {
    if (video?.isConnected) return video;
    let best = null;
    let bestArea = 0;
    for (const v of document.querySelectorAll("video")) {
      const { width, height } = v.getBoundingClientRect();
      if (width * height > bestArea) [best, bestArea] = [v, width * height];
    }
    if (best) setVideo(best);
    return best;
  }

  function videoAt(x, y) {
    const found = [video, ...document.querySelectorAll("video")].find(
      (v) => v?.isConnected && contains(v.getBoundingClientRect(), x, y),
    );
    if (found) setVideo(found);
    return found;
  }

  function setRate(v, next) {
    v.playbackRate = Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(next * 10000) / 10000));
  }

  // Snap to a multiple of the step, so a rate clamped at the minimum climbs back to round numbers.
  function stepRate(v, direction) {
    const { step } = settings;
    setRate(v, Math.round((v.playbackRate + direction * step) / step) * step);
  }

  function formatRate(r) {
    return `${Number(r.toFixed(2))}x`;
  }

  // Fullscreen only paints the fullscreen element's subtree, so the overlay moves inside it.
  function mount() {
    const fs = document.fullscreenElement;
    const parent = fs && fs !== video && fs.contains(video) ? fs : document.documentElement;
    if (host.parentNode !== parent) parent.append(host);
    schedule();
  }

  function applySettings() {
    frame.className = ["frame", ...settings.position.split("-"), settings.display].join(" ");
    frame.classList.toggle("fade", settings.fade);
    frame.classList.toggle("no-gear", !settings.showSettingsButton);
    schedule();
  }

  function render() {
    const rect = video?.isConnected ? video.getBoundingClientRect() : null;
    if (!rect || !isBig(rect)) {
      frame.classList.remove("show");
      frame.style.display = "none";
      return;
    }
    const { display } = settings;
    const show =
      display === "always" ||
      display === "simple" ||
      (display === "hover" && (hovering || Date.now() < flashUntil));
    frame.style.display = "";
    frame.style.left = `${rect.left}px`;
    frame.style.top = `${rect.top}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    frame.classList.toggle("show", show);
  }

  // Follow the video every frame while the control is visible: players move and resize
  // (theater mode, scrolling, mini players) without telling anyone.
  let frameRequested = false;
  function schedule() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
      frameRequested = false;
      render();
      if (frame.classList.contains("show")) schedule();
    });
  }

  function isTyping(e) {
    const el = e.composedPath()[0];
    return Boolean(el?.isContentEditable || /^(input|textarea|select)$/.test(el?.localName));
  }

  async function saveTimeSaved() {
    if (unsavedSeconds <= 0) return;
    const seconds = unsavedSeconds;
    unsavedSeconds = 0;
    try {
      const { timeSaved } = await chrome.storage.local.get({ timeSaved: 0 });
      await chrome.storage.local.set({ timeSaved: timeSaved + seconds });
    } catch {
      // The extension was reloaded or removed, so this copy of the script can't save anymore.
    }
  }

  // Media events don't bubble, but they do pass through the capture phase on document.
  document.addEventListener("play", (e) => isVideo(e.target) && setVideo(e.target), true);

  document.addEventListener(
    "ratechange",
    (e) => {
      if (e.target !== video) return;
      rate.textContent = formatRate(video.playbackRate);
      flashUntil = Date.now() + FLASH_MS;
      schedule();
    },
    true,
  );

  document.addEventListener("seeking", (e) => lastTimes.delete(e.target), true);

  document.addEventListener(
    "timeupdate",
    (e) => {
      const v = e.target;
      if (!isVideo(v)) return;
      // Catches videos that were already playing when this script loaded.
      if (!video?.isConnected && !v.paused) setVideo(v);
      const previous = lastTimes.get(v);
      lastTimes.set(v, v.currentTime);
      const watched = v.currentTime - (previous ?? v.currentTime);
      // Watching N seconds of video at rate r takes N / r seconds. A jump bigger than one
      // second of wall time is a seek or a stall, not playback.
      if (v.playbackRate > 1 && watched > 0 && watched < v.playbackRate) {
        unsavedSeconds += watched * (1 - 1 / v.playbackRate);
      }
    },
    true,
  );

  document.addEventListener("fullscreenchange", mount);

  document.addEventListener(
    "mousemove",
    (e) => {
      const inside = Boolean(video?.isConnected && contains(video.getBoundingClientRect(), e.clientX, e.clientY));
      if (inside === hovering) return;
      hovering = inside;
      schedule();
    },
    { passive: true },
  );

  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget || !hovering) return; // The pointer left the window.
    hovering = false;
    schedule();
  });

  // Capture on window runs before the page's own handlers, so these keys don't also trigger
  // site shortcuts (YouTube uses + and - for caption size).
  addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e)) return;
      const action = {
        [settings.increaseKey]: "faster",
        [settings.decreaseKey]: "slower",
        [settings.resetKey]: "reset",
      }[e.key];
      if (!action) return;
      const v = activeVideo();
      if (!v) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (action === "reset") setRate(v, 1);
      else stepRate(v, action === "faster" ? 1 : -1);
    },
    true,
  );

  addEventListener(
    "wheel",
    (e) => {
      if (!settings.shiftScroll || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      const v = videoAt(e.clientX, e.clientY);
      if (!v) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // macOS turns Shift+vertical scroll into horizontal scroll, so read whichever axis moved.
      // Firefox reports mouse wheels in lines (deltaMode 1) instead of pixels.
      wheelDelta += (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 33 : 1);
      if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) return;
      stepRate(v, wheelDelta < 0 ? 1 : -1);
      wheelDelta = 0;
    },
    { capture: true, passive: false },
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in DEFAULT_SETTINGS) settings[key] = newValue ?? DEFAULT_SETTINGS[key];
    }
    applySettings();
  });

  setInterval(saveTimeSaved, 10_000);
  addEventListener("pagehide", saveTimeSaved);
  document.addEventListener("visibilitychange", () => document.hidden && saveTimeSaved());

  applySettings();
  activeVideo();
})();

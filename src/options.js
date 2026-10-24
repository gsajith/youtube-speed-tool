const KEY_SETTINGS = ["increaseKey", "decreaseKey", "resetKey"];
const KEY_LABELS = { " ": "Space", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" };
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn", "OS", "Dead"]);

const stepInput = document.getElementById("step");
const status = document.getElementById("status");
const keyButtons = document.querySelectorAll(".key");
let settings = { ...DEFAULT_SETTINGS };
let capturing = null; // the shortcut button waiting for a key press
let statusTimer;

function keyLabel(key) {
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function render() {
  for (const button of keyButtons) {
    if (button !== capturing) button.textContent = keyLabel(settings[button.dataset.setting]);
  }
  for (const box of document.querySelectorAll("input[type=checkbox][data-setting]")) {
    box.checked = settings[box.dataset.setting];
  }
  stepInput.value = settings.step;
  // The mode previews mirror the real control's buttons.
  document.body.classList.toggle("no-speed-buttons", !settings.showSpeedButtons);
  document.body.classList.toggle("no-gear", !settings.showSettingsButton);
  for (const name of ["display", "position"]) {
    document.querySelector(`input[name=${name}][value="${settings[name]}"]`).checked = true;
  }
}

async function save(patch) {
  Object.assign(settings, patch);
  render();
  await chrome.storage.sync.set(patch);
  status.textContent = "Saved.";
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (status.textContent = ""), 1500);
}

function stopCapturing() {
  capturing?.classList.remove("listening");
  capturing = null;
  render();
}

for (const button of keyButtons) {
  button.addEventListener("click", () => {
    stopCapturing();
    capturing = button;
    button.classList.add("listening");
    button.textContent = "Press a key…";
  });
  button.addEventListener("blur", () => button === capturing && stopCapturing());
}

document.addEventListener("keydown", (e) => {
  if (!capturing || MODIFIER_KEYS.has(e.key)) return;
  // Tab moves focus as usual, which cancels the capture. Ctrl, Alt and Cmd combos are skipped
  // because the content script ignores keys pressed with them.
  if (e.key === "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  const button = capturing;
  stopCapturing();
  button.blur();
  if (e.key === "Escape") return;
  const setting = button.dataset.setting;
  const patch = { [setting]: e.key };
  // Swap rather than leave two actions on one key.
  const clash = KEY_SETTINGS.find((k) => k !== setting && settings[k] === e.key);
  if (clash) patch[clash] = settings[setting];
  save(patch);
});

stepInput.addEventListener("change", () => {
  const step = Number(stepInput.value);
  if (step >= 0.05 && step <= 4) save({ step });
  else render();
});

for (const box of document.querySelectorAll("input[type=checkbox][data-setting]")) {
  box.addEventListener("change", () => save({ [box.dataset.setting]: box.checked }));
}

for (const radio of document.querySelectorAll("input[type=radio]")) {
  radio.addEventListener("change", () => save({ [radio.name]: radio.value }));
}

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.sync.clear();
  settings = { ...DEFAULT_SETTINGS };
  render();
  status.textContent = "Defaults restored.";
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.timeSaved) {
    document.getElementById("time-saved").textContent = formatDuration(changes.timeSaved.newValue ?? 0);
  }
});

(async () => {
  settings = await loadSettings();
  render();
  requestAnimationFrame(() => document.body.classList.add("ready"));
  const { timeSaved } = await chrome.storage.local.get({ timeSaved: 0 });
  document.getElementById("time-saved").textContent = formatDuration(timeSaved);
})();

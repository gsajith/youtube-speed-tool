// Shared by content.js and options.js. Loaded as a classic script, so it publishes through
// globalThis: top-level const isn't reliably shared between content scripts in Firefox.
globalThis.DEFAULT_SETTINGS = Object.freeze({
  increaseKey: "=", // The unshifted + key on most layouts.
  decreaseKey: "-",
  step: 0.25,
  display: "hover", // "hover" | "always" | "never"
  position: "top-right", // "top" or "bottom", then "left", "middle" or "right"
  showSpeedButtons: true, // The « and » buttons. With both buttons off, only the speed shows.
  showSettingsButton: true,
  fade: true,
});

// Shift turns = into + and - into _. Each pair counts as one key, so a shortcut works whether or
// not Shift is held.
globalThis.unshiftedKey = (key) => ({ "+": "=", _: "-" })[key] ?? key;

// Passing the defaults to get() fills in any key the user hasn't changed.
globalThis.loadSettings = async () => {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  // Version 0.1.0 had a "simple" mode. It's now "always" with both buttons off.
  if (settings.display === "simple") {
    Object.assign(settings, { display: "always", showSpeedButtons: false, showSettingsButton: false });
  }
  return settings;
};

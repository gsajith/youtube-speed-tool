// Shared by content.js and options.js. Loaded as a classic script, so it publishes through
// globalThis: top-level const isn't reliably shared between content scripts in Firefox.
globalThis.DEFAULT_SETTINGS = Object.freeze({
  increaseKey: "+",
  decreaseKey: "-",
  resetKey: "*",
  step: 0.25,
  display: "hover", // "always" | "hover" | "simple" | "never"
  position: "top-right", // "top" or "bottom", then "left", "middle" or "right"
  showSettingsButton: true,
  fade: true,
  shiftScroll: true,
});

// Passing the defaults to get() fills in any key the user hasn't changed.
globalThis.loadSettings = () => chrome.storage.sync.get(DEFAULT_SETTINGS);

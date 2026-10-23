// Content scripts report time saved here. Chaining the writes stops two reports that arrive
// together from reading the same total and overwriting each other. Losing the chain when the
// service worker stops is harmless: every write it held has finished by then.
let pendingWrite = Promise.resolve();

function addTimeSaved(seconds) {
  pendingWrite = pendingWrite
    .then(async () => {
      const { timeSaved } = await chrome.storage.local.get({ timeSaved: 0 });
      await chrome.storage.local.set({ timeSaved: timeSaved + seconds });
    })
    .catch((error) => console.error("Couldn't save time saved", error));
}

chrome.runtime.onMessage.addListener((message) => {
  // Content scripts can't open the options page themselves, so the overlay's gear asks us to.
  if (message?.type === "open-options") chrome.runtime.openOptionsPage();
  if (message?.type === "time-saved" && Number.isFinite(message.seconds)) addTimeSaved(message.seconds);
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

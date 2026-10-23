// Content scripts can't open the options page themselves, so the overlay's gear asks us to.
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "open-options") chrome.runtime.openOptionsPage();
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

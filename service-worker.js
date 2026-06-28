// service-worker.js
// Listens for extension icon clicks and messages the content script to toggle Kindle mode.

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.tabs.sendMessage(tab.id, { action: "toggle-kindle" });
});

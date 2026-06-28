// content/main.js
// Entry point — listens for toggle messages from the service worker and wires modules together.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggle-kindle") {
    KindlingReader.toggle().then((isActive) => {
      sendResponse({ active: isActive });
    });
    return true; // Keep message channel open for async response
  }
});

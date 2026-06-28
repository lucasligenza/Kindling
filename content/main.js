// content/main.js
// Entry point — listens for toggle messages from the service worker.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggle-kindle") {
    // Will be wired up in later tasks
    console.log("Kindling: toggle received");
  }
});

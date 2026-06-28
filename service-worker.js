// service-worker.js
// Listens for extension icon clicks, messages the content script, manages badge state.

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "toggle-kindle",
    });
    if (response && response.active) {
      chrome.action.setBadgeText({ tabId: tab.id, text: "ON" });
      chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: "#D4CCBB",
      });
    } else {
      chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    }
  } catch (e) {
    // Content script not loaded on this page (e.g., chrome:// pages)
    console.log("Kindling: Cannot activate on this page");
  }
});

// This is a minimal content script that will be injected into pages
// It establishes a connection with the extension
console.log("Screenshot extension content script loaded");

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getPageInfo") {
    sendResponse({ title: document.title, url: window.location.href });
  }
  return true;
});

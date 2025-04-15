// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Handle screenshot capture request
    if (message.type === 'captureRequest') {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Check if tabs exist
        if (!tabs || tabs.length === 0) {
          chrome.runtime.sendMessage({
            type: 'apiResponse',
            data: { error: "Could not find active tab. Please try again." }
          });
          return;
        }
        
        const currentTab = tabs[0];
        
        // Check if tab has URL (it should, but being safe)
        if (!currentTab || !currentTab.url) {
          chrome.runtime.sendMessage({
            type: 'apiResponse',
            data: { error: "Could not determine current page URL. Please try again." }
          });
          return;
        }
        
        // Check if the current URL is a restricted one
        const currentUrl = currentTab.url;
        if (currentUrl.startsWith('chrome://') || 
            currentUrl.startsWith('chrome-extension://') ||
            currentUrl.startsWith('https://chrome.google.com/webstore')) {
          // Send error message back to popup
          chrome.runtime.sendMessage({
            type: 'apiResponse',
            data: { 
              error: "Can't capture screenshots of Chrome system pages. Please try on a regular website."
            }
          });
          return;
        }
        
        // Proceed with screenshot for allowed pages
        try {
          chrome.tabs.captureVisibleTab(
            currentTab.windowId,
            {format: 'png'},
            function(dataUrl) {
              if (chrome.runtime.lastError) {
                chrome.runtime.sendMessage({
                  type: 'apiResponse',
                  data: { error: chrome.runtime.lastError.message }
                });
              } else if (!dataUrl) {
                chrome.runtime.sendMessage({
                  type: 'apiResponse',
                  data: { error: "Failed to capture screenshot. Please try again." }
                });
              } else {
                // Send screenshot data back to popup
                chrome.runtime.sendMessage({
                  type: 'screenshot',
                  data: dataUrl
                });
              }
            }
          );
        } catch (error) {
          chrome.runtime.sendMessage({
            type: 'apiResponse',
            data: { error: error.message || "Unknown error capturing screenshot" }
          });
        }
      });
    }
    
    // Handle API request
    if (message.type === 'sendToAPI') {
      // Extract data from message
      const apiUrl = message.apiUrl;
      const imageData = message.imageData;
      
      if (!apiUrl || !imageData) {
        chrome.runtime.sendMessage({
          type: 'apiResponse',
          data: { error: "Missing API URL or image data" }
        });
        return;
      }
      
      try {
        // Create form data with the image
        const formData = new FormData();
        const blob = base64ToBlob(imageData, 'image/png');
        formData.append('image', blob, 'screenshot.png');
        
        // Make the API request
        fetch(apiUrl, {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          // Send API response back to popup
          chrome.runtime.sendMessage({
            type: 'apiResponse',
            data: data
          });
        })
        .catch(error => {
          chrome.runtime.sendMessage({
            type: 'apiResponse',
            data: { error: error.message || "API request failed" }
          });
        });
      } catch (error) {
        chrome.runtime.sendMessage({
          type: 'apiResponse',
          data: { error: error.message || "Error processing image data" }
        });
      }
    }
  });
  
  // Helper function to convert base64 to blob
  function base64ToBlob(base64, mimeType) {
    try {
      const byteCharacters = atob(base64);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      return new Blob(byteArrays, {type: mimeType});
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      throw error;
    }
  }
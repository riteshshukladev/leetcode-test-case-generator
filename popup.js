// Global variables
let screenshotData = null;

// Initialize API Key
const API_KEY = CONFIG.API_KEY; // Replace with your actual API key
const MODEL_ID = "gemini-2.0-flash"; // Replace with the correct Gemini model ID
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

// Function to call the Gemini API with an image
async function callGeminiWithImage(imageBase64) {
  try {
    // Construct the request body with the image and prompt
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Generate diverse test cases (trivial, edge cases, challenging scenarios) for the provided LeetCode problem with inputs, expected outputs and brief explanations without revealing any solution hints or approaches.",
            },
            {
              inlineData: {
                data: imageBase64, // base64 encoded image data
                mimeType: "image/png", // Ensure this matches the image type
              },
            },
          ],
        },
      ],
    };

    // Make the API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log(data);
    // Return the first candidate's response (assuming it exists)
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No candidates returned from the Gemini API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

// DOMContentLoaded event to initialize the behavior of the popup
document.addEventListener("DOMContentLoaded", function () {
  const captureButton = document.getElementById("captureButton");
  const fileUpload = document.getElementById("fileUpload");
  const sendButton = document.getElementById("sendButton");
  const preview = document.getElementById("preview");
  const response = document.getElementById("response");
  const loading = document.getElementById("loading");

  const previewContainer = document.getElementById("previewContainer");
  const removeImage = document.getElementById("removeImage");

  // Function to reset the image state
  function resetImage() {
    screenshotData = null;
    preview.src = "";
    previewContainer.style.display = "none";
    sendButton.style.display = "none";
    response.style.display = "none";
  }

  // Add click handler for the remove icon
  removeImage.addEventListener("click", resetImage);

  // Handle screenshot capture
  captureButton.addEventListener("click", function () {
    loading.style.display = "block";
    response.style.display = "none";

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        showError("No active tab found");
        return;
      }

      try {
        chrome.tabs.captureVisibleTab(
          null,
          { format: "png" },
          function (dataUrl) {
            if (chrome.runtime.lastError) {
              showError(chrome.runtime.lastError.message);
            } else if (dataUrl) {
              screenshotData = dataUrl;
              preview.src = dataUrl;
              previewContainer.style.display = "block";
              sendButton.style.display = "block";
              loading.style.display = "none";
            } else {
              showError("Failed to capture screenshot");
            }
          }
        );
      } catch (e) {
        showError("Error: " + e.message);
      }
    });
  });

  // Handle file upload
  fileUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        screenshotData = event.target.result;
        preview.src = screenshotData;
        previewContainer.style.display = "block";
        sendButton.style.display = "block";
        response.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle sending the image to the Gemini API
  sendButton.addEventListener("click", async function () {
    if (screenshotData) {
      loading.style.display = "block";
      response.style.display = "none";

      try {
        // Get base64 data without the prefix (e.g., "data:image/png;base64,")
        const base64Data = screenshotData.split(",")[1];

        // Call Gemini API and get the response
        const result = await callGeminiWithImage(base64Data);

        // Format and display the response
        loading.style.display = "none";
        response.innerHTML = formatTestCases(result);
        response.style.display = "block";
      } catch (error) {
        showError(error.message);
      }
    }
  });

  // Format test cases with proper styling
  function formatTestCases(text) {
    const lines = text.split("\n");
    let formattedHtml = `<div style="font-family: system-ui, -apple-system, sans-serif;">`;
    let inScenarioBlock = false;
    let inStepsBlock = false;

    lines.forEach((line) => {
      if (line.trim()) {
        // Test Case Headers
        if (line.toLowerCase().includes("test case")) {
          formattedHtml += `
            <h3 style="
              color: #e09797; 
              margin: 15px 0 10px 0;
              font-size: 16px;
              border-bottom: 2px solid #e09797;
              padding-bottom: 5px;
              font-weight: 600;
            ">${line}</h3>`;
        }
        // Scenario blocks
        else if (line.toLowerCase().includes("scenario:")) {
          inScenarioBlock = true;
          formattedHtml += `
            <div style="
              background-color: #f8f0f0;
              padding: 8px 12px;
              border-left: 3px solid #e09797;
              margin: 8px 0;
              border-radius: 0 4px 4px 0;
            ">
            <strong style="color: #333;">${line}</strong><br>`;
        }
        // Steps or Expected Results blocks
        else if (
          line.toLowerCase().includes("steps:") ||
          line.toLowerCase().includes("expected:")
        ) {
          if (inScenarioBlock) {
            formattedHtml += `</div>`;
            inScenarioBlock = false;
          }
          inStepsBlock = true;
          formattedHtml += `
            <div style="
              margin: 8px 0;
              padding-left: 15px;
            ">
            <strong style="
              color: #333;
              font-size: 14px;
              display: block;
              margin-bottom: 5px;
            ">${line}</strong>`;
        }
        // Regular list items
        else if (
          line.trim().startsWith("*") ||
          line.trim().startsWith("-") ||
          /^\d+\./.test(line)
        ) {
          formattedHtml += `
            <div style="
              padding-left: ${inStepsBlock ? "15px" : "0"};
              margin: 4px 0;
              color: #444;
              font-size: 14px;
            ">${line}</div>`;
        }
        // Regular text
        else {
          if (inScenarioBlock || inStepsBlock) {
            formattedHtml += `<div style="margin: 4px 0; color: #444; font-size: 14px;">${line}</div>`;
          } else {
            formattedHtml += `${line}<br>`;
          }
        }
      }
    });

    // Close any open blocks
    if (inScenarioBlock || inStepsBlock) {
      formattedHtml += `</div>`;
    }

    formattedHtml += `</div>`;
    return formattedHtml;
  }

  // Helper function to show errors
  function showError(message) {
    loading.style.display = "none";
    response.textContent = "Error: " + message;
    response.style.color = "#d32f2f";
    response.style.display = "block";
  }
});

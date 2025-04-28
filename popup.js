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
              text: `Generate diverse test cases (trivial, edge cases, challenging scenarios) for the provided LeetCode problem. 
            For each test case, return ONLY a JSON array of objects with the following keys: 
            "questionNo" (number), "input" (string), "output" (string), and "explanation" (string). 
            Do NOT include any extra text or markdown, only the JSON array. 
            Example format:
            [
              {
                "questionNo": 1,
                "input": "Input: [1,2,3]",
                "output": "Output: [6]",
                "explanation": "The sum of the array elements is calculated."
              },
              {
                "questionNo": 2,
                "input": "Input: [1,2,3,4]",
                "output": "Output: [10]",
                "explanation": "The sum of the array elements is calculated."
              }
            ]
              Note :- don't append this "input" :- or "output in response, above is for demo, just return this like this,
              {
                1,
                "[1,2,3]",
                "[6]",
                "The sum of the array elements is calculated."
              },
            `,
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
    try {
      // Clean the response text to remove any markdown or unwanted characters
      const cleanedText = text
        .replace(/```json\s*/g, "") // Remove "```json" block start
        .replace(/```/g, "") // Remove "```" block end
        .trim(); // Remove leading/trailing spaces

      // Now safely parse the cleaned response into JSON
      const testCases = JSON.parse(cleanedText);

      let formattedHtml = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">`;

      testCases.forEach((testCase, index) => {
        const caseColor = `hsl(${(index * 35) % 360}, 70%, 85%)`;

        // Format each test case with distinct colors and styles
        formattedHtml += `
          <div style="
          
            border-radius: 10px;
            padding: 16px 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            border-left: 4px solid #e09797;
          ">
            <span style="
              color: black;
              font-size:14px;
              font-weight: bold;
              padding-bottom: 4px;
              border-bottom: 2px solid #e09797;
              margin-bottom: 8px;
              font-family: monospace;

            ">Case:- ${testCase.questionNo}</span>
  
            <div style="font-size: 16px; font-weight: 700; color: #333; margin-bottom: 12px; font-family: monospace;">
              <strong style="color:black !important; font-weight: 800;">Input:</strong> ${
                testCase.input
              }
            </div>
  
            <div style="font-size: 16px; font-weight: 700; color: #333; margin-bottom: 12px; font-family: monospace;">
              <strong style="color:black !important; font-weight: 800;">Expected Output:</strong> ${
                testCase.output
              }
            </div>
  
            <div style="font-size: 14px; color: #555; margin-bottom: 12px; font-family: monospace;">
              <strong style="color:black !important; font-weight: 800; style="font-size: 16px !important;">Explanation:</strong> ${
                testCase.explanation || "No explanation provided."
              }
            </div>
          </div>
          <hr style="border: 1px solid #e09797; margin: 16px 0;" />
        `;
      });

      formattedHtml += `</div>`;
      return formattedHtml;
    } catch (error) {
      console.error("Error formatting test cases:", error);
      return "Error formatting test cases: " + error.message;
    }
  }

  // Helper function to show errors
  function showError(message) {
    loading.style.display = "none";
    response.textContent = "Error: " + message;
    response.style.color = "#d32f2f";
    response.style.display = "block";
  }
});

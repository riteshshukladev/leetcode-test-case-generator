class GoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  getGenerativeModel({ model }) {
    return {
      generateContent: async (prompt) => {
        try {
          // Updated endpoint to check correct Gemini endpoint and version
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText?key=${this.apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(prompt),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.candidates && data.candidates.length > 0) {
            return {
              response: {
                text: () => data.candidates[0].content,
              },
            };
          } else {
            throw new Error("No candidates returned from API.");
          }
        } catch (error) {
          throw new Error(`API request failed: ${error.message}`);
        }
      },
    };
  }
}

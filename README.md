# Leetcode AI-Test Case Generator

This Chrome extension generates diverse test cases for Leetcode problems using Google Gemini AI.  
It allows you to take a screenshot or upload an image of a Leetcode problem and get AI-generated test cases, including edge cases and explanations.

---

## Features

- Capture a screenshot of the current Leetcode problem page
- Upload a screenshot/image from your computer
- Send the image to Google Gemini AI and receive structured test cases
- Beautiful, readable UI and formatted output

---

## Setup & Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd case-gen

2. **Create your API key file:**

After cloning, create a file named config.js in the root directory:
``
const CONFIG = {
  API_KEY: "YOUR_GEMINI_API_KEY"
};
``

Do NOT commit this file. It is listed in .gitignore for your security.
3. **(Optional) Add a .env file for local reference:**

This is not used directly by the extension, but can help you keep track of your key:
``
API_KEY="YOUR_GEMINI_API_KEY"
``

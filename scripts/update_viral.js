const fs = require('fs');
const path = require('path');

const locales = ['en', 'es', 'hi', 'pt', 'de', 'id'];

const newToolsContent = {
  "pii-redactor": {
    whatIs: "The PII & Privacy Redactor is a secure, browser-based tool that automatically detects and masks personally identifiable information (PII) like emails, phone numbers, IP addresses, and credit cards from any text.",
    whyChoose: [
      { icon: "🛡️", title: "100% Local Processing", description: "Your sensitive data never leaves your browser. It is processed entirely on your machine." },
      { icon: "👁️", title: "Instant Visual Masking", description: "See your data redacted in real-time as you paste it, with full control over what gets masked." },
      { icon: "⚡", title: "ChatGPT-Safe", description: "Perfect for scrubbing API keys and customer data before pasting text into AI tools like ChatGPT." }
    ],
    useCases: [
      { title: "Scrubbing Code for ChatGPT", description: "Remove API keys, tokens, and internal IPs from code snippets before asking AI for help." },
      { title: "Redacting Customer Logs", description: "Clean support logs of emails and phone numbers before sharing them with developers." },
      { title: "Sanitizing Data Dumps", description: "Ensure privacy compliance by masking credit cards and addresses in database exports." }
    ],
    faqs: [
      { question: "Does this tool upload my sensitive data?", answer: "No! All redaction happens using JavaScript running locally in your browser. We have no servers to receive your data." },
      { question: "What types of PII can it detect?", answer: "It detects emails, phone numbers, IPv4 addresses, URLs, and standard credit card patterns." },
      { question: "Can I choose the replacement characters?", answer: "Yes, you can choose solid blocks (███), asterisks (***), or label tags like [REDACTED_EMAIL]." }
    ],
    relatedSearches: ["remove pii from text online", "redact emails from code", "hide ip addresses in logs", "chatgpt data scrubber", "local privacy redactor tool"]
  },
  "prompt-minifier": {
    whatIs: "The LLM Prompt Token Minifier is a tool designed to aggressively shrink text, code, and prompts by removing unnecessary spaces, newlines, and comments, saving you money on API token costs.",
    whyChoose: [
      { icon: "💰", title: "Save API Costs", description: "Reduce your token usage by up to 30% by stripping non-essential characters from massive prompts." },
      { icon: "⚙️", title: "Customizable Stripping", description: "Choose to remove newlines, extra spaces, code comments, or even filler words." },
      { icon: "📊", title: "Live Token Savings", description: "See exactly how many tokens and characters you are saving in real-time." }
    ],
    useCases: [
      { title: "System Prompt Optimization", description: "Minify massive 10,000-word system instructions before sending them to GPT-4 or Claude APIs." },
      { title: "Code Context Reduction", description: "Strip all comments and whitespace from source code before feeding it into an LLM." },
      { title: "Vector Database Embeddings", description: "Clean up text chunks before embedding them in a vector database to save storage space." }
    ],
    faqs: [
      { question: "Will minifying affect the LLM's understanding?", answer: "Modern LLMs do not need line breaks or extra spaces to understand context. Stripping whitespace rarely impacts reasoning capability." },
      { question: "How does it calculate tokens?", answer: "It uses an approximation of 1 token per 4 English characters to estimate your savings instantly." },
      { question: "Is this free to use?", answer: "Yes, our Prompt Minifier is 100% free and runs locally in your browser." }
    ],
    relatedSearches: ["llm prompt minifier", "save chatgpt tokens", "compress prompt text online", "strip comments from code for AI", "reduce api token costs tool"]
  },
  "caption-formatter": {
    whatIs: "The TikTok Caption Formatter takes long scripts and instantly chops them into short, 3-5 word chunks perfectly sized for fast-paced TikTok, YouTube Shorts, or Instagram Reels captions.",
    whyChoose: [
      { icon: "🎬", title: "Creator Focused", description: "Designed specifically for the pacing of modern short-form vertical video." },
      { icon: "📱", title: "Mobile UI Preview", description: "Visualize exactly how your captions will look on a phone screen before you edit." },
      { icon: "⚡", title: "Instant Chunking", description: "Stop hitting 'Enter' manually in Premiere Pro. Let our tool chop the script for you." }
    ],
    useCases: [
      { title: "TikTok & Shorts Editing", description: "Prepare your script for easy copy-pasting into CapCut or Premiere Pro text layers." },
      { title: "MrBeast-Style Subtitles", description: "Use the ALL CAPS mode to create highly engaging, high-retention subtitles." },
      { title: "Teleprompter Formatting", description: "Format scripts into easy-to-read, double-spaced chunks for teleprompter apps." }
    ],
    faqs: [
      { question: "How many words per chunk is best?", answer: "For fast-paced TikToks and Shorts, 3 to 5 words per chunk is currently the optimal length for audience retention." },
      { question: "Can I export this as an SRT file?", answer: "Currently, it outputs raw text chunks. SRT export is coming in a future update!" },
      { question: "Is the data sent to a server?", answer: "No, all formatting is done locally in your browser, keeping your unreleased scripts private." }
    ],
    relatedSearches: ["tiktok caption formatter", "youtube shorts script chunker", "format text for capcut subtitles", "mrbeast subtitle generator", "break text into lines online"]
  },
  "json-to-markdown": {
    whatIs: "The JSON to Markdown Table converter takes raw JSON or API responses and instantly transforms them into clean, copy-pasteable Markdown tables perfect for Notion, GitHub, or Obsidian.",
    whyChoose: [
      { icon: "📝", title: "1-Click Copy to Notion", description: "Paste your JSON, and click one button to get a table ready for Notion or Markdown editors." },
      { icon: "📊", title: "Live Data Preview", description: "View your parsed JSON as a beautiful spreadsheet right in the browser." },
      { icon: "⚡", title: "Auto-Flattening", description: "Automatically extracts headers and flattens simple nested JSON structures." }
    ],
    useCases: [
      { title: "API Response Documentation", description: "Paste a JSON response from Postman directly into GitHub PRs as a clean table." },
      { title: "Notion Database Import", description: "Convert raw data into a Markdown table that can be pasted directly into a Notion page." },
      { title: "ChatGPT Data Formatting", description: "Take JSON arrays generated by ChatGPT and turn them into readable tables." }
    ],
    faqs: [
      { question: "Does it support nested JSON?", answer: "It supports flattening 1-level deep nested objects. For highly complex, deeply nested JSON, it will stringify the sub-objects into the table cell." },
      { question: "What if my JSON is just a single object?", answer: "The tool automatically detects single objects and converts them into a 1-row table for convenience." },
      { question: "Is my JSON data secure?", answer: "Yes! 100% of the conversion happens on your device. We do not track or save your data." }
    ],
    relatedSearches: ["json to markdown table", "convert json array to notion table", "json to github table online", "json to spreadsheet preview", "parse api response to table"]
  }
};

locales.forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', 'content', `${lang}.json`);
  let data = {};
  
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  // Inject the 4 new viral tools
  Object.keys(newToolsContent).forEach(toolSlug => {
    // Note: In production we would use deepL to translate `newToolsContent` per language.
    // Since we don't have translation API here, we will inject the English text for all as placeholder.
    data[toolSlug] = newToolsContent[toolSlug];
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${lang}.json with 4 viral tools`);
});

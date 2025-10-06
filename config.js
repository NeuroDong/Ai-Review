// Front-end configuration (intentionally stored client-side for public/demo use)
// WARNING: Any values here are visible to users. Only put non-sensitive or intentionally-public endpoints.

window.APP_CONFIG = window.APP_CONFIG || {
  // Set this to your free/internal hosted API endpoint (must allow CORS from your GitHub Pages domain)
  HOSTED_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  // Default model to use when none is provided in the UI
  HOSTED_MODEL: 'deepseek/deepseek-chat-v3.1:free',
  // Optional: put a public/free API key here for demo use. THIS IS VISIBLE TO ANYONE.
  // Free API Key from OpenRouter (50 requests/day limit)
  API_KEY: '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',  
};

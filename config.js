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

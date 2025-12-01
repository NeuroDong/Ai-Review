// Front-end configuration (intentionally stored client-side for public/demo use)
// WARNING: Any values here are visible to users. Only put non-sensitive or intentionally-public endpoints.

window.APP_CONFIG = window.APP_CONFIG || {
  // Set this to your free/internal hosted API endpoint (must allow CORS from your GitHub Pages domain)
  // HOSTED_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  HOSTED_API_URL: 'https://api.deepseek.com/chat/completions',
  // VLM (Visual-Language Model) endpoint used to extract PDF text/markdown.
  // Example: 'https://d01169a88c9b.ngrok-free.app'
  VLM_URL: 'https://f91f03179cba.ngrok-free.app',
  // Default model to use when none is provided in the UI
  HOSTED_MODEL: 'deepseek-chat',
  // Optional: put a public/free API key here for demo use. THIS IS VISIBLE TO ANYONE.
  // Free API Key from OpenRouter (50 requests/day limit)
  API_KEY: 'sk-11d2c3c0c8a84f5ebfda7ad3545ee8e0',  
};

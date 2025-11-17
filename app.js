
// UI elements
const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const hostedUrlInput = document.getElementById('hostedUrl');
const modeInputs = document.getElementsByName('mode');
const userKeyArea = document.getElementById('userKeyArea');
const hostedArea = document.getElementById('hostedArea');
const providerSelect = document.getElementById('providerSelect');
// try to locate the model label element by id
const modelLabel = document.getElementById('modelLabel') || (modelInput ? modelInput.previousElementSibling : null);

// Update model label depending on selected provider
function updateModelLabelByProvider() {
  const provider = (providerSelect && providerSelect.value) || 'openrouter';
  if (!modelLabel) return;
  if (provider === 'openrouter') {
    modelLabel.innerHTML = 'Model (e.g., deepseek/deepseek-chat-v3.1:free, click <a href="https://openrouter.ai/models">here</a> for more models)';
  } else {
    modelLabel.textContent = 'Model';
  }
}
if (providerSelect) {
  providerSelect.addEventListener('change', updateModelLabelByProvider);
  // initialize
  updateModelLabelByProvider();
}
const pdfFileInput = document.getElementById('pdfFile');
const fileHint = document.getElementById('fileHint');
// VLM (visual-language model) UI elements
const vlmToggle = document.getElementById('vlmToggle');
const vlmArea = document.getElementById('vlmArea');
const submitVLMBtn = document.getElementById('submitVLMBtn');
const vlmOutput = document.getElementById('vlmOutput');
const vlmStatus = document.getElementById('vlmStatus');
// Debug capture for VLM interactions (populated during submitPdfToVLM)
const vlmDebug = { upload: null, join: null, predict: [] };
// expose for console access
try { window.vlmDebug = vlmDebug; } catch (e) {}
// add small debug UI inside vlmArea for easy copying
function ensureVlmDebugUI() {
  try {
    if (!vlmArea) return;
    // Debug UI removed: keep vlmDebug exposed to window for console access, but do not add elements to the page.
    try { window.vlmDebug = vlmDebug; } catch (e) {}
  } catch (e) { console.warn('ensureVlmDebugUI failed', e); }
}
ensureVlmDebugUI();

// VLM extraction timer: show elapsed time in `vlmStatus` while a VLM request is in progress.
let _vlmTimerInterval = null;
let _vlmTimerStart = 0;
function _formatElapsed(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function startVlmTimer(message) {
  try {
    stopVlmTimer();
    _vlmTimerStart = Date.now();
    if (vlmStatus) vlmStatus.textContent = `${message} Time elapsed: 00:00`;
    _vlmTimerInterval = setInterval(() => {
      const elapsed = Date.now() - _vlmTimerStart;
      if (vlmStatus) vlmStatus.textContent = `${message} Time elapsed: ${_formatElapsed(elapsed)}`;
    }, 1000);
  } catch (e) { console.warn('startVlmTimer failed', e); }
}
function stopVlmTimer() {
  try {
    if (_vlmTimerInterval) { clearInterval(_vlmTimerInterval); _vlmTimerInterval = null; }
  } catch (e) { console.warn('stopVlmTimer failed', e); }
}
// Stop the VLM timer and write a final elapsed time message into the vlmStatus element.
function stopVlmTimerAndShowFinal(message) {
  try {
    const elapsed = _vlmTimerStart ? (Date.now() - _vlmTimerStart) : 0;
    stopVlmTimer();
    if (vlmStatus) {
      const timeStr = _formatElapsed(elapsed);
      if (message) vlmStatus.textContent = `${message} (Duration: ${timeStr})`;
      else vlmStatus.textContent = `Completed in ${timeStr}`;
    }
  } catch (e) { console.warn('stopVlmTimerAndShowFinal failed', e); }
}
const modelNotice = document.getElementById('modelNotice');
const modelDots = document.getElementById('modelDots');
// userQuestionInput removed on purpose (feature removed)
const submitBtn = document.getElementById('submitBtn');
const statusEl = document.getElementById('status');
const responseEl = document.getElementById('response');
const langSelect = document.getElementById('lang');
const exportPdfBtn = document.getElementById('exportPdfBtn');
// Prompting mode controls
const promptModeInputs = document.getElementsByName('promptMode');
const fewshotHint = document.getElementById('fewshotHint');

function getPromptMode() {
  let mode = 'pure';
  if (promptModeInputs && promptModeInputs.length) {
    for (const m of promptModeInputs) { if (m.checked) { mode = m.value; break; } }
  }
  return mode;
}
function updatePromptModeUI() {
  const mode = getPromptMode();
  if (fewshotHint) fewshotHint.style.display = mode === 'fewshot' ? '' : 'none';
}
if (promptModeInputs && promptModeInputs.length) {
  for (const m of promptModeInputs) m.addEventListener('change', updatePromptModeUI);
  updatePromptModeUI();
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// toggle UI areas based on selected mode
function updateModeUI() {
  let mode = 'userKey';
  for (const m of modeInputs) { if (m.checked) { mode = m.value; break; } }
  if (mode === 'userKey') {
    if (userKeyArea) userKeyArea.style.display = '';
    if (hostedArea) hostedArea.style.display = 'none';
    // show model input and its label
    if (modelInput) modelInput.style.display = '';
    if (modelLabel) modelLabel.style.display = '';
  } else {
    if (userKeyArea) userKeyArea.style.display = 'none';
    // For Quick Try: show the hosted hint but hide the actual input and its label so the user sees only the hint text.
    if (hostedArea) hostedArea.style.display = '';
    if (hostedUrlInput) {
      hostedUrlInput.style.display = 'none';
      const hostedLabel = hostedUrlInput.previousElementSibling;
      if (hostedLabel) hostedLabel.style.display = 'none';
    }
    // ensure hint remains visible
    if (hostedArea) {
      const hint = hostedArea.querySelector('.hint');
      if (hint) hint.style.display = '';
    }
    // hide model input and its label in Quick Try/hosted mode
    if (modelInput) modelInput.style.display = 'none';
    if (modelLabel) modelLabel.style.display = 'none';
  }
}
for (const m of modeInputs) { m.addEventListener('change', updateModeUI); }
updateModeUI();

// progress features removed

// Handle file selection: update hint, button state, and show progress UI immediately
pdfFileInput.addEventListener('change', () => {
  const f = pdfFileInput.files[0];
  if (!f) { fileHint.textContent = ''; submitBtn.disabled = true; return; }
  if (f.size > MAX_BYTES) { fileHint.textContent = 'Error: PDF file too large. File must be under 10MB.'; submitBtn.disabled = true; }
  else { fileHint.textContent = `Selected: ${f.name} (${(f.size/1024/1024).toFixed(2)} MB)`; submitBtn.disabled = false; }
});

// VLM toggle: show/hide VLM area
if (vlmToggle) {
  vlmToggle.addEventListener('change', () => {
    if (vlmArea) vlmArea.style.display = vlmToggle.checked ? '' : 'none';
  });
}

// Default VLM base URL: read only from `window.APP_CONFIG.VLM_URL` (set in config.js).
// No hard-coded fallback here by design — configure `VLM_URL` in `config.js`.
const DEFAULT_VLM_URL = (window.APP_CONFIG && window.APP_CONFIG.VLM_URL);

// Try sending PDF to VLM. We attempt a few common endpoint shapes for Gradio/Gradios-style deployments.
async function submitPdfToVLM(file) {
  if (!file) throw new Error('No PDF file provided');
  if (!DEFAULT_VLM_URL) {
    throw new Error('VLM URL not configured. Please set VLM_URL in config.js');
  }
  const base = DEFAULT_VLM_URL.replace(/\/$/, '');
  // First, try the upload -> predict flow commonly used by Gradio apps
  try {
    const uploadUrl = base + '/gradio_api/upload';
    if (vlmStatus) vlmStatus.textContent = `Uploading file to ${uploadUrl} ...`;
    console.log('Attempting Gradio upload flow to', uploadUrl);
    const uploadFd = new FormData();
    try { uploadFd.append('file', file, file.name); } catch (e) {}
    try { uploadFd.append('pdf_file', file, file.name); } catch (e) {}
    const upRes = await fetch(uploadUrl, { method: 'POST', body: uploadFd });
    const upText = await upRes.text();
    // record upload debug
    try { vlmDebug.upload = { status: upRes.status, ok: upRes.ok, text: upText }; } catch (e) {}
    if (upRes.ok) {
      let uploadedRef = null;
      try {
        const upJson = JSON.parse(upText);
        try { vlmDebug.upload.json = upJson; } catch (e) {}
        // typical response is an array of server file paths: ["/tmp/.../blob"]
        if (Array.isArray(upJson) && upJson.length) uploadedRef = upJson[0];
        else if (upJson && upJson[0]) uploadedRef = upJson[0];
        else uploadedRef = upJson;
      } catch (e) {
        // not JSON, use raw text
        uploadedRef = upText;
      }
      console.log('Upload response parsed as', uploadedRef);
      if (uploadedRef) {
        // Attempt to obtain a session_hash via /gradio_api/join (many Gradio apps use session-based flows)
        let sessionHash = null;
        try {
          const joinUrl = base + '/gradio_api/join';
          console.log('Attempting join at', joinUrl);
          const joinRes = await fetch(joinUrl, { method: 'GET' });
          const joinText = await joinRes.text();
          try { vlmDebug.join = { status: joinRes.status, text: joinText, json: JSON.parse(joinText) }; } catch (e) { vlmDebug.join = { status: joinRes.status, text: joinText }; }
          try { const joinJson = JSON.parse(joinText); if (joinJson && joinJson.session_hash) sessionHash = joinJson.session_hash; }
          catch (e) { /* ignore parse */ }
          console.log('join response', joinRes.status, joinText, 'sessionHash=', sessionHash);
        } catch (e) { console.warn('join failed', e); }

        // Now call the predict endpoint(s) with fn_index=0 and data array matching component inputs
        const predictCandidates = [ '/gradio_api/predict', '/gradio_api/queue/predict', '/gradio_api/api/predict', '/gradio_api/predict/0' ];
        const pages = '';
        const dpi = 96;
        const payloadTemplates = [
          (fileRef) => ({ fn_index: 0, data: [fileRef, pages, dpi], session_hash: sessionHash }),
          (fileRef) => ({ fn_index: 0, data: [fileRef, pages, dpi] }),
          (fileRef) => ({ fn_index: 0, data: [{ path: fileRef }, pages, dpi], session_hash: sessionHash }),
          (fileRef) => ({ fn_index: 0, data: [{ name: file.name, url: fileRef }, pages, dpi], session_hash: sessionHash }),
        ];

        for (const ep of predictCandidates) {
          const predictUrl = base + ep;
          if (vlmStatus) vlmStatus.textContent = `Calling predict ${predictUrl} ...`;
          for (const makePayload of payloadTemplates) {
            const payload = makePayload(uploadedRef);
            try {
              console.log('Trying predict', predictUrl, payload);
              const pRes = await fetch(predictUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              const pText = await pRes.text();
              try { vlmDebug.predict.push({ url: predictUrl, status: pRes.status, ok: pRes.ok, text: pText }); } catch (e) {}
              if (!pRes.ok) {
                console.warn('predict attempt non-ok', predictUrl, pRes.status, pText);
                // surface body to UI for easier copying
                if (vlmStatus) vlmStatus.textContent = `Predict ${predictUrl} returned ${pRes.status}: ${pText}`;
                continue;
              }
              try {
                const pJson = JSON.parse(pText);
                const extracted = extractModelText(pJson) || (pJson.data && Array.isArray(pJson.data) ? pJson.data.join('\n') : null);
                if (extracted && extracted.trim()) return { raw: pJson, text: extracted };
                return { raw: pJson, text: JSON.stringify(pJson, null, 2) };
              } catch (e) {
                if (pText && pText.trim()) return { raw: pText, text: pText };
              }
            } catch (e) {
              console.warn('predict fetch failed', predictUrl, e);
              if (vlmStatus) vlmStatus.textContent = `Predict ${predictUrl} failed: ${e && e.message ? e.message : e}`;
            }
          }
        }
      }
    } else {
      console.warn('Upload returned non-ok', upRes.status, upText);
    }
  } catch (e) {
    console.warn('Gradio upload->predict flow failed', e);
    // fallthrough to the generic candidatePaths probing below
  }
  const candidatePaths = [
    // Try the Gradio-style /predict first (matches the example usage from the server)
    // Also include common Gradios/Gradio app prefix '/gradio_api' which many deployments expose
    '/gradio_api/predict',
    '/gradio_api/predict/',
    '/gradio_api/api/predict',
    '/gradio_api/api/predict/',
    '/gradio_api/api/predict/0',
    '/gradio_api/predict/0',
    '/gradio_api/',
    '/predict',
    '/predict/',
    '/api/predict',
    '/api/predict/',
    '/api/predict/0',
    '/',
  ];

  // Build form data with the file. Many Gradio apps accept a multipart form with a file field.
  const form = (path) => {
    const fd = new FormData();
    // Some Gradio demos expect the file field to be named 'pdf_file' (see server example).
    // Add both names to maximize compatibility: 'pdf_file' and 'file'.
    try { fd.append('pdf_file', file, file.name); } catch (e) {}
    try { fd.append('file', file, file.name); } catch (e) {}
    // Include common optional parameters that the VLM might accept
    // (server example used pages and dpi). Leave pages empty to indicate all pages.
    fd.append('pages', '');
    fd.append('dpi', '96');
    // include fn_index if present on server side (some Gradio demos)
    // fd.append('fn_index', '0');
    return fd;
  };

  let lastErr = null;
  // Try endpoints in order until one returns a parsable response
  for (const p of candidatePaths) {
    const url = base + p;
    try {
      if (vlmStatus) vlmStatus.textContent = `Sending to VLM: ${url}`;
      const res = await fetch(url, { method: 'POST', body: form(p) });
      // Some deployments return JSON, others plain text. Capture both.
      const text = await res.text();
      // If the server returned a 404/Not Found, include the raw body in the error path so it's visible.
      if (!res.ok) {
        // return a detailed error-like object so caller can show it
        const errObj = { status: res.status, statusText: res.statusText, body: text };
        // continue to try other candidate paths unless this is the last
        lastErr = new Error(JSON.stringify(errObj));
        // try next candidate
        console.warn('VLM returned non-ok status', errObj, 'for', url);
        continue;
      }
      // Try parse JSON
      try {
        const json = JSON.parse(text);
        // Gradio predict often returns { "data": [ ... ] } or nested outputs. Use existing extractor.
        const extracted = extractModelText(json) || (json.data && Array.isArray(json.data) ? json.data.join('\n') : null);
        if (extracted && extracted.trim()) return { raw: json, text: extracted };
        // If not directly extracted, fall back to text representation
        return { raw: json, text: JSON.stringify(json, null, 2) };
      } catch (e) {
        // Not JSON — treat as plain text
        if (text && text.trim()) {
          return { raw: text, text };
        }
      }
      lastErr = new Error('Empty response from ' + url);
    } catch (e) {
      lastErr = e;
      console.warn('VLM attempt failed for', url, e);
      // try next
    }
  }
  throw lastErr || new Error('All VLM endpoints failed');
}

// Try submitting via the official @gradio/client (preferred for Gradio/Gradios servers)
// This mirrors the server-side example using Client.connect() and client.predict('/predict', ...)
async function submitPdfToVLM_viaGradioClient(file) {
  if (!file) throw new Error('No PDF file provided');
  if (!DEFAULT_VLM_URL) throw new Error('VLM URL not configured');
  const base = DEFAULT_VLM_URL.replace(/\/$/, '') + '/'; // Client.connect expects a trailing slash in the example

  try {
    // Dynamically import the ESM module from unpkg CDN
    const mod = await import('https://unpkg.com/@gradio/client?module');
    const Client = mod && (mod.Client || mod.default?.Client || mod.default) ;
    if (!Client || !Client.connect) {
      throw new Error('Failed to load @gradio/client from CDN');
    }

    // Connect to the Gradio/Gradios app
    const client = await Client.connect(base);
    // Debug: log client object and any api_prefix information to help locate the correct server path
    try {
      console.log('Gradio client connected', client);
      // some client builds expose api_prefix or similar fields
      const apiPrefix = client.api_prefix || client._api_prefix || (client?.appConfig && client.appConfig.api_prefix) || (client?.serverConfig && client.serverConfig.api_prefix);
      if (apiPrefix) console.log('Detected gradio api_prefix:', apiPrefix);
    } catch (e) {
      console.debug('Failed to inspect gradio client for api_prefix', e);
    }

    // Call predict on the /predict endpoint as the server example shows.
    // Use field name 'pdf_file' to match the example. Pass pages='' to indicate all pages and dpi=96.
    const payload = { pdf_file: file, pages: '', dpi: 96 };
    // client.predict can accept File/Blob directly in browser
    const result = await client.predict('/predict', payload);

    // Gradio client returns an object; try to extract useful text
    // Common shape: { data: [...] } where the first element may be text
    if (result && typeof result === 'object') {
      // If result.data is array, join entries into text
      if (Array.isArray(result.data) && result.data.length > 0) {
        const joined = result.data.map(d => (typeof d === 'string' ? d : JSON.stringify(d))).join('\n');
        return { raw: result, text: joined };
      }
      // Fallback: try extractModelText
      const extracted = extractModelText(result);
      if (extracted) return { raw: result, text: extracted };
      return { raw: result, text: JSON.stringify(result, null, 2) };
    }

    // If result is string
    if (typeof result === 'string') return { raw: result, text: result };

    throw new Error('Unexpected result from gradio client: ' + String(result));
  } catch (e) {
    // Normalize important error messages for higher-level handler
    console.warn('Gradio client submission failed', e);
    throw e;
  }
}

// Simple REST API path: call the FastAPI /api/convert endpoint you just added server-side.
async function submitPdfToVLM_viaSimpleAPI(file) {
  if (!file) throw new Error('No PDF file provided');
  if (!DEFAULT_VLM_URL) throw new Error('VLM URL not configured');
  const base = DEFAULT_VLM_URL.replace(/\/$/, '');
  const url = base + '/api/convert';
  try {
    if (vlmStatus) vlmStatus.textContent = `Uploading to simple API: ${url}`;
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('pages', '');
    fd.append('dpi', String(96));
    const res = await fetch(url, { method: 'POST', body: fd });
    const txt = await res.text();
    if (!res.ok) {
      throw new Error(`Simple API returned ${res.status}: ${txt}`);
    }
    try {
      const json = JSON.parse(txt);
      if (json && json.ok && json.markdown) return { raw: json, text: json.markdown };
      if (json && json.markdown) return { raw: json, text: json.markdown };
      return { raw: json, text: JSON.stringify(json, null, 2) };
    } catch (e) {
      // response not JSON
      return { raw: txt, text: txt };
    }
  } catch (e) {
    console.warn('Simple API submission failed', e);
    throw e;
  }
}

// Hook up Submit PDF to VLM button
if (submitVLMBtn) {
  submitVLMBtn.addEventListener('click', async () => {
    const file = pdfFileInput.files[0];
    if (!file) { alert('Please upload a PDF file first'); return; }
    submitVLMBtn.disabled = true;
    if (vlmStatus) vlmStatus.textContent = 'Checking VLM connectivity...';
    try {
      // Quick connectivity check: try a simple GET to the base URL to surface CORS/connection issues early
      if (!DEFAULT_VLM_URL) throw new Error('VLM URL not configured');
      const base = DEFAULT_VLM_URL.replace(/\/$/, '');
      try {
        const probe = await fetch(base, { method: 'GET' });
        if (vlmStatus) vlmStatus.textContent = `VLM reachable (GET ${base}) — status ${probe.status}. Proceeding to upload...`;
      } catch (probeErr) {
        // Probe failed; still attempt upload but surface probe error first
        console.warn('VLM GET probe failed', probeErr);
        if (vlmStatus) vlmStatus.textContent = `VLM GET probe failed: ${probeErr && probeErr.message ? probeErr.message : probeErr}`;
      }

      if (vlmStatus) vlmStatus.textContent = (vlmStatus.textContent || '') + ' Uploading PDF...';
      // Inform user this may take several minutes and start a visible timer
      startVlmTimer('VLM extraction in progress — this may take several minutes.');
      // Try the simple FastAPI /api/convert endpoint first (preferred when server has our wrapper).
      let res;
      try {
        res = await submitPdfToVLM_viaSimpleAPI(file);
        console.log('VLM via simple API succeeded', res);
      } catch (simpleErr) {
        console.warn('Simple API path failed, falling back to Gradio client', simpleErr);
        // If simple API fails, try the Gradio client approach next
        try {
          res = await submitPdfToVLM_viaGradioClient(file);
          console.log('VLM via Gradio client succeeded', res);
        } catch (clientErr) {
          console.warn('Gradio client path failed, falling back to fetch-based uploads', clientErr);
          // Final fallback to the generic fetch/form-based submit
          res = await submitPdfToVLM(file);
        }
      }
  // Place returned markdown/text in the editable textarea so user can modify before sending to reviewer
  if (vlmOutput) vlmOutput.value = (res && res.text) ? res.text : (typeof res.raw === 'string' ? res.raw : JSON.stringify(res.raw, null, 2));
  // Stop the timer and show final duration so the user knows how long extraction took
  stopVlmTimerAndShowFinal('VLM extraction completed');
    } catch (e) {
      console.error('VLM submission failed', e);
      // Provide more actionable UI message for common causes
      // Compute a friendly message and include elapsed time in the UI so user can see how long was spent
      let message = (e && e.message) ? e.message : String(e);
      stopVlmTimerAndShowFinal('VLM error: ' + message);
      if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror')) {
        message += ' — this usually means a network/CORS/SSL issue. Check browser DevTools Network/Console for CORS errors, ensure the VLM server allows cross-origin requests, and that the URL is correct.';
      }
      // Also show an alert so it is obvious
      alert('VLM extraction failed: ' + message + '\nSee console/Network panel for details.');
    } finally {
      stopVlmTimer();
      submitVLMBtn.disabled = false;
    }
  });
}

submitBtn.addEventListener('click', async () => {
  responseEl.textContent = '';
  // prefer user-entered API key, otherwise fallback to config.js provided API_KEY
  const apiKey = (apiKeyInput && apiKeyInput.value.trim()) || (window.APP_CONFIG && window.APP_CONFIG.API_KEY) || '';
  const hostedUrl = hostedUrlInput ? hostedUrlInput.value.trim() : '';
  // prefer model input, otherwise use config default, otherwise fallback
  const model = (modelInput && modelInput.value.trim()) || (window.APP_CONFIG && window.APP_CONFIG.HOSTED_MODEL) || 'gpt-4o-mini';
  const file = pdfFileInput.files[0];

  const useVLM = vlmToggle && vlmToggle.checked;

  // determine mode
  let mode = 'userKey';
  for (const m of modeInputs) { if (m.checked) { mode = m.value; break; } }

  // Debug: show masked API key snippet and provider to help diagnose invalid key issues
  const provider = (providerSelect && providerSelect.value) || 'openrouter';
  try {
    const masked = apiKey ? (apiKey.slice(0,6) + '...' + apiKey.slice(-4)) : '(none)';
    console.log(`Using provider=${provider}, apiKey=${masked}`);
    if (statusEl) statusEl.textContent = `Using provider=${provider}, key=${masked}`;
  } catch (e) {}

  // No OpenAI provider in this build; keep provider-specific checks minimal for OpenRouter/Deepseek

  if (mode === 'userKey' && !apiKey) { alert('Please enter an API Key or configure APP_CONFIG.API_KEY'); return; }
  if (!file) { alert('Please upload a PDF file'); return; }
  if (file.size > MAX_BYTES) { alert('PDF must be under 10MB'); return; }

  submitBtn.disabled = true;
  statusEl.textContent = 'Reading PDF...';
  statusEl.textContent = 'Reading PDF...';
  // show model processing notice later when waiting for model
  // allow one paint so UI updates before heavy work
  await new Promise(requestAnimationFrame);
  try {
    let text = null;
    // If VLM extraction is enabled and user already has VLM output, use it directly.
    if (useVLM) {
      const vlmTxt = (vlmOutput && vlmOutput.value) ? vlmOutput.value.trim() : '';
      if (!vlmTxt) {
        alert('VLM extraction is enabled but no content found. Please click "Submit PDF to VLM" first and wait for results.');
        submitBtn.disabled = false;
        return;
      }
      text = vlmTxt;
      statusEl.textContent = 'Using VLM-extracted content (from editable textarea)';
    } else {
      const arrayBuffer = await file.arrayBuffer();
      statusEl.textContent = 'Extracting PDF text...';
      text = await extractTextFromPDF_fromArrayBuffer(arrayBuffer);
      statusEl.textContent = 'Text extracted, preparing request to model...';
    }

    // Build the messages payload: system prompt (loaded from Prompts) + optional examples + paper text
    const chosenLang = (langSelect && langSelect.value) || 'en';
    const selectedPromptMode = getPromptMode();

    // Load prompt template text from prompts.js based on language & mode
    const systemPromptText = await loadPromptTemplate(chosenLang, selectedPromptMode);
    if (!systemPromptText || !systemPromptText.trim()) {
      const tip = 'Failed to load prompt template. Ensure prompts.js is loaded correctly.';
      throw new Error(tip);
    }

    // If few-shot, try to append example reviews content
    let examplesText = '';
    if (selectedPromptMode === 'fewshot') {
      try {
        // 直接从 prompts.js 中读取 examples，不受浏览器安全限制
        let ex1 = window.getExample ? window.getExample('example-resnet') : '';
        let ex2 = window.getExample ? window.getExample('example-verified') : '';
        
        const MAX_EXAMPLES_CHARS = 40000; // cap combined size to be safe
        const combined = `\n\n[Examples Begin]\n` +
          `# Example Review A (ResNet)\n` + (ex1 || '').trim() + `\n\n` +
          `# Example Review B (Verified)\n` + (ex2 || '').trim() + `\n` +
          `[Examples End]\n`;
        examplesText = combined.length > MAX_EXAMPLES_CHARS
          ? combined.slice(0, MAX_EXAMPLES_CHARS) + '\n...[truncated examples]\n'
          : combined;
      } catch (e) {
        console.warn('Failed to load few-shot examples', e);
      }
    }

    const systemContent = examplesText
      ? `${systemPromptText}\n\n${examplesText}`
      : systemPromptText;
    const systemMessage = { role: 'system', content: systemContent };

    // To avoid huge payloads, we may truncate the paper text if too long. Keep first ~200k chars
    let paperContent = `PDF_CONTENT_BEGIN\n${text}\nPDF_CONTENT_END`;
    const MAX_CHARS = 200000; // arbitrary but reasonable for front-end
    if (paperContent.length > MAX_CHARS) {
      paperContent = paperContent.slice(0, MAX_CHARS) + '\n\n[...truncated, original was longer]';
    }

  const userIntro = `Please answer based on the paper content below. Follow the system prompt instructions to produce the review.\n\n${paperContent}\n`;
    const userMessage = { role: 'user', content: userIntro };

  statusEl.textContent = mode === 'hosted' ? 'Requesting hosted API... (processing may take a while)' : 'Requesting model... (Processing may take a while)';
    // show animated model processing notice
    if (modelNotice) {
      modelNotice.style.display = 'inline';
      startModelDots();
    }
    // call model depending on mode
    let answer;
    if (mode === 'userKey') {
      // read provider selection
      const provider = (providerSelect && providerSelect.value) || 'openrouter';
      if (provider === 'openrouter') {
        answer = await callOpenRouterChat(apiKey, model, [systemMessage, userMessage]);
      } else if (provider === 'deepseek') {
        answer = await callDeepseekChat(apiKey, model, [systemMessage, userMessage]);
      } else {
        // fallback to OpenRouter
        answer = await callOpenRouterChat(apiKey, model, [systemMessage, userMessage]);
      }
    } else {
      // Quick Try: if hostedUrl is provided (hidden), try calling it; otherwise inform user to use their API key or configure hosted API
      // determine final hosted URL: prefer explicit input, then APP_CONFIG, else empty
      const finalHostedUrl = hostedUrl || (window.APP_CONFIG && window.APP_CONFIG.HOSTED_API_URL) || '';
      if (finalHostedUrl) {
        try {
          // Build a best-effort payload that covers common API shapes:
          // - chat-style: { model, messages: [...] }
          // - single-input style: { model, input: '...' } or { prompt: '...' }
          const joinedInput = `[SYSTEM]\n${systemMessage.content}\n\n[USER]\n${paperContent}`;
          // Build two payload shapes: messages-style and prompt-style.
          const messagesPayload = {
            model,
            messages: [systemMessage, userMessage],
            temperature: 0.1,
          };
          const promptPayload = {
            model,
            prompt: joinedInput,
            input: joinedInput,
            temperature: 0.1,
          };

          // Build headers and include Authorization if an API key is available
          const headers = { 'Content-Type': 'application/json' };
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

          // DEBUG: show final hosted URL and headers so the developer can inspect Authorization presence
          // Remove this log after debugging.
          console.log('Quick Try: finalHostedUrl=', finalHostedUrl, 'headers=', headers);

          // Try messages-style first (chat). If server rejects due to both prompt/messages,
          // retry with prompt-style payload.
          let res = await fetch(finalHostedUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(messagesPayload),
          });

          if (!res.ok) {
            const t = await res.text();
            // If server complains about having both prompt and messages, retry with promptPayload
            const lowered = String(t).toLowerCase();
            if (res.status === 400 && (lowered.includes('both "prompt" and "messages"') || lowered.includes('specify "prompt" or "messages"') || lowered.includes('cannot have both "prompt" and "messages"'))) {
              // retry with prompt/input style
              res = await fetch(finalHostedUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(promptPayload),
              });
            } else {
              throw new Error(`Hosted API error ${res.status}: ${t}`);
            }
          }
          if (!res.ok) {
            const t2 = await res.text();
            throw new Error(`Hosted API error ${res.status}: ${t2}`);
          }
          const data = await res.json();
          // Try the robust extractor first; it walks the JSON and finds the most likely assistant text.
          const extracted = extractModelText(data);
          if (extracted && extracted.trim().length > 0) {
            answer = extracted;
          } else {
            // Fallback to some legacy heuristics to maximize compatibility
            if (typeof data === 'string') {
              answer = data;
            } else if (data.review) {
              answer = data.review;
            } else if (data.output_text) {
              answer = data.output_text;
            } else if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
              const choice = data.choices[0];
              if (choice.message && (choice.message.content || (choice.message.content === ''))) {
                answer = choice.message.content || choice.message.text || JSON.stringify(choice.message);
              } else if (choice.text) {
                answer = choice.text;
              } else if (choice.output_text) {
                answer = choice.output_text;
              } else {
                answer = JSON.stringify(choice, null, 2);
              }
            } else if (data.output && Array.isArray(data.output) && data.output[0]) {
              const out0 = data.output[0];
              if (out0.content && Array.isArray(out0.content)) {
                answer = out0.content.map(c => c.text || JSON.stringify(c)).join('\n');
              } else if (out0.text) {
                answer = out0.text;
              } else {
                answer = JSON.stringify(out0, null, 2);
              }
            } else if (data.message && data.message.content) {
              answer = data.message.content;
            } else {
              answer = JSON.stringify(data, null, 2);
            }
          }
        } catch (e) {
          stopModelDots();
          if (modelNotice) modelNotice.style.display = 'none';
          throw e;
        }
      } else {
        // No hosted URL configured and mock review disabled
        throw new Error('API配置不正确！');
      }
    }

    // stop model notice
    stopModelDots();
    if (modelNotice) modelNotice.style.display = 'none';

    statusEl.textContent = 'Completed';
    responseEl.textContent = answer;
    // Enable export button when response exists
    if (exportPdfBtn) exportPdfBtn.disabled = !answer || answer.trim().length === 0;
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error: ' + (err.message || err);
    responseEl.textContent = (err.stack || err.toString());
  } finally {
    submitBtn.disabled = false;
  // no progress UI to hide
  }
});

// Read file with progress callback (percent 0-100)
function readFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    // Try chunked reading for reliable progress updates
    if (file.slice) {
      readFileInChunks(file, onProgress).then(resolve).catch(reject);
      return;
    }
    // Fallback to simple FileReader
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };
    reader.onload = () => {
      // finalization after read
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Read file in chunks (sequential slices) to provide reliable progress events
function readFileInChunks(file, onProgress, chunkSize = 1024 * 256) { // 256KB chunks
  return new Promise((resolve, reject) => {
    const total = file.size;
    let offset = 0;
    const chunks = [];

    function readNext() {
      const end = Math.min(offset + chunkSize, total);
      const slice = file.slice(offset, end);
      const reader = new FileReader();
      reader.onload = (e) => {
        chunks.push(new Uint8Array(e.target.result));
        offset = end;
        const percent = Math.round((offset / total) * 100);
        try { if (onProgress) onProgress(percent); } catch (e) {}
        if (offset < total) {
          // small yield so UI can update
          setTimeout(readNext, 0);
        } else {
          // concatenate chunks
          const blob = new Blob(chunks);
          blob.arrayBuffer().then(resolve).catch(reject);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(slice);
    }

    readNext();
  });
}

// Extract text from ArrayBuffer and report per-page progress using callback(pageIndex, pageCount)
async function extractTextFromPDF_fromArrayBuffer(arrayBuffer, onPage) {
  if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.8.162/pdf.worker.min.js';
  }
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const texts = content.items.map(item => item.str);
    fullText += `\n\n===== Page ${i} =====\n` + texts.join(' ');
    if (onPage) onPage(i, pdf.numPages);
    // Small yield to keep UI responsive
    await new Promise(r => setTimeout(r, 5));
  }
  return fullText;
}

// Model processing animated dots
let modelDotsTimer = null;
function startModelDots() {
  if (!modelDots) return;
  let count = 0;
  modelDotsTimer = setInterval(() => {
    count = (count + 1) % 4; // 0..3
    modelDots.textContent = '.'.repeat(count);
  }, 500);
}
function stopModelDots() {
  if (modelDotsTimer) { clearInterval(modelDotsTimer); modelDotsTimer = null; }
  if (modelDots) modelDots.textContent = '.';
}

// Attempt to extract a human-readable model output from arbitrary JSON shapes.
function extractModelText(obj) {
  try {
    // direct string
    if (typeof obj === 'string') return obj;

    // common top-level keys
    if (obj == null) return null;
    if (typeof obj !== 'object') return String(obj);

    if (obj.review && typeof obj.review === 'string') return obj.review;
    if (obj.output_text && typeof obj.output_text === 'string') return obj.output_text;
    if (obj.message && typeof obj.message === 'string') return obj.message;

    // choices array (common)
    if (Array.isArray(obj.choices) && obj.choices.length > 0) {
      for (const c of obj.choices) {
        // chat-style: c.message.content
        if (c.message) {
          if (typeof c.message === 'string' && c.message.length > 0) return c.message;
          if (c.message.content && typeof c.message.content === 'string') return c.message.content;
          // sometimes content can be array or object
          if (c.message.content && typeof c.message.content !== 'string') {
            const deep = extractModelText(c.message.content);
            if (deep) return deep;
          }
        }
        if (c.text && typeof c.text === 'string') return c.text;
        if (c.output_text && typeof c.output_text === 'string') return c.output_text;
      }
    }

    // output array (some APIs)
    if (Array.isArray(obj.output) && obj.output.length > 0) {
      for (const o of obj.output) {
        if (o.content && Array.isArray(o.content)) {
          const parts = o.content.map(p => p.text).filter(Boolean);
          if (parts.length) return parts.join('\n');
        }
        if (o.text && typeof o.text === 'string') return o.text;
      }
    }

    // prompt/input variants
    if (obj.prompt && typeof obj.prompt === 'string') return obj.prompt;
    if (obj.input && typeof obj.input === 'string') return obj.input;

    // fallback: traverse object depth-first to find a long string
    const seen = new Set();
    const stack = [obj];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || typeof cur !== 'object') continue;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const k of Object.keys(cur)) {
        try {
          const v = cur[k];
          if (typeof v === 'string' && v.length > 30) return v;
          if (typeof v === 'object') stack.push(v);
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn('extractModelText failed', e);
  }
  return null;
}

// mockReview removed: Quick Try offline demo disabled

async function extractTextFromPDF(file) {
  // Read the file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  // Ensure worker is set for pdf.js (CDN)
  if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.8.162/pdf.worker.min.js';
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const texts = content.items.map(item => item.str);
    fullText += `\n\n===== Page ${i} =====\n` + texts.join(' ');

    // Small yield to keep UI responsive
    await new Promise(r => setTimeout(r, 5));
  }
  return fullText;
}

// Export the model response area as a Markdown (.md) file
if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', async () => {
    const txt = responseEl.textContent || '';
    if (!txt.trim()) {
      alert('No response to export. Please run the model first.');
      return;
    }

    // Prepare filename with timestamp
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const filename = `model_response_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.md`;

    try {
      // Create a Blob from the markdown text and trigger download
      const blob = new Blob([txt], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export to MD failed', e);
      alert('Export to MD failed: ' + (e && e.message ? e.message : e));
    }
  });
}

async function callOpenRouterChat(apiKey, model, messages) {
  // OpenRouter chat completions endpoint pattern - using OpenRouter's 'responses' endpoint.
  // For docs: https://openrouter.ai/
  // Try the chat/completions endpoint first (compatible with many wrappers)
  const chatUrl = 'https://openrouter.ai/api/v1/chat/completions';
  const payload = {
    model,
    messages,
    temperature: 0.1,
  };

  try {
    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message?.content || data.choices[0].text || JSON.stringify(data.choices[0]);
      }
      return JSON.stringify(data, null, 2);
    }
    // If not ok, try fallback below
    const errTxt = await res.text();
    console.warn('chat/completions failed, will try /v1/responses fallback:', res.status, errTxt);
  } catch (e) {
    console.warn('chat/completions attempt failed, trying fallback /v1/responses', e);
  }

  // Fallback to /v1/responses which some OpenRouter deployments use.
  // Build a simple text input by concatenating messages.
  const responsesUrl = 'https://openrouter.ai/api/v1/responses';
  const joinedInput = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n');
  const fallbackPayload = {
    model,
    input: joinedInput,
    temperature: 0.1,
  };

  const fallbackRes = await fetch(responsesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(fallbackPayload),
  });

  if (!fallbackRes.ok) {
    const txt = await fallbackRes.text();
    throw new Error(`OpenRouter fallback 请求失败: ${fallbackRes.status} ${fallbackRes.statusText}\n${txt}`);
  }

  const fallbackData = await fallbackRes.json();
  // Try common response shapes
  if (fallbackData.output && Array.isArray(fallbackData.output) && fallbackData.output[0]?.content) {
    // e.g., { output: [{ content: [{ type: 'text', text: '...' }] }] }
    const content = fallbackData.output[0].content;
    if (Array.isArray(content)) {
      return content.map(c => c.text || JSON.stringify(c)).join('\n');
    }
    return String(content);
  }
  if (fallbackData.output_text) return fallbackData.output_text;
  return JSON.stringify(fallbackData, null, 2);
}

// OpenAI support removed: only OpenRouter and Deepseek are supported in this build.

// Call Deepseek-style chat endpoint (best-effort)
async function callDeepseekChat(apiKey, model, messages) {
  const url = 'https://api.deepseek.com/chat/completions';
  // Many Deepseek deployments are wire-compatible with OpenRouter/OpenAI; try chat-style then fallback to other shapes.
  const payload = { model, messages, temperature: 0.1 };
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  let res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    // try /responses style
    try {
      const responsesUrl = url.replace('/chat/completions', '/responses');
      const joinedInput = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n');
  const fallbackPayload = { model, input: joinedInput, temperature: 0.1 };
      res = await fetch(responsesUrl, { method: 'POST', headers, body: JSON.stringify(fallbackPayload) });
    } catch (e) {
      // ignore and continue
    }
  }

  if (!res || !res.ok) {
    const txt = res ? await res.text() : 'no-response';
    throw new Error(`Deepseek API error: ${txt}`);
  }

  const data = await res.json();
  const extracted = extractModelText(data);
  if (extracted) return extracted;
  return JSON.stringify(data, null, 2);
}

async function loadPromptTemplate(lang, promptMode) {
  // 直接从 prompts.js 中加载，不受浏览器安全限制
  if (window.getPromptTemplate) {
    return window.getPromptTemplate(lang, promptMode);
  }
  return '';
}

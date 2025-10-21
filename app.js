
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

submitBtn.addEventListener('click', async () => {
  responseEl.textContent = '';
  // prefer user-entered API key, otherwise fallback to config.js provided API_KEY
  const apiKey = (apiKeyInput && apiKeyInput.value.trim()) || (window.APP_CONFIG && window.APP_CONFIG.API_KEY) || '';
  const hostedUrl = hostedUrlInput ? hostedUrlInput.value.trim() : '';
  // prefer model input, otherwise use config default, otherwise fallback
  const model = (modelInput && modelInput.value.trim()) || (window.APP_CONFIG && window.APP_CONFIG.HOSTED_MODEL) || 'gpt-4o-mini';
  const file = pdfFileInput.files[0];

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
    const arrayBuffer = await file.arrayBuffer();

    statusEl.textContent = 'Extracting PDF text...';
    const text = await extractTextFromPDF_fromArrayBuffer(arrayBuffer);
    statusEl.textContent = 'Text extracted, preparing request to model...';

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
      // Quick Try: if hostedUrl is provided (hidden), try calling it; otherwise use local mock review
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
        // local mock - quick demo without any network
        answer = await mockReview(text, (langSelect && langSelect.value) || 'en');
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

// Local mock review generator for Quick Try mode (no network)
async function mockReview(paperText, lang = 'en') {
  const preview = (paperText || '').slice(0, 800).replace(/\s+/g, ' ').trim();
  const has = preview.length > 40;
  const synopsis = has ? `Synopsis of the paper\n- (Demo) Restatement: ${preview.slice(0, 200)}...` : 'Synopsis of the paper\n- No direct evidence found in the manuscript.';
  const summary = has ? 'Summary of Review\n- (Demo) The paper appears to present a method with experimental evaluation; details are simulated for demo purposes.' : 'Summary of Review\n- No direct evidence found in the manuscript.';
  const strengths = `Strengths\n- **Demo: Clear motivation**\n  - Example: The preview text indicates a stated problem.\n- **Demo: Evaluations present**\n  - Example: The preview includes experimental descriptions.\n- **Demo: Relevant scope**\n  - Example: Manuscript targets a relevant research area.`;
  const weaknesses = `Weaknesses\n- **Demo: Limited verification**\n  - Example: This quick demo cannot verify equations, figures, or numerical claims.\n- **Demo: Missing anchors**\n  - Example: No precise figure/table anchors provided by demo.\n- **Demo: Surface-level suggestions**\n  - Example: Recommendations are high-level.`;
  const suggestions = `Suggestions for Improvement\n- **Add clear anchors**\n  - Recommendation: Label figures/tables/sections clearly for automated anchoring.\n- **Provide short abstract**\n  - Recommendation: Add a concise summary paragraph to help automated reviewers.\n- **Include representative experiments**\n  - Recommendation: Make sure key ablations and baselines are easy to find.`;
  const references = 'References\n- None (demo mode)';
  return [synopsis, summary, strengths, weaknesses, suggestions, references].join('\n\n');
}

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

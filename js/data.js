// js/data.js — 진단 항목 정의 + API 설정 (Claude / Gemini)

const DIAG_ITEMS = [
  { id:'target',    area:'제품역량',    color:'#1D9E75', q:'핵심 타깃 고객이 구체적으로 정의되어 있다',           hint:'타깃 명확성' },
  { id:'diff',      area:'제품역량',    color:'#1D9E75', q:'경쟁 브랜드 대비 뚜렷한 차별 요소가 있다',           hint:'차별화 전략' },
  { id:'feedback',  area:'제품역량',    color:'#1D9E75', q:'고객 피드백이 제품 기획에 실제 반영되고 있다',        hint:'고객 반응성' },
  { id:'label',     area:'브랜드·인증', color:'#378ADD', q:'수출 대상국 현지 언어 포장·라벨링이 준비되어 있다',   hint:'현지화 준비' },
  { id:'cert',      area:'브랜드·인증', color:'#378ADD', q:'유효한 해외 인증을 4개 이상 보유하고 있다',           hint:'해외 인증' },
  { id:'trademark', area:'브랜드·인증', color:'#378ADD', q:'주요 수출국 상표권이 등록되어 있다',                  hint:'IP 보호' },
  { id:'org',       area:'인적역량',    color:'#7F77DD', q:'수출 전담 부서 및 3년 이상 경력 인력이 있다',          hint:'조직·인력' },
  { id:'lang',      area:'인적역량',    color:'#7F77DD', q:'외국어 수출 상담이 가능한 인력이 충분하다',            hint:'외국어 역량' },
  { id:'bizdev',    area:'인적역량',    color:'#7F77DD', q:'신규 바이어 발굴을 위한 전담 인력이 있다',              hint:'바이어 발굴 역량' },
  { id:'plan',      area:'시장개척',    color:'#D85A30', q:'국가별 수출계획이 구체적으로 수립되어 있다',           hint:'수출계획' },
  { id:'channel',   area:'시장개척',    color:'#D85A30', q:'온·오프라인 해외 유통채널에 다수 입점해 있다',         hint:'유통채널' },
  { id:'buyer_n',   area:'시장개척',    color:'#D85A30', q:'직·간접 수출 바이어를 다수(9명+) 보유하고 있다',      hint:'바이어 보유' },
  { id:'payment',   area:'기본역량',    color:'#BA7517', q:'다양한 결제 방식(3가지 이상)을 활용 가능하다',         hint:'결제 유연성' },
];

// 앱 전역 상태
const STATE = {
  scores: {},
  areaScores: {},
  overallAvg: 0,
  todos: [
    { text: 'ARK 아웃리치 대상 국가·HS코드 확정', owner: 'ARK담당자', due: '1주일' },
    { text: '현지 인증 필요 항목 확인 및 준비 일정 공유', owner: '고객사', due: '2주일' },
  ],
};

// ── 유틸 ──────────────────────────────────────────────
function getField(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setSelect(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  [...el.options].forEach(o => { if (o.value === val || o.text === val) o.selected = true; });
}

function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

// ── API 키 관리 ───────────────────────────────────────
function getProvider() {
  return localStorage.getItem('ark_provider') || 'claude'; // 'claude' | 'gemini'
}

function getClaudeKey() {
  return localStorage.getItem('ark_claude_key') || '';
}

function getGeminiKey() {
  return localStorage.getItem('ark_gemini_key') || '';
}

function saveApiKeys() {
  const provider  = document.getElementById('provider-select').value;
  const claudeKey = document.getElementById('claude-key-input').value.trim();
  const geminiKey = document.getElementById('gemini-key-input').value.trim();

  if (provider === 'claude' && !claudeKey) { alert('Claude API 키를 입력해주세요.'); return; }
  if (provider === 'gemini' && !geminiKey) { alert('Gemini API 키를 입력해주세요.'); return; }

  localStorage.setItem('ark_provider', provider);
  if (claudeKey) localStorage.setItem('ark_claude_key', claudeKey);
  if (geminiKey) localStorage.setItem('ark_gemini_key', geminiKey);

  document.getElementById('api-banner').style.display = 'none';
  updateProviderBadge();
  alert(`${provider === 'claude' ? 'Claude' : 'Gemini'} API 키가 저장되었습니다.`);
}

function updateProviderBadge() {
  const badge = document.getElementById('provider-badge');
  if (!badge) return;
  const p = getProvider();
  badge.textContent  = p === 'claude' ? '🤖 Claude' : '✨ Gemini';
  badge.style.background = p === 'claude' ? '#E6F1FB' : '#E8F5E9';
  badge.style.color  = p === 'claude' ? '#185FA5' : '#1B5E20';
}

function onProviderChange() {
  const p = document.getElementById('provider-select')?.value || getProvider();
  const claudeRow = document.getElementById('claude-key-row');
  const geminiRow = document.getElementById('gemini-key-row');
  if (!claudeRow || !geminiRow) return;

  if (p === 'gemini') {
    claudeRow.style.display = 'none';
    geminiRow.style.display = 'flex';
  } else {
    claudeRow.style.display = 'flex';
    geminiRow.style.display = 'none';
  }
}

// ── 통합 AI 호출 ──────────────────────────────────────
async function callClaude(systemPrompt, userPrompt, onChunk) {
  const provider = getProvider();
  if (provider === 'gemini') {
    return callGemini(systemPrompt, userPrompt, onChunk);
  }
  return callClaudeAPI(systemPrompt, userPrompt, onChunk);
}

// Claude API 호출
async function callClaudeAPI(systemPrompt, userPrompt, onChunk) {
  const key = getClaudeKey();
  if (!key) { alert('Claude API 키를 먼저 입력해주세요. (상단 ⚙ 버튼)'); return null; }

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        stream: !!onChunk,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
  } catch (networkErr) {
    throw new Error(`네트워크 오류: ${networkErr.message} — 인터넷 연결 또는 API 키를 확인하세요.`);
  }

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      const detail = errBody?.error?.message || JSON.stringify(errBody);
      errMsg = `[${res.status}] ${detail}`;
    } catch {}
    // 상태코드별 한국어 안내
    if (res.status === 401) throw new Error(`인증 실패 (401) — API 키가 올바른지 확인하세요.`);
    if (res.status === 403) throw new Error(`접근 거부 (403) — API 키 권한을 확인하세요.`);
    if (res.status === 429) throw new Error(`요청 한도 초과 (429) — 잠시 후 다시 시도하세요.`);
    if (res.status === 500) throw new Error(`Anthropic 서버 오류 (500) — 잠시 후 다시 시도하세요.`);
    if (res.status === 529) throw new Error(`API 과부하 (529) — 잠시 후 다시 시도하세요.`);
    throw new Error(errMsg);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  // Streaming
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') return;
      try {
        const evt = JSON.parse(json);
        if (evt.type === 'content_block_delta' && evt.delta?.text) {
          onChunk(evt.delta.text);
        }
      } catch {}
    }
  }
}

// Gemini API 호출 (gemini-2.0-flash)
async function callGemini(systemPrompt, userPrompt, onChunk) {
  const key = getGeminiKey();
  if (!key) { alert('Gemini API 키를 먼저 입력해주세요. (상단 ⚙ 버튼)'); return null; }

  const model = 'gemini-2.0-flash';
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${onChunk ? 'streamGenerateContent' : 'generateContent'}?key=${key}${onChunk ? '&alt=sse' : ''}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API 오류 (${res.status})`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // Streaming
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(5).trim();
      try {
        const evt = JSON.parse(json);
        const text = evt.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {}
    }
  }
}

// js/data.js — 진단 항목 정의 + API 설정 (Claude / Gemini)

const DIAG_ITEMS = [
  // 제품역량
  { id:'target',  area:'제품역량',    color:'#1D9E75', q:'주요 제품의 타깃 고객은 누구이고, 경쟁사 대비 어떤 점이 차별화되나요?',                          hint:'타깃·차별화' },
  { id:'diff',    area:'제품역량',    color:'#1D9E75', q:'해외 바이어가 관심을 가질 만한 제품의 핵심 강점을 설명해주세요. (성분, 기능, 수상이력 등)',       hint:'제품 강점' },
  { id:'sample',  area:'제품역량',    color:'#1D9E75', q:'샘플 제공이 가능한가요? MOQ와 납기, 수출 가격 기준이 있나요?',                                    hint:'샘플·MOQ·가격' },
  // 브랜드·인증
  { id:'cert',    area:'브랜드·인증', color:'#378ADD', q:'현재 보유한 국내외 인증이 있나요? (HACCP, FDA, 할랄, 유기농 등)',                                  hint:'인증 현황' },
  { id:'label',   area:'브랜드·인증', color:'#378ADD', q:'수출 대상국 현지 언어로 된 포장재나 라벨이 준비되어 있나요?',                                       hint:'현지화 준비' },
  { id:'trademark', area:'브랜드·인증', color:'#378ADD', q:'해외 상표권을 등록한 국가가 있나요?',                                                            hint:'IP 보호' },
  // 인적역량
  { id:'org',     area:'인적역량',    color:'#7F77DD', q:'수출 업무를 담당하는 인력이 몇 명이고, 외국어 소통이 가능한가요?',                                  hint:'수출 인력' },
  { id:'bizdev',  area:'인적역량',    color:'#7F77DD', q:'현재 신규 해외 바이어 발굴을 위해 별도로 노력하고 있는 부분이 있나요?',                             hint:'바이어 발굴 역량' },
  // 시장개척
  { id:'channel', area:'시장개척',    color:'#D85A30', q:'현재 수출 중인 국가와 바이어가 있나요? 있다면 어떤 채널로 연결됐나요?',                             hint:'수출 채널' },
  { id:'plan',    area:'시장개척',    color:'#D85A30', q:'목표로 하는 수출 국가와 그 이유가 있나요?',                                                         hint:'목표 시장' },
  { id:'buyer_n', area:'시장개척',    color:'#D85A30', q:'온라인 또는 오프라인 해외 유통채널에 입점한 곳이 있나요?',                                           hint:'유통채널' },
  // 기본역량
  { id:'payment', area:'기본역량',    color:'#BA7517', q:'결제 방식(T/T, L/C 등)과 선호하는 거래 조건(Incoterms)이 있나요?',                                  hint:'결제·거래 조건' },
  { id:'goal',    area:'기본역량',    color:'#BA7517', q:'연간 수출 목표금액이나 구체적인 수출 계획이 있나요?',                                                hint:'수출 목표' },
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

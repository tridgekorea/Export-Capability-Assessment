// js/data.js — 진단 항목 정의

const DIAG_ITEMS = [
  { id:'target',    area:'제품역량',    color:'#1D9E75', q:'핵심 타깃 고객이 구체적으로 정의되어 있다',           hint:'타깃 명확성' },
  { id:'diff',      area:'제품역량',    color:'#1D9E75', q:'경쟁 브랜드 대비 뚜렷한 차별 요소가 있다',           hint:'차별화 전략' },
  { id:'feedback',  area:'제품역량',    color:'#1D9E75', q:'고객 피드백이 제품 기획에 실제 반영되고 있다',        hint:'고객 반응성' },
  { id:'label',     area:'브랜드·인증', color:'#378ADD', q:'수출 대상국 현지 언어 포장·라벨링이 준비되어 있다',   hint:'현지화 준비' },
  { id:'cert',      area:'브랜드·인증', color:'#378ADD', q:'유효한 해외 인증을 4개 이상 보유하고 있다',           hint:'해외 인증' },
  { id:'trademark', area:'브랜드·인증', color:'#378ADD', q:'주요 수출국 상표권이 등록되어 있다',                  hint:'IP 보호' },
  { id:'org',       area:'인적역량',    color:'#7F77DD', q:'수출 전담 부서 및 3년 이상 경력 인력이 있다',          hint:'조직·인력' },
  { id:'lang',      area:'인적역량',    color:'#7F77DD', q:'외국어 수출 상담이 가능한 인력이 충분하다',            hint:'외국어 역량' },
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
    { text: 'ARK에서 목표시장 바이어 리스트 추출', owner: 'ARK담당자', due: '1주일' },
    { text: '현지 인증 필요 항목 확인 및 준비 일정 공유', owner: '고객사', due: '2주일' },
  ],
};

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

function getApiKey() {
  return localStorage.getItem('ark_api_key') || '';
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) { alert('API 키를 입력해주세요.'); return; }
  localStorage.setItem('ark_api_key', key);
  document.getElementById('api-banner').style.display = 'none';
  alert('API 키가 저장되었습니다.');
}

async function callClaude(systemPrompt, userPrompt, onChunk) {
  const key = getApiKey();
  if (!key) {
    alert('API 키를 먼저 입력해주세요. (상단 ⚙ 버튼)');
    return null;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      stream: !!onChunk,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 (${res.status})`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  // Streaming
  const reader = res.body.getReader();
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

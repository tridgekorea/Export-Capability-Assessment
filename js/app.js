// js/app.js — 앱 초기화, 네비게이션, AI 기업 사전조사

// ── 초기화 ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('meeting-date').textContent = nowStr() + ' 미팅';

  // 저장된 키 복원
  const savedProvider = getProvider();
  const providerSelect = document.getElementById('provider-select');
  if (providerSelect) providerSelect.value = savedProvider;

  const claudeKey = getClaudeKey();
  const geminiKey = getGeminiKey();
  if (claudeKey) document.getElementById('claude-key-input').value = claudeKey;
  if (geminiKey) document.getElementById('gemini-key-input').value = geminiKey;

  // 초기 배너 상태
  const hasKey = savedProvider === 'claude' ? !!claudeKey : !!geminiKey;
  if (!hasKey) {
    document.getElementById('api-banner').style.display = 'flex';
  }
  onProviderChange();
  updateProviderBadge();

  buildDiag();
  renderTodos();
});

// ── 스텝 네비게이션 ──────────────────────────────────────
function goStep(n) {
  document.querySelectorAll('.panel').forEach((p, i) => {
    p.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.step-btn').forEach((b, i) => {
    b.classList.toggle('active', i === n);
  });
  if (n === 2) renderResult();
  if (n === 3) renderReport();
}

// ── AI 기업 사전조사 ────────────────────────────────────
async function aiResearch() {
  const corp   = document.getElementById('corp-input').value.trim();
  const status = document.getElementById('ai-status');
  const btn    = document.querySelector('.btn-ai');

  if (!corp) { alert('기업명을 입력해주세요.'); return; }

  btn.disabled = true;
  status.className = 'ai-status loading';
  status.style.display = 'block';
  status.innerHTML = `<span class="spinner"></span> "${corp}" 기업 정보를 AI가 분석하고 있습니다...`;

  const systemPrompt = `당신은 한국 수출 기업 전문 조사 애널리스트입니다.
기업명을 받으면 해당 기업의 수출 역량 관련 정보를 JSON으로만 반환합니다.
마크다운 없이, JSON만 출력하세요.`;

  const userPrompt = `"${corp}" 기업에 대해 아는 정보를 바탕으로 아래 형식의 JSON만 반환하세요.
확인된 정보만 작성하고, 불확실하거나 모르는 항목은 빈 문자열("")로 남겨주세요.
추정 정보는 usp 필드에만 "(추정)" 표시를 해주세요. 절대 없는 정보를 만들어내지 마세요.

{
  "product": "주요 수출 품목",
  "type": "제조(가공)업체 | 생산자(단체) | 수출전문업체 | 유통업체 중 하나",
  "exp": "미경험 | 1~2년 | 3~5년 | 5~10년 | 10년 이상 중 하나",
  "rev": "10억 미만 | 10~50억 | 50~100억 | 100~300억 | 300억 이상 중 하나",
  "export_rev": "없음 | 10만불 미만 | 10~50만불 | 50~200만불 | 200만불 이상 중 하나",
  "market": "미국/캐나다 | 일본 | 중국 | 동남아 | 유럽 | 중동 | 호주 중 가장 주요한 하나",
  "method": "직접수출 | 수출대행 | 직·간접 병행 | 미정 중 하나",
  "usp": "이 기업의 핵심 경쟁력과 주요 수출 제품 특징을 2~3문장으로"
}`;

  try {
    const text = await callClaude(systemPrompt, userPrompt, null);
    const clean = text.replace(/```json|```/g, '').trim();
    const info  = JSON.parse(clean);

    setField('f-name', corp);
    if (info.product)    setField('f-product', info.product);
    if (info.usp)        setField('f-usp', info.usp);
    if (info.type)       setSelect('f-type', info.type);
    if (info.exp)        setSelect('f-exp', info.exp);
    if (info.rev)        setSelect('f-rev', info.rev);
    if (info.export_rev) setSelect('f-export', info.export_rev);
    if (info.market)     setSelect('f-market', info.market);
    if (info.method)     setSelect('f-method', info.method);

    status.className = 'ai-status success';
    status.innerHTML = `✓ "${corp}" 분석 완료 — 내용을 확인하고 필요 시 수정하세요.`;
  } catch (e) {
    status.className = 'ai-status error';
    status.innerHTML = `분석 실패: ${e.message} — 직접 입력해주세요.`;
  } finally {
    btn.disabled = false;
  }
}

// ── API 배너 토글 ────────────────────────────────────
function toggleApiBanner() {
  const banner = document.getElementById('api-banner');
  const isHidden = banner.style.display === 'none' || banner.style.display === '';
  banner.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) onProviderChange(); // 열릴 때 provider 상태 동기화
}

// ================================================================
// js/sheets.js — 구글시트 연동 모듈
// index.html에서 <script src="js/sheets.js"></script> 로 로드
// ================================================================

const SHEETS_KEY = 'ark_sheets_webhook_url';

// 저장된 웹훅 URL 가져오기
function getSheetsUrl() {
  return localStorage.getItem(SHEETS_KEY) || '';
}

// 웹훅 URL 저장
function saveSheetsUrl(url) {
  localStorage.setItem(SHEETS_KEY, url);
}

// ── 현재 웹앱 데이터 수집 ──
function collectAppData() {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\. /g, '.').replace('.', '');

  // 진단 점수 가져오기 (result.js의 전역 변수 활용)
  const scores = typeof domainScores !== 'undefined' ? domainScores : {};
  const avg = typeof totalAvg !== 'undefined' ? totalAvg : '';
  const grade = typeof exportGrade !== 'undefined' ? exportGrade : '';

  // 액션 아이템 텍스트로 수집
  const todos = [];
  document.querySelectorAll('.todo-text').forEach(el => {
    if (el.value) todos.push(el.value);
  });

  return {
    '날짜': today,
    '컨설턴트': localStorage.getItem('ark_consultant_name') || '',
    '상태': '상담완료',

    // Company Info
    '기업명':    document.getElementById('f-name')?.value || '',
    '법인명':    document.getElementById('f-legal-name')?.value || '',
    '웹사이트':  document.getElementById('f-website')?.value || '',
    'Company Role': document.getElementById('f-role')?.value || '',
    '기업 소개': document.getElementById('f-usp')?.value || '',

    // Contact
    '담당자명':      document.getElementById('f-contact-name')?.value || '',
    '직책':          document.getElementById('f-contact-title')?.value || '',
    '이메일':        document.getElementById('f-contact-email')?.value || '',
    '전화/WhatsApp': document.getElementById('f-contact-phone')?.value || '',

    // Product
    '주요 품목':     document.getElementById('f-product')?.value || '',
    'HS Code':       document.getElementById('f-hscode')?.value || '',
    'USP / 제품 설명': document.getElementById('f-usp')?.value || '',

    // Supply
    '수출 경력': document.getElementById('f-exp')?.value || '',
    '연간 매출': document.getElementById('f-rev')?.value || '',
    '연간 수출액': document.getElementById('f-export')?.value || '',
    'MOQ':       document.getElementById('f-moq')?.value || '',
    '목표 시장': document.getElementById('f-market')?.value || '',
    '수출 방식': document.getElementById('f-method')?.value || '',

    // 인증 (진단 점수 기반)
    '국내 인증': scores['브랜드·인증'] >= 3 ? 'HACCP 등 보유' : '미보유/확인필요',
    '해외 인증': scores['브랜드·인증'] >= 4 ? '보유' : '미보유',

    // ARK 진단 결과
    '종합 점수':  avg ? Number(avg).toFixed(1) : '',
    '수출 등급':  grade || '',
    '강점 영역':  typeof strongDomain !== 'undefined' ? strongDomain : '',
    '약점 영역':  typeof weakDomain !== 'undefined' ? weakDomain : '',
    'ARK 전략':   document.querySelector('#ark-strategy')?.innerText?.slice(0, 200) || '',

    // 메모
    '미팅 메모':  document.getElementById('f-meetmemo')?.value || '',
    '다음 액션':  todos.join(' / '),

    // 파이프라인 (초기값)
    '계약 금액': '',
    '비고': '',
  };
}

// ── 구글시트에 저장 ──
async function saveToSheets() {
  const url = getSheetsUrl();
  if (!url) {
    alert('구글시트 웹훅 URL이 설정되지 않았습니다.\n⚙ 설정에서 URL을 입력해주세요.');
    toggleApiBanner();
    return;
  }

  const btn = document.getElementById('sheets-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    const data = collectAppData();

    // Apps Script는 CORS 이슈로 no-cors 모드 사용
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // no-cors는 응답을 읽을 수 없으므로 성공으로 간주
    showSheetsSaveResult(true, data['기업명']);
  } catch (err) {
    showSheetsSaveResult(false);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📊 구글시트에 저장'; }
  }
}

function showSheetsSaveResult(success, companyName) {
  const el = document.getElementById('sheets-status');
  if (!el) return;
  if (success) {
    el.style.display = 'block';
    el.style.background = '#E1F5EE';
    el.style.color = '#085041';
    el.textContent = `✓ ${companyName} 데이터가 구글시트에 저장되었습니다`;
  } else {
    el.style.display = 'block';
    el.style.background = '#FCEBEB';
    el.style.color = '#791F1F';
    el.textContent = '저장 실패 — 웹훅 URL을 확인해주세요';
  }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

// ── 이전 미팅 기록 불러오기 ──
async function loadFromSheets(companyName) {
  const url = getSheetsUrl();
  if (!url || !companyName) return null;

  try {
    const getUrl = url + '?company=' + encodeURIComponent(companyName);
    const res = await fetch(getUrl);
    const json = await res.json();
    if (json.found && json.data) {
      return json.data;
    }
  } catch (e) {}
  return null;
}

// ── 불러온 데이터로 폼 채우기 ──
function fillFormFromSheets(data) {
  const map = {
    'f-name':           data['기업명'],
    'f-legal-name':     data['법인명'],
    'f-website':        data['웹사이트'],
    'f-contact-name':   data['담당자명'],
    'f-contact-title':  data['직책'],
    'f-contact-email':  data['이메일'],
    'f-contact-phone':  data['전화/WhatsApp'],
    'f-product':        data['주요 품목'],
    'f-hscode':         data['HS Code'],
    'f-usp':            data['USP / 제품 설명'],
    'f-meetmemo':       data['미팅 메모'],
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  });

  // select 필드
  const selects = {
    'f-exp':    data['수출 경력'],
    'f-rev':    data['연간 매출'],
    'f-export': data['연간 수출액'],
    'f-market': data['목표 시장'],
    'f-method': data['수출 방식'],
  };
  Object.entries(selects).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) {
      const opt = [...el.options].find(o => o.value === val || o.text === val);
      if (opt) el.value = opt.value;
    }
  });

  // 이전 미팅 알림
  const statusEl = document.getElementById('ai-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.background = '#FAEEDA';
    statusEl.style.color = '#633806';
    statusEl.textContent = `📋 이전 미팅 기록 발견 (${data['날짜']}) — 데이터를 불러왔습니다`;
  }
}

// ── 온보딩 폼 이메일 발송 (mailto 방식) ──
function sendOnboardingForm() {
  const email = document.getElementById('f-contact-email')?.value || '';
  const contactName = document.getElementById('f-contact-name')?.value || '';
  const companyName = document.getElementById('f-name')?.value || '';

  if (!email) {
    alert('고객사 이메일을 먼저 입력해주세요.\n(1단계 기업 사전조사 → 이메일 필드)');
    return;
  }

  // 구글시트 설정 시트에 저장된 폼 URL (없으면 기본값)
  const formUrl = localStorage.getItem('ark_onboarding_form_url') || '';
  if (!formUrl) {
    alert('온보딩 폼 URL이 설정되지 않았습니다.\n⚙ 설정에서 폼 URL을 입력해주세요.');
    toggleApiBanner();
    return;
  }

  const subject = encodeURIComponent(`[Tridge ARK] ${companyName} — Seller Onboarding Form 작성 요청`);
  const body = encodeURIComponent(`${contactName}님 안녕하세요,\n\nSeller Onboarding Form 작성 부탁드립니다.\n\n${formUrl}\n\n감사합니다.\nTridge ARK 팀`);

  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
  const a = document.createElement('a');
  a.href = gmailUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

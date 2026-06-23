// js/report.js — 리포트 렌더링 & PDF 출력

// 지역별 ARK 실측 응답률
function getArkRate(market) {
  if (!market) return null;
  const apac = ['일본','동남아','호주','중국'];
  const mena = ['중동'];
  const eu   = ['유럽'];
  const amer = ['미국/캐나다'];
  if (apac.some(m => market.includes(m))) return { region: 'APAC', rate: '34%' };
  if (mena.some(m => market.includes(m))) return { region: 'MENA', rate: '22%' };
  if (eu.some(m => market.includes(m)))   return { region: 'EU',   rate: '19%' };
  if (amer.some(m => market.includes(m))) return { region: 'Americas', rate: '17%' };
  return null;
}

function getMarkets() {
  const m1 = getField('f-market1') || getField('f-market') || '';
  const m2 = getField('f-market2') || '';
  const m3 = getField('f-market3') || '';
  return [m1, m2, m3].filter(Boolean);
}

function renderTodos() {
  const el = document.getElementById('todo-list');
  if (!el) return;
  el.innerHTML = STATE.todos.map((t, i) => `
    <div class="todo-row">
      <input type="text" value="${t.text}" placeholder="액션 아이템" onchange="STATE.todos[${i}].text=this.value" />
      <input type="text" value="${t.owner}" placeholder="담당자" style="width:90px;flex:none" onchange="STATE.todos[${i}].owner=this.value" />
      <select onchange="STATE.todos[${i}].due=this.value">
        ${['즉시','3일','1주일','2주일','1개월'].map(d => `<option${t.due===d?' selected':''}>${d}</option>`).join('')}
      </select>
      <button class="todo-del" onclick="STATE.todos.splice(${i},1);renderTodos()">✕</button>
    </div>`).join('');
}

function addTodo() {
  STATE.todos.push({ text: '', owner: '', due: '1주일' });
  renderTodos();
}

function renderReport() {
  renderTodos();
  const { overallAvg, areaScores, todos } = STATE;
  const name       = getField('f-name') || '(기업명 미입력)';
  const contactName  = getField('f-contact-name') || getField('f-contact') || '-';
  const contactTitle = getField('f-contact-title') || '';
  const contactEmail = getField('f-contact-email') || '';
  const contactPhone = getField('f-contact-phone') || '';
  const product    = getField('f-product') || '-';
  const markets    = getMarkets();
  const exp        = getField('f-exp') || '-';
  const usp        = getField('f-usp') || '-';
  const meetmemo   = getField('f-meetmemo') || '-';
  const conclusion = getField('f-conclusion') || '';
  const grade      = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong     = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k);
  const weak       = Object.entries(areaScores).filter(([,v]) => v.score < 2.5).map(([k]) => k);

  const contactStr = [contactName, contactTitle].filter(Boolean).join(' / ');
  const contactInfo = [contactEmail, contactPhone].filter(Boolean).join(' · ');

  // 목표시장별 ARK 전략 행
  const marketRows = markets.map((m, i) => {
    const rate = getArkRate(m);
    const label = ['1순위','2순위','3순위'][i];
    return `<tr><td>목표시장 ${label}</td><td>${m}${rate ? ` &nbsp;<span style="color:#185FA5;font-weight:600">${rate.region} 실측 응답률 ${rate.rate}</span>` : ''}</td></tr>`;
  }).join('');

  document.getElementById('report-preview').innerHTML = `
    <h2>수출역량 상담 리포트</h2>
    <div style="font-size:11px;color:#999;margin-bottom:.25rem">Tridge ARK &nbsp;·&nbsp; ${nowStr()}</div>
    <hr>
    <h3>1. 미팅 개요</h3>
    <table>
      <tr><td>기업명</td><td>${name}</td></tr>
      <tr><td>담당자</td><td>${contactStr}${contactInfo ? `<br><span style="color:#9c9a92;font-size:11px">${contactInfo}</span>` : ''}</td></tr>
      <tr><td>주요 품목</td><td>${product}</td></tr>
      <tr><td>목표 시장</td><td>${markets.join(' · ') || '-'}</td></tr>
      <tr><td>수출 경력</td><td>${exp}</td></tr>
      <tr><td>핵심 USP</td><td>${usp}</td></tr>
      <tr><td>미팅 메모</td><td>${meetmemo}</td></tr>
    </table>
    <hr>
    <h3>2. 역량 진단 결과</h3>
    <table>
      <tr><td>종합 점수</td><td><strong>${overallAvg} / 5.0 (${grade})</strong></td></tr>
      ${Object.entries(areaScores).map(([k,v]) =>
        `<tr><td>${k}</td><td>${'●'.repeat(Math.round(v.score))}${'○'.repeat(5-Math.round(v.score))} &nbsp;${v.score}점</td></tr>`
      ).join('')}
    </table>
    <hr>
    <h3>3. 핵심 발견사항</h3>
    <table>
      <tr><td>강점</td><td>${strong.length ? strong.join(', ') : '진단 데이터 부족'}</td></tr>
      <tr><td>보완 필요</td><td>${weak.length ? weak.join(', ') : '전반 양호'}</td></tr>
    </table>
    <hr>
    <h3>4. ARK 바이어 발굴 전략</h3>
    <table>
      ${marketRows || '<tr><td>목표 시장</td><td>미입력</td></tr>'}
      <tr><td>ARK 대행 범위</td><td>바이어 발굴·스코어링·현지어 AI 아웃리치 직접 발송·미팅 세팅</td></tr>
      <tr><td>고객사 역할</td><td>미팅 참여 · 가격 협상 · 계약 체결</td></tr>
      <tr><td>성과 퍼널</td><td>아웃리치 → 응답 → 미팅(50%) → 샘플(60%) → 계약(50%)</td></tr>
    </table>
    <hr>
    <h3>5. 다음 액션 아이템</h3>
    <table>
      <tr><td style="width:50%;font-weight:600">할 일</td><td style="width:25%;font-weight:600">담당</td><td style="width:25%;font-weight:600">기한</td></tr>
      ${todos.map(t => `<tr><td>${t.text||'-'}</td><td>${t.owner||'-'}</td><td>${t.due}</td></tr>`).join('')}
    </table>
    <hr>
    <h3>6. 미팅 결론 및 종합 메모</h3>
    <table>
      <tr><td style="width:25%;font-weight:600;vertical-align:top">미팅 특이사항</td><td style="font-size:12px;line-height:1.8">${meetmemo !== '-' ? meetmemo : '없음'}</td></tr>
      <tr><td style="width:25%;font-weight:600;vertical-align:top">종합 결론</td><td style="font-size:12px;line-height:1.8">${conclusion || '미입력'}</td></tr>
    </table>`;
}

function downloadPdf() {
  const name = getField('f-name') || '기업명';
  const previewEl = document.getElementById('report-preview');
  if (!previewEl || !previewEl.innerHTML.trim()) {
    alert('리포트를 먼저 확인해주세요.');
    return;
  }

  const REPORT_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif; font-size:13px; color:#1a1a18; background:#f5f4f0; padding:2rem; }
    .page { max-width:800px; margin:0 auto; background:#fff; border-radius:12px; padding:2.5rem 3rem; box-shadow:0 1px 8px rgba(0,0,0,0.08); }
    h2 { font-size:18px; font-weight:600; color:#185FA5; margin-bottom:4px; }
    h3 { font-size:12px; font-weight:600; color:#185FA5; margin:1.2rem 0 .5rem; padding-bottom:4px; border-bottom:1px solid #d0cec8; }
    hr { border:none; border-top:1px solid #e0ddd6; margin:.75rem 0; }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:.5rem; }
    td { padding:6px 8px; border:1px solid #e0ddd6; vertical-align:top; line-height:1.6; }
    td:first-child { width:28%; font-weight:500; color:#5f5e5a; background:#f5f4f0; white-space:nowrap; }
    @media print { body { background:#fff; padding:0; } .page { box-shadow:none; border-radius:0; padding:1.5rem 2rem; } }
  `;

  const html = \`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>ARK 수출역량 상담 리포트 · \${name}</title>
<style>\${REPORT_CSS}</style>
</head>
<body>
<div class="page">
\${previewEl.innerHTML}
</div>
</body>
</html>\`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = \`ARK_수출역량리포트_\${name.replace(/\s/g,'_')}_\${nowStr()}.html\`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

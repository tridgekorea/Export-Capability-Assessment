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
    ${conclusion ? `<hr><h3>종합 결론</h3><p style="font-size:12px;line-height:1.8">${conclusion}</p>` : ''}`;
}

async function downloadPdf() {
  if (!window.jspdf) { alert('PDF 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  const { jsPDF } = window.jspdf;

  let nanumRegular = null;
  let nanumBold = null;
  try {
    const [r1, r2] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/NanumGothic.woff').then(r => r.arrayBuffer()),
      fetch('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/NanumGothicBold.woff').then(r => r.arrayBuffer()),
    ]);
    nanumRegular = r1;
    nanumBold = r2;
  } catch(e) {
    console.warn('한글 폰트 로드 실패, 기본 폰트 사용:', e);
  }

  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

  if (nanumRegular && nanumBold) {
    const toBase64 = (buf) => {
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };
    doc.addFileToVFS('NanumGothic.ttf', toBase64(nanumRegular));
    doc.addFileToVFS('NanumGothicBold.ttf', toBase64(nanumBold));
    doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
    doc.addFont('NanumGothicBold.ttf', 'NanumGothic', 'bold');
    doc.setFont('NanumGothic', 'normal');
  }

  const KR = nanumRegular ? 'NanumGothic' : 'helvetica';
  const W = 210, M = 18, cw = W - M * 2;
  let y = 22;

  const name         = getField('f-name') || '기업명 미입력';
  const contactName  = getField('f-contact-name') || getField('f-contact') || '-';
  const contactTitle = getField('f-contact-title') || '';
  const contactEmail = getField('f-contact-email') || '';
  const contactPhone = getField('f-contact-phone') || '';
  const product      = getField('f-product') || '-';
  const markets      = getMarkets();
  const exp          = getField('f-exp') || '-';
  const usp          = getField('f-usp') || '-';
  const meetmemo     = getField('f-meetmemo') || '-';
  const conclusion   = getField('f-conclusion') || '';
  const { overallAvg, areaScores, todos } = STATE;
  const grade  = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k);
  const weak   = Object.entries(areaScores).filter(([,v]) => v.score < 2.5).map(([k]) => k);

  const checkY = (need = 10) => { if (y + need > 275) { doc.addPage(); y = 20; } };

  const section = (title) => {
    checkY(14);
    doc.setFont(KR, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(24, 95, 165);
    doc.text(title, M, y); y += 4;
    doc.setDrawColor(24, 95, 165);
    doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y); y += 5;
    doc.setTextColor(40, 40, 40);
  };

  const row = (label, value) => {
    checkY(7);
    doc.setFont(KR, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(label, M, y);
    doc.setFont(KR, 'normal');
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(String(value), cw - 42);
    doc.text(lines, M + 40, y);
    y += lines.length * 5 + 1;
  };

  // Header
  doc.setFont(KR, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 95, 165);
  doc.text('수출역량 상담 리포트', M, y); y += 7;
  doc.setFont(KR, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Tridge ARK  |  ${nowStr()}  |  ${name}`, M, y); y += 8;
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y); y += 8;

  section('1. 미팅 개요');
  row('기업명', name);
  const contactStr = [contactName, contactTitle].filter(Boolean).join(' / ');
  row('담당자', contactStr);
  if (contactEmail || contactPhone) {
    row('연락처', [contactEmail, contactPhone].filter(Boolean).join('  ·  '));
  }
  row('주요 품목', product);
  row('목표 시장', markets.join(' · ') || '-');
  row('수출 경력', exp);
  row('핵심 USP', doc.splitTextToSize(usp, cw - 42).join(' '));
  row('미팅 메모', doc.splitTextToSize(meetmemo, cw - 42).join(' '));
  y += 4;

  section('2. 역량 진단 결과');
  row('종합 점수', `${overallAvg} / 5.0  (${grade})`);
  Object.entries(areaScores).forEach(([k, v]) => {
    row(k, `${'●'.repeat(Math.round(v.score))}${'○'.repeat(5 - Math.round(v.score))}  ${v.score}점`);
  });
  y += 4;

  section('3. 핵심 발견사항');
  row('강점', strong.length ? strong.join(', ') : '진단 데이터 부족');
  row('보완 필요', weak.length ? weak.join(', ') : '전반 양호');
  y += 4;

  section('4. ARK 바이어 발굴 전략');
  markets.forEach((m, i) => {
    const rate = getArkRate(m);
    const label = ['1순위 시장', '2순위 시장', '3순위 시장'][i];
    row(label, rate ? `${m}  (${rate.region} 실측 응답률 ${rate.rate})` : m);
  });
  row('ARK 대행', '바이어 발굴·스코어링·현지어 AI 아웃리치 직접 발송·미팅 세팅');
  row('고객사 역할', '미팅 참여 · 가격 협상 · 계약 체결');
  row('성과 퍼널', '아웃리치 → 응답 → 미팅(50%) → 샘플(60%) → 계약(50%)');
  y += 4;

  section('5. 다음 액션 아이템');
  todos.forEach((t, i) => {
    checkY(7);
    doc.setFont(KR, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const txt = doc.splitTextToSize(`${i + 1}. ${t.text || '-'}`, cw - 50);
    doc.text(txt, M, y);
    doc.setTextColor(120, 120, 120);
    doc.text(`${t.owner || '-'} · ${t.due}`, W - M, y, { align: 'right' });
    y += txt.length * 5 + 2;
  });

  if (conclusion) {
    y += 4; section('종합 결론');
    doc.setFont(KR, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const cl = doc.splitTextToSize(conclusion, cw);
    checkY(cl.length * 5 + 4);
    doc.text(cl, M, y);
    y += cl.length * 5 + 4;
  }

  checkY(10);
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y); y += 5;
  doc.setFont(KR, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('본 리포트는 Tridge ARK 수출역량 상담 도구를 통해 생성되었습니다.', M, y);

  doc.save(`ARK_수출역량리포트_${name.replace(/\s/g,'_')}_${nowStr()}.pdf`);
}

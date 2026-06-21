// js/result.js — 진단 결과, 레이더, 바이어 전략 렌더링

function renderResult() {
  const { overallAvg, areaScores } = STATE;
  const grade = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const answered = Object.values(STATE.scores).filter(v => v > 0).length;

  // Metrics
  document.getElementById('metrics').innerHTML = `
    <div class="metric"><div class="n">${overallAvg}</div><div class="l">종합 점수</div></div>
    <div class="metric"><div class="n">${grade}</div><div class="l">수출 등급</div></div>
    <div class="metric"><div class="n">${answered}</div><div class="l">응답 항목</div></div>
    <div class="metric"><div class="n">${Object.keys(areaScores).length}</div><div class="l">평가 영역</div></div>`;

  // Bars
  document.getElementById('bars').innerHTML = Object.entries(areaScores).map(([name, v]) => `
    <div class="bar-row">
      <span class="bar-label">${name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${v.score / 5 * 100}%;background:${v.color}"></div></div>
      <span class="bar-val">${v.score}</span>
    </div>`).join('');

  // Radar
  drawRadar('radarMain');

  // Insights
  const strong = Object.entries(areaScores).filter(([, v]) => v.score >= 3.5).map(([k]) => k);
  const weak   = Object.entries(areaScores).filter(([, v]) => v.score < 2.5).map(([k]) => k);
  const market  = getField('f-market') || '미국';
  const product = getField('f-product') || '가공식품';

  document.getElementById('insights-box').innerHTML = `
    <div class="insight info"><div class="it">✓ 강점 영역</div>
      <p>${strong.length ? strong.join(', ') + '이 우수합니다. ARK 아웃리치 메시지 작성 시 이 역량을 핵심 피칭 포인트로 활용하세요.' : '진단 항목을 더 입력해주세요.'}</p></div>
    <div class="insight warn"><div class="it">⚠ 보완 필요</div>
      <p>${weak.length ? weak.join(', ') + ' 역량이 취약합니다. ARK가 아웃리치·미팅 세팅을 대행하는 동안 이 영역을 병행 보완하세요.' : '전반적으로 양호한 수준입니다.'}</p></div>
    <div class="insight ok"><div class="it">💡 다음 단계</div>
      <p>ARK가 ${market} 내 ${product} 수요가 실재하는 바이어를 6.8억 건 실거래 데이터에서 발굴하고, 30개+ 언어로 직접 아웃리치를 대행합니다. 계약 후 실제 바이어 진단 리포트를 제공합니다.</p></div>`;

  // ARK 실행 프로세스
  document.getElementById('ark-strategy').innerHTML = `
    <div class="insight info"><div class="it">ARK 실행 프로세스</div>
      <p style="line-height:2">
        <strong>1 분석</strong> — 귀사 제품 HS코드로 수요가 실재하는 시장·바이어를 데이터로 추려냅니다<br>
        <strong>2 발굴·스코어링</strong> — 실제 소싱 활동·구매 의도 기준으로 바이어 우선순위를 매깁니다<br>
        <strong>3 AI 다국어 아웃리치</strong> — 30개+ 언어로 초개인화 메시지를 바이어에게 직접 발송합니다<br>
        <strong>4 미팅 세팅</strong> — 관심 바이어와의 미팅을 직접 잡고 초기 커뮤니케이션을 중계합니다<br>
        <span style="color:var(--color-text-tertiary);font-size:11px">※ 가격 협상·계약 체결은 고객사가 직접 진행합니다. ARK는 검증된 바이어를 테이블 위에 올리는 단계까지 책임집니다.</span>
      </p></div>`;
}

function drawRadar(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const keys = Object.keys(STATE.areaScores);
  if (!keys.length) return;
  const vals = keys.map(k => STATE.areaScores[k].score);
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 28;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
  const gc = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const tc = isDark ? '#9c9a92' : '#73716a';

  for (let ring = 1; ring <= 5; ring++) {
    ctx.beginPath();
    keys.forEach((_, i) => {
      const a = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
      const x = cx + Math.cos(a) * r * (ring / 5);
      const y = cy + Math.sin(a) * r * (ring / 5);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath(); ctx.strokeStyle = gc; ctx.lineWidth = 0.5; ctx.stroke();
  }
  keys.forEach((_, i) => {
    const a = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.strokeStyle = gc; ctx.lineWidth = 0.5; ctx.stroke();
  });

  ctx.beginPath();
  vals.forEach((v, i) => {
    const a = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
    const x = cx + Math.cos(a) * r * (v / 5);
    const y = cy + Math.sin(a) * r * (v / 5);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(55,138,221,0.15)';
  ctx.fill();
  ctx.strokeStyle = '#378ADD';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = tc;
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  keys.forEach((k, i) => {
    const a = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
    ctx.fillText(k, cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16) + 3);
  });
}

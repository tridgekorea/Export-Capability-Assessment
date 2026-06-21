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
      <p>${strong.length ? strong.join(', ') + '이 우수합니다. 바이어 피칭 시 이 역량을 전면에 내세우세요.' : '진단 항목을 더 입력해주세요.'}</p></div>
    <div class="insight warn"><div class="it">⚠ 보완 필요</div>
      <p>${weak.length ? weak.join(', ') + ' 역량 강화가 선행되어야 바이어 발굴 효과가 높아집니다.' : '전반적으로 양호한 수준입니다.'}</p></div>
    <div class="insight ok"><div class="it">💡 ARK 활용 포인트</div>
      <p>${market} 내 ${product} 수입 실적 바이어를 HS코드로 필터링하고, ${strong[0] || '제품역량'} 중심의 첫 접촉 메시지를 구성하세요.</p></div>`;

  // ARK Strategy
  document.getElementById('ark-strategy').innerHTML = `
    <div class="insight info"><div class="it">🔍 ARK 권장 검색 조건</div>
      <p style="line-height:1.9">
        수입 실적: 최근 12개월 이내 · 수입액 $50만불+ 중소형 유통사 우선<br>
        채널: ${overallAvg >= 3.5 ? '온+오프라인 멀티채널 바이어' : '온라인 전문 바이어부터 접근 권장'}<br>
        인증: ${product.includes('식품') ? 'FDA·HACCP 요구 바이어 매칭' : '현지 인증 보유 여부 확인 후 접촉'}<br>
        결제: ${(STATE.scores['payment'] || 0) >= 3 ? 'L/C·T/T 모두 가능 바이어' : 'T/T 선호 바이어부터 시작'}
      </p></div>`;

  // Buyer cards
  const buyers = [
    { name:'K-Food Direct LLC',  loc:'🇺🇸 미국 · 뉴욕',              match:91, tags:['연 $2M+ 수입','아마존 FBA','한국식품 전문'], note:'빠른 온보딩, 소량 테스트 발주 가능' },
    { name:'Sunrise Trading Co.', loc:'🇯🇵 일본 · 도쿄',              match:84, tags:['편의점 납품','소량 다품종','K-푸드 집중'], note:'한국 식품 트렌드 적극 소싱 중' },
    { name:'AsiaBridge GmbH',     loc:'🇩🇪 독일 · 프랑크푸르트',      match:76, tags:['EU 전 지역','비건 선호','인증 필수'], note:'비건·오가닉 제품 수요 급증, 인증 필수' },
  ];
  document.getElementById('buyer-cards').innerHTML = buyers.map(b => `
    <div class="buyer-card">
      <div class="buyer-top">
        <div>
          <div class="buyer-name">${b.name}</div>
          <div class="buyer-loc">${b.loc}</div>
          <div class="buyer-tags">${b.tags.map(t => `<span class="buyer-tag">${t}</span>`).join('')}</div>
        </div>
        <div style="text-align:right"><div class="match-pct">${b.match}%</div><div class="match-lbl">매칭률</div></div>
      </div>
      <div class="buyer-note">${b.note}</div>
    </div>`).join('');
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

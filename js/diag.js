// js/diag.js — 역량 진단 UI

function buildDiag() {
  const el = document.getElementById('diag-list');
  if (!el) return;
  el.innerHTML = DIAG_ITEMS.map(d => `
    <div class="diag-item">
      <div class="diag-area-tag" style="background:${d.color}1a;color:${d.color}">${d.area}</div>
      <div class="diag-q">${d.q}</div>
      <div class="diag-hint">${d.hint}</div>
      <div class="score-btns">
        ${[1,2,3,4,5].map(n => `<button id="s-${d.id}-${n}" onclick="setScore('${d.id}',${n})">${n}점</button>`).join('')}
      </div>
    </div>`).join('');
}

function setScore(id, v) {
  STATE.scores[id] = v;
  [1,2,3,4,5].forEach(n => {
    const b = document.getElementById(`s-${id}-${n}`);
    if (b) b.className = n === v ? 'sel' : '';
  });
}

function calcScores() {
  const areas = {};
  DIAG_ITEMS.forEach(d => {
    const s = STATE.scores[d.id] || 0;
    if (!areas[d.area]) areas[d.area] = { total: 0, count: 0, color: d.color };
    areas[d.area].total += s;
    areas[d.area].count++;
  });
  STATE.areaScores = {};
  let total = 0, count = 0;
  Object.entries(areas).forEach(([name, v]) => {
    const sc = v.count ? +(v.total / v.count).toFixed(1) : 0;
    STATE.areaScores[name] = { score: sc, color: v.color };
    total += v.total;
    count += v.count;
  });
  STATE.overallAvg = count ? +(total / count).toFixed(1) : 0;
}

function calcAndGo() {
  calcScores();
  goStep(2);
}

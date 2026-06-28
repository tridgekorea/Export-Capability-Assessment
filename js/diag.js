// js/diag.js — 역량 진단 UI (서술형)

function buildDiag() {
  const el = document.getElementById('diag-list');
  if (!el) return;

  // 영역별로 묶어서 렌더링
  const areas = {};
  DIAG_ITEMS.forEach(d => {
    if (!areas[d.area]) areas[d.area] = { color: d.color, items: [] };
    areas[d.area].items.push(d);
  });

  el.innerHTML = Object.entries(areas).map(([area, v]) => `
    <div style="margin-bottom:1.25rem">
      <div style="font-size:10px;font-weight:600;color:${v.color};letter-spacing:.06em;text-transform:uppercase;padding:4px 0;border-bottom:1px solid #e0ddd6;margin-bottom:.75rem">${area}</div>
      ${v.items.map(d => `
        <div class="diag-item" style="margin-bottom:.75rem">
          <div class="diag-q" style="font-size:12px;font-weight:500;color:#1a1a18;margin-bottom:4px">${d.q}</div>
          <textarea id="ans-${d.id}" rows="2"
            placeholder="자유롭게 답변해주세요..."
            style="width:100%;padding:8px 10px;border:1px solid #d0cec8;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;line-height:1.6"
            oninput="STATE.answers = STATE.answers || {}; STATE.answers['${d.id}'] = this.value"
          ></textarea>
        </div>`).join('')}
    </div>`).join('');
}

// 답변 수집
function collectAnswers() {
  const answers = {};
  DIAG_ITEMS.forEach(d => {
    const el = document.getElementById('ans-' + d.id);
    answers[d.id] = el ? el.value.trim() : '';
  });
  STATE.answers = answers;
  return answers;
}

// AI 채점 후 3단계로 이동
async function calcAndGo() {
  const answers = collectAnswers();
  const filled = Object.values(answers).filter(v => v.length > 0).length;

  if (filled < 5) {
    alert('최소 5개 이상 답변을 입력해주세요.');
    return;
  }

  const btn = document.getElementById('diag-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = '✦ AI 분석 중...'; }

  try {
    await aiScoreDiag(answers);
    goStep(2);
  } catch(e) {
    alert('AI 분석 실패: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✦ AI 역량 분석 시작 →'; }
  }
}

// AI 채점 함수
async function aiScoreDiag(answers) {
  const areas = {};
  DIAG_ITEMS.forEach(d => {
    if (!areas[d.area]) areas[d.area] = { color: d.color, items: [] };
    areas[d.area].items.push(d);
  });

  const answerText = DIAG_ITEMS.map(d => {
    return `[${d.area}] ${d.q}\n답변: ${answers[d.id] || '(미답변)'}`;
  }).join('\n\n');

  const systemPrompt = `당신은 한국 수출 기업 역량 진단 전문가입니다.
기업의 서술형 답변을 분석하여 각 영역별 점수와 근거를 JSON으로만 반환합니다.
마크다운 없이 JSON만 출력하세요.`;

  const userPrompt = `아래 기업의 수출 역량 진단 답변을 분석하여 영역별로 1~5점으로 채점해주세요.

${answerText}

다음 JSON 형식으로만 반환하세요:
{
  "제품역량": { "score": 3.2, "reason": "채점 근거 1문장" },
  "브랜드·인증": { "score": 4.0, "reason": "채점 근거 1문장" },
  "인적역량": { "score": 2.5, "reason": "채점 근거 1문장" },
  "시장개척": { "score": 3.0, "reason": "채점 근거 1문장" },
  "기본역량": { "score": 2.8, "reason": "채점 근거 1문장" }
}

채점 기준:
1점: 전혀 준비 안 됨 / 미답변
2점: 초기 단계, 매우 미흡
3점: 보통, 일부 준비됨
4점: 양호, 대부분 준비됨
5점: 우수, 충분히 준비됨`;

  const text = await callClaude(systemPrompt, userPrompt, null);
  const clean = text.replace(/```json|```/g, '').trim();
  const result = JSON.parse(clean);

  // STATE에 저장
  STATE.areaScores = {};
  STATE.aiReasons = {};
  let total = 0, count = 0;

  const colorMap = {};
  DIAG_ITEMS.forEach(d => { colorMap[d.area] = d.color; });

  Object.entries(result).forEach(([area, v]) => {
    STATE.areaScores[area] = {
      score: Number(v.score).toFixed(1) * 1,
      color: colorMap[area] || '#185FA5'
    };
    STATE.aiReasons[area] = v.reason || '';
    total += Number(v.score);
    count++;
  });

  STATE.overallAvg = count ? +(total / count).toFixed(1) : 0;

  // 기존 scores 호환성 유지
  STATE.scores = {};
  DIAG_ITEMS.forEach(d => {
    STATE.scores[d.id] = STATE.areaScores[d.area]?.score || 0;
  });
}

// js/roadmap.js — v4 Final · 예시 형태 그대로 반영

// ── ARK 실측 지역별 응답률 ────────────────────────────
const ARK_RESPONSE_RATE = {
  '미국/캐나다': { rate: 0.17, region: 'Americas', targetBuyers: 57 },
  '일본':        { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
  '중국':        { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
  '동남아':      { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
  '유럽':        { rate: 0.19, region: 'EU',        targetBuyers: 78 },
  '중동':        { rate: 0.22, region: 'MENA',      targetBuyers: 85 },
  '호주':        { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
};

function calcFunnel(avg, market) {
  const d = ARK_RESPONSE_RATE[market] || { rate: 0.20, region: 'Global', targetBuyers: 80 };
  const outreach     = avg >= 4 ? 80 : avg >= 3 ? 50 : 30;
  const response     = Math.round(outreach * d.rate);
  const meeting      = Math.round(response * 0.50);
  const sampleOrder  = Math.round(meeting  * 0.60);
  const contract     = Math.max(1, Math.round(sampleOrder * 0.50));
  return { outreach, response, meeting, sampleOrder, contract, rate: d.rate, region: d.region };
}

function exportGoals(avg) {
  return {
    s: avg >= 4 ? '$50만불'  : avg >= 3 ? '$30만불'  : '$10만불',
    m: avg >= 4 ? '$200만불' : avg >= 3 ? '$100만불' : '$50만불',
    l: avg >= 4 ? '$500만불' : avg >= 3 ? '$200만불' : '$100만불',
  };
}

// ── 메인 로드맵 생성 ─────────────────────────────────
async function generateRoadmap() {
  const btn    = document.getElementById('roadmap-btn');
  const status = document.getElementById('roadmap-status');
  const output = document.getElementById('roadmap-output');

  const { overallAvg, areaScores } = STATE;
  const name     = getField('f-name')    || '(미입력)';
  const product  = getField('f-product') || '가공식품';
  const market   = getField('f-market')  || '미국/캐나다';
  const exp      = getField('f-exp')     || '미경험';
  const usp      = getField('f-usp')     || '';
  const meetmemo = getField('f-meetmemo') || '';

  const grade   = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong  = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k);
  const weak    = Object.entries(areaScores).filter(([,v]) => v.score <  2.5).map(([k]) => k);
  const areaStr = Object.entries(areaScores).map(([k,v]) => `${k}: ${v.score}점`).join(' / ');

  const f = calcFunnel(overallAvg, market);
  const g = exportGoals(overallAvg);

  btn.disabled = true;
  status.className = 'ai-status loading';
  status.style.display = 'block';
  status.innerHTML = '<span class="spinner"></span> AI가 맞춤형 수출 로드맵을 생성하고 있습니다...';

  // ── 1단계: 구조적 HTML 즉시 렌더링 ──────────────────
  output.innerHTML = buildRoadmapHTML(name, product, market, overallAvg, grade, strong, weak, f, g);

  // ── 2단계: AI 서술 스트리밍 ──────────────────────────
  const aiBox = document.getElementById('rm-phases');
  if (!aiBox) return;

  const systemPrompt = `당신은 Tridge ARK 수출 솔루션 전문 컨설턴트입니다.

Tridge ARK 핵심 개념:
- ARK 대행: 바이어 발굴·스코어링 → 30개+ 언어 AI 아웃리치 직접 발송 → 미팅 세팅·중계
- 고객사 담당: 미팅 참여 → 가격 협상 → 계약 체결 → 샘플 발송

규칙:
- "ARK에서 검색", "리스트 추출" 절대 금지 → "ARK가 직접 대행"으로만 표현
- 추상적 표현 금지 → 내일 당장 실행 가능한 수준으로 구체적 작성
- 각 단계마다 반드시 ARK 역할 / 고객사 역할을 분리해서 명시`;

  const userPrompt = `아래 기업의 수출역량 진단 결과로 3단계 실행 전략을 작성하세요.

기업: ${name} | 품목: ${product} | 목표시장: ${market}(${f.region})
역량: ${overallAvg}/5.0(${grade}) | ${areaStr}
강점: ${strong.join(', ')||'없음'} | 보완필요: ${weak.join(', ')||'없음'}
USP: ${usp} | 미팅메모: ${meetmemo}
ARK퍼널: 아웃리치 ${f.outreach}개사 → 응답 ${f.response}건(${f.region} ${(f.rate*100).toFixed(0)}%) → 미팅 ${f.meeting}건 → 계약 ${f.contract}건

아래 형식으로 정확히 작성하세요. 구분자(---PHASE_START---, ---ARK_START--- 등)를 반드시 포함:

---PHASE_START---
PHASE_TITLE: 단기 (0~3개월) — ARK 아웃리치 개시 및 첫 미팅 성사
PHASE_KPI: 목표 ${g.s}
PHASE_DESC: (2~3문장. ${market} 시장 특성, 이 기업 강점·약점 고려한 단기 핵심 전략)
---ARK_START---
(ARK가 대행하는 것 3가지, 각각 한 줄)
---ARK_END---
---CLIENT_START---
(고객사가 실행할 것 3가지, 각각 한 줄)
---CLIENT_END---
---PHASE_END---

---PHASE_START---
PHASE_TITLE: 중기 (3~12개월) — 미팅을 계약으로 전환
PHASE_KPI: 목표 ${g.m}
PHASE_DESC: (2~3문장. 샘플오더→계약 전환 핵심 포인트, ARK 2차 아웃리치 방향)
---ARK_START---
(ARK가 대행하는 것 3가지)
---ARK_END---
---CLIENT_START---
(고객사가 실행할 것 3가지)
---CLIENT_END---
---PHASE_END---

---PHASE_START---
PHASE_TITLE: 장기 (12개월~) — 안정 바이어망 & 시장 확장
PHASE_KPI: 목표 ${g.l}
PHASE_DESC: (2~3문장. 장기계약 바이어 확보, 신규 시장 확장 방향)
---ARK_START---
(ARK가 대행하는 것 3가지)
---ARK_END---
---CLIENT_START---
(고객사가 실행할 것 3가지)
---CLIENT_END---
---PHASE_END---

---MEMO_START---
(ARK 담당자 핵심 메모: 가장 중요한 병목 1가지와 해결 방향 2~3문장)
---MEMO_END---`;

  try {
    let fullText = '';
    await callClaude(systemPrompt, userPrompt, (chunk) => {
      fullText += chunk;
      parseAndRenderPhases(fullText, aiBox);
    });

    // 메모 렌더링
    const memoMatch = fullText.match(/---MEMO_START---([\s\S]*?)---MEMO_END---/);
    if (memoMatch) {
      const memoEl = document.getElementById('rm-memo');
      const memoTextEl = document.getElementById('rm-memo-text');
      if (memoEl && memoTextEl) {
        memoTextEl.textContent = memoMatch[1].trim();
        memoEl.style.display = 'block';
      }
    }

    status.className = 'ai-status success';
    status.innerHTML = '✓ 로드맵 생성 완료 — PDF로 저장하거나 고객사에 바로 공유하세요.';
    btn.disabled = false;
    btn.textContent = '✦ 다시 생성';

    // PDF 버튼 추가
    addRoadmapPdfBtn(output);

  } catch(e) {
    status.className = 'ai-status error';
    status.innerHTML = `오류: ${e.message}`;
    btn.disabled = false;
  }
}

// ── 구조적 HTML 빌더 ─────────────────────────────────
function buildRoadmapHTML(name, product, market, avg, grade, strong, weak, f, g) {
  const pct = (f.rate*100).toFixed(0);
  return `
<style>
.rm{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:13px;color:#1a1a18}
.rm-hdr{padding-bottom:1rem;margin-bottom:1.25rem;border-bottom:2px solid #185FA5}
.rm-eyebrow{font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#185FA5;margin-bottom:.3rem}
.rm-corp{font-size:18px;font-weight:500;margin-bottom:.2rem}
.rm-meta{font-size:11px;color:#9c9a92}
.rm-grade{display:inline-block;font-size:11px;font-weight:500;padding:3px 12px;border-radius:20px;background:#E1F5EE;color:#0F6E56;margin-top:.4rem}
.rm-sec{font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#9c9a92;margin:1.5rem 0 .75rem;padding-bottom:.35rem;border-bottom:0.5px solid #e0ddd6}
.rm-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.5rem}
.rm-card{background:#f5f4f0;border-radius:8px;padding:.75rem;text-align:center}
.rm-card .n{font-size:17px;font-weight:500}
.rm-card .l{font-size:10px;color:#9c9a92;margin-top:2px}
.rm-tl-wrap{overflow-x:auto;margin-bottom:1.5rem}
.rm-tl{width:100%;border-collapse:collapse;font-size:10px;min-width:540px}
.rm-tl th,.rm-tl td{border:0.5px solid #e0ddd6;padding:5px 6px}
.rm-tl th{font-weight:500;text-align:center}
.th-s{background:#EBF3FC;color:#0C447C}
.th-m{background:#E1F5EE;color:#085041}
.th-l{background:#FAEEDA;color:#633806}
.th-a{background:#f5f4f0;color:#5f5e5a;text-align:left;width:72px;font-size:9px}
.td-a{font-weight:500;font-size:10px;background:#f5f4f0;white-space:nowrap;color:#1a1a18}
.td-c{vertical-align:top;color:#5f5e5a;line-height:1.5}
.td-e{color:#9c9a92;font-style:italic;font-size:9px}
.td-kpi{font-weight:500;text-align:center}
.ci{display:flex;align-items:start;gap:4px;margin-bottom:3px;font-size:10px}
.ci:last-child{margin-bottom:0}
.cd{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:3px}
.cd-a{background:#185FA5}.cd-c{background:#1D9E75}
.rm-leg{display:flex;gap:12px;margin-bottom:.6rem;font-size:10px;color:#5f5e5a}
.rm-leg span{display:flex;align-items:center;gap:4px}
.rm-leg i{width:8px;height:8px;border-radius:50%;display:inline-block}
.rm-funnel{display:flex;align-items:center;gap:0;margin-bottom:.5rem}
.rf-box{flex:1;text-align:center;padding:.6rem .4rem;background:#f5f4f0;border:0.5px solid #e0ddd6}
.rf-box:first-child{border-radius:8px 0 0 8px}
.rf-box:last-child{border-radius:0 8px 8px 0}
.rf-box .fn{font-size:16px;font-weight:500;color:#185FA5}
.rf-box .fl{font-size:9px;color:#9c9a92;margin-top:2px}
.rf-arr{font-size:12px;color:#9c9a92;flex-shrink:0;padding:0 3px}
.rf-note{font-size:10px;color:#9c9a92;margin-bottom:1.5rem;text-align:center}
.rm-phase{border:0.5px solid #e0ddd6;border-radius:10px;overflow:hidden;margin-bottom:.75rem}
.rm-ph-hd{padding:.65rem 1rem;display:flex;align-items:center;justify-content:space-between}
.rm-ph-hd.ph0{background:#EBF3FC}
.rm-ph-hd.ph1{background:#E1F5EE}
.rm-ph-hd.ph2{background:#FAEEDA}
.rm-ph-title{font-size:12px;font-weight:500}
.ph0 .rm-ph-title{color:#0C447C}
.ph1 .rm-ph-title{color:#085041}
.ph2 .rm-ph-title{color:#633806}
.rm-ph-kpi{font-size:11px;font-weight:500;color:#1a1a18}
.rm-ph-body{padding:.85rem 1rem;background:#ffffff}
.rm-ph-desc{font-size:12px;color:#5f5e5a;line-height:1.75;margin-bottom:.65rem}
.rm-roles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.role-ark{background:#E6F1FB;border:0.5px solid #B5D4F4;border-radius:6px;padding:.6rem .75rem}
.role-cli{background:#f5f4f0;border:0.5px solid #e0ddd6;border-radius:6px;padding:.6rem .75rem}
.role-lbl{font-size:10px;font-weight:500;margin-bottom:.3rem}
.role-ark .role-lbl{color:#185FA5}
.role-cli .role-lbl{color:#9c9a92}
.role-list{list-style:none;padding:0}
.role-list li{font-size:11px;color:#5f5e5a;padding:2px 0 2px 10px;position:relative;line-height:1.5}
.role-list li::before{content:'·';position:absolute;left:0}
.rm-chk{list-style:none;padding:0;margin-bottom:1.5rem}
.rm-chk li{display:flex;align-items:start;gap:8px;padding:.55rem 0;border-bottom:0.5px solid #e0ddd6;font-size:11px;color:#5f5e5a;line-height:1.55}
.rm-chk li:last-child{border-bottom:none}
.chk-ic{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0;margin-top:1px}
.chk-m{background:#FCEBEB;color:#791F1F}
.chk-g{background:#FAEEDA;color:#633806}
.chk-bd strong{color:#1a1a18;display:block;margin-bottom:1px}
.rm-act{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:1.5rem}
.rm-act th{background:#f5f4f0;padding:6px 10px;text-align:left;font-size:10px;font-weight:500;color:#9c9a92;text-transform:uppercase;letter-spacing:.04em;border-bottom:0.5px solid #e0ddd6}
.rm-act td{padding:7px 10px;border-bottom:0.5px solid #e0ddd6}
.rm-act tr:last-child td{border-bottom:none}
.tag{display:inline-block;font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px}
.tn{background:#FCEBEB;color:#791F1F}
.ts2{background:#E6F1FB;color:#0C447C}
.tm{background:#E1F5EE;color:#085041}
.rm-memo{background:#f5f4f0;border-radius:8px;padding:.9rem 1rem;border-left:3px solid #185FA5;font-size:11px;color:#5f5e5a;line-height:1.75;margin-top:1rem}
.rm-memo strong{color:#1a1a18;display:block;margin-bottom:.3rem}
.ph-loading{font-size:12px;color:#9c9a92;padding:1rem;text-align:center}
</style>

<div class="rm">
  <div class="rm-hdr">
    <div class="rm-eyebrow">AI 수출 로드맵 · Tridge ARK</div>
    <div class="rm-corp">${name}</div>
    <div class="rm-meta">${product} · 목표시장: ${market} (${f.region}) · ${nowStr()}</div>
    <span class="rm-grade">${grade} · 종합 ${avg} / 5.0</span>
  </div>

  <div class="rm-sum">
    <div class="rm-card"><div class="n" style="color:#185FA5">${avg}</div><div class="l">종합 점수</div></div>
    <div class="rm-card"><div class="n" style="color:#0F6E56">${grade}</div><div class="l">수출 등급</div></div>
    <div class="rm-card"><div class="n" style="color:#1D9E75;font-size:12px">${strong[0]||'-'}</div><div class="l">최고 강점</div></div>
    <div class="rm-card"><div class="n" style="color:#E24B4A;font-size:12px">${weak[0]||'-'}</div><div class="l">핵심 보완</div></div>
  </div>

  <div class="rm-sec">수출 로드맵 타임라인</div>
  <div class="rm-leg">
    <span><i style="background:#185FA5"></i> ARK 대행</span>
    <span><i style="background:#1D9E75"></i> 고객사 실행</span>
  </div>
  <div class="rm-tl-wrap">
    <table class="rm-tl">
      <tr>
        <th class="th-a" rowspan="2"></th>
        <th class="th-s" colspan="3">단기 · 0~3개월</th>
        <th class="th-m" colspan="3">중기 · 3~12개월</th>
        <th class="th-l" colspan="2">장기 · 12개월~</th>
      </tr>
      <tr>
        <th class="th-s">M+1</th><th class="th-s">M+2</th><th class="th-s">M+3</th>
        <th class="th-m">M+4~6</th><th class="th-m">M+7~9</th><th class="th-m">M+10~12</th>
        <th class="th-l">M+13~18</th><th class="th-l">M+18+</th>
      </tr>
      <tr>
        <td class="td-a">ARK 실행</td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>바이어 분석·스코어링</span></div><div class="ci"><div class="cd cd-a"></div><span>아웃리치 개시 (${f.outreach}개사)</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>응답 관리</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>미팅 세팅 ${f.meeting}건</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>2차 아웃리치 준비</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>2차 시장 아웃리치</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>3차 아웃리치 준비</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>시장 확장 분석</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-a"></div><span>유럽·신규 아웃리치</span></div></td>
      </tr>
      <tr>
        <td class="td-a">제품·인증</td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>영문 카탈로그 완성</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>FDA 등록 착수</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>샘플 30개+ 준비</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>현지어 포장 개발</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>인증 완료</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>2차 시장 인증 착수</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>추가 인증 취득</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>EU 유기농 인증</span></div></td>
      </tr>
      <tr>
        <td class="td-a">영업·계약</td>
        <td class="td-e">준비 단계</td>
        <td class="td-e">준비 단계</td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>바이어 미팅 참여</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>샘플 발송·협상</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>계약 ${f.contract}건 목표</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>재주문 관리</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>장기계약 전환</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>전략 파트너 3곳+</span></div></td>
      </tr>
      <tr>
        <td class="td-a">KPI</td>
        <td colspan="3" class="td-kpi" style="color:#0C447C;background:#EBF3FC22">미팅 ${f.meeting}건 · ${g.s}</td>
        <td colspan="3" class="td-kpi" style="color:#085041;background:#E1F5EE22">계약 ${f.contract}건 · ${g.m}</td>
        <td colspan="2" class="td-kpi" style="color:#633806;background:#FAEEDA22">5개국 · ${g.l}</td>
      </tr>
    </table>
  </div>

  <div class="rm-sec">ARK 바이어 발굴 퍼널 · ${f.region} 실측 응답률 ${pct}% 기준</div>
  <div class="rm-funnel">
    <div class="rf-box"><div class="fn">${f.outreach}</div><div class="fl">아웃리치</div></div>
    <div class="rf-arr">→</div>
    <div class="rf-box"><div class="fn">${f.response}</div><div class="fl">응답</div></div>
    <div class="rf-arr">→</div>
    <div class="rf-box"><div class="fn">${f.meeting}</div><div class="fl">미팅</div></div>
    <div class="rf-arr">→</div>
    <div class="rf-box"><div class="fn">${f.sampleOrder}</div><div class="fl">샘플오더</div></div>
    <div class="rf-arr">→</div>
    <div class="rf-box"><div class="fn">${f.contract}</div><div class="fl">계약</div></div>
  </div>
  <div class="rf-note">응답률 ${pct}% (${f.region} 실측) · 응답→미팅 50% · 미팅→샘플 60% · 샘플→계약 50%</div>

  <div class="rm-sec">단계별 실행 전략 (AI 분석)</div>
  <div id="rm-phases"><div class="ph-loading"><span class="spinner"></span> AI가 단계별 전략을 분석하고 있습니다...</div></div>

  <div class="rm-sec">ARK 아웃리치 전 고객사 준비 조건</div>
  <ul class="rm-chk">
    <li><span class="chk-ic chk-m">필수</span><div class="chk-bd"><strong>영문 제품 카탈로그 + FOB 가격시트</strong>바이어가 미팅 전 검토하는 1순위 자료. 없으면 신뢰도 급락</div></li>
    <li><span class="chk-ic chk-m">필수</span><div class="chk-bd"><strong>샘플 재고 30개 이상 즉시 발송 가능</strong>미팅 후 48시간 내 발송 불가 시 기회 소멸</div></li>
    <li><span class="chk-ic chk-m">필수</span><div class="chk-bd"><strong>수출 전담 담당자 1명 지정</strong>ARK가 미팅을 세팅해도 후속 담당자 없으면 계약 불가</div></li>
    <li><span class="chk-ic chk-g">권장</span><div class="chk-bd"><strong>MOQ · 납기 · 결제 조건 사전 결정</strong>미팅에서 즉답 불가하면 바이어 온도 급냉</div></li>
    <li><span class="chk-ic chk-g">권장</span><div class="chk-bd"><strong>영문 회사소개서 1~2페이지</strong>바이어가 공급사 신뢰도를 판단하는 기초 자료</div></li>
  </ul>

  <div class="rm-sec">이번 주 즉시 실행 액션</div>
  <table class="rm-act">
    <tr>
      <th style="width:40%">액션</th><th style="width:22%">담당</th>
      <th style="width:16%">기한</th><th style="width:22%">우선순위</th>
    </tr>
    <tr><td>영문 카탈로그 + 가격시트 제작</td><td>고객사 마케팅</td><td>2주</td><td><span class="tag tn">즉시</span></td></tr>
    <tr><td>샘플 재고 30개 확보</td><td>고객사 생산팀</td><td>2주</td><td><span class="tag tn">즉시</span></td></tr>
    <tr><td>수출 전담 담당자 지정</td><td>고객사 대표</td><td>1주</td><td><span class="tag tn">즉시</span></td></tr>
    <tr><td>ARK 아웃리치 대상 HS코드 확정</td><td>ARK 담당자</td><td>1주</td><td><span class="tag tn">즉시</span></td></tr>
    <tr><td>MOQ·납기·결제 조건 내부 합의</td><td>고객사 경영진</td><td>2주</td><td><span class="tag ts2">단기</span></td></tr>
    <tr><td>FDA 등록 절차 확인 및 착수</td><td>고객사 수출팀</td><td>1개월</td><td><span class="tag tm">중기</span></td></tr>
  </table>

  <div class="rm-memo" id="rm-memo" style="display:none">
    <strong>ARK 담당자 핵심 메모</strong>
    <span id="rm-memo-text"></span>
  </div>
</div>`;
}

// ── AI 응답 파싱 → 단계별 카드 렌더링 ───────────────
function parseAndRenderPhases(text, container) {
  const phHdColors = [
    {bg:'#EBF3FC',color:'#0C447C'},
    {bg:'#E1F5EE',color:'#085041'},
    {bg:'#FAEEDA',color:'#633806'},
  ];
  const phases = [];
  const phaseRegex = /---PHASE_START---([\s\S]*?)---PHASE_END---/g;
  let match;
  while ((match = phaseRegex.exec(text)) !== null) {
    const block    = match[1];
    const title    = (block.match(/PHASE_TITLE:\s*(.+)/) || [])[1]?.trim() || '';
    const kpi      = (block.match(/PHASE_KPI:\s*(.+)/)   || [])[1]?.trim() || '';
    const desc     = (block.match(/PHASE_DESC:\s*([\s\S]*?)(?=---ARK_START---|$)/) || [])[1]?.trim() || '';
    const arkBlock = (block.match(/---ARK_START---([\s\S]*?)---ARK_END---/)    || [])[1]?.trim() || '';
    const cliBlock = (block.match(/---CLIENT_START---([\s\S]*?)---CLIENT_END---/) || [])[1]?.trim() || '';
    const arkItems = arkBlock.split('\n').map(l=>l.replace(/^[-*·\d\.]+\s*/,'')).filter(Boolean);
    const cliItems = cliBlock.split('\n').map(l=>l.replace(/^[-*·\d\.]+\s*/,'')).filter(Boolean);

    // 고객사 실행 항목에서 표 형식 파싱 (항목|행동|기한)
    const cliTable = cliItems.map(item => {
      const parts = item.split('|').map(s=>s.trim());
      if (parts.length >= 3) return { label: parts[0], action: parts[1], due: parts[2] };
      const colonIdx = item.indexOf(':');
      if (colonIdx > 0) return { label: item.slice(0,colonIdx).trim(), action: item.slice(colonIdx+1).trim(), due:'' };
      return { label:'', action: item, due:'' };
    });

    phases.push({ title, kpi, desc, arkItems, cliItems, cliTable });
  }

  if (phases.length === 0) {
    container.innerHTML = '<div style="font-size:12px;color:#9c9a92;padding:1rem;text-align:center"><span class="spinner"></span> 분석 중...</div>';
    return;
  }

  container.innerHTML = phases.map((p, i) => {
    const hd = phHdColors[i] || phHdColors[0];
    const hasTable = p.cliTable.some(r => r.due);

    const cliContent = hasTable ? `
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:.4rem">
        <tr>
          <th style="background:#f5f4f0;padding:5px 8px;text-align:left;font-size:10px;font-weight:500;color:#9c9a92;border:0.5px solid #e0ddd6">준비 항목</th>
          <th style="background:#f5f4f0;padding:5px 8px;text-align:left;font-size:10px;font-weight:500;color:#9c9a92;border:0.5px solid #e0ddd6">구체적 행동</th>
          <th style="background:#f5f4f0;padding:5px 8px;text-align:left;font-size:10px;font-weight:500;color:#9c9a92;border:0.5px solid #e0ddd6;width:60px">기한</th>
        </tr>
        ${p.cliTable.map(r=>`
        <tr>
          <td style="padding:5px 8px;border:0.5px solid #e0ddd6;color:#1a1a18;font-weight:500">${r.label||'-'}</td>
          <td style="padding:5px 8px;border:0.5px solid #e0ddd6;color:#5f5e5a">${r.action}</td>
          <td style="padding:5px 8px;border:0.5px solid #e0ddd6;color:#5f5e5a;white-space:nowrap">${r.due||'-'}</td>
        </tr>`).join('')}
      </table>` : `
      <ul style="list-style:none;padding:0">
        ${p.cliItems.map(t=>`<li style="font-size:11px;color:#5f5e5a;padding:2px 0 2px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0">·</span>${t}</li>`).join('')}
      </ul>`;

    return `
    <div style="border:0.5px solid #e0ddd6;border-radius:10px;overflow:hidden;margin-bottom:.75rem">
      <div style="padding:.65rem 1rem;display:flex;align-items:center;justify-content:space-between;background:${hd.bg}">
        <span style="font-size:12px;font-weight:500;color:${hd.color}">${p.title}</span>
        <span style="font-size:11px;font-weight:500;color:#1a1a18">${p.kpi}</span>
      </div>
      <div style="padding:.85rem 1rem;background:#ffffff">
        <p style="font-size:12px;color:#5f5e5a;line-height:1.75;margin-bottom:.65rem">${p.desc}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#E6F1FB;border:0.5px solid #B5D4F4;border-radius:6px;padding:.6rem .75rem">
            <div style="font-size:10px;font-weight:500;color:#185FA5;margin-bottom:.3rem">ARK 대행</div>
            <ul style="list-style:none;padding:0">
              ${p.arkItems.map(t=>`<li style="font-size:11px;color:#5f5e5a;padding:2px 0 2px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0">·</span>${t}</li>`).join('')}
            </ul>
          </div>
          <div style="background:#f5f4f0;border:0.5px solid #e0ddd6;border-radius:6px;padding:.6rem .75rem">
            <div style="font-size:10px;font-weight:500;color:#9c9a92;margin-bottom:.3rem">고객사 실행</div>
            ${cliContent}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── PDF 버튼 추가 ─────────────────────────────────────
function addRoadmapPdfBtn(container) {
  const existing = document.getElementById('roadmap-pdf-btn');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'roadmap-pdf-btn';
  btn.style.cssText = 'display:block;width:100%;margin-top:1rem;padding:11px;background:#185FA5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit';
  btn.textContent = '⬇ 로드맵 PDF 다운로드';
  btn.onclick = downloadRoadmapPdf;
  container.appendChild(btn);
}

// ── 로드맵 PDF 다운로드 ──────────────────────────────
async function downloadRoadmapPdf() {
  if (!window.jspdf) { alert('PDF 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  const { jsPDF } = window.jspdf;

  let nanumRegular = null;
  try {
    nanumRegular = await fetch('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/NanumGothic.woff').then(r => r.arrayBuffer());
  } catch(e) { console.warn('폰트 로드 실패:', e); }

  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  if (nanumRegular) {
    const b64 = (buf) => { let s=''; new Uint8Array(buf).forEach(b => s+=String.fromCharCode(b)); return btoa(s); };
    doc.addFileToVFS('NanumGothic.ttf', b64(nanumRegular));
    doc.addFont('NanumGothic.ttf','NanumGothic','normal');
    doc.setFont('NanumGothic','normal');
  }
  const KR  = nanumRegular ? 'NanumGothic' : 'helvetica';
  const W=210, M=18, cw=W-M*2;
  let y=22;

  const { overallAvg, areaScores } = STATE;
  const name    = getField('f-name')    || '기업명';
  const product = getField('f-product') || '-';
  const market  = getField('f-market')  || '-';
  const f = calcFunnel(overallAvg, market);
  const g = exportGoals(overallAvg);
  const grade  = overallAvg>=4?'우수':overallAvg>=3?'양호':overallAvg>=2?'보통':'초기';
  const strong = Object.entries(areaScores).filter(([,v])=>v.score>=3.5).map(([k])=>k);
  const weak   = Object.entries(areaScores).filter(([,v])=>v.score<2.5).map(([k])=>k);

  const chkY  = (n=8)=>{ if(y+n>275){doc.addPage();y=20;} };
  const sec   = (t)=>{ chkY(14);y+=3; doc.setFont(KR,'normal');doc.setFontSize(10);doc.setTextColor(24,95,165);doc.text(t,M,y);y+=4; doc.setDrawColor(24,95,165);doc.setLineWidth(0.2);doc.line(M,y,W-M,y);y+=5;doc.setTextColor(40,40,40); };
  const row   = (lbl,val)=>{ chkY(7);doc.setFont(KR,'normal');doc.setFontSize(9);doc.setTextColor(110,110,110);doc.text(lbl,M,y);doc.setTextColor(40,40,40);const ls=doc.splitTextToSize(String(val),cw-42);doc.text(ls,M+40,y);y+=ls.length*5+1; };

  // 헤더
  doc.setFont(KR,'normal');doc.setFontSize(16);doc.setTextColor(24,95,165);
  doc.text('AI 수출 로드맵 · Tridge ARK',M,y);y+=7;
  doc.setFontSize(9);doc.setTextColor(150,150,150);
  doc.text(`${name}  ·  ${nowStr()}  ·  종합 ${overallAvg}/5.0 (${grade})`,M,y);y+=8;
  doc.setDrawColor(200,210,220);doc.setLineWidth(0.3);doc.line(M,y,W-M,y);y+=8;

  sec('1. 기업 및 역량 요약');
  row('기업명',name);row('주요 품목',product);row('목표 시장',`${market} (${f.region})`);
  row('종합 점수',`${overallAvg}/5.0 (${grade})`);
  row('강점',strong.length?strong.join(', '):'데이터 부족');
  row('보완 필요',weak.length?weak.join(', '):'전반 양호');
  y+=4;

  sec('2. ARK 바이어 발굴 퍼널');
  row('목표 시장 응답률',`${(f.rate*100).toFixed(0)}% (${f.region} 실측치)`);
  row('아웃리치 목표',`${f.outreach}개사`);
  row('응답 예상',`${f.response}건`);
  row('미팅 성사',`${f.meeting}건`);
  row('샘플 오더',`${f.sampleOrder}건`);
  row('계약 목표',`${f.contract}건`);
  y+=4;

  sec('3. 단계별 KPI');
  row('단기 (0~3개월)',`미팅 ${f.meeting}건 · ${g.s}`);
  row('중기 (3~12개월)',`계약 ${f.contract}건 · ${g.m}`);
  row('장기 (12개월~)',`5개국 · ${g.l}`);
  y+=4;

  sec('4. 고객사 준비 조건');
  ['영문 카탈로그 + FOB 가격시트 (필수)',
   '샘플 재고 30개+ 즉시 발송 가능 (필수)',
   '수출 전담 담당자 1명 지정 (필수)',
   'MOQ·납기·결제 조건 사전 결정 (권장)',
   '영문 회사소개서 1~2페이지 (권장)'
  ].forEach((item,i)=>{ chkY(7);doc.setFont(KR,'normal');doc.setFontSize(9);doc.setTextColor(60,60,60);doc.text(`${i+1}. ${item}`,M+4,y);y+=6; });
  y+=4;

  sec('5. 이번 주 즉시 실행 액션');
  [['영문 카탈로그 + 가격시트 제작','고객사 마케팅','2주'],
   ['샘플 재고 30개 확보','고객사 생산팀','2주'],
   ['수출 전담 담당자 지정','고객사 대표','1주'],
   ['ARK 아웃리치 HS코드 확정','ARK 담당자','1주'],
   ['MOQ·납기·결제 조건 합의','고객사 경영진','2주'],
   ['FDA 등록 절차 착수','고객사 수출팀','1개월'],
  ].forEach(([a,o,d])=>{ chkY(7);doc.setFont(KR,'normal');doc.setFontSize(9);doc.setTextColor(40,40,40);const ls=doc.splitTextToSize(a,cw-50);doc.text(ls,M,y);doc.setTextColor(120,120,120);doc.text(`${o} · ${d}`,W-M,y,{align:'right'});y+=ls.length*5+2; });

  // AI 서술 텍스트
  const phases = document.querySelectorAll('.rm-phase');
  if (phases.length > 0) {
    y+=4; sec('6. AI 단계별 실행 전략');
    phases.forEach(ph => {
      chkY(12);
      const title = ph.querySelector('.rm-ph-title')?.textContent||'';
      const kpi   = ph.querySelector('.rm-ph-kpi')?.textContent||'';
      doc.setFont(KR,'normal');doc.setFontSize(10);doc.setTextColor(24,95,165);
      doc.text(`${title} — ${kpi}`,M,y);y+=6;
      const desc = ph.querySelector('.rm-ph-desc')?.textContent||'';
      if(desc){ const ls=doc.splitTextToSize(desc,cw);doc.setFontSize(9);doc.setTextColor(60,60,60);ls.forEach(l=>{chkY(6);doc.text(l,M,y);y+=5;}); }
      const arkItems = [...ph.querySelectorAll('.role-ark li')].map(l=>l.textContent);
      const cliItems = [...ph.querySelectorAll('.role-cli li')].map(l=>l.textContent);
      if(arkItems.length){ chkY(7);doc.setFontSize(9);doc.setTextColor(24,95,165);doc.text('ARK 대행:',M,y);y+=5; arkItems.forEach(t=>{chkY(6);doc.setTextColor(60,60,60);doc.text(`  · ${t}`,M,y);y+=5;}); }
      if(cliItems.length){ chkY(7);doc.setFontSize(9);doc.setTextColor(15,110,86);doc.text('고객사 실행:',M,y);y+=5; cliItems.forEach(t=>{chkY(6);doc.setTextColor(60,60,60);doc.text(`  · ${t}`,M,y);y+=5;}); }
      y+=4;
    });
  }

  // 메모
  const memoText = document.getElementById('rm-memo-text')?.textContent;
  if(memoText){ y+=4;sec('7. ARK 담당자 핵심 메모');const ls=doc.splitTextToSize(memoText,cw);doc.setFontSize(9);doc.setTextColor(60,60,60);ls.forEach(l=>{chkY(6);doc.text(l,M,y);y+=5;}); }

  chkY(10);y+=4;
  doc.setDrawColor(210,215,220);doc.setLineWidth(0.3);doc.line(M,y,W-M,y);y+=5;
  doc.setFont(KR,'normal');doc.setFontSize(8);doc.setTextColor(180,180,180);
  doc.text('본 로드맵은 Tridge ARK 수출역량 상담 도구를 통해 생성되었습니다.',M,y);

  doc.save(`ARK_수출로드맵_${name.replace(/\s/g,'_')}_${nowStr()}.pdf`);
}

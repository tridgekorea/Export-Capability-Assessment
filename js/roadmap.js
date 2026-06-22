// js/roadmap.js — v4 · M+N 타임라인 + ARK 실측 응답률 + AI 서술 생성

// ── ARK 실측 지역별 응답률 (Tridge ARK 피치 자료 기준) ──
const ARK_RESPONSE_RATE = {
  '미국/캐나다': { rate: 0.17, region: 'Americas', targetBuyers: 57 },
  '일본':        { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
  '중국':        { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
  '동남아':      { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
  '유럽':        { rate: 0.19, region: 'EU',        targetBuyers: 78 },
  '중동':        { rate: 0.22, region: 'MENA',      targetBuyers: 85 },
  '호주':        { rate: 0.34, region: 'APAC',     targetBuyers: 120 },
};

// ── 퍼널 수치 계산 ──────────────────────────────────────
function calcFunnel(overallAvg, market) {
  const marketData   = ARK_RESPONSE_RATE[market] || { rate: 0.20, region: 'Global', targetBuyers: 80 };
  const responseRate = marketData.rate;
  const regionName   = marketData.region;
  const outreach     = overallAvg >= 4 ? 80 : overallAvg >= 3 ? 50 : 30;
  const response     = Math.round(outreach * responseRate);
  const meeting      = Math.round(response * 0.50);
  const sampleOrder  = Math.round(meeting  * 0.60);
  const contract     = Math.max(1, Math.round(sampleOrder * 0.50));
  return { outreach, response, meeting, sampleOrder, contract, responseRate, regionName };
}

// ── 수출 목표 계산 ──────────────────────────────────────
function exportGoals(avg) {
  return {
    s: avg >= 4 ? '$50만불'  : avg >= 3 ? '$30만불'  : '$10만불',
    m: avg >= 4 ? '$200만불' : avg >= 3 ? '$100만불' : '$50만불',
    l: avg >= 4 ? '$500만불' : avg >= 3 ? '$200만불' : '$100만불',
  };
}

// ── 로드맵 HTML 렌더링 ──────────────────────────────────
function renderRoadmapShell(name, product, market, overallAvg, areaScores, funnel, goals) {
  const grade  = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k);
  const weak   = Object.entries(areaScores).filter(([,v]) => v.score <  2.5).map(([k]) => k);
  const { outreach, response, meeting, sampleOrder, contract, responseRate, regionName } = funnel;

  return `
<style>
.rm{font-family:var(--font-sans);font-size:13px;color:var(--color-text-primary);max-width:680px;padding:0 0 2rem}
.rm-header{padding-bottom:1rem;margin-bottom:1.25rem;border-bottom:2px solid #185FA5}
.rm-eyebrow{font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#185FA5;margin-bottom:.3rem}
.rm-corp{font-size:18px;font-weight:500;margin-bottom:.2rem}
.rm-meta{font-size:11px;color:var(--color-text-tertiary)}
.rm-grade{display:inline-block;font-size:11px;font-weight:500;padding:3px 12px;border-radius:20px;background:#E1F5EE;color:#0F6E56;margin-top:.4rem}
.rm-sec{font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-tertiary);margin:1.5rem 0 .75rem;padding-bottom:.35rem;border-bottom:0.5px solid var(--color-border-tertiary)}
.rm-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.5rem}
.rm-sum-card{background:var(--color-background-secondary);border-radius:8px;padding:.75rem;text-align:center}
.rm-sum-card .n{font-size:17px;font-weight:500}
.rm-sum-card .l{font-size:10px;color:var(--color-text-tertiary);margin-top:2px}
.rm-tl-wrap{overflow-x:auto;margin-bottom:1.5rem}
.rm-tl{width:100%;border-collapse:collapse;font-size:10px;min-width:560px}
.rm-tl th,.rm-tl td{border:0.5px solid var(--color-border-tertiary);padding:5px 7px}
.rm-tl th{font-weight:500;text-align:center}
.rm-tl th.ps{background:#EBF3FC;color:#0C447C}
.rm-tl th.pm{background:#E1F5EE;color:#085041}
.rm-tl th.pl{background:#FAEEDA;color:#633806}
.rm-tl th.area{background:var(--color-background-secondary);color:var(--color-text-secondary);text-align:left;width:76px;font-size:9px}
.rm-tl td.area-name{font-weight:500;font-size:10px;color:var(--color-text-primary);background:var(--color-background-secondary);white-space:nowrap}
.rm-tl td{vertical-align:top;color:var(--color-text-secondary);line-height:1.5}
.rm-tl td.kpi{font-weight:500;text-align:center}
.rm-tl td.kpi.ks{color:#0C447C;background:#EBF3FC22}
.rm-tl td.kpi.km{color:#085041;background:#E1F5EE22}
.rm-tl td.kpi.kl{color:#633806;background:#FAEEDA22}
.ci{display:flex;align-items:start;gap:4px;margin-bottom:3px}
.ci:last-child{margin-bottom:0}
.cd{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:3px}
.cd.ark{background:#185FA5}
.cd.cli{background:#1D9E75}
.ce{color:var(--color-text-tertiary);font-style:italic;font-size:9px}
.rm-legend{display:flex;gap:12px;margin-bottom:.6rem;font-size:10px;color:var(--color-text-secondary)}
.rm-legend span{display:flex;align-items:center;gap:4px}
.rm-legend i{width:8px;height:8px;border-radius:50%;display:inline-block}
.rm-funnel{display:flex;align-items:center;gap:0;margin-bottom:1.5rem}
.rm-funnel-box{flex:1;text-align:center;padding:.6rem .4rem;background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary)}
.rm-funnel-box:first-child{border-radius:8px 0 0 8px}
.rm-funnel-box:last-child{border-radius:0 8px 8px 0}
.rm-funnel-box .fn{font-size:15px;font-weight:500;color:#185FA5}
.rm-funnel-box .fl{font-size:9px;color:var(--color-text-tertiary);margin-top:2px}
.rm-funnel-arr{font-size:12px;color:var(--color-text-tertiary);flex-shrink:0;padding:0 3px}
.rm-funnel-note{font-size:10px;color:var(--color-text-tertiary);margin-top:.5rem;text-align:center}
.rm-phase{border:0.5px solid var(--color-border-tertiary);border-radius:10px;overflow:hidden;margin-bottom:.75rem}
.rm-ph-head{padding:.6rem 1rem;display:flex;align-items:center;justify-content:space-between}
.rm-ph-head.ph0{background:#EBF3FC}
.rm-ph-head.ph1{background:#E1F5EE}
.rm-ph-head.ph2{background:#FAEEDA}
.rm-ph-title{font-size:12px;font-weight:500}
.ph0 .rm-ph-title{color:#0C447C}
.ph1 .rm-ph-title{color:#085041}
.ph2 .rm-ph-title{color:#633806}
.rm-ph-kpi{font-size:11px;font-weight:500;color:var(--color-text-primary)}
.rm-ph-body{padding:.85rem 1rem;background:var(--color-background-primary);font-size:12px;color:var(--color-text-secondary);line-height:1.75}
.rm-ph-body p{margin-bottom:.6rem}
.rm-ph-body p:last-child{margin-bottom:0}
.rm-role{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:.65rem}
.rm-role-ark{background:#E6F1FB;border:0.5px solid #B5D4F4;border-radius:6px;padding:.6rem .75rem}
.rm-role-cli{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:6px;padding:.6rem .75rem}
.rm-role-lbl{font-size:10px;font-weight:500;margin-bottom:.3rem}
.rm-role-ark .rm-role-lbl{color:#185FA5}
.rm-role-cli .rm-role-lbl{color:var(--color-text-tertiary)}
.rm-role ul{list-style:none;padding:0}
.rm-role li{font-size:11px;color:var(--color-text-secondary);padding:2px 0 2px 10px;position:relative;line-height:1.5}
.rm-role li::before{content:'·';position:absolute;left:0}
.rm-chk{list-style:none;padding:0;margin-bottom:1.5rem}
.rm-chk li{display:flex;align-items:start;gap:8px;padding:.55rem 0;border-bottom:0.5px solid var(--color-border-tertiary);font-size:11px;color:var(--color-text-secondary);line-height:1.55}
.rm-chk li:last-child{border-bottom:none}
.chk-icon{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0;margin-top:1px}
.chk-must{background:#FCEBEB;color:#791F1F}
.chk-good{background:#FAEEDA;color:#633806}
.chk-body strong{color:var(--color-text-primary);display:block;margin-bottom:1px}
.rm-action{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:1.5rem}
.rm-action th{background:var(--color-background-secondary);padding:6px 10px;text-align:left;font-size:10px;font-weight:500;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.04em;border-bottom:0.5px solid var(--color-border-tertiary)}
.rm-action td{padding:7px 10px;border-bottom:0.5px solid var(--color-border-tertiary);vertical-align:top}
.rm-action tr:last-child td{border-bottom:none}
.tag{display:inline-block;font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px}
.tag-now{background:#FCEBEB;color:#791F1F}
.tag-soon{background:#E6F1FB;color:#0C447C}
.tag-mid{background:#E1F5EE;color:#085041}
.rm-memo{background:var(--color-background-secondary);border-radius:8px;padding:.9rem 1rem;border-left:3px solid #185FA5;font-size:11px;color:var(--color-text-secondary);line-height:1.75;margin-top:1rem}
.rm-memo strong{color:var(--color-text-primary);display:block;margin-bottom:.3rem}
.rm-ai-section{border:0.5px solid var(--color-border-tertiary);border-radius:10px;padding:1rem;margin-bottom:1rem;background:var(--color-background-primary);font-size:12px;color:var(--color-text-secondary);line-height:1.8}
.rm-ai-section h2{font-size:13px;font-weight:500;color:#185FA5;margin:1rem 0 .4rem}
.rm-ai-section h3{font-size:12px;font-weight:500;margin:.75rem 0 .3rem;color:var(--color-text-primary)}
.rm-ai-section ul{padding-left:1.25rem;margin-bottom:.5rem}
.rm-ai-section li{margin-bottom:.2rem}
.rm-ai-loading{font-size:12px;color:var(--color-text-tertiary);padding:.5rem 0}
</style>

<div class="rm">
  <!-- ① 요약 헤더 -->
  <div class="rm-header">
    <div class="rm-eyebrow">AI 수출 로드맵 · Tridge ARK</div>
    <div class="rm-corp">${name}</div>
    <div class="rm-meta">${product} · 목표시장: ${market} (${regionName}) · ${new Date().toLocaleDateString('ko-KR').replace(/\./g,'').replace(/ /g,'.')}</div>
    <span class="rm-grade">${grade} · 종합 ${overallAvg} / 5.0</span>
  </div>

  <!-- 요약 카드 -->
  <div class="rm-sum">
    <div class="rm-sum-card"><div class="n" style="color:#185FA5">${overallAvg}</div><div class="l">종합 점수</div></div>
    <div class="rm-sum-card"><div class="n" style="color:#0F6E56">${grade}</div><div class="l">수출 등급</div></div>
    <div class="rm-sum-card"><div class="n" style="color:#1D9E75;font-size:12px">${strong[0] || '-'}</div><div class="l">최고 강점</div></div>
    <div class="rm-sum-card"><div class="n" style="color:#E24B4A;font-size:12px">${weak[0] || '-'}</div><div class="l">핵심 보완</div></div>
  </div>

  <!-- ② M+N 타임라인 표 -->
  <div class="rm-sec">수출 로드맵 타임라인</div>
  <div class="rm-legend">
    <span><i style="background:#185FA5"></i> ARK 대행</span>
    <span><i style="background:#1D9E75"></i> 고객사 실행</span>
  </div>
  <div class="rm-tl-wrap">
    <table class="rm-tl">
      <tr>
        <th class="area" rowspan="2"></th>
        <th class="ps" colspan="3">단기 · 0~3개월</th>
        <th class="pm" colspan="3">중기 · 3~12개월</th>
        <th class="pl" colspan="2">장기 · 12개월~</th>
      </tr>
      <tr>
        <th class="ps">M+1</th><th class="ps">M+2</th><th class="ps">M+3</th>
        <th class="pm">M+4~6</th><th class="pm">M+7~9</th><th class="pm">M+10~12</th>
        <th class="pl">M+13~18</th><th class="pl">M+18+</th>
      </tr>
      <tr>
        <td class="area-name">ARK 실행</td>
        <td><div class="ci"><div class="cd ark"></div><span>바이어 분석·스코어링</span></div><div class="ci"><div class="cd ark"></div><span>아웃리치 개시 (${outreach}개사)</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>응답 관리</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>미팅 세팅 ${meeting}건</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>2차 아웃리치 준비</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>2차 시장 아웃리치</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>3차 아웃리치 준비</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>시장 확장 분석</span></div></td>
        <td><div class="ci"><div class="cd ark"></div><span>유럽·신규 아웃리치</span></div></td>
      </tr>
      <tr>
        <td class="area-name">제품·인증</td>
        <td><div class="ci"><div class="cd cli"></div><span>영문 카탈로그 완성</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>FDA 등록 착수</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>샘플 30개+ 준비</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>현지어 포장 개발</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>FDA 등록 완료</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>2차 시장 인증 착수</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>추가 인증 취득</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>EU 유기농 인증</span></div></td>
      </tr>
      <tr>
        <td class="area-name">영업·계약</td>
        <td class="ce">준비 단계</td>
        <td class="ce">준비 단계</td>
        <td><div class="ci"><div class="cd cli"></div><span>바이어 미팅 참여</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>샘플 발송·협상</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>계약 ${contract}건 목표</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>재주문 관리</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>장기계약 전환</span></div></td>
        <td><div class="ci"><div class="cd cli"></div><span>전략 파트너 3곳+</span></div></td>
      </tr>
      <tr>
        <td class="area-name">KPI</td>
        <td colspan="3" class="kpi ks">미팅 ${meeting}건 · ${goals.s}</td>
        <td colspan="3" class="kpi km">계약 ${contract}건 · ${goals.m}</td>
        <td colspan="2" class="kpi kl">5개국 · ${goals.l}</td>
      </tr>
    </table>
  </div>

  <!-- ③ ARK 퍼널 -->
  <div class="rm-sec">ARK 바이어 발굴 퍼널 · ${regionName} 실측 응답률 ${(responseRate*100).toFixed(0)}% 기준</div>
  <div class="rm-funnel">
    <div class="rm-funnel-box"><div class="fn">${outreach}</div><div class="fl">아웃리치</div></div>
    <div class="rm-funnel-arr">→</div>
    <div class="rm-funnel-box"><div class="fn">${response}</div><div class="fl">응답</div></div>
    <div class="rm-funnel-arr">→</div>
    <div class="rm-funnel-box"><div class="fn">${meeting}</div><div class="fl">미팅</div></div>
    <div class="rm-funnel-arr">→</div>
    <div class="rm-funnel-box"><div class="fn">${sampleOrder}</div><div class="fl">샘플오더</div></div>
    <div class="rm-funnel-arr">→</div>
    <div class="rm-funnel-box"><div class="fn">${contract}</div><div class="fl">계약</div></div>
  </div>
  <div class="rm-funnel-note">응답률 ${(responseRate*100).toFixed(0)}% (${regionName} 실측) · 응답→미팅 50% · 미팅→샘플 60% · 샘플→계약 50%</div>

  <!-- ④ 단계별 서술 (AI 생성) -->
  <div class="rm-sec" style="margin-top:1.5rem">단계별 실행 전략 (AI 분석)</div>
  <div id="rm-ai-output"><div class="rm-ai-loading"><span class="spinner"></span> AI가 맞춤형 전략을 분석하고 있습니다...</div></div>

  <!-- ⑤ 고객사 준비 체크리스트 -->
  <div class="rm-sec">ARK 아웃리치 전 고객사 준비 조건</div>
  <ul class="rm-chk">
    <li><span class="chk-icon chk-must">필수</span><div class="chk-body"><strong>영문 제품 카탈로그 + FOB 가격시트</strong>바이어가 미팅 전 검토하는 1순위 자료. 없으면 신뢰도 급락</div></li>
    <li><span class="chk-icon chk-must">필수</span><div class="chk-body"><strong>샘플 재고 30개 이상 즉시 발송 가능</strong>미팅 후 48시간 내 발송 불가 시 기회 소멸</div></li>
    <li><span class="chk-icon chk-must">필수</span><div class="chk-body"><strong>수출 전담 담당자 1명 지정</strong>ARK가 미팅을 세팅해도 후속 담당자 없으면 계약 불가</div></li>
    <li><span class="chk-icon chk-good">권장</span><div class="chk-body"><strong>MOQ · 납기 · 결제 조건 사전 결정</strong>미팅에서 즉답 불가하면 바이어 온도 급냉</div></li>
    <li><span class="chk-icon chk-good">권장</span><div class="chk-body"><strong>영문 회사소개서 1~2페이지</strong>바이어가 공급사 신뢰도를 판단하는 기초 자료</div></li>
  </ul>

  <!-- ⑥ 즉시 액션 -->
  <div class="rm-sec">이번 주 즉시 실행 액션</div>
  <table class="rm-action">
    <tr>
      <th style="width:40%">액션</th>
      <th style="width:22%">담당</th>
      <th style="width:16%">기한</th>
      <th style="width:22%">우선순위</th>
    </tr>
    <tr><td>영문 카탈로그 + 가격시트 제작</td><td>고객사 마케팅</td><td>2주</td><td><span class="tag tag-now">즉시</span></td></tr>
    <tr><td>샘플 재고 30개 확보</td><td>고객사 생산팀</td><td>2주</td><td><span class="tag tag-now">즉시</span></td></tr>
    <tr><td>수출 전담 담당자 지정</td><td>고객사 대표</td><td>1주</td><td><span class="tag tag-now">즉시</span></td></tr>
    <tr><td>ARK 아웃리치 대상 HS코드 확정</td><td>ARK 담당자</td><td>1주</td><td><span class="tag tag-now">즉시</span></td></tr>
    <tr><td>MOQ·납기·결제 조건 내부 합의</td><td>고객사 경영진</td><td>2주</td><td><span class="tag tag-soon">단기</span></td></tr>
    <tr><td>FDA 등록 절차 확인 및 착수</td><td>고객사 수출팀</td><td>1개월</td><td><span class="tag tag-mid">중기</span></td></tr>
  </table>

  <div class="rm-memo" id="rm-memo" style="display:none">
    <strong>ARK 담당자 핵심 메모</strong>
    <span id="rm-memo-text"></span>
  </div>
</div>`;
}

// ── AI 서술 생성 (스트리밍) ──────────────────────────────
async function generateRoadmap() {
  const btn    = document.getElementById('roadmap-btn');
  const status = document.getElementById('roadmap-status');
  const output = document.getElementById('roadmap-output');

  const { overallAvg, areaScores } = STATE;
  const name     = getField('f-name')    || '(미입력)';
  const product  = getField('f-product') || '가공식품';
  const market   = getField('f-market')  || '미국/캐나다';
  const exp      = getField('f-exp')     || '미경험';
  const method   = getField('f-method')  || '직접수출';
  const usp      = getField('f-usp')     || '';
  const meetmemo = getField('f-meetmemo') || '';

  const grade   = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong  = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k).join(', ') || '없음';
  const weak    = Object.entries(areaScores).filter(([,v]) => v.score <  2.5).map(([k]) => k).join(', ') || '없음';
  const areaStr = Object.entries(areaScores).map(([k,v]) => `${k}: ${v.score}점`).join(' / ');

  const funnel = calcFunnel(overallAvg, market);
  const goals  = exportGoals(overallAvg);
  const { outreach, response, meeting, sampleOrder, contract, responseRate, regionName } = funnel;

  btn.disabled = true;
  status.className = 'ai-status loading';
  status.style.display = 'block';
  status.innerHTML = '<span class="spinner"></span> 로드맵을 생성하고 있습니다...';

  // 구조적 HTML 먼저 렌더링
  output.innerHTML = renderRoadmapShell(name, product, market, overallAvg, areaScores, funnel, goals);

  // AI 서술 부분만 스트리밍
  const aiOutput = document.getElementById('rm-ai-output');
  const memo     = document.getElementById('rm-memo');
  const memoText = document.getElementById('rm-memo-text');

  const systemPrompt = `당신은 Tridge ARK 수출 솔루션 전문 컨설턴트입니다.

Tridge ARK 핵심 개념:
- ARK가 대행: 바이어 발굴·스코어링 → 30개+ 언어 AI 아웃리치 직접 발송 → 미팅 세팅·중계
- 고객사가 담당: 미팅 참여 → 가격 협상 → 계약 체결 → 샘플 발송

주의: "ARK에서 검색", "리스트 추출" 금지. "ARK가 직접 대행" 표현 사용.
추상적 표현("적극 활용", "지속 모니터링") 금지. 내일 당장 실행 가능한 수준으로.`;

  const userPrompt = `아래 기업 정보와 역량 진단 결과를 바탕으로 3단계 실행 전략을 작성하세요.

기업: ${name} | 품목: ${product} | 목표시장: ${market}(${regionName}) | 수출경력: ${exp}
역량: ${overallAvg}/5.0(${grade}) | ${areaStr}
강점: ${strong} | 보완필요: ${weak}
USP: ${usp}
ARK 퍼널: 아웃리치 ${outreach}개사 → 응답 ${response}건(${regionName} ${(responseRate*100).toFixed(0)}%) → 미팅 ${meeting}건 → 계약 ${contract}건

아래 3개 섹션만 작성하세요. 각 섹션은 ## 제목으로 시작:

## 단기 전략 (0~3개월) — ARK 아웃리치 개시
- 이 기업의 강점·약점을 고려한 ARK 아웃리치 준비 전략
- ARK가 대행하는 것 / 고객사가 준비할 것 역할 분리
- ${market} 시장 진입 시 주의사항

## 중기 전략 (3~12개월) — 미팅을 계약으로 전환
- 샘플오더→본계약 전환 핵심 포인트
- ARK 2차 아웃리치 확장 방향
- ${goals.m} 달성을 위한 구체적 경로

## 장기 전략 (12개월~) — 안정 바이어망 & 시장 확장
- 장기계약 바이어 3곳+ 확보 전략
- 신규 시장 확장 우선순위
- ${goals.l} 달성 시나리오

마지막에 ## ARK 담당자 핵심 메모 섹션으로 가장 중요한 병목 1가지와 해결 방향을 2~3문장으로 작성.`;

  try {
    let fullText = '';
    aiOutput.innerHTML = '<div class="rm-ai-section" id="rm-ai-inner"></div>';
    const inner = document.getElementById('rm-ai-inner');

    await callClaude(systemPrompt, userPrompt, (chunk) => {
      fullText += chunk;
      // 메모 섹션 분리
      const memoMatch = fullText.match(/## ARK 담당자 핵심 메모\n?([\s\S]*)/);
      let mainText = fullText;
      if (memoMatch) {
        mainText = fullText.slice(0, fullText.indexOf('## ARK 담당자 핵심 메모'));
        if (memo) {
          memo.style.display = 'block';
          memoText.textContent = memoMatch[1].trim();
        }
      }
      inner.innerHTML = markdownToHtml(mainText);
    });

    status.className = 'ai-status success';
    status.innerHTML = '✓ 로드맵 생성 완료';
    btn.disabled = false;
    btn.textContent = '✦ 다시 생성';

    // PDF 버튼
    showRoadmapPdfBtn(output, name);

  } catch(e) {
    status.className = 'ai-status error';
    status.innerHTML = `오류: ${e.message}`;
    btn.disabled = false;
  }
}

// ── PDF 버튼 ─────────────────────────────────────────
function showRoadmapPdfBtn(container, name) {
  const existing = document.getElementById('roadmap-pdf-btn');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'roadmap-pdf-btn';
  btn.className = 'btn-pdf';
  btn.style.marginTop = '1rem';
  btn.textContent = '⬇ 로드맵 PDF 다운로드';
  btn.onclick = () => downloadRoadmapPdf(name);
  container.appendChild(btn);
}

async function downloadRoadmapPdf(corpName) {
  if (!window.jspdf) { alert('PDF 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  const { jsPDF } = window.jspdf;

  let nanumRegular = null;
  try {
    const r = await fetch('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/NanumGothic.woff').then(r => r.arrayBuffer());
    nanumRegular = r;
  } catch(e) { console.warn('폰트 로드 실패:', e); }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  if (nanumRegular) {
    const toBase64 = (buf) => { let b=''; const bytes=new Uint8Array(buf); for(let i=0;i<bytes.byteLength;i++) b+=String.fromCharCode(bytes[i]); return btoa(b); };
    doc.addFileToVFS('NanumGothic.ttf', toBase64(nanumRegular));
    doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
    doc.setFont('NanumGothic', 'normal');
  }
  const KR = nanumRegular ? 'NanumGothic' : 'helvetica';
  const W = 210, M = 18, cw = W - M * 2;
  let y = 22;

  const { overallAvg, areaScores } = STATE;
  const name    = getField('f-name') || corpName || '기업명';
  const product = getField('f-product') || '-';
  const market  = getField('f-market') || '-';
  const funnel  = calcFunnel(overallAvg, market);
  const goals   = exportGoals(overallAvg);
  const grade   = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong  = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k);
  const weak    = Object.entries(areaScores).filter(([,v]) => v.score <  2.5).map(([k]) => k);

  const checkY = (need=8) => { if (y+need > 275) { doc.addPage(); y=20; } };
  const section = (title) => {
    checkY(14); y+=3;
    doc.setFont(KR,'normal'); doc.setFontSize(10); doc.setTextColor(24,95,165);
    doc.text(title, M, y); y+=4;
    doc.setDrawColor(24,95,165); doc.setLineWidth(0.2);
    doc.line(M, y, W-M, y); y+=5;
    doc.setTextColor(40,40,40);
  };
  const row = (label, value) => {
    checkY(7);
    doc.setFont(KR,'normal'); doc.setFontSize(9); doc.setTextColor(110,110,110);
    doc.text(label, M, y);
    doc.setTextColor(40,40,40);
    const lines = doc.splitTextToSize(String(value), cw-42);
    doc.text(lines, M+40, y);
    y += lines.length*5+1;
  };

  // 헤더
  doc.setFont(KR,'normal'); doc.setFontSize(16); doc.setTextColor(24,95,165);
  doc.text('AI 수출 로드맵 · Tridge ARK', M, y); y+=7;
  doc.setFontSize(9); doc.setTextColor(150,150,150);
  doc.text(`${name}  ·  ${nowStr()}  ·  종합 ${overallAvg}/5.0 (${grade})`, M, y); y+=8;
  doc.setDrawColor(200,210,220); doc.setLineWidth(0.3);
  doc.line(M, y, W-M, y); y+=8;

  section('1. 기업 및 역량 요약');
  row('기업명', name); row('주요 품목', product); row('목표 시장', market);
  row('종합 점수', `${overallAvg}/5.0 (${grade})`);
  row('강점', strong.length ? strong.join(', ') : '데이터 부족');
  row('보완 필요', weak.length ? weak.join(', ') : '전반 양호');
  y+=4;

  section('2. ARK 바이어 발굴 퍼널');
  row('목표 시장 응답률', `${(funnel.responseRate*100).toFixed(0)}% (${funnel.regionName} 실측)`);
  row('아웃리치', `${funnel.outreach}개사`);
  row('응답 예상', `${funnel.response}건`);
  row('미팅 성사', `${funnel.meeting}건`);
  row('샘플 오더', `${funnel.sampleOrder}건`);
  row('계약 목표', `${funnel.contract}건`);
  y+=4;

  section('3. 단계별 KPI');
  row('단기 (0~3개월)', `미팅 ${funnel.meeting}건 · ${goals.s}`);
  row('중기 (3~12개월)', `계약 ${funnel.contract}건 · ${goals.m}`);
  row('장기 (12개월~)', `5개국 · ${goals.l}`);
  y+=4;

  section('4. 고객사 준비 조건');
  ['영문 카탈로그 + FOB 가격시트 (필수)',
   '샘플 재고 30개+ 즉시 발송 가능 (필수)',
   '수출 전담 담당자 1명 지정 (필수)',
   'MOQ·납기·결제 조건 사전 결정 (권장)',
   '영문 회사소개서 1~2페이지 (권장)'].forEach((item, i) => {
    checkY(7);
    doc.setFont(KR,'normal'); doc.setFontSize(9); doc.setTextColor(60,60,60);
    doc.text(`${i+1}. ${item}`, M+4, y); y+=6;
  });
  y+=4;

  section('5. 이번 주 즉시 실행 액션');
  [['영문 카탈로그 + 가격시트 제작','고객사 마케팅','2주'],
   ['샘플 재고 30개 확보','고객사 생산팀','2주'],
   ['수출 전담 담당자 지정','고객사 대표','1주'],
   ['ARK 아웃리치 HS코드 확정','ARK 담당자','1주'],
   ['MOQ·납기·결제 조건 합의','고객사 경영진','2주'],
   ['FDA 등록 절차 착수','고객사 수출팀','1개월'],
  ].forEach(([action, owner, due]) => {
    checkY(7);
    doc.setFont(KR,'normal'); doc.setFontSize(9); doc.setTextColor(40,40,40);
    const lines = doc.splitTextToSize(action, cw-50);
    doc.text(lines, M, y);
    doc.setTextColor(120,120,120);
    doc.text(`${owner} · ${due}`, W-M, y, {align:'right'});
    y += lines.length*5+2;
  });

  // AI 서술 텍스트 추가
  const aiText = document.getElementById('rm-ai-inner')?.innerText || '';
  if (aiText) {
    y+=4; section('6. AI 단계별 실행 전략');
    const lines = doc.splitTextToSize(aiText.substring(0, 2000), cw);
    lines.forEach(line => {
      checkY(6);
      doc.setFont(KR,'normal'); doc.setFontSize(8.5); doc.setTextColor(60,60,60);
      doc.text(line, M, y); y+=5;
    });
  }

  checkY(10); y+=4;
  doc.setDrawColor(210,215,220); doc.setLineWidth(0.3);
  doc.line(M, y, W-M, y); y+=5;
  doc.setFont(KR,'normal'); doc.setFontSize(8); doc.setTextColor(180,180,180);
  doc.text('본 로드맵은 Tridge ARK 수출역량 상담 도구를 통해 생성되었습니다.', M, y);

  doc.save(`ARK_수출로드맵_${(name||'기업명').replace(/\s/g,'_')}_${nowStr()}.pdf`);
}

// ── 마크다운 → HTML ──────────────────────────────────
function markdownToHtml(md) {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// js/roadmap.js — v4 Final

const ARK_RESPONSE_RATE = {
  '미국/캐나다': { rate: 0.17, region: 'Americas' },
  '일본':        { rate: 0.34, region: 'APAC' },
  '중국':        { rate: 0.34, region: 'APAC' },
  '동남아':      { rate: 0.34, region: 'APAC' },
  '유럽':        { rate: 0.19, region: 'EU' },
  '중동':        { rate: 0.22, region: 'MENA' },
  '호주':        { rate: 0.34, region: 'APAC' },
};

function calcFunnel(avg, market) {
  const d = ARK_RESPONSE_RATE[market] || { rate: 0.20, region: 'Global' };
  const outreach    = avg >= 4 ? 80 : avg >= 3 ? 50 : 30;
  const response    = Math.round(outreach * d.rate);
  const meeting     = Math.round(response * 0.50);
  const sampleOrder = Math.round(meeting  * 0.60);
  const contract    = Math.max(1, Math.round(sampleOrder * 0.50));
  return { outreach, response, meeting, sampleOrder, contract, rate: d.rate, region: d.region };
}

function exportGoals(avg) {
  return {
    s: avg >= 4 ? '$50만불'  : avg >= 3 ? '$30만불'  : '$10만불',
    m: avg >= 4 ? '$200만불' : avg >= 3 ? '$100만불' : '$50만불',
    l: avg >= 4 ? '$500만불' : avg >= 3 ? '$200만불' : '$100만불',
  };
}

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
  const pct = (f.rate*100).toFixed(0);

  btn.disabled = true;
  status.className = 'ai-status loading';
  status.style.display = 'block';
  status.innerHTML = '<span class="spinner"></span> 로드맵을 생성하고 있습니다...';

  output.innerHTML = buildRoadmapHTML(name, product, market, overallAvg, grade, strong, weak, f, g);

  const aiBox = document.getElementById('rm-phases');
  if (!aiBox) return;

  const systemPrompt = `당신은 Tridge ARK 수출 솔루션 전문 컨설턴트입니다.
ARK 대행: 바이어 발굴·스코어링 → 30개+ 언어 AI 아웃리치 직접 발송 → 미팅 세팅·중계
고객사 담당: 미팅 참여 → 가격 협상 → 계약 체결 → 샘플 발송
"ARK에서 검색", "리스트 추출" 절대 금지. "ARK가 직접 대행"으로만 표현.
추상적 표현 금지. 내일 당장 실행 가능한 수준으로 구체적 작성.`;

  const userPrompt = `아래 기업 정보로 3단계 실행 전략을 작성하세요.

기업: ${name} | 품목: ${product} | 목표시장: ${market}(${f.region})
역량: ${overallAvg}/5.0(${grade}) | ${areaStr}
강점: ${strong.join(', ')||'없음'} | 보완필요: ${weak.join(', ')||'없음'}
USP: ${usp}
ARK퍼널: 아웃리치 ${f.outreach}개사 → 응답 ${f.response}건(${f.region} ${pct}%) → 미팅 ${f.meeting}건 → 계약 ${f.contract}건

아래 형식으로 정확히 작성. 구분자 반드시 포함:

---PHASE_START---
PHASE_TITLE: 단기 (0~3개월) — ARK 아웃리치 개시
PHASE_KPI: 목표 ${g.s}
PHASE_DESC: (이 기업 강점·약점 고려한 단기 핵심 전략 2~3문장)
---ARK_START---
ARK가 대행하는 것 3가지 (각 한 줄)
---ARK_END---
---CLIENT_START---
고객사가 실행할 것 3가지 (각 한 줄)
---CLIENT_END---
---PHASE_END---

---PHASE_START---
PHASE_TITLE: 중기 (3~12개월) — 미팅을 계약으로 전환
PHASE_KPI: 목표 ${g.m}
PHASE_DESC: (샘플오더→계약 전환 핵심 포인트 2~3문장)
---ARK_START---
ARK가 대행하는 것 3가지
---ARK_END---
---CLIENT_START---
고객사가 실행할 것 3가지
---CLIENT_END---
---PHASE_END---

---PHASE_START---
PHASE_TITLE: 장기 (12개월~) — 안정 바이어망 & 시장 확장
PHASE_KPI: 목표 ${g.l}
PHASE_DESC: (장기계약 바이어 확보, 신규 시장 확장 방향 2~3문장)
---ARK_START---
ARK가 대행하는 것 3가지
---ARK_END---
---CLIENT_START---
고객사가 실행할 것 3가지
---CLIENT_END---
---PHASE_END---

---MEMO_START---
ARK 담당자 핵심 메모: 가장 중요한 병목 1가지와 해결 방향 2~3문장
---MEMO_END---`;

  try {
    let fullText = '';
    await callClaude(systemPrompt, userPrompt, (chunk) => {
      fullText += chunk;
      parseAndRenderPhases(fullText, aiBox);
    });

    const memoMatch = fullText.match(/---MEMO_START---([\s\S]*?)---MEMO_END---/);
    if (memoMatch) {
      const memoEl = document.getElementById('rm-memo');
      const memoTx = document.getElementById('rm-memo-text');
      if (memoEl && memoTx) { memoTx.textContent = memoMatch[1].trim(); memoEl.style.display = 'block'; }
    }

    status.className = 'ai-status success';
    status.innerHTML = '✓ 로드맵 생성 완료';
    btn.disabled = false;
    btn.textContent = '✦ 다시 생성';
    addRoadmapHtmlBtn(output);
  } catch(e) {
    status.className = 'ai-status error';
    status.innerHTML = `오류: ${e.message}`;
    btn.disabled = false;
  }
}

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
.rm-sec{font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#9c9a92;margin:1.5rem 0 .75rem;padding-bottom:.35rem;border-bottom:1px solid #d0cec8}
.rm-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.5rem}
.rm-card{background:#f5f4f0;border-radius:8px;padding:.75rem;text-align:center;border:1px solid #e0ddd6}
.rm-card .n{font-size:17px;font-weight:500}
.rm-card .l{font-size:10px;color:#9c9a92;margin-top:2px}
.rm-tl-wrap{overflow-x:auto;margin-bottom:1.5rem}
.rm-tl{width:100%;border-collapse:collapse;font-size:10px;min-width:540px;border:1px solid #c8c5be}
.rm-tl th,.rm-tl td{border:1px solid #c8c5be;padding:5px 6px}
.rm-tl th{font-weight:500;text-align:center}
.th-s{background:#EBF3FC;color:#0C447C}
.th-m{background:#E1F5EE;color:#085041}
.th-l{background:#FAEEDA;color:#633806}
.th-a{background:#ebe9e3;color:#5f5e5a;text-align:left;width:72px;font-size:9px}
.td-a{font-weight:500;font-size:10px;background:#ebe9e3;white-space:nowrap;color:#1a1a18;border:1px solid #c8c5be}
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
.rf-box{flex:1;text-align:center;padding:.6rem .4rem;background:#f5f4f0;border:1px solid #c8c5be}
.rf-box:first-child{border-radius:8px 0 0 8px}
.rf-box:last-child{border-radius:0 8px 8px 0}
.rf-box .fn{font-size:16px;font-weight:500;color:#185FA5}
.rf-box .fl{font-size:9px;color:#9c9a92;margin-top:2px}
.rf-arr{font-size:12px;color:#9c9a92;flex-shrink:0;padding:0 3px}
.rf-note{font-size:10px;color:#9c9a92;margin-bottom:1.5rem;text-align:center}
.rm-chk{list-style:none;padding:0;margin-bottom:1.5rem}
.rm-chk li{display:flex;align-items:start;gap:8px;padding:.55rem 0;border-bottom:1px solid #e0ddd6;font-size:11px;color:#5f5e5a;line-height:1.55}
.rm-chk li:last-child{border-bottom:none}
.chk-ic{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0;margin-top:1px}
.chk-m{background:#FCEBEB;color:#791F1F}
.chk-g{background:#FAEEDA;color:#633806}
.chk-bd strong{color:#1a1a18;display:block;margin-bottom:1px}
.rm-act{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:1.5rem;border:1px solid #c8c5be}
.rm-act th{background:#ebe9e3;padding:6px 10px;text-align:left;font-size:10px;font-weight:500;color:#9c9a92;border:1px solid #c8c5be}
.rm-act td{padding:7px 10px;border:1px solid #e0ddd6}
.tag{display:inline-block;font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px}
.tn{background:#FCEBEB;color:#791F1F}
.ts2{background:#E6F1FB;color:#0C447C}
.tm{background:#E1F5EE;color:#085041}
.rm-memo{background:#f5f4f0;border-radius:8px;padding:.9rem 1rem;border-left:3px solid #185FA5;font-size:11px;color:#5f5e5a;line-height:1.75;margin-top:1rem}
.rm-memo strong{color:#1a1a18;display:block;margin-bottom:.3rem}
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
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>2차 시장 인증</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>추가 인증 취득</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>EU 유기농 인증</span></div></td>
      </tr>
      <tr>
        <td class="td-a">영업·계약</td>
        <td class="td-e">준비 단계</td>
        <td class="td-e">준비 단계</td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>바이어 미팅 참여</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>샘플 발송·협상</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>계약 ${f.contract}건</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>재주문 관리</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>장기계약 전환</span></div></td>
        <td class="td-c"><div class="ci"><div class="cd cd-c"></div><span>전략 파트너 3곳+</span></div></td>
      </tr>
      <tr>
        <td class="td-a">KPI</td>
        <td colspan="3" class="td-kpi" style="color:#0C447C;background:#EBF3FC">미팅 ${f.meeting}건 · ${g.s}</td>
        <td colspan="3" class="td-kpi" style="color:#085041;background:#E1F5EE">계약 ${f.contract}건 · ${g.m}</td>
        <td colspan="2" class="td-kpi" style="color:#633806;background:#FAEEDA">5개국 · ${g.l}</td>
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

  <div class="rm-sec" style="margin-top:1.5rem">단계별 실행 전략 (AI 분석)</div>
  <div id="rm-phases"><div style="font-size:12px;color:#9c9a92;padding:1rem;text-align:center"><span class="spinner"></span> AI가 분석 중입니다...</div></div>

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

function parseAndRenderPhases(text, container) {
  const colors = [
    {bg:'#EBF3FC',color:'#0C447C'},
    {bg:'#E1F5EE',color:'#085041'},
    {bg:'#FAEEDA',color:'#633806'},
  ];
  const phases = [];
  const re = /---PHASE_START---([\s\S]*?)---PHASE_END---/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const b = m[1];
    const title    = (b.match(/PHASE_TITLE:\s*(.+)/) || [])[1]?.trim() || '';
    const kpi      = (b.match(/PHASE_KPI:\s*(.+)/)   || [])[1]?.trim() || '';
    const desc     = (b.match(/PHASE_DESC:\s*([\s\S]*?)(?=---ARK_START---|$)/) || [])[1]?.trim() || '';
    const arkBlock = (b.match(/---ARK_START---([\s\S]*?)---ARK_END---/)    || [])[1]?.trim() || '';
    const cliBlock = (b.match(/---CLIENT_START---([\s\S]*?)---CLIENT_END---/) || [])[1]?.trim() || '';
    const arkItems = arkBlock.split('\n').map(l => l.replace(/^[-*·\d\.]+\s*/, '')).filter(Boolean);
    const cliItems = cliBlock.split('\n').map(l => l.replace(/^[-*·\d\.]+\s*/, '')).filter(Boolean);
    phases.push({ title, kpi, desc, arkItems, cliItems });
  }

  if (phases.length === 0) {
    container.innerHTML = '<div style="font-size:12px;color:#9c9a92;padding:1rem;text-align:center"><span class="spinner"></span> 분석 중...</div>';
    return;
  }

  container.innerHTML = phases.map((p, i) => {
    const hd = colors[i] || colors[0];
    return `
    <div style="border:1px solid #c8c5be;border-radius:10px;overflow:hidden;margin-bottom:.75rem">
      <div style="padding:.65rem 1rem;display:flex;align-items:center;justify-content:space-between;background:${hd.bg}">
        <span style="font-size:12px;font-weight:500;color:${hd.color}">${p.title}</span>
        <span style="font-size:11px;font-weight:500;color:#1a1a18">${p.kpi}</span>
      </div>
      <div style="padding:.85rem 1rem;background:#ffffff">
        <p style="font-size:12px;color:#5f5e5a;line-height:1.75;margin-bottom:.65rem">${p.desc}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#E6F1FB;border:1px solid #B5D4F4;border-radius:6px;padding:.6rem .75rem">
            <div style="font-size:10px;font-weight:500;color:#185FA5;margin-bottom:.3rem">ARK 대행</div>
            <ul style="list-style:none;padding:0">
              ${p.arkItems.map(t => `<li style="font-size:11px;color:#5f5e5a;padding:2px 0 2px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0">·</span>${t}</li>`).join('')}
            </ul>
          </div>
          <div style="background:#f5f4f0;border:1px solid #c8c5be;border-radius:6px;padding:.6rem .75rem">
            <div style="font-size:10px;font-weight:500;color:#9c9a92;margin-bottom:.3rem">고객사 실행</div>
            <ul style="list-style:none;padding:0">
              ${p.cliItems.map(t => `<li style="font-size:11px;color:#5f5e5a;padding:2px 0 2px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0">·</span>${t}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}



function addRoadmapHtmlBtn(container) {
  const existing = document.getElementById('roadmap-html-btn');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'roadmap-html-btn';
  btn.style.cssText = 'display:block;width:100%;margin-top:1rem;padding:11px;background:#185FA5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit';
  btn.textContent = '⬇ 로드맵 HTML 저장';
  btn.onclick = downloadRoadmapHtml;
  container.appendChild(btn);
}

function downloadRoadmapHtml() {
  const rmEl = document.querySelector('.rm');
  if (!rmEl) { alert('로드맵을 먼저 생성해주세요.'); return; }

  const name = getField('f-name') || '기업명';
  const date = nowStr();

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ARK 수출 로드맵 · ${name} · ${date}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif;
    font-size: 13px;
    color: #1a1a18;
    background: #f5f4f0;
    padding: 2rem;
  }
  .page {
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    padding: 2.5rem 3rem;
    box-shadow: 0 1px 8px rgba(0,0,0,0.08);
  }
  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; padding: 1.5rem 2rem; }
  }
</style>
</head>
<body>
<div class="page">
${rmEl.outerHTML}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ARK_수출로드맵_${name.replace(/\s/g,'_')}_${date}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

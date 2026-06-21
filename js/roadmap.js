// js/roadmap.js — AI 수출 로드맵 생성 (v3 · ARK 정확한 역할 반영)

async function generateRoadmap() {
  const btn    = document.getElementById('roadmap-btn');
  const status = document.getElementById('roadmap-status');
  const output = document.getElementById('roadmap-output');

  const { overallAvg, areaScores } = STATE;
  const name    = getField('f-name')    || '(미입력)';
  const product = getField('f-product') || '가공식품';
  const market  = getField('f-market')  || '미국';
  const exp     = getField('f-exp')     || '미경험';
  const method  = getField('f-method')  || '직접수출';
  const usp     = getField('f-usp')     || '';
  const meetmemo = getField('f-meetmemo') || '';

  const grade  = overallAvg >= 4 ? '우수' : overallAvg >= 3 ? '양호' : overallAvg >= 2 ? '보통' : '초기';
  const strong = Object.entries(areaScores).filter(([,v]) => v.score >= 3.5).map(([k]) => k).join(', ') || '없음';
  const weak   = Object.entries(areaScores).filter(([,v]) => v.score <  2.5).map(([k]) => k).join(', ') || '없음';
  const areaStr = Object.entries(areaScores).map(([k,v]) => `${k}: ${v.score}점`).join(' / ');

  // 역량 점수 기반 아웃리치 퍼널 수치 계산
  const outreach    = overallAvg >= 4 ? 80  : overallAvg >= 3 ? 50  : 30;
  const response    = overallAvg >= 4 ? 16  : overallAvg >= 3 ? 10  : 6;
  const meeting     = overallAvg >= 4 ? 8   : overallAvg >= 3 ? 5   : 3;
  const sampleOrder = overallAvg >= 4 ? 5   : overallAvg >= 3 ? 3   : 2;
  const contract    = overallAvg >= 4 ? 3   : overallAvg >= 3 ? 2   : 1;
  const exportGoalS = overallAvg >= 4 ? '$50만불' : overallAvg >= 3 ? '$30만불' : '$10만불';
  const exportGoalM = overallAvg >= 4 ? '$200만불' : overallAvg >= 3 ? '$100만불' : '$50만불';
  const exportGoalL = overallAvg >= 4 ? '$500만불' : overallAvg >= 3 ? '$200만불' : '$100만불';

  btn.disabled = true;
  status.className = 'ai-status loading';
  status.style.display = 'block';
  status.innerHTML = '<span class="spinner"></span> AI가 맞춤형 수출 로드맵을 생성하고 있습니다...';
  output.innerHTML = '';

  // ────────────────────────────────────────────────
  // SYSTEM PROMPT — ARK 역할 정확히 정의
  // ────────────────────────────────────────────────
  const systemPrompt = `당신은 Tridge ARK 수출 솔루션 전문 컨설턴트입니다.

Tridge ARK는 다음과 같이 작동합니다:
1. 분석: 고객사 제품 HS코드로 6.8억 건 실거래 데이터에서 수요가 실재하는 바이어를 추려냅니다.
2. 발굴·스코어링: 실제 소싱 활동·구매 의도 기준으로 바이어 우선순위를 매깁니다.
3. AI 다국어 아웃리치: 30개+ 언어로 바이어에게 초개인화 메시지를 직접 발송하고 응답을 관리합니다.
4. 미팅 세팅: 관심을 보인 바이어와의 미팅을 직접 잡고 초기 커뮤니케이션을 중계합니다.

ARK가 책임지는 구간: 바이어 발굴 → 스코어링 → 아웃리치 발송 → 응답 관리 → 미팅 세팅까지
고객사가 맡는 구간: 미팅 참여 → 가격 협상 → 계약 체결 → 샘플 발송 → 납기 이행

중요: ARK는 단순 데이터 조회 툴이 아닙니다. AI 기반 해외영업 대행 서비스입니다.
"ARK에서 검색하세요", "리스트를 추출하세요" 같은 표현은 절대 쓰지 마세요.
항상 "ARK가 ~를 대행합니다", "ARK가 직접 ~합니다"로 표현하세요.

로드맵 작성 원칙:
- 단기(0~3개월): ARK 아웃리치 개시를 위한 고객사 준비 + 첫 미팅 성사가 핵심
- 중기(3~12개월): ARK가 세팅한 미팅을 계약으로 전환하는 것이 핵심
- 장기(12개월~): ARK 2차 아웃리치로 시장 확장
- 추상적 표현("적극 활용", "지속 모니터링") 절대 금지
- ARK 담당자가 내일 당장 실행할 수 있는 수준으로 구체적으로 작성
- 한국어로 작성`;

  // ────────────────────────────────────────────────
  // USER PROMPT — 구조 정확히 지정
  // ────────────────────────────────────────────────
  const userPrompt = `아래 기업의 수출역량 진단 결과를 바탕으로 Tridge ARK 수출 로드맵을 작성해주세요.

## 기업 정보
- 기업명: ${name}
- 주요 품목: ${product}
- 목표 시장: ${market}
- 수출 방식: ${method}
- 수출 경력: ${exp}
- 핵심 USP: ${usp}
- 미팅 메모: ${meetmemo}

## 역량 진단 결과
- 종합 점수: ${overallAvg}/5.0 (${grade})
- 영역별: ${areaStr}
- 강점: ${strong}
- 보완 필요: ${weak}

## ARK 퍼널 목표 수치 (역량 점수 ${overallAvg}점 기준)
- 아웃리치 발송: ${outreach}개사
- 응답 목표: ${response}건
- 미팅 성사: ${meeting}건
- 샘플 오더: ${sampleOrder}건
- 계약 목표: ${contract}건

---

아래 6개 섹션을 순서대로 작성하세요. 각 섹션 제목은 ## 으로 시작하세요.

## 1. 3단계 로드맵 개요
단기(0~3개월) / 중기(3~12개월) / 장기(12개월~) 각각:
- 핵심 목표 KPI (수출액 목표: 단기 ${exportGoalS}, 중기 ${exportGoalM}, 장기 ${exportGoalL})
- 핵심 과제 5가지 (bullet)
ARK 관련 표현: "ARK가 ~를 대행합니다"로 작성

## 2. 역량 영역별 액션 플랜
강점 영역(${strong})과 보완 필요 영역(${weak})을 구분해서:
- 각 영역별 단기·중기 구체 액션
- ARK가 어떻게 약점을 커버하는지 명시

## 3. 바이어 수요 진단 (L1)
"이미 존재하는 수요"를 강조하며:
- ${market} 시장의 ${product} 수입 트렌드 2~3줄
- ARK 6.8억 건 실거래 데이터 기반 바이어 발굴 방식 설명
- 소싱 시그널 유형 (신규 공급사 탐색 / 공급선 다변화 / 물량 확대) 설명

## 4. ARK 실행 프로세스 (L2)
4단계(분석→발굴·스코어링→AI 다국어 아웃리치→미팅 세팅) 각각:
- ARK가 구체적으로 무엇을 합니까
- 이 기업의 상황(역량 점수, 품목, 시장)에 맞춘 구체적 실행 내용
- ARK 담당 vs 고객사 담당 구분 명확히

## 5. 단계별 골 세팅 (L3)
위에 제시된 퍼널 수치(${outreach}→${response}→${meeting}→${sampleOrder}→${contract})를 기반으로:
- 단기: 아웃리치 개시 조건, 응답률 기대치, 미팅 목표
- 중기: 샘플 오더 전환 전략, 본계약 목표, 수출액 ${exportGoalM} 달성 경로
- 장기: 2차 아웃리치 국가 확장, 장기계약 바이어 수 목표

## 6. ARK 아웃리치 전 고객사 준비 조건 (L4)
필수 3가지 + 권장 2가지를 구체적으로:
- 각 항목이 왜 필요한지 바이어 관점에서 설명
- 준비 안 됐을 때 어떤 기회를 잃는지 명시
- ARK 아웃리치 시작 전 완비 권장 기한 제시
마지막에: ARK 담당자가 고객사에 전달할 핵심 메시지 1문단`;

  try {
    let fullText = '';
    const box = document.createElement('div');
    box.className = 'roadmap-output-box';
    output.appendChild(box);

    await callClaude(systemPrompt, userPrompt, (chunk) => {
      fullText += chunk;
      box.innerHTML = markdownToHtml(fullText);
      // 스크롤 따라가기
      box.scrollTop = box.scrollHeight;
    });

    status.className = 'ai-status success';
    status.innerHTML = '✓ 로드맵 생성 완료 — PDF로 저장하거나 고객사에 바로 공유하세요.';
    btn.disabled = false;
    btn.textContent = '✦ 다시 생성';

    // PDF 다운로드 버튼 노출
    showRoadmapPdfBtn(fullText, name);

  } catch (e) {
    status.className = 'ai-status error';
    status.innerHTML = `오류: ${e.message}`;
    btn.disabled = false;
  }
}

// ────────────────────────────────────────────────
// 로드맵 PDF 다운로드
// ────────────────────────────────────────────────
function showRoadmapPdfBtn(fullText, name) {
  const existing = document.getElementById('roadmap-pdf-btn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.id = 'roadmap-pdf-btn';
  btn.className = 'btn-pdf';
  btn.style.marginTop = '1rem';
  btn.textContent = '⬇ 로드맵 PDF 다운로드';
  btn.onclick = () => downloadRoadmapPdf(fullText, name);
  document.getElementById('roadmap-output').appendChild(btn);
}

function downloadRoadmapPdf(fullText, corpName) {
  if (!window.jspdf) { alert('PDF 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18, cw = W - M * 2;
  let y = 22;

  const checkY = (need = 8) => { if (y + need > 275) { doc.addPage(); y = 20; } };

  // 헤더
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 95, 165);
  doc.text('Tridge ARK — 수출 로드맵', M, y); y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`${corpName || '기업명 미입력'}  ·  ${nowStr()}  ·  ARK Export Solution`, M, y); y += 8;

  doc.setDrawColor(24, 95, 165);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y); y += 8;

  // 본문 — 마크다운을 PDF 텍스트로 변환
  const lines = fullText.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) { y += 3; return; }

    if (trimmed.startsWith('## ')) {
      checkY(14);
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(24, 95, 165);
      const title = trimmed.replace(/^## /, '');
      doc.text(title, M, y); y += 3;
      doc.setDrawColor(24, 95, 165);
      doc.setLineWidth(0.2);
      doc.line(M, y, W - M, y); y += 6;

    } else if (trimmed.startsWith('### ')) {
      checkY(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(trimmed.replace(/^### /, ''), M, y); y += 6;

    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      checkY(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const content = trimmed.replace(/^[-*] /, '').replace(/\*\*(.+?)\*\*/g, '$1');
      const wrapped = doc.splitTextToSize('· ' + content, cw - 6);
      wrapped.forEach(wl => {
        checkY(6);
        doc.text(wl, M + 4, y); y += 5;
      });

    } else {
      checkY(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const content = trimmed.replace(/\*\*(.+?)\*\*/g, '$1');
      const wrapped = doc.splitTextToSize(content, cw);
      wrapped.forEach(wl => {
        checkY(6);
        doc.text(wl, M, y); y += 5;
      });
    }
  });

  // 푸터
  checkY(12);
  y += 4;
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('본 로드맵은 Tridge ARK 수출역량 상담 도구를 통해 생성되었습니다.', M, y);

  const filename = `ARK_수출로드맵_${(corpName || '기업명').replace(/\s/g,'_')}_${nowStr()}.pdf`;
  doc.save(filename);
}

// ────────────────────────────────────────────────
// 마크다운 → HTML 변환
// ────────────────────────────────────────────────
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

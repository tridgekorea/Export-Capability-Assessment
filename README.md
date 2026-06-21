# Tridge ARK — 수출역량 상담 도구

Tridge ARK 담당자가 고객사 미팅 현장에서 사용하는 **수출역량 상담 웹앱**입니다.  
Claude AI 연동으로 기업 사전조사 자동화, 역량 진단, 바이어 발굴 전략, AI 수출 로드맵 생성, PDF 리포트 출력까지 한 번에 처리합니다.

---

## 주요 기능

| 단계 | 기능 | 설명 |
|------|------|------|
| ① | **AI 기업 사전조사** | 기업명 입력 → Claude API가 품목·수출실적·USP 자동 분석·입력 |
| ② | **역량 진단** | 12개 항목 1~5점 진단 (고객사와 함께 미팅 중 작성) |
| ③ | **바이어 발굴 전략** | 레이더 차트 + 영역별 인사이트 + ARK 검색 조건 + 우선순위 바이어 |
| ④ | **액션 & PDF 리포트** | 미팅 의사록 + 진단 결과 + 바이어 전략 + 액션 아이템 → PDF 1클릭 출력 |
| ⑤ | **AI 수출 로드맵** | 진단 결과 기반 Claude가 단기/중기/장기 로드맵 실시간 스트리밍 생성 |

---

## 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/tridge-ark.git
cd tridge-ark
```

### 2. 실행
별도 빌드 없이 `index.html`을 브라우저에서 바로 열거나, 로컬 서버 사용:
```bash
# Python
python -m http.server 3000

# Node.js
npx serve .
```

### 3. Claude API 키 설정
앱 상단 ⚙ 버튼 → API 키 입력 → 저장  
API 키는 브라우저 `localStorage`에만 저장되며 외부 전송되지 않습니다.

> Claude API 키 발급: https://console.anthropic.com

---

## 파일 구조

```
tridge-ark/
├── index.html          # 메인 HTML
├── css/
│   └── style.css       # 전체 스타일 (다크모드 지원)
├── js/
│   ├── data.js         # 진단 항목 데이터 + 전역 상태 + Claude API 호출
│   ├── diag.js         # 역량 진단 UI
│   ├── result.js       # 진단 결과, 레이더 차트, 바이어 전략
│   ├── report.js       # 리포트 렌더링 + PDF 출력 (jsPDF)
│   ├── roadmap.js      # AI 수출 로드맵 생성 (스트리밍)
│   └── app.js          # 앱 초기화, 네비게이션, AI 사전조사
└── README.md
```

---

## GitHub Pages 배포

1. GitHub 저장소 → Settings → Pages
2. Source: `main` 브랜치 → `/ (root)` 선택
3. 저장 후 `https://YOUR_USERNAME.github.io/tridge-ark` 에서 접근 가능

---

## 업그레이드 로드맵

- [ ] **관세청 UNI-PASS 연동** — 실제 수출입 실적 자동 조회
- [ ] **KOTRA 바이어 DB 연동** — 실제 바이어 매칭
- [ ] **미팅 이력 저장** — localStorage 기반 고객사별 히스토리
- [ ] **다국어 지원** — 영문 리포트 출력
- [ ] **Slack/이메일 공유** — 리포트 1클릭 발송

---

## 기술 스택

- Vanilla HTML / CSS / JavaScript (빌드 도구 없음)
- [Claude API](https://docs.anthropic.com) — AI 사전조사 & 로드맵 생성 (스트리밍)
- [jsPDF](https://github.com/parallax/jsPDF) — PDF 출력

---

## 기여 방법

1. Fork 후 feature 브랜치 생성: `git checkout -b feature/기능명`
2. 변경 후 커밋: `git commit -m "feat: 기능 설명"`
3. PR 생성

---

## 라이선스

MIT

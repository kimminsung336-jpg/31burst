# 31 버스트

콘카페 캐스트들이 SNS 화제성 게이지를 딱 31에 맞추는 1:1 카드게임 프로토타입.

플레이: https://kimminsung336-jpg.github.io/31burst/

## 구조

| 파일 | 내용 |
|---|---|
| `index.html` | 화면 뼈대 |
| `css/style.css` | 기본 스타일 (설명서·덱 보기·온라인 창) |
| `css/p.css` | P안 스킨: 16:9 스테이지, 플레이 화면, 카드, 메뉴 화면들 |
| `js/data.js` | 카드·캐스트 데이터 (브라우저·node 공용) |
| `js/cardview.js` | 카드 그리기 (B안: 폴라로이드·말풍선·신문 + 숫자 배지) |
| `js/logo.js` | 31 BURST 로고 SVG |
| `js/state.js` | 판 상태(G)와 작은 도구들 |
| `js/game.js` | 판 진행: 뽑기·내기·턴·판 끝 |
| `js/sim.js` | 판 시뮬레이터(MCE). 어려움 AI와 헤드리스 시뮬이 같이 쓴다 (브라우저·node 공용) |
| `js/ai.js` | AI 수 고르기 |
| `js/net.js` | 온라인 2인 (PeerJS) |
| `js/fx.js` | 이펙트·카드 날리기·타임라인 서랍 |
| `js/posts.js` | 타임라인 포스트 문구·임시 일러스트 |
| `js/ui.js` | 덱 보기·설명서·입력·온라인용 캐스트 선택 |
| `js/screens.js` | 시작·메인·대전 준비·보상·스토리·캐스트(덱 편집)·도감·설정, 저장(localStorage) |
| `img/p/` | P안 그림 (배경·스프라이트·바 테이블·소품·아바타) |
| `tools/sim.js` | 헤드리스 시뮬 |

스크립트는 `index.html`에 적힌 순서대로 읽는다. 순서를 바꾸지 말 것.

## 헤드리스 시뮬

```
node tools/sim.js [난이도] [상대별 게임 수] [시드]
node tools/sim.js normal 1000
```

시드를 주면 결과가 매번 같다. 구조를 고친 뒤에는 같은 시드로 돌려서 결과가 그대로인지 확인한다.

안 쓰는 능력은 `LEGACY.md`에 있다.

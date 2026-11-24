# 31 버스트

콘카페 캐스트들이 SNS 화제성 게이지를 딱 31에 맞추는 1:1 카드게임 프로토타입.

플레이: https://kimminsung336-jpg.github.io/31burst/

## 구조

| 파일 | 내용 |
|---|---|
| `index.html` | 화면 뼈대 |
| `css/style.css` | 스타일 |
| `js/data.js` | 카드·캐스트 데이터 (브라우저·node 공용) |
| `js/state.js` | 판 상태(G)와 작은 도구들 |
| `js/game.js` | 판 진행: 뽑기·내기·턴·판 끝 |
| `js/sim.js` | 판 시뮬레이터(MCE). 어려움 AI와 헤드리스 시뮬이 같이 쓴다 (브라우저·node 공용) |
| `js/ai.js` | AI 수 고르기 |
| `js/net.js` | 온라인 2인 (PeerJS) |
| `js/fx.js` | 이펙트·카드 날리기·타임라인 서랍 |
| `js/posts.js` | 타임라인 포스트 문구·임시 일러스트 |
| `js/ui.js` | 덱 보기·설명서·입력·캐스트 선택 |
| `tools/sim.js` | 헤드리스 시뮬 |

스크립트는 `index.html`에 적힌 순서대로 읽는다. 순서를 바꾸지 말 것.

## 헤드리스 시뮬

```
node tools/sim.js [난이도] [상대별 게임 수] [시드]
node tools/sim.js normal 1000
```

시드를 주면 결과가 매번 같다. 구조를 고친 뒤에는 같은 시드로 돌려서 결과가 그대로인지 확인한다.

안 쓰는 능력은 `LEGACY.md`에 있다.

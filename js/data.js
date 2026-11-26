// 카드·캐스트 데이터. 브라우저와 node(헤드리스 시뮬) 양쪽에서 읽는다.
const C=(id,name,v,text,o={})=>({id,name,v,text,...o});
const SHARED=[
 C('shot','오늘의 출근샷',1,'효과 없음',{photo:1}),
 C('selfie','셀카 업로드',2,'효과 없음',{photo:1}),
 C('menu','신메뉴 홍보',3,'효과 없음',{photo:1}),
 C('boom','조회수 폭발',5,'효과 없음'),
 C('edit','수정됨',1,'낼 때 숫자를 0·1·2 중에서 고른다',{choice:[0,1,2]}),
 C('excuse','해명문',-3,'효과 없음'),
 C('trend','실검 1위',2,'게이지가 20 이상이면 숫자가 4'),
 C('story','스토리 올리기',2,'카드 1장을 뽑는다',{photo:1,draw:1}),
 C('dm','DM 염탐',1,'상대 손패를 전부 본다'),
 C('snipe','저격글',2,'상대는 다음 턴에 3 이상인 카드를 못 낸다'),
 C('repost','리포스트',1,'이번 턴에 1장 더 낸다',{extra:1}),
 C('scoop','특종!',31,'저스트 불가. 목표에 딱 맞으면 버스트',{nofinish:1}),
];
// ---------- 카드풀 (지금 덱에는 안 들어감, 나중에 덱빌딩에서 사용) ----------
const POOL_SHARED=[
 C('unfollow','언팔로우',-2,'효과 없음'),
 C('unlike','좋아요 취소',-1,'효과 없음'),
 C('lurk','눈팅',0,'효과 없음'),
 C('challenge','해시태그 챌린지',4,'효과 없음'),
];
// 스토리 3장 보상 카드: 캐스트마다 3장 결말을 카드로
const POOL_COLOR={
 M:[C('reup','재업',0,'숫자가 이번 판에 낸 사진 포스트 수',{photo:1}),
    C('nofilter','투샷',3,'숫자가 안 바뀐다. 이 카드로 저스트하면 판돈 +2',{photo:1,fixed:1})],
 K:[C('nofate','점괘 없이',0,'낼 때 숫자를 0~4 중에서 고른다',{choice:[0,1,2,3,4]})],
 Y:[C('omurice','오므라이스',3,'효과 없음',{photo:1}),   // 하루 덱에서 뺀 카드
    C('entrust','맡길게요',0,'카드 2장을 뽑고, 다음 내 차례를 쉰다',{draw:2})],
 C:[C('rematch','리매치',2,'직전 판을 졌으면 이번 턴에 1장 더 낸다')],
};
const IRI=[
 C('burst','셀카 연사',1,'이번 턴에 1장 더 낸다',{photo:1,extra:1}),
 C('nail','네일 자랑',2,'손패 1장을 덱 맨 아래에 넣고 2장 뽑는다',{photo:1}),
 C('fourcut','인생네컷',1,'이번 판에 사진 포스트를 3장 이상 냈으면 숫자가 4',{photo:1}),
 C('filter','필터 과다',1,'낼 때 숫자를 1이나 2 중에서 고른다',{photo:1,choice:[1,2]}),
 C('f4f','맞팔 이벤트',2,'양쪽 다 1장씩 뽑는다'),
 C('vlog','브이로그',3,'효과 없음',{photo:1}),
 C('hilite','스토리 하이라이트',0,'카드 1장을 뽑는다',{photo:1,draw:1}),
 C('viral','바이럴 영상',5,'효과 없음',{photo:1}),
];
const MIKO=[
 C('omen','흉',5,'효과 없음'),
 C('doll','저주 인형',1,'상대 손패 1장을 보고, 3 이상이면 버리게 한다'),
 C('charm','부적',0,'상대가 다음에 내는 카드는 숫자 +1'),
 C('ward','결계',0,'게이지를 1~3 내린다',{lower:[1,2,3]}),
 C('silence','침묵의 주문',0,'상대의 다음 차례를 건너뛴다',{once:1}),
 C('prophecy','불길한 예언',4,'이 카드로 버스트하면 판돈 3배',{triple:1}),
 C('fortune','점괘',1,'덱 위 3장 중 1장을 골라 손에 넣는다'),
 C('convert','포교',2,'상대 손패를 무작위로 한 장 버린다'),
];
const HARU=[
 C('cheek','볼 터치 셀카',2,'낼 때 숫자를 2나 3 중에서 고른다',{photo:1,choice:[2,3]}),
 C('aizuchi','맞장구',1,'낼 때 숫자를 1·2·3 중에서 고른다',{choice:[1,2,3]}),
 C('tiki','티키타카',0,'숫자가 이번 판에 상대와 같은 숫자를 낸 횟수'),
 C('tea','야간 티타임',1,'다음 내 차례에 1장 더 낸다',{photo:1}),
 C('drip','핸드드립',0,'덱 위 2장 중 1장을 손에 넣고, 나머지는 덱 맨 아래로'),
 C('wink','윙크 셀카',3,'낼 때 숫자를 3이나 4 중에서 고른다',{photo:1,choice:[3,4]}),
 C('dishes','마감 설거지',0,'게이지를 1~2 내린다',{lower:[1,2]}),
 C('regular','단골 손님',2,'손패가 3장 이하면 1장 뽑는다'),
];
const MINA=[
 C('mvp','오늘의 MVP',4,'효과 없음',{photo:1}),
 C('jog','아침 조깅',1,'이번 턴에 1장 더 낸다',{photo:1,extra:1}),
 C('shake','프로틴 쉐이크',3,'효과 없음',{photo:1}),
 C('court','야간 농구',0,'카드 1장을 뽑는다',{photo:1,draw:1}),
 C('dunk','덩크',6,'효과 없음'),
 C('combo','연속 득점',2,'낼 때 숫자를 2나 4 중에서 고른다',{choice:[2,4]}),
 C('whistle','휘슬',1,'상대는 다음 턴에 2 이하인 카드를 못 낸다'),
 C('sub','선수 교체',1,'손패 1장을 덱 맨 아래에 넣고 1장 뽑는다'),
];
const CASTS={
 iri:{name:'아이리',handle:'@iri_cafe',type:'M · 갸루',deck:[...SHARED,...IRI],photoDraw:1,back:['#ff2e8a','#c41d68'],
  abil:'<b>셀카 중독</b> 사진을 포스트하면 한 장 뽑는다',
  style:'사진 포스트로 손을 계속 돌리고, 숫자를 유연하게 맞춘다'},
 miko:{name:'미코',handle:'@miko_occult',type:'K · 오컬트',deck:[...SHARED,...MIKO],revMom:1,abName:'흉조',back:['#7a4cc4','#4b2a85'],
  abil:'<b>흉조</b> 전보다 작은 숫자를 내면 상대가 한 장 버린다',
  style:'상대 손을 끊고, 판이 터지길 기다린다'},
 haru:{name:'하루',handle:'@haru_ne',type:'Y · 누님',deck:[...SHARED,...HARU],mirror:1,back:['#f5b800','#b98a00'],
  abil:'<b>받아주기</b> 상대와 같은 숫자를 내면 한 장 뽑는다',
  style:'판을 천천히 끌고 가다가 마지막 한 칸을 맞춘다'},
 mina:{name:'준',handle:'@jun_mvp',type:'C · 톰보이',deck:[...SHARED,...MINA],momentum:1,back:['#12c6dc','#0a8fa3'],
  abil:'<b>기세 올려!</b> 전보다 2 이상 큰 숫자를 내면 한 장 뽑는다',
  style:'큰 숫자로 몰아치다가 한 칸 넘친 걸 붙잡는다'}
};
// ---------- 레거시 능력 (지금은 안 씀, 나중에 다시 꺼내 쓰기용) ----------
// 캐스트 객체에 플래그를 붙이면 엔진이 그대로 처리한다.
const LEGACY_ABILITIES={
  omenOld:{name:'흉조 (구)',flags:{bustPlus:1,bustDraw:2},text:'버스트하면 판돈을 더 올리고, 두 장 뽑는다',from:'미코'},
  adultEase:{name:'어른의 여유',flags:{adjust:1},text:'판마다 한 번, 낸 카드 숫자를 1 올린다 (쓸지 고름)',from:'하루'},
  catchBreath:{name:'숨 고르기',flags:{adjust:-1},text:'판마다 한 번, 낸 카드 숫자를 1 내린다 (쓸지 고름)',from:'준'},
  curse:{name:'저주',flags:{curse:6},text:'상대 턴이 시작될 때 손패가 6장 이상이면 무작위로 1장 버린다',from:'미코 시안'},
  bustDiscard:{name:'버스트 디스카드',flags:{bustDiscard:1},text:'버스트가 나면 상대가 무작위로 1장 버린다',from:'미코 시안'},
};
const abOf=k=>({photoDraw:CASTS[k].photoDraw,bustPlus:CASTS[k].bustPlus,bustDraw:CASTS[k].bustDraw,adjust:CASTS[k].adjust,momentum:CASTS[k].momentum,mirror:CASTS[k].mirror,curse:CASTS[k].curse,revMom:CASTS[k].revMom,bustDiscard:CASTS[k].bustDiscard});
if(typeof module!=='undefined')module.exports={C,SHARED,POOL_SHARED,POOL_COLOR,CASTS,LEGACY_ABILITIES};

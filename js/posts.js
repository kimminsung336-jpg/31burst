// 타임라인 포스트 문구·임시 일러스트
const POST={
 opening:'오늘 오픈! 첫 손님 기다리는 중~ 조명 각 미쳤다',
 shot:'출근 완료! 오늘도 잘 부탁해요~',
 selfie:'오늘 앞머리 대성공한 날',
 menu:'신메뉴 딸기 라떼 나왔어요. 첫 주문엔 체키 한 장 서비스',
 boom:'어제 올린 거 조회수 왜 이래? 다들 고마워',
 algo:'알림이 안 멈춰… 폰 터질 것 같음',
 edit:'오타 고쳤어요 ㅎㅎ',
 excuse:'오해가 있었던 것 같아서 글 남깁니다',
 trend:'실검에 우리 가게 이름 있는 거 실화?',
 water:'다들 다른 얘기 하자! 오늘 날씨 좋다~',
 story:'스토리에 메이킹 올렸으니 보러 와',
 draft:'쓰다가 임시저장… 이건 나중에 올릴게',
 sched:'내일 9시에 중대 발표 있습니다',
 dm:'어머 실수로 DM 열어봤네 미안~',
 snipe:'누구라고는 안 하겠는데 요즘 좀 그렇더라',
 capture:'캡처 떠놨으니 지우지 마세요^^',
 report:'이 계정 신고 부탁드려요',
 repost:'이거 우리 가게 얘기 아님? 공유함',
 ignore:'(읽음)',
 bold:'네 제가 그랬습니다. 그래서 뭐요',
 sorry:'심려를 끼쳐드려 죄송합니다',
 burst:'연사로 찍었는데 다 잘 나와서 못 고르겠어',
 nail:'새로 한 네일 봐봐! 반짝반짝',
 fourcut:'인생네컷 찍고 옴 ㅎㅎ 오늘 텐션 최고',
 filter:'필터 좀 세게 넣었나…? 아무튼 귀여움',
 f4f:'맞팔 이벤트! 팔로우하면 나도 바로 감~',
 vlog:'출근 브이로그 올렸어요. 끝까지 봐줘',
 hilite:'하이라이트 정리했어! 프로필 보러 와',
 viral:'이거 왜 터짐?? 다들 어디서 보고 온 거야',
 omen:'오늘은… 흉이 나왔어요. 조심하세요. 으흐흐',
 doll:'이 인형… 누구 닮았는지 알아요?',
 charm:'부적 하나 붙여드렸어요. 떼면 안 돼요',
 ward:'결계를 쳤어요. 잠깐만 조용히 해주세요',
 silence:'쉿.',
 prophecy:'곧 큰일이 날 거예요. 예언이에요',
 fortune:'오늘의 점괘가 나왔어요… 궁금해요?',
 convert:'우리 가게로 오세요… 구원받을 수 있어요',
 scoop:'특종!! 오늘 우리 가게 미쳤음 다들 와'
};
const HEART='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 4.2 2.4C11.8 6.1 13.2 5 15.2 5c3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>';
const REPLY='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>';
/* 사진 첨부 포스트. 지금은 임시 일러스트, 나중에 실제 캐릭터 그림으로 교체 */
const SKIN='#ffe3d6';
const hairOf=p=>CASTS[SEAT[p]].back[0];
function face(cx,cy,r,p,wink){
  const h=hairOf(p);
  return `<path d="M${cx-r*1.15} ${cy+r*1.5} Q${cx-r*1.3} ${cy-r*1.2} ${cx} ${cy-r*1.25} Q${cx+r*1.3} ${cy-r*1.2} ${cx+r*1.15} ${cy+r*1.5} Z" fill="${h}"/>
  <ellipse cx="${cx}" cy="${cy+r*.05}" rx="${r*.92}" ry="${r}" fill="${SKIN}"/>
  <path d="M${cx-r*.95} ${cy-r*.2} Q${cx-r*.3} ${cy-r*1.35} ${cx+r*.95} ${cy-r*.35} Q${cx+r*.2} ${cy-r*.65} ${cx-r*.95} ${cy-r*.2}Z" fill="${h}"/>
  ${wink?`<path d="M${cx-r*.5} ${cy+r*.12} q${r*.17} -${r*.14} ${r*.34} 0" stroke="#3a2230" stroke-width="${r*.09}" fill="none" stroke-linecap="round"/>`:`<ellipse cx="${cx-r*.33}" cy="${cy+r*.12}" rx="${r*.1}" ry="${r*.16}" fill="#3a2230"/>`}
  <ellipse cx="${cx+r*.33}" cy="${cy+r*.12}" rx="${r*.1}" ry="${r*.16}" fill="#3a2230"/>
  <ellipse cx="${cx-r*.52}" cy="${cy+r*.42}" rx="${r*.16}" ry="${r*.08}" fill="#ff9ec4" opacity=".7"/>
  <ellipse cx="${cx+r*.52}" cy="${cy+r*.42}" rx="${r*.16}" ry="${r*.08}" fill="#ff9ec4" opacity=".7"/>
  <path d="M${cx-r*.15} ${cy+r*.5} q${r*.15} ${r*.17} ${r*.3} 0" stroke="#3a2230" stroke-width="${r*.07}" fill="none" stroke-linecap="round"/>`;
}
const svg=(body,bg)=>`<svg viewBox="0 0 320 190" role="img" aria-label="첨부 사진"><rect width="320" height="190" fill="${bg}"/>${body}</svg>`;
const IMG={
  selfie:p=>svg(`<circle cx="60" cy="40" r="30" fill="#fff" opacity=".35"/><circle cx="270" cy="150" r="46" fill="#fff" opacity=".25"/>
    ${face(160,95,48,p,true)}
    <rect x="212" y="98" width="13" height="38" rx="6" fill="${SKIN}" transform="rotate(-14 218 117)"/><rect x="228" y="100" width="13" height="38" rx="6" fill="${SKIN}" transform="rotate(12 234 119)"/><rect x="210" y="128" width="36" height="30" rx="12" fill="${SKIN}"/>
    <text x="22" y="174" font-size="15" fill="#fff" font-family="Black Han Sans">오늘의 셀카 ♡</text>`,p?'#bdf1fb':'#ffc6de'),
  shot:p=>svg(`<rect x="40" y="58" width="240" height="132" fill="#fff"/>
    ${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${40+i*30}" y="44" width="30" height="34" fill="${i%2?'#fff':hairOf(p)}"/>`).join('')}
    <path d="M40 78 ${[0,1,2,3,4,5,6,7].map(i=>`q15 14 30 0`).join(' ')}" fill="${hairOf(p)}"/>
    <rect x="70" y="100" width="70" height="90" rx="6" fill="#2a2230"/><rect x="170" y="100" width="84" height="56" rx="6" fill="#d9f4fb"/>
    <rect x="90" y="120" width="30" height="16" rx="3" fill="#ffd23f"/><text x="105" y="132" font-size="10" text-anchor="middle" fill="#16121a" font-weight="700">OPEN</text>
    ${face(212,138,18,p,false)}`,'#ffeaf3'),
  menu:p=>svg(`<rect x="0" y="140" width="320" height="50" fill="#f3d6c4"/>
    <path d="M120 40 h80 l-10 130 h-60 z" fill="#fff" opacity=".9"/><path d="M124 80 h72 l-7 90 h-58 z" fill="#ff9ec4"/><path d="M128 120 h64 l-4 50 h-56 z" fill="#ff5ea8"/>
    <ellipse cx="160" cy="40" rx="40" ry="8" fill="#fff"/><rect x="176" y="8" width="6" height="40" rx="3" fill="${hairOf(p)}" transform="rotate(14 179 28)"/>
    <path d="M224 140 q16 -26 32 0 q-16 26 -32 0z" fill="#ff2e5e"/><path d="M234 128 l6 8 l6 -8" stroke="#3aa35b" stroke-width="4" fill="none"/>
    <text x="22" y="34" font-size="16" fill="#16121a" font-family="Black Han Sans">NEW 딸기 라떼</text>`,'#fff6ee'),
  story:p=>svg(`<rect x="110" y="8" width="100" height="174" rx="14" fill="#16121a"/>
    ${[0,1,2].map(i=>`<rect x="${120+i*28}" y="16" width="24" height="3" rx="1.5" fill="#fff" opacity="${i?'.4':'1'}"/>`).join('')}
    <rect x="118" y="26" width="84" height="150" rx="8" fill="${p?'#bdf1fb':'#ffc6de'}"/>${face(160,98,26,p,false)}
    <rect x="128" y="150" width="64" height="16" rx="8" fill="#fff"/><text x="160" y="162" font-size="9" text-anchor="middle" fill="#16121a" font-weight="700">메이킹 보러 오기</text>
    <circle cx="50" cy="60" r="26" fill="#fff" opacity=".5"/><circle cx="270" cy="130" r="34" fill="#fff" opacity=".5"/>`,'#f3e9ff'),
  boom:p=>svg(`${[0,1,2,3,4,5].map(i=>`<rect x="${40+i*42}" y="${160-[20,26,22,40,78,130][i]}" width="28" height="${[20,26,22,40,78,130][i]}" rx="4" fill="${i>3?hairOf(p):'#d8cbd2'}"/>`).join('')}
    <path d="M54 140 L96 134 L138 138 L180 118 L222 80 L264 30" stroke="#16121a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M252 26 l14 2 l-4 14" stroke="#16121a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <text x="24" y="34" font-size="16" fill="#16121a" font-family="Black Han Sans">조회수 ↑ 2,840%</text>`,'#fff'),
  trend:p=>svg(`<text x="24" y="34" font-size="15" fill="#16121a" font-family="Black Han Sans">실시간 검색어</text>
    ${[0,1,2,3,4].map(i=>`<rect x="24" y="${48+i*27}" width="272" height="22" rx="6" fill="${i?'#f1ecef':hairOf(p)}"/><text x="36" y="${64+i*27}" font-size="13" font-weight="700" fill="${i?'#6b5a66':'#fff'}">${i+1}</text><rect x="58" y="${55+i*27}" width="${i?[0,150,120,170,100][i]:190}" height="8" rx="4" fill="${i?'#d8cbd2':'#fff'}" opacity="${i?1:.85}"/>`).join('')}`,'#fff'),
  capture:p=>svg(`<rect x="34" y="20" width="252" height="150" rx="10" fill="#fff" stroke="#d8cbd2"/>
    ${[0,1,2,3,4].map(i=>`<rect x="52" y="${40+i*24}" width="${[200,170,210,140,180][i]}" height="10" rx="5" fill="#d8cbd2"/>`).join('')}
    <ellipse cx="150" cy="92" rx="88" ry="20" fill="none" stroke="#ff2e2e" stroke-width="4"/>
    <text x="244" y="160" font-size="14" fill="#ff2e2e" font-family="Black Han Sans" transform="rotate(-8 244 160)">박제 완료</text>`,'#f6f1f4')
};
const OWNPH={burst:'iri_selfie',nail:'iri_selfie',fourcut:'iri_selfie',filter:'iri_selfie',vlog:'iri_shot',hilite:'iri_story',fortune:'miko_story',
 cheek:'haru_selfie',wink:'haru_shot',omurice:'haru_menu',tea:'haru_story',mvp:'mina_selfie',jog:'mina_shot',shake:'mina_menu',court:'mina_story'};
const photoOf=(p,id)=>['selfie','shot','menu','story'].includes(id)?`${SEAT[p]}_${id}`:OWNPH[id];
IMG.viral=IMG.boom;
const POST_MIKO={
 selfie:'으흐흐… 오늘도 찍혀버렸다',
 shot:'오늘도… 문 열었어요… 들어올 거죠?',
 menu:'신메뉴 저주 소다. 마시면 행운이 와요. 아마도',
 story:'오늘의 운세 봐드립니다. 피하면 더 나빠져요',
 excuse:'오해예요… 저주는 안 걸었어요… 아직은',
 snipe:'누군가 오늘 밤 악몽을 꾸겠네요… 으흐흐',
 sorry:'죄송합니다… 부적이 잘못 붙었어요',
 scoop:'특종입니다… 예언이 맞았어요. 으흐흐'
};
const POST_HARU={
 shot:'하루네 문 열었어요. 천천히 들렀다 가요',
 selfie:'오늘은 볕이 좋아서 한 장. 다들 밥은 챙겨 먹었어요?',
 menu:'오늘의 메뉴는 오므라이스. 케첩 하트는 서비스예요',
 story:'마감하고 혼자 차 한 잔. 오늘도 수고했어요',
 boom:'어제 올린 사진이 왜 이렇게 퍼졌지… 다들 고마워요',
 excuse:'오해가 있었나 봐요. 차 한 잔 하면서 천천히 얘기해요',
 snipe:'누구라고는 안 할게요. 그래도 그러면 못써요',
 scoop:'어머, 오늘 손님이 왜 이렇게 많지? 다들 고마워요',
 cheek:'셀카는 아직 좀 어색하네요. 그래도 한 장',
 aizuchi:'그렇죠, 그렇죠. 얘기 더 해봐요',
 wink:'오늘은 특별히 한 장 더. 다른 손님들한텐 비밀이에요',
 omurice:'오므라이스 나왔습니다. 하트는 제가 직접 그렸어요',
 tiki:'오늘 손님이랑 말이 너무 잘 통해요. 이런 날이 제일 좋아',
 tea:'오늘 밤은 캐모마일. 같이 마실래요?',
 drip:'원두 새로 들어왔어요. 지금 천천히 내리는 중',
 calm:'괜찮아요, 그렇게 서두르지 않아도 돼요',
 dishes:'마감 설거지 끝. 이제 좀 쉬어야겠다',
 regular:'단골 손님 오셨네요. 늘 드시던 걸로 드릴게요'
};
const POST_MINA={
 shot:'아침 조깅 끝! MVP 오늘도 오픈한다',
 selfie:'오늘 컨디션 최고. 다들 운동했냐?',
 menu:'신메뉴 프로틴 쉐이크! 마시고 같이 뛰자',
 story:'야간 농구 한 판 하고 옴. 내일도 이긴다',
 boom:'뭐야 조회수 왜 이래? 다들 고마워!',
 excuse:'아니 그게 아니라… 오해야 오해!',
 snipe:'누구라고는 안 하는데 그렇게 하면 반칙이지',
 scoop:'특종! 오늘 MVP 완전 터졌다. 다들 와!',
 mvp:'오늘의 MVP는 누구? 당연히 나지',
 jog:'아침 조깅 인증! 땀 흘리는 게 최고야',
 shake:'프로틴 쉐이크 원샷. 근육아 기다려라',
 court:'밤 코트 분위기 진짜 좋다. 한 판 더?',
 dunk:'덩크 성공. 봤냐?',
 combo:'연속 득점 간다! 흐름 탔어',
 whistle:'삐익! 거기 반칙!',
 sub:'선수 교체! 다음 타자 들어간다'
};
const POSTS={miko:POST_MIKO,haru:POST_HARU,mina:POST_MINA};

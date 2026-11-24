// 진행: 호감도 · 업적 · 해금. 해금 목록은 따로 저장하지 않고 저장된 진행(호감도·업적·스토리)에서 계산한다.
const Progress=(()=>{
  const AFF_LV=[0,3,7,12];   // 호감도 Lv1~4가 되는 누적 호감도
  const ACH={   // 게임 안 업적 (처음 해보는 플레이)
    bust3:{name:'불난 집',cond:'한 판에 버스트 3번'},
    bigJust:{name:'큰 판',cond:'판돈 4점 이상으로 저스트'},
    drawRound:{name:'눈치 싸움',cond:'둘 다 패스해서 무승부'},
    hardWin:{name:'에이스',cond:'AI 어려움 상대로 대전 승리'},
  };
  // 카드풀 카드 해금 조건. 기본 덱 카드는 처음부터 열려 있다
  const CARD={
    reup:{lv:['iri',2]},omurice:{lv:['haru',2]},
    nofilter:{story:'iri3'},nofate:{story:'miko3'},entrust:{story:'haru3'},rematch:{story:'mina3'},
    unfollow:{ach:'bust3'},unlike:{ach:'bigJust'},lurk:{ach:'drawRound'},challenge:{ach:'hardWin'},
  };
  const d=()=>{const s=Save.d;s.aff=s.aff||{};s.ach=s.ach||{};s.story=s.story||{};return s};
  const aff=k=>d().aff[k]||0;
  const lv=k=>AFF_LV.filter(x=>aff(k)>=x).length;
  const nextLv=k=>AFF_LV[lv(k)];   // 다음 레벨까지 필요한 누적 호감도 (만렙이면 undefined)
  function condText(id){const c=CARD[id];if(!c)return'';if(c.story){const st=STORY.find(x=>x.id===c.story);return`${CASTS[st.k].name} 스토리 ${st.ch}장 클리어`}return c.lv?`${CASTS[c.lv[0]].name} 호감도 Lv${c.lv[1]}`:ACH[c.ach].cond}
  function cardOpen(id){const c=CARD[id];if(!c)return true;if(c.story)return!!d().story[c.story];return c.lv?lv(c.lv[0])>=c.lv[1]:!!d().ach[c.ach]}
  // 스토리: 1장은 처음부터, 다음 장은 앞 장을 깨면
  const chapter=(k,n)=>STORY.find(x=>x.k===k&&x.ch===n);
  const storyDone=id=>!!d().story[id];
  // 캐스트 해금: 처음엔 아이리만. 각 캐스트 스토리 2장을 깨면 그 라이벌이 열린다 (설정의 전원 해금으로 다 열 수도 있다)
  const CAST_FROM={miko:'iri',haru:'miko',mina:'haru'};
  const castOpen=k=>!CAST_FROM[k]||!!d().allCast||storyDone(CAST_FROM[k]+'2');
  const castCond=k=>CAST_FROM[k]?`${CASTS[CAST_FROM[k]].name} 스토리 2장 클리어`:'';
  function storyOpen(st){if(!castOpen(st.k))return false;if(st.ch===1)return true;const p=chapter(st.k,st.ch-1);return!!p&&storyDone(p.id)}
  const nextStory=k=>STORY.filter(x=>x.k===k).find(x=>storyOpen(x)&&!storyDone(x.id));
  // 두 번째 캐스트(더미): 같은 색 캐스트 3장을 깨면 합류
  const secondOpen=k=>{const c=chapter(k,3);return!!c&&storyDone(c.id)};
  // 지금 열려 있는 것들의 목록 (새로 열린 걸 찾으려고 대전 전후를 비교한다)
  function snapshot(){const s=new Set();
    CAST_KEYS.forEach(k=>castOpen(k)&&s.add('cast:'+k));
    Object.keys(CARD).forEach(id=>cardOpen(id)&&s.add('card:'+id));
    STORY.forEach(st=>storyOpen(st)&&s.add('story:'+st.id));
    CAST_KEYS.forEach(k=>{secondOpen(k)&&s.add('cast2:'+k);s.add('lv:'+k+':'+lv(k))});
    return s}
  function label(key){const[t,a,b]=key.split(':');
    if(t==='card')return`카드 「${BYID[a].name}」`;
    if(t==='story'){const st=STORY.find(x=>x.id===a);return`스토리 「${CASTS[st.k].name} ${st.ch}장」`}
    if(t==='cast')return`캐스트 「${CASTS[a].name}」`;
    if(t==='cast2')return`${CASTS[a].name}의 동료 캐스트`;
    if(t==='lv')return`${CASTS[a].name} 호감도 Lv${b}`;
    return key}
  // 대전이 끝나면 부른다: 업적·호감도·스토리를 반영하고, 보상 화면에 보여줄 내용을 돌려준다
  let last=null;
  function onMatchEnd({k,won,hist,diff,online,story}){
    const before=snapshot(),s=d(),gain={aff:0,ach:[],clear:false,story};
    const mark=id=>{if(!s.ach[id]){s.ach[id]=1;gain.ach.push(id)}};
    hist.forEach(h=>{if(h.busts>=3)mark('bust3');if(h.w===0&&h.pts>=4)mark('bigJust');if(h.w===null)mark('drawRound')});
    if(won&&(diff==='hard'||diff==='xhard')&&!online)mark('hardWin');
    if(won)gain.aff+=1;
    if(story){const st=STORY.find(x=>x.id===story);
      const ok=won&&(!st.goal||!st.goal.stake||hist.some(h=>h.w===0&&h.pts>=st.goal.stake));
      gain.goalMiss=won&&!ok;
      if(ok){gain.clear=true;if(!s.story[story]){s.story[story]=1;gain.aff+=2;gain.first=true}}}
    s.aff[k]=(s.aff[k]||0)+gain.aff;
    Save.put();
    const after=snapshot();gain.new=[...after].filter(x=>!before.has(x)).map(label);
    gain.lv=lv(k);gain.affNow=aff(k);gain.affNext=nextLv(k);
    return last=gain;
  }
  // 다음 해금 힌트: 이 캐스트로 열 수 있는 것 중 가장 가까운 것
  function hint(k){
    const ns=nextStory(k);if(ns&&!storyDone(ns.id))return`다음 스토리: ${CASTS[k].name} ${ns.ch}장 「${ns.title}」`;
    const c=Object.entries(CARD).find(([id,c])=>c.lv&&c.lv[0]===k&&!cardOpen(id));if(c)return`호감도 Lv${c[1].lv[1]}에 카드 「${BYID[c[0]].name}」`;
    const a=Object.entries(ACH).find(([id])=>!d().ach[id]);if(a)return`업적 「${a[1].name}」: ${a[1].cond}`;
    return'';
  }
  return{AFF_LV,ACH,CARD,castOpen,castCond,aff,lv,nextLv,condText,cardOpen,storyOpen,storyDone,nextStory,secondOpen,onMatchEnd,hint,get last(){return last}};
})();

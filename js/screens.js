// 화면들: 시작 · 메인 · 대전 준비 · 보상 · 스토리 · 스토리 장면 · 캐스트(프로필/덱 편집) · 카드 도감 · 설정
// 플레이 화면(#play)은 index.html에 있고, 나머지는 여기서 그린다.

/* ---------- 저장 ---------- */
const SAVE_KEY='31burst.save';
const Save=(()=>{
  let d={};try{d=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch(e){}
  d.duty=d.duty||'haru';d.decks=d.decks||{};d.story=d.story||{};d.manager=d.manager||'';d.speed=d.speed||1;
  const put=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(d))}catch(e){}};
  return{get d(){return d},put,reset(){d={duty:'haru',decks:{},story:{},manager:'',speed:1};put()}};
})();
SPEED=Save.d.speed;

/* ---------- 카드 목록 ---------- */
const BYID={};[...SHARED,...POOL_SHARED,...IRI,...MIKO,...HARU,...MINA,...Object.values(POOL_COLOR).flat()].forEach(c=>{BYID[c.id]=c});
const CAST_KEYS=['iri','miko','haru','mina'];
const OWN_CARDS={iri:IRI,miko:MIKO,haru:HARU,mina:MINA};
// 전용 칸에 넣을 수 있는 카드: 그 캐스트 전용 + 같은 색 카드풀
const ownPool=k=>[...OWN_CARDS[k],...(POOL_COLOR[CAST_COL[k]]||[])];
const sharedPool=()=>[...SHARED,...POOL_SHARED];
// 저장한 덱 (전용 8 + 공용 12 id). 없으면 기본 덱
function deckIds(k){const s=Save.d.decks[k];return s&&s.own&&s.shared?s:{own:OWN_CARDS[k].map(c=>c.id),shared:SHARED.map(c=>c.id)}}
function myDeck(k){const s=Save.d.decks[k];if(!s)return null;return[...s.shared,...s.own].map(id=>BYID[id]).filter(Boolean)}

/* ---------- 스토리 (임시 대사) ---------- */
const STORY=[
  {id:'haru1',k:'haru',title:'마감 후에',sum:'마감을 같이 하자던 하루가 가게 계정 얘기를 꺼낸다.',vs:'miko',
   lines:[['k','매니저님, 오늘 마감 같이 해요.'],['k','할 얘기가 좀 있어서요.'],['c',['무슨 얘기?','커피 한 잔 하면서 들을게']],
     ['k','사장님이 다음 달에 이벤트 하재요. 근데 우리 계정 화제성이… 좀.'],['k','요즘 타임라인은 미코가 꽉 잡고 있거든요. 한 번 붙어볼래요?']]},
  {id:'iri1',k:'iri',title:'셀카는 장비빨',sum:'새 폰을 산 아이리가 준이랑 조회수 내기를 걸었다.',vs:'mina',
   lines:[['k','매니저! 이거 봐, 새 폰. 셀카가 완전 달라.'],['k','근데 준이 자기 덩크 영상이 더 잘 나왔대.'],['c',['그래서?','둘 다 잘 나왔는데']],
     ['k','그래서 내기했지. 누가 더 터지나. 매니저가 판정해 줘.']]},
  {id:'miko1',k:'miko',title:'오늘의 점괘',sum:'미코가 점괘를 보더니 하루를 이겨야 한다고 한다.',vs:'haru',
   lines:[['k','…매니저님, 오늘 점괘가 나왔어요.'],['c',['어떻게 나왔는데?','안 궁금한데']],
     ['k','"따뜻한 사람을 조심하라." …하루 언니요.'],['k','이기면 액땜이 된대요. 같이 해 주실 거죠?']]},
  {id:'mina1',k:'mina',title:'연습 상대',sum:'대회를 앞둔 준이 연습 상대를 찾는다.',vs:'iri',
   lines:[['k','매니저, 시간 돼? 연습 좀 하자.'],['k','다음 주에 지역 대회 있거든. 아이리가 상대 해준대.'],['c',['좋아, 가자','무슨 대회?']],
     ['k','봐주지 말라고 했어. 나도 안 봐줄 거고.']]},
];
const STORY_LOCKED=[{k:'haru',label:'하루 2장',cond:'1장 후'},{k:'haru',label:'Y 두 번째',cond:'3장 후'}];
const WIN_LINE={iri:['역시 매니저! 오늘 조회수 미쳤다.','다음엔 내가 이길 거야. 사진 각 다시 잡는다.'],miko:['…액땜, 됐어요.','괜찮아요. 점괘엔 그렇게 나왔거든요.'],
  haru:['역시 매니저님. 오늘 장사 잘 되겠네요.','괜찮아요. 내일 또 하면 되죠.'],mina:['봤지? 이게 기세야!','한 판 더. 이대로는 못 끝내.']};

/* ---------- 화면 전환 ---------- */
const Screens=(()=>{
  const root=$('screens'),stage=$('stage');let cur='title',ctx={};
  const SCR={};
  function go(name,c){ctx=c||{};cur=name;stage.dataset.screen=name;document.body.dataset.screen=name;
    if(name!=='play'){const fx=$('fx');if(fx)fx.innerHTML='';document.querySelectorAll('.flyc').forEach(e=>e.remove())}
    if(name==='play'){root.innerHTML='';return}
    root.innerHTML=`<section class="scr ${name}" aria-label="${name}">${SCR[name]()}</section>`;
    const s=root.firstElementChild;s.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
    if(SCR[name].bind)SCR[name].bind(s);
    const f=s.querySelector('[autofocus]')||s.querySelector('.btn.y')||s.querySelector('button');f&&f.focus({preventScroll:true});
  }
  function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;stage.appendChild(e);setTimeout(()=>e.remove(),1600)}
  return{go,SCR,toast,get cur(){return cur},get ctx(){return ctx}};
})();
const S=Screens.SCR;
const av=k=>`img/p/${k}_av.webp`;
// 캐스트마다 그림 여백이 달라서 키를 맞춘다 (아이리 스프라이트가 크게 잘려 있음)
const SPR_SCALE={iri:.86,miko:1,haru:1,mina:1};
const spr=(k,x,y,h,st='')=>{const f=SPR_SCALE[k]||1,h2=Math.round(h*f);
  return `<img class="spr" src="img/p/${k}.webp" alt="${CASTS[k].name}" style="left:${Math.round(x+h*(1-f)*.3)}px;top:${Math.round(y+(h-h2)*.55)}px;height:${h2}px;${st}">`};
const sceneBg=(night)=>`<img class="bgi" src="img/p/${night?'bg_night':'bg_day'}.webp" alt="" style="filter:blur(${night?0:1.6}px)">`;
const counter=(props=[],night)=>`<img class="ctrimg" src="img/p/counter.webp" alt="">`+
  props.map(([n,x])=>{const P={cake:[187,106],cups:[123,97],jar:[144,149],tin:[182,109]}[n];return `<img class="spr" src="img/p/prop_${n}.webp" alt="" style="left:${x}px;top:${483-P[1]}px;width:${P[0]}px">`}).join('')+
  `<div class="plate"><i>CAFE</i><b>31</b></div>`+(night?'<div style="position:absolute;left:0;top:495px;width:1280px;height:260px;background:rgba(30,16,70,.5)"></div>':'');
const ICO={
  story:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  cast:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  dex:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="10" height="15" rx="2"/><path d="M15 6l4 1.2-3.2 12.5-3-.8"/></svg>',
  set:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>'};
const landPhone=(title,body,back='home')=>`${sceneBg()}<div class="dimbg" style="backdrop-filter:blur(6px)"></div>
<div class="phn land"><div class="in"><div class="hd"><button class="back" data-go="${back}" aria-label="뒤로">‹</button><span class="t">${title}</span><span style="margin-left:auto;font-size:12px;font-weight:700">CAFE 31</span></div>${body}</div></div>`;

/* 시작 */
S.title=()=>`<img class="bgi" src="img/p/bg_day.webp" alt="" style="filter:blur(6px) saturate(1.1)"><div class="rays"></div><div class="dots"></div>
<div class="fly" style="left:-40px;top:150px;transform:rotate(-14deg)">${cardHTML(BYID.selfie,{size:'m'})}</div>
<div class="fly" style="left:1150px;top:120px;transform:rotate(12deg)">${cardHTML(BYID.scoop,{size:'m'})}</div>
${spr('iri',20,180,560)}${spr('mina',925,250,660)}${spr('miko',290,262,620)}${spr('haru',610,252,620)}
<div class="fade"></div><div class="logo">${LOGO_SVG}</div>
<button class="btn y go" id="tGo">아무 키나 눌러 출근하기</button><span class="ver">v0.3 프로토타입</span>`;
S.title.bind=s=>{const go=()=>Screens.go('home');s.querySelector('#tGo').onclick=go;
  const k=e=>{if(Screens.cur!=='title'){removeEventListener('keydown',k);return}if(e.key==='Tab')return;e.preventDefault();removeEventListener('keydown',k);setTimeout(go,0)};addEventListener('keydown',k)};

/* 메인 */
S.home=()=>{const k=Save.d.duty,c=CASTS[k],st=STORY.find(x=>x.k===k),unread=STORY.filter(x=>!Save.d.story[x.id]).length;
  const named=!!Save.d.manager;
  const dm=st&&!Save.d.story[st.id]?st.lines[0][1]:'오늘도 잘 부탁해요.';
  return `${sceneBg()}${spr(k,200,70,640)}${counter([['cups',40],['cake',560]])}
<div class="phn" style="left:740px;top:30px;width:360px;height:660px"><div class="in">
 <div class="hd"><div><div class="t">CAFE 31</div><div style="font-size:11px;font-weight:700;margin-top:3px">${named?`${Save.d.manager} 매니저`:'신입 매니저'}</div></div>
  <button class="btn" data-go="settings" aria-label="설정" style="margin-left:auto;min-height:34px;width:34px;padding:0;border-width:2px;box-shadow:none">${ICO.set}</button></div>
 <div style="flex:1;padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px">
 ${named?`<button class="dm" id="hDm"><img src="${av(k)}" alt=""><span style="flex:1"><span class="row2" style="justify-content:space-between"><b style="font-size:13px">${c.name}</b>${st&&!Save.d.story[st.id]?`<span class="tg">스토리 1장</span>`:''}</span><span style="display:block;font-size:13px;line-height:1.45;margin-top:3px">${dm}</span></span></button>
  <button class="big" id="hPlay"><span class="lab" style="color:var(--ink2)">오늘의 대전</span><span class="serif">대전</span><span class="row2" style="gap:8px;font-size:12px;font-weight:900"><img src="${av(k)}" alt="" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--ink2)">${jo(c.name,'으로','로')} 출전 · AI / 온라인</span></button>
  <div class="apps"><button class="app" data-go="story"><span>${ICO.story}${unread?`<i>${unread}</i>`:''}</span>스토리</button><button class="app" data-go="cast"><span>${ICO.cast}</span>캐스트</button><button class="app" data-go="dex"><span>${ICO.dex}</span>카드 도감</button></div>
  <div class="duty"><div class="row2" style="justify-content:space-between"><span class="lab">오늘 근무</span><span style="font-size:11px;font-weight:700;color:var(--sub2)">눌러서 교대</span></div>
   <div class="row2" style="gap:12px;margin-top:8px">${CAST_KEYS.map(x=>`<button data-duty="${x}" class="${x===k?'on':''}" aria-label="${CASTS[x].name}"><img src="${av(x)}" alt=""></button>`).join('')}<b style="margin-left:auto;font-size:13px">${c.name}</b></div></div>
  <div class="duty" style="margin-top:auto"><span class="lab">능력</span><div style="font-size:13px;margin-top:3px">${c.abil}</div></div>`
 :`<div class="dm" style="cursor:default"><img src="${av(k)}" alt=""><span style="flex:1"><b style="font-size:13px">${c.name}</b><span style="display:block;font-size:13px;line-height:1.45;margin-top:3px">새로 오신 매니저님이죠? 이름이 뭐예요?</span></span></div>
  <label class="lab" for="hName" style="margin-top:6px">매니저 이름</label>
  <input id="hName" maxlength="10" autocomplete="off" placeholder="이름을 적어 주세요" style="font:inherit;font-size:16px;padding:10px 12px;border:3px solid var(--ink2);border-radius:12px;background:#fff" autofocus>
  <button class="btn y" id="hNameOk">출근 도장 찍기</button>`}
 </div></div></div>`};
S.home.bind=s=>{
  const ok=s.querySelector('#hNameOk');
  if(ok){const inp=s.querySelector('#hName');const f=()=>{const v=inp.value.trim();if(!v){inp.focus();return}Save.d.manager=v;Save.put();Screens.go('home')};ok.onclick=f;inp.onkeydown=e=>{if(e.key==='Enter')f()};return}
  s.querySelector('#hPlay').onclick=()=>Screens.go('match');
  s.querySelector('#hDm').onclick=()=>{const st=STORY.find(x=>x.k===Save.d.duty);Screens.go('story',{sel:st&&st.id})};
  s.querySelectorAll('[data-duty]').forEach(b=>b.onclick=()=>{Save.d.duty=b.dataset.duty;Save.put();Screens.go('home')});
};

/* 대전 준비 */
const MATCH_OPT={mode:'ai',diff:'normal',rounds:5,opp:'rand'};
S.match=()=>{const k=Save.d.duty,c=CASTS[k],o=MATCH_OPT;
  const seg=(key,opts)=>`<div class="seg" data-k="${key}">${opts.map(([v,l])=>`<button data-v="${v}" class="${String(o[key])===String(v)?'on':''}">${l}</button>`).join('')}</div>`;
  const fld=(l,i)=>`<div class="col" style="gap:8px"><span class="lab">${l}</span>${i}</div>`;
  return landPhone('대전',`<div style="flex:1;display:flex;min-height:0">
 <div style="width:360px;position:relative;overflow:hidden;background:#fff3dc;border-right:3px solid var(--ink2)">
  ${spr(k,40,10,640)}
  <div style="position:absolute;left:0;right:0;bottom:0;padding:18px 22px;background:linear-gradient(rgba(255,243,220,0),#fff3dc 35%)">
   <div class="row2" style="justify-content:space-between;align-items:flex-end"><span class="serif" style="font-size:30px">${c.name}</span><span style="font-size:12px;font-weight:900">${c.type}</span></div>
   <div style="font-size:13px;line-height:1.6;margin-top:4px">${c.abil}</div>
   <div class="row2" style="margin-top:10px"><button class="btn" id="mDeck" style="min-height:36px;font-size:13px">덱 20장</button><button class="btn" data-go="cast" style="min-height:36px;font-size:13px">교대</button></div>
  </div></div>
 <div style="flex:1;padding:26px 40px;display:flex;flex-direction:column;gap:20px">
  ${fld('상대',seg('mode',[['ai','AI'],['online','온라인 2인']]))}
  ${fld('AI 난이도',seg('diff',[['easy','쉬움'],['normal','보통'],['hard','어려움']]))}
  ${fld('판 수',seg('rounds',[[1,'단판'],[3,'3판'],[5,'5판']]))}
  ${fld('상대 캐스트',`<div class="row2" id="mOpp"><button class="chip2 ${o.opp==='rand'?'on':''}" data-o="rand">랜덤</button>${CAST_KEYS.filter(x=>x!==k).map(x=>`<button data-o="${x}" aria-label="${CASTS[x].name}" style="width:40px;height:40px;border-radius:50%;padding:0;overflow:hidden;border:${o.opp===x?'3px solid var(--ink2);box-shadow:0 0 0 3px var(--cY)':'2px solid var(--ink2)'};background:none;cursor:pointer"><img src="${av(x)}" alt="" style="width:100%;height:100%;object-fit:cover"></button>`).join('')}</div>`)}
  <div class="row2" style="margin-top:auto;justify-content:flex-end"><button class="btn y" id="mGo" style="min-width:220px;min-height:54px;font-size:18px">시작</button></div>
 </div></div>`)};
S.match.bind=s=>{
  s.querySelectorAll('.seg').forEach(g=>g.onclick=e=>{const b=e.target.closest('button');if(!b)return;const key=g.dataset.k;MATCH_OPT[key]=key==='rounds'?+b.dataset.v:b.dataset.v;
    if(key==='mode'&&b.dataset.v==='online'){MATCH_OPT.mode='ai';return openOnline()}Screens.go('match')});
  s.querySelector('#mOpp').onclick=e=>{const b=e.target.closest('button');if(!b)return;MATCH_OPT.opp=b.dataset.o;Screens.go('match')};
  s.querySelector('#mDeck').onclick=e=>previewDeck(Save.d.duty,e.currentTarget);
  s.querySelector('#mGo').onclick=()=>startMatch();
};
function startMatch(opt={}){const k=Save.d.duty,o={...MATCH_OPT,...opt};G.gid=(G.gid||0)+1;G.over=true;
  let opp=o.opp;if(opp==='rand'||opp===k){const c=CAST_KEYS.filter(x=>x!==k);opp=c[Math.random()*c.length|0]}
  DIFF=o.diff;MATCH=o.rounds;SEAT=[k,opp];Screens.ctx.story=o.story||null;CURRENT={story:o.story||null,opt:o};
  seatSetup();Screens.go('play');showVS(k,opp,o).then(()=>newGame());
}
let CURRENT={story:null,opt:{}};
// 대전 시작 전 VS 화면. 누르거나 아무 키나 누르면 넘어간다
function showVS(me,op,o={}){return new Promise(res=>{
  const st=o.story&&STORY.find(x=>x.id===o.story);
  const n=NET.on&&NET.role!=='host'?G.rounds||MATCH:MATCH,info=st?`스토리 · ${CASTS[st.k].name} 1장`:NET.on?`${n===1?'단판':n+'판'} · 온라인`:`${MATCH===1?'단판':MATCH+'판'} · AI ${{easy:'쉬움',normal:'보통',hard:'어려움'}[DIFF]}`;
  const v=document.createElement('div');v.className='vsov';v.setAttribute('role','dialog');v.setAttribute('aria-label',`${CASTS[me].name} 대 ${CASTS[op].name}`);
  v.innerHTML=`<div class="vsl c${CAST_COL[me]}"></div><div class="vsr c${CAST_COL[op]}"></div><div class="vsline"></div>
   <div class="vsp l">${spr(me,0,0,780)}</div><div class="vsp r">${spr(op,0,0,780)}</div>
   <div class="vsn l"><b>${CASTS[me].name}</b><span>${NET.on?'나':Save.d.manager?Save.d.manager+' 매니저':'나'} · ${CASTS[me].type}</span></div>
   <div class="vsn r"><b>${CASTS[op].name}</b><span>${NET.on?'상대':'AI'} · ${CASTS[op].type}</span></div>
   <div class="vsx">VS</div><div class="vsi">${info}</div>`;
  $('stage').appendChild(v);let done=false;
  const end=()=>{if(done)return;done=true;removeEventListener('keydown',end);v.classList.add('out');setTimeout(()=>{v.remove();res()},350)};
  v.onclick=end;addEventListener('keydown',end);setTimeout(end,2200*Math.max(SPEED,.5));
})}
// 온라인 2인: 방 만들기·코드 참가·캐스트 고르기를 한 화면에서
let OL_CODE='';
function openOnline(){if(!NET.on&&!NET.peer)netMsg('');Screens.go('online')}
function olRefresh(){if(Screens.cur==='online'){const i=document.activeElement&&document.activeElement.id;Screens.go('online');if(i&&$(i))$(i).focus()}}
window.toOnline=()=>{NET.hostCast=null;NET.guestCast=null;if(NET.on)Screens.go('online');else Screens.go('home')};
S.online=()=>{const on=NET.on,host=NET.role==='host',k=Save.d.duty;
  const seg=(key,opts,cur,dis)=>`<div class="seg" data-k="${key}">${opts.map(([v,l])=>`<button data-v="${v}" class="${String(cur)===String(v)?'on':''}" ${dis?'disabled':''}>${l}</button>`).join('')}</div>`;
  const msg=`<div class="olst" id="olSt" role="status">${NET.msg||''}</div>`;
  if(!on){const waiting=host&&NET.code;
    return landPhone('온라인 2인',`<div style="flex:1;display:flex;min-height:0">
 <div style="width:360px;position:relative;overflow:hidden;background:#fff3dc;border-right:3px solid var(--ink2)">${spr(k,40,10,640)}
  <div style="position:absolute;left:0;right:0;bottom:0;padding:18px 22px;background:linear-gradient(rgba(255,243,220,0),#fff3dc 35%)"><span class="lab">친구와 대전</span><div style="font-size:13px;line-height:1.6;margin-top:4px">한 명이 방을 만들고, 다른 한 명이 방 코드 네 자리를 넣으면 연결돼.</div></div></div>
 <div class="olbody">
  <div class="olbox"><span class="lab">방 만들기</span>
   ${waiting?`<div class="olcode serif">${NET.code}</div><div style="font-size:13px;font-weight:700">상대에게 이 숫자를 알려줘. 들어올 때까지 기다리는 중…</div><div class="row2"><button class="btn" id="olCancel">취소</button></div>`
   :`<div class="col" style="gap:8px"><span style="font-size:12px;font-weight:700">판 수</span>${seg('rounds',[[1,'단판'],[3,'3판'],[5,'5판']],MATCH_OPT.rounds)}</div><div class="row2"><button class="btn y" id="olMake" style="min-width:180px">방 만들기</button></div>`}
  </div>
  <div class="olor">또는</div>
  <div class="olbox"><span class="lab">코드로 참가</span>
   <input id="olIn" class="olin serif" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000" aria-label="방 코드 네 자리" value="${OL_CODE}" ${waiting?'disabled':''}>
   <div class="row2"><button class="btn y" id="olGo" style="min-width:180px" ${waiting?'disabled':''}>참가</button></div>
  </div>
  ${msg}
 </div></div>`,'match')}
  const mine=host?NET.hostCast:NET.guestCast,foe=host?NET.guestCast:NET.hostCast;
  const lock=host?!!mine:(!foe||!!mine);
  const sub=host?(!mine?'내 캐스트를 먼저 골라.':!foe?'상대가 고르는 중…':'곧 시작!'):(!foe?'방장이 캐스트를 고르는 중…':!mine?`방장은 ${CASTS[foe].name}. 내 캐스트를 골라.`:'곧 시작!');
  return landPhone('온라인 2인',`<div class="olbody" style="padding:26px 40px">
  <div class="row2" style="justify-content:space-between;align-items:flex-end"><div><span class="lab">연결됨 · ${host?`방장 · ${MATCH_OPT.rounds===1?'단판':MATCH_OPT.rounds+'판'}`:'참가자'}</span><div class="serif" style="font-size:30px;margin-top:2px">${sub}</div></div><button class="btn" id="olLeave">나가기</button></div>
  <div class="olgrid">${CAST_KEYS.map(x=>{const c=CASTS[x],me=x===mine,fo=x===foe;
   return `<button class="olc c${CAST_COL[x]}${me?' mine':''}${fo?' foe':''}" data-k="${x}" ${(lock&&!me)||fo?'disabled':''}>
    <span class="olsp">${spr(x,0,0,420)}</span>${me?'<span class="oltag">나</span>':fo?'<span class="oltag f">상대</span>':''}
    <span class="olnm"><b class="serif">${c.name}</b><small>${c.type}</small></span><span class="olab">${c.abil}</span></button>`}).join('')}</div>
  ${msg}</div>`,'match')};
S.online.bind=s=>{
  const back=s.querySelector('.back');back.addEventListener('click',()=>{netReset();OL_CODE=''});
  const g=s.querySelector('.seg');if(g)g.onclick=e=>{const b=e.target.closest('button');if(!b)return;MATCH_OPT.rounds=+b.dataset.v;Screens.go('online')};
  const mk=s.querySelector('#olMake');if(mk)mk.onclick=()=>{MATCH=MATCH_OPT.rounds;netHost()};
  const cc=s.querySelector('#olCancel');if(cc)cc.onclick=()=>{netReset();Screens.go('online')};
  const inp=s.querySelector('#olIn');if(inp){inp.oninput=()=>{inp.value=inp.value.replace(/\D/g,'').slice(0,4);OL_CODE=inp.value};
    const join=()=>netJoin(inp.value.trim());s.querySelector('#olGo').onclick=join;inp.onkeydown=e=>{if(e.key==='Enter')join()}}
  const lv=s.querySelector('#olLeave');if(lv)lv.onclick=()=>{netReset();Screens.go('online')};
  s.querySelectorAll('.olc').forEach(b=>b.onclick=()=>{const x=b.dataset.k;
    if(NET.role==='host'&&!NET.hostCast&&x!==NET.guestCast){NET.hostCast=x;NET.send({t:'hostcast',k:x});olRefresh();netTryStart()}
    else if(NET.role==='guest'&&NET.hostCast&&!NET.guestCast&&x!==NET.hostCast){NET.guestCast=x;NET.send({t:'cast',k:x});olRefresh()}});
};

/* 판이 다 끝나면: 보상 화면 */
window.afterMatch=async()=>{if(CURRENT.story){Save.d.story[CURRENT.story]=1;Save.put()}const id=G.gid;await sleep(1600);if(id===G.gid&&Screens.cur==='play')Screens.go('reward')};
S.reward=()=>{const[a,b]=[G.score[ME],G.score[AI]];let win=a>b?ME:a<b?AI:G.wins[ME]>G.wins[AI]?ME:G.wins[ME]<G.wins[AI]?AI:null;
  const k=SEAT[ME],o=SEAT[AI],title=win===null?'무승부':win===ME?'승리!':'패배…';
  const hist=G.hist.map((h,i)=>`<div class="row2" style="gap:8px;padding:7px 10px;border-radius:10px;border:2px solid var(--ink2);background:${h.w===null?'#fff':h.w===ME?'var(--cY)':'#fff'}"><b style="width:34px;font-size:12px">${i+1}판</b>${h.w===null?'<span style="flex:1;font-size:13px">무승부</span>':`<img src="${av(SEAT[h.w])}" alt="" style="width:24px;height:24px;border-radius:50%;border:2px solid var(--ink2)"><span style="flex:1;font-size:13px;font-weight:700">${CASTS[SEAT[h.w]].name}</span><b class="serif" style="font-size:18px">+${h.pts}</b>`}${h.busts?`<span style="font-size:11px;font-weight:900;color:var(--cM)">버스트 ×${h.busts}</span>`:''}</div>`).join('');
  const st=CURRENT.story&&STORY.find(x=>x.id===CURRENT.story);
  return landPhone('결과',`<div style="flex:1;display:flex;min-height:0">
 <div style="flex:1;padding:24px 34px;display:flex;flex-direction:column;gap:14px;min-height:0">
  <div><span class="lab">${st?`스토리 · ${CASTS[st.k].name} 1장 · `:''}${G.rounds===1?'단판':G.rounds+'판'} · ${NET.on?'온라인':'AI '+{easy:'쉬움',normal:'보통',hard:'어려움'}[DIFF]} · vs ${CASTS[o].name}</span>
   <div class="row2" style="align-items:baseline;gap:18px;margin-top:2px"><span class="serif" style="font-size:56px;color:${win===ME?'var(--cM)':'var(--ink2)'}">${title}</span><span class="serif" style="font-size:36px">${a} <span style="color:var(--sub2)">:</span> ${b}</span></div></div>
  <span class="lab">판별 기록</span>
  <div class="col" style="gap:6px;overflow-y:auto;min-height:0">${hist}</div>
  <div class="row2" style="margin-top:auto;justify-content:flex-end"><button class="btn" data-go="home">메인으로</button>${st?'':'<button class="btn y" id="rAgain" style="min-width:180px">한 판 더</button>'}</div>
 </div>
 <div style="width:380px;position:relative;overflow:hidden;background:#fff3dc;border-left:3px solid var(--ink2)">
  ${spr(k,30,60,620)}
  <div class="panel" style="position:absolute;left:24px;top:24px;right:24px;padding:12px 14px;border-radius:16px 16px 16px 4px;font-size:14px;font-weight:700">${WIN_LINE[k][win===ME?0:1]}</div>
 </div></div>`)};
S.reward.bind=s=>{const r=s.querySelector('#rAgain');if(r)r.onclick=()=>startMatch(CURRENT.opt)};

/* 스토리 */
S.story=()=>{const sel=STORY.find(x=>x.id===Screens.ctx.sel)||STORY.find(x=>x.k===Save.d.duty)||STORY[0];
  const li=STORY.map(x=>`<button class="${x===sel?'on':''}" data-sel="${x.id}"><img src="${av(x.k)}" alt=""><span class="nm">${CASTS[x.k].name} 1장</span><span class="st ${Save.d.story[x.id]?'':'new'}">${Save.d.story[x.id]?'완료':'NEW'}</span></button>`).join('')
   +STORY_LOCKED.map(x=>`<button disabled><span class="q">?</span><span class="nm">${x.label}</span><span class="st">${x.cond}</span></button>`).join('');
  return landPhone('스토리',`<div style="flex:1;display:flex;min-height:0">
 <div class="side2"><div class="lst">${li}</div></div>
 <div class="grow" style="position:relative;overflow:hidden">
  <img src="img/p/bg_night.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,var(--paper) 40%,rgba(255,248,238,.2))"></div>
  ${spr(sel.k,470,24,600)}
  <div style="position:absolute;left:36px;top:30px;width:380px;display:flex;flex-direction:column;gap:16px">
   <div><span class="lab">${CASTS[sel.k].name} 1장</span><div class="serif" style="font-size:40px;line-height:1.1;margin-top:4px">${sel.title}</div></div>
   <div style="font-size:15px;line-height:1.7">${sel.sum}</div>
   <div class="panel" style="padding:14px;display:flex;flex-direction:column;gap:8px;font-size:14px">
    <div class="row2" style="justify-content:space-between"><span class="lab">대전</span><b>AI 3판 · vs ${CASTS[sel.vs].name}</b></div>
    <div class="row2" style="justify-content:space-between"><span class="lab">내 캐스트</span><b>${CASTS[sel.k].name}</b></div>
   </div>
   <button class="btn y" id="sGo" style="align-self:flex-start;min-width:180px;min-height:54px;font-size:18px">${Save.d.story[sel.id]?'다시 보기':'시작'}</button>
  </div></div></div>`)};
S.story.bind=s=>{s.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>Screens.go('story',{sel:b.dataset.sel}));
  const sel=STORY.find(x=>x.id===Screens.ctx.sel)||STORY.find(x=>x.k===Save.d.duty)||STORY[0];
  s.querySelector('#sGo').onclick=()=>Screens.go('scene',{id:sel.id})};

/* 스토리 장면: 마감 후 가게 + 폰 DM */
S.scene=()=>{const st=STORY.find(x=>x.id===Screens.ctx.id),k=st.k;
  return `${sceneBg(true)}${spr(k,200,70,640)}${counter([['cups',40],['jar',560]],true)}
<div class="phn" style="left:740px;top:30px;width:360px;height:660px"><div class="in">
 <div class="hd"><img src="${av(k)}" alt="" style="width:34px;height:34px;border-radius:50%;border:2px solid var(--ink2)"><div><b style="font-size:14px">${CASTS[k].name}</b><div style="font-size:11px">마감 중</div></div><span style="margin-left:auto;font-size:11px;font-weight:900">${CASTS[k].name} 1장</span></div>
 <div class="msgs" id="scMsgs" aria-live="polite"></div>
 <div class="choices" id="scCh"></div>
</div></div>
<button class="chip2" id="scSkip" style="position:absolute;right:24px;top:24px">건너뛰기</button>`};
S.scene.bind=s=>{const st=STORY.find(x=>x.id===Screens.ctx.id),box=s.querySelector('#scMsgs'),ch=s.querySelector('#scCh');let i=0,done=false;
  const add=(t,me)=>{const b=document.createElement('div');b.className='b'+(me?' me':'');b.textContent=t;box.appendChild(b);box.scrollTop=box.scrollHeight};
  const fin=()=>{if(done)return;done=true;ch.innerHTML='';const b=document.createElement('button');b.className='btn y';b.textContent=`대전 시작 · vs ${CASTS[st.vs].name}`;
    b.onclick=()=>{Save.d.duty=st.k;Save.put();startMatch({mode:'ai',diff:'normal',rounds:3,opp:st.vs,story:st.id})};ch.appendChild(b);b.focus()};
  const step=()=>{if(Screens.cur!=='scene'||done)return;if(i>=st.lines.length)return fin();const[w,t]=st.lines[i++];
    if(w==='c'){ch.innerHTML='';t.forEach(x=>{const b=document.createElement('button');b.className='btn';b.textContent=x;b.onclick=()=>{ch.innerHTML='';add(x,true);setTimeout(step,500)};ch.appendChild(b)});ch.firstChild.focus();return}
    add(t,false);setTimeout(step,700*SPEED)};
  s.querySelector('#scSkip').onclick=fin;setTimeout(step,300)};

/* 캐스트: 프로필 / 덱 편집 */
const CAST_UI={k:null,tab:'prof',sel:null};
S.cast=()=>{const k=CAST_UI.k||Save.d.duty,c=CASTS[k],tab=CAST_UI.tab;CAST_UI.k=k;
  const tabs=['prof','deck'].map(t=>`<button class="chip2 ${t===tab?'on':''}" data-tab="${t}">${t==='prof'?'프로필':'덱 편집'}</button>`).join('');
  const head=`<div class="row2" style="height:56px;flex:none;padding:0 24px;border-bottom:3px solid var(--ink2);background:#fff"><span class="serif" style="font-size:24px">${c.name}</span><span style="font-size:12px;font-weight:900">${c.type}</span><span style="margin-left:auto" class="row2">${tabs}</span></div>`;
  if(tab==='deck')return landPhone('캐스트',`<div class="grow col">${head}${deckEditor(k)}</div>`);
  const li=CAST_KEYS.map(x=>`<button class="${x===k?'on':''}" data-ck="${x}"><img src="${av(x)}" alt=""><span class="nm">${CASTS[x].name}</span><span class="st">${x===Save.d.duty?'근무 중':''}</span></button>`).join('')
   +['M','K','Y','C'].map(x=>`<button disabled><span class="q">?</span><span class="nm" style="font-size:13px">${x} 두 번째</span><span class="st">준비 중</span></button>`).join('');
  return landPhone('캐스트',`<div style="flex:1;display:flex;min-height:0"><div class="side2" style="width:210px"><div class="lst">${li}</div></div>
  <div class="grow col">${head}<div style="flex:1;position:relative;overflow:hidden">
   <div style="position:absolute;left:0;top:0;bottom:0;width:340px;background:#fff3dc;border-right:3px solid var(--ink2)"></div>${spr(k,20,10,640)}
   <div style="position:absolute;left:370px;top:24px;right:30px;display:flex;flex-direction:column;gap:16px">
    <div style="font-size:14px;line-height:1.7"><b>${c.handle}</b><br>${c.style}</div>
    <div class="panel" style="padding:14px 16px"><span class="lab">능력</span><div style="font-size:15px;margin-top:4px">${c.abil}</div></div>
    <div class="panel" style="padding:14px 16px"><span class="lab">덱</span><div style="font-size:14px;margin-top:4px">${Save.d.decks[k]?'직접 짠 덱':'기본 덱'} · 전용 8장 + 공용 12장</div></div>
    <div class="row2" style="margin-top:6px">${k===Save.d.duty?'<span class="chip2 on" style="cursor:default">오늘 근무 중</span>':'<button class="btn" id="cDuty">오늘 근무로</button>'}<button class="btn y" data-tab="deck" style="margin-left:auto">덱 편집</button></div>
   </div></div></div></div>`)};
function deckEditor(k){const d=deckIds(k),sel=CAST_UI.sel;
  const grid=(ids,sec)=>`<div class="cardgrid">${ids.map((id,i)=>`<button class="pk${sel&&sel.sec===sec&&sel.i===i?' sel':''}" data-sec="${sec}" data-i="${i}" title="${BYID[id].name}: ${BYID[id].text}">${cardHTML(BYID[id],{size:'s'})}</button>`).join('')}</div>`;
  const sec=sel?sel.sec:'own',inDeck=new Set([...d.own,...d.shared]);
  const pool=(sec==='own'?ownPool(k):sharedPool()).map(c=>{const has=inDeck.has(c.id),col=COLOR_OF[c.id];
    return `<button data-add="${c.id}" ${has||!sel?'disabled':''} title="${c.text}"><span class="bar" style="background:var(--c${col})"></span><span class="v">${numLabel(c)}</span><span class="n">${c.name}</span><span class="a ${has?'in':''}">${has?'덱에 있음':sel?'바꾸기':''}</span></button>`}).join('');
  return `<div style="flex:1;display:flex;min-height:0">
  <div class="grow" style="padding:14px 20px;display:flex;flex-direction:column;gap:6px;overflow-y:auto">
   <div class="row2" style="justify-content:space-between"><span class="lab">전용 · ${CAST_COL[k]}</span><b style="font-size:12px">8 / 8</b></div>${grid(d.own,'own')}
   <div class="row2" style="justify-content:space-between;margin-top:4px"><span class="lab">공용</span><b style="font-size:12px">12 / 12</b></div>${grid(d.shared,'shared')}
   <div class="row2" style="margin-top:auto;padding-top:8px"><span style="font-size:12px;color:var(--sub2);font-weight:700">${sel?'오른쪽에서 바꿀 카드를 골라':'바꿀 카드를 먼저 눌러'} · 같은 카드는 한 장씩</span><button class="btn" id="dReset" style="margin-left:auto">기본 덱으로</button></div>
  </div>
  <div style="width:270px;padding:14px 16px;border-left:3px solid var(--ink2);background:#fff3dc;display:flex;flex-direction:column;gap:6px;overflow-y:auto">
   <span class="lab">카드풀 · ${sec==='own'?'전용':'공용'}</span><div class="pool">${pool}</div>
  </div></div>`}
S.cast.bind=s=>{const k=CAST_UI.k;
  s.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{CAST_UI.tab=b.dataset.tab;CAST_UI.sel=null;Screens.go('cast')});
  s.querySelectorAll('[data-ck]').forEach(b=>b.onclick=()=>{CAST_UI.k=b.dataset.ck;Screens.go('cast')});
  const du=s.querySelector('#cDuty');if(du)du.onclick=()=>{Save.d.duty=k;Save.put();Screens.toast(`오늘 근무: ${CASTS[k].name}`);Screens.go('cast')};
  s.querySelectorAll('.pk').forEach(b=>b.onclick=()=>{const v={sec:b.dataset.sec,i:+b.dataset.i};const cur=CAST_UI.sel;CAST_UI.sel=cur&&cur.sec===v.sec&&cur.i===v.i?null:v;Screens.go('cast')});
  s.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const sel=CAST_UI.sel;if(!sel)return;const d=deckIds(k);const nd={own:[...d.own],shared:[...d.shared]};
    nd[sel.sec][sel.i]=b.dataset.add;Save.d.decks[k]=nd;Save.put();CAST_UI.sel=null;Screens.toast('덱 저장됨');Screens.go('cast')});
  const r=s.querySelector('#dReset');if(r)r.onclick=()=>{delete Save.d.decks[k];Save.put();CAST_UI.sel=null;Screens.toast('기본 덱으로 돌렸어');Screens.go('cast')};
};

/* 카드 도감 */
const DEX={f:'all',sel:'tiki'};
S.dex=()=>{const all=[...SHARED,...POOL_SHARED,...IRI,...(POOL_COLOR.M||[]),...MIKO,...(POOL_COLOR.K||[]),...HARU,...(POOL_COLOR.Y||[]),...MINA,...(POOL_COLOR.C||[])];
  const list=all.filter(c=>DEX.f==='all'||COLOR_OF[c.id]===DEX.f);const c=BYID[DEX.sel]||list[0],col=COLOR_OF[c.id];
  const inBase=[...SHARED,...IRI,...MIKO,...HARU,...MINA].some(x=>x.id===c.id);
  const own=col==='A'?'공용':CASTS[COLOR_CAST[col]].name+' 전용';
  const chips=[['all','전체'],['M','M'],['K','K'],['Y','Y'],['C','C'],['A','공용']].map(([v,l])=>`<button class="chip2 ${DEX.f===v?'on':''}" data-f="${v}">${l}</button>`).join('');
  return landPhone('카드 도감',`<div style="flex:1;display:flex;min-height:0">
 <div class="grow" style="padding:14px 20px;display:flex;flex-direction:column;gap:12px;min-height:0">
  <div class="row2" style="gap:6px">${chips}<span style="margin-left:auto;font-size:13px;font-weight:700">카드 ${all.length}장</span></div>
  <div class="cardgrid" style="overflow-y:auto;padding:4px 4px 10px;gap:14px 10px">${list.map(x=>`<button class="pk${x.id===c.id?' sel':''}" data-c="${x.id}" title="${x.name}">${cardHTML(x,{size:'s'})}</button>`).join('')}</div>
 </div>
 <div style="width:300px;padding:24px;border-left:3px solid var(--ink2);background:#fff3dc;display:flex;flex-direction:column;align-items:center;gap:10px">
  ${cardHTML(c,{size:'l'})}
  <div class="serif" style="font-size:26px;margin-top:4px">${c.name}</div>
  <div class="row2" style="gap:6px"><span class="chip2" style="cursor:default;background:var(--c${col});${col==='M'||col==='K'?'color:#fff':''}">${col==='A'?'공용':col}</span><span class="chip2" style="cursor:default">${own}</span></div>
  <div style="font-size:14px;line-height:1.6;text-align:center">${c.text}${c.photo?'<br><b>사진 포스트</b>':''}</div>
  <div style="margin-top:auto;font-size:12px;color:var(--sub2);font-weight:700">${inBase?'기본 덱 카드':'카드풀 카드 · 덱 편집에서 넣을 수 있음'}</div>
 </div></div>`)};
S.dex.bind=s=>{s.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{DEX.f=b.dataset.f;Screens.go('dex')});
  s.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{DEX.sel=b.dataset.c;Screens.go('dex')})};

/* 설정 */
S.settings=()=>{const row=(l,c)=>`<div class="row2" style="justify-content:space-between;padding:12px 0;border-bottom:2px dashed rgba(30,26,34,.15)"><b style="font-size:15px">${l}</b>${c}</div>`;
  return `${sceneBg()}<div class="dimbg" style="backdrop-filter:blur(6px)"></div>
<div class="phn land" style="left:240px;top:90px;width:800px;height:540px"><div class="in"><div class="hd"><button class="back" data-go="home" aria-label="뒤로">‹</button><span class="t">설정</span></div>
 <div style="flex:1;display:flex;min-height:0">
  <div style="flex:1;padding:14px 36px;display:flex;flex-direction:column">
   <span class="lab" style="margin-top:6px">게임</span>
   ${row('연출 속도',`<div class="seg" style="width:220px" id="stSpeed"><button data-v="1" class="${SPEED===1?'on':''}">보통</button><button data-v="0.5" class="${SPEED===0.5?'on':''}">빠르게</button></div>`)}
   ${row('게임 설명서','<button class="btn" id="stGuide" style="min-height:36px;font-size:13px">다시 보기</button>')}
   <span class="lab" style="margin-top:18px">매니저</span>
   ${row('이름',`<span class="row2"><input id="stName" maxlength="10" value="${(Save.d.manager||'').replace(/"/g,'&quot;')}" style="font:inherit;width:140px;padding:6px 10px;border:2px solid var(--ink2);border-radius:10px"><button class="btn" id="stNameOk" style="min-height:36px;font-size:13px">저장</button></span>`)}
  </div>
  <div style="flex:1;padding:14px 36px;display:flex;flex-direction:column;border-left:3px solid var(--ink2)">
   <span class="lab" style="margin-top:6px">데이터</span>
   ${row('진행 초기화','<button class="btn" id="stReset" style="min-height:36px;font-size:13px;color:#d0103a">초기화</button>')}
   <div style="margin-top:auto;font-size:12px;color:var(--sub2);font-weight:700">31 버스트 · v0.3 프로토타입</div>
  </div></div></div></div>`};
S.settings.bind=s=>{s.querySelector('#stSpeed').onclick=e=>{const b=e.target.closest('button');if(!b)return;SPEED=+b.dataset.v;Save.d.speed=SPEED;Save.put();Screens.go('settings')};
  s.querySelector('#stGuide').onclick=()=>showGuide();
  s.querySelector('#stNameOk').onclick=()=>{const v=s.querySelector('#stName').value.trim();if(!v)return;Save.d.manager=v;Save.put();Screens.toast('저장됨')};
  s.querySelector('#stReset').onclick=async()=>{const r=await ask('진행 초기화','매니저 이름, 덱, 스토리 진행이 전부 지워져. 되돌릴 수 없어.',[{label:'취소',value:0},{label:'초기화',value:1}]);
    if(r){Save.reset();SPEED=1;Screens.go('title')}}};

/* 플레이 화면 버튼 */
$('playGuide').addEventListener('click',()=>showGuide());
$('playMenu').addEventListener('click',async()=>{const r=await ask('메뉴','대전을 그만두고 메인으로 갈까? 지금 판은 기록되지 않아.',[{label:'계속하기',value:0},{label:'메인으로',value:1}]);
  if(r){G.over=true;G.gid=(G.gid||0)+1;if(NET.on)netReset();$('res').classList.remove('on');Screens.go('home')}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if(document.querySelector('.modal.on,.res.on,.gview.on,#deckView.on,#pick.on'))return;
  if(Screens.cur==='online'){netReset();OL_CODE='';return Screens.go('match')}
  if(['match','story','cast','dex','settings','reward'].includes(Screens.cur))Screens.go('home')});

/* 스테이지를 창 크기에 맞춘다 */
function fitStage(){document.documentElement.style.setProperty('--sc',Math.min(innerWidth/1280,innerHeight/720))}
addEventListener('resize',fitStage);fitStage();
Screens.go('title');

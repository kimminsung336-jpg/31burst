// 화면들: 시작 · 메인 · 대전 준비 · 보상 · 스토리 · 스토리 장면 · 캐스트(프로필/덱 편집) · 카드 도감 · 설정
// 플레이 화면(#play)은 index.html에 있고, 나머지는 여기서 그린다.

/* ---------- 저장 ---------- */
const SAVE_KEY='31burst.save';
const Save=(()=>{
  let d={};try{d=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch(e){}
  d.duty=d.duty||'iri';d.decks=d.decks||{};d.story=d.story||{};d.manager=d.manager||'';d.speed=d.speed||1;
  const put=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(d))}catch(e){}};
  return{get d(){return d},put,reset(){d={duty:'iri',decks:{},story:{},aff:{},ach:{},manager:'',speed:1};put()}};
})();
SPEED=Save.d.speed;

/* ---------- 전체 화면 ---------- */
// 브라우저 주소창·탭을 숨긴다. 폰에서는 지금 든 방향으로 고정. 아이폰 사파리는 지원하지 않아서 홈 화면 추가를 안내
const FS={on:()=>!!(document.fullscreenElement||document.webkitFullscreenElement),
  async enter(){const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;
    if(!rq){if(typeof Screens!=='undefined')Screens.toast('이 브라우저는 전체 화면이 안 돼. 공유 → 홈 화면에 추가로 열어줘');return}
    try{await rq.call(el,{navigationUI:'hide'});try{await screen.orientation.lock(document.body.classList.contains('pt')?'portrait':'landscape')}catch(e){}}catch(e){}},
  exit(){const ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)ex.call(document)},
  toggle(){FS.on()?FS.exit():FS.enter()}};
const TOUCH=matchMedia('(pointer:coarse)').matches;

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

/* ---------- 스토리 데이터는 story.js, 진행·해금은 progress.js ---------- */
// 캐스트 프로필 한마디 (상태 메시지처럼)
const CAST_BIO={iri:['셀카는 찍을 때마다 갱신이지. {N}, 오늘 내 각 어때?','happy'],miko:['…오늘의 점괘, 궁금하세요? 저는 이미 봤어요.','base'],
  haru:['천천히 하셔도 돼요. 마지막 한 칸은 제가 맞춰 드릴게요.','happy'],mina:['기세 올리면 다 된다! {N}, 한 판 뛰자.','happy']};
const WIN_LINE={iri:['역시 {N}! 오늘 조회수 미쳤다.','다음엔 내가 이길 거야. 사진 각 다시 잡는다.'],miko:['…액땜, 됐어요.','괜찮아요. 점괘엔 그렇게 나왔거든요.'],
  haru:['역시 {N} 씨. 오늘 장사 잘 되겠네요.','괜찮아요. 내일 또 하면 되죠.'],mina:['봤지? 이게 기세야!','한 판 더. 이대로는 못 끝내.']};

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
const faceImg=(k,e='base')=>`img/p/face/${k}_${e||'base'}.webp`;
// 표정별 서 있는 그림 (인페인트로 얼굴·팔만 바꿈)
const EXPR=['base','happy','pout','fluster','sad'];
const exImg=(k,e='base')=>`img/p/ex/${k}_${e||'base'}.webp`;
// 대사 속 {N} 을 손님 이름으로
const nm=t=>String(t).replace(/\{N\}/g,Save.d.manager||'손님');
const chLabel=st=>`${CASTS[st.k].name} ${st.ch}장`;
const DIFF_KO={easy:'쉬움',normal:'보통',hard:'어려움',xhard:'매우 어려움'};
// 캐스트마다 그림 여백이 달라서 키를 맞춘다 (아이리 스프라이트가 크게 잘려 있음)
const SPR_SCALE={iri:.86,miko:1,haru:1,mina:1};
const spr=(k,x,y,h,st='',foot=false)=>{const f=SPR_SCALE[k]||1,h2=Math.round(h*f);
  return `<img class="spr" src="img/p/${k}.webp" alt="${CASTS[k].name}" style="left:${Math.round(x+h*(1-f)*.3)}px;top:${Math.round(y+(h-h2)*(foot?1:.55))}px;height:${h2}px;${st}">`};
const sceneBg=(night)=>`<img class="bgi" src="img/p/${night?'bg_night':'bg_day'}.webp" alt="" style="filter:blur(${night?0:1.6}px)">`;
const CTR_SVG=`<svg class="ctrsvg" viewBox="0 0 1280 270" width="1280" height="270" aria-hidden="true"><defs><pattern id="ctrDot" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.6" fill="#c41d68" opacity=".28"/></pattern></defs><rect x="-10" y="34" width="1300" height="250" fill="#ff4f9e" stroke="#1e1a22" stroke-width="4"/><rect x="-10" y="34" width="1300" height="250" fill="url(#ctrDot)"/><rect x="-10" y="34" width="1300" height="12" fill="#c41d68" opacity=".55"/><rect x="26" y="64" width="268" height="148" rx="18" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><rect x="38" y="76" width="244" height="124" rx="12" fill="#ff7ab8" opacity=".35"/><rect x="334" y="64" width="268" height="148" rx="18" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><rect x="346" y="76" width="244" height="124" rx="12" fill="#ff7ab8" opacity=".35"/><rect x="678" y="64" width="268" height="148" rx="18" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><rect x="690" y="76" width="244" height="124" rx="12" fill="#ff7ab8" opacity=".35"/><rect x="986" y="64" width="268" height="148" rx="18" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><rect x="998" y="76" width="244" height="124" rx="12" fill="#ff7ab8" opacity=".35"/><rect x="-10" y="226" width="1300" height="60" fill="#1e1a22"/><rect x="-10" y="226" width="1300" height="6" fill="#ffd23f"/><rect x="-14" y="2" width="1308" height="34" rx="10" fill="#fff4e0" stroke="#1e1a22" stroke-width="4"/><rect x="8" y="9" width="1264" height="6" rx="3" fill="#fff" opacity=".9"/></svg>`;
const counter=(props=[],night)=>CTR_SVG+
  props.map(([n,x])=>{const P={cake:[166,168],cups:[120,106]}[n];return `<img class="spr" src="img/p/prop_${n}.webp" alt="" style="left:${x}px;top:${474-P[1]}px;width:${P[0]}px">`}).join('')+
  (night?'<div style="position:absolute;left:0;top:495px;width:1280px;height:260px;background:rgba(30,16,70,.5)"></div>':'');
const ICO={
  fs:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  fsx:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  story:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  cast:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  dex:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="10" height="15" rx="2"/><path d="M15 6l4 1.2-3.2 12.5-3-.8"/></svg>',
  set:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>'};
const landPhone=(title,body,back='home')=>`${sceneBg()}<div class="dimbg" style="backdrop-filter:blur(6px)"></div>
<div class="phn land"><div class="in"><div class="hd"><button class="back" data-go="${back}" aria-label="뒤로"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button><span class="t">${title}</span></div>${body}</div></div>`;

/* 시작 */
S.title=()=>`<img class="bgi" src="img/p/bg_day.webp" alt="" style="filter:blur(6px) saturate(1.1)"><div class="rays"></div><div class="dots"></div>
<div class="fly" style="left:-40px;top:150px;transform:rotate(-14deg)">${cardHTML(BYID.selfie,{size:'m'})}</div>
<div class="fly" style="left:1150px;top:120px;transform:rotate(12deg)">${cardHTML(BYID.scoop,{size:'m'})}</div>
${spr('iri',20,180,560,'',true)}${spr('mina',925,250,660)}${spr('miko',290,262,620)}${spr('haru',610,252,620)}
<div class="fade"></div><div class="logo">${LOGO_SVG}</div>
<button class="btn y go" id="tGo">${TOUCH?'눌러서 출근하기':'아무 키나 눌러 출근하기'}</button><span class="ver">v0.3 프로토타입</span>`;
S.title.bind=s=>{const go=()=>{SFX.notify();if(TOUCH&&!FS.on())FS.enter();Screens.go('home')};s.querySelector('#tGo').onclick=go;
  const k=e=>{if(Screens.cur!=='title'){removeEventListener('keydown',k);return}if(e.key==='Tab')return;e.preventDefault();removeEventListener('keydown',k);setTimeout(go,0)};addEventListener('keydown',k)};

/* 메인: 왼쪽 위 손님 명패, 가운데 오늘 지명한 캐스트, 오른쪽 메뉴 버튼 */
S.home=()=>{if(!Progress.castOpen(Save.d.duty)){Save.d.duty='iri';Save.put()}const k=Save.d.duty,c=CASTS[k],st=Progress.nextStory(k),named=!!Save.d.manager;
  const unread=STORY.filter(x=>Progress.storyOpen(x)&&!Progress.storyDone(x.id)).length;
  const cards=Object.keys(BYID).filter(id=>Progress.dexCardVisible(id)).length;
  const noGuide=!Save.d.guide;
  const line=noGuide?'처음 오셨죠? 게임 방법은 오른쪽 위 ? 에 있어요. 한 번 보고 가요!':st?nm(st.lines[0][1]):nm(WIN_LINE[k][0]),ex=noGuide?'happy':st?st.lines[0][2]:'happy';
  const scene=`${sceneBg()}${spr(k,250,70,640).replace(`img/p/${k}.webp`,exImg(k,named?ex:'happy'))}${counter([['cups',40],['cake',600]])}`;
  if(!named)return `${scene}<div class="dimbg"></div>
<div class="panel hmname"><div class="row2" style="gap:12px"><img src="${faceImg(k,'happy')}" alt="" class="facei" style="width:52px;height:52px"><div><b style="font-size:15px">${c.name}</b><div style="font-size:14px;margin-top:2px">처음 오셨죠? 이름이 뭐예요?</div></div></div>
 <label class="lab" for="hName">손님 이름</label>
 <input id="hName" maxlength="10" autocomplete="off" placeholder="이름을 적어 주세요" autofocus>
 <button class="btn y" id="hNameOk">입장하기</button></div>`;
  const mb=(go,cls,ico,t,sub,badge='')=>`<button class="hmb ${cls}" data-go="${go}"><span class="ic">${ico}${badge}</span><span class="tx"><b>${t}</b><small>${sub}</small></span><span class="ar">›</span></button>`;
  return `${scene}
<div class="hmplate">
 <div class="row2" style="gap:12px"><img src="${av(k)}" alt="" class="hmav"><div style="min-width:0"><div class="hmnm">${Save.d.manager}</div></div></div>
 <div class="hmduty"><span>오늘 지명</span>${CAST_KEYS.map(x=>Progress.castOpen(x)?`<button data-duty="${x}" class="${x===k?'on':''}" aria-label="${CASTS[x].name}"><img src="${av(x)}" alt=""></button>`:`<button data-lock="${x}" class="lock" aria-label="${CASTS[x].name} 잠김" title="${Progress.castCond(x)}"><img src="${av(x)}" alt=""><svg class="lk" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="3" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="#ffd23f"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></button>`).join('')}</div>
</div>
<div class="hmtop"><button class="hmic" id="hFull" aria-label="전체 화면" title="전체 화면 (F11)">${FS.on()?ICO.fsx:ICO.fs}</button><button class="hmic${noGuide?' new':''}" id="hGuide" aria-label="게임 설명서" title="게임 설명서">?</button><button class="hmic" data-go="settings" aria-label="설정" title="설정">${ICO.set}</button></div>
<button class="hmsay" id="hDm"><img src="${faceImg(k,ex)}" alt="" class="facei"><span><b>${c.name}${noGuide?' <i>설명서</i>':st?` <i>스토리 ${st.ch}장</i>`:''}</b>${line}</span></button>
<div class="hmmenu">
 <button class="hmplay" id="hPlay"><span class="lab">오늘의 대전</span><span class="t">대전</span><span class="s"><img src="${av(k)}" alt="">${jo(c.name,'으로','로')} 포스트!</span></button>
 ${mb('story','pk',ICO.story,'스토리',st?`${chLabel(st)} · ${st.title}`:'전부 클리어',unread?`<i class="bd">${unread}</i>`:'')}
 ${mb('cast','cy',ICO.cast,'캐스트',`${c.name} 호감도 Lv${Progress.lv(k)} · 덱 편집`)}
 ${mb('dex','wh',ICO.dex,'카드 도감',`카드 ${cards} / ${Object.keys(BYID).length}장 공개`)}
</div>`};
S.home.bind=s=>{
  const ok=s.querySelector('#hNameOk');
  if(ok){const inp=s.querySelector('#hName');const f=async()=>{const v=inp.value.trim();if(!v){inp.focus();return}Save.d.manager=v;Save.put();Screens.go('home');
    if(!Save.d.guide&&await ask(`${v} 님, 어서 오세요!`,`${CASTS[Save.d.duty].name}: 31 버스트는 처음이죠? 게임 방법부터 한 번 보고 가요. 1분이면 돼요.`,[{label:'설명서 보기',value:1},{label:'나중에',value:0}]))showGuide()};ok.onclick=f;inp.onkeydown=e=>{if(e.key==='Enter')f()};return}
  s.querySelector('#hPlay').onclick=()=>Screens.go('match');
  s.querySelector('#hGuide').onclick=()=>showGuide();
  s.querySelector('#hFull').onclick=()=>FS.toggle();
  s.querySelector('#hDm').onclick=()=>{if(!Save.d.guide)return showGuide();const st=Progress.nextStory(Save.d.duty);Screens.go('story',{sel:st&&st.id})};
  s.querySelectorAll('[data-duty]').forEach(b=>b.onclick=()=>{Save.d.duty=b.dataset.duty;Save.put();Screens.go('home')});
  s.querySelectorAll('[data-lock]').forEach(b=>b.onclick=()=>Screens.toast(`${CASTS[b.dataset.lock].name}: ${Progress.castCond(b.dataset.lock)}하면 열려요`));
};

/* 대전 준비 */
const MATCH_OPT={mode:'ai',diff:'normal',rounds:5,opp:'rand'};
S.match=()=>{const k=Save.d.duty,c=CASTS[k],o=MATCH_OPT;
  const seg=(key,opts)=>`<div class="seg" data-k="${key}">${opts.map(([v,l])=>`<button data-v="${v}" class="${String(o[key])===String(v)?'on':''}">${l}</button>`).join('')}</div>`;
  const fld=(l,i)=>`<div class="col" style="gap:8px"><span class="lab">${l}</span>${i}</div>`;
  return landPhone('대전',`<div class="lrow" style="flex:1;display:flex;min-height:0">
 <div class="lart" style="width:360px;position:relative;overflow:hidden;background:#fff3dc;border-right:3px solid var(--ink2)">
  ${spr(k,40,10,640)}
  <div style="position:absolute;left:0;right:0;bottom:0;padding:18px 22px;background:linear-gradient(rgba(255,243,220,0),#fff3dc 35%)">
   <div class="row2" style="justify-content:space-between;align-items:flex-end"><span class="serif" style="font-size:30px">${c.name}</span></div>
   <div style="font-size:13px;line-height:1.6;margin-top:4px">${c.abil}</div>
   <div class="row2" style="margin-top:10px"><button class="btn" id="mDeck" style="min-height:36px;font-size:13px">덱 20장</button><button class="btn" data-go="cast" style="min-height:36px;font-size:13px">교대</button></div>
  </div></div>
 <div class="lmain" style="flex:1;padding:26px 40px;display:flex;flex-direction:column;gap:20px">
  ${fld('상대',seg('mode',[['ai','AI'],['online','온라인 2인']]))}
  ${fld('AI 난이도',seg('diff',[['easy','쉬움'],['normal','보통'],['hard','어려움'],['xhard','매우 어려움']]))}
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
function startMatch(opt={}){
  if(!Save.d.guide&&!NET.on)return showGuide(()=>startMatch(opt));   // 처음 대전이면 설명서부터 (닫거나 끝까지 보면 바로 시작)
const k=Save.d.duty,o={...MATCH_OPT,...opt};G.gid=(G.gid||0)+1;G.over=true;
  let opp=o.opp;if(opp==='rand'||opp===k){const c=CAST_KEYS.filter(x=>x!==k);opp=c[Math.random()*c.length|0]}
  DIFF=o.diff;MATCH=o.rounds;SEAT=[k,opp];Screens.ctx.story=o.story||null;CURRENT={story:o.story||null,opt:o};
  seatSetup();Screens.go('play');showVS(k,opp,o).then(()=>newGame());
}
let CURRENT={story:null,opt:{}};
// 대전 시작 전 VS 화면. 누르거나 아무 키나 누르면 넘어간다
function showVS(me,op,o={}){return new Promise(res=>{
  const st=o.story&&STORY.find(x=>x.id===o.story);
  const n=NET.on&&NET.role!=='host'?G.rounds||MATCH:MATCH,info=st?`스토리 · ${chLabel(st)}${st.goal&&st.goal.stake?` · 판돈 ${st.goal.stake}점 이상 저스트`:''}`:NET.on?`${n===1?'단판':n+'판'} · 온라인`:`${MATCH===1?'단판':MATCH+'판'} · AI ${DIFF_KO[DIFF]}`;
  const v=document.createElement('div');v.className='vsov';v.setAttribute('role','dialog');v.setAttribute('aria-label',`${CASTS[me].name} 대 ${CASTS[op].name}`);
  v.innerHTML=`<div class="vsl c${CAST_COL[me]}"></div><div class="vsr c${CAST_COL[op]}"></div><div class="vsline"></div>
   <div class="vsp l">${spr(me,0,0,780)}</div><div class="vsp r">${spr(op,0,0,780)}</div>
   <div class="vsn l"><b>${CASTS[me].name}</b><span>${NET.on?'나':Save.d.manager?Save.d.manager+' 님':'나'}</span></div>
   <div class="vsn r"><b>${CASTS[op].name}</b><span>${NET.on?'상대':'AI'}</span></div>
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
    return landPhone('온라인 2인',`<div class="lrow" style="flex:1;display:flex;min-height:0">
 <div class="lart" style="width:360px;position:relative;overflow:hidden;background:#fff3dc;border-right:3px solid var(--ink2)">${spr(k,40,10,640)}
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
   const shut=!Progress.castOpen(x)&&!me&&!fo;
   return `<button class="olc c${CAST_COL[x]}${me?' mine':''}${fo?' foe':''}" data-k="${x}" ${(lock&&!me)||fo||shut?'disabled':''}>
    <span class="olsp">${spr(x,0,0,420)}</span>${me?'<span class="oltag">나</span>':fo?'<span class="oltag f">상대</span>':shut?'<span class="oltag">잠김</span>':''}
    <span class="olnm"><b class="serif">${c.name}</b></span><span class="olab">${c.abil}</span></button>`}).join('')}</div>
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

/* 판이 다 끝나면: 진행 반영 → 보상 화면 */
// 대전 결과(내 쪽이 0번 자리)를 진행에 반영한다. AI 대전과 온라인 둘 다 여기서
function matchWinner(){const[a,b]=G.score;return a>b?ME:a<b?AI:G.wins[ME]>G.wins[AI]?ME:G.wins[ME]<G.wins[AI]?AI:null}
window.recordMatch=()=>{const g=Progress.onMatchEnd({k:SEAT[ME],won:matchWinner()===ME,hist:G.hist,diff:DIFF,online:NET.on,story:NET.on?null:CURRENT.story});
  if(NET.on&&g.new.length)Screens.toast('새로 열림: '+g.new.join(', '));return g};
window.afterMatch=async()=>{const id=G.gid;await sleep(1600);if(id===G.gid&&Screens.cur==='play')Screens.go('reward')};
S.reward=()=>{const[a,b]=[G.score[ME],G.score[AI]],win=matchWinner();
  const k=SEAT[ME],o=SEAT[AI],title=win===null?'무승부':win===ME?'승리!':'패배…',g=Progress.last||{aff:0,new:[],ach:[]};
  const hist=G.hist.map((h,i)=>`<div class="row2" style="gap:8px;padding:6px 10px;border-radius:10px;border:2px solid var(--ink2);background:${h.w===null?'#fff':h.w===ME?'var(--cY)':'#fff'}"><b style="width:34px;font-size:12px">${i+1}판</b>${h.w===null?'<span style="flex:1;font-size:13px">무승부</span>':`<img src="${av(SEAT[h.w])}" alt="" style="width:24px;height:24px;border-radius:50%;border:2px solid var(--ink2)"><span style="flex:1;font-size:13px;font-weight:700">${CASTS[SEAT[h.w]].name}</span><b class="serif" style="font-size:18px">+${h.pts}</b>`}${h.busts?`<span style="font-size:11px;font-weight:900;color:var(--cM)">버스트 ×${h.busts}</span>`:''}</div>`).join('');
  const st=CURRENT.story&&STORY.find(x=>x.id===CURRENT.story);
  const[line0,ex]=st?(g.clear?st.win:st.lose):[WIN_LINE[k][win===ME?0:1],win===ME?'happy':'pout'];const line=nm(line0);
  const affMax=Progress.AFF_LV[Progress.AFF_LV.length-1],next=g.affNext,prev=Progress.AFF_LV[(g.lv||1)-1];
  const pct=next?Math.round(100*(g.affNow-prev)/(next-prev)):100;
  const hint=Progress.hint(k);
  return landPhone('결과',`<div class="lrow rwrow" style="flex:1;display:flex;min-height:0">
 <div class="lmain" style="flex:1;padding:22px 32px;display:flex;flex-direction:column;gap:12px;min-height:0">
  <div><span class="lab">${st?`스토리 · ${chLabel(st)} · `:''}${G.rounds===1?'단판':G.rounds+'판'} · ${'AI '+DIFF_KO[DIFF]} · vs ${CASTS[o].name}</span>
   <div class="row2" style="align-items:baseline;gap:18px;margin-top:2px"><span class="serif" style="font-size:52px;color:${win===ME?'var(--cM)':'var(--ink2)'}">${title}</span><span class="serif" style="font-size:34px">${a} <span style="color:var(--sub2)">:</span> ${b}</span>
   ${st?`<span class="chip2 ${g.clear?'on':''}" style="cursor:default;margin-left:auto">${g.clear?'스토리 클리어':g.goalMiss?`조건 실패 · 판돈 ${st.goal.stake}점 이상 저스트`:'다시 도전'}</span>`:''}</div></div>
  <div class="row2 rwmid" style="gap:14px;align-items:stretch">
   <div class="col" style="flex:1;gap:6px;min-width:0"><span class="lab">판별 기록</span>${hist}</div>
   <div class="panel rwd" style="width:300px;padding:14px 16px;display:flex;flex-direction:column;gap:10px">
    <span class="lab">보상</span>
    <div><div class="row2" style="justify-content:space-between;font-size:13px;font-weight:900"><span>${CASTS[k].name} 호감도 Lv${g.lv||Progress.lv(k)}</span><span style="color:var(--cM)">${g.aff?`+${g.aff}`:'+0'}</span></div>
     <div class="affbar"><i style="width:${pct}%"></i></div><div style="font-size:11px;color:var(--sub2);font-weight:700;margin-top:3px">${next?`다음 레벨까지 ${next-g.affNow}`:'최고 레벨'}</div></div>
    ${g.new.length?`<div class="col" style="gap:4px"><span class="lab" style="color:var(--cM)">새로 열림</span>${g.new.map(x=>`<div class="newx">${x}</div>`).join('')}</div>`:''}
    ${g.ach.length?`<div style="font-size:12px;font-weight:900">업적: ${g.ach.map(x=>Progress.ACH[x].name).join(', ')}</div>`:''}
    ${hint?`<div style="margin-top:auto;font-size:12px;color:var(--sub2);font-weight:700">${hint}</div>`:''}
   </div>
  </div>
  <div class="row2" style="margin-top:auto;justify-content:flex-end"><button class="btn" data-go="home">메인으로</button>${st?`<button class="btn y" id="rStory" style="min-width:180px">${g.clear?'스토리로':'다시 도전'}</button>`:'<button class="btn y" id="rAgain" style="min-width:180px">한 판 더</button>'}</div>
 </div>
 <div class="lart rwart" style="width:340px;position:relative;overflow:hidden;background:#fff3dc;border-left:3px solid var(--ink2)">
  ${spr(k,10,90,600,'',false)}
  <div class="panel row2" style="position:absolute;left:18px;top:20px;right:18px;padding:10px 12px;gap:10px;align-items:flex-start;border-radius:16px 16px 16px 4px"><img src="${faceImg(k,ex)}" alt="" class="facei"><span style="font-size:14px;font-weight:700;line-height:1.5">${line}</span></div>
 </div></div>`)};
S.reward.bind=s=>{const r=s.querySelector('#rAgain');if(r)r.onclick=()=>startMatch(CURRENT.opt);
  const st=CURRENT.story&&STORY.find(x=>x.id===CURRENT.story),rs=s.querySelector('#rStory');
  if(rs)rs.onclick=()=>Progress.last&&Progress.last.clear?Screens.go('story',{sel:(Progress.nextStory(st.k)||st).id}):storyMatch(st)};

/* 스토리 */
function storyMatch(st){Save.d.duty=st.k;Save.put();startMatch({mode:'ai',diff:st.diff||'normal',rounds:st.rounds||3,opp:st.vs,story:st.id})}
S.story=()=>{const pick=Screens.ctx.sel&&STORY.find(x=>x.id===Screens.ctx.sel);
  const sel=pick&&Progress.storyOpen(pick)?pick:Progress.nextStory(Save.d.duty)||STORY.find(x=>x.k===Save.d.duty);
  const li=CAST_KEYS.map(k=>`<div class="lab" style="margin:10px 4px 4px">${CASTS[k].name}${Progress.castOpen(k)?'':` · ${Progress.castCond(k)}하면 열림`}</div>`+STORY.filter(x=>x.k===k).map(x=>{const open=Progress.storyOpen(x),done=Progress.storyDone(x.id);
    return open?`<button class="${x===sel?'on':''}" data-sel="${x.id}"><img src="${av(x.k)}" alt=""><span class="nm">${x.ch}장 ${x.title}</span><span class="st ${done?'':'new'}">${done?'완료':'NEW'}</span></button>`
      :`<button disabled><span class="q">?</span><span class="nm">${x.ch}장</span><span class="st">${Progress.castOpen(x.k)?`${x.ch-1}장 후`:'잠김'}</span></button>`}).join('')).join('');
  const goal=sel.goal&&sel.goal.stake?`승리 + 판돈 ${sel.goal.stake}점 이상으로 저스트`:'승리';
  return landPhone('스토리',`<div class="lrow strow" style="flex:1;display:flex;min-height:0">
 <div class="side2"><div class="lst">${li}</div></div>
 <div class="grow stmain" style="position:relative;overflow:hidden">
  <img src="img/p/bg_night.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,var(--paper) 40%,rgba(255,248,238,.2))"></div>
  ${spr(sel.k,470,24,600)}
  <div class="stinfo" style="position:absolute;left:36px;top:30px;width:380px;display:flex;flex-direction:column;gap:16px">
   <div><span class="lab">${chLabel(sel)}</span><div class="serif" style="font-size:40px;line-height:1.1;margin-top:4px">${sel.title}</div></div>
   <div style="font-size:15px;line-height:1.7">${sel.sum}</div>
   <div class="panel" style="padding:14px;display:flex;flex-direction:column;gap:8px;font-size:14px">
    <div class="row2" style="justify-content:space-between"><span class="lab">대전</span><b>AI ${DIFF_KO[sel.diff||'normal']} ${sel.rounds||3}판 · vs ${CASTS[sel.vs].name}</b></div>
    <div class="row2" style="justify-content:space-between"><span class="lab">클리어</span><b>${goal}</b></div>
    <div class="row2" style="justify-content:space-between"><span class="lab">내 캐스트</span><b>${CASTS[sel.k].name}</b></div>
   </div>
   <button class="btn y" id="sGo" style="align-self:flex-start;min-width:180px;min-height:54px;font-size:18px">${Progress.storyDone(sel.id)?'다시 보기':'시작'}</button>
  </div></div></div>`)};
S.story.bind=s=>{s.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>Screens.go('story',{sel:b.dataset.sel}));
  const on=s.querySelector('.lst button.on');if(on)on.scrollIntoView({block:'nearest'});
  s.querySelector('#sGo').onclick=()=>{const b=s.querySelector('.lst button.on');Screens.go('scene',{id:b?b.dataset.sel:STORY[0].id})}};

/* 스토리 장면: 마감 후 가게에서 마주 보고 하는 대화. 대사마다 표정·자세가 바뀐다 */
S.scene=()=>{const st=STORY.find(x=>x.id===Screens.ctx.id),k=st.k;
  return `${sceneBg(true)}<div id="scSpr" class="scspr">${spr(k,330,40,700).replace(`img/p/${k}.webp`,exImg(k,'base'))}</div>${counter([['cups',70],['cake',1020]],true)}
<div class="vnch" id="scCh"></div>
<div class="vnbox c${CAST_COL[k]}" id="scBox" role="button" tabindex="0" aria-live="polite"><span class="vnnm" id="scNm">${CASTS[k].name}</span><p id="scTx"></p><i class="vnnx" id="scNx">▼</i></div>
<div class="vntop"><span class="chip2" style="cursor:default">${chLabel(st)} · ${st.title}</span><button class="chip2" id="scSkip">건너뛰기</button></div>`};
S.scene.bind=s=>{const st=STORY.find(x=>x.id===Screens.ctx.id),k=st.k,ch=s.querySelector('#scCh'),sp=s.querySelector('#scSpr'),box=s.querySelector('#scBox'),tx=s.querySelector('#scTx'),nmEl=s.querySelector('#scNm'),nx=s.querySelector('#scNx');
  let i=0,done=false,typing=null,full='',wait=false;
  const si=sp.querySelector('img');EXPR.forEach(e=>{const im=new Image();im.src=exImg(k,e)});   // 표정 그림 미리 불러오기
  const react=e=>{e=e||'base';sp.dataset.e=e;si.src=exImg(k,e);sp.classList.remove('go');void sp.offsetWidth;sp.classList.add('go')};
  const say=(who,t,me,post)=>{nmEl.textContent=who;box.classList.toggle('me',!!me);box.classList.toggle('snsp',!!post);box.dataset.pc=post?CAST_COL[post]:'';full=t;tx.textContent='';nx.hidden=true;let n=0;clearInterval(typing);
    typing=setInterval(()=>{n+=1;tx.textContent=t.slice(0,n);if(n>=t.length){clearInterval(typing);typing=null;nx.hidden=false}},Math.max(8,28*SPEED))};
  const fin=()=>{if(done)return;done=true;clearInterval(typing);ch.innerHTML='';wait=true;
    const o=CASTS[st.vs].name,FIN={iri:`가자! 상대는 ${o}.`,miko:`…시작할게요. 상대는 ${o} 씨.`,haru:`그럼, 시작해 볼까요? 상대는 ${o}.`,mina:`간다! 상대는 ${o}!`};
    say(CASTS[k].name,FIN[k]||`상대는 ${o}.`);
    const b=document.createElement('button');b.className='btn y';b.style.minWidth='240px';b.textContent=`대전 시작 · vs ${CASTS[st.vs].name}`;b.onclick=()=>storyMatch(st);ch.appendChild(b);b.focus()};
  const step=()=>{if(Screens.cur!=='scene'||done||wait)return;
    if(typing){clearInterval(typing);typing=null;tx.textContent=full;nx.hidden=false;return}   // 글자 나오는 중이면 한 번에 다 보여준다
    if(i>=st.lines.length)return fin();const[w,t,e]=st.lines[i++];
    if(w==='c'){wait=true;nx.hidden=true;ch.innerHTML='';t.forEach(x=>{const b=document.createElement('button');b.className='btn';b.textContent=nm(x);
      b.onclick=()=>{ch.innerHTML='';wait=false;say(Save.d.manager||'손님',nm(x),true)};ch.appendChild(b)});ch.firstChild.focus();return}
    if(w==='p'){say(CASTS[e].handle,nm(t),false,e);return}   // SNS 글: 쓴 캐스트 계정으로 보여 준다
    react(e);say(CASTS[k].name,nm(t))};
  box.onclick=step;box.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();step()}};
  const key=e=>{if(Screens.cur!=='scene'){removeEventListener('keydown',key);return}if((e.key===' '||e.key==='Enter')&&document.activeElement===document.body){e.preventDefault();step()}};
  addEventListener('keydown',key);
  s.querySelector('#scSkip').onclick=fin;setTimeout(()=>{step();box.focus({preventScroll:true})},300)};

/* 캐스트: 프로필 / 덱 편집 */
const CAST_UI={k:null,tab:'prof',sel:null};
S.cast=()=>{const k=CAST_UI.k||Save.d.duty,c=CASTS[k];if(!Progress.castOpen(k))CAST_UI.tab='prof';const tab=CAST_UI.tab;CAST_UI.k=k;
  const tabs=['prof','deck'].map(t=>`<button class="chip2 ${t===tab?'on':''}" data-tab="${t}">${t==='prof'?'프로필':'덱 편집'}</button>`).join('');
  const head=`<div class="row2" style="height:56px;flex:none;padding:0 24px;border-bottom:3px solid var(--ink2);background:#fff"><span class="serif" style="font-size:24px">${c.name}</span><span style="margin-left:auto" class="row2">${Progress.castOpen(k)?tabs:''}</span></div>`;
  if(tab==='deck')return landPhone('캐스트',`<div class="grow col">${head}${deckEditor(k)}</div>`);
  const li=CAST_KEYS.map(x=>`<button class="${x===k?'on':''}${Progress.castOpen(x)?'':' lock'}" data-ck="${x}"><img src="${av(x)}" alt=""><span class="nm">${CASTS[x].name}</span><span class="st">${!Progress.castOpen(x)?'잠김':x===Save.d.duty?'지명 중':''}</span></button>`).join('')
   +'<div class="lab" style="margin:12px 4px 4px">동료 캐스트</div>'+CAST_KEYS.map(x=>Progress.secondOpen(x)?`<button disabled><span class="q" style="border-style:solid;color:var(--ink2)">!</span><span class="nm" style="font-size:13px">새 캐스트</span><span class="st">합류 예정</span></button>`:`<button disabled><span class="q">?</span><span class="nm" style="font-size:13px">???</span><span class="st">${CASTS[x].name} 3장 후</span></button>`).join('');
  return landPhone('캐스트',`<div class="lrow carow" style="flex:1;display:flex;min-height:0"><div class="side2" style="width:210px"><div class="lst">${li}</div></div>
  <div class="grow col">${head}<div style="flex:1;position:relative;overflow:hidden">
   <div class="caback" style="position:absolute;left:0;top:0;bottom:0;width:340px;background:#fff3dc;border-right:3px solid var(--ink2)"></div><span class="caspr">${spr(k,20,10,640)}</span>
   <div class="cainfo" style="position:absolute;left:370px;top:24px;right:30px;display:flex;flex-direction:column;gap:16px">
    <div class="cbio"><b>${c.handle}</b><div class="row2" style="gap:10px;align-items:flex-start;margin-top:8px"><img src="${faceImg(k,CAST_BIO[k][1])}" alt="" class="facei" style="width:44px;height:44px"><p>${nm(CAST_BIO[k][0])}</p></div></div>
    <div class="panel" style="padding:14px 16px"><div class="row2" style="justify-content:space-between"><span class="lab">호감도</span><b style="font-size:14px">Lv${Progress.lv(k)}</b></div>${(()=>{const L=Progress.AFF_LV,l=Progress.lv(k),n=L[l],p=L[l-1],a=Progress.aff(k);return `<div class="affbar"><i style="width:${n?Math.round(100*(a-p)/(n-p)):100}%"></i></div><div style="font-size:12px;color:var(--sub2);font-weight:700;margin-top:4px">${n?`다음 레벨까지 ${n-a} · 이 캐스트로 이기면 +1, 스토리를 깨면 +2`:'최고 레벨'}</div>`})()}</div>
    <div class="panel" style="padding:14px 16px"><span class="lab">능력</span><div style="font-size:15px;margin-top:4px">${c.abil}</div></div>
    <div class="panel" style="padding:14px 16px"><span class="lab">덱</span><div style="font-size:14px;margin-top:4px">${Save.d.decks[k]?'직접 짠 덱':'기본 덱'} · 전용 8장 + 공용 12장</div></div>
    <div class="row2" style="margin-top:6px">${!Progress.castOpen(k)?`<span class="chip2" style="cursor:default">잠김 · ${Progress.castCond(k)}</span>`:k===Save.d.duty?'<span class="chip2 on" style="cursor:default">오늘 지명 중</span>':'<button class="btn" id="cDuty">오늘 지명하기</button>'}${Progress.castOpen(k)?'<button class="btn y" data-tab="deck" style="margin-left:auto">덱 편집</button>':''}</div>
   </div></div></div></div>`)};
function deckEditor(k){const d=deckIds(k),sel=CAST_UI.sel;
  const grid=(ids,sec)=>`<div class="cardgrid">${ids.map((id,i)=>`<button class="pk${sel&&sel.sec===sec&&sel.i===i?' sel':''}" data-sec="${sec}" data-i="${i}" title="${BYID[id].name}: ${BYID[id].text}">${cardHTML(BYID[id],{size:'s'})}</button>`).join('')}</div>`;
  const sec=sel?sel.sec:'own',inDeck=new Set([...d.own,...d.shared]);
  const pool=(sec==='own'?ownPool(k):sharedPool()).map(c=>{const has=inDeck.has(c.id),col=COLOR_OF[c.id],open=Progress.cardOpen(c.id);
    if(!open)return `<button disabled title="${Progress.condText(c.id)}" class="lock"><span class="bar" style="background:var(--sub2)"></span><span class="v">?</span><span class="n">${c.name}</span><span class="a">${Progress.condText(c.id)}</span></button>`;
    return `<button data-add="${c.id}" ${has||!sel?'disabled':''} title="${c.text}"><span class="bar" style="background:var(--c${col})"></span><span class="v">${numLabel(c)}</span><span class="n">${c.name}</span><span class="a ${has?'in':''}">${has?'덱에 있음':sel?'바꾸기':''}</span></button>`}).join('');
  return `<div class="lrow" style="flex:1;display:flex;min-height:0">
  <div class="grow" style="padding:14px 20px;display:flex;flex-direction:column;gap:6px;overflow-y:auto">
   <div class="row2" style="justify-content:space-between"><span class="lab">전용</span><b style="font-size:12px">8 / 8</b></div>${grid(d.own,'own')}
   <div class="row2" style="justify-content:space-between;margin-top:4px"><span class="lab">공용</span><b style="font-size:12px">12 / 12</b></div>${grid(d.shared,'shared')}
   <div class="row2" style="margin-top:auto;padding-top:8px"><span style="font-size:12px;color:var(--sub2);font-weight:700">${sel?'오른쪽에서 바꿀 카드를 골라':'바꿀 카드를 먼저 눌러'} · 같은 카드는 한 장씩</span><button class="btn" id="dReset" style="margin-left:auto">기본 덱으로</button></div>
  </div>
  <div class="lsid" style="width:270px;padding:14px 16px;border-left:3px solid var(--ink2);background:#fff3dc;display:flex;flex-direction:column;gap:6px;overflow-y:auto">
   <span class="lab">카드풀 · ${sec==='own'?'전용':'공용'}</span><div class="pool">${pool}</div>
  </div></div>`}
S.cast.bind=s=>{const k=CAST_UI.k;
  s.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{CAST_UI.tab=b.dataset.tab;CAST_UI.sel=null;Screens.go('cast')});
  s.querySelectorAll('[data-ck]').forEach(b=>b.onclick=()=>{CAST_UI.k=b.dataset.ck;Screens.go('cast')});
  const du=s.querySelector('#cDuty');if(du)du.onclick=()=>{Save.d.duty=k;Save.put();Screens.toast(`오늘 지명: ${CASTS[k].name}`);Screens.go('cast')};
  s.querySelectorAll('.pk').forEach(b=>b.onclick=()=>{const v={sec:b.dataset.sec,i:+b.dataset.i};const cur=CAST_UI.sel;CAST_UI.sel=cur&&cur.sec===v.sec&&cur.i===v.i?null:v;Screens.go('cast')});
  s.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const sel=CAST_UI.sel;if(!sel)return;const d=deckIds(k);const nd={own:[...d.own],shared:[...d.shared]};
    nd[sel.sec][sel.i]=b.dataset.add;Save.d.decks[k]=nd;Save.put();CAST_UI.sel=null;Screens.toast('덱 저장됨');Screens.go('cast')});
  const r=s.querySelector('#dReset');if(r)r.onclick=()=>{delete Save.d.decks[k];Save.put();CAST_UI.sel=null;Screens.toast('기본 덱으로 돌렸어');Screens.go('cast')};
};

/* 카드 도감 */
const DEX={f:'all',sel:'tiki'};
S.dex=()=>{const all=[...SHARED,...POOL_SHARED,...IRI,...(POOL_COLOR.M||[]),...MIKO,...(POOL_COLOR.K||[]),...HARU,...(POOL_COLOR.Y||[]),...MINA,...(POOL_COLOR.C||[])];
  const list=all.filter(c=>DEX.f==='all'||COLOR_OF[c.id]===DEX.f);const c=list.find(x=>x.id===DEX.sel)||list[0],col=COLOR_OF[c.id];
  const inBase=[...SHARED,...IRI,...MIKO,...HARU,...MINA].some(x=>x.id===c.id);
  const own=col==='A'?'공용':CASTS[COLOR_CAST[col]].name+' 전용',openC=Progress.dexCardVisible(c.id),backC=Progress.dexCardBack(c.id),owner=COLOR_CAST[col];
  const useLocked=owner&&!Progress.castOpen(owner),cardLocked=!Progress.cardOpen(c.id);
  const useCond=[useLocked?Progress.castCond(owner):'',cardLocked?Progress.condText(c.id):''].filter(Boolean).join(' · ');
  const chips=[['all','전체'],...CAST_KEYS.map(k=>[CAST_COL[k],CASTS[k].name]),['A','공용']].map(([v,l])=>`<button class="chip2 ${DEX.f===v?'on':''}" data-f="${v}">${l}</button>`).join('');
  return landPhone('카드 도감',`<div class="lrow dxrow" style="flex:1;display:flex;min-height:0">
 <div class="grow" style="padding:14px 20px;display:flex;flex-direction:column;gap:12px;min-height:0">
  <div class="row2" style="gap:6px">${chips}<span style="margin-left:auto;font-size:13px;font-weight:700">카드 ${all.filter(x=>Progress.dexCardVisible(x.id)).length} / ${all.length}장</span></div>
  <div class="cardgrid" style="overflow-y:auto;padding:4px 4px 10px;gap:14px 10px">${list.map(x=>`<button class="pk${x.id===c.id?' sel':''}" data-c="${x.id}" title="${Progress.dexCardVisible(x.id)?x.name:Progress.dexCardBack(x.id)?'미발견 전용 카드':'잠김'}">${cardHTML(x,{size:'s',back:Progress.dexCardBack(x.id),locked:!Progress.dexCardVisible(x.id),cond:Progress.condText(x.id)})}</button>`).join('')}</div>
 </div>
 <div class="lsid dxsid" style="width:300px;padding:24px;border-left:3px solid var(--ink2);background:#fff3dc;display:flex;flex-direction:column;align-items:center;gap:10px">
  ${cardHTML(c,{size:'l',back:backC,locked:!openC,cond:Progress.condText(c.id)})}
  <div class="serif" style="font-size:26px;margin-top:4px">${openC?c.name:backC?'미발견':'???'}</div>
  <div class="row2" style="gap:6px"><span class="chip2" style="cursor:default;background:var(--c${col});${col==='M'||col==='K'?'color:#fff':''}">${own}</span></div>
  <div style="font-size:14px;line-height:1.6;text-align:center">${openC?`${c.text}${c.photo?'<br><b>사진 포스트</b>':''}`:backC?'대전에서 상대가 이 카드를 내면 공개돼요.':`<b>해금 조건</b><br>${Progress.condText(c.id)}`}</div>
  <div style="margin-top:auto;font-size:12px;color:var(--sub2);font-weight:700">${backC?'':openC&&useCond?`편성 해금 · ${useCond}`:inBase?'기본 덱 카드':'카드풀 카드 · 덱 편집에서 넣을 수 있음'}</div>
 </div></div>`)};
S.dex.bind=s=>{const g=s.querySelector('.cardgrid');
  if(DEX.top){g.scrollTop=DEX.top;DEX.top=0}   // 카드를 눌러 다시 그려도 보던 자리 그대로
  s.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{DEX.f=b.dataset.f;Screens.go('dex')});
  s.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{DEX.sel=b.dataset.c;DEX.top=g.scrollTop;Screens.go('dex')})};

/* 설정 */
S.settings=()=>{const row=(l,c)=>`<div class="row2" style="justify-content:space-between;padding:12px 0;border-bottom:2px dashed rgba(30,26,34,.15)"><b style="font-size:15px">${l}</b>${c}</div>`;
  return `${sceneBg()}<div class="dimbg" style="backdrop-filter:blur(6px)"></div>
<div class="phn land stg" style="left:240px;top:90px;width:800px;height:540px"><div class="in"><div class="hd"><button class="back" data-go="home" aria-label="뒤로"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button><span class="t">설정</span></div>
 <div class="lrow" style="flex:1;display:flex;min-height:0">
  <div style="flex:1;padding:14px 36px;display:flex;flex-direction:column">
   <span class="lab" style="margin-top:6px">게임</span>
   ${row('전체 화면',`<button class="btn" id="stFull" style="min-height:36px;font-size:13px">${FS.on()?'끄기':'켜기'}</button>`)}
   ${row('연출 속도',`<div class="seg" style="width:220px" id="stSpeed"><button data-v="1" class="${SPEED===1?'on':''}">보통</button><button data-v="0.5" class="${SPEED===0.5?'on':''}">빠르게</button></div>`)}
   ${row('효과음',`<span class="row2"><input id="stVol" type="range" min="0" max="1" step=".05" value="${Save.d.vol!=null?Save.d.vol:.6}" aria-label="효과음 크기" style="width:120px;accent-color:var(--cM)"><button class="chip2${Save.d.sound?' on':''}" id="stMute">${Save.d.sound?'켜짐':'꺼짐'}</button></span>`)}
   ${row('게임 설명서','<button class="btn" id="stGuide" style="min-height:36px;font-size:13px">다시 보기</button>')}
   <span class="lab" style="margin-top:18px">손님</span>
   ${row('이름',`<span class="row2"><input id="stName" maxlength="10" value="${(Save.d.manager||'').replace(/"/g,'&quot;')}" style="font:inherit;width:140px;padding:6px 10px;border:2px solid var(--ink2);border-radius:10px"><button class="btn" id="stNameOk" style="min-height:36px;font-size:13px">저장</button></span>`)}
  </div>
  <div class="lsid" style="flex:1;padding:14px 36px;display:flex;flex-direction:column;border-left:3px solid var(--ink2)">
   <span class="lab" style="margin-top:6px">데이터</span>
   ${row('캐스트 전원 해금',Save.d.allCast?'<span class="chip2 on" style="cursor:default">해금됨</span>':'<button class="btn" id="stAll" style="min-height:36px;font-size:13px">해금</button>')}
   ${row('진행 초기화','<button class="btn" id="stReset" style="min-height:36px;font-size:13px;color:#d0103a">초기화</button>')}
   <div style="margin-top:auto;font-size:12px;color:var(--sub2);font-weight:700">31 버스트 · v0.3 프로토타입</div>
  </div></div></div></div>`};
S.settings.bind=s=>{
  const vr=s.querySelector('#stVol');vr.oninput=()=>{Save.d.vol=+vr.value;Save.put();SFX.ctx()};vr.onchange=()=>SFX.notify();
  s.querySelector('#stMute').onclick=()=>{Save.d.sound=!Save.d.sound;Save.put();if(Save.d.sound)SFX.notify();Screens.go('settings')};
s.querySelector('#stSpeed').onclick=e=>{const b=e.target.closest('button');if(!b)return;SPEED=+b.dataset.v;Save.d.speed=SPEED;Save.put();Screens.go('settings')};
  s.querySelector('#stGuide').onclick=()=>showGuide();
  s.querySelector('#stFull').onclick=async()=>{await FS.toggle();setTimeout(()=>Screens.go('settings'),300)};
  s.querySelector('#stNameOk').onclick=()=>{const v=s.querySelector('#stName').value.trim();if(!v)return;Save.d.manager=v;Save.put();Screens.toast('저장됨')};
  const all=s.querySelector('#stAll');if(all)all.onclick=async()=>{const r=await ask('캐스트 전원 해금','스토리를 깨지 않아도 캐스트 네 명과 그 스토리를 전부 쓸 수 있어.',[{label:'취소',value:0},{label:'해금',value:1}]);
    if(r){Save.d.allCast=1;Save.put();Screens.toast('캐스트 전원 해금');Screens.go('settings')}};
  s.querySelector('#stReset').onclick=async()=>{const r=await ask('진행 초기화','손님 이름, 덱, 스토리, 호감도, 업적이 전부 지워져. 되돌릴 수 없어.',[{label:'취소',value:0},{label:'초기화',value:1}]);
    if(r){Save.reset();SPEED=1;Screens.go('title')}}};

/* 플레이 화면 버튼 */
$('playGuide').addEventListener('click',()=>showGuide());
$('playMenu').addEventListener('click',async()=>{const r=await ask('메뉴','대전을 그만두고 메인으로 갈까? 지금 판은 기록되지 않아.',[{label:'계속하기',value:0},{label:'메인으로',value:1}]);
  if(r){G.over=true;G.gid=(G.gid||0)+1;if(NET.on)netReset();$('res').classList.remove('on');Screens.go('home')}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if(document.querySelector('.modal.on,.res.on,.gview.on,#deckView.on,#pick.on'))return;
  if(Screens.cur==='online'){netReset();OL_CODE='';return Screens.go('match')}
  if(['match','story','cast','dex','settings','reward'].includes(Screens.cur))Screens.go('home')});

/* 플레이 화면 바 테이블도 같은 그림으로 */
$('playCtr').innerHTML=CTR_SVG;

/* 스테이지를 창 크기에 맞춘다 */
// 폰을 세로로 들면 720x1280 세로 스테이지로 바꾼다 (?pt=1 / ?pt=0 으로 강제)
const PT_FORCE=new URLSearchParams(location.search).get('pt');
// 세로 스테이지는 폭 720 고정, 키는 화면 비율 따라 1280~1600 (늘어난 만큼 --ex 로 아래쪽 요소를 내린다)
function fitStage(){const pt=PT_FORCE?PT_FORCE==='1':innerHeight>innerWidth,r=document.documentElement.style;document.body.classList.toggle('pt',pt);
  const H=pt?Math.min(1600,Math.max(1280,Math.round(720*innerHeight/innerWidth))):720;
  r.setProperty('--H',H+'px');r.setProperty('--ex',(pt?H-1280:0)+'px');
  r.setProperty('--sc',pt?Math.min(innerWidth/720,innerHeight/H):Math.min(innerWidth/1280,innerHeight/720))}
addEventListener('resize',fitStage);fitStage();
document.addEventListener('fullscreenchange',()=>{fitStage();if(Screens.cur==='home'){const b=document.getElementById('hFull');if(b)b.innerHTML=FS.on()?ICO.fsx:ICO.fs}});
Screens.go('title');

// 버튼 누를 때 작은 클릭음 (손패 카드·타이틀 시작은 따로 소리가 있다)
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.closest('#hand')||b.id==='tGo'||b.id==='stMute')return;SFX.click()},true);

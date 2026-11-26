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
// 대사 속 {S} 는 가게 이름. 바로 뒤에 붙은 조사(은/는·이/가·을/를·과/와)는 이름 끝 받침에 맞춘다. {N}(손님)은 아직 새 전제로 안 옮긴 장에만 남아 있다
const nm=t=>{const sub=(str,tok,n)=>{const c=n.charCodeAt(n.length-1),bat=c>=0xAC00&&c<=0xD7A3?(c-0xAC00)%28>0:/[lmnrLMNR013678]$/.test(n);
    return str.replace(new RegExp('\\{'+tok+'\\}(은|는|이|가|을|를|과|와)(?=[\\s,.!?~…]|$)','g'),(m,j)=>n+((bat?{는:'은',가:'이',를:'을',와:'과'}:{은:'는',이:'가',을:'를',과:'와'})[j]||j)).split('{'+tok+'}').join(n)};
  return sub(sub(String(t),'S',Save.d.manager||'우리 가게'),'N','손님')};
const chLabel=st=>`${CASTS[st.k].name} ${st.ch}장`;
const DIFF_KO={veasy:'아주 쉬움',easy:'쉬움',normal:'보통',hard:'어려움',xhard:'매우 어려움'};
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

/* 메인: 왼쪽 위 가게 명패, 가운데 오늘 근무하는 캐스트, 오른쪽 메뉴 버튼 */
S.home=()=>{if(!Progress.castOpen(Save.d.duty)){Save.d.duty='iri';Save.put()}const k=Save.d.duty,c=CASTS[k],st=Progress.nextStory(k),named=!!Save.d.manager;
  const unread=STORY.filter(x=>Progress.storyOpen(x)&&!Progress.storyDone(x.id)).length;
  const cards=Object.keys(BYID).filter(id=>Progress.dexCardVisible(id)).length;
  const noGuide=!Save.d.guide;
  const line=noGuide?'처음 오셨죠? 게임 방법은 오른쪽 위 ? 에 있어요. 한 번 보고 가요!':st?nm(st.lines[0][1]):nm(WIN_LINE[k][0]),ex=noGuide?'happy':st?st.lines[0][2]:'happy';
  const scene=`${sceneBg()}${spr(k,250,70,640).replace(`img/p/${k}.webp`,exImg(k,named?ex:'happy'))}${counter([['cups',40],['cake',600]])}`;
  if(!named)return `${scene}<div class="dimbg"></div>
<div class="panel hmname"><div class="row2" style="gap:12px"><img src="${faceImg(k,'happy')}" alt="" class="facei" style="width:52px;height:52px"><div><b style="font-size:15px">${c.name}</b><div style="font-size:14px;margin-top:2px">점장! 간판 달아야지. 우리 가게 이름은 뭘로 할까?</div></div></div>
 <label class="lab" for="hName">가게 이름</label>
 <input id="hName" maxlength="10" autocomplete="off" placeholder="가게 이름을 적어 주세요" autofocus>
 <button class="btn y" id="hNameOk">개업하기</button></div>`;
  const mb=(go,cls,ico,t,sub,badge='')=>`<button class="hmb ${cls}" data-go="${go}"><span class="ic">${ico}${badge}</span><span class="tx"><b>${t}</b><small>${sub}</small></span><span class="ar">›</span></button>`;
  return `${scene}
<div class="hmplate">
 <div class="row2" style="gap:12px"><img src="${av(k)}" alt="" class="hmav"><div style="min-width:0"><div class="hmnm">${Save.d.manager}</div></div></div>
 <div class="hmduty"><span>오늘 근무</span>${CAST_KEYS.map(x=>Progress.castOpen(x)?`<button data-duty="${x}" class="${x===k?'on':''}" aria-label="${CASTS[x].name}"><img src="${av(x)}" alt=""></button>`:`<button data-lock="${x}" class="lock" aria-label="${CASTS[x].name} 잠김" title="${Progress.castCond(x)}"><img src="${av(x)}" alt=""><svg class="lk" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e1a22" stroke-width="3" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="#ffd23f"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></button>`).join('')}</div>
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
  if(ok){const inp=s.querySelector('#hName');const f=async()=>{const v=inp.value.trim();if(!v){inp.focus();return}Save.d.manager=v;Save.put();if(Save.d.intro)Screens.go('home');else Screens.go('comic',{id:'open',then:()=>Screens.go('scene',{id:'open1'})})};   // 가게 이름을 정하면 바로 첫 플레이로
    ok.onclick=f;inp.onkeydown=e=>{if(e.key==='Enter')f()};return}
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
const k=Save.d.duty,o={...MATCH_OPT,...opt};G.gid=(G.gid||0)+1;G.over=true;if(typeof Talk!=='undefined')Talk.reset();   // 앞 대전에서 밀린 말풍선이 새 대전에 끼어들지 않게
  let opp=o.opp;if(opp==='rand'||opp===k){const c=CAST_KEYS.filter(x=>x!==k);opp=c[Math.random()*c.length|0]}
  DIFF=o.diff;MATCH=o.rounds;SEAT=[k,opp];Screens.ctx.story=o.story||null;CURRENT={story:o.story||null,opt:o};
  TUTOR=!NET.on&&o.story==='iri1'&&!Progress.storyDone('iri1');   // 첫 대전(개업 첫날을 깨기 전)에만 길잡이
  seatSetup();Screens.go('play');showVS(k,opp,o).then(()=>TUTOR&&!Save.d.tutDeck?(Save.d.tutDeck=1,Save.put(),tutDeck(opp)):0)   // 상대 덱 보기는 첫 도전에만
   .then(()=>newGame());
}
let CURRENT={story:null,opt:{}};
// 첫 플레이. (앞에 개업부터 아이리 캐스팅까지의 만화가 들어갈 자리) → 아이리가 폰을 꺼냄 → 혼자 글을 올려 31 맞추기 → 미코의 댓글 → 메인 화면 안내
const INTRO={
 open1:{id:'open1',k:'iri',ch:0,title:'개업',lines:[
   ['k','점장! 간판에 불 들어왔어! 오늘부터 {S} 영업 시작이야!','happy'],
   ['k','근데 손님이 한 명도 없네. 이제 그러면 홍보를 해 볼까?','base']],
  fin:'폰은 내가 들게. 점장은 뭘 올릴지 골라 줘!',btn:'첫 게시글 올리기',then:()=>startSolo()},
 open2:{id:'open2',k:'iri',ch:0,title:'개업',feed:[['iri','{S} 오늘 오픈! 첫 손님 기다리는 중~ 조명 각 미쳤다','shot']],lines:[
   ['k','와, 사람들 반응이 생각보다 좋은걸?','happy'],
   ['n','이 사진… 뒤에 흉조가 보이네요. 오늘은 조심하세요.','miko',{re:'iri'}],
   ['k','…이건 뭐야? 개업 첫날에 흉조라니!','pout']],
  fin:'일단 가게부터 둘러보자, 점장. 저 댓글은 내가 가만 안 둬!',btn:'가게로',then:()=>{Save.d.intro=1;Save.put();Screens.go('home');homeTour()}}};
TALK.open={start:[['k','첫 게시글을 올려 보자! 「개업 홍보」를 눌러.']],
 fed:[['k','화제성이 20이 됐어! 이제 카드를 더 올려서 31을 딱 맞추는 거야. 넘기면 안 돼!']],
 near:[['k','거의 다 왔어. 남은 숫자랑 똑같은 카드를 올려!']],
 bustMe:[['k','넘쳤다! 괜찮아, 판이 커져서 목표가 10 늘었어. 다시 맞추면 돼.']],
 justMe:[['k','딱 31! 봤지, 점장? 이게 저스트야!']]};
function startSolo(){G.gid=(G.gid||0)+1;G.over=true;Talk.reset();DIFF='veasy';MATCH=1;SEAT=['iri','miko'];Save.d.duty='iri';Screens.ctx.story=null;CURRENT={story:'open',opt:{}};TUTOR=false;SOLO=true;
  seatSetup();Screens.go('play');$('play').classList.add('solo');newGame()}
window.soloDone=()=>Screens.go('scene',{id:'open2'});
// 메인 화면 안내: 버튼을 하나씩 짚어 준다. 화면을 누르면 다음으로 넘어간다
function homeTour(){const steps=[['#hPlay','대전','캐스트를 골라 AI나 친구와 붙는다.'],['[data-go="story"]','스토리','캐스트들의 이야기. 깨면 새 캐스트와 카드가 열린다.'],['[data-go="cast"]','캐스트','근무할 캐스트를 고르고 덱을 짠다.'],['#hGuide','설명서','규칙이 헷갈리면 언제든 여기서 다시 본다.']];let i=0;
  const ov=document.createElement('div');ov.className='tourov';$('stage').appendChild(ov);
  const show=()=>{const el=document.querySelector('.scr.home '+steps[i][0]);document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));
    if(!el)return end();el.classList.add('tourhl');const r=el.getBoundingClientRect(),sr=$('stage').getBoundingClientRect(),sc=sr.width/$('stage').offsetWidth;
    ov.innerHTML=`<div class="tourtip" style="left:${Math.max(16,Math.min($('stage').offsetWidth-336,(r.left-sr.left)/sc-340))}px;top:${Math.max(16,(r.top-sr.top)/sc)}px"><b>${steps[i][1]}</b><span>${steps[i][2]}</span><small>${i+1} / ${steps.length} · 눌러서 다음</small></div>`};
  const end=()=>{ov.remove();document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'))};
  ov.onclick=()=>{i++;if(i>=steps.length)end();else show()};show()}
// 첫 대전 길잡이: 시작하기 전에 상대 덱을 꼭 한 번 보게 한다. 닫으면 대전이 시작된다
function tutDeck(opp){return new Promise(res=>{
  previewDeck(opp,null);const c=CASTS[opp],own=c.deck.filter(x=>!SHARED.includes(x)),V=[...new Set(c.deck.filter(x=>!x.nofinish&&!x.lower).flatMap(x=>x.choice||[x.v]).filter(v=>v>0))].sort((a,b)=>a-b);
  $('dvTitle').textContent='먼저 상대 덱을 보자';$('dvClose').textContent='확인했어';
  const tip=document.createElement('div');tip.className='tuttip';
  tip.innerHTML=`<b>${c.name}가 한 장으로 올릴 수 있는 숫자는 ${V[0]}~${V[V.length-1]}</b><span>화제성을 ${31-V[V.length-1]}~${31-V[0]}에 두고 차례를 넘기면 한 장에 31을 맞을 수 있다. 이 구간은 원 바깥에 빨간 띠로 표시된다.</span>`;
  $('dvGrid').prepend(tip);
  const t=setInterval(()=>{if(!$('deckView').classList.contains('on')){clearInterval(t);$('dvClose').textContent='닫기';res()}},120)})}
// 대전 시작 전 VS 화면. 누르거나 아무 키나 누르면 넘어간다
function showVS(me,op,o={}){return new Promise(res=>{
  const st=o.story&&STORY.find(x=>x.id===o.story);
  const n=NET.on&&NET.role!=='host'?G.rounds||MATCH:MATCH,info=st?`스토리 · ${chLabel(st)}`:NET.on?`${n===1?'단판':n+'판'} · 온라인`:`${MATCH===1?'단판':MATCH+'판'} · AI ${DIFF_KO[DIFF]}`;
  const v=document.createElement('div');v.className='vsov';v.setAttribute('role','dialog');v.setAttribute('aria-label',`${CASTS[me].name} 대 ${CASTS[op].name}`);
  v.innerHTML=`<div class="vsl c${CAST_COL[me]}"></div><div class="vsr c${CAST_COL[op]}"></div><div class="vsline"></div>
   <div class="vsp l">${spr(me,0,0,780)}</div><div class="vsp r">${spr(op,0,0,780)}</div>
   <div class="vsn l"><b>${CASTS[me].name}</b><span>${NET.on?'나':Save.d.manager||'나'}</span></div>
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
    if(NET.quick)return landPhone('온라인 2인',`<div class="olbody" style="align-items:center;justify-content:center;text-align:center">
 <div class="serif" style="font-size:34px">상대 찾는 중…</div>
 <div style="font-size:13px;font-weight:700;color:var(--sub2)">빠른 매칭 · 3판 · 잡히면 캐스트를 고르는 화면으로 넘어가</div>
 <div class="olspin" aria-hidden="true"><i></i><i></i><i></i></div>
 <button class="btn" id="olCancel">취소</button></div>`,'match');
    return landPhone('온라인 2인',`<div class="lrow" style="flex:1;display:flex;min-height:0">
 <div class="lart" style="width:360px;position:relative;overflow:hidden;background:#fff3dc;border-right:3px solid var(--ink2)">${spr(k,40,10,640)}
  <div style="position:absolute;left:0;right:0;bottom:0;padding:18px 22px;background:linear-gradient(rgba(255,243,220,0),#fff3dc 35%)"><span class="lab">온라인 대전</span><div style="font-size:13px;line-height:1.6;margin-top:4px">빠른 매칭이면 아무나, 방 코드면 친구랑 붙어.</div></div></div>
 <div class="olbody">
  <div class="olbox olq"><span class="lab">빠른 매칭</span><div class="row2" style="justify-content:space-between;align-items:center"><span style="font-size:13px;font-weight:700">아무나 붙자. 3판</span><button class="btn y" id="olQuick" style="min-width:180px" ${waiting?'disabled':''}>빠른 매칭</button></div></div>
  <div class="olor">또는 친구와</div>
  <div class="olfr"><div class="olbox"><span class="lab">방 만들기</span>
   ${waiting?`<div class="olcode serif">${NET.code}</div><div style="font-size:13px;font-weight:700">상대에게 이 숫자를 알려줘. 들어올 때까지 기다리는 중…</div><div class="row2"><button class="btn" id="olCancel">취소</button></div>`
   :`<div class="col" style="gap:8px"><span style="font-size:12px;font-weight:700">판 수</span>${seg('rounds',[[1,'단판'],[3,'3판'],[5,'5판']],MATCH_OPT.rounds)}</div><div class="row2"><button class="btn y" id="olMake" style="min-width:140px">방 만들기</button></div>`}
  </div>
  <div class="olbox"><span class="lab">코드로 참가</span>
   <input id="olIn" class="olin serif" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000" aria-label="방 코드 네 자리" value="${OL_CODE}" ${waiting?'disabled':''}>
   <div class="row2"><button class="btn y" id="olGo" style="min-width:140px" ${waiting?'disabled':''}>참가</button></div>
  </div></div>
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
  const qk=s.querySelector('#olQuick');if(qk)qk.onclick=()=>netQuick(1,0);
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
S.reward=()=>{const talk=!!CURRENT.talk,st0=CURRENT.story&&STORY.find(x=>x.id===CURRENT.story);   // talk: 대전 없는 장을 읽고 온 경우
  const[a,b]=talk?[0,0]:[G.score[ME],G.score[AI]],win=talk?ME:matchWinner();
  const k=talk?st0.k:SEAT[ME],o=talk?null:SEAT[AI],title=talk?`「${st0.title}」`:win===null?'무승부':win===ME?'승리!':'패배…',g=Progress.last||{aff:0,new:[],ach:[]};
  // 판별 기록: 한 줄짜리 작은 칩으로
  const hist=talk?'':G.hist.map((h,i)=>`<span class="rh ${h.w===null?'d':h.w===ME?'w':'l'}"><b>${i+1}판</b>${h.w===null?'무':`<img src="${av(SEAT[h.w])}" alt="${CASTS[SEAT[h.w]].name}">+${h.pts}`}${h.busts?`<i>버스트×${h.busts}</i>`:''}</span>`).join('');
  const st=CURRENT.story&&STORY.find(x=>x.id===CURRENT.story);
  const[line0,ex]=st?(talk?st.end:st.free?(win===ME?st.win:st.lose):g.clear?st.win:st.lose):[WIN_LINE[k][win===ME?0:1],win===ME?'happy':'pout'];const line=nm(line0);
  const affMax=Progress.AFF_LV[Progress.AFF_LV.length-1],next=g.affNext,prev=Progress.AFF_LV[(g.lv||1)-1];
  const pct=next?Math.round(100*(g.affNow-prev)/(next-prev)):100;
  const hint=Progress.hint(k);
  return landPhone('결과',`<div class="lrow rwrow" style="flex:1;display:flex;min-height:0">
 <div class="lmain" style="flex:1;padding:22px 32px;display:flex;flex-direction:column;gap:12px;min-height:0">
  <div>
   <div class="row2" style="align-items:baseline;gap:18px"><span class="serif" style="font-size:${talk?40:52}px;color:${win===ME?'var(--cM)':'var(--ink2)'}">${title}</span>${talk?'':`<span class="serif" style="font-size:34px">${a} <span style="color:var(--sub2)">:</span> ${b}</span>`}
   ${st?`<span class="chip2 ${g.clear?'on':''}" style="cursor:default;margin-left:auto">${g.clear?'스토리 클리어':'다시 도전'}</span>`:''}</div></div>
  ${talk?'':`<div class="rhrow"><span class="lab">판별</span>${hist}</div>`}
  <div class="panel rwd" style="padding:14px 18px;display:flex;flex-direction:column;gap:10px">
    <div class="affup" id="rAff" data-from="${(g.affNow||0)-(g.aff||0)}" data-to="${g.affNow||0}"><div class="row2" style="justify-content:space-between;font-size:14px;font-weight:900"><span>${CASTS[k].name} 호감도 <span id="rAffLv">Lv${g.lv||Progress.lv(k)}</span></span><span style="color:var(--cM)" id="rAffGain">${g.aff?`+${g.aff}`:'+0'}</span></div>
     <div class="affbar"><i id="rAffBar" style="width:${pct}%"></i><em class="lvup" id="rLvUp">LEVEL UP!</em></div><div style="font-size:11px;color:var(--sub2);font-weight:700;margin-top:3px" id="rAffNext">${next?`다음 레벨까지 ${next-g.affNow}`:'최고 레벨'}</div></div>
    ${(()=>{const nw=g.new.filter(x=>!/호감도 Lv/.test(x)),ach=g.ach.map(x=>Progress.ACH[x].name);   // 호감도 레벨은 위 게이지가 보여 주니 뺀다
      return nw.length||ach.length?`<div class="newrow"><span class="lab" style="color:var(--cM)">새로 열림</span>${nw.map(x=>`<span class="newc">${x}</span>`).join('')}${ach.map(x=>`<span class="newc a">업적 · ${x}</span>`).join('')}</div>`:''})()}
    ${hint?`<div style="font-size:12px;color:var(--sub2);font-weight:700">${hint}</div>`:''}
  </div>
  <div class="row2" style="margin-top:auto;justify-content:flex-end"><button class="btn" data-go="home">메인으로</button>${st?`<button class="btn y" id="rStory" style="min-width:180px">${g.clear?'스토리로':'다시 도전'}</button>`:'<button class="btn y" id="rAgain" style="min-width:180px">한 판 더</button>'}</div>
 </div>
 <div class="lart rwart" style="width:340px;position:relative;overflow:hidden;background:#fff3dc;border-left:3px solid var(--ink2)">
  ${spr(k,10,90,600,'',false)}
  <div class="panel row2" style="position:absolute;left:18px;top:20px;right:18px;padding:10px 12px;gap:10px;align-items:flex-start;border-radius:16px 16px 16px 4px"><img src="${faceImg(k,ex)}" alt="" class="facei"><span style="font-size:14px;font-weight:700;line-height:1.5">${line}</span></div>
 </div></div>`)};
S.reward.bind=s=>{const r=s.querySelector('#rAgain');if(r)r.onclick=()=>startMatch(CURRENT.opt);
  // 호감도: 이전 값에서 지금 값까지 쭈욱 차오른다. 레벨 선을 넘으면 꽉 찼다가 LEVEL UP 하고 다시 차오른다
  {const box=s.querySelector('#rAff');if(box){const from=+box.dataset.from,to=+box.dataset.to,L=Progress.AFF_LV,bar=s.querySelector('#rAffBar'),lvEl=s.querySelector('#rAffLv'),gain=s.querySelector('#rAffGain'),nx=s.querySelector('#rAffNext'),up=s.querySelector('#rLvUp');
    const lvOf=v=>{let l=1;L.forEach((x,i)=>{if(v>=x)l=i+1});return l};
    const show=v=>{const l=lvOf(v),p=L[l-1],n=L[l];bar.style.width=(n?Math.min(100,100*(v-p)/(n-p)):100)+'%';lvEl.textContent='Lv'+l;
      nx.textContent=n?`다음 레벨까지 ${Math.max(0,Math.ceil(n-v))}`:'최고 레벨';gain.textContent='+'+Math.round(v-from)};
    if(to>from&&!matchMedia('(prefers-reduced-motion: reduce)').matches){bar.style.transition='none';show(from);gain.textContent='+0';
      const per=Math.max(380,900/Math.max(1,to-from));let v=from,t0=null,lastI=0,lastL=lvOf(from);
      setTimeout(()=>requestAnimationFrame(function tick(t){if(Screens.cur!=='reward')return;if(t0===null)t0=t;
        v=Math.min(to,from+(t-t0)/per);const ease=v;show(ease);
        const i=Math.floor(v-from);if(i>lastI){lastI=i;SFX.pluckUp&&SFX.pluckUp(i)}
        const l=lvOf(v);if(l>lastL){lastL=l;box.classList.remove('lv');void box.offsetWidth;box.classList.add('lv');SFX.win()}
        if(v<to)requestAnimationFrame(tick);else{show(to);box.classList.add('done')}}),650)}
  }}
  const st=CURRENT.story&&STORY.find(x=>x.id===CURRENT.story),rs=s.querySelector('#rStory');
  if(rs)rs.onclick=()=>Progress.last&&Progress.last.clear?Screens.go('story',{sel:(Progress.nextStory(st.k)||st).id}):storyMatch(st)};

/* 만화: 검은 지면에 비스듬한 컷이 하나씩 튀어나온다. 누르면 다음 컷, 한 쪽이 다 차면 다음 쪽. 그림(img/p/comic/<id>_<번호>.webp)이 없으면 콘티 설명이 대신 나온다.
   컷: {a:지면 칸(grid-area), note:그릴 내용, sfx:효과음 글자, say:[[말, 위치(tl·tr·bl·br), 생각이면 1]…], from:튀어나오는 방향(l·r·t·b)} */
const COMIC={open:{title:'개업 전날',pages:[
 [{a:'a',note:'간판 없는 빈 가게. 점장의 뒷모습',say:[['가게는 차렸다.','bl',1]],from:'l'},
  {a:'b',note:'의자만 가지런한 텅 빈 홀',sfx:'휑',say:[['…직원이 없다.','bl',1]],from:'r'},
  {a:'c',note:'번화가. 전단지를 들고 두리번거리는 점장',sfx:'두리번',from:'b'}],
 [{a:'a',note:'셀카를 찍으며 걸어오는 아이리',sfx:'반짝',say:[['오늘 각 미쳤다~','tr']],from:'t'},
  {a:'b',note:'아이리 앞에 무릎을 꿇는 점장',sfx:'털썩',say:[['제발 일해 주세요!','tl'],['…뭐야, 이 사람?','br']],from:'l'},
  {a:'c',note:'폰을 내리고 씩 웃는 아이리',say:[['재밌어 보이네. 갈게!','bl']],from:'r'}]]}};
S.comic=()=>{const c=COMIC[Screens.ctx.id];return `<div class="cmbar"><span class="chip2 on" style="cursor:default">${c.title}</span><button class="btn" id="cmSkip">건너뛰기</button></div><div class="cmpage" id="cmPage"></div><div class="cmnx" id="cmNx">▼</div>`};
S.comic.bind=s=>{const id=Screens.ctx.id,c=COMIC[id],then=Screens.ctx.then||(()=>Screens.go('home')),page=s.querySelector('#cmPage');let pi=0,ci=0,n=0,done=false;
  const end=()=>{if(done)return;done=true;removeEventListener('keydown',key);then()};
  const draw=()=>{page.classList.remove('in');void page.offsetWidth;page.classList.add('in');page.dataset.n=c.pages[pi].length;
    page.innerHTML=c.pages[pi].map((p,i)=>{const no=c.pages.slice(0,pi).reduce((a,b)=>a+b.length,0)+i+1;
      return `<figure class="cmp f${p.from||'l'}" style="grid-area:${p.a};--r:${[-1.2,.9,-.6][i%3]}deg"><div class="cmart"><span class="cmnote"><b>${no}</b>${p.note}</span><img src="img/p/comic/${id}_${no}.webp" alt="" onerror="this.remove()" onload="this.parentNode.classList.add('has')"></div>${p.sfx?`<em class="cmsfx">${p.sfx}</em>`:''}${(p.say||[]).map(([t,at,th],j)=>`<p class="cmsay ${at||'bl'}${th?' th':''}" style="--d:${.28+j*.35}s">${nm(t)}</p>`).join('')}</figure>`}).join('');ci=0};
  const step=()=>{if(done)return;const P=page.querySelectorAll('.cmp');
    if(ci<P.length){P[ci++].classList.add('on');SFX.flip&&SFX.flip();return}
    if(++pi>=c.pages.length)return end();draw();step()};
  const key=e=>{if(Screens.cur!=='comic')return removeEventListener('keydown',key);if(e.key==='Escape')return end();if(e.key==='Enter'||e.key===' '){e.preventDefault();step()}};
  s.onclick=e=>{if(e.target.closest('#cmSkip'))return end();step()};addEventListener('keydown',key);draw();setTimeout(step,250)};

/* 스토리 */
function storyMatch(st){Save.d.duty=st.k;Save.put();startMatch({mode:'ai',diff:st.diff||'normal',rounds:st.rounds||3,opp:st.vs,story:st.id})}
S.story=()=>{const pick=Screens.ctx.sel&&STORY.find(x=>x.id===Screens.ctx.sel);
  const sel=pick&&Progress.storyOpen(pick)?pick:Progress.nextStory(Save.d.duty)||STORY.find(x=>x.k===Save.d.duty);
  const li=CAST_KEYS.map(k=>`<div class="lab" style="margin:10px 4px 4px">${CASTS[k].name}${Progress.castOpen(k)?'':` · ${Progress.castCond(k)}하면 열림`}</div>`+STORY.filter(x=>x.k===k).map(x=>{const open=Progress.storyOpen(x),done=Progress.storyDone(x.id);
    return open?`<button class="${x===sel?'on':''}" data-sel="${x.id}"><img src="${av(x.k)}" alt=""><span class="nm">${x.ch}장 ${x.title}</span><span class="st ${done?'':'new'}">${done?'완료':'NEW'}</span></button>`
      :`<button disabled><span class="q">?</span><span class="nm">${x.ch}장</span><span class="st">${Progress.castOpen(x.k)?`${x.ch-1}장 후`:'잠김'}</span></button>`}).join('')).join('');
  const goal=sel.talkOnly?'끝까지 읽기':sel.free?'한 판 플레이 (승패 상관없음)':'승리';
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
    <div class="row2" style="justify-content:space-between"><span class="lab">대전</span><b>${sel.talkOnly?'없음 · 대화':`AI ${DIFF_KO[sel.diff||'normal']} ${sel.rounds||3}판 · vs ${CASTS[sel.vs].name}`}</b></div>
    <div class="row2" style="justify-content:space-between"><span class="lab">클리어</span><b>${goal}</b></div>
    <div class="row2" style="justify-content:space-between"><span class="lab">내 캐스트</span><b>${CASTS[sel.k].name}</b></div>
   </div>
   <button class="btn y" id="sGo" style="align-self:flex-start;min-width:180px;min-height:54px;font-size:18px">${Progress.storyDone(sel.id)?'다시 보기':'시작'}</button>
  </div></div></div>`)};
S.story.bind=s=>{s.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>Screens.go('story',{sel:b.dataset.sel}));
  const on=s.querySelector('.lst button.on');if(on)on.scrollIntoView({block:'nearest'});
  s.querySelector('#sGo').onclick=()=>{const b=s.querySelector('.lst button.on');Screens.go('scene',{id:b?b.dataset.sel:STORY[0].id})}};

/* 스토리 장면: 마감 후 가게에서 마주 보고 하는 대화. 대사마다 표정·자세가 바뀐다 */
S.scene=()=>{const st=STORY.find(x=>x.id===Screens.ctx.id)||INTRO[Screens.ctx.id],k=st.k;
  return `${sceneBg(true)}<div id="scSpr" class="scspr">${spr(k,330,40,700).replace(`img/p/${k}.webp`,exImg(k,'base'))}</div>${counter([['cups',70],['cake',1020]],true)}
<div class="scph" id="scPh" aria-live="polite"><div class="phone"><div class="screen"><div class="appbar"><b id="scApp">타임라인</b></div><div class="feed" id="scFeed"></div><div class="dm" id="scDm" hidden></div></div></div><span class="tap">눌러서 계속</span></div>
<div class="scnoti" id="scNoti" aria-live="polite"></div>
<div class="vnch" id="scCh"></div>
<div class="vnbox c${CAST_COL[k]}" id="scBox" role="button" tabindex="0" aria-live="polite"><span class="vnnm" id="scNm">${CASTS[k].name}</span><p id="scTx"></p><i class="vnnx" id="scNx">▼</i></div>
<div class="vntop"><span class="chip2" style="cursor:default">${chLabel(st)} · ${st.title}</span><button class="chip2" id="scSkip">건너뛰기</button></div>`};
S.scene.bind=s=>{const st=STORY.find(x=>x.id===Screens.ctx.id)||INTRO[Screens.ctx.id],k=st.k,ch=s.querySelector('#scCh'),sp=s.querySelector('#scSpr'),box=s.querySelector('#scBox'),tx=s.querySelector('#scTx'),nmEl=s.querySelector('#scNm'),nx=s.querySelector('#scNx');
  let i=0,done=false,typing=null,full='',wait=false;const Q=[];   // Q: 고른 보기에 딸린 줄. 다 쓰면 본문으로 돌아온다
  const flat=L=>L.flatMap(l=>l[0]==='c'&&l[2]?[l,...l[2].filter(r=>Array.isArray(r[0])).flatMap(flat)]:[l]),ALL=flat(st.lines);
  const ph=s.querySelector('#scPh'),feed=s.querySelector('#scFeed');
  // SNS 글: 휴대폰을 꺼내서 타임라인 맨 위에 올린다. 처음 꺼낼 때는 바탕 글(feed)과 인용될 원본 글이 이미 깔려 있다
  const pimg=(k2,id)=>id?`<div class="pimg"><div class="pimg2" style="${photoStyle({id},CAST_COL[k2])}"></div></div>`:'';
  const likes=()=>`<div class="pa"><span class="r">${REPLY}<em>${Math.round(Math.random()*12+2)}</em></span><span class="h">${HEART}<em>${Math.round(Math.random()*40+12)}</em></span></div>`;
  const art=(k2,t,o={})=>{const el=document.createElement('article');el.className='post';
    el.innerHTML=`<img class="av" src="img/p/${k2}_av.webp" alt=""><div><div class="ph"><b>${CASTS[k2].name}</b><span>${CASTS[k2].handle} · ${o.old?'1시간 전':'방금'}</span></div>`+
      (o.re?`<div class="rel">↳ <b>${CASTS[o.re].handle}</b> 님에게 답글</div>`:'')+`<p class="pt">${nm(t)}</p>`+
      (o.q?`<div class="qt"><div class="ph"><img class="av" src="img/p/${o.q[0]}_av.webp" alt=""><b>${CASTS[o.q[0]].name}</b><span>${CASTS[o.q[0]].handle}</span></div><p class="pt">${nm(o.q[1])}</p>${pimg(o.q[0],o.q[2])}</div>`:'')+
      (o.ph?pimg(o.ph[0],o.ph[1]):o.img?pimg(k2,o.img):'')+likes()+`</div>`;return el};
  let seeded=false;
  const seed=()=>{if(seeded)return;seeded=true;const L=[...(st.feed||[])],own=new Set(ALL.filter(l=>l[0]==='p'||l[0]==='n').map(l=>l[2]+'|'+l[1]));
    ALL.forEach(l=>{const q=(l[0]==='p'||l[0]==='n')&&l[3]&&l[3].q;if(q&&!own.has(q[0]+'|'+q[1])&&!L.some(x=>x[1]===q[1]))L.push(q)});
    L.forEach(([k2,t,img])=>feed.prepend(art(k2,t,{old:1,img})))};
  const post=(e,t,o)=>{box.classList.add('hide');noti.classList.remove('on');seed();ph.classList.add('on');feed.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot'));
    view('tl');const el=art(e,t,o||{});el.classList.add('hot');feed.prepend(el);feed.scrollTop=0;SFX.notify(0,.12)};
  const putAway=()=>{ph.classList.remove('on');box.classList.remove('hide')};
  // DM: ['d', 말, 보낸 캐스트, {to:받는 캐스트}] 휴대폰을 DM 창으로 꺼낸다. 이 장 주인공이 보낸 건 오른쪽
  const dm=s.querySelector('#scDm'),app=s.querySelector('#scApp'),rooms={};let room=null;
  const view=v=>{const isDm=v!=='tl';feed.hidden=isDm;dm.hidden=!isDm;app.textContent=isDm?'DM · '+CASTS[v].name:'타임라인'};
  const bub=(e,t,old)=>{const el=document.createElement('div');el.className='bub'+(e===k?' me':'')+(old?' old':'');
    el.innerHTML=(e===k?'':`<img class="av" src="img/p/${e}_av.webp" alt="">`)+`<p>${nm(t)}</p>`;dm.appendChild(el);dm.scrollTop=dm.scrollHeight};
  const dmPush=(e,t,o)=>{const r=e===k?(o&&o.to)||room||st.vs:e;(rooms[r]=rooms[r]||[]).push([e,t]);return r};
  const dmSay=(e,t,o)=>{box.classList.add('hide');noti.classList.remove('on');const r=dmPush(e,t,o);
    if(room!==r){room=r;dm.innerHTML='';rooms[r].slice(0,-1).forEach(([a,b])=>bub(a,b,1))}view(r);bub(e,t);ph.classList.add('on');SFX.notify(0,.12)};
  // 실시간 알림: ['n', 말, 쓴 캐스트, {dm:1, …글 옵션}] 대화는 그대로 이어지고 화면 위에 알림이 잠깐 뜬다
  const noti=s.querySelector('#scNoti');let notiT=null;
  const live=(e,t,o={})=>{if(o.dm){if(dmPush(e,t,o)===room)bub(e,t)}else{seed();feed.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot'));feed.prepend(art(e,t,o))}
    noti.innerHTML=`<img class="av" src="img/p/${e}_av.webp" alt=""><div><div class="nh"><b>${CASTS[e].name}</b><span>${o.dm?'DM':o.re?CASTS[o.re].handle+' 님에게 답글':CASTS[e].handle}</span></div><p>${nm(t)}</p></div>`;
    noti.classList.remove('on');void noti.offsetWidth;noti.classList.add('on');clearTimeout(notiT);notiT=setTimeout(()=>noti.classList.remove('on'),4200);SFX.notify(0,.12)};
  ph.onclick=()=>step();
  EXPR.forEach(e=>{const im=new Image();im.src=exImg(k,e)});   // 표정 그림 미리 불러오기
  const face=(el,who,e)=>{e=e||'base';el.dataset.e=e;el.querySelector('img').src=exImg(who,e);el.classList.remove('go');void el.offsetWidth;el.classList.add('go')};
  const react=e=>face(sp,k,e);
  // 라이벌 등장: ['o', 말, 표정, 누구(생략하면 대전 상대)] 가게에 직접 와서 말한다. 말하는 쪽은 밝게, 듣는 쪽은 어둡게. ['x'] 는 퇴장
  const sp2=()=>s.querySelector('#scSpr2');
  const guest=(who,e)=>{let g=sp2();
    if(!g||g.dataset.k!==who){if(g)g.remove();sp.insertAdjacentHTML('afterend',`<div id="scSpr2" class="scspr sc2" data-k="${who}">${spr(who,330,40,700).replace(`img/p/${who}.webp`,exImg(who,e||'base'))}</div>`);g=sp2();void g.offsetWidth}
    s.classList.add('duo');return g};
  const turn=mine=>{sp.classList.toggle('dim',!mine);const g=sp2();if(g)g.classList.toggle('dim',!!mine)};
  const col=who=>['M','K','Y','C'].forEach(c=>box.classList.toggle('c'+c,c===CAST_COL[who]));
  [...new Set(ALL.filter(l=>l[0]==='o').map(l=>l[3]||st.vs))].forEach(w=>EXPR.forEach(e=>{const im=new Image();im.src=exImg(w,e)}));
  const say=(who,t,me,post)=>{nmEl.textContent=who;box.classList.toggle('me',!!me);box.classList.toggle('snsp',!!post);box.dataset.pc=post?CAST_COL[post]:'';full=t;tx.textContent='';nx.hidden=true;let n=0;clearInterval(typing);
    typing=setInterval(()=>{n+=1;tx.textContent=t.slice(0,n);if(n>=t.length){clearInterval(typing);typing=null;nx.hidden=false}},Math.max(8,28*SPEED))};
  const fin=()=>{if(done)return;done=true;clearInterval(typing);noti.classList.remove('on');ch.innerHTML='';wait=true;putAway();
    if(st.then){const b=document.createElement('button');b.className='btn y';b.textContent=st.btn||'다음';b.onclick=()=>st.then();ch.appendChild(b);b.focus();return}   // 첫 플레이 장면: 다음 단계로
    if(st.talkOnly){   // 대전 없는 장: 끝까지 읽으면 클리어
      const b=document.createElement('button');b.className='btn y';b.style.minWidth='240px';b.textContent='다음';
      b.onclick=()=>{Progress.onTalkEnd(st.id);CURRENT={story:st.id,talk:true,opt:null};Screens.go('reward')};ch.appendChild(b);b.focus();return}
    const o=CASTS[st.vs].name,FIN={iri:`가자! 상대는 ${o}.`,miko:`…시작할게요. 상대는 ${o} 씨.`,haru:`그럼, 시작해 볼까요? 상대는 ${o}.`,mina:`간다! 상대는 ${o}!`};
    turn(true);col(k);say(CASTS[k].name,st.fin?nm(st.fin):FIN[k]||`상대는 ${o}.`);
    const b=document.createElement('button');b.className='btn y';b.style.minWidth='240px';b.textContent=`대전 시작 · vs ${CASTS[st.vs].name}`;b.onclick=()=>storyMatch(st);ch.appendChild(b);b.focus()};
  const step=()=>{if(Screens.cur!=='scene'||done||wait)return;
    if(typing){clearInterval(typing);typing=null;tx.textContent=full;nx.hidden=false;return}   // 글자 나오는 중이면 한 번에 다 보여준다
    const ln=Q.length?Q.shift():i<st.lines.length?st.lines[i++]:null;if(!ln)return fin();const[w,t,e,o]=ln;
    // 고르기: ['c', [보기…], [보기별 반응…]] 반응은 [말, 표정] 한 줄이거나, 줄 여러 개([[줄], [줄]…])다. 여러 줄이면 고른 보기대로 글·DM 이 실제로 올라간다
    if(w==='c'){putAway();wait=true;nx.hidden=true;ch.innerHTML='';const re=e;t.forEach((x,j)=>{const b=document.createElement('button');b.className='btn';b.textContent=nm(x);
      b.onclick=()=>{ch.innerHTML='';wait=false;col(k);say('점장',nm(x),true);const r=re&&re[j];if(r)Q.push(...(Array.isArray(r[0])?r:[['k',r[0],r[1]]]))};ch.appendChild(b)});ch.firstChild.focus();return}
    if(w==='p'){post(e,t,o);return}
    if(w==='d'){dmSay(e,t,o);return}
    if(w==='n'){live(e,t,o);return step()}
    if(w==='x'){s.classList.remove('duo');turn(true);return step()}
    if(w==='o'){const who=o||st.vs,g=guest(who,e);putAway();face(g,who,e);turn(false);col(who);say(CASTS[who].name,nm(t));return}
    putAway();react(e);turn(true);col(k);say(CASTS[k].name,nm(t))};
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
    <div class="row2" style="margin-top:6px">${!Progress.castOpen(k)?`<span class="chip2" style="cursor:default">잠김 · ${Progress.castCond(k)}</span>`:k===Save.d.duty?'<span class="chip2 on" style="cursor:default">오늘 근무 중</span>':'<button class="btn" id="cDuty">오늘 지명하기</button>'}${Progress.castOpen(k)?'<button class="btn y" data-tab="deck" style="margin-left:auto">덱 편집</button>':''}</div>
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
  const du=s.querySelector('#cDuty');if(du)du.onclick=()=>{Save.d.duty=k;Save.put();Screens.toast(`오늘 근무: ${CASTS[k].name}`);Screens.go('cast')};
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
   <span class="lab" style="margin-top:18px">가게</span>
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
  s.querySelector('#stReset').onclick=async()=>{const r=await ask('진행 초기화','가게 이름, 덱, 스토리, 호감도, 업적이 전부 지워져. 되돌릴 수 없어.',[{label:'취소',value:0},{label:'초기화',value:1}]);
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

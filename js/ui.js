// 덱 보기·설명서·입력·캐스트 선택
function deckLabel(c){return c.choice?c.choice.join('/'):c.lower?'−'+c.lower[0]+'~'+c.lower[c.lower.length-1]:String(c.v)}
function deckRow(p,c){
  const q=c.choice||c.lower,v=q?null:p===null?c.v:valOf(p,c,null);
  const cls=q?'q':v<0?'neg':v===0?'zero':'',own=!SHARED.some(x=>x.id===c.id);
  return `<li><span class="v ${cls}">${q?'?':v}</span><span class="nm"><b>${c.name}</b>${own?'<i class="tg own">전용</i>':''}${c.photo?'<i class="tg ph">사진</i>':''}<small>${c.text}</small></span></li>`}
function deckCol(p){
  const P=G.P[p],played=P?P.played:[],me=p===ME,k=SEAT[p];
  const cards=[...DECK[p]],gone=cards.filter(c=>played.includes(c.id));
  const hand=me&&P?cards.filter(c=>P.hand.some(h=>h.id===c.id)):[];
  const rest=cards.filter(c=>!gone.includes(c)&&!hand.includes(c));
  const grp=(cls,t,list)=>list.length?`<section class="dvs ${cls}"><h4>${t}<b>${list.length}</b></h4><ul>${list.map(c=>deckRow(p,c)).join('')}</ul></section>`:'';
  return `<div class="dvc"><div class="dvhd" style="--cc:${CASTS[k].back[0]}"><img src="img/p/${k}_av.webp" alt=""><span><small>${me?'내 덱':'상대 덱'}</small>${NAME[p]}</span><em>${cards.length}장</em></div>`
   +grp('inhand','손패',hand)+grp('left',me?'덱에 남음':'아직 안 나옴',rest)+grp('gone','이번 판에 나옴',gone)+'</div>'}
let DV_RET=null;
function previewDeck(k,from){
  const c=CASTS[k],own=c.deck.filter(x=>!SHARED.includes(x)),t=$('dvGrid');DV_RET=from;
  const grp=(t2,list)=>`<section class="dvs"><h4>${t2}<b>${list.length}</b></h4><ul>${list.map(x=>deckRow(null,x)).join('')}</ul></section>`;
  t.dataset.s='p';$('dvTitle').textContent=`${c.name} 덱`;$('dvTabs').innerHTML='';
  t.innerHTML=`<div class="dvc"><div class="dvhd pv" style="--cc:${c.back[0]}"><img src="img/p/${k}_av.webp" alt=""><span>${c.name}<small>${c.handle}</small></span><em>${c.deck.length}장</em></div><p class="dvab">${c.abil}</p>`+grp('전용 카드',own)+grp('공용 카드',SHARED)+'</div>';
  $('deckView').classList.add('on','pv');t.scrollTop=0;$('dvClose').focus();
}
function showDeck(s){
  const t=$('dvGrid');$('dvTitle').textContent='덱 리스트';$('deckView').classList.remove('pv');DV_RET=null;if(s!==undefined)t.dataset.s=s;else if(t.dataset.s==='p')t.dataset.s=0;
  t.innerHTML=deckCol(ME)+deckCol(AI);
  $('dvTabs').innerHTML=[ME,AI].map((p,i)=>`<button role="tab" data-s="${i}" aria-selected="${t.dataset.s==i}" style="--cc:${CASTS[SEAT[p]].back[0]}"><img src="img/${SEAT[p]}_av.jpg" alt="">${p===ME?'내 덱':'상대 덱'}<small>${NAME[p]}</small></button>`).join('');
  $('deckView').classList.add('on');$('dvClose').focus();
}
$('dvTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){showDeck(+b.dataset.s);$('dvGrid').scrollTop=0}});
function hideDeck(){$('deckView').classList.remove('on','pv');(DV_RET||$('deckBtn')).focus();DV_RET=null}
let GI=0;const GN=document.querySelectorAll('#gTrack .gs').length;
$('gDots').innerHTML=Array.from({length:GN},()=>'<i></i>').join('');
function gGo(n){GI=Math.max(0,Math.min(GN-1,n));$('gTrack').style.transform=`translateX(${-GI*100}%)`;
  [...$('gDots').children].forEach((d,k)=>d.classList.toggle('on',k===GI));
  $('gPrev').disabled=GI===0;$('gNext').textContent=GI===GN-1?'시작하기':'다음'}
// 설명서를 끝까지 보거나 닫으면 '본 것'으로 저장하고, 기다리던 일(첫 대전 시작 등)을 이어서 한다
let G_AFTER=null;
function showGuide(after){G_AFTER=typeof after==='function'?after:null;gGo(0);$('guide').classList.add('on');$('gNext').focus()}
function hideGuide(){$('guide').classList.remove('on');
  if(typeof Save!=='undefined'&&!Save.d.guide){Save.d.guide=1;Save.put();if(Screens.cur==='home')Screens.go('home')}
  const f=G_AFTER;G_AFTER=null;if(f)f()}
$('guideBtn').addEventListener('click',showGuide);
$('gClose').addEventListener('click',hideGuide);
$('gPrev').addEventListener('click',()=>gGo(GI-1));
$('gNext').addEventListener('click',()=>GI===GN-1?hideGuide():gGo(GI+1));
$('guide').addEventListener('click',e=>{if(e.target.id==='guide')hideGuide()});
document.addEventListener('keydown',e=>{if(!$('guide').classList.contains('on'))return;
  if(e.key==='Escape')hideGuide();else if(e.key==='ArrowRight')gGo(GI+1);else if(e.key==='ArrowLeft')gGo(GI-1)});
{let x0=null;const tr=$('gTrack');
 tr.addEventListener('pointerdown',e=>{x0=e.clientX});
 tr.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>40)gGo(GI+(dx<0?1:-1))});
 tr.addEventListener('pointercancel',()=>{x0=null})}
$('deckBtn').addEventListener('click',()=>showDeck());
$('dvClose').addEventListener('click',hideDeck);
$('deckView').addEventListener('click',e=>{if(e.target.id==='deckView')hideDeck()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('deckView').classList.contains('on'))hideDeck()});
/* ---------- 입력 ---------- */
$('hand').addEventListener('click',async e=>{
  const b=e.target.closest('.cardb');if(!b||b.disabled||G.cur!==ME||G.busy)return;
  LAST_PICK={r:b.getBoundingClientRect(),t:performance.now()};
  const i=+b.dataset.i,c=G.P[ME].hand[i];let ch=null;
  const P=G.P[ME],d=(P.capture?1:0)-(P.soothe?1:0);
  if(c.choice)ch=await ask(c.name,'숫자를 골라.',c.choice.filter(n=>okV(P,n+d,c)).map(n=>({label:String(n+d),value:n})));
  if(c.lower)ch=await ask(c.name,'게이지를 얼마나 내릴까?',c.lower.map(n=>({label:'−'+n,value:n})));
  let adj=0;
  if(CASTS[SEAT[ME]].adjust&&!P.adjUsed&&!c.lower){const v=valOf(ME,c,ch);
    const d=CASTS[SEAT[ME]].adjust;
    const opts=[{label:`그대로 ${v}`,value:0},{label:`${d>0?'+1':'−1'} → ${v+d}`,value:d}].filter(o=>okV(P,v+o.value,c));
    if(opts.length>1)adj=await ask(CASTS[SEAT[ME]].abName,`판마다 한 번. 지금 게이지 ${G.gauge}, 목표 ${G.target}.`,opts)}
  if(NET.role==='guest'){G.busy=true;render();NET.send({t:'play',i,ch,adj});return}
  play(ME,i,ch,adj);
});

let PICK_ME=null;
function showPick(){PICK_ME=null;if(NET.role!=='guest'){NET.hostCast=null;NET.guestCast=null}renderPick();$('pick').classList.add('on');$('pgrid').querySelector('button').focus()}
function renderPick(){
  const on=NET.on,host=NET.role==='host';let title,sub,foe=null,mine=null,lock=false;
  if(on){title='캐스트 고르기 · 온라인';
    if(host){mine=NET.hostCast;foe=NET.guestCast;lock=!!mine;sub=!mine?'내 캐스트를 먼저 골라.':!foe?'상대가 고르는 중…':'곧 시작!'}
    else{foe=NET.hostCast;mine=NET.guestCast;lock=!foe||!!mine;sub=!foe?'방장이 캐스트를 고르는 중…':!mine?`방장은 ${CASTS[foe].name}. 내 캐스트를 골라.`:'곧 시작!'}}
  else{title=PICK_ME?'상대 캐스트 고르기':'캐스트 고르기';sub=PICK_ME?`${jo(CASTS[PICK_ME].name,'으로','로')} 플레이. 상대는 AI가 맡아.`:'내가 플레이할 캐스트를 골라.';foe=PICK_ME}
  $('pickTitle').textContent=title;$('pickSub').textContent=sub;
  $('pgrid').innerHTML=Object.entries(CASTS).map(([k,c])=>`<button class="pc ${k}${k===foe?' foe':''}${k===mine?' mine':''}" data-k="${k}" ${lock&&k!==mine?'disabled':''}><img src="img/${k}_selfie.jpg" alt="${c.name}"><span class="pi"><span class="pn">${c.name}<small>${c.handle}</small><span class="pdeck" role="button" tabindex="0" data-deck="${k}" aria-label="${c.name} 덱 보기" title="덱 보기"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3" width="12" height="16" rx="2.5"/><rect x="4" y="6" width="12" height="16" rx="2.5"/></svg></span></span><span class="ab">${c.abil}</span></span></button>`).join('')
;
  $('pBack').hidden=!(!on&&PICK_ME);
}
$('rounds').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||NET.role==='guest')return;MATCH=+b.dataset.r;
  $('rounds').querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-checked',on)})});
$('pBack').addEventListener('click',e=>{e.stopPropagation();PICK_ME=null;renderPick()});
$('diff').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.id==='pBack')return;DIFF=b.dataset.d;
  $('diff').querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-checked',on)})});
$('olHost').addEventListener('click',netHost);
$('olJoin').addEventListener('click',netJoin);
$('olCode').addEventListener('keydown',e=>{if(e.key==='Enter')netJoin()});
$('pgrid').addEventListener('keydown',e=>{const d=e.target.closest('.pdeck');if(d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();previewDeck(d.dataset.deck,d)}});
$('pgrid').addEventListener('click',e=>{
  {const d=e.target.closest('.pdeck');if(d){e.stopPropagation();previewDeck(d.dataset.deck,d.closest('.pc'));return}}
  const b=e.target.closest('.pc');if(!b||b.disabled)return;const k=b.dataset.k;
  if(NET.on){
    if(NET.role==='host'&&!NET.hostCast&&k!==NET.guestCast){NET.hostCast=k;NET.send({t:'hostcast',k});renderPick();netTryStart()}
    else if(NET.role==='guest'&&NET.hostCast&&!NET.guestCast&&k!==NET.hostCast){NET.guestCast=k;NET.send({t:'cast',k});renderPick()}
    return;
  }
  if(!PICK_ME){PICK_ME=k;renderPick();$('pgrid').querySelector('.pc:not(.foe)').focus();return}
  const me=PICK_ME,ai=k;if(ai===me)return;
  SEAT=[me,ai];seatSetup();newGame();
});

// 판 진행: 뽑기·내기·턴·판 끝
function freshPlayer(p){return{def:DECK[p],deck:shuffle(DECK[p].map(c=>({...c}))),hand:[],played:[],skip:false,snipe:false,capture:false,extraNext:0,plays:0,usedOnce:false,photoUsed:false,photoCount:0,used:[],known:[],out:[],soothe:false,press:false,adjUsed:false,lastV:null,lastP:null,matchCount:0}}
function draw(p,n){const P=G.P[p];for(let i=0;i<n;i++){if(!P.deck.length&&P.used.length){P.deck=shuffle(P.used);P.used=[];log(`${NAME[p]} 덱을 다 써서 낸 카드를 다시 섞음`,p?'ai':'me')}if(!P.deck.length)return;P.hand.push(P.deck.pop())}}
function log(msg,cls='sys',local){if(!local)NET.ev({t:'log',msg,cls});const d=document.createElement('div');d.className='note'+(cls==='sys'?' hot':'');d.textContent=msg;const f=$('feed');f.prepend(d);while(f.children.length>40)f.lastChild.remove();f.scrollTop=0}

// 규칙은 rules.js 하나에 있다. 여기선 지금 판(G)과 캐스트 능력(ABS)을 넘겨 부른다
const ABS=()=>[CASTS[SEAT[0]],CASTS[SEAT[1]]];
const valOf=(p,c,ch)=>RULES.valOf(G,p,c,ch);
const okV=RULES.okV;
const playable=(p,c)=>RULES.playable(G,p,c);
const anyPlayable=p=>G.P[p].hand.some(c=>playable(p,c));

function render(){
  NET.state();
  $('roundPill').textContent=G.over?'최종':G.rounds===1?'단판':`${Math.max(G.round,1)} / ${G.rounds}판`;
  $('sMe').textContent=G.score[ME];$('sAi').textContent=G.score[AI];
  $('sbDots').innerHTML=Array.from({length:G.rounds||5},(_,k)=>{const h=G.hist[k];
    if(h)return h.w===null?'<i class="d" title="무승부">–</i>':`<i class="${h.w===ME?'m':'a'}" title="${NAME[h.w]} +${h.pts}">${h.pts}</i>`;
    return `<i class="${k===G.round-1&&!G.over?'now':''}"></i>`}).join('');
  {const lead=G.score[ME]-G.score[AI];$('sb').dataset.lead=lead>0?'me':lead<0?'ai':''}
  $('gNum').textContent=G.gauge;$('gTarget').textContent='목표 '+G.target;$('gLeft').textContent=`${G.target-G.gauge} 남음`;
  const base=G.target-31,frac=Math.min(1,Math.max(0,(G.gauge-base)/(G.target-base)));
  $('arc').style.strokeDashoffset=326.7*(1-frac);
  $('arc').style.stroke=G.stake>1?'var(--c)':'var(--m)';
  const vp=(frac*100).toFixed(1)+'%';$('vFill').style.height=vp;$('vNum').style.bottom=vp;$('vNum').textContent=G.gauge;
  $('vTarget').textContent=G.target;{const g=G.target-G.gauge;$('vGap').textContent=g>0?g+'칸':'도달'}$('vStake').textContent=G.stake+'점';
  const vb=$('vbar');vb.classList.toggle('hot',G.stake>1);vb.classList.toggle('near',G.target-G.gauge>0&&G.target-G.gauge<=5&&!G.over);
  const tm=$('turnMini');tm.textContent=G.over?'게임 끝':G.cur===ME?'· 내 차례':`· ${NAME[AI]} 차례`;tm.classList.toggle('wait',G.cur!==ME||G.over);
  {const st=$('stake'),n=G.stake;$('stakeN').textContent=n;st.dataset.t=n>=8?4:n>=4?3:n>=2?2:1;
   const ch=(G.stakeHist||[1]).slice(0,-1).reverse().slice(0,5),T=v=>v>=8?4:v>=4?3:v>=2?2:1;
   {let a=-40*Math.PI/180,pr=68,h='';const R=150;ch.forEach((v,i)=>{const s=[66,52,42,34,28][i];a+=(pr+s/2)*.82/R;pr=s/2;
     h+=`<i data-t="${T(v)}" style="left:${(170+R*Math.cos(a)).toFixed(1)}px;top:${(170+R*Math.sin(a)).toFixed(1)}px;width:${s}px;height:${s}px;--fs:${Math.round(s*.46)}px;--r:${(i%2?-10:10)}deg">${v}</i>`});
    $('stakeChain').innerHTML=h}
   if(render._st!==undefined&&n>render._st){st.classList.remove('up');void st.offsetWidth;st.classList.add('up')}render._st=n}
  const gap=G.target-G.gauge;
  document.querySelector('.ring').classList.toggle('near',gap>0&&gap<=5&&!G.over);
  $('turnLine').textContent=G.over?'게임 끝':G.cur===ME?'내 차례':`${jo(NAME[AI],'이','가')} 고민 중…`;$('turnLine').classList.toggle('wait',G.cur!==ME||G.over);
  // 염탐·저주 인형으로 본 상대 카드는 앞면(숫자)으로 보여 준다
  {const kn=G.P[ME]?G.P[ME].known:[];$('aiBacks').innerHTML=G.P[AI]?G.P[AI].hand.map(c=>kn.includes(c)?`<i class="back seen" title="${c.name}: ${c.text}"><b>${numLabel(c)}</b><em>${c.name}</em></i>`:'<i class="back"></i>').join(''):''}
  $('aiChips').innerHTML=chips(AI);$('meChips').innerHTML=chips(ME);
  const P=G.P[ME];
  $('hand').innerHTML=P?P.hand.map((c,i,arr)=>{
    const v=c.choice||c.lower?undefined:valOf(ME,c,null);
    const picking=$('hand').classList.contains('picking'),can=picking||G.cur===ME&&!G.busy&&!G.over&&playable(ME,c),blk=picking?'':blockedBy(P,c);
    return `<button class="cardb${blk?' blk':''}${picking?' pkme':''}" data-i="${i}" style="--i:${i};--n:${arr.length}" ${can?'':'disabled'} aria-label="${c.name} ${v===undefined?numLabel(c):v}. ${c.text}${blk?` (${blk}으로 막힘)`:''}">${cardHTML(c,{num:v})}${blk?`<span class="blkst">${blk}</span>`:''}</button>`
  }).join(''):'';
  // 저격·휘슬로 막힌 상태: 손패 위 띠로 무엇이 막혔고 언제 풀리는지
  const r=[];if(P&&P.snipe)r.push('<b>저격당함</b> 3 이상 숫자는 못 내');if(P&&P.press)r.push('<b>휘슬</b> 2 이하 숫자는 못 내');
  const rs=$('restrict');rs.innerHTML=r.length?r.join('<i>·</i>')+'<small>내 턴이 끝나면 풀림</small>':'';rs.hidden=!r.length;
}
// 저격·휘슬 때문에만 못 내는 카드인지 (다른 이유로 못 내는 카드는 표시하지 않음)
function blockedBy(P,c){if(!P||!(P.snipe||P.press)||G.over)return'';
  if(RULES.playable({...G,P:[{...P,snipe:false,press:false},G.P[AI]]},0,c)&&!playable(ME,c)){
    if(P.snipe&&RULES.playable({...G,P:[{...P,snipe:false},G.P[AI]]},0,c))return'저격';
    return'휘슬'}
  return''}
function chips(p){
  const P=G.P[p];if(!P)return'';const a=[];
  if(P.snipe)a.push('<span class="chip warn">저격당함: 3 이상 금지</span>');
  if(P.capture)a.push('<span class="chip warn">부적: 다음 카드 +1</span>');
  if(P.skip)a.push(P.rest?'<span class="chip">쉬는 중</span>':'<span class="chip warn">침묵당함</span>');
  if(P.press)a.push('<span class="chip warn">휘슬: 2 이하 금지</span>');
  if(P.soothe)a.push('<span class="chip warn">다독다독: 다음 카드 −1</span>');
  if(CASTS[SEAT[p]].adjust)a.push(`<span class="chip">${CASTS[SEAT[p]].abName} ${P.adjUsed?'사용함':'남음'}</span>`);
  a.push(`<span class="chip">덱 ${P.deck.length}</span>`);
  return a.join('');
}
function pop(){const b=$('gNum');b.classList.add('pop');setTimeout(()=>b.classList.remove('pop'),220)}

const CARD_OPTION_DISMISSED=Symbol('card option dismissed');
let dismissCardOptions=null;
$('modal').addEventListener('click',e=>{
  if(e.target===$('modal'))dismissCardOptions?.();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&dismissCardOptions){
    e.preventDefault();dismissCardOptions();
  }
});
function ask(title,text,opts,cardOptions=false){
  dismissCardOptions?.(false);
  return new Promise(res=>{
    const prev=document.activeElement,m=$('modal'),o=$('mOpts');
    const finish=(value,restore=false)=>{
      dismissCardOptions=null;
      m.classList.remove('on');o.onclick=null;
      if(restore&&prev?.isConnected)prev.focus({preventScroll:true});
      res(value);
    };
    if(cardOptions)dismissCardOptions=(restore=true)=>finish(CARD_OPTION_DISMISSED,restore);
    $('mTitle').textContent=title;$('mText').textContent=text;
    o.innerHTML=opts.map((o,i)=>`<button data-k="${i}" class="${i===0?'main':''}">${o.label}</button>`).join('');
    m.classList.add('on');
    o.onclick=e=>{const b=e.target.closest('button');if(b&&opts[+b.dataset.k])finish(opts[+b.dataset.k].value)};
    o.querySelector('button')?.focus();
  });
}

function showResult(fin,w,wait){
  return new Promise(res=>{
    const[a,b]=[G.score[ME],G.score[AI]],box=$('rBox');setTimeout(()=>w===ME?SFX.win():w===AI?SFX.lose():SFX.click(),120);
    $('rMeImg').src=`img/p/${SEAT[ME]}_av.webp`;$('rAiImg').src=`img/p/${SEAT[AI]}_av.webp`;
    $('rMeName').textContent=NAME[ME];$('rAiName').textContent=NAME[AI];$('rMeSc').textContent=a;$('rAiSc').textContent=b;
    let win=null,title,sub='',note='',kick;
    if(fin){
      kick='';
      if(a!==b)win=a>b?ME:AI;else if(G.wins[ME]!==G.wins[AI]){win=G.wins[ME]>G.wins[AI]?ME:AI;note=`동점! 저스트 ${G.wins[ME]} : ${G.wins[AI]}로 승부가 갈렸다`}
      title=win===null?'무승부':win===ME?'승리!':'패배…';
    }else{
      const h=G.hist[G.hist.length-1];kick=`${G.round}판 결과`;win=w;
      title=w===null?'무승부':'저스트!';
      sub=w===null?'둘 다 낼 카드가 없어서 이 판은 비겼다':`${NAME[w]} +${h.pts}점${h.busts?` · 버스트 ${h.busts}번 묻고 더블`:''}`;
      if(wait)note='상대가 다음 판을 열 때까지 기다려줘';
    }
    $('rKick').textContent=kick;$('rTitle').textContent=title;$('rSub').textContent=sub;$('rNote').textContent=note;
    box.dataset.res=win===null?'draw':win===ME?'win':'lose';box.classList.toggle('fin',fin);
    $('rMe').classList.toggle('won',win===ME);$('rAi').classList.toggle('won',win===AI);
    {const N=G.rounds||5;$('rRounds').style.cssText=`grid-template-columns:repeat(${N},minmax(0,1fr));max-width:${N*90}px`}
    $('rRounds').innerHTML=Array.from({length:G.rounds||5},(_,k)=>{const h=G.hist[k];
      if(!h)return `<li class="e"><span>${k+1}판</span><em>—</em></li>`;
      const c=h.w===null?'d':h.w===ME?'m':'a',who=h.w===null?'무승부':NAME[h.w];
      return `<li class="${c}${k===G.hist.length-1&&!fin?' last':''}"><span>${k+1}판</span>${h.w===null?'':`<img src="img/p/${SEAT[h.w]}_av.webp" alt="">`}<em>${who}</em><b>${h.w===null?'':'+'+h.pts}</b>${h.busts?`<i>버스트×${h.busts}</i>`:''}</li>`}).join('');
    $('rGo').textContent=fin?'다시 하기':wait?'확인':'다음 판';
    $('res').classList.add('on');$('rGo').focus();
    $('rGo').onclick=()=>{$('res').classList.remove('on');res()};
  });
}
function newGame(){if(typeof Talk!=='undefined')Talk.reset();G.gid=(G.gid||0)+1;G.rounds=MATCH;G.round=0;G.score=[0,0];G.wins=[0,0];G.hist=[];G.over=false;G.starter=Math.random()<.5?ME:AI;newRound()}
function newRound(){
  G.round++;G.P=[freshPlayer(ME),freshPlayer(AI)];draw(ME,5);draw(AI,5);
  G.gauge=0;G.target=31;G.stake=1;G.nearSnd=0;G.stakeHist=[1];G.passes=0;G.busts=0;G.cur=G.starter;$('feed').innerHTML='';NET.ev({t:'clear'});
  log(`— ${G.round}판 시작. ${NAME[G.cur]} 선공 —`);
  if(typeof Talk!=='undefined')Talk.say(G.round===1?'start':G.round===G.rounds?'last':'round'+G.round);
  startTurn();
}

async function startTurn(){
  if(G.over)return;
  render();const p=G.cur,P=G.P[p];
  if(P.skip){P.skip=false;log(P.rest?`${NAME[p]} 이번 차례는 쉰다 (맡길게요)`:`${NAME[p]} 차례는 침묵의 주문에 걸려 건너뜀`,p?'ai':'me');P.rest=false;return next(p)}
  {const c=RULES.turnStart(G,ABS(),p);if(c)log(`${CASTS[SEAT[1-p]].abName}: ${NAME[p]} 손패 「${c.name}」 버림`,p?'ai':'me')}
  if(!anyPlayable(p)){
    log(`${NAME[p]} 낼 카드가 없어서 패스`,p?'ai':'me');draw(p,1);G.passes++;P.snipe=false;P.press=false;
    if(G.passes>=2){log('둘 다 패스. 이 판은 무승부');await sleep(500);return endRound(null)}
    return next(p);
  }
  G.passes=0;render();
  if(p===AI&&!NET.on){const id=G.gid;await sleep(750);if(G.over||id!==G.gid)return;aiAct()}
}
function next(p){G.cur=1-p;const id=G.gid;setTimeout(()=>{if(id===G.gid)startTurn()},p===AI?250:400)}
function endTurn(p){const P=G.P[p];draw(p,1);P.snipe=false;P.press=false;next(p)}

async function play(p,idx,choice,adj=0){
  G.busy=true;const P=G.P[p],cls=p?'ai':'me',AB=ABS();
  const card=P.hand.splice(idx,1)[0];P.played.push(card.id);P.used.push(card);
  let v=valOf(p,card,choice);if(!card.lower){P.capture=false;P.soothe=false}
  if(adj){v+=adj;P.adjUsed=true;log(`${CASTS[SEAT[p]].abName}: ${NAME[p]} 숫자 ${adj>0?'+1':'−1'}`,cls)}
  for(const[e,c]of RULES.onPlayed(G,AB,p,card,v,draw)){
    if(e==='revMom')log(`흉조: ${NAME[1-p]} 손패 「${c.name}」 버림`,cls);
    if(e==='mirror')log(`받아주기: ${NAME[p]} 1장 뽑음`,cls);
    if(e==='momentum')log(`기세 올려!: ${NAME[p]} 1장 뽑음`,cls);
  }
  const ng=Math.max(0,G.gauge+v);
  G.gauge=ng;if(card.photo)P.photoCount++;pop();render();
  const postEl=addPost(p,card,v);
  if(ng>=25&&ng<G.target){if(!G.nearSnd){G.nearSnd=1;SFX.near()}if(typeof Talk!=='undefined')Talk.say('near')}

  if(ng===G.target&&!card.nofinish){if(card.fixed){G.stake+=2;log(`노필터 셀카로 저스트! 판돈 +2 → ${G.stake}점`,cls);render()}if(typeof Talk!=='undefined')Talk.say(p===ME?'justMe':'justOp');bigHit(G.target);await sleep(2600);G.busy=false;return endRound(p)}
  if(ng>G.target||(ng===G.target&&card.nofinish)){   // 저스트 불가 카드로 목표에 딱 맞으면 버스트
    G.stakeHist=G.stakeHist||[1];const k=RULES.bust(G,AB,card);G.busts+=k;
    const plus=AB.filter(a=>a.bustPlus).length,drawers=[];
    for(const[e,q,c]of RULES.afterBust(G,AB,draw)){if(e==='bustDraw')drawers.push(q);if(e==='bustDiscard')log(`${CASTS[SEAT[q]].abName}: ${NAME[1-q]} 손패 「${c.name}」 버림`,'sys')}
    if(typeof Talk!=='undefined')Talk.say(p===ME?'bustMe':'bustOp');
    bustFx(postEl);render();bigBust(k);await sleep(2300);
    log(`버스트!${k>1?` ${k}연속,`:''} 묻고 ${card.triple?'트리플':'더블'}.${plus?' 흉조로 판돈 +1,':''} 판돈 ${G.stake}점, 목표 ${G.target}.${drawers.map(q=>` ${NAME[q]} 2장 뽑음`).join('')}`);
  }
  // 효과
  for(const[e,c,cv,killed]of RULES.effect(G,p,card,draw)){
    if(e==='regular')log(`단골 손님: ${NAME[p]} 1장 뽑음`,cls);
    if(e==='f4f')log('맞팔 이벤트: 둘 다 1장씩 뽑음',cls);
    if(e==='dm'){const seen=`염탐 결과: ${NAME[1-p]} 손에 「${c.name}」(${deckLabel(c)})`,peek=`${jo(NAME[p],'이','가')} 네 손패 한 장을 훔쳐봤다`;
      if(p===ME){log(seen,cls,1);NET.ev({t:'log',msg:peek,cls});peekShow(c,'염탐 성공')}else{log(peek,cls,1);NET.ev({t:'log',msg:seen,cls})}}
    if(e==='doll'&&p===ME)peekShow(c,killed?'저주 인형: 버리게 함':'저주 인형: 살아남음');
    if(e==='doll')log(killed?`저주 인형: ${NAME[1-p]} 손의 「${c.name}」(${cv}) 버려짐`:`저주 인형: ${NAME[1-p]} 손의 「${c.name}」(${cv})는 살아남음`,cls);
    if(e==='convert')log(`포교: ${NAME[1-p]} 손에서 「${c.name}」 버려짐`,cls);
  }
  if(RULES.PICK[card.id]){   // 고르는 효과: 내 차례면 직접 고르고, AI는 자동으로
    const T={drip:['핸드드립','손에 넣을 카드 한 장을 골라. 나머지는 덱 맨 아래로.'],fortune:['점괘','손에 넣을 카드 한 장을 골라.'],sub:['선수 교체','덱 맨 아래로 보낼 카드를 골라. 그리고 1장 뽑아.'],nail:['네일 자랑','덱 맨 아래로 보낼 카드를 골라. 그리고 2장 뽑아.']}[card.id];
    const o=RULES.pickOpts(G,p,card.id);
    if(o.length){const k=await pickFor(p,T[0],T[1],o.map((c,i)=>({label:`${c.name}(${deckLabel(c)})`,value:i})),()=>RULES.autoPick(G,p,card.id,o),o,RULES.PICK[card.id].hand?'hand':'deck');RULES.pickResolve(G,p,card.id,o,k,draw)}
    else if(RULES.PICK[card.id].hand)draw(p,card.id==='nail'?2:1);
  }
  if(RULES.photoHook(G,AB,p,card,draw))log(`셀카 중독: ${NAME[p]} 1장 뽑음`,cls);
  P.plays--;G.busy=false;render();
  if(P.plays>0&&anyPlayable(p)){if(p===AI&&!NET.on){await sleep(650);aiAct()}return}
  endTurn(p);
}

async function endRound(w){
  const pts=G.stake;
  if(w!==null){G.score[w]+=pts;G.wins[w]++;log(`저스트! ${NAME[w]} ${G.round}판 승리, +${pts}점`)}
  G.hist.push({w,pts:w===null?0:pts,busts:G.busts});
  G.starter=1-G.starter;   // 선후공은 판마다 번갈아
  const fin=G.round>=G.rounds;if(fin)G.over=true;
  render();
  NET.ev({t:'result',final:fin,w});
  if(fin&&window.recordMatch)recordMatch();
  if(fin&&window.afterMatch&&!NET.on)return afterMatch();
  await showResult(fin,w);
  if(fin)return NET.on?toOnline():Screens.go('home');
  newRound();
}

// 상대 손패를 봤을 때: 본 카드를 상대 카드 뒷면 옆에 잠깐 크게 띄운다 (그 뒤로는 뒷면 줄에서 앞면으로 남는다)
function peekShow(c,label){
  const el=document.createElement('div');el.className='peekc';
  el.innerHTML=`<span>${label}</span>${cardHTML(c,{size:'m'})}`;
  $('play').appendChild(el);setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),300)},1800*Math.max(SPEED,.6));
}

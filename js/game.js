// 판 진행: 뽑기·내기·턴·판 끝
function freshPlayer(p){return{deck:shuffle(DECK[p].map(c=>({...c}))),hand:[],played:[],skip:false,snipe:false,capture:false,extraNext:0,plays:0,usedOnce:false,photoUsed:false,photoCount:0,used:[],known:[],out:[],soothe:false,press:false,adjUsed:false,lastV:null,lastP:null,matchCount:0}}
function draw(p,n){const P=G.P[p];for(let i=0;i<n;i++){if(!P.deck.length&&P.used.length){P.deck=shuffle(P.used);P.used=[];log(`${NAME[p]} 덱을 다 써서 낸 카드를 다시 섞음`,p?'ai':'me')}if(!P.deck.length)return;P.hand.push(P.deck.pop())}}
function log(msg,cls='sys',local){if(!local)NET.ev({t:'log',msg,cls});const d=document.createElement('div');d.className='note'+(cls==='sys'?' hot':'');d.textContent=msg;const f=$('feed');f.prepend(d);while(f.children.length>40)f.lastChild.remove();f.scrollTop=0}

function valOf(p,c,ch){
  const P=G.P[p];let v;
  if(c.choice)v=ch;else if(c.lower)v=-ch;
  else if(c.id==='trend')v=G.gauge>=20?4:2;
  else if(c.id==='fourcut')v=P.photoCount>=3?4:1;
  else if(c.id==='reup')v=P.photoCount;else if(c.id==='tiki')v=P.matchCount||0;
  else v=c.v;
  if(P.capture&&!c.lower)v+=1;
  if(P.soothe&&!c.lower)v-=1;
  return v;
}
// 휘슬: 2 이하 금지, 저격: 3 이상 금지
const okV=(P,v,c)=>!(P.snipe&&!c.lower&&v>=3)&&!(P.press&&(c.lower||v<=2));
function playable(p,c){
  const P=G.P[p];
  if(c.reactive)return false;
  if(c.once&&P.usedOnce)return false;
  const d=(P.capture?1:0)-(P.soothe?1:0);
  if(c.choice)return c.choice.some(x=>okV(P,x+d,c));
  if(c.lower)return okV(P,-1,c);
  return okV(P,valOf(p,c,null),c);
}
const anyPlayable=p=>G.P[p].hand.some(c=>playable(p,c));

function render(){
  NET.state();
  $('roundPill').textContent=G.over?'최종':G.rounds===1?'단판':`${Math.max(G.round,1)} / ${G.rounds}판`;
  $('sMe').textContent=G.score[ME];$('sAi').textContent=G.score[AI];
  $('sbDots').innerHTML=Array.from({length:G.rounds||5},(_,k)=>{const h=G.hist[k];
    if(h)return h.w===null?'<i class="d" title="무승부">–</i>':`<i class="${h.w===ME?'m':'a'}" title="${NAME[h.w]} +${h.pts}">${h.pts}</i>`;
    return `<i class="${k===G.round-1&&!G.over?'now':''}"></i>`}).join('');
  {const lead=G.score[ME]-G.score[AI];$('sb').dataset.lead=lead>0?'me':lead<0?'ai':''}
  $('gNum').textContent=G.gauge;$('gTarget').textContent='목표 '+G.target;
  const base=G.target-31,frac=Math.min(1,Math.max(0,(G.gauge-base)/(G.target-base)));
  $('arc').style.strokeDashoffset=326.7*(1-frac);
  $('arc').style.stroke=G.stake>1?'var(--c)':'var(--m)';
  const vp=(frac*100).toFixed(1)+'%';$('vFill').style.height=vp;$('vNum').style.bottom=vp;$('vNum').textContent=G.gauge;
  $('vTarget').textContent=G.target;{const g=G.target-G.gauge;$('vGap').textContent=g>0?g+'칸':'도달'}$('vStake').textContent=G.stake+'점';
  const vb=$('vbar');vb.classList.toggle('hot',G.stake>1);vb.classList.toggle('near',G.target-G.gauge>0&&G.target-G.gauge<=5&&!G.over);
  const tm=$('turnMini');tm.textContent=G.over?'게임 끝':G.cur===ME?'· 내 차례':`· ${NAME[AI]} 차례`;tm.classList.toggle('wait',G.cur!==ME||G.over);
  {const st=$('stake'),n=G.stake;$('stakeN').textContent=n;st.dataset.t=n>=8?4:n>=4?3:n>=2?2:1;
   const ch=G.stakeHist||[1];$('stakeChain').innerHTML=ch.length>1?ch.map(x=>`<i>${x}</i>`).join('<em>→</em>'):'';
   if(render._st!==undefined&&n>render._st){st.classList.remove('up');void st.offsetWidth;st.classList.add('up')}render._st=n}
  const gap=G.target-G.gauge;
  document.querySelector('.ring').classList.toggle('near',gap>0&&gap<=5&&!G.over);
  $('turnLine').textContent=G.over?'게임 끝':G.cur===ME?'내 차례':`${jo(NAME[AI],'이','가')} 고민 중…`;$('turnLine').classList.toggle('wait',G.cur!==ME||G.over);
  $('aiBacks').innerHTML=G.P[AI]?G.P[AI].hand.map(()=>'<i class="back"></i>').join(''):'';
  $('aiChips').innerHTML=chips(AI);$('meChips').innerHTML=chips(ME);
  const P=G.P[ME];
  $('hand').innerHTML=P?P.hand.map((c,i,arr)=>{
    const v=c.choice||c.lower?undefined:valOf(ME,c,null);
    const can=G.cur===ME&&!G.busy&&!G.over&&playable(ME,c);
    return `<button class="cardb" data-i="${i}" style="--i:${i};--n:${arr.length}" ${can?'':'disabled'} aria-label="${c.name} ${v===undefined?numLabel(c):v}. ${c.text}">${cardHTML(c,{num:v})}</button>`
  }).join(''):'';
}
function chips(p){
  const P=G.P[p];if(!P)return'';const a=[];
  if(P.snipe)a.push('<span class="chip warn">저격당함: 3 이상 금지</span>');
  if(P.capture)a.push('<span class="chip warn">부적: 다음 카드 +1</span>');
  if(P.skip)a.push('<span class="chip warn">침묵당함</span>');
  if(P.press)a.push('<span class="chip warn">휘슬: 2 이하 금지</span>');
  if(P.soothe)a.push('<span class="chip warn">다독다독: 다음 카드 −1</span>');
  if(CASTS[SEAT[p]].adjust)a.push(`<span class="chip">${CASTS[SEAT[p]].abName} ${P.adjUsed?'사용함':'남음'}</span>`);
  a.push(`<span class="chip">덱 ${P.deck.length}</span>`);
  return a.join('');
}
function pop(){const b=$('gNum');b.classList.add('pop');setTimeout(()=>b.classList.remove('pop'),220)}

function ask(title,text,opts){
  return new Promise(res=>{
    $('mTitle').textContent=title;$('mText').textContent=text;
    $('mOpts').innerHTML=opts.map((o,i)=>`<button data-k="${i}" class="${i===0?'main':''}">${o.label}</button>`).join('');
    $('modal').classList.add('on');
    $('mOpts').onclick=e=>{const b=e.target.closest('button');if(!b)return;$('modal').classList.remove('on');res(opts[+b.dataset.k].value)};
    $('mOpts').querySelector('button').focus();
  });
}

function showResult(fin,w,wait){
  return new Promise(res=>{
    const[a,b]=[G.score[ME],G.score[AI]],box=$('rBox');
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
function newGame(){G.gid=(G.gid||0)+1;G.rounds=MATCH;G.round=0;G.score=[0,0];G.wins=[0,0];G.hist=[];G.over=false;G.starter=Math.random()<.5?ME:AI;newRound()}
function newRound(){
  G.round++;G.P=[freshPlayer(ME),freshPlayer(AI)];draw(ME,5);draw(AI,5);
  G.gauge=0;G.target=31;G.stake=1;G.stakeHist=[1];G.passes=0;G.busts=0;G.cur=G.starter;$('feed').innerHTML='';NET.ev({t:'clear'});
  log(`— ${G.round}판 시작. ${NAME[G.cur]} 선공 —`);startTurn();
}

async function startTurn(){
  if(G.over)return;
  render();const p=G.cur,P=G.P[p];
  if(P.skip){P.skip=false;log(`${NAME[p]} 차례는 침묵의 주문에 걸려 건너뜀`,p?'ai':'me');return next(p)}
  P.plays=1+P.extraNext;P.extraNext=0;if(CASTS[SEAT[p]].photoDraw)P.photoUsed=false;P.momUsed=false;
  {const cu=CASTS[SEAT[1-p]].curse;if(cu&&P.hand.length>=cu){const c=P.hand.splice(Math.random()*P.hand.length|0,1)[0];P.used.push(c);log(`${CASTS[SEAT[1-p]].abName}: ${NAME[p]} 손패 「${c.name}」 버림`,p?'ai':'me')}}
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
  G.busy=true;const P=G.P[p],O=G.P[1-p],cls=p?'ai':'me';
  const card=P.hand.splice(idx,1)[0];P.played.push(card.id);P.used.push(card);
  let v=valOf(p,card,choice);if(!card.lower){P.capture=false;P.soothe=false}
  if(adj){v+=adj;P.adjUsed=true;log(`${CASTS[SEAT[p]].abName}: ${NAME[p]} 숫자 ${adj>0?'+1':'−1'}`,cls)}
  {const OP=G.P[1-p],rm=CASTS[SEAT[p]].revMom;if(rm&&P.lastP!==null&&v<=P.lastP-rm&&OP.hand.length){const c=OP.hand.splice(Math.random()*OP.hand.length|0,1)[0];OP.used.push(c);log(`흉조: ${NAME[1-p]} 손패 「${c.name}」 버림`,cls)}}
  {const OP=G.P[1-p];if(OP.lastP!==null&&v===OP.lastP)P.matchCount=(P.matchCount||0)+1;if(CASTS[SEAT[p]].mirror&&OP.lastP!==null&&v===OP.lastP){draw(p,1);log(`받아주기: ${NAME[p]} 1장 뽑음`,cls)}P.lastP=v}
  if(CASTS[SEAT[p]].momentum&&!card.lower){if(P.lastV!==null&&v>=P.lastV+2&&!P.momUsed){P.momUsed=true;draw(p,1);log(`기세 올려!: ${NAME[p]} 1장 뽑음`,cls)}P.lastV=v}
  const prev=G.gauge,ng=Math.max(0,prev+v);
  G.gauge=ng;if(card.photo)P.photoCount++;pop();render();
  const postEl=addPost(p,card,v);

  if(ng===G.target&&!card.nofinish){bigHit(G.target);await sleep(2600);G.busy=false;return endRound(p)}
  if(ng>G.target||(ng===G.target&&card.nofinish)){   // 저스트 불가 카드로 목표에 딱 맞으면 버스트
    // 목표가 열기보다 위로 올라갈 때까지 연속으로 버스트
    const plus=SEAT.filter(k=>CASTS[k].bustPlus).length;let k=0;
    do{const mult=k===0&&card.triple?3:2;G.stake=G.stake*mult+plus;G.target+=10;G.busts++;(G.stakeHist=G.stakeHist||[1]).push(G.stake);k++}while(G.gauge>=G.target);
    const drawers=[ME,AI].filter(q=>CASTS[SEAT[q]].bustDraw);drawers.forEach(q=>draw(q,CASTS[SEAT[q]].bustDraw));
    [ME,AI].forEach(q=>{const H=G.P[1-q];if(CASTS[SEAT[q]].bustDiscard&&H.hand.length){const c=H.hand.splice(Math.random()*H.hand.length|0,1)[0];H.used.push(c);log(`${CASTS[SEAT[q]].abName}: ${NAME[1-q]} 손패 「${c.name}」 버림`,'sys')}});
    bustFx(postEl);render();bigBust(k);await sleep(2300);
    log(`버스트!${k>1?` ${k}연속,`:''} 묻고 ${card.triple?'트리플':'더블'}.${plus?' 흉조로 판돈 +1,':''} 판돈 ${G.stake}점, 목표 ${G.target}.${drawers.map(q=>` ${NAME[q]} 2장 뽑음`).join('')}`);
  }
  // 효과
  if(card.draw)draw(p,card.draw);
  if(card.extra)P.plays++;
  switch(card.id){
    case'tea':P.extraNext=1;break;
    case'calm':O.soothe=true;break;
    case'whistle':O.press=true;break;
    case'regular':if(P.hand.length<=3){draw(p,1);log(`단골 손님: ${NAME[p]} 1장 뽑음`,cls)}break;
    case'drip':{const top=P.deck.splice(-2);if(top.length){
      let k;const gap=G.target-G.gauge;
      k=await pickFor(p,'핸드드립','덱 위 2장 중 1장을 손에 넣어. 나머지는 덱 맨 아래로.',top.map((c,i)=>({label:`${c.name}(${deckLabel(c)})`,value:i})),()=>{let k=top.findIndex(c=>c.v===gap);if(k<0)k=top.reduce((b,c,i)=>c.v>top[b].v&&c.v<=gap?i:b,0);return k});
      P.hand.push(top.splice(k,1)[0]);P.deck.unshift(...top);}break}
    case'sub':{
      if(P.hand.length){
        let k;
        k=await pickFor(p,'선수 교체','덱 맨 아래로 보낼 카드를 골라.',P.hand.map((c,i)=>({label:`${c.name}(${deckLabel(c)})`,value:i})),()=>P.hand.reduce((b,c,i)=>c.v>P.hand[b].v?i:b,0));
        P.deck.unshift(P.hand.splice(k,1)[0]);
      }
      draw(p,1);break;}
    case'nail':{
      if(P.hand.length){
        let k;
        k=await pickFor(p,'네일 자랑','덱 맨 아래로 보낼 카드를 골라.',P.hand.map((c,i)=>({label:`${c.name}(${deckLabel(c)})`,value:i})),()=>P.hand.reduce((b,c,i)=>c.v>P.hand[b].v?i:b,0));
        P.deck.unshift(P.hand.splice(k,1)[0]);
      }
      draw(p,2);break;}
    case'f4f':draw(p,1);draw(1-p,1);log('맞팔 이벤트: 둘 다 1장씩 뽑음',cls);break;
    case'dm':if(O.hand.length){const c=O.hand[Math.random()*O.hand.length|0];P.known.push(c);
      const seen=`염탐 결과: ${NAME[1-p]} 손에 「${c.name}」(${deckLabel(c)})`,peek=`${jo(NAME[p],'이','가')} 네 손패 한 장을 훔쳐봤다`;
      if(p===ME){log(seen,cls,1);NET.ev({t:'log',msg:peek,cls})}else{log(peek,cls,1);NET.ev({t:'log',msg:seen,cls})}}break;
    case'snipe':O.snipe=true;break;
    case'charm':O.capture=true;break;
    case'silence':O.skip=true;P.usedOnce=true;break;
    case'doll':if(O.hand.length){const k=Math.random()*O.hand.length|0,c=O.hand[k];
      const cv=c.choice?Math.max(...c.choice):c.lower?0:valOf(1-p,c,null);
      if(cv>=3){O.hand.splice(k,1);P.out.push(c.id);log(`저주 인형: ${NAME[1-p]} 손의 「${c.name}」(${cv}) 버려짐`,cls)}
      else{P.known.push(c);log(`저주 인형: ${NAME[1-p]} 손의 「${c.name}」(${cv})는 살아남음`,cls)}}break;
    case'convert':if(O.hand.length){const c=O.hand.splice(Math.random()*O.hand.length|0,1)[0];P.out.push(c.id);log(`포교: ${NAME[1-p]} 손에서 「${c.name}」 버려짐`,cls)}break;
    case'fortune':{const top=P.deck.splice(-3);if(top.length){
      const gap=G.target-G.gauge;
      const k=await pickFor(p,'점괘','덱 위 3장 중 1장을 손에 넣어.',top.map((c,i)=>({label:`${c.name}(${deckLabel(c)})`,value:i})),()=>{let k=top.findIndex(c=>c.v===gap);if(k<0)k=top.reduce((b,c,i)=>c.v>top[b].v&&c.v<=gap?i:b,0);return k});
      P.hand.push(top.splice(k,1)[0]);P.deck.push(...top);}break}
  }
  if(CASTS[SEAT[p]].photoDraw&&card.photo&&!P.photoUsed){P.photoUsed=true;draw(p,1);log(`셀카 중독: ${NAME[p]} 1장 뽑음`,cls)}
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
  if(fin&&window.afterMatch&&!NET.on)return afterMatch();
  await showResult(fin,w);
  if(fin)return showPick();
  newRound();
}

// 게임 규칙 (순수 함수). 실제 대전(game.js), AI(ai.js), 판 시뮬레이터(sim.js)가 모두 이것 하나를 쓴다.
// R: {P:[플레이어,플레이어], gauge, target, stake}  AB: [내 캐스트 능력, 상대 캐스트 능력]
const RULES=(()=>{
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const rndOut=H=>H.hand.splice(Math.random()*H.hand.length|0,1)[0];

/* ---------- 숫자 ---------- */
// 상황에 따라 숫자가 바뀌는 카드
const curV=(P,c,g)=>c.id==='trend'?(g>=20?4:2):c.id==='fourcut'?(P.photoCount>=3?4:1):c.id==='reup'?P.photoCount:c.id==='tiki'?(P.matchCount||0):c.v;
function valOf(R,p,c,ch){
  const P=R.P[p];let v=c.choice?ch:c.lower?-ch:curV(P,c,R.gauge);
  if(P.capture&&!c.lower&&!c.fixed)v+=1;
  if(P.soothe&&!c.lower&&!c.fixed)v-=1;
  return v;
}
// 휘슬: 2 이하 금지, 저격: 3 이상 금지
const okV=(P,v,c)=>!(P.snipe&&!c.lower&&v>=3)&&!(P.press&&(c.lower||v<=2));
const dOf=(P,c)=>c&&c.fixed?0:(P.capture?1:0)-(P.soothe?1:0);
function playable(R,p,c){
  const P=R.P[p];
  if(c.reactive)return false;
  if(c.once&&P.usedOnce)return false;
  if(c.choice)return c.choice.some(x=>okV(P,x+dOf(P),c));
  if(c.lower)return okV(P,-1,c);
  return okV(P,valOf(R,p,c,null),c);
}

/* ---------- 턴 시작 ---------- */
// 낼 횟수를 채우고, 상대 저주를 처리한다. 저주로 버린 카드를 돌려준다
function turnStart(R,AB,p){
  const P=R.P[p];
  P.plays=1+P.extraNext;P.extraNext=0;if(AB[p].photoDraw)P.photoUsed=false;P.momUsed=false;
  const cu=AB[1-p].curse;
  if(cu&&P.hand.length>=cu){const c=rndOut(P);(P.used=P.used||[]).push(c);return c}
  return null;
}

/* ---------- 카드를 낸 직후 캐스트 능력 ---------- */
// 흉조(버리게 함), 받아주기, 기세 올려! 일어난 일을 [종류, 카드] 목록으로 돌려준다
function onPlayed(R,AB,p,card,v,draw){
  const P=R.P[p],O=R.P[1-p],ev=[];
  if(AB[p].revMom&&P.lastP!=null&&v<=P.lastP-AB[p].revMom&&O.hand.length){const c=rndOut(O);(O.used=O.used||[]).push(c);ev.push(['revMom',c])}
  if(O.lastP!=null&&v===O.lastP)P.matchCount=(P.matchCount||0)+1;
  if(AB[p].mirror&&O.lastP!=null&&v===O.lastP){draw(p,1);ev.push(['mirror'])}
  P.lastP=v;
  if(AB[p].momentum&&!card.lower){if(P.lastV!=null&&v>=P.lastV+2&&!P.momUsed){P.momUsed=true;draw(p,1);ev.push(['momentum'])}P.lastV=v}
  return ev;
}

/* ---------- 버스트 ---------- */
// 목표가 게이지보다 위로 올라갈 때까지 연속으로 묻고 더블. 연속 횟수를 돌려준다
function bust(R,AB,card){
  const plus=(AB[0].bustPlus?1:0)+(AB[1].bustPlus?1:0);let k=0;
  do{R.stake=R.stake*(k===0&&card.triple?3:2)+plus;R.target+=10;if(R.stakeHist)R.stakeHist.push(R.stake);k++}while(R.gauge>=R.target);
  return k;
}
// 버스트가 났을 때 캐스트 능력(뽑기·버리게 하기)
function afterBust(R,AB,draw){
  const ev=[];
  for(const q of[0,1]){
    if(AB[q].bustDraw){draw(q,AB[q].bustDraw);ev.push(['bustDraw',q])}
    const H=R.P[1-q];if(AB[q].bustDiscard&&H.hand.length){const c=rndOut(H);(H.used=H.used||[]).push(c);ev.push(['bustDiscard',q,c])}
  }
  return ev;
}

/* ---------- 카드 효과 ---------- */
// 고르는 효과는 따로: 덱 위에서 고르기(핸드드립·점괘), 손패에서 고르기(선수 교체·네일 자랑)
const PICK={drip:{deck:2},fortune:{deck:3},sub:{hand:1},nail:{hand:1}};
function pickOpts(R,p,id){const P=R.P[p],k=PICK[id];return k.deck?P.deck.splice(-k.deck):P.hand}
function autoPick(R,p,id,opts){
  if(PICK[id].hand)return opts.reduce((b,c,i)=>c.v>opts[b].v?i:b,0);   // 가장 큰 숫자를 내려보낸다
  const gap=R.target-R.gauge;let k=opts.findIndex(c=>c.v===gap);
  if(k<0)k=opts.reduce((b,c,i)=>c.v>opts[b].v&&c.v<=gap?i:b,0);return k;
}
function pickResolve(R,p,id,opts,k,draw){
  const P=R.P[p];
  if(id==='drip'){P.hand.push(opts.splice(k,1)[0]);P.deck.unshift(...opts)}
  else if(id==='fortune'){P.hand.push(opts.splice(k,1)[0]);P.deck.push(...opts)}
  else{if(P.hand.length)P.deck.unshift(P.hand.splice(k,1)[0]);draw(p,id==='nail'?2:1)}
}
// 나머지 효과. 일어난 일을 [종류, ...] 목록으로 돌려준다
function effect(R,p,card,draw){
  const P=R.P[p],O=R.P[1-p],ev=[];
  if(card.draw)draw(p,card.draw);
  if(card.extra)P.plays++;
  switch(card.id){
    case'tea':P.extraNext=1;break;
    case'entrust':P.skip=true;P.rest=true;break;
    case'rematch':{const h=R.hist&&R.hist[R.hist.length-1];if(h&&h.w===1-p){P.plays++;ev.push(['rematch'])}}break;
    case'calm':O.soothe=true;break;
    case'whistle':O.press=true;break;
    case'regular':if(P.hand.length<=3){draw(p,1);ev.push(['regular'])}break;
    case'f4f':draw(p,1);draw(1-p,1);ev.push(['f4f']);break;
    case'snipe':O.snipe=true;break;
    case'charm':O.capture=true;break;
    case'silence':O.skip=true;P.usedOnce=true;break;
    case'dm':if(O.hand.length){const c=O.hand[Math.random()*O.hand.length|0];P.known.push(c);ev.push(['dm',c])}break;
    case'doll':if(O.hand.length){const k=Math.random()*O.hand.length|0,c=O.hand[k];
      const cv=c.choice?Math.max(...c.choice):c.lower?0:valOf(R,1-p,c,null);
      if(cv>=3){O.hand.splice(k,1);P.out.push(c.id);ev.push(['doll',c,cv,true])}else{P.known.push(c);ev.push(['doll',c,cv,false])}}break;
    case'convert':if(O.hand.length){const c=rndOut(O);P.out.push(c.id);ev.push(['convert',c])}break;
  }
  return ev;
}
// 셀카 중독: 이번 턴 첫 사진 포스트면 1장
function photoHook(R,AB,p,card,draw){const P=R.P[p];if(AB[p].photoDraw&&card.photo&&!P.photoUsed){P.photoUsed=true;draw(p,1);return true}return false}

/* ---------- AI 판단 ---------- */
// 상대(1-me)가 다음 차례에 gap을 딱 맞출 확률. mem: 본 카드·버리게 한 카드를 기억(어려움)
function oppWin(R,AB,me,gap,gAfter,mem){
  const H=R.P[1-me];if(H.skip||gap<=0)return 0;
  const add=dOf(H),ad=AB&&!H.adjUsed&&AB[1-me].adjust||0;
  const hit=c=>{if(c.reactive||c.lower||c.nofinish)return false;
    const base=(c.choice||[curV(H,c,gAfter)]).map(x=>x+add);
    const vs=ad?base.flatMap(x=>[x,x+ad]):base;return vs.some(v=>v===gap&&okV(H,v,c))};
  let pool=H.def.filter(c=>!H.played.includes(c.id));let h=H.hand.length;if(!h)return 0;
  if(mem){const M=R.P[me];M.known=M.known.filter(k=>H.hand.includes(k));
    if(M.known.some(hit))return 1;const kid=M.known.map(k=>k.id);pool=pool.filter(c=>!kid.includes(c.id)&&!M.out.includes(c.id));h-=M.known.length;if(h<=0)return 0}
  const N=pool.length;if(!N)return 0;const n=pool.filter(hit).length;
  return 1-Math.pow((N-n)/N,Math.min(h,N));
}
// 상대 손패가 전부 '나한테 끝낼 칸을 주는 카드'일 확률
function squeeze(R,me,gap,ng,RR){
  const H=R.P[1-me];let pool=H.def.filter(c=>!H.played.includes(c.id)&&!c.reactive);let h=H.hand.length;
  const M=R.P[me];const known=(M.known||[]).filter(k=>H.hand.includes(k));
  const vOf=c=>c.choice||(c.lower?c.lower.map(x=>-x):[curV(H,c,ng)]);
  const safe=c=>vOf(c).some(x=>x!==gap&&!RR.has(gap-x));
  if(known.some(safe))return 0;
  const kid=known.map(k=>k.id);pool=pool.filter(c=>!kid.includes(c.id)&&!(M.out||[]).includes(c.id));h-=known.length;
  const N=pool.length;if(!N||h<=0)return known.length?1:0;
  const sc=pool.filter(safe).length;return Math.pow((N-sc)/N,Math.min(h,N));
}
// 손패로 한 턴에 낼 수 있는 숫자들 (연사·리포스트 연결 포함)
function reachOf(P,hand,gAfter){
  const vals=hand.map(c=>c.reactive||c.lower||c.nofinish?[]:c.choice||[curV(P,c,gAfter)]);
  const S=new Set();hand.forEach((c,i)=>{vals[i].forEach(x=>S.add(x));if(!c.extra)return;
    hand.forEach((d,j)=>{if(j===i)return;vals[i].forEach(x=>vals[j].forEach(y=>S.add(x+y)));
      if(d.extra)hand.forEach((e,k)=>{if(k===i||k===j)return;vals[i].forEach(x=>vals[j].forEach(y=>vals[k].forEach(z=>S.add(x+y+z))))})})});
  return S;
}
const isStall=c=>!c.reactive&&(c.lower||c.v<=0||(c.choice&&c.choice.includes(0)));
const widen=(S,d)=>{if(!d)return S;const T=new Set(S);S.forEach(x=>T.add(x+d));return T};
const BONUS={scoop:-4,story:8,vlog:8,hilite:8,nail:6,burst:9,repost:9,snipe:10,charm:8,doll:10,convert:12,fortune:8,f4f:2,dm:2,ward:4,drip:8,calm:6,tea:7,regular:4,whistle:10,court:8,jog:9,sub:5};
// 낼 수 있는 모든 수에 점수를 매긴다. o.full: 손패 연결까지 보는 계산, o.mem: 카드 기억, o.sq: 손패 몰이 가중치
function scoreMoves(R,AB,p,o={}){
  const P=R.P[p],full=!!o.full,cand=[];
  const AD=!P.adjUsed&&AB[p].adjust||0,MO=AB[p].momentum,MI=AB[p].mirror?R.P[1-p].lastP:null,RM=AB[p].revMom;
  const ow=(gap,ng)=>oppWin(R,AB,p,gap,ng,o.mem);
  P.hand.forEach((c,i)=>{
    if(!playable(R,p,c))return;
    for(const ch of c.choice||c.lower||[null]){
    if(c.choice&&!okV(P,ch+dOf(P),c))continue;
    for(const adj of AD&&!c.lower&&!c.fixed?[0,AD]:[0]){
      const v=valOf(R,p,c,ch)+adj;if(adj&&!okV(P,v,c))continue;const ng=Math.max(0,R.gauge+v);let s;
      const bust=ng>R.target||(ng===R.target&&!!c.nofinish);
      if(ng===R.target&&!c.nofinish)s=10000;
      else if(bust){let nt=R.target,k=0;do{nt+=10;k++}while(ng>=nt);const m=(c.triple?3:2)*2**(k-1),gap=nt-ng;
        s=-140*ow(gap,ng)*m-15*m+(AB[p].bustDraw?12:0)+(!full&&ow(R.target-R.gauge,R.gauge)>.5?60:0)}   // 단순 계산: 질 것 같으면 판부터 키운다
      else if(full){const gap=R.target-ng;let risk;
        const FL={charm:'capture',calm:'soothe',whistle:'press'}[c.id];if(FL){const H=R.P[1-p],keep=H[FL];H[FL]=true;risk=ow(gap,ng);H[FL]=keep}else risk=ow(gap,ng);
        if(c.id==='silence')risk=0;if(c.id==='snipe')risk*=.35;s=-100*risk;if(gap===0)s-=150;
        const rest=P.hand.filter((_,j)=>j!==i);const RR=widen(reachOf(P,rest,ng),adj?0:AD);if(RR.has(gap))s+=18;
        let cov=0;for(let k=1;k<=6;k++)if(RR.has(k))cov++;s+=4*cov;if(rest.some(isStall))s+=5;if(o.sq&&gap>0&&gap<=12)s+=o.sq*squeeze(R,p,gap,ng,RR)}
      else{const gap=R.target-ng;let risk=ow(gap,ng);if(c.id==='silence')risk=0;if(c.id==='snipe')risk*=.35;s=-100*risk;   // 단순 계산: 멀면 큰 숫자부터 턴다
        const rest=P.hand.filter((_,j)=>j!==i);if(rest.some(x=>x.v===gap))s+=18;if(gap>12)s+=Math.max(0,v)*1.2;
        if(gap>12&&v<=2&&!c.draw&&!c.extra)s-=6}
      s+=BONUS[c.id]||0;if(c.id==='silence')s-=R.target-R.gauge>10?25:0;
      if(adj&&s<10000)s-=8;if(MO&&!c.lower&&!P.momUsed&&P.lastV!=null&&v>=P.lastV+2)s+=7;if(MI!=null&&v===MI)s+=7;if(RM&&P.lastP!=null&&v<=P.lastP-RM)s+=7;
      s+=Math.random()*3;cand.push({i,ch,adj,s,bust});
    }}
  });
  return cand.sort((a,b)=>b.s-a.s);
}

return{shuffle,curV,valOf,okV,dOf,playable,turnStart,onPlayed,bust,afterBust,PICK,pickOpts,autoPick,pickResolve,effect,photoHook,oppWin,squeeze,reachOf,scoreMoves};
})();
if(typeof module!=='undefined')module.exports={RULES};

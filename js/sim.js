// 판 시뮬레이터(MCE). 어려움 AI와 헤드리스 시뮬이 같이 쓴다.
/* ---------- 어려움 AI용 판 시뮬레이터 (판 끝까지 굴려보기) ---------- */
const MCE=(()=>{
const global={__recycle:true,__diff:['normal','normal'],__cov:true};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function valOf(R,p,c,ch){
  const P=R.P[p];let v;
  if(c.choice)v=ch;else if(c.lower)v=-ch;
  else if(c.id==='trend')v=R.gauge>=20?4:2;
  else if(c.id==='fourcut')v=P.photoCount>=3?4:1;
  else if(c.id==='reup')v=P.photoCount;else if(c.id==='tiki')v=P.matchCount||0;
  else v=c.v;
  if(P.capture&&!c.lower)v+=1;
  if(P.soothe&&!c.lower)v-=1;
  return v;
}
const okV=(P,v,c)=>!(P.snipe&&!c.lower&&v>=3)&&!(P.press&&(c.lower||v<=2));
const dOf=P=>(P.capture?1:0)-(P.soothe?1:0);
function playable(R,p,c){const P=R.P[p];if(c.reactive)return false;if(c.once&&P.usedOnce)return false;
  if(c.choice)return c.choice.some(x=>okV(P,x+dOf(P),c));if(c.lower)return okV(P,-1,c);return okV(P,valOf(R,p,c,null),c)}

function cloneR(R){return{...R,P:R.P.map(P=>({...P,deck:[...P.deck],hand:[...P.hand],played:[...P.played],used:[...(P.used||[])],known:[...(P.known||[])],out:[...(P.out||[])]}))}}
function mkDraw(R){return(p,n)=>{const P=R.P[p];for(let i=0;i<n;i++){if(!P.deck.length&&global.__recycle&&P.used&&P.used.length){P.deck=shuffle(P.used);P.used=[]}if(!P.deck.length)return;P.hand.push(P.deck.pop())}}}
function playLoop(R,AB,S,first){
  const draw=mkDraw(R);
  let guard=0,mid=!!first;
  while(guard++<600){
    const p=R.cur,P=R.P[p],O=R.P[1-p];S.turns++;
    if(!mid){
    if(P.skip){P.skip=false;R.cur=1-p;continue}
    P.plays=1+P.extraNext;P.extraNext=0;if(AB[p].photoDraw)P.photoUsed=false;P.momUsed=false;if(AB[1-p].curse&&P.hand.length>=AB[1-p].curse)(P.used=P.used||[]).push(P.hand.splice(Math.random()*P.hand.length|0,1)[0]);
    if(!P.hand.some(c=>playable(R,p,c))){draw(p,1);R.passes++;P.snipe=false;P.press=false;if(R.passes>=2)return{w:null,busted:R.busted};R.cur=1-p;continue}
    R.passes=0;}
    mid=false;
    while(first||(P.plays>0&&P.hand.some(c=>playable(R,p,c)))){
      let mv;if(first){mv=first;first=null}else mv=ai(R,p);const _opts=P.hand.filter(c=>playable(R,p,c));const _forced=_opts.every(c=>{const vs=c.choice||c.lower?.map(x=>-x)||[valOf(R,p,c,null)];return vs.every(x=>Math.max(0,R.gauge+x)>R.target)});const card=P.hand.splice(mv.i,1)[0];P.played.push(card.id);(P.used=P.used||[]).push(card);S.played[card.id]=(S.played[card.id]||0)+1;
      let v=valOf(R,p,card,mv.ch);if(!card.lower){P.capture=false;P.soothe=false}if(mv.adj){v+=mv.adj;P.adjUsed=true;S.adj=(S.adj||0)+1}if(AB[p].revMom&&P.lastP!=null&&v<=P.lastP-AB[p].revMom&&O.hand.length)(O.used=O.used||[]).push(O.hand.splice(Math.random()*O.hand.length|0,1)[0]);if(O.lastP!=null&&v===O.lastP)P.matchCount=(P.matchCount||0)+1;if(AB[p].mirror&&O.lastP!=null&&v===O.lastP){draw(p,1);S.mir=(S.mir||0)+1}P.lastP=v;if(AB[p].momentum&&!card.lower){if(P.lastV!=null&&v>=P.lastV+2&&!P.momUsed){P.momUsed=true;draw(p,1);S.mom=(S.mom||0)+1}P.lastV=v}
      const prev=R.gauge,ng=Math.max(0,prev+v);R.gauge=ng;
      if(card.photo)P.photoCount++;
      if(ng===R.target&&!card.nofinish)return{w:p,stake:R.stake,card:card.id,busted:R.busted};
      if(ng>R.target||(ng===R.target&&card.nofinish)){
        const si=P.hand.findIndex(c=>c.id==='sorry');
        if(si>=0){S.undo=(S.undo||0)+1;P.hand.splice(si,1);P.hand.push(card);R.gauge=prev;if(card.photo)P.photoCount--;P.plays=0;break}
        {let k=0;do{const m=k===0&&card.triple?3:2;R.stake=R.stake*m+(AB[0].bustPlus?1:0)+(AB[1].bustPlus?1:0);R.target+=10;k++}while(R.gauge>=R.target)}R.busted=true;S.busts++;S.bc=S.bc||{};const _k=(R.gauge-v>R.target?'이미넘침':_forced?'강제':'선택')+':'+card.id;S.bc[_k]=(S.bc[_k]||0)+1;S.bb=S.bb||[0,0];S.bb[p]++;S.maxStake=Math.max(S.maxStake,R.stake);
        for(const q of[0,1]){if(AB[q].bustDraw)draw(q,AB[q].bustDraw);const H=R.P[1-q];if(AB[q].bustDiscard&&H.hand.length)(H.used=H.used||[]).push(H.hand.splice(Math.random()*H.hand.length|0,1)[0])};
      }
      if(card.draw)draw(p,card.draw);
      if(card.extra)P.plays++;
      switch(card.id){
        case'tea':P.extraNext=1;break;
        case'calm':O.soothe=true;break;
        case'whistle':O.press=true;break;
        case'regular':if(P.hand.length<=3)draw(p,1);break;
        case'drip':{const top=P.deck.splice(-2);if(top.length){const gap=R.target-R.gauge;let k=top.findIndex(c=>c.v===gap);if(k<0)k=top.reduce((b,c,i)=>c.v>top[b].v&&c.v<=gap?i:b,0);P.hand.push(top.splice(k,1)[0]);P.deck.unshift(...top)}break}
        case'sub':if(P.hand.length){const k=P.hand.reduce((b,c,i)=>c.v>P.hand[b].v?i:b,0);P.deck.unshift(P.hand.splice(k,1)[0])}draw(p,1);break;
        case'scoop_instant':{R.stake=R.stake*2+(AB[0].bustPlus?1:0)+(AB[1].bustPlus?1:0);R.busted=true;S.busts++;S.bc=S.bc||{};const _k=(R.gauge-v>R.target?'이미넘침':_forced?'강제':'선택')+':'+card.id;S.bc[_k]=(S.bc[_k]||0)+1;S.bb=S.bb||[0,0];S.bb[p]++;S.maxStake=Math.max(S.maxStake,R.stake);for(const q of[0,1]){if(AB[q].bustDraw)draw(q,AB[q].bustDraw);const H=R.P[1-q];if(AB[q].bustDiscard&&H.hand.length)(H.used=H.used||[]).push(H.hand.splice(Math.random()*H.hand.length|0,1)[0])};break}
        case'nail':if(P.hand.length){const k=P.hand.reduce((b,c,i)=>c.v>P.hand[b].v?i:b,0);P.deck.unshift(P.hand.splice(k,1)[0])}draw(p,2);break;
        case'f4f':draw(p,1);draw(1-p,1);break;
        case'snipe':O.snipe=true;break;case'charm':O.capture=true;break;
        case'silence':O.skip=true;P.usedOnce=true;break;
        case'doll':if(O.hand.length){const k=Math.random()*O.hand.length|0;{const c=O.hand[k];const cv=c.choice?Math.max(...c.choice):c.lower?0:valOf(R,1-p,c,null);if(cv>=3){O.hand.splice(k,1);P.out.push(c.id)}else P.known.push(c)}}break;
        case'convert':if(O.hand.length)P.out.push(O.hand.splice(Math.random()*O.hand.length|0,1)[0].id);break;
        case'dm':if(O.hand.length)P.known.push(O.hand[Math.random()*O.hand.length|0]);break;
        case'fortune':{const top=P.deck.splice(-3);if(top.length){const gap=R.target-R.gauge;let k=top.findIndex(c=>c.v===gap);if(k<0)k=top.reduce((b,c,i)=>c.v>top[b].v&&c.v<=gap?i:b,0);P.hand.push(top.splice(k,1)[0]);P.deck.push(...top)}break}
      }
      if(AB[p].photoDraw&&card.photo&&!P.photoUsed){P.photoUsed=true;draw(p,1)}
      P.plays--;
    }
    draw(p,1);P.snipe=false;P.press=false;R.cur=1-p;
  }
  return{w:null,busted:R.busted};
}

function oppWin(R,me,gap,gAfter){
  const H=R.P[1-me];if(H.skip||gap<=0)return 0;
  const add=dOf(H),ad=R.AB&&!H.adjUsed&&R.AB[1-me].adjust||0;
  const hit=c=>{if(c.reactive||c.lower||c.nofinish)return false;
    const base=(c.choice||[c.id==='trend'?(gAfter>=20?4:2):c.id==='fourcut'?(H.photoCount>=3?4:1):c.id==='reup'?H.photoCount:c.id==='tiki'?(H.matchCount||0):c.v]).map(x=>x+add);
    const vs=ad?base.flatMap(x=>[x,x+ad]):base;return vs.some(v=>v===gap&&okV(H,v,c))};
  let pool=H.def.filter(c=>!H.played.includes(c.id));let h=H.hand.length;if(!h)return 0;
  if(global.__diff&&global.__diff[me]==='hard'&&!global.__noMem){const M=R.P[me];M.known=M.known.filter(k=>H.hand.includes(k));
    if(M.known.some(hit))return 1;const kid=M.known.map(k=>k.id);pool=pool.filter(c=>!kid.includes(c.id)&&!M.out.includes(c.id));h-=M.known.length;if(h<=0)return 0}
  const N=pool.length;if(!N)return 0;const n=pool.filter(hit).length;
  return 1-Math.pow((N-n)/N,Math.min(h,N));
}
function squeeze(R,me,gap,ng,RR){   // 상대 손패가 전부 '나한테 끝낼 칸을 주는 카드'일 확률
  const H=R.P[1-me];let pool=H.def.filter(c=>!H.played.includes(c.id)&&!c.reactive);let h=H.hand.length;
  const M=R.P[me];const known=(M.known||[]).filter(k=>H.hand.includes(k));
  const vOf=c=>c.choice||(c.lower?c.lower.map(x=>-x):[c.id==='trend'?(ng>=20?4:2):c.id==='fourcut'?(H.photoCount>=3?4:1):c.id==='reup'?H.photoCount:c.id==='tiki'?(H.matchCount||0):c.v]);
  const safe=c=>vOf(c).some(x=>x!==gap&&!RR.has(gap-x));   // 넘기거나 버티거나 구멍으로 피할 수 있음
  if(known.some(safe))return 0;
  const kid=known.map(k=>k.id);pool=pool.filter(c=>!kid.includes(c.id)&&!(M.out||[]).includes(c.id));h-=known.length;
  const N=pool.length;if(!N||h<=0)return known.length?1:0;
  const sc=pool.filter(safe).length;return Math.pow((N-sc)/N,Math.min(h,N));
}
const BONUS={scoop:-4,story:8,vlog:8,hilite:8,nail:6,burst:9,repost:9,snipe:10,charm:8,doll:10,convert:12,fortune:8,f4f:2,dm:2,ward:4,drip:8,calm:6,tea:7,regular:4,whistle:10,court:8,jog:9,sub:5};
function reachOf(P,hand,gAfter){
  const vals=hand.map(c=>{if(c.reactive||c.lower||c.nofinish)return[];if(c.choice)return c.choice;
    if(c.id==='trend')return[gAfter>=20?4:2];if(c.id==='fourcut')return[P.photoCount>=3?4:1];if(c.id==='reup')return[P.photoCount];if(c.id==='tiki')return[P.matchCount||0];return[c.v]});
  const S=new Set();hand.forEach((c,i)=>{vals[i].forEach(x=>S.add(x));if(!c.extra)return;
    hand.forEach((d,j)=>{if(j===i)return;vals[i].forEach(x=>vals[j].forEach(y=>S.add(x+y)));
      if(d.extra)hand.forEach((e,k)=>{if(k===i||k===j)return;vals[i].forEach(x=>vals[j].forEach(y=>vals[k].forEach(z=>S.add(x+y+z))))})})});
  return S}
const isStall=c=>!c.reactive&&(c.lower||c.v<=0||(c.choice&&c.choice.includes(0)));
const widen=(S,d)=>{if(!d)return S;const T=new Set(S);S.forEach(x=>T.add(x+d));return T};
function ai(R,p){
  const DF=(global.__diff&&global.__diff[p])||(global.__cov?'normal':'easy');const easy=DF==='easy',hard=DF==='hard';
  const P=R.P[p];const me=R.ab?.[p];const cand=[];
  const AD=R.AB&&!P.adjUsed&&R.AB[p].adjust||0,MO=R.AB&&R.AB[p].momentum,MI=R.AB&&R.AB[p].mirror?R.P[1-p].lastP:null,RM=R.AB&&R.AB[p].revMom;
  P.hand.forEach((c,i)=>{
    if(!playable(R,p,c))return;
    for(const ch of c.choice||c.lower||[null]){
    if(c.choice&&!okV(P,ch+dOf(P),c))continue;
    for(const adj of AD&&!c.lower?[0,AD]:[0]){
      const v=valOf(R,p,c,ch)+adj;if(adj&&!okV(P,v,c))continue;const ng=Math.max(0,R.gauge+v);let s;
      if(ng===R.target&&!c.nofinish)s=10000;
      else if(ng>R.target||(ng===R.target&&c.nofinish)){let nt=R.target,k=0;do{nt+=10;k++}while(ng>=nt);const m=(c.triple?3:2)*2**(k-1),gap=nt-ng;const hs=P.hand.some(x=>x.id==='sorry');
        s=-140*oppWin(R,p,gap,ng)*m-15*m+(R.bustLike?.[p]?12:0)+(hs?-60:0)+(easy&&oppWin(R,p,R.target-R.gauge,R.gauge)>.5?60:0);}
      else if(!easy){const gap=R.target-ng;let risk;
        const FL={charm:'capture',calm:'soothe',whistle:'press'}[c.id];if(FL){const H=R.P[1-p],keep=H[FL];H[FL]=true;risk=oppWin(R,p,gap,ng);H[FL]=keep}else risk=oppWin(R,p,gap,ng);
        if(c.id==='silence')risk=0;if(c.id==='snipe')risk*=.35;s=-100*risk;if(gap===0)s-=150;
        const rest=P.hand.filter((_,j)=>j!==i);const RR=widen(reachOf(P,rest,ng),adj?0:AD);if(RR.has(gap))s+=18;
        let cov=0;for(let k=1;k<=6;k++)if(RR.has(k))cov++;s+=4*cov;if(rest.some(isStall))s+=5;if(hard&&!global.__noSq&&gap>0&&gap<=12)s+=(global.__sqW??30)*squeeze(R,p,gap,ng,RR)}
      else{const gap=R.target-ng;let risk=oppWin(R,p,gap,ng);if(c.id==='silence')risk=0;if(c.id==='snipe')risk*=.35;s=-100*risk;
        const rest=P.hand.filter((_,j)=>j!==i);if(rest.some(x=>x.v===gap))s+=18;if(gap>12)s+=Math.max(0,v)*1.2;
        if(gap>12&&v<=2&&!c.draw&&!c.extra)s-=6}
      s+=BONUS[c.id]||0;if(c.id==='silence')s-=R.target-R.gauge>10?25:0;
      if(c.photo&&R.photoBias?.[p]&&!P.photoUsed)s+=6;
      if(adj&&s<10000)s-=8;if(MO&&!c.lower&&!P.momUsed&&P.lastV!=null&&v>=P.lastV+2)s+=7;if(MI!=null&&v===MI)s+=7;if(RM&&P.lastP!=null&&v<=P.lastP-RM)s+=7;
      s+=Math.random()*3;cand.push({i,ch,adj,s});
    }}
  });
  cand.sort((a,b)=>b.s-a.s);if(hard&&global.__mc&&R.AB&&cand.length>1&&cand[0].s<10000)return mcPick(R,p,cand);if(easy&&global.__diff&&cand.length>1&&cand[0].s<10000&&Math.random()<.3)return cand[1+(Math.random()*Math.min(2,cand.length-1)|0)];return cand[0];
}

return{playLoop,cloneR,shuffle,global};
})();
if(typeof module!=='undefined')module.exports={MCE};

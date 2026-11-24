// AI 수 고르기
/* ---------- AI ---------- */
let DIFF='normal',MATCH=5;
const curV=(P,c,g)=>c.id==='trend'?(g>=20?4:2):c.id==='fourcut'?(P.photoCount>=3?4:1):c.id==='reup'?P.photoCount:c.id==='tiki'?(P.matchCount||0):c.v;
// 상대(1-me)가 다음 차례에 gap을 딱 맞출 확률
function oppWinProb(gap,gAfter,me=AI,diff=DIFF){
  const H=G.P[1-me];if(H.skip||gap<=0)return 0;
  const add=(H.capture?1:0)-(H.soothe?1:0),ad=!H.adjUsed&&CASTS[SEAT[1-me]].adjust||0;
  const hit=c=>{
    if(c.reactive||c.lower||c.nofinish)return false;
    const base=(c.choice||[curV(H,c,gAfter)]).map(x=>x+add);
    const vs=ad?base.flatMap(x=>[x,x+ad]):base;return vs.some(v=>v===gap&&okV(H,v,c));
  };
  let h=H.hand.length;if(!h)return 0;
  let pool=DECK[1-me].filter(c=>!H.played.includes(c.id));
  if(diff==='hard'){   // 본 카드와 버리게 한 카드를 기억한다
    const M=G.P[me];M.known=M.known.filter(k=>H.hand.includes(k));
    if(M.known.some(hit))return 1;
    const kid=M.known.map(k=>k.id);
    pool=pool.filter(c=>!kid.includes(c.id)&&!M.out.includes(c.id));h-=M.known.length;if(h<=0)return 0;
  }
  const N=pool.length;if(!N)return 0;
  const n=pool.filter(hit).length;
  return 1-Math.pow((N-n)/N,Math.min(h,N));
}
// 손패로 한 턴에 낼 수 있는 숫자들 (연사·리포스트 연결 포함)
function reachOf(p,hand,gAfter){
  const P=G.P[p];
  const vals=hand.map(c=>{
    if(c.reactive||c.lower||c.nofinish)return[];
    if(c.choice)return c.choice;
    return[curV(P,c,gAfter)];
  });
  const S=new Set();
  hand.forEach((c,i)=>{vals[i].forEach(x=>S.add(x));
    if(!c.extra)return;
    hand.forEach((d,j)=>{if(j===i)return;
      vals[i].forEach(x=>vals[j].forEach(y=>S.add(x+y)));
      if(d.extra)hand.forEach((e,k)=>{if(k===i||k===j)return;vals[i].forEach(x=>vals[j].forEach(y=>vals[k].forEach(z=>S.add(x+y+z))))});
    });
  });
  return S;
}
const isStall=c=>!c.reactive&&(c.lower||c.v<=0||(c.choice&&c.choice.includes(0)));
function toR(p){
  const ab=abOf;
  const tp=q=>{const P=G.P[q];return{def:DECK[q],deck:[...P.deck],hand:[...P.hand],played:[...P.played],used:[...P.used],skip:P.skip,snipe:P.snipe,capture:P.capture,extraNext:P.extraNext,plays:P.plays,usedOnce:P.usedOnce,photoUsed:P.photoUsed,momUsed:P.momUsed,lastP:P.lastP,matchCount:P.matchCount,photoCount:P.photoCount,known:[...P.known],out:[...P.out],soothe:P.soothe,press:P.press,adjUsed:P.adjUsed,lastV:P.lastV}};
  return{P:[tp(0),tp(1)],gauge:G.gauge,target:G.target,stake:G.stake,cur:p,passes:0,busted:G.stake>1,AB:[ab(SEAT[0]),ab(SEAT[1])]};
}
// 어려움: 후보 수마다 상대 손패를 여러 번 가정해서 판 끝까지 굴려보고, 기대 점수가 가장 높은 수를 둔다
function mcPick(p,cand,M=5,K=12){
  const base=toR(p);let best=cand[0],bv=-1e9;
  for(const c of cand.slice(0,M)){let tot=0;
    for(let k=0;k<K;k++){
      const R2=MCE.cloneR(base),O=R2.P[1-p];
      const kn=O.hand.filter(x=>G.P[p].known.includes(x));
      const hid=MCE.shuffle([...O.hand.filter(x=>!kn.includes(x)),...O.deck]);const hn=O.hand.length-kn.length;
      O.hand=[...kn,...hid.slice(0,hn)];O.deck=hid.slice(hn);R2.P[p].deck=MCE.shuffle(R2.P[p].deck);
      const res=MCE.playLoop(R2,R2.AB,{turns:0,played:{},busts:0,maxStake:0},{i:c.i,ch:c.ch,adj:c.adj});
      tot+=res.w===p?res.stake:res.w===null?0:-res.stake;
    }
    const v=tot/K+c.s*1e-4;if(v>bv){bv=v;best=c}
  }
  return best;
}
const BONUS={story:8,vlog:8,hilite:8,nail:6,burst:9,repost:9,snipe:10,charm:8,doll:10,convert:12,fortune:8,f4f:2,dm:2,ward:4,drip:8,calm:6,tea:7,regular:4,whistle:10,court:8,jog:9,sub:5};
const widen=(S,d)=>{if(!d)return S;const T=new Set(S);S.forEach(x=>T.add(x+d));return T};
function aiAct(p=AI,diff=DIFF){
  const P=G.P[p],O=1-p;const cand=[];const easy=diff!=='hard',hard=false;   // 쉬움·보통은 단순 계산, 어려움은 전체 계산
  const AD=!P.adjUsed&&CASTS[SEAT[p]].adjust||0,MO=CASTS[SEAT[p]].momentum,MI=CASTS[SEAT[p]].mirror?G.P[1-p].lastP:null,RM=CASTS[SEAT[p]].revMom,d=(P.capture?1:0)-(P.soothe?1:0);
  P.hand.forEach((c,i)=>{
    if(!playable(p,c))return;
    for(const ch of c.choice||c.lower||[null]){
    if(c.choice&&!okV(P,ch+d,c))continue;
    for(const adj of AD&&!c.lower?[0,AD]:[0]){
      const v=valOf(p,c,ch)+adj;if(adj&&!okV(P,v,c))continue;const ng=Math.max(0,G.gauge+v);let s;
      const rest=P.hand.filter((_,j)=>j!==i);
      if(ng===G.target&&!c.nofinish)s=10000;
      else if(ng>G.target||(ng===G.target&&c.nofinish)){
        let nt=G.target,k=0;do{nt+=10;k++}while(ng>=nt);const m=(c.triple?3:2)*2**(k-1),gap=nt-ng;
        s=-140*oppWinProb(gap,ng,p,diff)*m-15*m+(CASTS[SEAT[p]].bustDraw?12:0);
        if(easy)s+=oppWinProb(G.target-G.gauge,G.gauge,p,diff)>.5?60:0;   // 쉬움: 질 것 같으면 판부터 키운다
      }else{
        const gap=G.target-ng;let risk;
        const FL={charm:'capture',calm:'soothe',whistle:'press'}[c.id];if(FL&&!easy){const H=G.P[O],keep=H[FL];H[FL]=true;risk=oppWinProb(gap,ng,p,diff);H[FL]=keep}
        else risk=oppWinProb(gap,ng,p,diff);
        if(c.id==='silence')risk=0;if(c.id==='snipe')risk*=.35;s=-100*risk;
        if(easy){   // 쉬움: 멀면 큰 숫자부터 턴다
          if(rest.some(x=>x.v===gap))s+=18;
          if(gap>12)s+=Math.max(0,v)*1.2;if(gap>12&&v<=2&&!c.draw&&!c.extra)s-=6;
        }else{
          const R=widen(reachOf(p,rest,ng),adj?0:AD);
          if(R.has(gap))s+=18;
          let cov=0;for(let k=1;k<=6;k++)if(R.has(k))cov++;
          s+=4*cov;if(rest.some(isStall))s+=5;
        }
      }
      s+=BONUS[c.id]||0;if(c.id==='silence')s-=G.target-G.gauge>10?25:0;
      if(adj&&s<10000)s-=8;if(MO&&!c.lower&&!P.momUsed&&P.lastV!=null&&v>=P.lastV+2)s+=7;if(MI!=null&&v===MI)s+=7;if(RM&&P.lastP!=null&&v<=P.lastP-RM)s+=7;
      s+=Math.random()*3;cand.push({i,ch,adj,s,bust:ng>G.target||(ng===G.target&&!!c.nofinish)});
    }}
  });
  if(!cand.length)return endTurn(p);
  cand.sort((a,b)=>b.s-a.s);
  let pick=cand[0];
  if(diff==='easy'){   // 쉬움: 판돈 4점 전까지는 터뜨릴 수 있으면 버스트, 아니면 저스트, 그것도 아니면 아무 카드
    const bu=G.stake<4?cand.filter(c=>c.bust):[],ju=cand.filter(c=>c.s>=10000),rest=cand.filter(c=>!c.bust),any=a=>a[Math.random()*a.length|0];
    pick=bu.length?any(bu):ju.length?ju[0]:any(rest.length?rest:cand);
  }else if(diff==='normal'&&cand.length>1&&pick.s<10000&&Math.random()<.3)pick=cand[1+(Math.random()*Math.min(2,cand.length-1)|0)];
  play(p,pick.i,pick.ch,pick.adj||0);
}

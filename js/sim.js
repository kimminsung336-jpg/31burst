// 판 시뮬레이터(MCE): 판 하나를 끝까지 굴린다. 헤드리스 시뮬(tools/sim.js)이 쓴다.
// 규칙은 전부 rules.js에 있고, 여기는 진행 순서와 통계만 다룬다.
const MCE=(()=>{
const RU=typeof RULES!=='undefined'?RULES:require('./rules.js').RULES;
const global={__recycle:true,__diff:['normal','normal'],__cov:true};
const shuffle=RU.shuffle;

function cloneR(R){return{...R,P:R.P.map(P=>({...P,deck:[...P.deck],hand:[...P.hand],played:[...P.played],used:[...(P.used||[])],known:[...(P.known||[])],out:[...(P.out||[])]}))}}
function mkDraw(R){return(p,n)=>{const P=R.P[p];for(let i=0;i<n;i++){if(!P.deck.length&&global.__recycle&&P.used&&P.used.length){P.deck=shuffle(P.used);P.used=[]}if(!P.deck.length)return;P.hand.push(P.deck.pop())}}}
const tally=(S,k)=>{S[k]=(S[k]||0)+1};
function bustStats(R,S,p,card,v,forced){
  R.busted=true;S.busts++;S.bc=S.bc||{};tally(S.bc,(R.gauge-v>R.target?'이미넘침':forced?'강제':'선택')+':'+card.id);
  S.bb=S.bb||[0,0];S.bb[p]++;S.maxStake=Math.max(S.maxStake,R.stake);
}
function playLoop(R,AB,S,first){
  const draw=mkDraw(R);
  let guard=0,mid=!!first;
  while(guard++<600){
    const p=R.cur,P=R.P[p];S.turns++;
    if(!mid){
      if(P.skip){P.skip=false;R.cur=1-p;continue}
      RU.turnStart(R,AB,p);
      if(!P.hand.some(c=>RU.playable(R,p,c))){draw(p,1);R.passes++;P.snipe=false;P.press=false;if(R.passes>=2)return{w:null,busted:R.busted};R.cur=1-p;continue}
      R.passes=0;
    }
    mid=false;
    while(first||(P.plays>0&&P.hand.some(c=>RU.playable(R,p,c)))){
      let mv;if(first){mv=first;first=null}else mv=ai(R,p);
      const forced=P.hand.filter(c=>RU.playable(R,p,c)).every(c=>{const vs=c.choice||c.lower?.map(x=>-x)||[RU.valOf(R,p,c,null)];return vs.every(x=>Math.max(0,R.gauge+x)>R.target)});
      const card=P.hand.splice(mv.i,1)[0];P.played.push(card.id);(P.used=P.used||[]).push(card);tally(S.played,card.id);
      let v=RU.valOf(R,p,card,mv.ch);if(!card.lower){P.capture=false;P.soothe=false}
      if(mv.adj){v+=mv.adj;P.adjUsed=true;S.adj=(S.adj||0)+1}
      for(const[e]of RU.onPlayed(R,AB,p,card,v,draw)){if(e==='mirror')S.mir=(S.mir||0)+1;if(e==='momentum')S.mom=(S.mom||0)+1}
      const ng=Math.max(0,R.gauge+v);R.gauge=ng;
      if(card.photo)P.photoCount++;
      if(ng===R.target&&!card.nofinish)return{w:p,stake:R.stake,card:card.id,busted:R.busted};
      if(ng>R.target||(ng===R.target&&card.nofinish)){RU.bust(R,AB,card);bustStats(R,S,p,card,v,forced);RU.afterBust(R,AB,draw)}
      RU.effect(R,p,card,draw);
      if(RU.PICK[card.id]){const o=RU.pickOpts(R,p,card.id);if(o.length)RU.pickResolve(R,p,card.id,o,RU.autoPick(R,p,card.id,o),draw);else if(RU.PICK[card.id].hand)draw(p,card.id==='nail'?2:1)}
      RU.photoHook(R,AB,p,card,draw);
      P.plays--;
    }
    draw(p,1);P.snipe=false;P.press=false;R.cur=1-p;
  }
  return{w:null,busted:R.busted};
}
// 시뮬 속 AI: 보통·어려움은 손패 연결까지 보는 계산, 어려움은 손패 몰이와 카드 기억까지
function ai(R,p){
  const DF=(global.__diff&&global.__diff[p])||(global.__cov?'normal':'easy');const easy=DF==='easy',hard=DF==='hard';
  const cand=RU.scoreMoves(R,R.AB,p,{full:!easy,mem:hard&&!global.__noMem,sq:hard&&!global.__noSq?(global.__sqW??30):0});
  if(easy&&global.__diff&&cand.length>1&&cand[0].s<10000&&Math.random()<.3)return cand[1+(Math.random()*Math.min(2,cand.length-1)|0)];
  return cand[0];
}

return{playLoop,cloneR,shuffle,global};
})();
if(typeof module!=='undefined')module.exports={MCE};

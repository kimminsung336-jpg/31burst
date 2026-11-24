// 헤드리스 시뮬: node tools/sim.js [난이도] [판수] [시드]
// 엔진(js/data.js + js/sim.js)만 불러서 캐스트끼리 5판 게임을 돌린다.
const path=require('path');
const seed=+process.argv[4]||0;
if(seed){let a=seed>>>0;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const {CASTS}=require(path.join(__dirname,'../js/data.js'));
const {MCE}=require(path.join(__dirname,'../js/sim.js'));
const diff=process.argv[2]||'normal';MCE.global.__diff=[diff,diff];
const ab=k=>({...CASTS[k]});
const fresh=k=>({def:CASTS[k].deck,deck:MCE.shuffle(CASTS[k].deck.map(c=>({...c}))),hand:[],played:[],used:[],skip:false,snipe:false,capture:false,soothe:false,press:false,extraNext:0,plays:0,usedOnce:false,photoUsed:false,adjUsed:false,lastV:null,photoCount:0,known:[],out:[]});
function round(A,B,starter,S){
  const R={P:[fresh(A),fresh(B)],gauge:0,target:31,stake:1,cur:starter,passes:0,busted:false,AB:[ab(A),ab(B)]};
  for(const q of[0,1])for(let i=0;i<5;i++)R.P[q].hand.push(R.P[q].deck.pop());
  return MCE.playLoop(R,R.AB,S);
}
const keys=Object.keys(CASTS),N=+process.argv[3]||1000;
const name={iri:'아이리',miko:'미코',haru:'하루',mina:'준'};
const tot={};
for(const A of keys){tot[A]=[0,0];for(const B of keys){if(A===B)continue;
  const S={turns:0,played:{},busts:0,maxStake:0};let mw=0;
  for(let g=0;g<N;g++){let sc=[0,0],st=g%2;
    for(let r=0;r<5;r++){const res=round(A,B,st,S);if(res.w===null)st=1-st;else{sc[res.w]+=res.stake;st=1-res.w}}
    if(sc[0]>sc[1])mw++;else if(sc[0]===sc[1])mw+=.5}
  tot[A][0]+=mw;tot[A][1]+=N}}
console.log(`5판 게임 승률 (난이도 ${diff}, 상대별 ${N}게임${seed?', 시드 '+seed:''})`);
for(const A of keys)console.log(name[A].padEnd(4),(100*tot[A][0]/tot[A][1]).toFixed(1)+'%');

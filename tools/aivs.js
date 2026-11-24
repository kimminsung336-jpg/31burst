// 실제 게임 AI 정책끼리 붙여 보는 비교: node tools/aivs.js [게임수]
// 같은 캐스트 조합을 자리 바꿔 돌리고, A 정책의 5판 게임 승률을 낸다.
const path=require('path');
const {CASTS}=require(path.join(__dirname,'../js/data.js'));
const {RULES}=require(path.join(__dirname,'../js/rules.js'));
const {MCE}=require(path.join(__dirname,'../js/sim.js'));
const {AI_PICK}=require(path.join(__dirname,'../js/aipick.js'));
const fresh=k=>({def:CASTS[k].deck,deck:MCE.shuffle(CASTS[k].deck.map(c=>({...c}))),hand:[],played:[],used:[],skip:false,snipe:false,capture:false,soothe:false,press:false,extraNext:0,plays:0,usedOnce:false,photoUsed:false,adjUsed:false,lastV:null,photoCount:0,known:[],out:[]});
const keys=Object.keys(CASTS),N=+process.argv[2]||200;
function game(A,B,pa,pb,st){let sc=[0,0];
  MCE.global.__pick=(R,p)=>AI_PICK(R,R.AB,p,p===0?pa:pb);
  for(let r=0;r<5;r++){const R={P:[fresh(A),fresh(B)],gauge:0,target:31,stake:1,cur:st,passes:0,busted:false,AB:[{...CASTS[A]},{...CASTS[B]}]};
    for(const q of[0,1])for(let i=0;i<5;i++)R.P[q].hand.push(R.P[q].deck.pop());
    const res=MCE.playLoop(R,R.AB,{turns:0,played:{},busts:0,maxStake:0});if(res.w===null)st=1-st;else{sc[res.w]+=res.stake;st=1-res.w}}
  return sc[0]>sc[1]?1:sc[0]===sc[1]?.5:0}
const L=['easy','normal','hard','xhard'];
const rate=(pa,pb)=>{let w=0,n=0;for(const A of keys)for(const B of keys){for(let g=0;g<N;g++){w+=game(A,B,pa,pb,g%2);w+=1-game(B,A,pb,pa,g%2);n+=2}}return(100*w/n).toFixed(1)};
console.log('행 정책이 열 정책을 이긴 5판 게임 비율(%)');console.log('        '+L.map(x=>x.padStart(7)).join(''));
for(const a of L)console.log(a.padEnd(8)+L.map(b=>(a===b?'-':rate(a,b)).padStart(7)).join(''));

// AI 수 고르기
/* ---------- AI ---------- */
let DIFF='normal',MATCH=5;
// 쉬움·보통은 단순 계산, 어려움은 손패 연결과 카드 기억까지 보는 계산 (rules.js의 scoreMoves)
function aiAct(p=AI,diff=DIFF){
  const hard=diff==='hard',cand=RULES.scoreMoves(G,ABS(),p,{full:hard,mem:hard});
  if(!cand.length)return endTurn(p);
  let pick=cand[0];
  if(diff==='easy'){   // 쉬움: 판돈 4점 전까지는 터뜨릴 수 있으면 버스트, 아니면 저스트, 그것도 아니면 아무 카드
    const bu=G.stake<4?cand.filter(c=>c.bust):[],ju=cand.filter(c=>c.s>=10000),rest=cand.filter(c=>!c.bust),any=a=>a[Math.random()*a.length|0];
    pick=bu.length?any(bu):ju.length?ju[0]:any(rest.length?rest:cand);
  }else if(diff==='normal'&&cand.length>1&&pick.s<10000&&Math.random()<.3)pick=cand[1+(Math.random()*Math.min(2,cand.length-1)|0)];
  play(p,pick.i,pick.ch,pick.adj||0);
}

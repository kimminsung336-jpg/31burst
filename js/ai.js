// AI 수 고르기
/* ---------- AI ---------- */
let DIFF='normal',MATCH=5;
// 난이도별 수 고르기는 aipick.js (쉬움·보통·어려움·매우 어려움)
function aiAct(p=AI,diff=DIFF){
  const pick=AI_PICK(G,ABS(),p,diff);
  if(!pick)return endTurn(p);
  play(p,pick.i,pick.ch,pick.adj||0);
}

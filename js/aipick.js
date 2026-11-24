// AI 난이도별 수 고르기. 실제 대전(ai.js)과 비교 도구(tools/aivs.js)가 같이 쓴다.
// 쉬움 < 보통 < 어려움 < 매우 어려움. 점수 계산은 rules.js의 scoreMoves
const AI_PICK=(()=>{
  const RU=typeof RULES!=='undefined'?RULES:require('./rules.js').RULES;
  const any=a=>a[Math.random()*a.length|0];
  return function(R,AB,p,diff){
    const xhard=diff==='xhard',cand=RU.scoreMoves(R,AB,p,{full:xhard,mem:xhard});
    if(!cand.length)return null;
    const ju=cand.filter(c=>c.s>=10000),safe=cand.filter(c=>!c.bust);
    if(diff==='easy'){   // 쉬움: 판돈 4점 전까지는 터뜨릴 수 있으면 버스트, 아니면 저스트, 그것도 아니면 아무 카드
      const bu=R.stake<4?cand.filter(c=>c.bust):[];
      return bu.length?any(bu):ju.length?ju[0]:any(safe.length?safe:cand);
    }
    if(diff==='normal'){   // 보통: 저스트는 대체로 잡고, 나머지는 절반쯤 아무 카드나 낸다
      if(ju.length&&Math.random()<.75)return ju[0];
      if(Math.random()<.5)return any(safe.length?safe:cand);
      return cand[0];
    }
    if(diff==='hard'&&cand.length>1&&cand[0].s<10000&&Math.random()<.3)return cand[1+(Math.random()*Math.min(2,cand.length-1)|0)];   // 어려움(예전 보통)
    return cand[0];   // 매우 어려움(예전 어려움): 손패 연결과 카드 기억까지
  };
})();
if(typeof module!=='undefined')module.exports={AI_PICK};

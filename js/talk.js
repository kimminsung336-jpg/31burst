// 스토리 대전 중 대사. 판이 시작될 때, 화제성이 31에 가까워질 때, 저스트·버스트가 나올 때 말풍선을 띄운다.
// 대사는 story.js 의 TALK[장 id] 에 있다. 같은 상황은 한 대전에 한 번만 나온다.
// 말: ['k', 말]  내 캐스트(스토리 주인공)   ['o', 말]  상대 캐스트
const Talk=(()=>{
  let said=new Set(),queue=[],busy=false;
  const lines=ev=>{if(NET.on||!CURRENT.story)return null;const t=(typeof TALK!=='undefined'&&TALK[CURRENT.story])||{};return t[ev]||null};
  function reset(){said=new Set();queue=[];busy=false;document.querySelectorAll('#play .tb').forEach(e=>e.remove())}
  function say(ev){
    const L=lines(ev);if(!L||said.has(ev))return;said.add(ev);
    queue.push(...L);if(!busy)pump();
  }
  function pump(){
    const it=queue.shift();if(!it){busy=false;return}busy=true;
    const[w,t]=it,k=w==='o'?SEAT[AI]:SEAT[ME];
    document.querySelectorAll('#play .tb').forEach(e=>{e.classList.add('out');setTimeout(()=>e.remove(),250)});
    const b=document.createElement('div');b.className=`tb ${w==='o'?'op':'me'} c${CAST_COL[k]}`;b.setAttribute('role','status');
    b.innerHTML=`<img src="img/p/${k}_av.webp" alt=""><span><b>${CASTS[k].name}</b>${nm(t)}</span>`;
    $('play').appendChild(b);SFX.blip();
    const ms=Math.max(1400,Math.min(3200,700+t.length*55))*Math.max(SPEED,.6);
    setTimeout(()=>{b.classList.add('out');setTimeout(()=>b.remove(),250);pump()},ms);
  }
  return{say,reset};
})();

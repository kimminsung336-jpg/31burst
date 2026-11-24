// 이펙트·카드 날리기·타임라인 서랍
const rnd=(a,b)=>a+Math.random()*(b-a);
const fmt=n=>n>=10000?(n/10000).toFixed(1)+'만':n>=1000?(n/1000).toFixed(1)+'천':String(n);

function spawn(x,y,n,spread,big,kind){
  const fx=document.getElementById('fx');
  for(let i=0;i<n;i++){
    const el=document.createElement('span'),isH=kind?kind==='heart':Math.random()<.62;
    el.className='fly';el.innerHTML=isH?HEART:REPLY;
    el.style.color=kind?(isH?'var(--cM)':'var(--cC)'):isH?'var(--m)':'var(--c)';
    const sx=big?rnd(0,innerWidth):x,sy=big?rnd(innerHeight*.35,innerHeight+20):y;
    el.style.left=sx+'px';el.style.top=sy+'px';
    el.style.setProperty('--x',rnd(-spread,spread)+'px');
    el.style.setProperty('--y',-rnd(spread*.6,spread*1.8)+'px');
    el.style.setProperty('--r',rnd(-40,40)+'deg');
    el.style.setProperty('--s',rnd(.9,big?2.2:1.5));
    el.style.setProperty('--d',rnd(.8,big?2:1.3)+'s');
    el.style.setProperty('--w',rnd(0,big?.9:.25)+'s');
    fx.appendChild(el);setTimeout(()=>el.remove(),3200);
  }
}
// 화면 아래에서 아이콘이 쏟아져 올라온다. 저스트는 좋아요(하트), 버스트는 리플(시안)
function rise(kind,n){
  const fx=document.getElementById('fx'),H=innerHeight,W=innerWidth,icon=kind==='heart'?HEART:REPLY,col=kind==='heart'?'var(--cM)':'var(--cC)';
  for(let i=0;i<n;i++){
    const el=document.createElement('span');el.className='fly rise';el.innerHTML=icon;el.style.color=col;
    el.style.left=rnd(-20,W+20)+'px';el.style.top=(H+rnd(10,60))+'px';
    el.style.setProperty('--x',rnd(-60,60)+'px');el.style.setProperty('--y',-rnd(H*.55,H*1.1)+'px');
    el.style.setProperty('--r',rnd(-30,30)+'deg');el.style.setProperty('--s',rnd(1,2.6));
    el.style.setProperty('--d',rnd(1.1,2)+'s');el.style.setProperty('--w',rnd(0,1.3)+'s');
    fx.appendChild(el);setTimeout(()=>el.remove(),3600);
  }
}
function addPost(p,card,v){
  NET.ev({t:'post',p,id:card.id,v});
  const feed=document.getElementById('feed');
  const heat=Math.abs(v)+1;
  const likes=Math.round(heat*rnd(6,14)*(G.stake)),reps=Math.round(heat*rnd(1,4)*G.stake);
  const el=document.createElement('article');el.className='post';
  el.innerHTML=`<img class="av ${SEAT[p]}" src="img/p/${SEAT[p]}_av.webp" alt=""><div>
    <div class="ph"><b>${NAME[p]}</b><span>${CASTS[SEAT[p]].handle} · 방금</span><span class="tag">${card.name} ${v>=0?'+':''}${v} → ${G.gauge}</span></div>
    <p class="pt">${(POSTS[SEAT[p]]||{})[card.id]||POST[card.id]}</p>${card.photo?`<div class="pimg"><div class="pimg2" role="img" aria-label="${NAME[p]}의 사진" style="${photoStyle(card,CAST_COL[SEAT[p]])}"></div></div>`:IMG[card.id]?`<div class="pimg">${IMG[card.id](p)}</div>`:''}
    <div class="pa"><span class="r">${REPLY}<em>${fmt(reps)}</em></span><span class="h">${HEART}<em>${fmt(likes)}</em></span></div></div>`;
  feed.prepend(el);while(feed.children.length>30)feed.lastChild.remove();
  tlNote(p,card,v);
  feed.scrollTop=0;
  requestAnimationFrame(()=>{let r=el.querySelector('.h').getBoundingClientRect();if(r.left>innerWidth-4||r.right<4){const q=document.querySelector('.ring').getBoundingClientRect();r={left:q.left+q.width/2-8,top:q.top+q.height/2-8}}spawn(r.left+8,r.top+8,4+Math.min(10,Math.abs(v)*2),70)});
  return el;
}
function bigHit(n){
  NET.ev({t:'hit'});
  const d=document.createElement('div');d.className='hit';
  d.innerHTML=`<div class="rays"></div><span class="n">JUST!</span>`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),3000);
  setTimeout(()=>{const m=document.getElementById('play');m.classList.remove('quake');void m.offsetWidth;m.classList.add('quake');
    spawn(innerWidth/2,innerHeight/2,40,340,false,'heart');rise('heart',140)},230);
}
function bigBust(k=1){
  NET.ev({t:'bust',k});
  const d=document.createElement('div');d.className='bustbig';
  d.innerHTML=`<div class="w"><span class="t">BUST!</span>${k>1?`<small>${k}연속 버스트!</small>`:''}</div>`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),3000);
  const m=document.getElementById('play');m.classList.remove('quake');void m.offsetWidth;m.classList.add('quake');
  rise('reply',140);
}
function bustFx(el){
  NET.ev({t:'bustfx'});
  if(el){
    el.classList.add('bust');
    el.querySelector('.ph').insertAdjacentHTML('beforeend','<span class="tag b">버스트</span>');
    el.querySelectorAll('.pa em').forEach(e=>{e.textContent=fmt(Math.round(rnd(4000,30000)*G.stake/2))});
  }
  spawn(innerWidth/2,innerHeight/2,30,300,false,'reply');
}

const $=id=>document.getElementById(id);
// 카드 내는 모션: 내 카드는 손에서, 상대 카드는 뒷면으로 나와서 뒤집히며 링으로
let LAST_PICK=null;
function flyCard(p,v,card){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ring=document.querySelector('.ring').getBoundingClientRect();if(!ring.width)return;
  let src;
  if(p===ME){src=LAST_PICK&&performance.now()-LAST_PICK.t<4000?LAST_PICK.r:$('hand').getBoundingClientRect();LAST_PICK=null}
  else{const bk=$('aiBacks');src=(bk.lastElementChild||bk).getBoundingClientRect()}
  const W=Math.max(48,ring.width*.36),H=W*1.38;   // 손패 카드와 비슷한 크기 (화면 배율을 따라감)
  const sx=src.left+src.width/2-W/2,sy=src.top+src.height/2-H/2,dx=ring.left+ring.width/2-W/2,dy=ring.top+ring.height/2-H/2;
  const el=document.createElement('div');el.className='flyc'+(p===ME?'':' opp b');el.style.width=W+'px';el.style.height=H+'px';
  const cls=v<0?'neg':v===0?'zero':'';
  el.style.setProperty('--fw',W+'px');   // 앞면은 실제 카드 그림으로
  el.innerHTML=`<div class="fin"><div class="fc front ${cls}${card?' cardf':''}">${card?cardHTML(card,{num:v}):`<b>${v}</b>`}</div><div class="fc fbk"></div></div>`;
  document.body.appendChild(el);const fin=el.firstElementChild;
  let frames,dur;
  if(p===ME){
    const mx=(sx+dx)/2-20,my=Math.min(sy,dy)-60;
    frames=[
      {transform:`translate(${sx}px,${sy}px) scale(.7)`,opacity:1,easing:'cubic-bezier(.25,.7,.3,1)'},
      {transform:`translate(${mx}px,${my}px) rotate(-8deg) scale(1)`,opacity:1,offset:.22},
      {transform:`translate(${dx}px,${dy}px) scale(1.15)`,opacity:1,offset:.4},
      {transform:`translate(${dx}px,${dy}px) scale(1.15)`,opacity:1,offset:.85},
      {transform:`translate(${dx}px,${dy}px) scale(1.3)`,opacity:0}];
    dur=1300;
  }else{
    // 뒷면으로 슥 미끄러져 와서, 링 위에서 멈췄다가 뒤집힌다
    const mx=(sx+dx)/2+16,my=(sy+dy)/2-10;
    frames=[
      {transform:`translate(${sx}px,${sy}px) rotate(6deg) scale(.8)`,opacity:1,easing:'cubic-bezier(.3,.6,.35,1)'},
      {transform:`translate(${mx}px,${my}px) rotate(4deg) scale(1)`,opacity:1,offset:252/2300},
      {transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(1.05)`,opacity:1,offset:756/2300},
      {transform:`translate(${dx}px,${dy}px) scale(1.2)`,opacity:1,offset:952/2300},
      {transform:`translate(${dx}px,${dy}px) scale(1.2)`,opacity:1,offset:1952/2300},
      {transform:`translate(${dx}px,${dy}px) scale(1.3)`,opacity:0}];
    dur=2300;   // 날아오는 시간은 그대로, 뒤집힌 뒤 1초 읽을 시간
    const f1=fin.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:190,delay:840,easing:'ease-in',fill:'forwards'});
    f1.onfinish=()=>{el.classList.remove('b');fin.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:220,easing:'cubic-bezier(.2,1.4,.4,1)',fill:'forwards'})};
  }
  const a=el.animate(frames,{duration:dur,easing:'linear',fill:'forwards'});
  a.onfinish=()=>el.remove();setTimeout(()=>el.remove(),dur+600);
}
function tlNote(p,card,v){
  flyCard(p,v,card);}

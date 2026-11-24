// 카드 그리기 (P안 B 카드: 폴라로이드·말풍선·신문 + 숫자 배지)
const OWNER_OF={M:'iri',K:'miko',Y:'haru',C:'mina'};
const COLOR_OF={};
{const put=(arr,col)=>arr.forEach(c=>{COLOR_OF[c.id]=col});
 put(SHARED,'A');put(POOL_SHARED,'A');put(IRI,'M');put(MIKO,'K');put(HARU,'Y');put(MINA,'C');
 Object.entries(POOL_COLOR).forEach(([k,arr])=>put(arr,k))}
const COLOR_CAST={M:'iri',K:'miko',Y:'haru',C:'mina'},CAST_COL={iri:'M',miko:'K',haru:'Y',mina:'C'};
// 덱에 보이는 숫자: 고르는 카드는 2·3 / 1~3, 내리는 카드는 −1~3, 세는 카드는 ?
function numLabel(c){
  if(c.choice)return c.choice.length===2?c.choice.join('·'):c.choice[0]+'~'+c.choice[c.choice.length-1];
  if(c.lower)return '−'+c.lower[0]+'~'+c.lower[c.lower.length-1];
  if(c.id==='tiki'||c.id==='reup')return '?';
  return String(c.v);
}
function handleOf(col){return col==='A'?'@cafe31':CASTS[COLOR_CAST[col]].handle}
// 사진 포스트 그림: 전용 사진 카드는 카드별 사진, 공용 사진 카드는 그 캐스트 버전(덱·도감에선 오늘 근무 캐스트)
const PH_OWN=new Set(['burst','nail','fourcut','filter','vlog','hilite','viral','reup','cheek','tea','wink','omurice','mvp','jog','shake','court']);
const PH_SHARED=new Set(['shot','selfie','menu','story']);
function photoStyle(c,col){
  if(PH_OWN.has(c.id))return `background:url(img/p/ph/${c.id}.webp) center/cover`;
  if(PH_SHARED.has(c.id)){const k=col&&col!=='A'?COLOR_CAST[col]:(typeof Save!=='undefined'&&Save.d&&Save.d.duty)||'iri';
    return `background:url(img/p/ph/${k}_${c.id}.webp) center/cover`}
  const h=[...c.id].reduce((a,x)=>a+x.charCodeAt(0),0);
  if(col!=='A'){const pos=['50% 6%','45% 18%','55% 28%','50% 12%'][h%4],sz=['230%','300%','260%','200%'][h%4];
    return `background:url(img/p/${COLOR_CAST[col]}.webp) no-repeat ${pos}/${sz},var(--c${col})`}
  const pos=['50% 35%','20% 55%','80% 45%','62% 60%'][h%4],sz=['320%','380%','300%','420%'][h%4];
  return `background:url(img/p/bg_day.webp) no-repeat ${pos}/${sz}`;
}
// num: 손패에서 지금 값으로 보여줄 때 넘긴다 (없으면 덱 표기)
function cardHTML(c,{num,size='m',tag='',locked=false,cond=''}={}){
  const col=COLOR_OF[c.id]||'A';
  if(locked)return `<div class="pc2 ${size} lock"><div class="pcb"><b>?</b><small>${cond}</small></div></div>`;
  const n=num===undefined?numLabel(c):String(num);
  const sp=c.id==='scoop';
  const eff=c.text&&c.text!=='효과 없음'?c.text:'';
  const badge=`<span class="pnum c${sp?'S':col}${n.length>2?' long':''}">${n}</span>`;
  const t=tag?`<span class="ptag">${tag}</span>`:'';
  let body;
  if(sp)body=`<div class="pcb news"><i class="nh">CAFE 31 DAILY</i><b class="nt">특종!</b><p class="pe">${eff}</p></div>`;
  else if(c.photo)body=`<div class="pcb photo"><div class="pimg2" style="${photoStyle(c,col)}"></div><b class="pn">${c.name}</b><p class="pe">${eff}</p><i class="pdot c${col}"></i></div>`;
  else body=`<div class="pcb talk c${col}"><div class="bub"><b class="pn">${c.name}</b><p class="pe">${eff}</p></div><i class="ph">${handleOf(col)}</i></div>`;
  return `<div class="pc2 ${size}">${badge}${t}${body}</div>`;
}

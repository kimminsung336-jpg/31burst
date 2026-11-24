// A read-only view of the local player's current hand. It never pauses or advances a match.
const HandView=(()=>{
  const dialog=$('handView'), rows=$('handViewCards'), count=$('handViewCount'), empty=$('handViewEmpty');
  const closeBtn=$('handViewClose'), stage=$('stage');
  let signature=null, origin=null, returnFocus=false;
  const blockers='#modal.on,#res.on,#pick.on,#guide.on,#deckView.on,.vsov';
  const conflicts=()=>document.querySelector(blockers);
  const isPlay=()=>stage.dataset.screen==='play';
  const valueLabel=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):String(n);
  const element=(tag,text,cls)=>{
    const node=document.createElement(tag);
    if(text!==undefined)node.textContent=text;
    if(cls)node.className=cls;
    return node;
  };
  function sync(){
    if(!dialog.open)return;
    if(!isPlay()||conflicts()){close(false);return}
    const own=G.P[ME];
    const hand=Array.isArray(own?.hand)?own.hand.filter(c=>c&&c.id!=='?'&&typeof c.name==='string'):[];
    const info=hand.map(c=>{
      const options=(c.choice||c.lower||[null]).map(choice=>valOf(ME,c,choice));
      const distinct=[...new Set(options)].filter(Number.isFinite);
      return [c.name,distinct.length?distinct.map(valueLabel).join(' / '):'—',c.text||'효과 없음'];
    });
    const newSignature=JSON.stringify(info);
    if(newSignature===signature)return;
    signature=newSignature;
    count.textContent=info.length+'장';
    empty.hidden=info.length>0;
    const y=rows.scrollTop;
    rows.replaceChildren(...info.map(([name,value,effect])=>{
      const li=element('li');
      const badge=element('span',value,'hand-view-value');
      badge.setAttribute('aria-label','현재 값 '+value);
      const copy=element('div',undefined,'hand-view-copy');
      copy.append(element('strong',name),element('p',effect));
      li.append(badge,copy);return li;
    }));
    rows.scrollTop=y;
  }
  function open(e){
    if(!isPlay()||dialog.open||conflicts())return;
    origin=e.currentTarget;returnFocus=true;signature=null;
    dialog.showModal();
    sync();rows.scrollTop=0;closeBtn.focus();
  }
  function close(restore=true){
    if(!dialog.open)return;
    returnFocus=restore;
    dialog.close();
  }
  $('playHandView').addEventListener('click',open);
  $('playHandViewTouch').addEventListener('click',open);
  closeBtn.addEventListener('click',()=>close());
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation()});
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();
  });
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;
    const blocker=conflicts();
    if(blocker){
      // An existing game prompt may have tried to focus while the native
      // hand dialog made it inert. Restore its intended first action.
      blocker.querySelector('#mOpts button,#rGo,#gNext,#dvClose,#pgrid button:not(:disabled)')?.focus({preventScroll:true});
    }else if(returnFocus&&isPlay())origin?.focus({preventScroll:true});
    origin=null;
    // Don't leave previously seen cards in the closed overlay.
    rows.replaceChildren();
  });
  const watch=new MutationObserver(sync);
  watch.observe(stage,{attributes:true,attributeFilter:['data-screen']});
  // A result, choice, or reconnect prompt takes priority. Native modal mode
  // would otherwise keep that existing prompt inert behind the hand.
  for(const id of ['modal','res','pick','guide','deckView'])watch.observe($(id),{attributes:true,attributeFilter:['class']});
  sync();return {sync};
})();

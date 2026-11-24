// 온라인 2인 (PeerJS, 방장이 판정)
/* ---------- 온라인 2인 (PeerJS, 방장이 판정) ---------- */
const NET={on:false,role:null,peer:null,conn:null,code:'',hostCast:null,guestCast:null,lastEl:null,last:'',aid:0,wait:{},
  send(m){if(this.conn&&this.conn.open)this.conn.send(m)},
  ev(m){if(this.role==='host'&&this.on)this.send(m)},
  state(){if(this.role!=='host'||!this.on)return;const st=snap(),j=JSON.stringify(st);if(j===this.last)return;this.last=j;this.send({t:'state',s:st})}};
const PH={id:'?',name:'?',v:0,text:''};
function snap(){
  const mask=(P,hide)=>({...P,deck:P.deck.length,hand:hide?P.hand.length:P.hand,used:[],known:hide?[]:P.known});
  return{clock:clockSnap(),rounds:G.rounds,hist:G.hist,busts:G.busts,stakeHist:G.stakeHist,round:G.round,score:G.score,wins:G.wins,starter:G.starter,cur:G.cur,gauge:G.gauge,target:G.target,stake:G.stake,busy:G.busy,over:G.over,
    P:G.P.length?[mask(G.P[0],true),mask(G.P[1],false)]:[]};
}
function applySnap(s){
  dismissCardOptions?.(false); // a new authoritative state supersedes any uncommitted local choice
  Object.assign(G,{rounds:s.rounds||5,hist:(s.hist||[]).map(h=>({...h,w:h.w===null?null:1-h.w})),busts:s.busts||0,stakeHist:s.stakeHist||[s.stake],round:s.round,score:[s.score[1],s.score[0]],wins:[s.wins[1],s.wins[0]],starter:1-s.starter,cur:1-s.cur,gauge:s.gauge,target:s.target,stake:s.stake,busy:s.busy,over:s.over});
  $('rounds').querySelectorAll('button').forEach(x=>{const on=+x.dataset.r===G.rounds;x.classList.toggle('on',on);x.setAttribute('aria-checked',on)});
  const fix=P=>({...P,deck:Array(P.deck).fill(null),hand:typeof P.hand==='number'?Array(P.hand).fill(PH):P.hand});
  if(s.P.length)G.P=[fix(s.P[1]),fix(s.P[0])];
  receiveClock(s.clock);
  if((G.over||G.cur!==ME||(!s.clock&&TURN_SECONDS))&&abortPrompt?.duringChoice)abortMatchPrompt();
  render();
}
const ALLC=[...SHARED,...IRI,...MIKO,...HARU,...MINA];
const flipCls=c=>c==='me'?'ai':c==='ai'?'me':c;
function pickFor(p,title,text,opts,auto){
  if(p===ME)return ask(title,text,opts);
  if(!NET.on)return Promise.resolve(auto());
  const id=++NET.aid;
  return new Promise(r=>{NET.wait[id]=k=>r(k===MATCH_PROMPT_ABORTED?k:opts[k]?opts[k].value:opts[0].value);NET.send({t:'ask',id,title,text,labels:opts.map(o=>o.label)})});
}
function netMsg(h){NET.msg=h;const o=$('olMsg');if(o)o.innerHTML=h;const e=$('olSt');if(e)e.innerHTML=h}
function netErr(e){
  if(NET.on)return netLost(false);
  const t=e&&e.type;
  if(t==='peer-unavailable'){netReset(true);netMsg('그 코드로 열린 방이 없어. 코드를 다시 확인해줘.');return olRefresh()}
  if(t==='unavailable-id'){netReset();return netHost()}
  netMsg('연결에 실패했어. 이 화면에선 온라인 연결이 막혀 있을 수 있으니 GitHub 주소로 열어줘.');netReset(true);olRefresh();
}
function netReset(keepMsg,notify=false){
  const {conn,peer,wait}=NET;
  // Invalidate the old identity before close events can fire.
  Object.assign(NET,{on:false,role:null,peer:null,conn:null,code:'',hostCast:null,guestCast:null,last:'',wait:{},seconds:0});
  abortMatchPrompt();
  Object.values(wait).forEach(done=>done(MATCH_PROMPT_ABORTED));
  const close=()=>{try{conn?.close()}catch(e){}try{peer?.destroy()}catch(e){}};
  if(notify&&conn?.open){
    const timer=setTimeout(close,450);
    conn.on('data',m=>{if(m?.t==='leaveAck'){clearTimeout(timer);close()}});
    try{conn.send({t:'leave'})}catch(e){clearTimeout(timer);close()}
  }else close();
  $('online').classList.remove('live');if(!keepMsg)netMsg('');$('diff').hidden=false;
}
function netLeave(){
  if(NET.on)invalidateNetMatch();
  netReset(false,true);
}
function invalidateNetMatch(){
  G.over=true;G.busy=false;G.gid=(G.gid||0)+1;stopClock();abortMatchPrompt();
  $('res').classList.remove('on');$('rGo').onclick=null;
  $('pick').classList.remove('on');
  $('guide').classList.remove('on');G_AFTER=null;
  $('deckView').classList.remove('on','pv');DV_RET=null;
  document.querySelectorAll('.vsov').forEach(v=>v.remove());
}
window.addEventListener('pagehide',()=>{if(NET.on)try{NET.send({t:'leave'})}catch(e){}});
function netHost(){
  if(!window.Peer)return netMsg('연결 도구를 못 불러왔어. GitHub 주소로 열어줘.');
  netReset();const code=String(1000+Math.random()*9000|0);const peer=NET.peer=new Peer('burst31-'+code);NET.role='host';
  peer.on('open',()=>{if(peer===NET.peer){NET.code=code;netMsg('');olRefresh()}});
  peer.on('connection',c=>{if(peer!==NET.peer||NET.conn){c.close();return}bindConn(c)});
  peer.on('error',e=>{if(peer===NET.peer)netErr(e)});
}
function netJoin(code){
  if(!window.Peer)return netMsg('연결 도구를 못 불러왔어. GitHub 주소로 열어줘.');
  code=String(code||'').trim();if(!/^\d{4}$/.test(code))return netMsg('방 코드 네 자리를 넣어줘.');
  netReset();NET.role='guest';const peer=NET.peer=new Peer();netMsg('연결하는 중…');NET.code='';
  peer.on('open',()=>{if(peer===NET.peer)bindConn(peer.connect('burst31-'+code,{reliable:true}))});
  peer.on('error',e=>{if(peer===NET.peer)netErr(e)});
}
function bindConn(c){
  NET.conn=c;
  c.on('open',()=>{if(NET.conn!==c)return;NET.on=true;netMsg('');$('online').classList.add('live');$('diff').hidden=true;if(typeof Screens!=='undefined')Screens.go('online')});
  c.on('data',m=>{if(NET.conn!==c)return;if(m?.t==='leave'){
    try{c.send({t:'leaveAck'})}catch(e){}netLost(true);return;
  }onNet(m)});
  c.on('close',()=>{if(NET.conn===c)netLost(false)});
  c.on('error',()=>{if(NET.conn===c)netLost(false)});
}
function netLost(voluntary){
  if(!NET.on)return;
  const guest=NET.role==='guest';
  const msg=voluntary?(guest?'방장이 나가서 방이 닫혔어요.':'상대가 방에서 나갔어요.'):(guest?'방장과 연결이 끊겼어요.':'상대와 연결이 끊겼어요.');
  invalidateNetMatch();netReset(true);
  Screens.go('online');netMsg(msg);
}
function seatSetup(){
  const[me,op]=SEAT;DECK=[(!NET.on&&window.myDeck&&myDeck(me))||CASTS[me].deck,CASTS[op].deck];NAME[ME]=CASTS[me].name;NAME[AI]=CASTS[op].name;
  const tag=NET.on?' (상대)':' (AI · '+{easy:'쉬움',normal:'보통',hard:'어려움'}[DIFF]+')';
  $('nMe').textContent=NAME[ME];$('nAi').textContent=NAME[AI];$('nAiTag').textContent=NET.on?'상대':'AI · '+{easy:'쉬움',normal:'보통',hard:'어려움'}[DIFF];
  $('sbMeAv').src=`img/p/${me}_av.webp`;$('sbAiAv').src=`img/p/${op}_av.webp`;$('meAv').src=`img/p/${me}_av.webp`;$('meName').textContent=NAME[ME];$('oppSp').src=`img/p/${op}.webp`;{const f=(typeof SPR_SCALE!=='undefined'&&SPR_SCALE[op])||1,o=$('oppSp');o.style.height=Math.round(500*f)+'px';o.style.top=Math.round(58+500*(1-f)*.55)+'px';o.style.left=Math.round(150+500*(1-f)*.3)+'px'}
  const sb=$('sb');sb.dataset.meCast=me;sb.dataset.aiCast=op;
  $('ownIriCutout').hidden=me!=='iri';
  const rs=document.documentElement.style;rs.setProperty('--cMe',CASTS[me].back[0]);rs.setProperty('--cAi',CASTS[op].back[0]);$('aiWho').textContent=NAME[AI]+(NET.on?' (상대)':' (AI)');
  $('meAbil').innerHTML=CASTS[me].abil;$('aiAbil').innerHTML=CASTS[op].abil;
  document.documentElement.style.setProperty('--backA',CASTS[op].back[0]);document.documentElement.style.setProperty('--backB',CASTS[op].back[1]);
  $('pick').classList.remove('on');
  if(typeof Screens!=='undefined')Screens.go('play');
}
function netTryStart(){
  if(NET.role!=='host'||!NET.hostCast||!NET.guestCast)return;
  SEAT=[NET.hostCast,NET.guestCast];G.gid=(G.gid||0)+1;G.over=true;seatSetup();NET.send({t:'start',seat:SEAT,rounds:MATCH,seconds:TURN_SECONDS});NET.last='';const id=G.gid;showVS(SEAT[0],SEAT[1]).then(()=>{if(id===G.gid&&NET.on)newGame()});
}
function onNet(m){
  if(!m||typeof m!=='object')return;
  if(NET.role==='host'){
    if(m.t==='cast'&&CASTS[m.k]&&m.k!==NET.hostCast){NET.guestCast=m.k;olRefresh();netTryStart()}
    else if(m.t==='play'){
      if(G.cur!==AI||G.busy||G.over||(TURN_SECONDS&&(!Number.isInteger(m.turn)||!hasTurnTime(AI,m.turn))))return;const P=G.P[AI],c=P&&P.hand[m.i];if(!c||!playable(AI,c))return;
      let adj=+m.adj||0;if(adj&&(adj!==CASTS[SEAT[AI]].adjust||P.adjUsed||c.lower))adj=0;
      let ch=m.ch;if(c.choice&&!c.choice.includes(ch))return;if(c.lower&&!c.lower.includes(ch))return;
      play(AI,m.i,ch,adj);
    }
    else if(m.t==='ans'&&NET.wait[m.id]){const f=NET.wait[m.id];delete NET.wait[m.id];f(+m.k)}
    return;
  }
  switch(m.t){
    case'hostcast':NET.hostCast=m.k;NET.seconds=m.seconds===30?30:0;olRefresh();break;
    case'start':G.over=true;G.gid=(G.gid||0)+1;stopClock();abortMatchPrompt();TURN_SECONDS=m.seconds===30?30:0;SEAT=[m.seat[1],m.seat[0]];G.rounds=m.rounds||G.rounds;seatSetup();$('feed').innerHTML='';showVS(SEAT[0],SEAT[1]);break;
    case'state':applySnap(m.s);break;
    case'clear':$('feed').innerHTML='';break;
    case'post':{const c=ALLC.find(x=>x.id===m.id);if(c)NET.lastEl=addPost(1-m.p,c,m.v);break}
    case'hit':bigHit();break;
    case'bust':bigBust(m.k||1);break;
    case'bustfx':bustFx(NET.lastEl);break;
    case'log':log(m.msg,flipCls(m.cls),1);break;
    case'ask':{const conn=NET.conn,id=G.gid;ask(m.title,m.text,m.labels.map((l,k)=>({label:l,value:k}))).then(k=>{if(k!==MATCH_PROMPT_ABORTED&&conn===NET.conn&&id===G.gid)NET.send({t:'ans',id:m.id,k})});break}
    case'timeout':Screens.toast(NAME[1-m.p]+' · 시간 초과');break;
    case'result':{const w=m.w===null?null:1-m.w;if(m.final){NET.hostCast=null;NET.guestCast=null;{const id=G.gid,conn=NET.conn;showResult(true,w).then(()=>{if(id===G.gid&&conn===NET.conn)toOnline()})}}else showResult(false,w,true);break}
  }
}

// 온라인 2인 (PeerJS, 방장이 판정)
/* ---------- 온라인 2인 (PeerJS, 방장이 판정) ---------- */
const NET={on:false,role:null,peer:null,conn:null,code:'',hostCast:null,guestCast:null,lastEl:null,last:'',aid:0,wait:{},
  send(m){if(this.conn&&this.conn.open)this.conn.send(m)},
  ev(m){if(this.role==='host'&&this.on)this.send(m)},
  state(){if(this.role!=='host'||!this.on)return;const st=snap(),j=JSON.stringify(st);if(j===this.last)return;this.last=j;this.send({t:'state',s:st})}};
const PH={id:'?',name:'?',v:0,text:''};
function snap(){
  const mask=(P,hide)=>({...P,deck:P.deck.length,hand:hide?P.hand.length:P.hand,used:[],known:hide?[]:P.known});
  return{rounds:G.rounds,hist:G.hist,busts:G.busts,stakeHist:G.stakeHist,round:G.round,score:G.score,wins:G.wins,starter:G.starter,cur:G.cur,gauge:G.gauge,target:G.target,stake:G.stake,busy:G.busy,over:G.over,
    P:G.P.length?[mask(G.P[0],true),mask(G.P[1],false)]:[]};
}
function applySnap(s){
  dismissCardOptions?.(false); // a new authoritative state supersedes any uncommitted local choice
  Object.assign(G,{rounds:s.rounds||5,hist:(s.hist||[]).map(h=>({...h,w:h.w===null?null:1-h.w})),busts:s.busts||0,stakeHist:s.stakeHist||[s.stake],round:s.round,score:[s.score[1],s.score[0]],wins:[s.wins[1],s.wins[0]],starter:1-s.starter,cur:1-s.cur,gauge:s.gauge,target:s.target,stake:s.stake,busy:s.busy,over:s.over});
  $('rounds').querySelectorAll('button').forEach(x=>{const on=+x.dataset.r===G.rounds;x.classList.toggle('on',on);x.setAttribute('aria-checked',on)});
  const fix=P=>({...P,deck:Array(P.deck).fill(null),hand:typeof P.hand==='number'?Array(P.hand).fill(PH):P.hand});
  if(s.P.length)G.P=[fix(s.P[1]),fix(s.P[0])];
  render();
}
const ALLC=[...SHARED,...IRI,...MIKO,...HARU,...MINA];
const flipCls=c=>c==='me'?'ai':c==='ai'?'me':c;
function pickFor(p,title,text,opts,auto){
  if(p===ME)return ask(title,text,opts);
  if(!NET.on)return Promise.resolve(auto());
  const id=++NET.aid;NET.send({t:'ask',id,title,text,labels:opts.map(o=>o.label)});
  return new Promise(r=>{NET.wait[id]=k=>r(opts[k]?opts[k].value:opts[0].value)});
}
function netMsg(h){NET.msg=h;const o=$('olMsg');if(o)o.innerHTML=h;const e=$('olSt');if(e)e.innerHTML=h}
function netErr(e){
  const t=e&&e.type;
  if(t==='peer-unavailable'){netReset(true);netMsg('그 코드로 열린 방이 없어. 코드를 다시 확인해줘.');return olRefresh()}
  if(t==='unavailable-id'){netReset();return netHost()}
  netMsg('연결에 실패했어. 이 화면에선 온라인 연결이 막혀 있을 수 있으니 GitHub 주소로 열어줘.');netReset(true);olRefresh();
}
function netReset(keepMsg){dismissCardOptions?.(false);try{NET.conn&&NET.conn.close()}catch(e){}try{NET.peer&&NET.peer.destroy()}catch(e){}
  Object.assign(NET,{on:false,role:null,peer:null,conn:null,code:'',hostCast:null,guestCast:null,last:'',wait:{}});
  $('online').classList.remove('live');if(!keepMsg)netMsg('');$('diff').hidden=false}
function netHost(){
  if(!window.Peer)return netMsg('연결 도구를 못 불러왔어. GitHub 주소로 열어줘.');
  netReset();const code=String(1000+Math.random()*9000|0);NET.peer=new Peer('burst31-'+code);NET.role='host';
  NET.peer.on('open',()=>{NET.code=code;netMsg('');olRefresh()});
  NET.peer.on('connection',c=>{if(NET.conn){c.close();return}bindConn(c)});
  NET.peer.on('error',netErr);
}
function netJoin(code){
  if(!window.Peer)return netMsg('연결 도구를 못 불러왔어. GitHub 주소로 열어줘.');
  code=String(code||'').trim();if(!/^\d{4}$/.test(code))return netMsg('방 코드 네 자리를 넣어줘.');
  netReset();NET.role='guest';NET.peer=new Peer();netMsg('연결하는 중…');NET.code='';
  NET.peer.on('open',()=>bindConn(NET.peer.connect('burst31-'+code,{reliable:true})));
  NET.peer.on('error',netErr);
}
function bindConn(c){
  NET.conn=c;
  c.on('open',()=>{NET.on=true;netMsg('');$('online').classList.add('live');$('diff').hidden=true;if(typeof Screens!=='undefined')Screens.go('online')});
  c.on('data',onNet);c.on('close',netLost);c.on('error',netLost);
}
function netLost(){if(!NET.on)return;netReset(true);$('modal').classList.remove('on');G.over=true;
  ask('연결 끊김','상대와 연결이 끊겼어. 다시 방을 만들거나 AI와 플레이해.',[{label:'확인',value:1}]).then(()=>{Screens.go('online');netMsg('연결이 끊겼어.')})}
function seatSetup(){
  const[me,op]=SEAT;DECK=[(!NET.on&&window.myDeck&&myDeck(me))||CASTS[me].deck,CASTS[op].deck];NAME[ME]=CASTS[me].name;NAME[AI]=CASTS[op].name;
  const tag=NET.on?' (상대)':' (AI · '+{easy:'쉬움',normal:'보통',hard:'어려움',xhard:'매우 어려움'}[DIFF]+')';
  $('nMe').textContent=NAME[ME];$('nAi').textContent=NAME[AI];$('nAiTag').textContent=NET.on?'상대':'AI · '+{easy:'쉬움',normal:'보통',hard:'어려움',xhard:'매우 어려움'}[DIFF];
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
  SEAT=[NET.hostCast,NET.guestCast];G.gid=(G.gid||0)+1;G.over=true;seatSetup();NET.send({t:'start',seat:SEAT,rounds:MATCH});NET.last='';const id=G.gid;showVS(SEAT[0],SEAT[1]).then(()=>{if(id===G.gid&&NET.on)newGame()});
}
function onNet(m){
  if(!m||typeof m!=='object')return;
  if(NET.role==='host'){
    if(m.t==='cast'&&CASTS[m.k]&&m.k!==NET.hostCast){NET.guestCast=m.k;olRefresh();netTryStart()}
    else if(m.t==='play'){
      if(G.cur!==AI||G.busy||G.over)return;const P=G.P[AI],c=P&&P.hand[m.i];if(!c||!playable(AI,c))return;
      let adj=+m.adj||0;if(adj&&(adj!==CASTS[SEAT[AI]].adjust||P.adjUsed||c.lower))adj=0;
      let ch=m.ch;if(c.choice&&!c.choice.includes(ch))return;if(c.lower&&!c.lower.includes(ch))return;
      play(AI,m.i,ch,adj);
    }
    else if(m.t==='ans'&&NET.wait[m.id]){const f=NET.wait[m.id];delete NET.wait[m.id];f(+m.k)}
    return;
  }
  switch(m.t){
    case'hostcast':NET.hostCast=m.k;olRefresh();break;
    case'start':dismissCardOptions?.(false);G.gid=(G.gid||0)+1;SEAT=[m.seat[1],m.seat[0]];G.rounds=m.rounds||G.rounds;seatSetup();$('feed').innerHTML='';showVS(SEAT[0],SEAT[1]);break;
    case'state':applySnap(m.s);break;
    case'clear':$('feed').innerHTML='';break;
    case'post':{const c=ALLC.find(x=>x.id===m.id);if(c)NET.lastEl=addPost(1-m.p,c,m.v);break}
    case'hit':bigHit();break;
    case'bust':bigBust(m.k||1);break;
    case'bustfx':bustFx(NET.lastEl);break;
    case'log':log(m.msg,flipCls(m.cls),1);break;
    case'ask':ask(m.title,m.text,m.labels.map((l,k)=>({label:l,value:k}))).then(k=>NET.send({t:'ans',id:m.id,k}));break;
    case'result':{const w=m.w===null?null:1-m.w;if(m.final){NET.hostCast=null;NET.guestCast=null;showResult(true,w).then(toOnline)}else showResult(false,w,true);break}
  }
}

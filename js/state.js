// 판 상태(G)와 작은 도구들
let SEAT=['iri','miko'],DECK=[CASTS.iri.deck,CASTS.miko.deck];
// 받침에 맞는 조사: jo('준','이','가') → '준이'
const jo=(w,a,b)=>{const c=w.charCodeAt(w.length-1)-0xAC00;const bat=c>=0&&c<=11171&&c%28>0;if(a==='으로'&&c%28===8)return w+'로';return w+(bat?a:b)};
let SPEED=1;   // 연출 속도 (설정에서 바꿈)
const sleep=ms=>new Promise(r=>setTimeout(r,ms*SPEED));
const shuffle=RULES.shuffle;
const ME=0,AI=1,NAME=['아이리','미코'];

const G={round:0,score:[0,0],wins:[0,0],starter:ME,cur:ME,gauge:0,target:31,stake:1,passes:0,busy:false,over:false,P:[],hist:[],busts:0};

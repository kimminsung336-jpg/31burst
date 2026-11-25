// 효과음. 파일 없이 Web Audio로 합성한다. 모든 소리는 SNS 알림음 모티프(띠-링-띵)에서 나온다.
// 모티프: B5 → E6 → G#6 (위로 올라가는 3음). 카와이 베이스 톤: 짧게 튀는 사각파+삼각파 플럭, 반짝이 종소리, 워블 베이스.
const SFX=(()=>{
  let ac=null,out=null,vol=null;
  const MOTIF=[987.77,1318.51,1661.22];                    // B5 E6 G#6
  const SCALE=[659.25,739.99,830.61,987.77,1108.73,1318.51,1479.98,1661.22,1975.53,2217.46]; // E 장조 펜타토닉
  const on=()=>typeof Save!=='undefined'&&Save.d&&!Save.d.mute;
  const level=()=>typeof Save!=='undefined'&&Save.d&&Save.d.vol!=null?Save.d.vol:.6;
  function ctx(){
    if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();
      vol=ac.createGain();const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
      vol.connect(comp);comp.connect(ac.destination);out=vol}
    if(ac.state==='suspended')ac.resume();
    vol.gain.value=level();return ac;
  }
  // 첫 입력에서 오디오를 깨운다 (브라우저 자동재생 정책)
  addEventListener('pointerdown',()=>ctx(),{once:true,capture:true});
  addEventListener('keydown',()=>ctx(),{once:true,capture:true});

  // 플럭: 사각파+삼각파, 아주 짧게, 처음에 살짝 높게 튀었다 내려온다
  function pluck(f,t=0,dur=.16,g=.22,type='square'){
    const a=ctx();if(!a||!on())return;const s=a.currentTime+t;
    const o1=a.createOscillator(),o2=a.createOscillator(),e=a.createGain(),lp=a.createBiquadFilter();
    o1.type=type;o2.type='triangle';o1.frequency.setValueAtTime(f*1.02,s);o1.frequency.exponentialRampToValueAtTime(f,s+.03);o2.frequency.value=f*2;
    lp.type='lowpass';lp.frequency.setValueAtTime(f*6,s);lp.frequency.exponentialRampToValueAtTime(f*1.5,s+dur);
    e.gain.setValueAtTime(0,s);e.gain.linearRampToValueAtTime(g,s+.004);e.gain.exponentialRampToValueAtTime(.0008,s+dur);
    const g2=a.createGain();g2.gain.value=.35;o1.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(e);e.connect(out);
    o1.start(s);o2.start(s);o1.stop(s+dur+.02);o2.stop(s+dur+.02);
  }
  // 종: 사인파 배음, 길게 울린다 (반짝이)
  function bell(f,t=0,dur=.5,g=.12){
    const a=ctx();if(!a||!on())return;const s=a.currentTime+t;
    [[1,1],[2.76,.35],[5.4,.12]].forEach(([m,k])=>{const o=a.createOscillator(),e=a.createGain();o.type='sine';o.frequency.value=f*m;
      e.gain.setValueAtTime(0,s);e.gain.linearRampToValueAtTime(g*k,s+.003);e.gain.exponentialRampToValueAtTime(.0005,s+dur*(m>1?.5:1));
      o.connect(e);e.connect(out);o.start(s);o.stop(s+dur+.05)});
  }
  // 노이즈 (휙, 쾅)
  function noise(t=0,dur=.2,g=.2,f0=4000,f1=800,type='bandpass'){
    const a=ctx();if(!a||!on())return;const s=a.currentTime+t;
    const b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const src=a.createBufferSource(),fl=a.createBiquadFilter(),e=a.createGain();src.buffer=b;fl.type=type;fl.Q.value=1.2;
    fl.frequency.setValueAtTime(f0,s);fl.frequency.exponentialRampToValueAtTime(f1,s+dur);
    e.gain.setValueAtTime(g,s);e.gain.exponentialRampToValueAtTime(.0008,s+dur);src.connect(fl);fl.connect(e);e.connect(out);src.start(s);
  }
  // 워블 베이스 (카와이 베이스의 그 "와우")
  function wob(f,t=0,dur=.6,g=.3,rate=8,down=true){
    const a=ctx();if(!a||!on())return;const s=a.currentTime+t;
    const o=a.createOscillator(),o2=a.createOscillator(),lp=a.createBiquadFilter(),e=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();
    o.type='sawtooth';o2.type='square';o2.detune.value=-12;o.frequency.setValueAtTime(f,s);o2.frequency.setValueAtTime(f/2,s);
    if(down){o.frequency.exponentialRampToValueAtTime(f/3,s+dur);o2.frequency.exponentialRampToValueAtTime(f/6,s+dur)}
    lp.type='lowpass';lp.Q.value=9;lp.frequency.value=700;lfo.frequency.value=rate;lg.gain.value=600;lfo.connect(lg);lg.connect(lp.frequency);
    e.gain.setValueAtTime(g,s);e.gain.setValueAtTime(g,s+dur*.7);e.gain.exponentialRampToValueAtTime(.0008,s+dur);
    o.connect(lp);o2.connect(lp);lp.connect(e);e.connect(out);[o,o2,lfo].forEach(x=>{x.start(s);x.stop(s+dur+.05)});
  }
  function kick(t=0,g=.5){
    const a=ctx();if(!a||!on())return;const s=a.currentTime+t,o=a.createOscillator(),e=a.createGain();
    o.frequency.setValueAtTime(150,s);o.frequency.exponentialRampToValueAtTime(45,s+.12);e.gain.setValueAtTime(g,s);e.gain.exponentialRampToValueAtTime(.001,s+.22);
    o.connect(e);e.connect(out);o.start(s);o.stop(s+.25);
  }
  const rnd=(a,b)=>a+Math.random()*(b-a);

  return{
    ctx,MOTIF,
    // SNS 알림음 = 모티프 그대로
    notify(t=0,g=.18){MOTIF.forEach((f,i)=>pluck(f,t+i*.07,.14,g));bell(MOTIF[2]*2,t+.14,.4,.06)},
    // 카드 내기: 숫자가 클수록 높은 음
    play(v=1){const i=Math.max(0,Math.min(SCALE.length-1,Math.round(v)+2));pluck(SCALE[i]/2,0,.12,.2);pluck(SCALE[i],.02,.1,.1,'triangle')},
    flip(){noise(0,.18,.16,6000,1200);pluck(MOTIF[0],.12,.1,.12)},
    click(){pluck(1975.53,0,.05,.08,'triangle')},
    blip(){pluck(1318.51,0,.06,.07,'triangle')},
    coin(){pluck(1975.53,0,.08,.14);pluck(2637.02,.07,.22,.14)},
    // 화제성 25 이상: 심장 박동
    near(){kick(0,.45);kick(.18,.3)},
    // 저스트: 모티프를 두 옥타브로 빠르게 + 화음 + 하트 반짝이 쏟아짐
    just(){MOTIF.forEach((f,i)=>{pluck(f/2,i*.06,.16,.22);pluck(f,i*.06+.18,.16,.2)});
      [MOTIF[0],MOTIF[1],MOTIF[2],MOTIF[0]*2].forEach(f=>pluck(f,.42,.7,.1,'sawtooth'));wob(82.4,.42,.7,.22,6,false);kick(.42,.6);
      for(let i=0;i<22;i++)bell(SCALE[(Math.random()*SCALE.length)|0]*2,.5+i*.055+rnd(0,.03),.3,.045)},
    // 버스트: 쾅 + 내려가는 워블 + 리플 알림음이 어긋나게 우르르
    bust(){kick(0,.7);noise(0,.5,.35,3000,200,'lowpass');wob(220,0,.9,.32,11,true);
      for(let i=0;i<14;i++){const t=.25+i*.07+rnd(0,.04),k=rnd(.7,1.15);pluck(MOTIF[0]*k,t,.08,.06);pluck(MOTIF[1]*k,t+.05,.08,.06)}},
    win(){[0,1,2].forEach(i=>pluck(MOTIF[i],i*.09,.2,.18));pluck(MOTIF[0]*2,.3,.5,.16);bell(MOTIF[2]*2,.3,.8,.08)},
    lose(){[2,1,0].forEach((k,i)=>pluck(MOTIF[k]/2,i*.12,.22,.16,'triangle'));wob(110,.36,.5,.14,4,true)},
  };
})();

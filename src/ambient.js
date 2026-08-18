let ctx=null, master=null, noiseSrc=null, chirpTimer=null, running=false, night=false;
let musicBus=null, musicTimer=null, padTimer=null, lastNoteIdx=3, chordIdx=0, padNodes=[];

/* 진짜 BGM: 오르골/칼림바 풍으로 실시간 작곡되는 멜로디 + 은은한 코드 패드.
   외부 음원 없이 전부 오실레이터로 합성 — 5음 펜타토닉이라 항상 화음이 어울림. */
const SCALE = [261.63,293.66,329.63,392.00,440.00,523.25,587.33,659.25]; // C D E G A C5 D5 E5
const CHORDS = [[130.81,164.81,196.00],[174.61,220.00,261.63],[196.00,246.94,293.66],[146.83,185.00,220.00]];

function startMusicBus(){
  musicBus = ctx.createGain(); musicBus.gain.value = 1;
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 2600;
  const delay = ctx.createDelay(1.2); delay.delayTime.value = .36;
  const fb = ctx.createGain(); fb.gain.value = .3;
  const wet = ctx.createGain(); wet.gain.value = .3;
  musicBus.connect(lp);
  lp.connect(master);
  lp.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(master);
}
function playNote(){
  if(!running) return;
  const t = ctx.currentTime;
  const step = [-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)];
  lastNoteIdx = Math.max(0, Math.min(SCALE.length-1, lastNoteIdx+step));
  const freq = SCALE[lastNoteIdx] * (night ? .5 : 1); // 밤엔 한 옥타브 내려 차분하게
  const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value = freq;
  const g = ctx.createGain(); g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(night?.05:.07, t+.04);
  g.gain.exponentialRampToValueAtTime(.0008, t+(night?2.0:1.3));
  o.connect(g).connect(musicBus);
  o.start(t); o.stop(t+(night?2.1:1.4));
  musicTimer = setTimeout(playNote, night ? 1900+Math.random()*2200 : 1100+Math.random()*1500);
}
function setChord(){
  const t = ctx.currentTime;
  const prev = padNodes;
  padNodes = [];
  CHORDS[chordIdx%CHORDS.length].forEach(f=>{
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value = f*(night?.5:1);
    const g = ctx.createGain(); g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(night?.012:.018, t+2);
    o.connect(g).connect(musicBus);
    o.start(t);
    padNodes.push({osc:o,g});
  });
  chordIdx++;
  prev.forEach(n=>{ n.g.gain.linearRampToValueAtTime(0,t+1.5); n.osc.stop(t+1.6); });
  padTimer = setTimeout(setChord, 8000);
}
function startMusic(){
  startMusicBus();
  musicTimer = setTimeout(playNote, 1200);
  setChord();
}

function ensureCtx(){
  if(ctx) return;
  ctx = new (window.AudioContext||window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.0;
  master.connect(ctx.destination);
}
function makeNoiseBuffer(){
  const len = ctx.sampleRate*2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last=0;
  for(let i=0;i<len;i++){
    const white = Math.random()*2-1;
    last = (last + .02*white)/1.02;
    d[i] = last*3.5;
  }
  return buf;
}
function startWaves(){
  noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = makeNoiseBuffer();
  noiseSrc.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type='lowpass'; lp.frequency.value=420; lp.Q.value=.5;
  const g = ctx.createGain(); g.gain.value=.5;
  const lfo = ctx.createOscillator(); lfo.frequency.value=.12;
  const lfoG = ctx.createGain(); lfoG.gain.value=.22;
  lfo.connect(lfoG).connect(g.gain);
  noiseSrc.connect(lp).connect(g).connect(master);
  noiseSrc.start(); lfo.start();
}
function chirp(){
  if(!running) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  if(night){
    o.type='sine'; o.frequency.setValueAtTime(4200,t);
    g.gain.setValueAtTime(0,t);
    for(let k=0;k<5;k++){
      g.gain.setValueAtTime(.05,t+k*.07);
      g.gain.setValueAtTime(0,t+k*.07+.035);
    }
  }else{
    o.type='sine';
    o.frequency.setValueAtTime(2200,t);
    o.frequency.exponentialRampToValueAtTime(3400,t+.09);
    o.frequency.setValueAtTime(2600,t+.14);
    o.frequency.exponentialRampToValueAtTime(3800,t+.22);
    g.gain.setValueAtTime(.06,t);
    g.gain.exponentialRampToValueAtTime(.001,t+.28);
  }
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + (night ? .45 : .32));
  chirpTimer = setTimeout(chirp, 2500+Math.random()*6000);
}
export function ambientStart(isNight){
  ensureCtx();
  if(ctx.state==='suspended') ctx.resume();
  night = !!isNight;
  if(!running){
    running = true;
    startWaves();
    chirpTimer = setTimeout(chirp, 1500);
    startMusic();
  }
  master.gain.linearRampToValueAtTime(.55, ctx.currentTime+1.2);
}
export function ambientSetNight(isNight){ night = !!isNight; }
export function ambientMute(mute){
  if(!ctx) return;
  master.gain.linearRampToValueAtTime(mute?0:.55, ctx.currentTime+.4);
}

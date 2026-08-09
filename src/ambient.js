let ctx=null, master=null, noiseSrc=null, chirpTimer=null, running=false, night=false;

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
  }
  master.gain.linearRampToValueAtTime(.55, ctx.currentTime+1.2);
}
export function ambientSetNight(isNight){ night = !!isNight; }
export function ambientMute(mute){
  if(!ctx) return;
  master.gain.linearRampToValueAtTime(mute?0:.55, ctx.currentTime+.4);
}

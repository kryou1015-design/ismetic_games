import * as THREE from 'three';
import { SIZE, DEPTH } from './config.js';

/* 시간대 4단계: 각도(고도/방위)+색온도 정의 */
const TIME_STATES = [
  { name:'새벽',  em:'🌅', elev:12,  azim:100, color:0xffb08a, sunI:.75, hemi:0xa8b8d8, hemiI:.55, skyTop:0xffd7b0, skyBot:0x8fa8c8 },
  { name:'한낮',  em:'☀️', elev:62,  azim:150, color:0xfff2dc, sunI:1.25,hemi:0xdff2f7, hemiI:.8,  skyTop:0xcfe9f5, skyBot:0xf6e7d3 },
  { name:'노을',  em:'🌇', elev:15,  azim:250, color:0xffa060, sunI:1.0, hemi:0xe8b8a0, hemiI:.6,  skyTop:0xf6d8b8, skyBot:0xe89a7a },
  { name:'밤',    em:'🌙', elev:35,  azim:300, color:0x9fb4ff, sunI:.35, hemi:0x5a6a98, hemiI:.4,  skyTop:0x2c3e66, skyBot:0x40548c },
];
/* 실제 접속 시각(로컬) 기준 4구간 시작 시각 — TIME_STATES와 순서 일치
   새벽 05:00 → 한낮 08:00 → 노을 17:00 → 밤 19:30 → (다음날 05:00) */
const SEG_START = [5, 8, 17, 19.5];
const SEG_CUM = [0, 3, 12, 14.5, 24]; // SEG_START[0](=5시)을 0으로 둔 누적 길이(시간)

function dayPhase(){
  const now = new Date();
  let t = now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600 - SEG_START[0];
  if(t<0) t += 24;
  let idx = 3;
  for(let i=0;i<4;i++){ if(t>=SEG_CUM[i] && t<SEG_CUM[i+1]){ idx=i; break; } }
  const localT = (t-SEG_CUM[idx])/(SEG_CUM[idx+1]-SEG_CUM[idx]);
  return { idx, next:(idx+1)%4, localT };
}

const WEATHER_STATES = {
  clear:  { name:'맑음',   em:'☀️', lightMul:1.0, fogDensity:0.0,  bloomMul:1.0, rain:false },
  cloudy: { name:'흐림',   em:'☁️', lightMul:.65, fogDensity:.028, bloomMul:.7,  rain:false },
  rain:   { name:'비',     em:'🌧️', lightMul:.45, fogDensity:.05,  bloomMul:.55, rain:true  },
};
const WEATHER_MIN_DUR = 60, WEATHER_MAX_DUR = 140;

function lerpColor(a,b,t){ return new THREE.Color(a).lerp(new THREE.Color(b), t); }
function lerpAngle(a,b,t){ return a+(b-a)*t; }

export function createEnvironment(scene, sun, hemi){
  let weatherKey = 'clear';
  let weatherT = 0;
  let weatherDur = WEATHER_MIN_DUR + Math.random()*(WEATHER_MAX_DUR-WEATHER_MIN_DUR);
  let weatherBlend = 1; // 0→1 전환 진행도
  let prevWeatherKey = 'clear';

  scene.fog = new THREE.FogExp2(0x9fb8c8, 0);

  /* 비 파티클 */
  const rainCount = 260;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount*3);
  for(let i=0;i<rainCount;i++){
    rainPos[i*3]=(Math.random()-.5)*SIZE*1.4;
    rainPos[i*3+1]=Math.random()*5;
    rainPos[i*3+2]=(Math.random()-.5)*SIZE*1.4;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos,3));
  const rainMat = new THREE.PointsMaterial({color:0xcfe0ee, size:.03, transparent:true, opacity:0,
    depthWrite:false, blending:THREE.AdditiveBlending});
  const rain = new THREE.Points(rainGeo, rainMat);
  scene.add(rain);

  function pickNextWeather(){
    prevWeatherKey = weatherKey;
    const keys = Object.keys(WEATHER_STATES).filter(k=>k!==weatherKey);
    weatherKey = keys[Math.floor(Math.random()*keys.length)];
    weatherT = 0; weatherBlend = 0;
    weatherDur = WEATHER_MIN_DUR + Math.random()*(WEATHER_MAX_DUR-WEATHER_MIN_DUR);
  }

  function update(dt, areaSky, areaNightForced){
    const { idx, next, localT } = dayPhase();
    const A = TIME_STATES[idx], B = TIME_STATES[next];

    const elev = lerpAngle(A.elev,B.elev,localT);
    const azim = lerpAngle(A.azim,B.azim,localT);
    const col = lerpColor(A.color,B.color,localT);
    const sunI = A.sunI+(B.sunI-A.sunI)*localT;
    const hemiCol = lerpColor(A.hemi,B.hemi,localT);
    const hemiI = A.hemiI+(B.hemiI-A.hemiI)*localT;

    const rad = Math.PI/180;
    const r = 9;
    sun.position.set(
      r*Math.cos(elev*rad)*Math.cos(azim*rad),
      r*Math.sin(elev*rad),
      r*Math.cos(elev*rad)*Math.sin(azim*rad));
    sun.color.copy(col);
    hemi.color.copy(hemiCol); hemi.intensity = hemiI;

    /* 날씨 전환 */
    weatherT += dt;
    if(weatherBlend<1) weatherBlend = Math.min(1, weatherBlend+dt/4);
    if(weatherT > weatherDur) pickNextWeather();
    const W = WEATHER_STATES[weatherKey];
    const Wp = WEATHER_STATES[prevWeatherKey];
    const lightMul = Wp.lightMul+(W.lightMul-Wp.lightMul)*weatherBlend;
    const fogD = Wp.fogDensity+(W.fogDensity-Wp.fogDensity)*weatherBlend;
    const bloomMul = Wp.bloomMul+(W.bloomMul-Wp.bloomMul)*weatherBlend;

    sun.intensity = sunI*lightMul;
    scene.fog.density = fogD;
    scene.fog.color.copy(hemiCol);

    /* 비 표시 */
    const rainOpacity = (Wp.rain?weatherBlend:0)*0 + (W.rain? weatherBlend : (Wp.rain?1-weatherBlend:0));
    rainMat.opacity = Math.max(0, Math.min(1, W.rain||Wp.rain ? (W.rain?weatherBlend:1-weatherBlend) : 0)) * .7;
    if(rainMat.opacity>0.01){
      const pos=rainGeo.attributes.position.array;
      for(let i=0;i<rainCount;i++){
        pos[i*3+1]-=dt*7;
        if(pos[i*3+1]<-DEPTH){ pos[i*3+1]=5; pos[i*3]=(Math.random()-.5)*SIZE*1.4; pos[i*3+2]=(Math.random()-.5)*SIZE*1.4; }
      }
      rainGeo.attributes.position.needsUpdate = true;
      rain.position.set(0,0,0);
    }

    const showA = A.name===B.name || localT<.5;
    return {
      timeName: showA?A.name:B.name, timeEm: showA?A.em:B.em,
      weatherName:W.name, weatherEm:W.em, bloomMul, isNight: idx===3 || areaNightForced
    };
  }

  return { update, get dayT(){return dayPhase();}, get weatherKey(){return weatherKey;} };
}

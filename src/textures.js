import * as THREE from 'three';

/* 캐릭터/소품에 입힐 프로시저럴 텍스처 — 별도 이미지 에셋 없이 캔버스로 생성.
   Sims 1 특유의 "저폴리인데 표면에 무늬/음영이 있는" 질감을 흉내낸다. */

function canvasTex(size, draw){
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function shade(hex, amt){ // amt: -1(검정쪽)~+1(흰쪽)
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(amt>0?0xffffff:0x000000), Math.abs(amt));
  return '#'+c.getHexString();
}

/* 옷: 깅엄/체크무늬 (Sims식 캐주얼 의류 느낌) */
export function ginghamTexture(baseHex, repeat=4){
  const tex = canvasTex(128,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,.30); ctx.fillRect(0,0,s,s);
    const cell = s/8;
    ctx.fillStyle = shade(baseHex,-.14);
    for(let y=0;y<8;y++) for(let x=0;x<8;x++){
      if((x+y)%2===0) ctx.fillRect(x*cell,y*cell,cell,cell);
    }
    ctx.strokeStyle = shade(baseHex,-.32); ctx.lineWidth = 1.4;
    for(let i=0;i<=8;i++){
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(s,i*cell); ctx.stroke();
    }
  });
  tex.repeat.set(repeat,repeat);
  return tex;
}

/* 옷: 가로 스트라이프 (아이용 티셔츠 느낌) */
export function stripeTexture(baseHex, repeat=4){
  const tex = canvasTex(128,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,.18); ctx.fillRect(0,0,s,s);
    ctx.fillStyle = shade(baseHex,-.20);
    const w = s/6;
    for(let i=0;i<6;i+=2) ctx.fillRect(0,i*w,s,w);
  });
  tex.repeat.set(repeat,repeat);
  return tex;
}

/* 피부: 은은한 얼룩/음영 노이즈로 밋밋한 단색 탈피 */
export function skinTexture(baseHex, repeat=2){
  const tex = canvasTex(128,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,0); ctx.fillRect(0,0,s,s);
    ctx.globalAlpha = .45;
    for(let i=0;i<220;i++){
      ctx.fillStyle = shade(baseHex,(Math.random()-.5)*.10);
      const r = 1+Math.random()*2.6;
      ctx.beginPath(); ctx.arc(Math.random()*s,Math.random()*s,r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  tex.repeat.set(repeat,repeat);
  return tex;
}

/* 모자/머리카락: 촘촘한 노이즈로 펠트/섬유 질감 */
export function feltTexture(baseHex, repeat=2){
  const tex = canvasTex(96,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,0); ctx.fillRect(0,0,s,s);
    for(let i=0;i<1400;i++){
      ctx.fillStyle = shade(baseHex,(Math.random()-.5)*.18);
      ctx.fillRect(Math.random()*s,Math.random()*s,1,1);
    }
  });
  tex.repeat.set(repeat,repeat);
  return tex;
}

/* 잔디: Sims식 잔디깎이 줄무늬 + 미세 노이즈 */
export function grassTexture(baseHex, repeat=6){
  const tex = canvasTex(128,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,0); ctx.fillRect(0,0,s,s);
    const band = s/6;
    for(let i=0;i<6;i++){
      ctx.fillStyle = shade(baseHex, i%2===0 ? .07 : -.06);
      ctx.fillRect(0,i*band,s,band);
    }
    ctx.globalAlpha=.35;
    for(let i=0;i<500;i++){
      ctx.fillStyle = shade(baseHex,(Math.random()-.5)*.18);
      ctx.fillRect(Math.random()*s,Math.random()*s,1,2);
    }
    ctx.globalAlpha=1;
  });
  tex.repeat.set(repeat,repeat);
  return tex;
}

/* 흙/모래: 자잘한 알갱이 스펙클 노이즈 */
export function dirtTexture(baseHex, repeat=5){
  const tex = canvasTex(128,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,0); ctx.fillRect(0,0,s,s);
    for(let i=0;i<900;i++){
      ctx.fillStyle = shade(baseHex,(Math.random()-.5)*.30);
      const r=.6+Math.random()*1.6;
      ctx.beginPath(); ctx.arc(Math.random()*s,Math.random()*s,r,0,Math.PI*2); ctx.fill();
    }
  });
  tex.repeat.set(repeat,repeat);
  return tex;
}

/* 나무: 결(그레인) 스트로크 — 낚싯대/데크/나무기둥 공용 */
export function woodTexture(baseHex, repeatX=1, repeatY=3){
  const tex = canvasTex(128,(ctx,s)=>{
    ctx.fillStyle = shade(baseHex,.05); ctx.fillRect(0,0,s,s);
    for(let i=0;i<44;i++){
      const y0 = Math.random()*s;
      ctx.strokeStyle = shade(baseHex,(Math.random()-.5)*.36);
      ctx.lineWidth = .8+Math.random()*1.8;
      ctx.beginPath(); ctx.moveTo(0,y0);
      for(let x=0;x<=s;x+=16) ctx.lineTo(x, y0+Math.sin(x*.05+i)*4+(Math.random()-.5)*3);
      ctx.stroke();
    }
  });
  tex.repeat.set(repeatX,repeatY);
  return tex;
}

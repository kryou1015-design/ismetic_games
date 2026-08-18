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

/* 구름: 겹친 스피어 조각이 아니라, 부드러운 방사형 그라데이션 뭉치를 캔버스에 그려서
   스프라이트로 띄운다 — 윤곽이 흐릿하게 번지는 진짜 뭉게구름 느낌 */
export function cloudTexture(seed=0){
  const w=256,h=160;
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d');
  let s=seed*9973+13; // 시드 기반 의사난수 (구름마다 다른 모양)
  const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return (s%1000)/1000; };
  ctx.globalCompositeOperation='lighter';
  const cx=w/2, cy=h*.62, n=6+Math.floor(rnd()*3);
  for(let i=0;i<n;i++){
    const ang=(i/n)*Math.PI - Math.PI*.1;
    const dist=(0.15+rnd()*.85)*w*.34;
    const x=cx+Math.cos(ang)*dist, y=cy-Math.sin(ang)*dist*.4-rnd()*14;
    const r=(0.34+rnd()*.4)*w*.26;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(255,255,255,.95)');
    g.addColorStop(.65,'rgba(255,255,255,.55)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  /* 아랫면에 은은한 그림자 톤 — 입체감 */
  ctx.globalCompositeOperation='source-atop';
  const shade=ctx.createLinearGradient(0,h*.35,0,h*.95);
  shade.addColorStop(0,'rgba(255,255,255,0)');
  shade.addColorStop(1,'rgba(175,195,210,.55)');
  ctx.fillStyle=shade; ctx.fillRect(0,0,w,h);
  const tex=new THREE.CanvasTexture(cv);
  tex.colorSpace=THREE.SRGBColorSpace;
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

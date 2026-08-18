import * as THREE from 'three';
import { SIZE, DEPTH, HALF, shoreLayout } from './config.js';
import { AREAS, RAR_NAME, RAR_COL, rollSpecies, ROD_TIERS, FIGHT_DIFF,
         XP_PER_RAR, levelOf } from './data.js';
import { S, save, load } from './state.js';
import { makeFloor, makeWaterTop, makeSides } from './water.js';
import { spawnFishes, buildEnvironment, buildCharacter, buildBobber,
         upgradeAssets, decorateArea, upgradeFishBodies } from './entities.js';
import { initUI, updateHUD } from './shop.js';
import { ambientStart, ambientSetNight, ambientMute } from './ambient.js';
import { addEdgeGlow, addBubbles, updateBubbles, addGodRays, updateGodRays, enrichSeabed } from './visuals.js';
import { createEnvironment } from './environment.js';
import { makeDecoMesh, buildSon, makeFishByType } from './entities.js';
import { sizeTier, TIER_LABEL, capturePhoto } from './photo.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

export function start(){
load();
S.xp = S.xp || 0;

/* ============ 렌더러/카메라 ============ */
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
/* 맵(SIZE)이 커진 만큼 카메라 프러스텀/거리도 같은 비율로 넓혀 화면 안에 다 들어오게 함 */
const CAM_K = SIZE/6;
const frust = 9*CAM_K;
let aspect = innerWidth/innerHeight;
const camera = new THREE.OrthographicCamera(-frust*aspect/2, frust*aspect/2, frust/2, -frust/2, .1, 200);
camera.position.set(9.2*CAM_K, 7.4*CAM_K, 9.2*CAM_K); camera.lookAt(0,-.5,0);

/* 블룸 포스트프로세싱 */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .38, .65, .82);
composer.addPass(bloom);
try{ composer.addPass(new SMAAPass(innerWidth,innerHeight)); }catch(e){ console.warn('SMAA skip',e); }
composer.addPass(new OutputPass());

addEventListener('resize',()=>{aspect=innerWidth/innerHeight;
  camera.left=-frust*aspect/2;camera.right=frust*aspect/2;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  composer.setSize(innerWidth,innerHeight);});

/* 하늘: 씬 내부 텍스처 (블룸 합성 시 CSS 배경이 검게 되는 문제 방지) */
function makeSkyTexture(colors){
  const cv = document.createElement('canvas');
  cv.width = 2; cv.height = 512;
  const ctx = cv.getContext('2d');
  const gr = ctx.createLinearGradient(0,0,0,512);
  gr.addColorStop(0, colors[0]); gr.addColorStop(.55, colors[1]); gr.addColorStop(1, colors[2]);
  ctx.fillStyle = gr; ctx.fillRect(0,0,2,512);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============ 조명 ============ */
const hemi = new THREE.HemisphereLight(0xdff2f7, 0xcfe0c8, .75);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dc, 1.25);
sun.position.set(6,10,4); sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);
sun.shadow.radius=3;
sun.shadow.normalBias=.02;
Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});
sun.shadow.bias=-.0005; scene.add(sun);

let pmrem=null; try{ pmrem = new THREE.PMREMGenerator(renderer); }catch(e){ console.warn('PMREM skip',e); }
if(pmrem){
  const cv=document.createElement('canvas'); cv.width=8; cv.height=64;
  const c=cv.getContext('2d'); const gr=c.createLinearGradient(0,0,0,64);
  gr.addColorStop(0,'#dff0ff'); gr.addColorStop(.5,'#ffe9cf'); gr.addColorStop(1,'#8fa89a');
  c.fillStyle=gr; c.fillRect(0,0,8,64);
  const tex=new THREE.CanvasTexture(cv); tex.mapping=THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(tex).texture;
}
const env = createEnvironment(scene, sun, hemi);

/* ============ 지역 월드 ============ */
let world = null;
let charAnim = null;
let curArea = 'lake';
let animState = 'idle';

function disposeWorld(){
  if(!world) return;
  scene.remove(world.group);
  world.group.traverse(o=>{
    if(o.geometry) o.geometry.dispose();
    if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());
  });
  world=null; charAnim=null; animState='idle';
}
function buildWorld(areaId){
  disposeWorld();
  curArea = areaId;
  const A = AREAS[areaId];
  const group = new THREE.Group(); scene.add(group);

  scene.background = makeSkyTexture(A.sky);

  const floor = makeFloor(); group.add(floor.mesh);
  const waterTop = makeWaterTop(A.shallow, A.deep); group.add(waterTop.mesh);
  const sideMats = makeSides(group, A.sideTop, A.sideBot);
  const env = buildEnvironment(group);
  decorateArea(group, areaId, DEPTH, HALF);
  const fishes = spawnFishes(group, areaId);
  upgradeFishBodies(fishes);
  const { chr, rodTip } = buildCharacter(group, env.woodMat);
  const { bobG, fline } = buildBobber(group);
  upgradeAssets(chr, fishes).then(a=>{ charAnim=a; });

  aimIndicator = new THREE.Mesh(new THREE.ConeGeometry(.05,.4,3),
    new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.55}));
  aimIndicator.rotation.x = Math.PI/2; aimIndicator.position.set(0,.05,0);
  aimIndicator.visible=false;
  group.add(aimIndicator);

  son = buildSon(group, chr.position.clone().add(new THREE.Vector3(.5,0,.3)));

  addEdgeGlow(group);
  enrichSeabed(group, areaId);
  const bubbles = addBubbles(group);
  const rays = addGodRays(group, A.night ? 0x9fd8ff : 0xfff0c0);
  bloom.strength = A.night ? .55 : .38;

  world = { group, waterTop, floorMat:floor.mat, sideMats, fishes, env, chr, rodTip, bobG, fline, bubbles, rays, decoMeshes:[] };
  document.getElementById('loc').innerHTML =
    `${A.em} ${A.name}<small>${A.sub} · Lv.<span id="lvVal">${levelOf(S.xp)}</span></small>`;

  document.getElementById('decoBtn').style.display = areaId==='home' ? 'block' : 'none';
  decoMode = false; document.getElementById('decoBtn').classList.remove('active');
  if(areaId==='home'){
    S.deco.forEach(d=>{
      const m = makeDecoMesh(d.id);
      m.position.set(d.x, .46, d.z);
      group.add(m);
      world.decoMeshes.push({mesh:m, id:d.id, x:d.x, z:d.z});
    });
  }
}
function splash(x,z){
  world.waterTop.mat.uniforms.uRip.value[(ripCount++)%5].set(x,-z,tNow,1);
}

/* ============ 캐릭터 애니메이션 ============ */
function playAnim(key){
  if(!charAnim || animState===key) return;
  const next = charAnim[key]; if(!next) return;
  const prev = charAnim[animState];
  next.reset();
  if(prev && prev!==next) next.crossFadeFrom(prev, .18, false);
  next.play();
  animState = key;
}
function playOnce(key, thenKey='idle'){
  if(!charAnim || !charAnim[key]) return;
  playAnim(key);
  const onDone = e=>{
    if(e.action === charAnim[key]){
      charAnim.mixer.removeEventListener('finished', onDone);
      animState='__';
      playAnim(thenKey);
    }
  };
  charAnim.mixer.addEventListener('finished', onDone);
}

/* ============ 상태 ============ */
let state='idle';
let moveTarget=null;
let castPower=0,powerDir=1,holdCast=false;
let waitT=0,waitMax=0,biteT=0,biteWin=0,curFish=null,curZone=0;
let fakeNibbleAt=[],failStreak=0,luckBuff=false;
let flight=null;
let needle=0,pullTarget=0,pullTimer=0,fightProg=0,fightDur=0,redAcc=0,inputDir=0,curDiff=null;
let lured=[];
let ripCount=0;
const keyDir={f:0,r:0};
let son=null;
let aimDir=new THREE.Vector3(1,0,0);
let aimIndicator=null;

/* ============ 첫 낚시 튜토리얼 ============ */
let tutStep = S.tutDone ? 99 : 0;
const TUT = [
  '👋 반가워! 🖱️ 잔디/잔교를 클릭하거나 W A S D 로 움직여봐',
  '🎣 물가에서 [캐스팅] 버튼(또는 스페이스)을 꾹~ 눌렀다 놓으면 게이지만큼 멀리 날아가!',
  '👀 기다리면 찌가 흔들려. 완전히 잠기며 ❗ 뜨는 순간 화면을 탭(스페이스)!',
  '💪 물고기와 힘겨루기! 바늘이 초록 구역에 머물게 좌/우로 버텨 (←→ 키)',
];
function tutShow(){
  const el=$('tut');
  if(tutStep>=TUT.length){el.style.display='none';return;}
  el.textContent=TUT[tutStep]; el.style.display='block';
}
function tutAdvance(fromStep){
  if(tutStep!==fromStep-1) return;
  tutStep=fromStep; tutShow();
}
function tutDone(){
  if(tutStep<99){tutStep=99;S.tutDone=true;save();tutShow();
    toast('🎉 튜토리얼 완료! 이제 진짜 낚시꾼이야');}
}

/* ============ UI 헬퍼 ============ */
const $=id=>document.getElementById(id);
const castBtn=$('castBtn');
let hintTimer=null;
function hint(t){$('hint').textContent=t;$('hint').style.opacity=1;
  clearTimeout(hintTimer);hintTimer=setTimeout(()=>$('hint').style.opacity=0,2500);}
function toast(t){const e=$('toast');e.textContent=t;e.style.opacity=1;
  clearTimeout(e._t);e._t=setTimeout(()=>e.style.opacity=0,1800);}
let AC=null;
function beep(f,d){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type='sine';
  g.gain.setValueAtTime(.12,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);
  o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}

/* ============ 입력 ============ */
const ray=new THREE.Raycaster();
let soundOn = true;
let decoMode = false;
let decoSel = null;
$('decoBtn').onclick = ()=>{
  decoMode = !decoMode;
  $('decoBtn').classList.toggle('active', decoMode);
  if(decoMode){
    const owned = Object.entries(S.decoInv).filter(([,n])=>n>0);
    if(owned.length===0){ toast('시장에서 장식을 먼저 구매해봐 🪴'); decoMode=false;
      $('decoBtn').classList.remove('active'); return; }
    decoSel = owned[0][0];
    toast('마당을 클릭해 배치! 배치된 소품을 클릭하면 회수돼');
  }
};
addEventListener('pointerdown', function first(){
  removeEventListener('pointerdown', first);
  if(soundOn) ambientStart(AREAS[curArea].night);
});
$('sndBtn').onclick = ()=>{
  soundOn = !soundOn;
  $('sndBtn').textContent = soundOn ? '🔊' : '🔇';
  if(soundOn){ ambientStart(AREAS[curArea].night); ambientMute(false); } else ambientMute(true);
};
renderer.domElement.addEventListener('pointermove',e=>{
  if(!world || (state!=='idle' && state!=='casting')) return;
  const ndc=new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
  ray.setFromCamera(ndc,camera);
  const plane=new THREE.Plane(new THREE.Vector3(0,1,0), -world.chr.position.y);
  const pt=new THREE.Vector3();
  if(ray.ray.intersectPlane(plane, pt)){
    const d=pt.clone().sub(world.chr.position); d.y=0;
    if(d.lengthSq()>0.0004) aimDir=d.normalize();
    if(aimIndicator){
      aimIndicator.visible = (state==='idle'||state==='casting');
      aimIndicator.position.set(world.chr.position.x,.05,world.chr.position.z);
      aimIndicator.rotation.y = Math.atan2(aimDir.x, aimDir.z);
    }
  }
});
renderer.domElement.addEventListener('pointerdown',e=>{
  if(decoMode && curArea==='home'){
    const ndc=new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
    ray.setFromCamera(ndc,camera);
    const hitDeco=ray.intersectObjects(world.decoMeshes.map(d=>d.mesh),true)[0];
    if(hitDeco){
      const root=world.decoMeshes.find(d=>{let o=hitDeco.object; while(o){if(o===d.mesh)return true;o=o.parent;} return false;});
      if(root){
        world.group.remove(root.mesh);
        world.decoMeshes.splice(world.decoMeshes.indexOf(root),1);
        S.deco = S.deco.filter(d=>!(d.x===root.x&&d.z===root.z&&d.id===root.id));
        S.decoInv[root.id]=(S.decoInv[root.id]||0)+1;
        save(); toast(`${root.id} 회수함`);
      }
      return;
    }
    const hitW=ray.intersectObjects(world.env.walkables)[0];
    if(hitW){
      if(!decoSel||!(S.decoInv[decoSel]>0)){ toast('배치할 장식이 없어'); return; }
      const m=makeDecoMesh(decoSel);
      m.position.set(hitW.point.x,.46,hitW.point.z);
      world.group.add(m);
      world.decoMeshes.push({mesh:m,id:decoSel,x:hitW.point.x,z:hitW.point.z});
      S.decoInv[decoSel]--; S.deco.push({id:decoSel,x:hitW.point.x,z:hitW.point.z});
      save();
    }
    return;
  }
  if(state==='bite'){strike();return;}
  if(state!=='idle'&&state!=='waiting')return;
  const ndc=new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
  ray.setFromCamera(ndc,camera);
  const hitW=ray.intersectObjects(world.env.walkables)[0];
  if(hitW){
    if(state==='waiting')cancelWait('이동해서 낚시를 접었어');
    moveTarget=new THREE.Vector3(hitW.point.x,.46,hitW.point.z);
    clampToWalk(moveTarget);
    tutAdvance(1);
    if(son){son.userData.state='follow';son.userData.phoneObj.visible=false;}
    return;}
  const hitT=ray.intersectObject(world.waterTop.mesh)[0];
  if(hitT)splash(hitT.point.x,hitT.point.z);
});
/* buildEnvironment()의 물가 잔디밭/데크 치수와 같은 공식(shoreLayout)을 그대로 써서
   맵 크기가 바뀌어도 걸을 수 있는 영역이 항상 실제 지형과 일치하게 유지 */
const SHORE = shoreLayout();
function clampToWalk(v){
  const ix=SHORE.shoreX,iz=SHORE.shoreZ, r=SHORE.patchOfs-.05;
  if(Math.abs(v.x-ix)<=r&&Math.abs(v.z-iz)<=r)return;
  const px0=SHORE.pierX0,pz=SHORE.pierZ;
  v.z=THREE.MathUtils.clamp(v.z,pz-.4,pz+.4);
  v.x=THREE.MathUtils.clamp(v.x,px0-.2,px0+(SHORE.pierLen-1)*.44+.19);}

function startHold(e){e.preventDefault();
  if(state!=='idle')return;
  holdCast=true;castPower=0;powerDir=1;state='casting';
  tutAdvance(2);
  $('powerWrap').style.display='block';}
function endHold(e){e&&e.preventDefault();
  if(state==='casting'&&holdCast){holdCast=false;doCast(castPower);}
  $('powerWrap').style.display='none';}
castBtn.addEventListener('pointerdown',startHold);
castBtn.addEventListener('pointerup',endHold);
castBtn.addEventListener('pointerleave',endHold);
addEventListener('keydown',e=>{
  if(e.code==='Space'&&state==='idle')startHold(e);
  if(e.code==='Space'&&state==='bite')strike();
  if(state==='fight'){
    if(e.code==='ArrowLeft'||e.code==='KeyA')inputDir=-1;
    if(e.code==='ArrowRight'||e.code==='KeyD')inputDir=1;}
  if(e.code==='KeyW')keyDir.f=1; if(e.code==='KeyS')keyDir.f=-1;
  if(e.code==='KeyD')keyDir.r=1; if(e.code==='KeyA')keyDir.r=-1;});
addEventListener('keyup',e=>{
  if(e.code==='Space'&&state==='casting')endHold(e);
  if(state==='fight'&&(e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='ArrowRight'||e.code==='KeyD'))inputDir=0;
  if(e.code==='KeyW'&&keyDir.f===1)keyDir.f=0; if(e.code==='KeyS'&&keyDir.f===-1)keyDir.f=0;
  if(e.code==='KeyD'&&keyDir.r===1)keyDir.r=0; if(e.code==='KeyA'&&keyDir.r===-1)keyDir.r=0;});
document.querySelectorAll('.fbtn').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();inputDir=+b.dataset.dir;});
  b.addEventListener('pointerup',()=>inputDir=0);
  b.addEventListener('pointerleave',()=>inputDir=0);});

/* ============ 낚시 흐름 ============ */
function doCast(p){
  const chr=world.chr;
  const dir=aimDir.clone();
  const dist=.8+p/100*4.2;
  const to=chr.position.clone().add(dir.multiplyScalar(dist));
  const lim=HALF-.3;
  to.x=THREE.MathUtils.clamp(to.x,-lim,lim);
  to.z=THREE.MathUtils.clamp(to.z,-lim,lim);
  to.y=.02;
  const ix=-HALF+1.1;
  if(Math.abs(to.x-ix)<1.15&&Math.abs(to.z-ix)<1.15){toast('물 위로 던져야 해!');state='idle';return;}
  chr.lookAt(to.x,chr.position.y,to.z);
  curZone=p<=30?0:p<=70?1:2;
  playOnce('cast');
  flight={from:world.rodTip(),to,t:0};
  world.bobG.visible=true;world.fline.visible=true;
  state='flight';
  castBtn.textContent='대기중…';castBtn.disabled=true;
  hint(['얕은 곳에 던졌어…','중간 거리! 좋아','최대 거리! 깊은 곳이야'][curZone]);
}
function landBobber(){
  splash(flight.to.x,flight.to.z);beep(520,.06);
  world.bobG.position.copy(flight.to);flight=null;
  state='waiting';waitT=0;waitMax=3+Math.random()*(6+curZone*3);
  fakeNibbleAt=[];const fn=1+Math.floor(Math.random()*2);
  for(let k=0;k<fn;k++)fakeNibbleAt.push(waitMax*(.3+.5*Math.random()));
  lured=world.fishes.slice()
    .sort((a,b)=>a.position.distanceTo(world.bobG.position)-b.position.distanceTo(world.bobG.position))
    .slice(0,2).map(f=>({f,saved:{cx:f.userData.cx,cz:f.userData.cz,r:f.userData.r}}));
  tutAdvance(3);
  sonEnterIdle();
}
function sonEnterIdle(){
  if(!son) return;
  son.userData.state='idle';
  son.userData.idleKind=['wander','phone','sit'][Math.floor(Math.random()*3)];
  son.userData.idleT=0;
  const a=Math.random()*6.28, r=.5+Math.random()*.5;
  son.userData.idleTarget=new THREE.Vector3(
    world.chr.position.x+Math.cos(a)*r,.30,world.chr.position.z+Math.sin(a)*r);
  son.userData.phoneObj.visible = son.userData.idleKind==='phone';
}
function releaseLured(){lured.forEach(({f,saved})=>Object.assign(f.userData,saved));lured=[];}
function cancelWait(msg){
  world.bobG.visible=false;world.fline.visible=false;releaseLured();
  state='idle';castBtn.textContent='캐스팅';castBtn.disabled=false;
  $('bang').style.display='none';
  if(msg)toast(msg);}
function triggerBite(){
  curFish=rollSpecies(curZone, curArea);
  biteWin=[.8,.8,.5,.3][curFish.rar]+(luckBuff?.3:0)+ROD_TIERS[S.rod].bonus;
  biteT=0;state='bite';
  beep(880,.09);if(navigator.vibrate)navigator.vibrate(60);
  splash(world.bobG.position.x,world.bobG.position.z);
  $('bang').style.display='block';
  hint('❗ 지금이야! 화면을 탭!');}
function strike(){
  $('bang').style.display='none';
  state='fight';$('fight').style.display='flex';
  curDiff = FIGHT_DIFF[curFish.rar];
  needle=0; pullTarget=(Math.random()<.5?-1:1)*(0.5+Math.random()*0.4); pullTimer=0;
  fightProg=0; redAcc=0; inputDir=0;
  fightDur=curDiff.dur;
  document.getElementById('tensionBar').style.background =
    `linear-gradient(90deg,#f08a5d 0%,#f7d154 ${50-curDiff.zone*100-8}%,#9be08f ${50-curDiff.zone*100}%,#9be08f ${50+curDiff.zone*100}%,#f7d154 ${50+curDiff.zone*100+8}%,#f08a5d 100%)`;
  castBtn.textContent='캐스팅';
  tutAdvance(4);}
function missBite(){cancelWait('놓쳤다… 물고기가 도망갔어');failStreak++;checkLuck();}
function gainXP(rar){
  const before=levelOf(S.xp);
  S.xp+=XP_PER_RAR[rar];
  const after=levelOf(S.xp);
  const lv=$('lvVal'); if(lv)lv.textContent=after;
  if(after>before){
    toast(`⬆️ 레벨 ${after} 달성!`);
    for(const a of Object.values(AREAS))
      if(a.unlock===after) setTimeout(()=>toast(`${a.em} ${a.name} 해금! 월드맵을 확인해봐`),1900);
  }
}
function fightEnd(win){
  $('fight').style.display='none';
  world.bobG.visible=false;world.fline.visible=false;releaseLured();
  if(win){failStreak=0;luckBuff=false;state='catch';
    playOnce('cheer');
    const first=!S.dex.includes(curFish.id);
    if(first)S.dex.push(curFish.id);
    if(!S.bag[curFish.id])S.bag[curFish.id]={...curFish,n:0};
    S.bag[curFish.id].n++;
    gainXP(curFish.rar);
    tutDone();
    save();
    maybeTakePhoto(curFish, ()=>showCatch(curFish,first));
  }else{state='idle';castBtn.disabled=false;
    toast('앗, 줄이 끊어졌어…');failStreak++;checkLuck();}
  updateHUD();}
function checkLuck(){if(failStreak>=3&&!luckBuff){luckBuff=true;toast('🍀 행운 버프! 다음 입질 판정이 쉬워져');}}
function maybeTakePhoto(fish, after){
  /* 등급이 높을수록 사진 확률 상승: 일반30% 고급45% 희귀65% 에픽90% */
  const chance=[.3,.45,.65,.9][fish.rar];
  if(Math.random()>chance){ after(); return; }

  const scale = fish.rar===0?.75 : fish.rar===1?.9 : fish.rar===2?1.05 : 1.2;
  const tier = sizeTier(scale);
  const fishModel = makeFishByType(fish.body||'round', fish.color||0x6aa8d8, 1, !!fish.glowBody, !!fish.spotted);
  let dataUrl = null;
  try{
    dataUrl = capturePhoto(world.chr, son, fishModel, tier);
  }catch(e){ /* 캡처 실패 시 텍스트만으로 진행 */ }

  const photo={tier, fishId:fish.id, fishName:fish.name, fishEm:fish.em, rar:fish.rar, t:Date.now(), img:dataUrl};
  if(dataUrl){
    $('photoScene').innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
  }else{
    $('photoScene').textContent = fish.em;
  }
  $('photoCaption').textContent = `${TIER_LABEL[tier]} — ${fish.name} ${fish.em}`;
  $('photoPop').style.display='flex';
  $('photoClose').onclick=()=>{
    $('photoPop').style.display='none';
    S.photos.push(photo); save();
    updateAlbumBtn();
    after();
  };
}
function updateAlbumBtn(){
  const b=$('albumBtn');
  b.textContent = S.photos.length>0 ? `📸` : '📸';
}
$('albumBtn').onclick=()=>{
  $('albumCount').textContent=`${S.photos.length}장`;
  $('albumGrid').innerHTML = S.photos.length===0
    ? '<div class="mEmpty" style="grid-column:1/4">아직 사진이 없어. 물고기를 잡아봐!</div>'
    : S.photos.slice().reverse().map(p=>{
        const inner = p.img ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">` : (p.fishEm||'🐟');
        return `<div class="albumCard"><div class="albumScene">${inner}</div>
          <div class="albumCap">${p.fishName}</div></div>`;
      }).join('');
  $('album').style.display='flex';
};
$('albumClose').onclick=()=>$('album').style.display='none';

function showCatch(f,first){
  $('catchFish').textContent=f.em;$('catchName').textContent=f.name;
  $('catchRarity').textContent='★ '+RAR_NAME[f.rar];$('catchRarity').style.color=RAR_COL[f.rar];
  $('catchPrice').textContent=f.g+'G';
  $('catchNew').style.display=first?'inline-block':'none';
  $('catchPop').style.display='flex';
  beep(f.rar>=2?1320:1040,.15);}
$('catchClose').onclick=()=>{$('catchPop').style.display='none';state='idle';castBtn.disabled=false;};
$('invBtn').onclick=()=>{
  const items=Object.values(S.bag);
  $('invList').innerHTML=items.length===0
    ?'<div id="invEmpty">아직 비어있어. 첫 물고기를 낚아보자!</div>'
    :items.sort((a,b)=>b.rar-a.rar).map(f=>
      `<div class="invRow"><span class="em">${f.em}</span><span class="nm">${f.name}</span>
       <span class="tag" style="background:${RAR_COL[f.rar]}">${RAR_NAME[f.rar]}</span>
       <span class="ct">×${f.n} · ${f.g}G</span></div>`).join('');
  $('inv').style.display='flex';};
$('invClose').onclick=()=>$('inv').style.display='none';

/* ============ 지역 이동 ============ */
function gotoArea(id){
  if(!AREAS[id]) return false;
  if(state!=='idle'&&state!=='waiting'){toast('지금은 이동할 수 없어');return false;}
  if(levelOf(S.xp)<AREAS[id].unlock){
    toast(`Lv.${AREAS[id].unlock}부터 갈 수 있어`);return false;}
  if(state==='waiting')cancelWait();
  buildWorld(id);
  ambientSetNight(AREAS[id].night);
  return true;
}

/* ============ 메인 루프 ============ */
let tNow=0;const clock=new THREE.Clock();
const projV=new THREE.Vector3();
function handOffset(){
  /* 캐릭터가 바라보는 방향 기준 살짝 옆/뒤 지점 (손잡는 위치) */
  const fwd=new THREE.Vector3(); world.chr.getWorldDirection(fwd);
  const side=new THREE.Vector3(-fwd.z,0,fwd.x);
  return world.chr.position.clone().add(side.multiplyScalar(-.34)).add(fwd.clone().multiplyScalar(-.12));
}
function updateSon(dt){
  if(!son) return;
  const u=son.userData;
  if(u.state==='follow'){
    const target=handOffset(); target.y=.30;
    const d=target.clone().sub(son.position); d.y=0;
    const dist=d.length();
    if(dist>.02){
      const step=Math.min(dist,1.55*dt);
      son.position.add(d.normalize().multiplyScalar(step));
      son.lookAt(son.position.x-d.x,son.position.y,son.position.z-d.z);
    }
    son.position.y=.30+Math.abs(Math.sin(tNow*10+1))*.02;
  } else { /* idle: 낚시하는 아빠 옆에서 자유행동 */
    u.idleT+=dt;
    if(u.idleKind==='wander'){
      if(!u.idleTarget || son.position.distanceTo(u.idleTarget)<.08 || u.idleT>4){
        const a=Math.random()*6.28, r=.4+Math.random()*.6;
        u.idleTarget=new THREE.Vector3(world.chr.position.x+Math.cos(a)*r,.30,world.chr.position.z+Math.sin(a)*r);
        u.idleT=0;
      }
      const d=u.idleTarget.clone().sub(son.position); d.y=0;
      const dist=d.length();
      if(dist>.03){
        son.position.add(d.normalize().multiplyScalar(Math.min(dist,.55*dt)));
        son.lookAt(son.position.x+d.x,son.position.y,son.position.z+d.z);
      }
      son.position.y=.30+Math.abs(Math.sin(tNow*4))*.015;
    } else if(u.idleKind==='phone'){
      son.position.y=.30;
      son.rotation.y+=Math.sin(tNow*.6)*0.002;
    } else if(u.idleKind==='sit'){
      son.position.y=.20; // 앉은 높이
    }
  }
}
function loop(){
  const dt=Math.min(clock.getDelta(),.05);tNow+=dt;
  const W=world;
  W.waterTop.mat.uniforms.uT.value=tNow;
  W.floorMat.uniforms.uT.value=tNow;
  W.sideMats.forEach(m=>m.uniforms.uT.value=tNow);
  /* 낮/밤·날씨에 따라 변하는 태양 색·세기를 물 반짝임에 반영 */
  W.waterTop.mat.uniforms.uSunColor.value.set(sun.color.r, sun.color.g, sun.color.b);
  W.waterTop.mat.uniforms.uSunStrength.value = sun.intensity;
  if(charAnim)charAnim.mixer.update(dt);

  const chr=W.chr;
  if((keyDir.f||keyDir.r)&&state==='idle'){
    moveTarget=null;
    const inv=0.7071;
    const dx=(-keyDir.f+keyDir.r)*inv, dz=(-keyDir.f-keyDir.r)*inv;
    const next=chr.position.clone();
    next.x+=dx*1.6*dt; next.z+=dz*1.6*dt; next.y=.46;
    clampToWalk(next);
    if(next.distanceTo(chr.position)>.001){
      chr.lookAt(chr.position.x+dx,chr.position.y,chr.position.z+dz);
      chr.position.copy(next);
      playAnim('walk');
      tutAdvance(1);
      if(son&&son.userData.state!=='follow'){son.userData.state='follow';son.userData.phoneObj.visible=false;}
    }
  } else if(!moveTarget&&state==='idle'&&animState==='walk') playAnim('idle');
  if(moveTarget&&state==='idle'){
    const d=moveTarget.clone().sub(chr.position);d.y=0;
    const dist=d.length();
    if(dist<.05){moveTarget=null;playAnim('idle');}
    else{const step=Math.min(dist,1.6*dt);
      chr.position.add(d.normalize().multiplyScalar(step));
      chr.lookAt(moveTarget.x,chr.position.y,moveTarget.z);
      playAnim('walk');
      if(!charAnim)chr.position.y=.46+Math.abs(Math.sin(tNow*10))*.03;}}
  else if(!moveTarget && !(keyDir.f||keyDir.r)) chr.position.y=.46;
  if(!charAnim)chr.scale.y=1+Math.sin(tNow*2.5)*.012;

  if(state==='casting'&&holdCast){
    castPower+=powerDir*120*dt;
    if(castPower>=100){castPower=100;powerDir=-1;}
    if(castPower<=0){castPower=0;powerDir=1;}
    $('powerFill').style.width=castPower+'%';
    projV.copy(chr.position);projV.y+=1.7;projV.project(camera);
    const pw=$('powerWrap');
    pw.style.left=((projV.x*.5+.5)*innerWidth)+'px';
    pw.style.top=((-projV.y*.5+.5)*innerHeight)+'px';
    pw.style.transform='translate(-50%,-100%)';}

  if(state==='flight'&&flight){
    flight.t+=dt/.6;
    if(flight.t>=1)landBobber();
    else{const t=flight.t;
      W.bobG.position.lerpVectors(flight.from,flight.to,t);
      W.bobG.position.y+=Math.sin(Math.PI*t)*1.1;}}

  if(state==='waiting'){
    waitT+=dt;
    for(let k=fakeNibbleAt.length-1;k>=0;k--)
      if(waitT>=fakeNibbleAt[k]){fakeNibbleAt.splice(k,1);
        splash(W.bobG.position.x,W.bobG.position.z);beep(440,.05);}
    lured.forEach(({f})=>{
      f.userData.cx+=(W.bobG.position.x-f.userData.cx)*dt*.4;
      f.userData.cz+=(W.bobG.position.z-f.userData.cz)*dt*.4;
      f.userData.r=Math.max(.35,f.userData.r-dt*.5);});
    if(waitT>=waitMax)triggerBite();}

  if(state==='bite'){
    biteT+=dt;
    W.bobG.position.y=.02-Math.abs(Math.sin(tNow*14))*.12;
    if(biteT>biteWin)missBite();}
  else if(W.bobG.visible&&state==='waiting')
    W.bobG.position.y=.02+Math.sin(tNow*2.2)*.03;

  if(state==='bite'){
    projV.copy(W.bobG.position);projV.y+=.35;projV.project(camera);
    $('bang').style.left=(projV.x*.5+.5)*innerWidth+'px';
    $('bang').style.top=(-projV.y*.5+.5)*innerHeight+'px';}

  if(W.fline.visible)
    W.fline.geometry.setFromPoints([W.rodTip(),W.bobG.position.clone().add(new THREE.Vector3(0,.08,0))]);

  if(state==='fight'){
    const rodStab = ROD_TIERS[S.rod].stab; // 낚싯대가 좋을수록 존이 살짝 넓어짐
    const zone = curDiff.zone + rodStab*.08;
    pullTimer+=dt;
    if(pullTimer>curDiff.interval){
      pullTimer=0;
      pullTarget = -pullTarget*(.6+Math.random()*.5) + (Math.random()-.5)*.3;
      pullTarget = THREE.MathUtils.clamp(pullTarget,-1,1);
    }
    /* 물고기가 pullTarget으로 서서히 끌고, 내가 반대로 누르면 그만큼 저지 */
    needle += (pullTarget-needle)*curDiff.drift*dt;
    needle += inputDir*curDiff.counter*dt;
    needle = THREE.MathUtils.clamp(needle,-1,1);
    $('needle').style.left=(50+needle*46)+'%';
    const inGreen=Math.abs(needle)<zone;
    if(inGreen){fightProg+=dt/fightDur;redAcc=Math.max(0,redAcc-dt*.8);}
    else{redAcc+=dt;}
    $('progFill').style.width=Math.max(0,Math.min(100,fightProg*100))+'%';
    if(fightProg>=1)fightEnd(true);
    else if(redAcc>=curDiff.redTol)fightEnd(false);}

  W.fishes.forEach(f=>{const u=f.userData;
    u.a+=u.sp*dt;
    const lim=HALF-.45;
    f.position.set(
      THREE.MathUtils.clamp(u.cx+Math.cos(u.a)*u.r,-lim,lim),
      u.cy+Math.sin(tNow*1.5+u.a)*.06,
      THREE.MathUtils.clamp(u.cz+Math.sin(u.a)*u.r,-lim,lim));
    f.rotation.y=-u.a+(u.sp>0?-Math.PI/2:Math.PI/2);
    if(u.tail)u.tail.rotation.y=Math.sin(tNow*8+u.a)*.5;});

  const dog=W.group.userData.dog;
  if(dog&&dog.userData.tail){
    dog.userData.tail.rotation.x=Math.sin(tNow*9)*.5;
    dog.position.y=.55+Math.abs(Math.sin(tNow*3))*.015;}
  const tur=W.group.userData.turtle;
  if(tur){
    tur.position.x=Math.cos(tNow*.25)*1.8;
    tur.position.z=Math.sin(tNow*.25)*1.8;
    tur.position.y=-1+Math.sin(tNow*.8)*.15;
    tur.rotation.y=-tNow*.25+Math.PI/2;}

  W.env.weeds.forEach(w=>{w.rotation.z=Math.sin(tNow*1.6+w.userData.ph)*.14;});
  W.env.tree.children.forEach((l,k)=>{if(k>0)l.position.x+=(Math.sin(tNow*1.2+k)*.04-l.position.x)*.1;});
  W.env.lilies.forEach((l,k)=>{l.position.y=.03+Math.sin(tNow*1.4+k)*.015;l.rotation.y+=dt*.05;});
  W.env.clouds.forEach(c=>{c.position.x+=c.userData.sp*dt;if(c.position.x>8)c.position.x=-8;});
  updateBubbles(W.bubbles, dt);
  updateGodRays(W.rays, tNow);
  updateSon(dt);
  const envInfo = env.update(dt, AREAS[curArea].sky, AREAS[curArea].night);
  bloom.strength = (AREAS[curArea].night ? .55 : .38) * envInfo.bloomMul;
  const wEl=$('weatherPill');
  if(wEl) wEl.textContent = `${envInfo.timeEm} ${envInfo.timeName} · ${envInfo.weatherEm} ${envInfo.weatherName}`;

  composer.render();
  requestAnimationFrame(loop);
}
buildWorld('lake');
initUI(gotoArea);
tutShow();
if(S.tutDone) hint('잔디나 잔교를 탭해서 이동해봐');
loop();
}

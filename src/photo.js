import * as THREE from 'three';

/* 물고기 크기(스케일) 기준 4단계 포즈
   palm(손바닥) < oneHand(한손) < twoHand(두손) < together(부자가 함께) */
export function sizeTier(scale){
  if(scale < 0.85) return 'palm';
  if(scale < 1.0)  return 'oneHand';
  if(scale < 1.15) return 'twoHand';
  return 'together';
}
export const TIER_LABEL = {
  palm:'손바닥 위에 살포시',
  oneHand:'한 손으로 번쩍',
  twoHand:'두 손으로 조심조심',
  together:'아빠와 아들이 함께',
};

let renderer=null, scene=null, camera=null;
function ensureRig(){
  if(renderer) return;
  renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
  renderer.setSize(320,320);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20);
  const hemi = new THREE.HemisphereLight(0xfff2e0, 0xcaa878, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6c0, 1.5);
  sun.position.set(2,3,2); sun.castShadow=true;
  scene.add(sun);
  const bgTex = (()=>{
    const cv=document.createElement('canvas'); cv.width=2; cv.height=64;
    const c=cv.getContext('2d'); const gr=c.createLinearGradient(0,0,0,64);
    gr.addColorStop(0,'#f6d8b8'); gr.addColorStop(1,'#f2e0c8');
    c.fillStyle=gr; c.fillRect(0,0,2,64);
    return new THREE.CanvasTexture(cv);
  })();
  scene.background = bgTex;
}

/* dad/son은 실제 게임 캐릭터 그룹을 그대로 재사용(clone)해서 포즈용으로 배치 */
export function capturePhoto(dadTemplate, sonTemplate, fishTemplate, tier){
  ensureRig();
  scene.clear();
  scene.add(new THREE.HemisphereLight(0xfff2e0, 0xcaa878, 0.85));
  const sun = new THREE.DirectionalLight(0xffe6c0, 1.5);
  sun.position.set(2,3,2); scene.add(sun);

  const dad = dadTemplate.clone(true);
  dad.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.material=o.material.clone(); }});
  dad.position.set(0.18,0,0);
  dad.rotation.y = -0.35;
  scene.add(dad);

  const fish = fishTemplate.clone(true);
  fish.traverse(o=>{ if(o.isMesh){ o.castShadow=true; }});
  fish.rotation.set(0, Math.PI/2, 0);

  let camPos, camTarget=new THREE.Vector3(0.05,.9,0);
  if(tier==='palm'){
    fish.scale.setScalar(0.55);
    fish.position.set(.34,.55,.32);
    camPos=new THREE.Vector3(.15,1.15,1.15); camTarget.set(.30,.6,.28);
  } else if(tier==='oneHand'){
    fish.scale.setScalar(0.9);
    fish.rotation.z = Math.PI/2;
    fish.position.set(.36,.95,.30);
    camPos=new THREE.Vector3(.1,1.25,1.25); camTarget.set(.30,.95,.28);
  } else if(tier==='twoHand'){
    fish.scale.setScalar(1.25);
    fish.rotation.z = Math.PI/2;
    fish.position.set(.02,.78,.36);
    camPos=new THREE.Vector3(0,1.15,1.35); camTarget.set(.02,.82,.3);
  } else { /* together */
    const son = sonTemplate.clone(true);
    son.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.material=o.material.clone(); }});
    son.position.set(-.30,0,.02);
    son.rotation.y = 0.35;
    scene.add(son);
    dad.position.set(.20,0,0); dad.rotation.y=-0.3;
    fish.scale.setScalar(1.5);
    fish.rotation.z = Math.PI/2;
    fish.position.set(-.05,.75,.42);
    camPos=new THREE.Vector3(-.05,1.15,1.55); camTarget.set(-.05,.8,.32);
  }
  scene.add(fish);

  camera.position.copy(camPos);
  camera.lookAt(camTarget);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/jpeg', 0.85);
}

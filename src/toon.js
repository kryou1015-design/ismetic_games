import * as THREE from 'three';

/* 셀셰이딩(Toon) 변환 — PBR 그라데이션 음영을 3~4단계로 뚝뚝 끊기는 평면 음영으로
   바꿔서 3D 모델이라도 "2D 카툰 일러스트"에 훨씬 가깝게 보이게 한다.
   MeshStandardMaterial만 MeshToonMaterial로 바꿔치기하고, 이미 flat한
   MeshBasicMaterial이나 물 등 커스텀 ShaderMaterial은 건드리지 않는다. */

let _gradientMap = null;
function toonGradientMap(){
  if(_gradientMap) return _gradientMap;
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 1;
  const ctx = cv.getContext('2d');
  const shades = [70,140,205,255]; // 그림책 같은 4단 톤
  shades.forEach((v,i)=>{ ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(i,0,1,1); });
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  _gradientMap = tex;
  return tex;
}

/* 같은 원본 재질(예: 잔디/나무처럼 여러 메쉬가 공유하는 머티리얼)은 변환 결과도
   공유해서, 씬 전체를 여러 번 순회해도 매번 새 재질이 늘어나지 않게 한다. */
const _toonCache = new WeakMap();
function toonMaterialFor(src){
  if(_toonCache.has(src)) return _toonCache.get(src);
  const tm = new THREE.MeshToonMaterial({
    color: src.color ? src.color.clone() : 0xffffff,
    map: src.map || null,
    transparent: src.transparent, opacity: src.opacity,
    side: src.side,
    gradientMap: toonGradientMap(),
  });
  if(src.emissive){ tm.emissive = src.emissive.clone(); tm.emissiveIntensity = src.emissiveIntensity ?? 1; }
  if(src.emissiveMap) tm.emissiveMap = src.emissiveMap;
  _toonCache.set(src, tm);
  return tm;
}

export function toonify(root){
  root.traverse(o=>{
    if(!o.isMesh || !o.material) return;
    if(Array.isArray(o.material)){
      o.material = o.material.map(m => m.isMeshStandardMaterial ? toonMaterialFor(m) : m);
    } else if(o.material.isMeshStandardMaterial){
      o.material = toonMaterialFor(o.material);
    }
  });
}

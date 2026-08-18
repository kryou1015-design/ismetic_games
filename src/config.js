export const SIZE=20, DEPTH=2.2, HALF=SIZE/2;

/* 물가 잔디밭/데크 배치 — SIZE=6 기준으로 튜닝된 치수를 DENS 배율로 스케일.
   entities.js(지형 생성)와 game.js(걷기 범위 clamp)가 같은 공식을 써야
   지형과 이동 가능 영역이 어긋나지 않으므로 여기 한 곳에만 정의한다. */
export function shoreLayout(){
  const DENS = SIZE/6;
  const patchSize = 2.2*DENS, patchOfs = patchSize/2;
  const shoreX = -HALF+patchOfs, shoreZ = -HALF+patchOfs;
  const pierLen = Math.max(5, Math.round(5*DENS));
  const pierX0 = shoreX+patchOfs*.3, pierZ = shoreZ;
  return { DENS, patchSize, patchOfs, shoreX, shoreZ, pierLen, pierX0, pierZ };
}

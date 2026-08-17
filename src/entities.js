import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SIZE, DEPTH, HALF } from './config.js';
import { ginghamTexture, stripeTexture, skinTexture, feltTexture, woodTexture } from './textures.js';
import { AREA_SPECIES as AREA_SPECIES_REF } from './data.js';
import charUrl from './assets/dad_lowpoly.glb?url';
import fishUrl from './assets/fish.glb?url';
import fishRoundUrl from './assets/fish_round.glb?url';
import fishSlenderUrl from './assets/fish_slender.glb?url';
import fishCatfishUrl from './assets/fish_catfish.glb?url';
import fishSerpentineUrl from './assets/fish_serpentine.glb?url';
const FISH_GLB = { round:fishRoundUrl, slender:fishSlenderUrl, catfish:fishCatfishUrl, serpentine:fishSerpentineUrl };

export function tryLoadGLTF(url){
  return new Promise(res=>{
    new GLTFLoader().load(url, g=>res(g), undefined, ()=>res(null));
  });
}
export function normalizeModel(model, targetH){
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const s = targetH / Math.max(size.y, 0.0001);
  model.scale.setScalar(s);
  const box2 = new THREE.Box3().setFromObject(model);
  model.position.y -= box2.min.y;
  model.traverse(o=>{ if(o.isMesh){ o.castShadow = true; } });
  return model;
}

export function makeFishByType(type, color, scale, glow, spotted){
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness:.42, metalness:.05,
    emissive: glow?color:0x000000, emissiveIntensity: glow?1.4:0 });
  const finC = new THREE.Color(color).lerp(new THREE.Color(0xffffff), .35);
  const fin = new THREE.MeshStandardMaterial({ color: finC, roughness:.65,
    emissive: glow?color:0x000000, emissiveIntensity: glow?.8:0, side:THREE.DoubleSide });
  const eyeM = new THREE.MeshBasicMaterial({color:0x1c2a30});
  let tail;

  if(type==='round'){ /* 붕어·잉어 등: 통통한 몸 + 부채꼴 꼬리 + 등/가슴지느러미 */
    const body = new THREE.Mesh(new THREE.SphereGeometry(.22,20,14), m);
    body.scale.set(1.15,.82,.92);
    tail = new THREE.Group();
    for(const sgn of [1,-1]){
      const t=new THREE.Mesh(new THREE.ConeGeometry(.11,.19,3), fin);
      t.rotation.z=Math.PI/2; t.rotation.x=Math.PI/2*sgn*.35;
      t.position.set(-.30,0,.02*sgn);
      tail.add(t);
    }
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(.09,.15,3), fin);
    dorsal.rotation.x=Math.PI/2; dorsal.position.set(-.02,0,.19);
    for(const sgn of [1,-1]){
      const p=new THREE.Mesh(new THREE.ConeGeometry(.05,.11,3), fin);
      p.rotation.z=Math.PI/2.3*sgn; p.rotation.x=Math.PI/2.2;
      p.position.set(.10,.13*sgn,-.03);
      g.add(p);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.03,8,8), eyeM);
    eye.position.set(.19,.06,.15);
    g.add(body, tail, dorsal, eye);

  } else if(type==='slender'){ /* 피라미·쏘가리·고등어: 유선형 + 갈래꼬리 */
    const body = new THREE.Mesh(new THREE.SphereGeometry(.22,18,12), m);
    body.scale.set(1.65,.52,.58);
    tail = new THREE.Group();
    for(const sgn of [1,-1]){
      const t=new THREE.Mesh(new THREE.ConeGeometry(.10,.28,3), fin);
      t.rotation.z=Math.PI/2; t.rotation.x=Math.PI/2*sgn*.3;
      t.position.set(-.44,0,.05*sgn);
      tail.add(t);
    }
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(.05,.16,3), fin);
    dorsal.rotation.x=Math.PI/2; dorsal.position.set(-.05,0,.11);
    for(const sgn of [1,-1]){
      const p=new THREE.Mesh(new THREE.ConeGeometry(.035,.09,3), fin);
      p.rotation.z=Math.PI/2.3*sgn; p.rotation.x=Math.PI/2.2;
      p.position.set(.15,.075*sgn,-.02);
      g.add(p);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.026,8,8), eyeM);
    eye.position.set(.28,.05,.11);
    g.add(body, tail, dorsal, eye);
    if(spotted){
      const spotM=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.6});
      for(let i=0;i<4;i++){
        const s=new THREE.Mesh(new THREE.SphereGeometry(.016,6,6), spotM);
        s.position.set(-.10+i*.11,.055,.045);
        g.add(s);
      }
    }

  } else if(type==='catfish'){ /* 메기: 납작머리 + 긴 수염 + 넓은 가슴지느러미 */
    const body = new THREE.Mesh(new THREE.SphereGeometry(.22,16,12), m);
    body.scale.set(1.4,.5,.62);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.16,14,10), m);
    head.scale.set(1.05,.55,.68); head.position.x=.26;
    tail = new THREE.Mesh(new THREE.ConeGeometry(.13,.24,3), fin);
    tail.rotation.z = Math.PI/2; tail.position.x = -.40;
    const barbelM = new THREE.MeshStandardMaterial({color:0x2a2620, roughness:.7});
    for(const [sgn,len] of [[1,.24],[-1,.24],[1,.13],[-1,.13]]){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(.004,.002,len,4), barbelM);
      b.position.set(.34,.02*sgn,-.03);
      b.rotation.z = Math.PI/2 - .5*sgn;
      b.rotation.y = .25*sgn;
      g.add(b);
    }
    for(const sgn of [1,-1]){
      const p=new THREE.Mesh(new THREE.ConeGeometry(.06,.16,3), fin);
      p.rotation.z=Math.PI/2.1*sgn; p.rotation.x=Math.PI/2.1;
      p.position.set(.14,.11*sgn,-.05);
      g.add(p);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.02,8,8), eyeM);
    eye.position.set(.30,.06,.07);
    g.add(body, head, tail, eye);

  } else { /* serpentine: 미꾸라지·뱀장어·가물치·오징어 — 매끄러운 S자 체절 */
    const segN=8;
    const segs=[];
    for(let i=0;i<segN;i++){
      const t=i/(segN-1);
      const r=.10*(1-t*.55)*(1+.12*Math.sin(t*Math.PI));
      const seg=new THREE.Mesh(new THREE.SphereGeometry(r,12,9), m);
      seg.scale.set(1.3,1,1);
      seg.position.set(.36-t*.78, Math.sin(t*3.2)*.045*t, 0);
      g.add(seg); segs.push(seg);
    }
    tail = new THREE.Mesh(new THREE.ConeGeometry(.06,.15,3), fin);
    tail.rotation.z=Math.PI/2; tail.position.set(-.44,.05,0);
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(.025,.10,3), fin);
    dorsal.rotation.x=Math.PI/2; dorsal.position.set(-.02,0,.075);
    g.add(tail, dorsal);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.018,8,8), eyeM);
    eye.position.set(.42,.03,.06);
    g.add(eye);
    g.userData.segs = segs;
  }

  g.scale.setScalar(scale);
  g.userData.tail = tail;
  g.userData.bodyType = type;
  g.traverse(o=>{ if(o.isMesh) o.castShadow = true; });
  return g;
}

export function spawnFishes(scene, areaId='lake'){
  const fishes = [];
  const pool = AREA_SPECIES_REF[areaId] || AREA_SPECIES_REF.lake;
  /* 개체수는 등급이 낮을수록 많이, 최대 7마리 */
  const picks=[];
  pool.forEach(sp=>{ const n = sp.rar===0?2 : sp.rar===1?1 : sp.rar===2?1 : (Math.random()<.4?1:0);
    for(let i=0;i<n;i++) picks.push(sp); });
  while(picks.length<5) picks.push(pool[Math.floor(Math.random()*pool.length)]);
  picks.slice(0,7).forEach((sp,k)=>{
    const scale = sp.rar===0?.75 : sp.rar===1?.9 : sp.rar===2?1.05 : 1.2;
    const f = makeFishByType(sp.body||'round', sp.color||0x6aa8d8, scale, !!sp.glowBody, !!sp.spotted);
    f.userData.speciesId = sp.id;
    f.userData.baseColor = sp.color||0x6aa8d8;
    f.userData.glowBody = !!sp.glowBody;
    f.userData.bodyTypeName = sp.body||'round';
    f.userData.r  = .9 + Math.random()*1.6;
    f.userData.cy = -.5 - Math.random()*(DEPTH-.9);
    f.userData.sp = (.2+Math.random()*.3)*(k%2?1:-1) * (sp.body==='serpentine'?0.7:1);
    f.userData.a  = Math.random()*6.28;
    f.userData.cx = (Math.random()-.5)*2;
    f.userData.cz = (Math.random()-.5)*2;
    fishes.push(f); scene.add(f);
  });
  return fishes;
}

export function buildEnvironment(scene){
  const walkables = [];
  const grassMat = new THREE.MeshStandardMaterial({color:0x74b654,roughness:.85});
  const dirtMat  = new THREE.MeshStandardMaterial({color:0x8a6b47,roughness:1});
  const woodMat  = new THREE.MeshStandardMaterial({color:0x9c6b3d,roughness:.7,
    map: woodTexture(0x9c6b3d,1,3)});
  const leafMat  = new THREE.MeshStandardMaterial({color:0x5faf4e,roughness:.9});

  const base = new THREE.Mesh(new THREE.BoxGeometry(SIZE+.14,.3,SIZE+.14), dirtMat);
  base.position.y = -DEPTH-.16; scene.add(base);

  const rockMat = new THREE.MeshStandardMaterial({color:0x7d8a90,roughness:1});
  for(let i=0;i<7;i++){
    const r=.18+Math.random()*.3;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(r,1),rockMat);
    rock.position.set((Math.random()-.5)*SIZE*.85,-DEPTH+r*.6,(Math.random()-.5)*SIZE*.85);
    rock.rotation.set(Math.random()*3,Math.random()*3,0); rock.scale.y=.7;
    rock.castShadow=rock.receiveShadow=true; scene.add(rock);
  }
  const weeds=[];
  const weedMat=new THREE.MeshStandardMaterial({color:0x3f9a5e,roughness:.9});
  for(let i=0;i<14;i++){
    const h=.4+Math.random()*.7;
    const w=new THREE.Mesh(new THREE.ConeGeometry(.05,h,10),weedMat);
    w.position.set((Math.random()-.5)*SIZE*.9,-DEPTH+h/2,(Math.random()-.5)*SIZE*.9);
    w.userData={ph:Math.random()*6.28}; w.castShadow=true;
    weeds.push(w); scene.add(w);
  }

  const iDirt=new THREE.Mesh(new THREE.BoxGeometry(2.2,DEPTH*.55,2.2),dirtMat);
  iDirt.position.set(-HALF+1.1,-DEPTH*.55/2+.3,-HALF+1.1); iDirt.castShadow=true; scene.add(iDirt);
  const iTop=new THREE.Mesh(new THREE.BoxGeometry(2.24,.16,2.24),grassMat);
  iTop.position.set(-HALF+1.1,.38,-HALF+1.1);
  iTop.castShadow=iTop.receiveShadow=true;
  scene.add(iTop); walkables.push(iTop);

  const tree=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.9,14),woodMat);
  trunk.position.y=.9; trunk.castShadow=true; tree.add(trunk);
  [[0,1.6,0,.55],[-.35,1.35,.1,.38],[.33,1.4,-.08,.36]].forEach(([x,y,z,r])=>{
    const l=new THREE.Mesh(new THREE.IcosahedronGeometry(r,2),leafMat);
    l.position.set(x,y,z); l.castShadow=true; tree.add(l);
  });
  tree.position.set(-HALF+.7,.3,-HALF+.7); scene.add(tree);

  const pier=new THREE.Group();
  for(let k=0;k<5;k++){
    const p=new THREE.Mesh(new THREE.BoxGeometry(.4,.07,.9),woodMat);
    p.position.set(k*.44,.42,0);
    p.castShadow=p.receiveShadow=true;
    pier.add(p); walkables.push(p);
  }
  for(const px of [.1,1,1.8]) for(const pz of [-.35,.35]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.4,8),woodMat);
    post.position.set(px,-.3,pz); post.castShadow=true; pier.add(post);
  }
  pier.position.set(-HALF+2.1,0,-HALF+1.1); scene.add(pier);

  const lilyM=new THREE.MeshStandardMaterial({color:0x5aa64e,roughness:.9});
  const lilies=[];
  [[1.6,1.8],[2.2,.3],[-.8,2.2],[.6,-2.3],[-2.2,-1.2]].forEach(([x,z])=>{
    const l=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.02,16,1,false,.4,5.6),lilyM);
    l.position.set(x,.03,z); lilies.push(l); scene.add(l);
  });

  const cloudM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92});
  const clouds=[];
  for(let i=0;i<3;i++){
    const c=new THREE.Group();
    [[0,0,0,.5],[.55,.08,.1,.36],[-.5,.05,-.05,.32]].forEach(([x,y,z,r])=>{
      const s=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),cloudM);
      s.position.set(x,y,z); s.scale.y=.6; c.add(s);
    });
    c.position.set(-6+i*5,3.4+i*.5,-3+i*2.4);
    c.userData.sp=.12+i*.05;
    clouds.push(c); scene.add(c);
  }
  return { walkables, weeds, tree, lilies, clouds, woodMat };
}

export function decorateArea(group, areaId, DEPTH_, HALF_){
  const stone = new THREE.MeshStandardMaterial({color:0x9aa5a3, roughness:.95});
  const moss  = new THREE.MeshStandardMaterial({color:0x6a9e5f, roughness:.9});
  if(areaId==='home'){
    const wall = new THREE.MeshStandardMaterial({color:0xd8c4a0, roughness:.9});
    const roof = new THREE.MeshStandardMaterial({color:0xb84a3a, roughness:.8});
    const wood2= new THREE.MeshStandardMaterial({color:0x8a6238, roughness:.9});
    const winM = new THREE.MeshStandardMaterial({color:0xffe9a8, roughness:.4,
      emissive:0xffc860, emissiveIntensity:1.1});
    const hx=-HALF_+1.0, hz=-HALF_+0.85;
    const hb=new THREE.Mesh(new THREE.BoxGeometry(1.15,.85,.95), wall);
    hb.position.set(hx,.46+.42,hz); hb.castShadow=true; group.add(hb);
    const rg=new THREE.CylinderGeometry(.72,.72,1.25,3,1);
    const rf=new THREE.Mesh(rg, roof);
    rf.rotation.z=Math.PI/2; rf.rotation.x=Math.PI;
    rf.position.set(hx,.46+1.12,hz); rf.scale.set(1,.9,.62);
    rf.castShadow=true; group.add(rf);
    const win=new THREE.Mesh(new THREE.BoxGeometry(.24,.24,.03), winM);
    win.position.set(hx-.25,.46+.55,hz+.49); group.add(win);
    const door=new THREE.Mesh(new THREE.BoxGeometry(.26,.5,.03), wood2);
    door.position.set(hx+.28,.46+.25,hz+.49); group.add(door);
    const shed=new THREE.Mesh(new THREE.BoxGeometry(.55,.5,.5), wood2);
    shed.position.set(hx+1.0,.46+.25,hz-.15); shed.castShadow=true; group.add(shed);
    const shedRoof=new THREE.Mesh(new THREE.BoxGeometry(.65,.08,.6),
      new THREE.MeshStandardMaterial({color:0x6a7a8a,roughness:.8}));
    shedRoof.position.set(hx+1.0,.46+.54,hz-.15); group.add(shedRoof);
    for(let i=0;i<8;i++){
      const fl=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),
        new THREE.MeshStandardMaterial({color:[0xf6b8d0,0xf7d154,0xb8d0f6][i%3],roughness:.7}));
      fl.position.set(hx-.9+Math.random()*.5,.5,hz+.6+Math.random()*.6);
      group.add(fl);
    }
    const dog=new THREE.Group();
    const dogM=new THREE.MeshStandardMaterial({color:0xd8a55a,roughness:.85});
    const db=new THREE.Mesh(new THREE.SphereGeometry(.14,12,10),dogM);
    db.scale.set(1.3,.9,.9);
    const dh=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),dogM);
    dh.position.set(.17,.1,0);
    const ear1=new THREE.Mesh(new THREE.ConeGeometry(.04,.09,6),dogM);
    ear1.position.set(.17,.22,.06);
    const ear2=ear1.clone(); ear2.position.z=-.06;
    const tail=new THREE.Mesh(new THREE.ConeGeometry(.03,.14,6),dogM);
    tail.position.set(-.2,.1,0); tail.rotation.z=-.9;
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),
      new THREE.MeshStandardMaterial({color:0x2b2b2b}));
    nose.position.set(.28,.08,0);
    dog.add(db,dh,ear1,ear2,tail,nose);
    dog.userData.tail=tail;
    dog.position.set(hx+.5,.55,hz+1.1);
    dog.rotation.y=.7;
    dog.traverse(o=>{if(o.isMesh)o.castShadow=true;});
    group.add(dog);
    group.userData.dog=dog;
  }
  if(areaId==='ruins'){
    [[1.4,-0.6],[0.3,1.7],[-1.2,-1.8],[2.2,1.2]].forEach(([x,z],k)=>{
      const h = 1.4 + (k%2)*0.8;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,h,10), stone);
      col.position.set(x, -DEPTH_+h/2, z); col.castShadow=true; group.add(col);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(.6,.14,.6), stone);
      cap.position.set(x, -DEPTH_+h+.07, z); cap.castShadow=true; group.add(cap);
      if(k%2===0){ const m=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6), moss);
        m.position.set(x+.1,-DEPTH_+h+.2,z); m.scale.y=.5; group.add(m); }
    });
    const turtle = new THREE.Group();
    const shell=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),
      new THREE.MeshStandardMaterial({color:0x4e8c4a,roughness:.8}));
    shell.scale.set(1.2,.55,1);
    const headT=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),
      new THREE.MeshStandardMaterial({color:0x8fbf6a,roughness:.8}));
    headT.position.set(.3,0,0);
    turtle.add(shell,headT);
    turtle.position.set(0,-1.0,0);
    group.add(turtle);
    group.userData.turtle = turtle;
  }
  if(areaId==='sea'){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.3,8),
      new THREE.MeshStandardMaterial({color:0x6b4a2b,roughness:.9}));
    post.position.set(-HALF_+2.6,1.05,-HALF_+1.5); post.castShadow=true; group.add(post);
    const lampM=new THREE.MeshStandardMaterial({color:0xffd98a,roughness:.4,
      emissive:0xffb347,emissiveIntensity:2.2});
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,10,10),lampM);
    lamp.position.set(-HALF_+2.6,1.72,-HALF_+1.5); group.add(lamp);
    const pl=new THREE.PointLight(0xffc069,1.4,6);
    pl.position.copy(lamp.position); group.add(pl);
    const chest=new THREE.Group();
    const box=new THREE.Mesh(new THREE.BoxGeometry(.5,.32,.34),
      new THREE.MeshStandardMaterial({color:0x8a5a2b,roughness:.8}));
    const lid=new THREE.Mesh(new THREE.BoxGeometry(.52,.12,.36),
      new THREE.MeshStandardMaterial({color:0xd4a54a,roughness:.4,
        emissive:0x8a6a1a,emissiveIntensity:.5}));
    lid.position.y=.22;
    chest.add(box,lid);
    chest.position.set(1.6,-DEPTH_+.18,-1.2);
    chest.rotation.y=.6;
    group.add(chest);
    for(let i=0;i<5;i++){
      const c=new THREE.Mesh(new THREE.ConeGeometry(.09,.4,6),
        new THREE.MeshStandardMaterial({color:[0xff7ab8,0x7adfff,0xb87aff][i%3],roughness:.6,
          emissive:[0xff7ab8,0x7adfff,0xb87aff][i%3],emissiveIntensity:.8}));
      c.position.set((Math.random()-.5)*4.5,-DEPTH_+.2,(Math.random()-.5)*4.5);
      c.rotation.z=(Math.random()-.5)*.5;
      group.add(c);
    }
  }
}

export function buildCharacter(scene, woodMat){
  const chr=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xffe3c7,roughness:.8, map:skinTexture(0xffe3c7)});
  const cloth=new THREE.MeshStandardMaterial({color:0xf2a65a,roughness:.85, map:ginghamTexture(0xf2a65a)});
  const hatM=new THREE.MeshStandardMaterial({color:0x4a8fa8,roughness:.85, map:feltTexture(0x4a8fa8)});
  const body=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),cloth);
  body.scale.set(1,1.15,.9); body.position.y=.22;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,18,14),skin); head.position.y=.62;
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.03,18),hatM); brim.position.y=.78;
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10,0,6.3,0,1.5),hatM); cap.position.y=.78;
  const eyeMt=new THREE.MeshBasicMaterial({color:0x1c2a30});
  const e1=new THREE.Mesh(new THREE.SphereGeometry(.028,8,8),eyeMt);
  const e2=e1.clone();
  e1.position.set(.1,.62,.2); e2.position.set(-.1,.62,.2);
  const pantsM=new THREE.MeshStandardMaterial({color:0x5a4230,roughness:.85});
  const shoeM=new THREE.MeshStandardMaterial({color:0x4a3222,roughness:.7});
  const legs=[-.075,.075].map(x=>{
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.048,.09,4,8),pantsM);
    leg.position.set(x,.06,0); return leg;
  });
  const shoes=[-.075,.075].map(x=>{
    const shoe=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),shoeM);
    shoe.scale.set(1,.65,1.3); shoe.position.set(x,.015,.02); return shoe;
  });
  const arms=[-.2,.2].map(x=>{
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.038,.19,4,8),cloth);
    arm.position.set(x,.30,0); arm.rotation.z=x<0?.3:-.3; return arm;
  });
  const placeholder=[body,head,brim,cap,e1,e2,...legs,...shoes,...arms];
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.014,.02,1.3,8),woodMat);
  rod.position.set(.28,.75,.3); rod.rotation.set(Math.PI/3.5,0,-Math.PI/9);
  chr.add(...placeholder, rod);
  chr.userData.placeholder = placeholder;
  chr.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  chr.position.set(-HALF+2.1+1.8,.46,-HALF+1.1);
  scene.add(chr);
  const rodTip = ()=>chr.localToWorld(new THREE.Vector3(.42,1.35,.75));
  return { chr, rodTip };
}

export function buildBobber(scene){
  const bobG=new THREE.Group();
  const t=new THREE.Mesh(new THREE.SphereGeometry(.06,10,10),
    new THREE.MeshStandardMaterial({color:0xe8574b,roughness:.4}));
  t.position.y=.05;
  const b=new THREE.Mesh(new THREE.SphereGeometry(.055,10,10),
    new THREE.MeshStandardMaterial({color:0xf7f5ee,roughness:.4}));
  bobG.add(t,b); bobG.visible=false; scene.add(bobG);
  const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  const fline=new THREE.Line(lineGeo,
    new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.7}));
  fline.visible=false; scene.add(fline);
  return { bobG, fline };
}

export async function upgradeAssets(chr, fishes){
  let charAnim = null;
  const g = await tryLoadGLTF(charUrl);
  if(g){
    chr.userData.placeholder.forEach(p=>p.visible=false);
    const model = normalizeModel(g.scene, 1.05);
    /* GLB 재질(Cloth/Skin/Hat/Wood)은 텍스처 없이 단색이라 밋밋해 보임 —
       이름으로 찾아서 프로시저럴 텍스처를 입혀 표면 디테일을 준다 */
    const matTex = {
      Cloth: ginghamTexture(0xf2a65a), Skin: skinTexture(0xffe3c7),
      Hat: feltTexture(0x4a8fa8), Wood: woodTexture(0x9c6b3d,1,3),
    };
    model.traverse(o=>{
      if(o.isMesh && o.material && matTex[o.material.name] && !o.material.map){
        o.material.map = matTex[o.material.name];
        o.material.needsUpdate = true;
      }
    });
    chr.add(model);
    if(g.animations && g.animations.length){
      const mixer = new THREE.AnimationMixer(model);
      const act = n => {
        const clip = g.animations.find(a=>a.name===n) || g.animations.find(a=>a.name.includes(n));
        return clip ? mixer.clipAction(clip) : null;
      };
      charAnim = { mixer,
        idle: act('Idle'), walk: act('Walking_A'),
        cast: act('Throw'), cheer: act('Cheer') };
      [charAnim.cast, charAnim.cheer].forEach(a=>{
        if(a){ a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; }
      });
      if(charAnim.idle) charAnim.idle.play();
    }
  }
  /* 물고기는 실제 종별 프로시저럴 형태(4체형)를 그대로 유지 — 획일적 모델로 덮지 않음 */
  return charAnim;
}

/* ---------- 장식 소품 (집 꾸미기) ---------- */
export function makeDecoMesh(id){
  const wood = new THREE.MeshStandardMaterial({color:0x8a6238, roughness:.9});
  const g = new THREE.Group();
  if(id==='fence'){
    for(const x of [-.18,.18]){
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.22,6),wood);
      p.position.set(x,.11,0); g.add(p);
    }
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.42,.03,.02),wood);
    rail.position.y=.16; g.add(rail);
  } else if(id==='lantern'){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.3,6),wood);
    post.position.y=.15; g.add(post);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.06,10,10),
      new THREE.MeshStandardMaterial({color:0xffd98a,roughness:.4,emissive:0xffb347,emissiveIntensity:1.8}));
    lamp.position.y=.32; g.add(lamp);
    const pl=new THREE.PointLight(0xffc069,.9,3); pl.position.y=.32; g.add(pl);
  } else if(id==='flower'){
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.08,10),
      new THREE.MeshStandardMaterial({color:0xb5754a,roughness:.9}));
    pot.position.y=.04; g.add(pot);
    const col=[0xf6b8d0,0xf7d154,0xb8d0f6][Math.floor(Math.random()*3)];
    const fl=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),
      new THREE.MeshStandardMaterial({color:col,roughness:.7}));
    fl.position.y=.13; g.add(fl);
  } else if(id==='bench'){
    const seat=new THREE.Mesh(new THREE.BoxGeometry(.32,.03,.14),wood);
    seat.position.y=.14; g.add(seat);
    const back=new THREE.Mesh(new THREE.BoxGeometry(.32,.16,.02),wood);
    back.position.set(0,.22,-.06); g.add(back);
    for(const x of [-.13,.13]){
      const leg=new THREE.Mesh(new THREE.BoxGeometry(.02,.14,.02),wood);
      leg.position.set(x,.07,0); g.add(leg);
    }
  } else if(id==='stone'){
    const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.09,0),
      new THREE.MeshStandardMaterial({color:0x9aa5a3,roughness:.95}));
    s.scale.set(1.2,.8,1); s.position.y=.06; g.add(s);
  }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return g;
}

/* ---------- 아들 NPC (동행 캐릭터) ---------- */
export function buildSon(scene, parentPos){
  const son=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xffe3c7,roughness:.8, map:skinTexture(0xffe3c7)});
  const cloth=new THREE.MeshStandardMaterial({color:0x6aa8d8,roughness:.85, map:stripeTexture(0x6aa8d8)}); // 파란 스트라이프 옷(아빠와 구분)
  const hairM=new THREE.MeshStandardMaterial({color:0x3a2a1a,roughness:.8, map:feltTexture(0x3a2a1a)});
  const scale=0.72; // 아빠보다 작은 아이 비율
  const body=new THREE.Mesh(new THREE.SphereGeometry(.16*scale/.9,16,12),cloth);
  body.scale.set(1,1.1,.9); body.position.y=.16;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.21,18,14),skin); head.position.y=.46;
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.20,14,10,0,6.3,0,1.6),hairM);
  hair.position.y=.50;
  const eyeMt=new THREE.MeshBasicMaterial({color:0x1c2a30});
  const e1=new THREE.Mesh(new THREE.SphereGeometry(.024,8,8),eyeMt);
  const e2=e1.clone();
  e1.position.set(.09,.46,.17); e2.position.set(-.09,.46,.17);
  const cheekM=new THREE.MeshStandardMaterial({color:0xf0a08d,roughness:.9});
  const c1=new THREE.Mesh(new THREE.SphereGeometry(.03,8,8),cheekM);
  const c2=c1.clone();
  c1.position.set(.14,.40,.14); c2.position.set(-.14,.40,.14);

  /* 팔다리/신발 — 그냥 텍스처만 입은 공이 아니라 실제 사람처럼 보이도록 */
  const pantsM=new THREE.MeshStandardMaterial({color:0x3d5a78,roughness:.85});
  const shoeM=new THREE.MeshStandardMaterial({color:0x4a3222,roughness:.7});
  const legs=[-.055,.055].map(x=>{
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.07,4,8),pantsM);
    leg.position.set(x,.045,0); return leg;
  });
  const shoes=[-.055,.055].map(x=>{
    const shoe=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),shoeM);
    shoe.scale.set(1,.65,1.3); shoe.position.set(x,.012,.015); return shoe;
  });
  const arms=[-.15,.15].map(x=>{
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.028,.15,4,8),cloth);
    arm.position.set(x,.23,0); arm.rotation.z=x<0?.32:-.32; return arm;
  });
  son.add(body,head,hair,e1,e2,c1,c2,...legs,...shoes,...arms);
  son.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  son.position.copy(parentPos);
  scene.add(son);
  son.userData = { state:'idle', idleKind:'wander', idleT:0, idleTarget:null, phoneObj:null };
  /* 폰 보기용 소품(필요시 표시) */
  const phone=new THREE.Mesh(new THREE.BoxGeometry(.05,.09,.01),
    new THREE.MeshStandardMaterial({color:0x222831,roughness:.3,emissive:0x4a7ab8,emissiveIntensity:.6}));
  phone.position.set(.14,.34,.14);
  phone.visible=false;
  son.add(phone);
  son.userData.phoneObj = phone;
  return son;
}

/* ---------- 물고기: 프로시저럴 → 매끈한 Blender 스킨모디파이어 모델로 업그레이드 ---------- */
const fishGlbCache = {};
export async function upgradeFishBodies(fishes){
  await Promise.all(fishes.map(async f=>{
    const type = f.userData.bodyTypeName;
    const url = FISH_GLB[type];
    if(!url) return;
    if(!fishGlbCache[type]) fishGlbCache[type] = await tryLoadGLTF(url);
    const src = fishGlbCache[type];
    if(!src) return;
    const model = src.scene.clone(true);
    model.traverse(o=>{
      if(o.isMesh){
        o.castShadow = true;
        o.material = o.material.clone();
        /* 본체/지느러미 구분 없이 몸 색만 종 색상으로, 밝은 지느러미는 원래 톤 유지가 자연스러워 유지 */
        if(o.material.name.startsWith('body') || !o.material.name.includes('.')){
          o.material.color.setHex(f.userData.baseColor);
          if(f.userData.glowBody){
            o.material.emissive.setHex(f.userData.baseColor);
            o.material.emissiveIntensity = .9;
          }
        }
      }
    });
    /* 원래 플레이스홀더(프로시저럴) 크기에 맞춰 정규화 */
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const targetLen = 0.5; // 대략적 기준 길이
    const s = targetLen / Math.max(size.x, 0.0001);
    model.scale.setScalar(s);
    f.children.slice().forEach(c=>{ if(c!==model) c.visible=false; });
    f.add(model);
    f.userData.tail = model; // 매끈한 모델은 통째로 살짝 흔들리게(전용 tail 세그먼트 없음)
  }));
}

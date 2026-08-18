import * as THREE from 'three';
import { SIZE, DEPTH, HALF } from './config.js';

export function addEdgeGlow(group){
  const mat = new THREE.LineBasicMaterial({
    color:0xbdfdff, transparent:true, opacity:.85,
    blending:THREE.AdditiveBlending, depthWrite:false });
  const pts = [];
  const y0 = 0.015, y1 = -DEPTH;
  const c = [[-HALF,-HALF],[HALF,-HALF],[HALF,HALF],[-HALF,HALF]];
  for(let i=0;i<4;i++){
    const a=c[i], b=c[(i+1)%4];
    pts.push(new THREE.Vector3(a[0],y0,a[1]), new THREE.Vector3(b[0],y0,b[1]));
  }
  c.forEach(([x,z])=>{ pts.push(new THREE.Vector3(x,y0,z), new THREE.Vector3(x,y1,z)); });
  const g1 = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.LineSegments(g1, mat);
  line.renderOrder = 8; group.add(line);
  const mat2 = mat.clone(); mat2.opacity=.35;
  const line2 = line.clone(); line2.material=mat2;
  line2.position.y = .05; line2.renderOrder = 8; group.add(line2);
  return { line, line2 };
}

export function addBubbles(group, count=46){
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const spd = new Float32Array(count);
  for(let i=0;i<count;i++){
    pos[i*3]   = (Math.random()-.5)*SIZE*.92;
    pos[i*3+1] = -Math.random()*DEPTH;
    pos[i*3+2] = (Math.random()-.5)*SIZE*.92;
    spd[i] = .12 + Math.random()*.28;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const mat = new THREE.PointsMaterial({
    color:0xdffcff, size:.055, transparent:true, opacity:.6,
    blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = 6; group.add(points);
  return { points, pos, spd, count };
}
export function updateBubbles(b, dt){
  for(let i=0;i<b.count;i++){
    b.pos[i*3+1] += b.spd[i]*dt;
    b.pos[i*3]   += Math.sin(performance.now()*.001+i)*.0015;
    if(b.pos[i*3+1] > -0.05){
      b.pos[i*3+1] = -DEPTH+.05;
      b.pos[i*3]   = (Math.random()-.5)*SIZE*.92;
      b.pos[i*3+2] = (Math.random()-.5)*SIZE*.92;
    }
  }
  b.points.geometry.attributes.position.needsUpdate = true;
}

export function addGodRays(group, tint=0xbfffee){
  const rays = [];
  const mat = ()=> new THREE.MeshBasicMaterial({
    color:tint, transparent:true, opacity:.10,
    blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
  for(let i=0;i<3;i++){
    const w = .5+Math.random()*.7;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, DEPTH*1.05), mat());
    m.position.set((Math.random()-.5)*SIZE*.6, -DEPTH/2, (Math.random()-.5)*SIZE*.6);
    m.rotation.y = Math.random()*Math.PI;
    m.rotation.z = .12 + Math.random()*.1;
    m.renderOrder = 6; m.userData.ph = Math.random()*6.28;
    group.add(m); rays.push(m);
  }
  return rays;
}
export function updateGodRays(rays, t){
  rays.forEach(r=>{
    r.material.opacity = .06 + Math.abs(Math.sin(t*.4+r.userData.ph))*.09;
    r.rotation.y += .0004;
  });
}

const CORAL_SETS = {
  home:  [0xf6b8d0,0x9ad0b8,0xf7d1a0],
  lake:  [0x9ad0b8,0x7fc8b0,0xd0e0a0],
  ruins: [0x8fb8a0,0xa8c8b0,0x7fae98],
  sea:   [0xff7ab8,0x7adfff,0xb87aff,0x7affc8],
};
export function enrichSeabed(group, areaId){
  const colors = CORAL_SETS[areaId] || CORAL_SETS.lake;
  const glowMul = areaId==='sea' ? 1.0 : .35;
  const clusterN = Math.round(5*(SIZE/6));
  for(let cl=0; cl<clusterN; cl++){
    const cx=(Math.random()-.5)*SIZE*.8, cz=(Math.random()-.5)*SIZE*.8;
    const n=2+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const c=colors[Math.floor(Math.random()*colors.length)];
      const h=.18+Math.random()*.35;
      const geo = Math.random()<.5
        ? new THREE.ConeGeometry(.06+Math.random()*.05, h, 6)
        : new THREE.SphereGeometry(.08+Math.random()*.06, 8, 6);
      const m=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color:c, roughness:.6, emissive:c, emissiveIntensity:glowMul*.6 }));
      m.position.set(cx+(Math.random()-.5)*.5, -DEPTH+h*.45, cz+(Math.random()-.5)*.5);
      m.rotation.z=(Math.random()-.5)*.4;
      group.add(m);
    }
  }
  if(areaId==='sea'){
    const n=Math.round(40*(SIZE/6)), geo=new THREE.BufferGeometry();
    const pos=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      pos[i*3]=(Math.random()-.5)*SIZE*.9;
      pos[i*3+1]=-Math.random()*DEPTH;
      pos[i*3+2]=(Math.random()-.5)*SIZE*.9;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(geo, new THREE.PointsMaterial({
      color:0x7adfff, size:.035, transparent:true, opacity:.8,
      blending:THREE.AdditiveBlending, depthWrite:false }));
    pts.renderOrder=6; group.add(pts);
  }
}

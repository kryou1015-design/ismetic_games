import * as THREE from 'three';
import { SIZE, DEPTH } from './config.js';

export function makeFloor(){
  const mat = new THREE.ShaderMaterial({
    uniforms:{ uT:{value:0} },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uT;varying vec2 vUv;
      void main(){vec2 p=vUv*10.;
        float c=sin(p.x*1.3+uT*.8)+sin(p.y*1.7-uT*.6)+sin((p.x+p.y)*1.1+uT*.5);
        float ca=pow(max(0.,.65+.35*sin(c*2.)),6.);
        vec3 sand=mix(vec3(.72,.66,.48),vec3(.62,.62,.46),sin(p.x*3.1)*sin(p.y*2.7)*.5+.5);
        gl_FragColor=vec4(sand+vec3(.55,.75,.75)*ca*.55,1.);}`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SIZE,SIZE), mat);
  mesh.rotation.x = -Math.PI/2; mesh.position.y = -DEPTH; mesh.receiveShadow = true;
  return { mesh, mat };
}

export function makeWaterTop(shallow=[.55,.88,.86], deep=[.20,.62,.70]){
  const mat = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, side:THREE.DoubleSide,
    uniforms:{
      uT:{value:0},
      uShallow:{value:new THREE.Vector3(...shallow)},
      uDeep:{value:new THREE.Vector3(...deep)},
      uRip:{value:new Array(5).fill(0).map(()=>new THREE.Vector4(0,0,-10,0))}
    },
    vertexShader:`uniform float uT;varying vec2 vUv;varying vec3 vPos;varying vec3 vN;
      void main(){vUv=uv;vec3 p=position;vN=normalize(normalMatrix*normal);
        p.z+=sin(p.x*1.8+uT*1.4)*.035+sin(p.y*2.4+uT*1.1)*.028+sin((p.x+p.y)*3.1-uT*.9)*.012;
        vPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float uT;uniform vec4 uRip[5];uniform vec3 uShallow;uniform vec3 uDeep;
      varying vec2 vUv;varying vec3 vPos;varying vec3 vN;
      void main(){
        vec3 col=mix(uShallow,uDeep,smoothstep(.15,.9,distance(vUv,vec2(.5))));
        float sp=sin(vPos.x*6.+uT*2.)*sin(vPos.y*7.-uT*1.6);
        col+=vec3(1.05,1.05,1.0)*smoothstep(.84,1.,sp)*.9;
        float ring=0.;
        for(int i=0;i<5;i++){float age=uT-uRip[i].z;
          if(uRip[i].w>.5&&age<2.){float r=age*1.4;float dd=distance(vPos.xy,uRip[i].xy);
            ring+=smoothstep(.06,0.,abs(dd-r))*(1.-age/2.);}}
        col+=vec3(1.)*ring*.8;
        float fres=pow(1.-abs(vN.z),2.5);
        col+=vec3(.85,.97,1.)*fres*.45;
        gl_FragColor=vec4(col,.28+ring*.25+fres*.25);}`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SIZE,SIZE,64,64), mat);
  mesh.rotation.x = -Math.PI/2; mesh.renderOrder = 5;
  return { mesh, mat };
}

export function makeSides(scene, top=[.50,.85,.84], bot=[.10,.42,.52]){
  const mats = [];
  const make = () => new THREE.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uT:{value:0}, uTop:{value:new THREE.Vector3(...top)}, uBot:{value:new THREE.Vector3(...bot)} },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uT;uniform vec3 uTop;uniform vec3 uBot;varying vec2 vUv;
      void main(){vec3 col=mix(uBot,uTop,vUv.y);
        float g=sin(vUv.x*22.+uT*.7+vUv.y*4.);
        col+=vec3(.7,.95,.95)*smoothstep(.92,1.,g)*.22*vUv.y;
        col+=vec3(.75,1.0,1.0)*smoothstep(.90,1.0,vUv.y)*.55;
        col*=mix(.85,1.0,smoothstep(0.,.25,vUv.y));
        gl_FragColor=vec4(col,.30);}`
  });
  const H = SIZE/2;
  [[0,H,0],[0,-H,Math.PI],[H,0,Math.PI/2],[-H,0,-Math.PI/2]].forEach(([x,z,ry])=>{
    const m = make(); mats.push(m);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(SIZE,DEPTH), m);
    s.position.set(x,-DEPTH/2,z); s.rotation.y=ry; s.renderOrder=4;
    scene.add(s);
  });
  return mats;
}

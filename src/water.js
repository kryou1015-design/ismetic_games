import * as THREE from 'three';
import { SIZE, DEPTH } from './config.js';

export function makeFloor(){
  const mat = new THREE.ShaderMaterial({
    uniforms:{ uT:{value:0} },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uT;varying vec2 vUv;
      void main(){
        vec2 p=vUv*10.;
        vec2 p2=vUv*7.0+vec2(3.1,1.7);
        /* 두 겹의 어긋난 격자를 겹쳐 caustics 특유의 불규칙한 그물 무늬를 만듦 */
        float c1=sin(p.x*1.3+uT*.8)+sin(p.y*1.7-uT*.6)+sin((p.x+p.y)*1.1+uT*.5);
        float c2=sin(p2.x*1.1-uT*.55)+sin(p2.y*1.5+uT*.7)+sin((p2.x-p2.y)*.9-uT*.4);
        float ca=pow(max(0.,.65+.35*sin(c1*2.)),6.)*.65 + pow(max(0.,.65+.35*sin(c2*2.)),6.)*.55;
        ca=clamp(ca,0.,1.15);
        vec3 sand=mix(vec3(.72,.66,.48),vec3(.62,.62,.46),sin(p.x*3.1)*sin(p.y*2.7)*.5+.5);
        /* 가장자리로 갈수록 살짝 어둡게 해 깊이감 부여 */
        float vig=smoothstep(.15,.95,distance(vUv,vec2(.5)));
        sand=mix(sand, sand*.58, vig*.45);
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
      uRip:{value:new Array(5).fill(0).map(()=>new THREE.Vector4(0,0,-10,0))},
      /* 낮/밤·날씨에 따라 태양 색·세기가 흘러들어와 반짝임이 시간대에 반응함 */
      uSunColor:{value:new THREE.Vector3(1,1,1)},
      uSunStrength:{value:1}
    },
    vertexShader:`uniform float uT;varying vec2 vUv;varying vec3 vPos;varying vec3 vN;varying float vH;
      float waveH(vec2 p){
        float h=0.;
        h+=sin(p.x*1.8+uT*1.4)*.035;
        h+=sin(p.y*2.4+uT*1.1)*.028;
        h+=sin((p.x+p.y)*3.1-uT*.9)*.012;
        h+=sin((p.x*.6-p.y*1.3)+uT*1.9)*.018;
        h+=sin((p.x*2.6+p.y*.4)-uT*2.3)*.009;
        return h;
      }
      void main(){
        vUv=uv;
        vec3 p=position;
        float h=waveH(p.xy);
        p.z+=h; vPos=p; vH=h;
        /* 파도 함수의 편미분으로 굴곡진 법선을 근사해 반짝임이 파형을 따라가게 함 */
        float e=.02;
        float dHdx=(waveH(p.xy+vec2(e,0.))-waveH(p.xy-vec2(e,0.)))/(2.*e);
        float dHdy=(waveH(p.xy+vec2(0.,e))-waveH(p.xy-vec2(0.,e)))/(2.*e);
        vec3 nLocal=normalize(vec3(-dHdx,-dHdy,1.));
        vN=normalize(normalMatrix*nLocal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float uT;uniform vec4 uRip[5];uniform vec3 uShallow;uniform vec3 uDeep;
      uniform vec3 uSunColor;uniform float uSunStrength;
      varying vec2 vUv;varying vec3 vPos;varying vec3 vN;varying float vH;
      void main(){
        vec3 col=mix(uShallow,uDeep,smoothstep(.15,.9,distance(vUv,vec2(.5))));
        float sunK=clamp(uSunStrength,.15,1.6);
        /* 반짝임: 두 주파수를 겹쳐 잔물결 스파클을 만들고, 태양 색/세기로 톤을 맞춤 */
        float sp1=sin(vPos.x*6.+uT*2.)*sin(vPos.y*7.-uT*1.6);
        float sp2=sin(vPos.x*11.-uT*3.1)*sin(vPos.y*9.5+uT*2.4);
        float sparkle=smoothstep(.84,1.,sp1)*.75+smoothstep(.9,1.,sp2)*.45;
        col+=mix(vec3(1.05,1.05,1.0),uSunColor,.55)*sparkle*sunK;
        /* 파도 마루(진폭 큰 지점)에 옅은 백파(foam) */
        float foam=smoothstep(.045,.075,abs(vH));
        col+=vec3(.9,.98,1.)*foam*.35;
        /* 스플래시 잔물결: 선두 링 + 옅은 후행 웨이크 */
        float ring=0.;
        for(int i=0;i<5;i++){
          float age=uT-uRip[i].z;
          if(uRip[i].w>.5&&age<2.){
            float dd=distance(vPos.xy,uRip[i].xy);
            float r=age*1.4;
            ring+=smoothstep(.06,0.,abs(dd-r))*(1.-age/2.);
            ring+=smoothstep(.09,0.,abs(dd-r*.72))*(1.-age/2.)*.35;
          }
        }
        col+=vec3(1.)*ring*.8;
        float fres=pow(1.-abs(vN.z),2.5);
        col+=mix(vec3(.85,.97,1.),uSunColor,.4)*fres*.45*sunK;
        /* 밤에는 전체적으로 살짝 가라앉혀 무드감 부여 */
        col*=mix(.62,1.0,clamp(uSunStrength,0.,1.));
        gl_FragColor=vec4(col,.28+ring*.25+fres*.25+foam*.12);}`
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
        /* 두 주파수를 섞어 유리처럼 규칙적이던 결을 자연스러운 흐름으로 */
        float g1=sin(vUv.x*22.+uT*.7+vUv.y*4.);
        float g2=sin(vUv.x*13.-uT*.45+vUv.y*7.3)*.6;
        float g=g1+g2;
        col+=vec3(.7,.95,.95)*smoothstep(.92,1.,g)*.22*vUv.y;
        /* 수면 경계 거품 라인: 시간에 따라 은은히 일렁임 */
        float foamLine=smoothstep(.90,1.0,vUv.y)*(.55+.12*sin(vUv.x*9.+uT*1.3));
        col+=vec3(.75,1.0,1.0)*foamLine;
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

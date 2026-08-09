/* GDD §3·§4 지역별 물고기 테이블 */
export const AREA_SPECIES = {
  lake: [
    { id:'piraM', name:'피라미',     em:'🐟', rar:0, g:10,  body:'slender', color:0xb8c4cc },
    { id:'bung',  name:'붕어',       em:'🐟', rar:0, g:15,  body:'round',   color:0x9a8a5a },
    { id:'eunA',  name:'은어',       em:'🐟', rar:0, g:20,  body:'slender', color:0xaac4b8 },
    { id:'mikku', name:'미꾸라지',   em:'🐟', rar:0, g:12,  body:'serpentine', color:0x8a6a4a },
    { id:'ing',   name:'잉어',       em:'🐠', rar:1, g:60,  body:'round',   color:0xc8a05a },
    { id:'megi',  name:'메기',       em:'🐠', rar:1, g:90,  body:'catfish', color:0x6a6858 },
    { id:'ssoga', name:'쏘가리',     em:'🐠', rar:1, g:150, body:'slender', color:0xb8a468, spotted:true },
    { id:'gamul', name:'가물치',     em:'🐡', rar:2, g:350, body:'serpentine', color:0x3a4a38 },
    { id:'baem',  name:'뱀장어',     em:'🐡', rar:2, g:320, body:'serpentine', color:0x4a3a2a },
    { id:'gold',  name:'황금잉어',   em:'🐡', rar:2, g:300, body:'round',   color:0xe8b830 },
    { id:'spirit',name:'호수정령어', em:'✨', rar:3, g:1200, body:'slender', color:0x9ae8dc, glowBody:true },
  ],
  ruins: [
    { id:'r_song', name:'고대송사리', em:'🐟', rar:0, g:25, body:'slender', color:0x8fae9e },
    { id:'r_dol',  name:'돌잉어',     em:'🐟', rar:0, g:30, body:'round',   color:0x9eae8f },
    { id:'r_moss', name:'이끼붕어',   em:'🐟', rar:0, g:28, body:'round',   color:0x7a9e6a },
    { id:'r_bronze',name:'청동미꾸라지',em:'🐟', rar:0, g:26, body:'serpentine', color:0x9e8a5a },
    { id:'r_megi', name:'유적메기',   em:'🐠', rar:1, g:120, body:'catfish', color:0x6a7a6a },
    { id:'r_eel',  name:'석주장어',   em:'🐠', rar:1, g:150, body:'serpentine', color:0x5a7a68 },
    { id:'r_cryst',name:'크리스탈피시',em:'💠', rar:2, g:500, body:'slender', color:0x7adfd0, glowBody:true },
    { id:'r_relic',name:'고대 유물',  em:'🏺', rar:3, g:2000, body:'round', color:0xd4af37, glowBody:true },
  ],
  sea: [
    { id:'s_jeong',name:'정어리',    em:'🐟', rar:0, g:35, body:'slender', color:0x8aa8c8 },
    { id:'s_jean', name:'전갱이',    em:'🐟', rar:0, g:40, body:'slender', color:0x9ab0c0 },
    { id:'s_go',   name:'고등어',    em:'🐟', rar:0, g:45, body:'slender', color:0x5a7a98, spotted:true },
    { id:'s_clown',name:'흰동가리',  em:'🐠', rar:0, g:50, body:'round',   color:0xe87a3a },
    { id:'s_dom',  name:'참돔',      em:'🐠', rar:1, g:180, body:'round',  color:0xe89aa8 },
    { id:'s_squid',name:'오징어',    em:'🦑', rar:1, g:200, body:'serpentine', color:0xc8a8d8 },
    { id:'s_jelly',name:'발광해파리',em:'🪼', rar:2, g:700, body:'round',  color:0xff9ad8, glowBody:true },
    { id:'s_chest',name:'심해 보물상자',em:'💎', rar:3, g:3000, body:'round', color:0xffd35e, glowBody:true },
  ],
};
AREA_SPECIES.home = AREA_SPECIES.lake.filter(s=>s.rar<=1);
export const SPECIES = AREA_SPECIES.lake;
export const ALL_SPECIES = [...AREA_SPECIES.lake, ...AREA_SPECIES.ruins, ...AREA_SPECIES.sea];

export const AREAS = {
  home:  { name:'내 집',      sub:'노을',  em:'🏠', unlock:1,
    sky:['#f6d8b8','#f2e0c8','#e8d8e8'],
    shallow:[0.62,0.85,0.82], deep:[0.28,0.58,0.62],
    sideTop:[0.58,0.82,0.78], sideBot:[0.16,0.40,0.46],
    sun:0xffd9a0, sunI:1.1, hemi:0xf5e2cc, night:false },
  lake:  { name:'릴리 폰드',  sub:'아침',  em:'🏞️', unlock:1,
    sky:['#cfe9f5','#e8f2ef','#f6e7d3'],
    shallow:[0.55,0.88,0.86], deep:[0.20,0.62,0.70],
    sideTop:[0.50,0.85,0.84], sideBot:[0.10,0.42,0.52],
    sun:0xfff2dc, sunI:1.25, hemi:0xdff2f7, night:false },
  ruins: { name:'가라앉은 신전', sub:'한낮', em:'🏛️', unlock:3,
    sky:['#d8f0e4','#e6f4ea','#f2ecd8'],
    shallow:[0.55,0.90,0.75], deep:[0.15,0.55,0.48],
    sideTop:[0.50,0.86,0.72], sideBot:[0.08,0.38,0.34],
    sun:0xffffff, sunI:1.45, hemi:0xeaf7ee, night:false },
  sea:   { name:'등불 부두',  sub:'밤',    em:'🌊', unlock:5,
    sky:['#2c3e66','#40548c','#7a6a9e'],
    shallow:[0.25,0.55,0.80], deep:[0.05,0.15,0.38],
    sideTop:[0.22,0.50,0.76], sideBot:[0.03,0.10,0.28],
    sun:0x9fb4ff, sunI:0.5, hemi:0x6a7ab8, night:true },
};

export const RAR_NAME = ['일반','고급','희귀','에픽'];
export const RAR_COL  = ['#8a9aa5','#4caf6d','#3f8fd6','#a86fe0'];

export function rollSpecies(zone, area='lake'){
  const p = [[57,25,13,5],[50,29,15,6],[44,28,18,10]][zone];
  const r = Math.random()*100; let acc=0, rar=0;
  for(let k=0;k<4;k++){ acc+=p[k]; if(r<acc){ rar=k; break; } }
  let pool = AREA_SPECIES[area].filter(s=>s.rar===rar);
  while(pool.length===0 && rar>0){ rar--; pool = AREA_SPECIES[area].filter(s=>s.rar===rar); }
  return pool[Math.floor(Math.random()*pool.length)];
}

export const ROD_TIERS = [
  { name:'나무 낚싯대',   em:'🎣', bonus:0,    stab:0,   cost:0 },
  { name:'튼튼한 낚싯대', em:'🎣', bonus:0.15, stab:0.3, cost:500 },
  { name:'장인의 낚싯대', em:'✨', bonus:0.30, stab:0.6, cost:2500 },
];
export function featuredToday(){
  const d = new Date();
  const day = Math.floor((d - new Date(d.getFullYear(),0,0)) / 864e5);
  return SPECIES[day % SPECIES.length];
}
export function sellPrice(sp){
  return featuredToday().id === sp.id ? Math.round(sp.g * 1.5) : sp.g;
}
export const XP_PER_RAR = [10, 25, 60, 150];
export function levelOf(xp){ return Math.floor(Math.sqrt(xp/30)) + 1; }

export const DECOS = [
  { id:'fence',   name:'울타리',   em:'🪵', g:80  },
  { id:'lantern', name:'랜턴',     em:'🏮', g:150 },
  { id:'flower',  name:'꽃화분',   em:'🌷', g:60  },
  { id:'bench',   name:'벤치',     em:'🪑', g:200 },
  { id:'stone',   name:'정원석',   em:'🪨', g:120 },
];

/* 파이팅 미니게임 난이도 (등급별: 0일반~3에픽)
   zone=버텨야 하는 초록구역 폭(±값), drift=물고기가 당기는 속도,
   interval=당기는 방향이 바뀌는 주기(초), counter=내 입력이 미치는 힘,
   dur=버텨야 하는 누적 시간(초), redTol=위험구역 벗어나도 되는 허용시간(초) */
export const FIGHT_DIFF = [
  { zone:.50, drift:.55, interval:2.6, counter:1.9, dur:1.6, redTol:4.5 },
  { zone:.42, drift:.75, interval:2.0, counter:1.8, dur:2.4, redTol:4.0 },
  { zone:.34, drift:1.0, interval:1.5, counter:1.7, dur:3.6, redTol:3.5 },
  { zone:.28, drift:1.3, interval:1.1, counter:1.6, dur:5.0, redTol:3.0 },
];

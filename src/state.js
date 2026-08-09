export const S = { gold:0, rod:0, bag:{}, dex:[], xp:0, tutDone:false, decoInv:{}, deco:[], photos:[] };
const KEY = 'clearwater_save_v1';
export function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
}
export function load(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY));
    if(d){ S.gold=d.gold||0; S.rod=d.rod||0; S.bag=d.bag||{}; S.dex=d.dex||[];
      S.xp=d.xp||0; S.tutDone=!!d.tutDone;
      S.decoInv=d.decoInv||{}; S.deco=d.deco||[]; S.photos=d.photos||[]; }
  }catch(e){}
}

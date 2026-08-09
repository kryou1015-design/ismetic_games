import { SPECIES, ALL_SPECIES, AREAS, RAR_NAME, RAR_COL, ROD_TIERS, DECOS, featuredToday, sellPrice, levelOf } from './data.js';
import { S, save } from './state.js';

const $ = id => document.getElementById(id);

export function updateHUD(){
  $('goldVal').textContent = S.gold.toLocaleString();
  $('invCount').textContent = Object.values(S.bag).reduce((a,b)=>a+b.n,0);
}
function toastMini(t){
  const e=$('toast'); e.textContent=t; e.style.opacity=1;
  clearTimeout(e._t); e._t=setTimeout(()=>e.style.opacity=0,1800);
}

function renderFeatured(){
  const f = featuredToday();
  $('featured').innerHTML =
    `<div class="featRow">📋 오늘의 추천: <b style="color:${RAR_COL[f.rar]}">${f.em} ${f.name}</b>
     <span class="featBadge">1.5배 매입!</span></div>`;
}
function renderSell(){
  const items = Object.values(S.bag).filter(f=>f.n>0).sort((a,b)=>b.rar-a.rar);
  $('sellPane').innerHTML = items.length===0
    ? '<div class="mEmpty">팔 물고기가 없어. 낚시하러 가자!</div>'
    : items.map(f=>{
        const price = sellPrice(f);
        const feat = featuredToday().id===f.id ? ' <span class="featBadge">추천</span>' : '';
        return `<div class="mRow">
          <span class="em">${f.em}</span>
          <span class="nm">${f.name}${feat}<small>×${f.n} · 개당 ${price}G</small></span>
          <button class="mBtn" data-sell="${f.id}" data-n="1">1개</button>
          <button class="mBtn strong" data-sell="${f.id}" data-n="all">전부</button>
        </div>`;
      }).join('');
  $('sellPane').querySelectorAll('[data-sell]').forEach(b=>{
    b.onclick = ()=>{
      const f = S.bag[b.dataset.sell]; if(!f||f.n<=0) return;
      const n = b.dataset.n==='all' ? f.n : 1;
      const got = sellPrice(f)*n;
      f.n -= n; if(f.n<=0) delete S.bag[f.id];
      S.gold += got; save(); updateHUD(); renderSell();
      toastMini(`+${got}G 💰`);
    };
  });
}
function renderShop(){
  $('shopPane').innerHTML = ROD_TIERS.map((r,i)=>{
    const owned = i<=S.rod, current = i===S.rod, next = i===S.rod+1;
    const stateTxt = current?'<span class="mTag now">장착중</span>'
      : owned?'<span class="mTag">보유</span>'
      : next?`<button class="mBtn strong" data-buy="${i}">${r.cost.toLocaleString()}G</button>`
      :`<span class="mTag lock">🔒 이전 단계 필요</span>`;
    return `<div class="mRow">
      <span class="em">${r.em}</span>
      <span class="nm">${r.name}<small>입질 판정 +${r.bonus}s · 텐션 안정 +${Math.round(r.stab*100)}%</small></span>
      ${stateTxt}</div>`;
  }).join('');
  $('shopPane').querySelectorAll('[data-buy]').forEach(b=>{
    b.onclick = ()=>{
      const i=+b.dataset.buy, r=ROD_TIERS[i];
      if(S.gold<r.cost){ toastMini('골드가 부족해…'); return; }
      S.gold-=r.cost; S.rod=i; save(); updateHUD(); renderShop();
      toastMini(`${r.name} 장착! 🎉`);
    };
  });
}
function renderDeco(){
  $('decoPane').innerHTML = DECOS.map(d=>{
    const owned = S.decoInv[d.id]||0;
    return `<div class="mRow"><span class="em">${d.em}</span>
      <span class="nm">${d.name}<small>보유 ${owned}개</small></span>
      <button class="mBtn strong" data-decobuy="${d.id}">${d.g}G</button></div>`;
  }).join('');
  $('decoPane').querySelectorAll('[data-decobuy]').forEach(b=>{
    b.onclick=()=>{
      const d=DECOS.find(x=>x.id===b.dataset.decobuy);
      if(S.gold<d.g){ toastMini('골드가 부족해…'); return; }
      S.gold-=d.g; S.decoInv[d.id]=(S.decoInv[d.id]||0)+1;
      save(); updateHUD(); renderDeco();
      toastMini(`${d.em} ${d.name} 구매! 내 집에서 배치해봐`);
    };
  });
}
export function openMarket(){
  renderFeatured(); renderSell(); renderShop(); renderDeco();
  $('market').style.display='flex';
}
export function openDex(){
  const pct = Math.round(S.dex.length/ALL_SPECIES.length*100);
  $('dexPct').textContent = `${S.dex.length}/${ALL_SPECIES.length} (${pct}%)`;
  $('dexGrid').innerHTML = ALL_SPECIES.map(sp=>{
    const got = S.dex.includes(sp.id);
    return got
      ? `<div class="dexCard" style="border-color:${RAR_COL[sp.rar]}">
           <div class="dEm">${sp.em}</div><b>${sp.name}</b>
           <small style="color:${RAR_COL[sp.rar]}">${RAR_NAME[sp.rar]}</small></div>`
      : `<div class="dexCard unk"><div class="dEm">❓</div><b>???</b><small>미발견</small></div>`;
  }).join('');
  $('dex').style.display='flex';
}
export function initUI(gotoArea){
  function refreshMap(){
    const lv = levelOf(S.xp||0);
    [['wmLake','lake'],['wmRuins','ruins'],['wmSea','sea']].forEach(([bid,aid])=>{
      const b=$(bid), locked = lv < AREAS[aid].unlock;
      b.classList.toggle('locked', locked);
      b.querySelector('small').textContent = locked ? `🔒 Lv.${AREAS[aid].unlock} 해금` : '낚시터';
    });
  }
  $('mapBtn').onclick = ()=>{ refreshMap(); $('wmap').style.display='flex'; };
  $('dexBtn').onclick = openDex;
  [['wmLake','lake'],['wmRuins','ruins'],['wmSea','sea']].forEach(([bid,aid])=>{
    $(bid).onclick = ()=>{ if(gotoArea(aid)) $('wmap').style.display='none'; };
  });
  $('wmMarket').onclick = ()=>{ $('wmap').style.display='none'; openMarket(); };
  $('wmHome').onclick = ()=>{ if(gotoArea('home')) $('wmap').style.display='none'; };
  $('marketClose').onclick = ()=> $('market').style.display='none';
  $('dexClose').onclick = ()=> $('dex').style.display='none';
  document.querySelectorAll('.tabBtn').forEach(t=>{
    t.onclick = ()=>{
      document.querySelectorAll('.tabBtn').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      $('sellPane').style.display = t.dataset.tab==='sell'?'block':'none';
      $('shopPane').style.display = t.dataset.tab==='shop'?'block':'none';
      $('decoPane').style.display = t.dataset.tab==='deco'?'block':'none';
    };
  });
  updateHUD();
}

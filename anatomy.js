/* Gym-Logbuch: anatomische Körperansicht (Mann/Frau, vorne/hinten).
   Grundlage ist die Zeichnung in body/*.webp. Zu jeder Figur gibt es eine Muskelkarte (body/*-map.png),
   in der jeder Bildpunkt die Nummer seiner Körperregion trägt. Trainierte Regionen werden per
   Multiplikation eingefärbt, so bleiben Linien und Schattierung der Zeichnung sichtbar. */
(function(){
"use strict";
const REG=["bg","none","chest","shoulders","arms","abs","back","glutes","hip","legs","neck"];
const cache={};

function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
function pixels(img){ const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight; const x=c.getContext("2d",{willReadFrequently:true}); x.drawImage(img,0,0); return x.getImageData(0,0,c.width,c.height); }
async function figure(name){
  if(!cache[name]) cache[name]=(async()=>{ const [a,b]=await Promise.all([loadImg(`body/${name}.webp`),loadImg(`body/${name}-map.png`)]); return {base:pixels(a),map:pixels(b)}; })();
  return cache[name];
}
function hex(c){ c=(c||"").trim(); const h=c.replace("#",""); const v=h.length===3?h.split("").map(x=>x+x).join(""):h; return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)); }

function paint(canvas,fig,intensity,colors){
  const {base,map}=fig, W=base.width, H=base.height;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d"), out=ctx.createImageData(W,H), o=out.data, b=base.data, m=map.data;
  const lo=hex(colors.lo||"#f5b97a"), hi=hex(colors.hi||"#c62f28");
  // Tönung pro Region: Mischung aus Weiß und Wärmefarbe je nach Intensität
  const tint=REG.map(r=>{ const t=intensity[r]||0; if(!t) return null; const c=lo.map((v,i)=>v+(hi[i]-v)*Math.min(1,t)); return c.map(v=>255-(255-v)*.9); });
  for(let i=0;i<o.length;i+=4){
    const r=m[i], T=tint[r];
    if(T){ o[i]=b[i]*T[0]/255; o[i+1]=b[i+1]*T[1]/255; o[i+2]=b[i+2]*T[2]/255; }
    else { o[i]=b[i]; o[i+1]=b[i+1]; o[i+2]=b[i+2]; }
    o[i+3]=255;
  }
  ctx.putImageData(out,0,0);
}

async function render(el,opts){
  const sex=opts.sex==="f"?"f":"m", I=opts.intensity||{}, colors=opts.colors||{};
  el.innerHTML=`<canvas aria-hidden="true"></canvas><canvas aria-hidden="true"></canvas>`;
  const [cf,cb]=el.querySelectorAll("canvas");
  try{
    const [F,B]=await Promise.all([figure(sex+"-front"),figure(sex+"-back")]);
    if(!el.isConnected) return false;
    paint(cf,F,I,colors); paint(cb,B,I,colors);
    return true;
  }catch(e){ console.error(e); el.innerHTML=`<p class="hint" style="padding:16px">Die Körperansicht konnte nicht geladen werden.</p>`; return false; }
}
function preload(sex){ const s=sex==="f"?"f":"m"; figure(s+"-front").catch(()=>{}); figure(s+"-back").catch(()=>{}); }

window.Anatomy={render,preload,regions:REG.slice(2)};
})();

/* Gym-Logbuch: anatomische Körperansicht (vorne/hinten, Mann/Frau) als SVG.
   Eigene Zeichnung im Stil einer Anatomie-Tafel. Jede Muskelfläche gehört zu einer Region
   und wird nach Trainingsintensität eingefärbt. Gezeichnet wird die linke Bildhälfte (x <= 100),
   die rechte entsteht durch Spiegelung. Punkte mit drittem Wert 1 sind spitze Ecken (Sehnenansatz). */
(function(){
"use strict";

function smooth(pts,closed=true,t=0.55){
  const n=pts.length; if(n<2) return "";
  const P=i=>closed?pts[(i+n)%n]:pts[Math.max(0,Math.min(n-1,i))];
  let d=`M${P(0)[0].toFixed(1)},${P(0)[1].toFixed(1)}`;
  const last=closed?n:n-1;
  for(let i=0;i<last;i++){
    const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
    const k1=p1[2]?0:t, k2=p2[2]?0:t;
    const c1=[p1[0]+(p2[0]-p0[0])*k1/3,p1[1]+(p2[1]-p0[1])*k1/3], c2=[p2[0]-(p3[0]-p1[0])*k2/3,p2[1]-(p3[1]-p1[1])*k2/3];
    d+=`C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d+(closed?"Z":"");
}
function full(pts){ const m=pts.slice(1,-1).reverse().map(([x,y,c])=>[200-x,y,c]); return pts.concat(m); }

/* ---------- Frau: Formanpassung ---------- */
function armAxis(y){ const A=[[100,50],[205,44],[280,36],[330,31]]; if(y<=A[0][0]) return A[0][1]; for(let i=1;i<A.length;i++) if(y<=A[i][0]){ const t=(y-A[i-1][0])/(A[i][0]-A[i-1][0]); return A[i-1][1]+(A[i][1]-A[i-1][1])*t; } return A[A.length-1][1]; }
function kf(y){ // horizontale Skalierung zur Mitte, weich interpoliert
  const K=[[0,.94],[75,.94],[100,.9],[150,.9],[195,.82],[225,.94],[255,1.05],[300,1.05],[360,.98],[500,.95]];
  for(let i=1;i<K.length;i++) if(y<=K[i][0]){ const t=(y-K[i-1][0])/(K[i][0]-K[i-1][0]); return K[i-1][1]+(K[i][1]-K[i-1][1])*t; }
  return .95;
}
function tf(pts,sex,isArm){
  if(sex!=="f") return pts;
  return pts.map(([x,y,c])=>isArm?[x+7+(armAxis(y)-x)*.14,y,c]:[100-(100-x)*kf(y),y,c]);
}

/* ---------- Grundformen (linke Bildhälfte) ---------- */
const BODY=[[100,90],[89,87],[74,91],[62,96],[56,106],[56,124],[60,141],[62,160],[65,180],[67,198],[66,214],[63,230],[58,248],[55,270],[54,295],[56,320],[60,345],[62,362],[61,380],[58,402],[59,424],[63,446],[65,466],[63,479],[57,489],[66,494],[80,493],[84,486],[82,470],[83,450],[81,426],[80,402],[83,380],[86,363],[88,340],[91,310],[95,284],[98,266],[100,260]];
const ARM=[[61,96],[50,98],[42,104],[37,116],[35,132],[35,150],[36,168],[35,186],[33,202],[30,218],[27,236],[26,252],[27,268],[28,282],[26,291],[24,303],[26,315],[31,321],[37,319],[40,309],[40,297],[41,287],[43,270],[46,252],[49,234],[51,216],[53,200],[55,184],[57,166],[58,148],[59,132],[59,114]];
const HEAD=[[100,8],[88,10],[80,18],[77,32],[78,46],[81,56],[86,64],[93,70],[100,72]];
const NECK=[[100,64],[90,64],[89,78],[86,90],[100,93]];
const EAR=[[79,36],[75,38],[75,46],[78,50],[80,44]];

/* ---------- Muskeln vorne ---------- */
const FRONT=[
  {r:"neck",  p:[[88,52,1],[85,62],[90,76],[97,92,1],[95,78],[90,62]]},                                                 // Kopfwender
  {r:"back",  p:[[89,73,1],[82,84],[68,92],[60,97,1],[73,95],[86,92],[90,84]]},                                        // Trapez vorne
  {r:"chest", p:[[99,99],[90,96],[76,96],[64,99],[59,106],[55,118,1],[62,130],[72,140],[86,145],[97,142],[99,128]]},     // großer Brustmuskel
  {r:"chest", p:[[62,139],[59,145],[64,150],[71,146,1]]},{r:"chest",p:[[63,151],[60,158],[65,163],[72,158,1]]},{r:"chest",p:[[65,163],[63,170],[68,175],[74,170,1]]}, // Sägemuskel
  {r:"abs",   p:[[99,147],[91,146],[87,150],[86,163],[89,167],[99,167]]},
  {r:"abs",   p:[[99,170],[90,169],[86,173],[86,186],[89,190],[99,190]]},
  {r:"abs",   p:[[99,193],[90,192],[86,196],[86,209],[89,213],[99,213]]},
  {r:"abs",   p:[[99,216],[90,215],[87,220],[88,236],[93,248],[99,253]]},
  {r:"abs",   p:[[86,150],[77,149],[70,156],[67,172],[67,192],[70,210],[76,224],[86,236,1],[88,216],[87,192],[87,168]]},  // schräger Bauchmuskel
  {r:"hip",   p:[[64,229],[58,244],[57,262],[60,270,1],[64,252],[67,237]]},                                           // Spanner der Oberschenkelbinde
  {r:"legs",  p:[[61,252],[56,272],[55,298],[57,322],[61,342],[68,357,1],[70,334],[69,304],[67,276],[65,258]]},       // äußerer Schenkelmuskel
  {r:"legs",  p:[[74,244,1],[68,262],[66,290],[68,316],[72,338],[76,353,1],[82,338],[86,314],[86,286],[82,262]]},     // gerader Schenkelmuskel
  {r:"legs",  p:[[90,290],[85,310],[80,332],[79,350],[86,358],[92,345],[93,322],[93,302]]},                            // innerer Schenkelmuskel
  {r:"legs",  p:[[98,262],[91,264],[86,276],[85,292],[88,300,1],[94,290],[97,278]]},                                    // Adduktoren
  {r:null,    p:[[71,352],[67,362],[70,373],[78,376],[83,366],[80,355]]},                                              // Kniescheibe
  {r:"legs",  p:[[67,379,1],[64,393],[63,413],[65,432],[68,449,1],[71,430],[72,408],[71,388]]},                        // vorderer Schienbeinmuskel
  {r:"legs",  p:[[82,377,1],[85,392],[85,412],[82,429,1],[78,414],[77,396],[79,383]]},                                 // Wade innen
  {r:"legs",  p:[[62,381,1],[58,398],[59,420],[62,437,1],[63,412],[63,394]]},                                          // Wadenbeinmuskel
  {r:"shoulders", p:[[61,97],[51,99],[43,105],[38,117],[37,131],[40,145],[46,157,1],[52,141],[56,124],[59,106]],arm:1},// Deltamuskel
  {r:"arms",  p:[[51,140,1],[46,150],[43,165],[43,182],[46,195],[50,206,1],[55,192],[57,175],[56,156]],arm:1},         // Bizeps
  {r:"arms",  p:[[44,142,1],[38,153],[36,170],[37,188],[40,199,1],[42,182],[42,162]],arm:1},                           // Trizeps seitlich
  {r:"arms",  p:[[41,199,1],[34,207],[30,220],[28,238],[29,254],[33,271,1],[37,252],[40,234],[44,214]],arm:1},         // Oberarm-Speichen-Muskel
  {r:"arms",  p:[[50,204,1],[45,212],[41,228],[38,248],[37,266],[39,281,1],[43,262],[47,242],[50,224],[52,212]],arm:1},// Unterarmbeuger
];
/* ---------- Muskeln hinten ---------- */
const BACK=[
  {r:"back",  p:[[100,64],[93,72],[84,85],[70,93],[60,99],[68,104],[80,114],[88,128],[94,146],[100,163,1]]},           // Trapez
  {r:"back",  p:[[74,106],[64,110],[59,121],[64,133],[76,136],[84,124],[81,112]]},                                      // Untergrätenmuskel
  {r:"back",  p:[[62,132],[58,139],[63,145],[72,142,1],[68,135]]},                                                      // großer Rundmuskel
  {r:"back",  p:[[60,140,1],[62,158],[66,180],[72,200],[80,214],[90,221],[96,206],[95,180],[93,158],[88,146],[76,141]]},// breiter Rückenmuskel
  {r:"back",  p:[[99,162],[94,166],[92,190],[92,213],[95,232],[99,238]]},                                               // Rückenstrecker
  {r:"hip",   p:[[70,220],[62,229],[59,243],[66,240],[78,232],[86,226],[78,219]]},                                      // mittlerer Gesäßmuskel
  {r:"glutes",p:[[99,232],[86,229],[72,234],[62,248],[60,266],[66,282],[78,290],[92,289],[99,283]]},                   // großer Gesäßmuskel
  {r:"legs",  p:[[67,287],[60,304],[59,330],[62,350],[66,364,1],[73,346],[76,322],[74,298]]},                           // zweiköpfiger Beinbeuger
  {r:"legs",  p:[[89,289],[80,292],[77,312],[77,338],[82,360,1],[89,346],[92,326],[93,304]]},                           // Halbsehnenmuskel
  {r:"legs",  p:[[97,288],[93,298],[92,318],[95,323,1],[97,306]]},                                                      // großer Anzieher
  {r:"legs",  p:[[64,368],[59,384],[59,404],[63,420],[70,433,1],[73,410],[73,388],[70,372]]},                           // Zwillingswadenmuskel außen
  {r:"legs",  p:[[82,368],[76,374],[75,392],[76,414],[80,433,1],[85,416],[86,396],[85,378]]},                           // Zwillingswadenmuskel innen
  {r:"legs",  p:[[60,410],[60,428],[65,441,1],[64,422]]},                                                               // Schollenmuskel
  {r:"shoulders", p:[[61,97],[51,99],[43,105],[38,117],[37,131],[40,145],[46,157,1],[52,141],[56,124],[59,106]],arm:1},
  {r:"arms",  p:[[58,118,1],[50,121],[42,129],[38,147],[37,166],[40,184],[46,197,1],[52,186],[56,168],[58,146]],arm:1}, // Trizeps
  {r:"arms",  p:[[41,199,1],[34,207],[30,220],[28,238],[29,254],[33,271,1],[37,252],[40,234],[44,214]],arm:1},          // Unterarmstrecker
  {r:"arms",  p:[[50,204,1],[45,212],[41,228],[38,248],[37,266],[39,281,1],[43,262],[47,242],[50,224],[52,212]],arm:1},
];
const HAIR_M_FRONT=[[100,6],[87,8],[79,16],[76,28],[78,33],[82,24],[90,18],[100,17]];
const HAIR_M_BACK=[[100,6],[87,8],[79,16],[76,29],[77,39],[83,44],[92,46],[100,46]];
const HAIR_F_FRONT=[[100,5],[86,7],[77,17],[74,32],[75,50],[78,58],[80,44],[83,26],[91,19],[100,18]];
const HAIR_F_BACK=[[100,5],[86,7],[77,17],[74,32],[76,50],[82,60],[91,64],[100,65]];
const PONY=[[100,50],[93,56],[91,74],[94,94],[100,104]];
const BREAST=[[98,128],[92,122],[84,121],[75,124],[68,131],[67,141],[71,150],[79,155],[89,155],[96,150],[98,140]];

/* Faserlinien: parallel zur Hauptachse der Muskelfläche */
function fibers(pts){
  const n=pts.length; let mx=0,my=0; for(const p of pts){ mx+=p[0]; my+=p[1]; } mx/=n; my/=n;
  let sxx=0,syy=0,sxy=0; for(const p of pts){ const dx=p[0]-mx, dy=p[1]-my; sxx+=dx*dx; syy+=dy*dy; sxy+=dx*dy; }
  const ang=.5*Math.atan2(2*sxy,sxx-syy), ux=Math.cos(ang), uy=Math.sin(ang), vx=-uy, vy=ux;
  let minU=1e9,maxU=-1e9,minV=1e9,maxV=-1e9; for(const p of pts){ const dx=p[0]-mx, dy=p[1]-my, u=dx*ux+dy*uy, v=dx*vx+dy*vy; minU=Math.min(minU,u); maxU=Math.max(maxU,u); minV=Math.min(minV,v); maxV=Math.max(maxV,v); }
  const w=maxV-minV, cnt=Math.max(2,Math.min(7,Math.round(w/3.2))), out=[];
  for(let i=1;i<=cnt;i++){ const v=minV+w*i/(cnt+1), bend=(i/(cnt+1)-.5)*w*.25;
    const a=[mx+ux*(minU-2)+vx*v, my+uy*(minU-2)+vy*v], b=[mx+ux*(maxU+2)+vx*v, my+uy*(maxU+2)+vy*v], c=[mx+vx*(v+bend), my+vy*(v+bend)];
    out.push(`M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`); }
  return out.join(" ");
}
function mixHex(a,b,t){ const pa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)), pb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16)); return "#"+pa.map((v,i)=>Math.round(v+(pb[i]-v)*t).toString(16).padStart(2,"0")).join(""); }

function svg(opts){
  const sex=opts.sex==="f"?"f":"m", view=opts.view==="back"?"back":"front", I=opts.intensity||{}, uid=opts.id||("a"+Math.random().toString(36).slice(2,7));
  const C=opts.colors||{};
  const skin=C.skin||"#c3c8cf", skinDark=C.skinDark||"#9aa1ab", muscle=C.muscle||"#f4f5f7", muscleDark=C.muscleDark||"#cfd3d9", line=C.line||"#6c737d", hi=C.hi||"#c62f28", lo=C.lo||"#f5b97a", hair=C.hair||"#3a3e46";
  const list=view==="front"?FRONT:BACK;
  let clipDefs="", k=0;
  const drawMuscle=(m,isArm)=>{
    const pts=tf(m.p,sex,isArm), d=smooth(pts), t=m.r?I[m.r]||0:0, id=`${uid}c${k++}`;
    clipDefs+=`<clipPath id="${id}"><path d="${d}"/></clipPath>`;
    const fillC=t>0?mixHex(lo,hi,Math.min(1,t)):`url(#${uid}m)`;
    return `<path d="${d}" fill="${fillC}"/><path d="${fibers(pts)}" clip-path="url(#${id})" stroke="${t>0?"#7a1d18":line}" stroke-opacity="${t>0?.28:.22}" stroke-width=".55" fill="none"/><path d="${d}" fill="url(#${uid}g)" stroke="${line}" stroke-width=".75" stroke-linejoin="round"/>`;
  };
  const torso=list.filter(m=>!m.arm).map(m=>drawMuscle(m,false)).join("");
  const breast=sex==="f"&&view==="front"?`<path d="${smooth(tf(BREAST,sex))}" fill="url(#${uid}b)"/><path d="${smooth(tf(BREAST.slice(3,10),sex),false)}" stroke="${line}" stroke-width=".8" fill="none"/>`:"";
  const arm=`<path d="${smooth(tf(ARM,sex,true))}" fill="url(#${uid}s)" stroke="${line}" stroke-width="1.1"/>`;
  const armM=list.filter(m=>m.arm).map(m=>drawMuscle(m,true)).join("");
  const fx=sex==="f"?33:26;
  const fist=`<path d="M${fx},305 q6,3 12,1 M${fx+1},312 q5,2 10,0" stroke="${line}" stroke-width=".6" fill="none"/>`;
  const ear=`<path d="${smooth(tf(EAR,sex))}" fill="${skinDark}" stroke="${line}" stroke-width=".6"/>`;
  const clav=view==="front"?`<path d="M97,95 C88,93 76,95 64,98" stroke="${line}" stroke-width=".8" fill="none" opacity=".7"/>`:`<path d="M99.6,165 L99.6,236" stroke="${line}" stroke-width=".6" opacity=".6"/>`;
  const kneeB=view==="back"?`<path d="M64,364 q9,6 20,0" stroke="${line}" stroke-width=".7" fill="none" opacity=".7"/>`:"";
  const half=torso+breast+clav+kneeB+ear+arm+armM+fist;
  const hairP=sex==="m"?(view==="front"?HAIR_M_FRONT:HAIR_M_BACK):(view==="front"?HAIR_F_FRONT:HAIR_F_BACK);
  const face=view==="front"?`<path d="M86,40 q5,-2.4 9,0" stroke="${line}" stroke-width=".9" fill="none"/><ellipse cx="90.5" cy="43.5" rx="2.6" ry="1.3" fill="${skinDark}"/><path d="M98.5,46 q1.5,7 -1,11 q2,1.2 3,.4" stroke="${line}" stroke-width=".7" fill="none"/><path d="M93,62.5 q4,1.8 7,0" stroke="${line}" stroke-width=".8" fill="none"/>`:"";
  const mir=x=>`<g>${x}</g><g transform="translate(200,0) scale(-1,1)">${x}</g>`;
  const pony=sex==="f"&&view==="back"?`<path d="${smooth(full(PONY))}" fill="${hair}"/>`:"";
  return `<svg viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${view==="front"?"Vorderansicht":"Rückansicht"}">
    <defs>
      <linearGradient id="${uid}s" x1="0" x2="1"><stop offset="0" stop-color="${skinDark}"/><stop offset=".6" stop-color="${skin}"/><stop offset="1" stop-color="${skin}"/></linearGradient>
      <radialGradient id="${uid}m" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${muscle}"/><stop offset="1" stop-color="${muscleDark}"/></radialGradient>
      <radialGradient id="${uid}b" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="${muscle}"/><stop offset="1" stop-color="${skinDark}"/></radialGradient>
      <radialGradient id="${uid}h" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="${muscle}"/><stop offset="1" stop-color="${skinDark}"/></radialGradient>
      <radialGradient id="${uid}g" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
      ${clipDefs}
    </defs>
    <path d="${smooth(full(tf(BODY,sex)))}" fill="url(#${uid}s)" stroke="${line}" stroke-width="1.2"/>
    <path d="${smooth(full(tf(NECK,sex)))}" fill="url(#${uid}s)"/>
    ${mir(half)}
    <path d="${smooth(full(tf(HEAD,sex)))}" fill="url(#${uid}h)" stroke="${line}" stroke-width="1.1"/>
    ${face?mir(face):""}
    <path d="${smooth(full(tf(hairP,sex)))}" fill="${hair}"/>${pony}
  </svg>`;
}

window.Anatomy={svg,regions:["chest","shoulders","arms","abs","back","glutes","hip","legs","neck"]};
})();

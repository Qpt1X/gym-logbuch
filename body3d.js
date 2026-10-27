/* Gym-Logbuch: 3D-Körpermodell (Mann/Frau), eigener WebGL-Renderer ohne Bibliothek.
   Der Körper ist als glatt verschmolzene Distanzfunktion (SDF) beschrieben und wird einmalig
   per "Surface Nets" in ein Dreiecksnetz umgewandelt. Muskelpartien werden pro Eckpunkt eingefärbt. */
(function(){
"use strict";

/* ---------- Distanzfunktionen ---------- */
function sdEll(px,py,pz,P){ const x=px-P.c[0],y=py-P.c[1],z=pz-P.c[2], rx=P.r[0],ry=P.r[1],rz=P.r[2];
  const k0=Math.sqrt(x*x/(rx*rx)+y*y/(ry*ry)+z*z/(rz*rz)), k1=Math.sqrt(x*x/(rx*rx*rx*rx)+y*y/(ry*ry*ry*ry)+z*z/(rz*rz*rz*rz));
  return k1>1e-9?k0*(k0-1)/k1:-Math.min(rx,ry,rz); }
function sdCone(px,py,pz,P){ const a=P.a,b=P.b, bax=b[0]-a[0],bay=b[1]-a[1],baz=b[2]-a[2], pax=px-a[0],pay=py-a[1],paz=pz-a[2];
  const L2=bax*bax+bay*bay+baz*baz; let h=(pax*bax+pay*bay+paz*baz)/L2; h=h<0?0:h>1?1:h;
  const dx=pax-bax*h,dy=pay-bay*h,dz=paz-baz*h; return Math.sqrt(dx*dx+dy*dy+dz*dz)-(P.r1+(P.r2-P.r1)*h); }
function smin(a,b,k){ const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*.25; }
function ell(c,r,o){ return {t:0,c,r,...o}; }
function cone(a,b,r1,r2,o){ return {t:1,a,b,r1,r2,...o}; }
function lerp3(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
function add3(a,b){ return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }

/* ---------- Körperbau ---------- */
// region: Muskelpartie (wird eingefärbt), hair: Haare, k: Glättung beim Verschmelzen
function bodyParts(sex){
  const F=sex==="f", P=[];
  const sh=F?.178:.205, sy=F?1.385:1.425, hipW=F?.098:.09, s=F?.955:1;
  const Y=v=>v*s;
  // Rumpf & Kopf
  P.push(ell([0,Y(1.635),.005],[F?.08:.084,F?.104:.108,F?.094:.098],{k:.03}));          // Kopf
  P.push(ell([0,Y(1.585),.03],[F?.058:.066,.055,.06],{k:.035}));                         // Kiefer
  P.push(ell([0,Y(1.635),.098],[.012,.022,.016],{k:.02}));                               // Nase
  P.push(cone([0,Y(1.46),-.01],[0,Y(1.575),.005],F?.048:.06,F?.042:.05,{k:.04}));        // Hals
  P.push(ell([0,Y(1.30),0],[F?.14:.158,Y(.19),F?.1:.108],{k:.06}));                      // Brustkorb
  P.push(ell([0,Y(1.405),-.012],[sh-.02,Y(.065),F?.075:.085],{k:.05}));                  // Schultergürtel
  P.push(ell([0,Y(1.11),0],[F?.112:.13,Y(.12),F?.085:.092],{k:.07}));                    // Taille
  P.push(ell([0,Y(.965),-.004],[F?.168:.152,Y(.1),F?.105:.098],{k:.06}));                // Becken
  for(const sd of [1,-1]){
    const S=[sd*sh,Y(sy),-.012], E=[sd*(sh+(F?.07:.085)),Y(1.13),-.025], W=[sd*(sh+(F?.13:.15)),Y(.9),.015];
    const H=[sd*hipW,Y(.92),0], K=[sd*(hipW+(F?.012:.022)),Y(.515),.012], A=[sd*(hipW+(F?.02:.032)),Y(.095),-.02];
    P.push(cone(S,E,F?.043:.05,F?.032:.038,{k:.03}));                                     // Oberarm
    P.push(cone(E,W,F?.036:.043,F?.024:.028,{k:.02}));                                    // Unterarm
    P.push(ell(add3(W,[sd*.008,-.06,.01]),[F?.025:.029,F?.05:.056,F?.04:.045],{k:.025}));// Hand
    P.push(cone(H,K,F?.082:.083,F?.05:.054,{k:.05}));                                     // Oberschenkel
    P.push(cone(K,A,F?.05:.054,F?.03:.034,{k:.03}));                                      // Unterschenkel
    P.push(ell(add3(A,[0,-.06,.055]),[F?.034:.038,.028,F?.09:.1],{k:.03}));              // Fuß
    // Muskeln
    if(F){ P.push(ell([sd*.07,Y(1.365),.072],[.072,.05,.032],{region:"chest",k:.02}));     // Brustmuskel
           P.push(ell([sd*.07,Y(1.305),.088],[.06,.056,.052],{k:.035})); }                    // Brust
    else P.push(ell([sd*.08,Y(1.345),.082],[.085,.058,.038],{region:"chest",k:.018}));
    P.push(ell([sd*(sh+.004),Y(sy-.005),-.006],[F?.055:.068,F?.065:.075,F?.058:.068],{region:"shoulders",k:.03})); // Schulter
    P.push(ell([sd*.068,Y(1.475),-.035],[F?.07:.085,.038,.045],{region:"back",k:.03}));   // Trapez
    P.push(ell([sd*.1,Y(1.265),-.068],[F?.075:.092,Y(.14),.042],{region:"back",k:.03}));  // Latissimus
    P.push(ell(add3(lerp3(S,E,.55),[sd*.004,0,.026]),[F?.028:.036,F?.07:.078,F?.028:.034],{region:"arms",k:.02})); // Bizeps
    P.push(ell(add3(lerp3(S,E,.45),[sd*.006,0,-.026]),[F?.031:.039,F?.075:.085,F?.03:.036],{region:"arms",k:.02})); // Trizeps
    P.push(ell(add3(lerp3(E,W,.3),[0,0,.005]),[F?.033:.04,.07,F?.03:.036],{region:"arms",k:.02})); // Unterarmmuskel
    P.push(ell([sd*.115,Y(1.1),.045],[.038,Y(.09),.05],{region:"abs",k:.03}));           // seitl. Bauch
    P.push(ell([sd*(hipW-.008),Y(.915),-.068],[F?.095:.083,F?.098:.088,F?.07:.058],{region:"glutes",k:.03})); // Po
    P.push(ell([sd*(hipW+.06),Y(.875),.0],[.035,Y(.075),.055],{region:"hip",k:.03}));    // Hüfte außen
    P.push(ell(add3(lerp3(H,K,.45),[sd*.004,0,.04]),[F?.058:.064,Y(.15),F?.05:.054],{region:"legs",k:.025}));  // Oberschenkel vorn
    P.push(ell(add3(lerp3(H,K,.85),[-sd*.022,0,.035]),[.035,.045,.035],{region:"legs",k:.02}));                // innerer Quadrizeps
    P.push(ell(add3(lerp3(H,K,.48),[0,0,-.042]),[F?.055:.058,Y(.15),F?.048:.05],{region:"legs",k:.025}));     // Oberschenkel hinten
    P.push(ell(add3(lerp3(K,A,.3),[0,0,-.03]),[F?.042:.047,Y(.1),F?.04:.044],{region:"legs",k:.02}));         // Wade
    P.push(ell(add3(lerp3(K,A,.35),[sd*.008,0,.025]),[.024,Y(.1),.025],{region:"legs",k:.015}));             // Schienbeinmuskel
  }
  for(const yy of [1.205,1.135,1.065]) for(const sd of [1,-1]) P.push(ell([sd*.034,Y(yy),F?.078:.082],[.032,.031,F?.012:.016],{region:"abs",k:.02})); // Bauchmuskeln
  P.push(ell([0,Y(1.075),-.08],[.085,Y(.075),.03],{region:"back",k:.03}));               // unterer Rücken
  // Haare
  if(F){ P.push(ell([0,Y(1.655),-.012],[.088,.1,.1],{hair:1,k:.015,cut:"face"}));
         P.push(ell([0,Y(1.6),-.11],[.035,.075,.035],{hair:1,k:.02})); P.push(ell([0,Y(1.66),-.09],[.045,.04,.04],{hair:1,k:.02})); }
  else P.push(ell([0,Y(1.672),-.012],[.089,.075,.1],{hair:1,k:.012,cut:"face"}));
  return P;
}

function makeSdf(parts){
  // Haar-Kappen werden vorne abgeschnitten, damit das Gesicht frei bleibt
  return function(x,y,z){
    let d=1e9;
    for(const p of parts){
      let v=p.t?sdCone(x,y,z,p):sdEll(x,y,z,p);
      if(p.cut==="face") v=Math.max(v,(z-.035)-(y-p.c[1])*.6, -(y-(p.c[1]-.055)));
      d=d>1e8?v:smin(d,v,p.k||.02);
    }
    return d;
  };
}

/* ---------- Surface Nets ---------- */
function buildMesh(sex){
  const parts=bodyParts(sex), sdf=makeSdf(parts);
  const h=.015, x0=-.47, y0=-.03, z0=-.2, nx=Math.ceil(.94/h)+1, ny=Math.ceil(1.79/h)+1, nz=Math.ceil(.42/h)+1;
  const N=nx*ny*nz, val=new Float32Array(N);
  // Grobe Begrenzung: weit außerhalb nicht genau rechnen
  for(let k=0;k<nz;k++){ const z=z0+k*h; for(let j=0;j<ny;j++){ const y=y0+j*h; for(let i=0;i<nx;i++){ const x=x0+i*h; val[i+nx*(j+ny*k)]=sdf(x,y,z); } } }
  const idx=(i,j,k)=>i+nx*(j+ny*k);
  const cellV=new Int32Array((nx-1)*(ny-1)*(nz-1)).fill(-1), cid=(i,j,k)=>i+(nx-1)*(j+(ny-1)*k);
  const pos=[];
  const EDGES=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const corner=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
  const cv=new Float32Array(8);
  for(let k=0;k<nz-1;k++) for(let j=0;j<ny-1;j++) for(let i=0;i<nx-1;i++){
    let neg=0; for(let c=0;c<8;c++){ const o=corner[c]; cv[c]=val[idx(i+o[0],j+o[1],k+o[2])]; if(cv[c]<0) neg++; }
    if(neg===0||neg===8) continue;
    let sx=0,sy=0,sz=0,n=0;
    for(const [a,b] of EDGES){ const va=cv[a],vb=cv[b]; if((va<0)===(vb<0)) continue; const t=va/(va-vb), A=corner[a],B=corner[b];
      sx+=A[0]+(B[0]-A[0])*t; sy+=A[1]+(B[1]-A[1])*t; sz+=A[2]+(B[2]-A[2])*t; n++; }
    cellV[cid(i,j,k)]=pos.length/3; pos.push(x0+(i+sx/n)*h, y0+(j+sy/n)*h, z0+(k+sz/n)*h);
  }
  const tri=[];
  const quad=(a,b,c,d,flip)=>{ if(a<0||b<0||c<0||d<0) return; if(flip) tri.push(a,c,b, a,d,c); else tri.push(a,b,c, a,c,d); };
  for(let k=1;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=0;i<nx-1;i++){ const a=val[idx(i,j,k)], b=val[idx(i+1,j,k)]; if((a<0)===(b<0)) continue;
    quad(cellV[cid(i,j-1,k-1)],cellV[cid(i,j,k-1)],cellV[cid(i,j,k)],cellV[cid(i,j-1,k)],a<0); }
  for(let k=1;k<nz-1;k++) for(let j=0;j<ny-1;j++) for(let i=1;i<nx-1;i++){ const a=val[idx(i,j,k)], b=val[idx(i,j+1,k)]; if((a<0)===(b<0)) continue;
    quad(cellV[cid(i-1,j,k-1)],cellV[cid(i-1,j,k)],cellV[cid(i,j,k)],cellV[cid(i,j,k-1)],a<0); }
  for(let k=0;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=1;i<nx-1;i++){ const a=val[idx(i,j,k)], b=val[idx(i,j,k+1)]; if((a<0)===(b<0)) continue;
    quad(cellV[cid(i-1,j-1,k)],cellV[cid(i,j-1,k)],cellV[cid(i,j,k)],cellV[cid(i-1,j,k)],a<0); }
  // Normalen aus dem Gradienten, Zuordnung zu Muskelpartie/Haar
  const nv=pos.length/3, nor=new Float32Array(nv*3), reg=new Int8Array(nv).fill(-1), wgt=new Float32Array(nv), hair=new Uint8Array(nv);
  const REG=window.Body3D.regions, e=.004;
  const regParts=parts.filter(p=>p.region||p.hair);
  for(let v=0;v<nv;v++){
    const x=pos[v*3],y=pos[v*3+1],z=pos[v*3+2];
    const gx=sdf(x+e,y,z)-sdf(x-e,y,z), gy=sdf(x,y+e,z)-sdf(x,y-e,z), gz=sdf(x,y,z+e)-sdf(x,y,z-e), gl=Math.hypot(gx,gy,gz)||1;
    nor[v*3]=gx/gl; nor[v*3+1]=gy/gl; nor[v*3+2]=gz/gl;
    let best=1e9, bp=null;
    for(const p of regParts){ let d=p.t?sdCone(x,y,z,p):sdEll(x,y,z,p); if(p.cut==="face") d=Math.max(d,(z-.035)-(y-p.c[1])*.6,-(y-(p.c[1]-.055))); if(d<best){ best=d; bp=p; } }
    if(bp&&bp.hair&&best<.006){ hair[v]=1; continue; }
    if(bp&&bp.region){ let w=1-Math.max(0,best)/.016; if(w>0){ w=Math.min(1,w); reg[v]=REG.indexOf(bp.region); wgt[v]=w*w*(3-2*w); } }
  }
  return {pos:new Float32Array(pos),nor,idx:new Uint32Array(tri),reg,wgt,hair,n:nv};
}

/* ---------- Rendern ---------- */
const VS=`attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 VP;uniform mat3 R;uniform vec3 off;varying vec3 vn;varying vec3 vc;varying vec3 vp;
void main(){vec3 w=R*p+off;vp=w;vn=R*n;vc=c;gl_Position=VP*vec4(w,1.);}`;
const FS=`precision mediump float;varying vec3 vn;varying vec3 vc;varying vec3 vp;uniform vec3 eye;uniform float dark;
void main(){vec3 n=normalize(vn);vec3 v=normalize(eye-vp);vec3 l1=normalize(vec3(.4,.7,1.));vec3 l2=normalize(vec3(-.8,.2,.3));
float d=max(dot(n,l1),0.)*.72+max(dot(n,l2),0.)*.22+max(dot(n,vec3(0.,-1.,0.)),0.)*.05;
vec3 h=normalize(l1+v);float sp=pow(max(dot(n,h),0.),36.)*.18;float rim=pow(1.-max(dot(n,v),0.),2.5)*(dark>.5?.28:.18);
vec3 col=vc*(.36+d)+vec3(sp)+vec3(rim)*mix(vec3(1.),vc,.3);gl_FragColor=vec4(col,1.);}`;

function hex(c){ c=(c||"").trim(); if(!c) return [.78,.8,.83]; const h=c.replace("#",""); const v=h.length===3?h.split("").map(x=>x+x).join(""):h; return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255); }
function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
function mmul(a,b){ const o=new Float32Array(16); for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; } return o; }
function ortho(l,r,b,t,n,f){ const o=new Float32Array(16); o[0]=2/(r-l); o[5]=2/(t-b); o[10]=-2/(f-n); o[12]=-(r+l)/(r-l); o[13]=-(t+b)/(t-b); o[14]=-(f+n)/(f-n); o[15]=1; return o; }
function persp(fov,asp,n,f){ const t=1/Math.tan(fov/2), o=new Float32Array(16); o[0]=t/asp; o[5]=t; o[10]=(f+n)/(n-f); o[11]=-1; o[14]=2*f*n/(n-f); return o; }
function view(eye,tgt){ const z=[eye[0]-tgt[0],eye[1]-tgt[1],eye[2]-tgt[2]], zl=Math.hypot(...z); z[0]/=zl;z[1]/=zl;z[2]/=zl; const x=[z[2],0,-z[0]], xl=Math.hypot(...x); x[0]/=xl;x[2]/=xl; const y=[z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]];
  return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]), -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]), -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]), 1]); }
function rotY(a){ const c=Math.cos(a), s=Math.sin(a); return new Float32Array([c,0,-s, 0,1,0, s,0,c]); }

const cache={};
function getMesh(sex){ return cache[sex]||(cache[sex]=buildMesh(sex)); }

let active=null;
function mount(canvas,intensity,opts){
  stop();
  opts=opts||{};
  let gl=canvas.getContext("webgl2",{antialias:true,alpha:true}), v2=!!gl;
  if(!gl) gl=canvas.getContext("webgl",{antialias:true,alpha:true});
  if(!gl) return null;
  if(!v2&&!gl.getExtension("OES_element_index_uint")) return null;
  const sh=(t,src)=>{ const s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s); return s; };
  const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const M=getMesh(opts.sex==="f"?"f":"m");
  const css=getComputedStyle(canvas);
  const base=hex(css.getPropertyValue("--body-base")), lo=hex(css.getPropertyValue("--heat-lo")), hi=hex(css.getPropertyValue("--heat-hi")), hairC=hex(css.getPropertyValue("--body-hair")||"#3b3f47");
  const dark=(css.getPropertyValue("--body-dark")||"").trim()==="1";
  const REG=window.Body3D.regions;
  const col=new Float32Array(M.n*3);
  for(let v=0;v<M.n;v++){
    let c=base;
    if(M.hair[v]) c=hairC;
    else if(M.reg[v]>=0){ const t=intensity[REG[M.reg[v]]]||0, w=M.wgt[v];
      const mus=t>0?mix(lo,hi,Math.min(1,t)):mix(base,[1,1,1],dark?.05:.18);
      c=mix(base,mus,Math.min(1,w*1.25)); }
    col[v*3]=c[0]; col[v*3+1]=c[1]; col[v*3+2]=c[2];
  }
  const buf=(data,loc,size)=>{ const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW); const l=gl.getAttribLocation(pr,loc); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0); return b; };
  const bufs=[buf(M.pos,"p",3),buf(M.nor,"n",3),buf(col,"c",3)];
  const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,M.idx,gl.STATIC_DRAW);
  const uVP=gl.getUniformLocation(pr,"VP"), uR=gl.getUniformLocation(pr,"R"), uO=gl.getUniformLocation(pr,"off"), uE=gl.getUniformLocation(pr,"eye"), uD=gl.getUniformLocation(pr,"dark");
  gl.enable(gl.DEPTH_TEST); gl.uniform1f(uD,dark?1:0);

  let yaw=opts.yaw||0, dragging=false, px=0, alive=true, raf=0, dirty=true, targetYaw=null;
  function draw(){
    const dpr=Math.min(2,window.devicePixelRatio||1), W=Math.round(canvas.clientWidth*dpr), H=Math.round(canvas.clientHeight*dpr);
    if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; }
    gl.viewport(0,0,W,H); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const eye=[0,.95,4.2], P=persp(.44,(W/2)/H,.1,20), VP=mmul(P,view(eye,[0,.86,0]));
    gl.uniform3fv(uE,eye); gl.uniformMatrix4fv(uVP,false,VP);
    // zwei Figuren nebeneinander: vorne und hinten
    for(const [i,a] of [[0,yaw],[1,yaw+Math.PI]]){
      gl.viewport(i*W/2,0,W/2,H);
      gl.uniformMatrix3fv(uR,false,rotY(a)); gl.uniform3fv(uO,[0,0,0]);
      gl.drawElements(gl.TRIANGLES,M.idx.length,gl.UNSIGNED_INT,0);
    }
  }
  function frame(){ if(!alive) return; if(targetYaw!=null){ const d=targetYaw-yaw; yaw+=d*.2; if(Math.abs(d)<.003){ yaw=targetYaw; targetYaw=null; } dirty=true; } if(dirty){ draw(); dirty=false; } raf=requestAnimationFrame(frame); }
  const down=e=>{ dragging=true; targetYaw=null; px=e.clientX; canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId); };
  const move=e=>{ if(!dragging) return; e.preventDefault(); yaw+=(e.clientX-px)*.012; px=e.clientX; dirty=true; };
  const up=()=>{ dragging=false; };
  const resize=()=>{ dirty=true; };
  canvas.addEventListener("pointerdown",down); canvas.addEventListener("pointermove",move); canvas.addEventListener("pointerup",up); canvas.addEventListener("pointercancel",up); window.addEventListener("resize",resize);
  raf=requestAnimationFrame(frame);
  active={
    destroy(){ alive=false; cancelAnimationFrame(raf); canvas.removeEventListener("pointerdown",down); canvas.removeEventListener("pointermove",move); canvas.removeEventListener("pointerup",up); canvas.removeEventListener("pointercancel",up); window.removeEventListener("resize",resize); bufs.forEach(b=>gl.deleteBuffer(b)); gl.deleteBuffer(ib); active=null; },
    reset(){ const k=Math.round(yaw/(2*Math.PI)); targetYaw=k*2*Math.PI; },
    get yaw(){ return yaw; }
  };
  return active;
}
function stop(){ if(active) active.destroy(); }
function ready(sex){ return !!cache[sex==="f"?"f":"m"]; }

window.Body3D={mount,stop,ready,regions:["chest","shoulders","arms","abs","back","glutes","hip","legs","neck"]};
})();

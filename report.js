/* Gym-Logbuch: PDF-Fortschrittsbericht.
   Eigener kleiner PDF-Schreiber (Standardschrift Helvetica, keine externen Bibliotheken),
   damit die App auch offline PDFs erstellen kann. */
(function(){
"use strict";

/* ---------- Schriftbreiten (Helvetica, WinAnsi 32–255, in 1/1000 em) ---------- */
const W_REG=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
const W_BOLD=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];

/* Unicode -> Windows-1252 (für ä, ö, ü, ß, ×, –, · usw.) */
const CP1252_EXTRA={0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F};
function toBytes(str){
  let out="";
  for(const ch of String(str)){
    const c=ch.codePointAt(0);
    if(c>=32&&c<127) out+=ch;
    else if(c>=160&&c<=255) out+=String.fromCharCode(c);
    else if(CP1252_EXTRA[c]) out+=String.fromCharCode(CP1252_EXTRA[c]);
    else if(c===0x202F||c===0x2009) out+=" ";
    else out+="?";
  }
  return out;
}

/* ---------- Mini-PDF ---------- */
const PW=595.28, PH=841.89; // A4 in pt
function f(n){ return (Math.round(n*100)/100).toString(); }
function rgb(hex){ const h=hex.replace("#",""); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>f(v)).join(" "); }

class PDF{
  constructor(){ this.pages=[]; this.page=null; }
  addPage(){ this.page=[]; this.pages.push(this.page); return this.pages.length; }
  width(str,size,bold){ const t=toBytes(str), W=bold?W_BOLD:W_REG; let w=0; for(let i=0;i<t.length;i++){ const c=t.charCodeAt(i); w+=c>=32?(W[c-32]||556):0; } return w*size/1000; }
  text(x,y,str,o={}){
    const size=o.size||10, bold=!!o.bold;
    let tx=x; if(o.align==="right") tx=x-this.width(str,size,bold); else if(o.align==="center") tx=x-this.width(str,size,bold)/2;
    const s=toBytes(str).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
    this.page.push(`BT ${rgb(o.color||"#141a24")} rg /${bold?"F2":"F1"} ${f(size)} Tf ${f(tx)} ${f(PH-y)} Td (${s}) Tj ET`);
  }
  line(x1,y1,x2,y2,o={}){
    this.page.push(`q ${rgb(o.color||"#000000")} RG ${f(o.w||1)} w ${o.dash?`[${o.dash.join(" ")}] 0 d`:""} 1 J ${f(x1)} ${f(PH-y1)} m ${f(x2)} ${f(PH-y2)} l S Q`);
  }
  polyline(pts,o={}){
    if(pts.length<2) return;
    const path=pts.map((p,i)=>`${f(p[0])} ${f(PH-p[1])} ${i?"l":"m"}`).join(" ");
    this.page.push(`q ${rgb(o.color||"#000000")} RG ${f(o.w||1)} w 1 j 1 J ${o.dash?`[${o.dash.join(" ")}] 0 d`:""} ${path} S Q`);
  }
  polygon(pts,fill){
    const path=pts.map((p,i)=>`${f(p[0])} ${f(PH-p[1])} ${i?"l":"m"}`).join(" ");
    this.page.push(`q ${rgb(fill)} rg ${path} h f Q`);
  }
  rect(x,y,w,h,o={}){
    const r=`${f(x)} ${f(PH-y-h)} ${f(w)} ${f(h)} re`;
    if(o.fill&&o.stroke) this.page.push(`q ${rgb(o.fill)} rg ${rgb(o.stroke)} RG ${f(o.w||.75)} w ${r} B Q`);
    else if(o.fill) this.page.push(`q ${rgb(o.fill)} rg ${r} f Q`);
    else this.page.push(`q ${rgb(o.stroke||"#000000")} RG ${f(o.w||.75)} w ${r} S Q`);
  }
  circle(cx,cy,r,o={}){
    const k=.5523*r, y=PH-cy;
    const p=`${f(cx+r)} ${f(y)} m ${f(cx+r)} ${f(y+k)} ${f(cx+k)} ${f(y+r)} ${f(cx)} ${f(y+r)} c ${f(cx-k)} ${f(y+r)} ${f(cx-r)} ${f(y+k)} ${f(cx-r)} ${f(y)} c ${f(cx-r)} ${f(y-k)} ${f(cx-k)} ${f(y-r)} ${f(cx)} ${f(y-r)} c ${f(cx+k)} ${f(y-r)} ${f(cx+r)} ${f(y-k)} ${f(cx+r)} ${f(y)} c h`;
    this.page.push(`q ${rgb(o.fill||"#ffffff")} rg ${rgb(o.stroke||o.fill||"#000000")} RG ${f(o.w||1)} w ${p} ${o.stroke?"B":"f"} Q`);
  }
  output(title){
    const objs=[]; const add=s=>{ objs.push(s); return objs.length; };
    const catalog=add(null), pagesObj=add(null);
    const f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const kids=[];
    for(const ops of this.pages){
      const stream=ops.join("\n");
      const c=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      kids.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`));
    }
    objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
    objs[pagesObj-1]=`<< /Type /Pages /Kids [${kids.map(k=>k+" 0 R").join(" ")}] /Count ${kids.length} >>`;
    const d=new Date(), p2=n=>String(n).padStart(2,"0");
    const info=add(`<< /Title (${toBytes(title).replace(/[()\\]/g,"")}) /Producer (Gym-Logbuch) /CreationDate (D:${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}) >>`);
    let out="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; const offs=[];
    objs.forEach((o,i)=>{ offs.push(out.length); out+=`${i+1} 0 obj\n${o}\nendobj\n`; });
    const xref=out.length;
    out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+offs.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("");
    out+=`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes=new Uint8Array(out.length); for(let i=0;i<out.length;i++) bytes[i]=out.charCodeAt(i)&255;
    return bytes;
  }
}

/* ---------- Helfer ---------- */
const C={ink:"#141a24",muted:"#5b6676",faint:"#8a94a3",line:"#d9dee6",grid:"#e8ecf1",band:"#f3f5f8",accent:"#1f46c2",second:"#c2570c",accentSoft:"#e3e9fb"};
const nf=new Intl.NumberFormat("de-DE",{maximumFractionDigits:1});
const nf0=new Intl.NumberFormat("de-DE",{maximumFractionDigits:0});
const dShort=s=>{const [y,m,d]=s.split("-");return `${d}.${m}.`;};
const dLong=s=>{const [y,m,d]=s.split("-");return `${d}.${m}.${y}`;};
function niceStep(range,count){
  const raw=range/Math.max(1,count), mag=Math.pow(10,Math.floor(Math.log10(raw))), n=raw/mag;
  return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*mag;
}
function wrap(pdf,str,size,bold,maxW){
  const words=String(str).split(" "); const lines=[]; let cur="";
  for(const w of words){ const t=cur?cur+" "+w:w; if(pdf.width(t,size,bold)<=maxW||!cur) cur=t; else { lines.push(cur); cur=w; } }
  if(cur) lines.push(cur); return lines.length?lines:[""];
}

/* ---------- Bericht ---------- */
const M=48, CW=PW-2*M, BOTTOM=PH-56;

let ROW_RF=false;
function build(model){
  ROW_RF=!!model.repsFirst;
  // model: {title, rangeLabel, fromDate, toDate, created, includeChart, includeTable, summary:{days,sessions,sets,volume}, exercises:[{name, group, settingsLine, rows:[{date, setsText, best, e1rm, reps, volume}]}]}
  const pdf=new PDF(); let y=0;
  const newPage=()=>{ pdf.addPage(); y=M; };
  const need=h=>{ if(y+h>BOTTOM){ newPage(); return true; } return false; };

  newPage();
  pdf.text(M,y+8,"GYM-LOGBUCH",{size:8.5,bold:true,color:C.accent});
  pdf.text(M,y+36,model.title,{size:24,bold:true});
  pdf.text(M,y+56,`${model.rangeLabel}  ·  ${dLong(model.fromDate)} – ${dLong(model.toDate)}`,{size:10,color:C.muted});
  pdf.text(PW-M,y+8,`Erstellt am ${dLong(model.created)}`,{size:8.5,color:C.muted,align:"right"});
  y+=76;
  // Zusammenfassung
  const sum=model.summary, cells=[["Trainingstage",nf0.format(sum.days)],["Einheiten",nf0.format(sum.sessions)],["Sätze",nf0.format(sum.sets)],["Gesamtvolumen",sum.volume?nf0.format(sum.volume)+" kg":"–"]];
  const cw=CW/cells.length;
  pdf.rect(M,y,CW,52,{fill:C.band});
  cells.forEach(([label,val],i)=>{
    const x=M+i*cw+14;
    pdf.text(x,y+24,val,{size:16,bold:true});
    pdf.text(x,y+40,label,{size:8.5,color:C.muted});
    if(i) pdf.line(M+i*cw,y+10,M+i*cw,y+42,{color:C.line,w:.75});
  });
  y+=74;
  pdf.text(M,y,"Volumen = Gewicht × Wiederholungen, über alle Sätze summiert. Geschätztes 1RM nach Epley: Gewicht × (1 + Wdh. / 30).",{size:8,color:C.faint});
  y+=22;

  if(!model.exercises.length){
    pdf.text(M,y+10,"Im gewählten Zeitraum gibt es keine eingetragenen Einheiten.",{size:11,color:C.muted});
  }

  model.exercises.forEach((ex,idx)=>{
    const rows=ex.rows; // chronologisch
    const hasW=rows.some(r=>r.best!=null);
    const chartH=model.includeChart&&rows.length>=2?170:0;
    // Abschnitt beginnt auf neuer Seite, wenn Titel + Grafik + 3 Tabellenzeilen nicht passen
    if(idx>0) y+=14;
    need(70+chartH+(model.includeTable?70:0));
    pdf.line(M,y,M+CW,y,{color:C.ink,w:1.2});
    y+=22;
    pdf.text(M,y,ex.name,{size:15,bold:true});
    pdf.text(PW-M,y,ex.group||"",{size:9,color:C.muted,align:"right"});
    y+=15;
    if(ex.settingsLine){ for(const l of wrap(pdf,"Einstellungen: "+ex.settingsLine,9,false,CW)){ pdf.text(M,y,l,{size:9,color:C.muted}); y+=12; } }
    // Kennzahlen
    const first=rows[0], last=rows[rows.length-1];
    const bestAll=rows.reduce((m,r)=>r.best!=null&&(m==null||r.best>m)?r.best:m,null);
    const e1All=rows.reduce((m,r)=>r.e1rm!=null&&(m==null||r.e1rm>m)?r.e1rm:m,null);
    const parts=[];
    if(hasW){
      parts.push(`Bestes Gewicht: ${nf.format(bestAll)} kg`);
      if(e1All!=null) parts.push(`Geschätztes 1RM: ${nf0.format(e1All)} kg`);
      if(rows.length>=2&&first.best!=null&&last.best!=null){
        const diff=last.best-first.best, pct=first.best?diff/first.best*100:0;
        parts.push(`Veränderung: ${diff>0?"+":diff<0?"−":"±"}${nf.format(Math.abs(diff))} kg (${diff>0?"+":diff<0?"−":"±"}${nf0.format(Math.abs(pct))} %)`);
      }
    } else {
      const bestR=rows.reduce((m,r)=>r.reps!=null&&(m==null||r.reps>m)?r.reps:m,null);
      if(bestR!=null) parts.push(`Beste Wiederholungen: ${bestR}`);
    }
    parts.push(`Einheiten: ${rows.length}`);
    y+=4; pdf.text(M,y+8,parts.join("   ·   "),{size:9.5,bold:true}); y+=22;

    if(chartH){ drawChart(pdf,M,y,CW,chartH-20,rows,hasW); y+=chartH; }
    else if(model.includeChart&&rows.length<2){ pdf.text(M,y+4,"Für eine Grafik braucht es mindestens zwei Einheiten im Zeitraum.",{size:8.5,color:C.faint}); y+=16; }

    if(model.includeTable) y=drawTable(pdf,y,ex,rows,hasW,newPage);
  });

  addFooters(pdf,model.title);
  return pdf.output(model.title);
}

function addFooters(pdf,title){
  const total=pdf.pages.length;
  pdf.pages.forEach((ops,i)=>{
    pdf.page=ops;
    pdf.line(M,PH-38,PW-M,PH-38,{color:C.line,w:.5});
    pdf.text(M,PH-26,"Gym-Logbuch · "+title,{size:8,color:C.faint});
    pdf.text(PW-M,PH-26,`Seite ${i+1} von ${total}`,{size:8,color:C.faint,align:"right"});
  });
}

/* ---------- Trainingstag als Tabelle ---------- */
function buildDay(model){
  // model: {dateLong, date, created, exercises:[{name, group, settingsLine, note, sets:[{w,r}]}]}
  const pdf=new PDF(); let y=0;
  const newPage=()=>{ pdf.addPage(); y=M; };
  newPage();
  pdf.text(M,y+8,"GYM-LOGBUCH",{size:8.5,bold:true,color:C.accent});
  pdf.text(PW-M,y+8,`Erstellt am ${dLong(model.created)}`,{size:8.5,color:C.muted,align:"right"});
  { const ttl=model.typeName?`Trainingstag: ${model.typeName}`:"Trainingstag"; let sz=24; while(sz>14&&pdf.width(ttl,sz,true)>CW) sz-=1; pdf.text(M,y+36,ttl,{size:sz,bold:true}); }
  pdf.text(M,y+56,model.dateLong,{size:11,color:C.muted});
  y+=76;
  let sets=0, reps=0, vol=0;
  for(const e of model.exercises) for(const st of e.sets){ sets++; reps+=st.r||0; vol+=(st.w||0)*(st.r||0); }
  const cells=[["Übungen",nf0.format(model.exercises.length)],["Sätze",nf0.format(sets)],["Wiederholungen",nf0.format(reps)],["Volumen",vol?nf0.format(vol)+" kg":"–"]];
  const cw=CW/cells.length;
  pdf.rect(M,y,CW,52,{fill:C.band});
  cells.forEach(([label,val],i)=>{
    const x=M+i*cw+14;
    pdf.text(x,y+24,val,{size:16,bold:true});
    pdf.text(x,y+40,label,{size:8.5,color:C.muted});
    if(i) pdf.line(M+i*cw,y+10,M+i*cw,y+42,{color:C.line,w:.75});
  });
  y+=72;

  const RF=!!model.repsFirst;
  const cols=[{t:"Übung",w:CW-44-80-60-90},{t:"Satz",w:44,r:true},...(RF?[{t:"Wdh.",w:60,r:true},{t:"Gewicht",w:80,r:true}]:[{t:"Gewicht",w:80,r:true},{t:"Wdh.",w:60,r:true}]),{t:"Volumen",w:90,r:true}];
  const pad=6, rh=20;
  const header=()=>{
    pdf.rect(M,y,CW,20,{fill:C.band});
    let x=M; cols.forEach(c=>{ pdf.text(c.r?x+c.w-pad:x+pad,y+13.5,c.t,{size:8,bold:true,color:C.muted,align:c.r?"right":"left"}); x+=c.w; });
    y+=20;
  };
  header();
  model.exercises.forEach((e,ei)=>{
    const meta=[e.group,e.settingsLine].filter(Boolean).join(" · ");
    const metaLines=meta?wrap(pdf,meta,8,false,cols[0].w-2*pad):[];
    const noteLines=e.note?wrap(pdf,"Notiz: "+e.note,8,false,CW-2*pad):[];
    const nameLines=wrap(pdf,e.name,9.5,true,cols[0].w-2*pad);
    const firstRowH=Math.max(rh,nameLines.length*12+metaLines.length*10+9);
    const blockH=firstRowH+Math.max(0,e.sets.length-1)*rh+noteLines.length*10+(noteLines.length?8:0);
    if(y+Math.min(blockH,firstRowH+rh*2)>BOTTOM){ newPage(); header(); }
    if(ei%2===1) pdf.rect(M,y,CW,Math.min(blockH,BOTTOM-y),{fill:"#fafbfc"});
    const rows=e.sets.length?e.sets:[{w:null,r:null}];
    rows.forEach((st,si)=>{
      const h=si===0?firstRowH:rh;
      if(y+h>BOTTOM){ newPage(); header(); pdf.text(M+pad,y+13.5,e.name+" (Forts.)",{size:9,bold:true,color:C.muted}); }
      let x=M;
      if(si===0){
        nameLines.forEach((l,li)=>pdf.text(x+pad,y+13.5+li*12,l,{size:9.5,bold:true}));
        metaLines.forEach((l,li)=>pdf.text(x+pad,y+13.5+nameLines.length*12+li*10-1,l,{size:8,color:C.muted}));
      }
      x+=cols[0].w;
      const wv=st.w!=null?nf.format(st.w)+" kg":"–", rv=st.r!=null?String(st.r):"–";
      const vals=[e.sets.length?String(si+1):"–", RF?rv:wv, RF?wv:rv, st.w&&st.r?nf0.format(st.w*st.r)+" kg":"–"];
      const boldIdx=RF?2:1;
      cols.slice(1).forEach((c,ci)=>{ pdf.text(x+c.w-pad,y+13.5,vals[ci],{size:9.5,bold:ci===boldIdx,color:ci===0?C.muted:C.ink,align:"right"}); x+=c.w; });
      y+=h;
      if(si<rows.length-1) pdf.line(M+cols[0].w,y,M+CW,y,{color:C.grid,w:.4});
    });
    if(noteLines.length){ noteLines.forEach(l=>{ pdf.text(M+pad,y+9,l,{size:8,color:C.muted}); y+=10; }); y+=8; }
    pdf.line(M,y,M+CW,y,{color:C.line,w:.75});
  });
  addFooters(pdf,"Trainingstag "+dLong(model.date));
  return pdf.output("Trainingstag "+dLong(model.date));
}

function drawChart(pdf,x0,y0,w,h,rows,hasW){
  const L=40,R=58,T=22,B=24;
  const series=hasW
    ?[{key:"best",label:"Bestes Gewicht",color:C.accent,w:2,dash:null},{key:"e1rm",label:"Geschätztes 1RM",color:C.second,w:1.5,dash:[4,3]}]
    :[{key:"reps",label:"Beste Wiederholungen",color:C.accent,w:2,dash:null}];
  const unit=hasW?"kg":"Wdh.";
  const vals=[]; series.forEach(s=>rows.forEach(r=>{ if(r[s.key]!=null) vals.push(r[s.key]); }));
  let lo=Math.min(...vals), hi=Math.max(...vals);
  if(hi===lo){ hi+=hasW?5:2; lo=Math.max(0,lo-(hasW?5:2)); }
  if(!hasW&&hi-lo<4){ hi=Math.ceil(hi+1); lo=Math.max(0,Math.floor(lo-1)); }
  const step=hasW?niceStep(hi-lo,4):Math.max(1,Math.round(niceStep(hi-lo,4)));
  lo=Math.max(0,Math.floor(lo/step)*step); hi=Math.ceil(hi/step)*step;
  const px=x0+L, pw=w-L-R, py=y0+T, ph=h-T-B;
  const X=i=>px+(rows.length===1?pw/2:i*pw/(rows.length-1));
  const Y=v=>py+ph*(1-(v-lo)/(hi-lo));
  // Legende
  let lx=x0+L;
  series.forEach(s=>{
    pdf.line(lx,y0+6,lx+18,y0+6,{color:s.color,w:s.w,dash:s.dash});
    pdf.text(lx+24,y0+9,s.label,{size:8.5,color:C.muted});
    lx+=24+pdf.width(s.label,8.5,false)+20;
  });
  pdf.text(x0+L-6,y0+9,unit,{size:8,color:C.faint,align:"right"});
  // Raster & y-Achse
  for(let v=lo; v<=hi+1e-9; v+=step){
    const yy=Y(v);
    pdf.line(px,yy,px+pw,yy,{color:v===lo?C.line:C.grid,w:v===lo?.9:.6});
    pdf.text(px-6,yy+3,nf.format(v),{size:8,color:C.muted,align:"right"});
  }
  // x-Beschriftung: so viele Daten wie ohne Überlappung passen
  const labelW=30, maxLabels=Math.max(2,Math.floor(pw/(labelW+14))+1);
  const every=Math.max(1,Math.ceil(rows.length/maxLabels));
  rows.forEach((r,i)=>{
    if(i%every!==0&&i!==rows.length-1) return;
    if(i!==rows.length-1&&rows.length-1-i<every&&i!==0) return;
    pdf.text(X(i),py+ph+15,dShort(r.date),{size:8,color:C.muted,align:"center"});
  });
  // Flächen unter der Hauptlinie
  const main=series[0];
  const mainPts=rows.map((r,i)=>r[main.key]!=null?[X(i),Y(r[main.key])]:null).filter(Boolean);
  if(mainPts.length>=2) pdf.polygon([...mainPts,[mainPts[mainPts.length-1][0],py+ph],[mainPts[0][0],py+ph]],C.accentSoft);
  // Linien zeichnen (zweite Serie zuerst, Hauptlinie oben)
  const endLabels=[];
  [...series].reverse().forEach(s=>{
    const pts=rows.map((r,i)=>r[s.key]!=null?[X(i),Y(r[s.key]),r[s.key]]:null).filter(Boolean);
    pdf.polyline(pts,{color:s.color,w:s.w,dash:s.dash});
    if(s===main) pts.forEach((p,i)=>pdf.circle(p[0],p[1],i===pts.length-1?3.6:2.4,{fill:i===pts.length-1?s.color:"#ffffff",stroke:s.color,w:1.2}));
    if(pts.length) endLabels.push({y:pts[pts.length-1][1],x:pts[pts.length-1][0],v:pts[pts.length-1][2],s});
  });
  // Direkte Endbeschriftung, Überlappung vermeiden
  endLabels.sort((a,b)=>a.y-b.y);
  for(let i=1;i<endLabels.length;i++) if(endLabels[i].y-endLabels[i-1].y<11) endLabels[i].y=endLabels[i-1].y+11;
  endLabels.forEach(l=>pdf.text(l.x+8,l.y+3,`${(l.s.key==="e1rm"?nf0:nf).format(l.v)}${hasW?" kg":""}`,{size:8.5,bold:l.s===main,color:C.ink}));
}

function drawTable(pdf,y,ex,rows,hasW,newPage){
  const cols=hasW
    ?[{t:"Datum",w:62},{t:ROW_RF?"Sätze (Wdh. × kg)":"Sätze (kg × Wdh.)",w:CW-62-70-70-80},{t:"Bestes Gewicht",w:70,r:true},{t:"Gesch. 1RM",w:70,r:true},{t:"Volumen",w:80,r:true}]
    :[{t:"Datum",w:62},{t:"Sätze (Wdh.)",w:CW-62-90},{t:"Beste Wdh.",w:90,r:true}];
  const pad=6, lh=11.5;
  const header=()=>{
    pdf.rect(M,y,CW,20,{fill:C.band});
    let x=M; cols.forEach(c=>{ pdf.text(c.r?x+c.w-pad:x+pad,y+13.5,c.t,{size:8,bold:true,color:C.muted,align:c.r?"right":"left"}); x+=c.w; });
    y+=20;
  };
  y+=6; header();
  const list=[...rows].reverse(); // neueste zuerst
  list.forEach((r,ri)=>{
    const setLines=wrap(pdf,r.setsText||"–",9,false,cols[1].w-2*pad);
    const rh=Math.max(20,setLines.length*lh+9);
    if(y+rh>BOTTOM){ newPage(); y=M; pdf.text(M,y+4,ex.name+" (Fortsetzung)",{size:9,bold:true,color:C.muted}); y+=12; header(); }
    if(ri%2===1) pdf.rect(M,y,CW,rh,{fill:"#fafbfc"});
    const cells=hasW
      ?[dLong(r.date),null,r.best!=null?nf.format(r.best)+" kg":"–",r.e1rm!=null?nf0.format(r.e1rm)+" kg":"–",r.volume?nf0.format(r.volume)+" kg":"–"]
      :[dLong(r.date),null,r.reps!=null?String(r.reps):"–"];
    let x=M;
    cols.forEach((c,ci)=>{
      if(ci===1) setLines.forEach((l,li)=>pdf.text(x+pad,y+13.5+li*lh,l,{size:9}));
      else pdf.text(c.r?x+c.w-pad:x+pad,y+13.5,cells[ci],{size:9,bold:ci===2,align:c.r?"right":"left"});
      x+=c.w;
    });
    y+=rh;
    pdf.line(M,y,M+CW,y,{color:C.grid,w:.5});
  });
  return y+6;
}

window.GymReport={build,buildDay};
})();

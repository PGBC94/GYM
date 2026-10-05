// Motor de la figura articulada (cinemática inversa) — extraído del prototipo
import { RIG, lerp, FLOOR, ANIM } from "../data/animations.js";
import { EX_INDEX } from "../data/routine.js";
import { esc } from "../utils.js";
function lerpTarget(a,b,u){
  const k=Object.keys(a)[0]; const A=a[k], B=b[k]||A;
  return {[k]:[lerp(A[0],B[0],u),lerp(A[1],B[1],u)]};
}
export function poseAt(an,u){ // u en 0..1 recorre todos los frames
  const fr=an.frames, segs=fr.length-1; const x=Math.min(u*segs,segs-1e-9); const i=Math.floor(x), f=x-i;
  const A=fr[i],B=fr[i+1];
  return {hip:[lerp(A.hip[0],B.hip[0],f),lerp(A.hip[1],B.hip[1],f)], t:lerp(A.t,B.t,f),
    arms:A.arms.map((t,j)=>lerpTarget(t,B.arms[j],f)), legs:A.legs.map((t,j)=>lerpTarget(t,B.legs[j],f))};
}
function solveIK(R,T,l1,l2,pref,ctx){
  let dx=T[0]-R[0],dy=T[1]-R[1]; const d0=Math.hypot(dx,dy)||0.001; const ux=dx/d0,uy=dy/d0;
  const d=Math.min(Math.max(d0,Math.abs(l1-l2)+0.01),l1+l2-0.01);
  const a=(l1*l1-l2*l2+d*d)/(2*d), h=Math.sqrt(Math.max(0,l1*l1-a*a));
  const bx=R[0]+ux*a, by=R[1]+uy*a, px=-uy*h, py=ux*h;
  const m1=[bx+px,by+py], m2=[bx-px,by-py];
  const score=m=>{switch(pref){case"fwd":return m[0];case"back":return -m[0];case"up":return -m[1];case"down":return m[1];
    case"out":return Math.abs(m[0]-ctx.cx);case"chest":return (m[0]-R[0])*ctx.fn[0]+(m[1]-R[1])*ctx.fn[1];
    case"spine":return -((m[0]-R[0])*ctx.fn[0]+(m[1]-R[1])*ctx.fn[1]);default:return 0}};
  return {mid: score(m1)>=score(m2)?m1:m2, end:[R[0]+ux*d,R[1]+uy*d]};
}
function skeleton(an,p){
  const td=[Math.sin(p.t*Math.PI/180),-Math.cos(p.t*Math.PI/180)], fn=[-td[1],td[0]]; // fn = hacia el pecho
  const front=an.view==="front";
  const sc=[p.hip[0]+td[0]*RIG.torso,p.hip[1]+td[1]*RIG.torso];
  const head=[sc[0]+td[0]*(RIG.neck+RIG.head+3),sc[1]+td[1]*(RIG.neck+RIG.head+3)];
  const so=front?14:0, ho=front?9:0;
  const sh=[[sc[0]-fn[0]*so,sc[1]-fn[1]*so],[sc[0]+fn[0]*so,sc[1]+fn[1]*so]];
  const hp=[[p.hip[0]-fn[0]*ho,p.hip[1]-fn[1]*ho],[p.hip[0]+fn[0]*ho,p.hip[1]+fn[1]*ho]];
  const ctx={cx:p.hip[0],fn};
  const res=(tg,root)=>{ if(tg.a) return tg.a; if(tg.d) return [root[0]+tg.d[0],root[1]+tg.d[1]];
    if(tg.h) return [p.hip[0]+tg.h[0],p.hip[1]+tg.h[1]];
    if(tg.tf) return [root[0]-td[0]*tg.tf[0]+fn[0]*tg.tf[1],root[1]-td[1]*tg.tf[0]+fn[1]*tg.tf[1]]; return root; };
  const arms=p.arms.map((tg,i)=>{const r=solveIK(sh[i],res(tg,sh[i]),RIG.ua,RIG.fa,an.eb[i],ctx);return [sh[i],r.mid,r.end]});
  const legs=p.legs.map((tg,i)=>{const r=solveIK(hp[i],res(tg,hp[i]),RIG.th,RIG.sh,an.kb[i],ctx);return [hp[i],r.mid,r.end]});
  return {sc,head,sh,hp,arms,legs,td,front};
}
const P=pt=>pt[0].toFixed(1)+","+pt[1].toFixed(1);
export function drawFigure(an,p,cls){
  const s=skeleton(an,p); let o="";
  const limb=(seg,c)=>`<polyline class="${c}" points="${seg.map(P).join(" ")}"/>`;
  const handMid=[(s.arms[0][2][0]+s.arms[1][2][0])/2,(s.arms[0][2][1]+s.arms[1][2][1])/2];
  const hand=i=>i===undefined?handMid:s.arms[i][2];
  let props="";
  (an.props||[]).forEach(pr=>{
    if(pr.k==="cable"){const h=hand(pr.hand);props+=`<line class="cable" x1="${pr.from[0]}" y1="${pr.from[1]}" x2="${h[0].toFixed(1)}" y2="${h[1].toFixed(1)}"/><circle class="pulley" cx="${pr.from[0]}" cy="${pr.from[1]}" r="4.5"/>`;}
  });
  if(s.front){
    o+=limb(s.legs[0],"lb")+limb(s.legs[1],"lb");
    o+=`<polygon class="tor" points="${[s.sh[0],s.sh[1],s.hp[1],s.hp[0]].map(P).join(" ")}"/>`;
    o+=limb(s.arms[0],"lb")+limb(s.arms[1],"lb");
  } else {
    o+=limb(s.arms[0],"lb back")+limb(s.legs[0],"lb back");
    o+=`<line class="tor" x1="${s.hp[0][0].toFixed(1)}" y1="${s.hp[0][1].toFixed(1)}" x2="${s.sc[0].toFixed(1)}" y2="${s.sc[1].toFixed(1)}"/>`;
    o+=limb(s.legs[1],"lb");
  }
  o+=`<circle class="hd" cx="${s.head[0].toFixed(1)}" cy="${s.head[1].toFixed(1)}" r="${RIG.head}"/>`;
  if(!s.front) o+=limb(s.arms[1],"lb");
  (an.props||[]).forEach(pr=>{
    if(pr.k==="db"){const h=hand(pr.hand);o+=`<circle class="wt" cx="${h[0].toFixed(1)}" cy="${h[1].toFixed(1)}" r="6.5"/><circle class="wt-in" cx="${h[0].toFixed(1)}" cy="${h[1].toFixed(1)}" r="2"/>`;}
    if(pr.k==="dbv"){const h=handMid;o+=`<rect class="wt" x="${(h[0]-7).toFixed(1)}" y="${(h[1]-12).toFixed(1)}" width="14" height="6" rx="2"/><rect class="wt" x="${(h[0]-7).toFixed(1)}" y="${(h[1]+6).toFixed(1)}" width="14" height="6" rx="2"/><line class="wt-bar" x1="${h[0].toFixed(1)}" y1="${(h[1]-6).toFixed(1)}" x2="${h[0].toFixed(1)}" y2="${(h[1]+6).toFixed(1)}"/>`;}
    if(pr.k==="handle"){const h=handMid;o+=`<line class="wt-bar" x1="${(h[0]-7).toFixed(1)}" y1="${h[1].toFixed(1)}" x2="${(h[0]+7).toFixed(1)}" y2="${h[1].toFixed(1)}"/>`;}
    if(pr.k==="pad"){const f=s.legs[pr.foot][2];o+=`<circle class="pad" cx="${(f[0]+pr.dx).toFixed(1)}" cy="${(f[1]+pr.dy).toFixed(1)}" r="6"/>`;}
  });
  return `<g class="${cls}">${props}${o}</g>`;
}
export function drawStatic(an){
  let o=`<line class="floor" x1="4" y1="${FLOOR+3}" x2="236" y2="${FLOOR+3}"/>`;
  (an.stat||[]).forEach(s=>{
    if(s.k==="rect") o+=`<rect class="eq" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="2"/>`;
    if(s.k==="line") o+=`<line class="eq-l" x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" style="stroke-width:${s.w||3}"/>`;
    if(s.k==="circ") o+=`<circle class="eq" cx="${s.x}" cy="${s.y}" r="${s.r}"/>`;
    if(s.k==="poly") o+=`<polygon class="eq" points="${s.pts.map(p=>p.join(",")).join(" ")}"/>`;
  });
  return o;
}
const ease=x=>0.5-0.5*Math.cos(Math.PI*x);
export function phase(an,ms){ // ida, pausa, vuelta, pausa
  const F=an.slow?2.2:1.1, B=an.slow?1.1:2.2, H1=0.4, H2=0.5, T=F+H1+B+H2; let x=(ms/1000)%T;
  if(x<F) return ease(x/F); x-=F; if(x<H1) return 1; x-=H1; if(x<B) return 1-ease(x/B); return 0;
}
export function tempoLabel(an){
  if(an.label) return an.label;
  return an.slow?"Baja controlando (2-3 s) · sube con fuerza (1 s)":"Fase de esfuerzo en 1 s · vuelve despacio (2-3 s)";
}
export function figSVG(exId,idx,big){
  const an=ANIM[exId][idx];
  return `<svg class="fig${big?" big":""}" data-fig="${exId}" data-i="${idx}" viewBox="0 0 240 160" role="img" aria-label="Animación de ${esc(EX_INDEX[exId].name)}">
    ${drawStatic(an)}${drawFigure(an,poseAt(an,1),"ghost")}<g class="live">${drawFigure(an,poseAt(an,0),"fg")}</g></svg>`;
}
const reduceMotion = (()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return false}})();
let lastFrame=0;
export function animLoop(ts){
  requestAnimationFrame(animLoop);
  if(reduceMotion || ts-lastFrame<33) return; lastFrame=ts;
  const vh=innerHeight;
  document.querySelectorAll("svg.fig").forEach(svg=>{
    const r=svg.getBoundingClientRect(); if(r.bottom<0||r.top>vh||r.width===0) return;
    const an=ANIM[svg.dataset.fig][+svg.dataset.i]; const g=svg.querySelector("g.live");
    g.innerHTML=drawFigure(an,poseAt(an,phase(an,ts)),"fg");
  });
}

export function startAnimations(){ requestAnimationFrame(animLoop); }

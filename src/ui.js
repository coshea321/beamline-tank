(function(){
const $=id=>document.getElementById(id),cv=$('cv'),ctx=cv.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,wide=matchMedia('(orientation: landscape) and (max-height: 540px)');
let li=0,S,hist=[],moves=0,shots=0,playing=false,gen=0,queue=[],grp=0,demo=false,bad=null,view=null,beam=null,cell=32,C={};
const solved=new Set();
const NAMES=['bg','ink','floor','grid','wall','wallhi','brick','brickln','crate','crateln','water','waterhi','ice','icehi','belt','beltln','glass','mirror','mirrorback','tank','tankdk','enemy','enemydk','deadat','laser','flag','accent'];
function colors(){const cs=getComputedStyle(document.documentElement);NAMES.forEach(n=>C[n]=cs.getPropertyValue('--'+n).trim());}
function save(){try{localStorage.setItem('blt2',JSON.stringify({s:[...solved],li,n:LEVELS[li].name}));}catch(e){}}
function load(){try{const o=JSON.parse(localStorage.getItem('blt')||'null');if(o&&o.s)o.s.forEach(k=>ORIG_NAMES[k]&&solved.add(ORIG_NAMES[k]));}catch(e){}
  try{const d=JSON.parse(localStorage.getItem('blt2')||'{}');(d.s||[]).forEach(n=>solved.add(n));const k=LEVELS.findIndex(L=>L.name===d.n);if(k>=0)li=k;else if(d.li>=0&&d.li<LEVELS.length)li=d.li;}catch(e){}}

function size(){
  // Sideways phone: the board fills its grid cell, so its own height (less padding and border) is the limit.
  const b=$('board'),W=b.clientWidth-16,H=wide.matches?b.clientHeight-16:Math.max(220,innerHeight-360);
  cell=Math.max(14,Math.min(Math.floor(W/S.w),Math.floor(H/S.h),52));
  const dpr=window.devicePixelRatio||1;
  cv.style.width=cell*S.w+'px';cv.style.height=cell*S.h+'px';
  cv.width=Math.round(cell*S.w*dpr);cv.height=Math.round(cell*S.h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);draw();
}
function rot(d,fn){const u=cell/2;ctx.save();ctx.translate(u,u);ctx.rotate(d*Math.PI/2);fn(u);ctx.restore();}
function vehicle(d,body,dark){rot(d,u=>{
  ctx.fillStyle=dark;ctx.fillRect(-.8*u,-.72*u,.32*u,1.5*u);ctx.fillRect(.48*u,-.72*u,.32*u,1.5*u);
  ctx.fillStyle=body;ctx.fillRect(-.5*u,-.55*u,u,1.2*u);
  ctx.fillStyle=dark;ctx.fillRect(-.1*u,-.98*u,.2*u,u);
  ctx.beginPath();ctx.arc(0,.08*u,.3*u,0,7);ctx.fill();
  ctx.fillStyle=body;ctx.beginPath();ctx.arc(0,.08*u,.16*u,0,7);ctx.fill();
});}
function tri(k,round){rot(k,u=>{
  const m=round?.56*u:.84*u;
  if(round){ctx.fillStyle=C.mirrorback;ctx.beginPath();ctx.arc(0,0,.86*u,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1,u*.08);ctx.stroke();}
  ctx.fillStyle=round?C.wall:C.mirrorback;ctx.beginPath();ctx.moveTo(-m,-m);ctx.lineTo(m,m);ctx.lineTo(-m,m);ctx.closePath();ctx.fill();
  ctx.strokeStyle=C.mirror;ctx.lineWidth=Math.max(2,u*.2);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-m,-m);ctx.lineTo(m,m);ctx.stroke();
});}
function tile(s,x,y){
  const c=cell,i=y*s.w+x,t=s.ter[i],o=s.obj[i];
  ctx.save();ctx.translate(x*c,y*c);ctx.lineCap='butt';
  ctx.fillStyle=C.floor;ctx.fillRect(0,0,c,c);
  if(t==='~'||t==='='){
    ctx.fillStyle=C.water;ctx.fillRect(0,0,c,c);ctx.strokeStyle=C.waterhi;ctx.lineWidth=Math.max(1,c*.05);
    for(let k=0;k<2;k++){const yy=c*(.33+.36*k);ctx.beginPath();ctx.moveTo(c*.12,yy);ctx.quadraticCurveTo(c*.31,yy-c*.13,c*.5,yy);ctx.quadraticCurveTo(c*.69,yy+c*.13,c*.88,yy);ctx.stroke();}
    if(t==='='){ctx.fillStyle=C.crate;ctx.fillRect(c*.06,c*.06,c*.88,c*.88);ctx.strokeStyle=C.crateln;ctx.lineWidth=Math.max(1,c*.05);for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(c*.06,c*k/4);ctx.lineTo(c*.94,c*k/4);ctx.stroke();}}
  }else if(t==='i'||t==='t'){
    ctx.fillStyle=C.ice;ctx.fillRect(0,0,c,c);ctx.strokeStyle=C.icehi;ctx.lineWidth=Math.max(1,c*.07);
    ctx.beginPath();ctx.moveTo(c*.18,c*.5);ctx.lineTo(c*.5,c*.18);ctx.moveTo(c*.5,c*.82);ctx.lineTo(c*.82,c*.5);ctx.stroke();
    if(t==='t'){ctx.strokeStyle=C.water;ctx.lineWidth=Math.max(1,c*.05);ctx.beginPath();ctx.moveTo(c*.1,c*.3);ctx.lineTo(c*.4,c*.45);ctx.lineTo(c*.35,c*.7);ctx.lineTo(c*.6,c*.9);ctx.moveTo(c*.4,c*.45);ctx.lineTo(c*.7,c*.3);ctx.lineTo(c*.92,c*.42);ctx.stroke();}
  }else if(t==='F'){
    ctx.fillStyle=C.ink;ctx.fillRect(c*.26,c*.14,c*.08,c*.74);
    ctx.fillStyle=C.flag;ctx.beginPath();ctx.moveTo(c*.34,c*.16);ctx.lineTo(c*.82,c*.32);ctx.lineTo(c*.34,c*.5);ctx.closePath();ctx.fill();
  }else if(t[0]==='c'){
    ctx.fillStyle=C.belt;ctx.fillRect(0,0,c,c);
    rot(+t[1],u=>{ctx.strokeStyle=C.beltln;ctx.lineWidth=Math.max(1.5,u*.16);ctx.lineJoin='miter';for(const yy of[-.1,.5]){ctx.beginPath();ctx.moveTo(-.5*u,yy*u);ctx.lineTo(0,(yy-.45)*u);ctx.lineTo(.5*u,yy*u);ctx.stroke();}});
  }else if('XYZ'.includes(t)){
    const col={X:C.accent,Y:C.water,Z:C.flag}[t];
    ctx.fillStyle=C.wall;ctx.beginPath();ctx.arc(c/2,c/2,c*.42,0,7);ctx.fill();
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.5,c*.08);for(const r of[.34,.18]){ctx.beginPath();ctx.arc(c/2,c/2,c*r,0,7);ctx.stroke();}
  }
  if(t==='.'||t==='F'){ctx.strokeStyle=C.grid;ctx.lineWidth=1;ctx.strokeRect(.5,.5,c-1,c-1);}
  if(o==='#'){
    ctx.fillStyle=C.wall;ctx.fillRect(0,0,c,c);ctx.fillStyle=C.wallhi;ctx.fillRect(c*.12,c*.12,c*.76,c*.76);
  }else if(o==='b'){
    ctx.fillStyle=C.brick;ctx.fillRect(0,0,c,c);ctx.strokeStyle=C.brickln;ctx.lineWidth=Math.max(1,c*.05);ctx.beginPath();
    for(let k=0;k<=3;k++){ctx.moveTo(0,c*k/3);ctx.lineTo(c,c*k/3);}
    ctx.moveTo(c*.5,0);ctx.lineTo(c*.5,c/3);ctx.moveTo(c*.25,c/3);ctx.lineTo(c*.25,c*2/3);ctx.moveTo(c*.75,c/3);ctx.lineTo(c*.75,c*2/3);ctx.moveTo(c*.5,c*2/3);ctx.lineTo(c*.5,c);ctx.stroke();
  }else if(o==='B'){
    ctx.fillStyle=C.crate;ctx.fillRect(c*.08,c*.08,c*.84,c*.84);ctx.strokeStyle=C.crateln;ctx.lineWidth=Math.max(1.5,c*.07);
    ctx.strokeRect(c*.12,c*.12,c*.76,c*.76);ctx.beginPath();ctx.moveTo(c*.12,c*.12);ctx.lineTo(c*.88,c*.88);ctx.moveTo(c*.88,c*.12);ctx.lineTo(c*.12,c*.88);ctx.stroke();
  }else if(o==='G'){
    // A framed window (dark frame and cross bars) so it never reads as ice, which is a flat unframed floor.
    ctx.globalAlpha=.6;ctx.fillStyle=C.glass;ctx.fillRect(c*.1,c*.1,c*.8,c*.8);ctx.globalAlpha=1;
    ctx.strokeStyle=C.icehi;ctx.lineWidth=Math.max(1,c*.05);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(c*.2,c*.38);ctx.lineTo(c*.38,c*.2);ctx.moveTo(c*.62,c*.8);ctx.lineTo(c*.8,c*.62);ctx.stroke();
    ctx.strokeStyle=C.wall;ctx.lineCap='butt';ctx.lineWidth=Math.max(1.5,c*.06);ctx.beginPath();ctx.moveTo(c*.5,c*.1);ctx.lineTo(c*.5,c*.9);ctx.moveTo(c*.1,c*.5);ctx.lineTo(c*.9,c*.5);ctx.stroke();
    ctx.lineWidth=Math.max(2,c*.1);ctx.strokeRect(c*.1,c*.1,c*.8,c*.8);
  }else if(o&&o[0]==='M')tri(+o[1],false);
  else if(o&&o[0]==='R')tri(+o[1],true);
  else if(o&&o[0]==='A')vehicle(+o[1],C.enemy,C.enemydk);
  else if(o&&o[0]==='D'){vehicle(+o[1],C.deadat,C.wall);ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1.5,c*.08);ctx.beginPath();ctx.moveTo(c*.25,c*.25);ctx.lineTo(c*.75,c*.75);ctx.moveTo(c*.75,c*.25);ctx.lineTo(c*.25,c*.75);ctx.stroke();}
  ctx.restore();
}
function draw(){
  const s=view||S,c=cell;if(!s)return;
  ctx.clearRect(0,0,c*s.w,c*s.h);
  for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)tile(s,x,y);
  ctx.save();ctx.translate(s.tx*c,s.ty*c);
  if(s.dead){
    const wet=s.ter[s.ty*s.w+s.tx]==='~';
    ctx.strokeStyle=wet?C.waterhi:C.ink;ctx.fillStyle=wet?'transparent':C.ink;ctx.lineWidth=Math.max(1.5,c*.07);
    ctx.beginPath();ctx.arc(c/2,c/2,c*.3,0,7);wet?ctx.stroke():ctx.fill();
    if(!wet){ctx.strokeStyle=C.laser;for(let k=0;k<8;k++){const a=k*Math.PI/4;ctx.beginPath();ctx.moveTo(c/2+Math.cos(a)*c*.34,c/2+Math.sin(a)*c*.34);ctx.lineTo(c/2+Math.cos(a)*c*.46,c/2+Math.sin(a)*c*.46);ctx.stroke();}}
  }else vehicle(s.td,C.tank,C.tankdk);
  ctx.restore();
  if(bad){ctx.save();ctx.strokeStyle=C.laser;ctx.lineWidth=Math.max(2,c*.1);ctx.lineCap='round';const m=c*.25;ctx.beginPath();ctx.moveTo(bad.x*c+m,bad.y*c+m);ctx.lineTo(bad.x*c+c-m,bad.y*c+c-m);ctx.moveTo(bad.x*c+c-m,bad.y*c+m);ctx.lineTo(bad.x*c+m,bad.y*c+c-m);ctx.stroke();ctx.restore();}
  if(beam){
    const p=beam.laser.map(q=>[(q[0]+.5)*c,(q[1]+.5)*c]),n=p.length;
    if(!beam.hostile&&!beam.self&&n>1){const a=p[n-2],b=p[n-1];p[n-1]=[a[0]+(b[0]-a[0])*.5,a[1]+(b[1]-a[1])*.5];}
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();p.forEach((q,k)=>k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));
    ctx.strokeStyle=C.laser;ctx.shadowColor=C.laser;ctx.shadowBlur=c*.35;ctx.lineWidth=Math.max(2.5,c*.14);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1,c*.045);ctx.stroke();ctx.restore();
  }
}
const GROUP=20;
function showGroup(g){
  if(LEVELS.length<=GROUP)return;
  [...$('strip').children].forEach((b,k)=>{b.hidden=Math.floor(k/GROUP)!==g;});
  [...$('groups').children].forEach((b,k)=>b.setAttribute('aria-selected',k===g));
}
function hud(){
  $('lname').textContent=String(li+1).padStart(2,'0')+' / '+LEVELS[li].name;
  $('count').textContent='Moves '+moves+'  ·  Shots '+shots+'  ·  Best possible '+BEST[li][0]+' moves, '+BEST[li][1]+' shots';
  $('tip').textContent=LEVELS[li].tip;
  [...$('strip').children].forEach((b,k)=>{b.className=solved.has(LEVELS[k].name)?'done':'';b.setAttribute('aria-current',k===li);});
  [...$('groups').children].forEach((b,g)=>{const n=LEVELS.slice(g*GROUP,(g+1)*GROUP).filter(L=>solved.has(L.name)).length;b.lastChild.textContent=n?' '+n+'✓':'';});
  $('sprog').textContent='· on '+String(li+1).padStart(2,'0')+' · '+LEVELS.filter(L=>solved.has(L.name)).length+' of '+LEVELS.length+' cleared';
}
function banner(kind,title,text,btns){
  const b=$('banner');if(!kind){b.hidden=true;return;}
  b.className=kind;$('btitle').textContent=title;$('btext').textContent=text;
  const row=$('bbtns');row.textContent='';
  btns.forEach(([label,fn,pri])=>{const e=document.createElement('button');e.className='btn'+(pri?' pri':'');e.textContent=label;e.onclick=fn;row.appendChild(e);});
  b.hidden=false;
}
function go(n){gen++;playing=false;demo=false;li=(n+LEVELS.length)%LEVELS.length;S=parseLevel(LEVELS[li].rows);hist=[];moves=0;shots=0;queue=[];view=null;beam=null;banner();save();showGroup(Math.floor(li/GROUP));hud();size();}
function undo(){if(playing||!hist.length)return;const g=hist[hist.length-1].g;let h;do h=hist.pop();while(hist.length&&hist[hist.length-1].g===g); // one tap-to-drive route undoes in one go
  S=h.s;moves=h.m;shots=h.f;banner();hud();draw();}
function showSolution(){ // replays the shortest route from the start; never marks the sector solved
  go(li);demo=true;const p=[...BEST[li][2]].map(c=>'URDLF'.indexOf(c));queue=p.slice(1);doAct(p[0],true);
}
function ended(){
  if(S.won&&demo){
    banner('won','Shortest route shown',BEST[li][0]+' moves, '+BEST[li][1]+' shots. Now try it yourself.',[['Try it',()=>go(li),true],['Next sector',()=>go(li+1)]]);
  }else if(S.won){
    solved.add(LEVELS[li].name);save();hud();
    const N=LEVELS.length,all=LEVELS.every(L=>solved.has(L.name));
    let nx=(li+1)%N;if(!all)while(solved.has(LEVELS[nx].name))nx=(nx+1)%N;
    const lbl=nx===0?'Back to sector 1':nx===(li+1)%N?'Next sector':'Next: sector '+(nx+1);
    banner('won','Flag captured',moves+' moves, '+shots+' shots. The shortest route is '+BEST[li][0]+' moves, '+BEST[li][1]+' shots.'+(all?' Every sector cleared.':''),
      [[lbl,()=>go(nx),true],['Replay',()=>go(li)]]);
  }else if(S.dead){
    banner('lost','Tank destroyed',S.ter[S.ty*S.w+S.tx]==='~'?'It sank.':'Caught in a beam.',[['Undo',undo,true],['Restart',()=>go(li)]]);
  }
}
function play(frames,done){
  if(reduce||!frames.length){draw();done();return;}
  let k=0;playing=true;const g=gen;
  (function next(){
    if(g!==gen)return; // level changed mid-animation: drop the old frames
    if(k>=frames.length){playing=false;view=null;beam=null;draw();done();return;}
    const f=frames[k++];view=f.s;beam=f.laser?f:null;draw();setTimeout(next,f.laser?130:50);
  })();
}
function doAct(a,auto){
  if(!auto){queue=[];grp++;demo=false;} // taking over from a demo makes the run count again
  if(playing){if(!auto)queue=[a];return;}
  if(S.dead||S.won){queue=[];return;}
  const before=clone(S),kind=actKind(S,a),frames=[];
  if(!act(S,a,frames)){queue=[];return;}
  hist.push({s:before,m:moves,f:shots,g:grp});if(hist.length>2000)hist.shift();
  if(kind==='move')moves++;else if(kind==='shot')shots++;hud();
  play(frames,()=>{if(S.won||S.dead){queue=[];ended();}else if(queue.length)doAct(queue.shift(),true);});
}
// Shortest safe sequence of drive/turn presses that leaves the tank on (gx,gy). Simulates ice, belts, tunnels and gun lines.
function route(gx,gy){
  const t0=S.ter,k=s=>{let r=s.tx+','+s.ty+','+s.td;for(let i=0;i<s.ter.length;i++)if(s.ter[i]!==t0[i])r+='!'+i;return r;};
  let q=[[clone(S),[]]];const seen=new Set([k(S)]);
  while(q.length&&seen.size<40000){
    const nq=[];
    for(const [s,p] of q)for(let a=0;a<4;a++){
      const n=clone(s);if(!act(n,a,null)||n.dead)continue;
      const np=p.concat(a);
      if((n.tx===gx&&n.ty===gy)||(n.won&&S.ter[gy*S.w+gx]==='F'&&n.tx===gx&&n.ty===gy))return np;
      if(n.won)continue;
      const kk=k(n);if(seen.has(kk))continue;seen.add(kk);nq.push([n,np]);
    }
    q=nq;
  }
  return null;
}
// Turn (if needed) and fire so the beam hits the object on (gx,gy), mirror bounces included. Tries the facing first, then clockwise.
// Skips shots that change nothing or destroy the tank. Returns the presses, or null.
function aim(gx,gy){
  if(!S.obj[gy*S.w+gx])return null;
  for(let k=0;k<4;k++){
    const d=(S.td+k)%4,n=clone(S),F=[];
    if(k)act(n,d,null);
    act(n,4,F);
    if(n.dead)continue;
    const pts=F.find(f=>f.laser).laser;
    if(!pts.some(q=>q[0]===gx&&q[1]===gy))continue;
    if(n.obj.join()===S.obj.join()&&n.ter.join()===S.ter.join()&&n.tx===S.tx&&n.ty===S.ty)continue;
    return k?[d,4]:[4];
  }
  return null;
}
function tapBoard(e){
  if(!S||S.dead||S.won)return;
  const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/cell),y=Math.floor((e.clientY-r.top)/cell);
  if(x<0||y<0||x>=S.w||y>=S.h)return;
  if(x===S.tx&&y===S.ty){doAct(4);return;}
  const p=route(x,y)||aim(x,y);
  if(!p){bad={x,y};draw();setTimeout(()=>{bad=null;draw();},450);return;}
  grp++;demo=false;
  if(playing){queue=p;return;}
  queue=p.slice(1);doAct(p[0],true);
}
function hold(el,a){
  let t=null;const stop=()=>{clearTimeout(t);t=null;};
  el.addEventListener('pointerdown',e=>{e.preventDefault();doAct(a);const rep=()=>{doAct(a);t=setTimeout(rep,150);};stop();t=setTimeout(rep,340);});
  ['pointerup','pointerleave','pointercancel'].forEach(n=>el.addEventListener(n,stop));
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)doAct(a);}});
}
function start(data){
  load();if(data&&data.li>=0&&data.li<LEVELS.length)li=data.li;
  LEVELS.forEach((L,k)=>{const b=document.createElement('button');b.textContent=String(k+1).padStart(2,'0');b.title=L.name;b.onclick=()=>{go(k);b.blur();$('sectors').open=false;};$('strip').appendChild(b);});
  // Sector groups: the strip shows GROUP sectors at a time once there are more than that, with a tab per group.
  if(LEVELS.length>GROUP){$('groups').hidden=false;
    for(let g=0;g*GROUP<LEVELS.length;g++){const b=document.createElement('button'),hi=Math.min((g+1)*GROUP,LEVELS.length);
      b.setAttribute('role','tab');b.append(String(g*GROUP+1).padStart(2,'0')+'–'+String(hi).padStart(2,'0'),Object.assign(document.createElement('span'),{className:'c'}));
      b.onclick=()=>showGroup(g);$('groups').appendChild(b);}}
  $('sectors').addEventListener('toggle',()=>{if($('sectors').open)showGroup(Math.floor(li/GROUP));});
  for(let d=0;d<4;d++)hold($('k'+d),d);hold($('fire'),4);
  cv.addEventListener('pointerdown',e=>{e.preventDefault();tapBoard(e);});
  $('undo').onclick=undo;$('show').onclick=showSolution;$('reset').onclick=()=>{if(!playing)go(li);};
  const KEYS={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,w:0,d:1,s:2,a:3,' ':4};
  addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(k in KEYS){e.preventDefault();doAct(KEYS[k]);}
    else if(k==='u'||k==='z'||k==='Backspace'){e.preventDefault();undo();}
    else if(k==='r'){if(!playing)go(li);}
  });
  addEventListener('resize',size);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{colors();draw();});
  new MutationObserver(()=>{colors();draw();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  colors();$('nsec').textContent=LEVELS.length;go(li);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
  try{window.claude?.hot?.snapshot?.(()=>({li}));}catch(e){}
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.ready)hot.ready(start);else start((hot&&hot.data)||{});
})();

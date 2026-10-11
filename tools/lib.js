// Loads the browser engine (src/engine.js) and levels (src/levels.js) into Node, plus a BFS solver.
const fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'..','src');
const code=fs.readFileSync(path.join(SRC,'engine.js'),'utf8')+'\n'+fs.readFileSync(path.join(SRC,'levels.js'),'utf8')+
  ';module.exports={parseLevel,clone,act,actKind,checkAT,DX,DY,LEVELS};';
const m={exports:{}};new Function('module',code)(m);
const E=m.exports;
// State key: tank pose + every movable object + every terrain cell that changed (bridges, melted ice).
function key(s,t0){let k=s.tx+','+s.ty+','+s.td+'|';for(let i=0;i<s.obj.length;i++){const o=s.obj[i];if(o&&o!=='#'&&o!=='G')k+=i+o;if(s.ter[i]!==t0[i])k+='!'+i+s.ter[i];}return k;}
// Breadth-first search over actions U R D L F. Returns {par,path,states} | {none} | {capped}.
function solve(rows,cap=3e6){
  const s0=E.parseLevel(rows),t0=s0.ter;let q=[[s0,'']],seen=new Set([key(s0,t0)]),depth=0;
  while(q.length){
    if(seen.size>cap)return {capped:true,states:seen.size};
    const nq=[];depth++;
    for(const [s,p] of q)for(let a=0;a<5;a++){
      const n=E.clone(s);if(!E.act(n,a,null)||n.dead)continue;
      if(n.won)return {par:depth,path:p+'URDLF'[a],states:seen.size};
      const k=key(n,t0);if(seen.has(k))continue;seen.add(k);nq.push([n,p+'URDLF'[a]]);
    }
    q=nq;
  }
  return {none:true,states:seen.size};
}
module.exports={E,solve,key,LEVELS:E.LEVELS};

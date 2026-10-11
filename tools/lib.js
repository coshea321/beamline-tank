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
// Cheapest route by what the player is scored on: squares driven first, then shots fired; turns are free.
// Dijkstra with cost = moves*K + shots, so zero-cost turns are expanded within their own cost bucket.
const K=1e4;
function solveBest(rows,cap=3e6){
  const s0=E.parseLevel(rows),t0=s0.ter,dist=new Map([[key(s0,t0),0]]),done=new Set(),buckets=new Map([[0,[s0]]]);
  let c=0,maxc=0;
  while(c<=maxc){
    const b=buckets.get(c);
    if(!b||!b.length){buckets.delete(c);c++;continue;}
    const s=b.pop(),k=key(s,t0);
    if(dist.get(k)!==c||done.has(k))continue;
    if(s.won)return {moves:Math.floor(c/K),shots:c%K};
    done.add(k);
    if(done.size>cap)return {capped:true};
    for(let a=0;a<5;a++){
      const kind=E.actKind(s,a),n=E.clone(s);
      if(!E.act(n,a,null)||n.dead)continue;
      const nc=c+(kind==='move'?K:kind==='shot'?1:0),nk=key(n,t0);
      if(dist.has(nk)&&dist.get(nk)<=nc)continue;
      dist.set(nk,nc);if(!buckets.has(nc))buckets.set(nc,[]);buckets.get(nc).push(n);if(nc>maxc)maxc=nc;
    }
  }
  return {none:true};
}
module.exports={E,solve,solveBest,key,LEVELS:E.LEVELS};

const DX=[0,1,0,-1],DY=[-1,0,1,0];
function parseLevel(rows){
  const h=rows.length,w=rows[0].length,ter=new Array(w*h).fill('.'),obj=new Array(w*h).fill('');
  let tx=0,ty=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const c=rows[y][x],i=y*w+x;
    if('#bBG'.includes(c))obj[i]=c;
    else if('1234'.includes(c))obj[i]='M'+(+c-1);
    else if('5678'.includes(c))obj[i]='R'+(+c-5);
    else if('^>v<'.includes(c))obj[i]='A'+'^>v<'.indexOf(c);
    else if('urdl'.includes(c))ter[i]='c'+'urdl'.indexOf(c);
    else if('~itFXYZ'.includes(c))ter[i]=c;
    else if(c==='T'){tx=x;ty=y;}
  }
  return {w,h,ter,obj,tx,ty,td:0,dead:false,won:false};
}
function clone(s){return {w:s.w,h:s.h,ter:s.ter.slice(),obj:s.obj.slice(),tx:s.tx,ty:s.ty,td:s.td,dead:s.dead,won:s.won};}
function inb(s,x,y){return x>=0&&y>=0&&x<s.w&&y<s.h;}
function isTunnel(t){return t==='X'||t==='Y'||t==='Z';}
function partner(s,i){for(let j=0;j<s.ter.length;j++)if(j!==i&&s.ter[j]===s.ter[i])return j;return -1;}
function snap(s,F,extra){if(F)F.push(Object.assign({s:clone(s)},extra||{}));}

function pushObj(s,x,y,d,F){
  const o=s.obj[y*s.w+x];let moved=false;
  for(let n=0;n<80;n++){
    const nx=x+DX[d],ny=y+DY[d];
    if(!inb(s,nx,ny))break;
    const ni=ny*s.w+nx,t=s.ter[ni];
    if(s.obj[ni]||(nx===s.tx&&ny===s.ty)||t==='F')break;
    s.obj[y*s.w+x]='';moved=true;
    if(t==='~'){if(o==='B')s.ter[ni]='=';snap(s,F);return true;}
    if(isTunnel(t)){
      const p=partner(s,ni);
      if(p>=0&&!s.obj[p]&&p!==s.ty*s.w+s.tx){s.obj[p]=o;snap(s,F);return true;}
    }
    s.obj[ni]=o;x=nx;y=ny;snap(s,F);
    if(t!=='i'&&t!=='t')break;
  }
  return moved;
}
function checkAT(s,F){
  if(s.dead||s.won)return;
  for(let d=0;d<4;d++){
    let x=s.tx+DX[d],y=s.ty+DY[d];
    while(inb(s,x,y)){
      const o=s.obj[y*s.w+x];
      if(o==='A'+((d+2)%4)){s.dead=true;snap(s,F,{laser:[[x,y],[s.tx,s.ty]],hostile:true});snap(s,F);return;}
      if(o&&o!=='G')break;
      x+=DX[d];y+=DY[d];
    }
  }
}
function stepTank(s,d,F){
  const nx=s.tx+DX[d],ny=s.ty+DY[d];
  if(!inb(s,nx,ny))return false;
  const ni=ny*s.w+nx;
  if(s.obj[ni])return false;
  const oi=s.ty*s.w+s.tx;
  if(s.ter[oi]==='t')s.ter[oi]='~';
  s.tx=nx;s.ty=ny;
  const t=s.ter[ni];
  if(isTunnel(t)){const p=partner(s,ni);if(p>=0&&!s.obj[p]){snap(s,F);s.tx=p%s.w;s.ty=(p/s.w)|0;}}
  if(t==='~')s.dead=true;
  if(t==='F')s.won=true;
  snap(s,F);
  checkAT(s,F);
  return true;
}
function settle(s,d,F){
  let guard=0;
  while(!s.dead&&!s.won&&guard++<200){
    const t=s.ter[s.ty*s.w+s.tx];
    if((t==='i'||t==='t')&&d>=0){if(!stepTank(s,d,F))break;continue;}
    if(t[0]==='c'){d=+t[1];if(!stepTank(s,d,F))break;continue;}
    break;
  }
}
function fire(s,F){
  let x=s.tx,y=s.ty,d=s.td,hit=null;const pts=[[x,y]];
  for(let n=0;n<800;n++){
    x+=DX[d];y+=DY[d];pts.push([x,y]);
    if(!inb(s,x,y))break;
    if(x===s.tx&&y===s.ty){hit='self';break;}
    const o=s.obj[y*s.w+x];
    if(!o||o==='G')continue;
    if(o[0]==='M'||o[0]==='R'){
      const k=+o[1],from=(d+2)%4;
      if(from===k){d=(k+1)%4;continue;}
      if(from===(k+1)%4){d=k;continue;}
    }
    hit=o;break;
  }
  snap(s,F,{laser:pts,self:hit==='self'});
  if(hit==='self'){s.dead=true;snap(s,F);return;}
  if(hit){
    const i=y*s.w+x,c=hit[0],k=+hit[1];
    if(c==='b')s.obj[i]='';
    else if(c==='R')s.obj[i]='R'+((k+1)%4);
    else if(c==='A'&&d===(k+2)%4)s.obj[i]='D'+k;
    else if(c!=='#')pushObj(s,x,y,d,F);
  }
  snap(s,F);
}
// actions: 0-3 = up/right/down/left, 4 = fire. Returns false if nothing happened.
// What action a will be, judged before act(): 'shot', 'turn' (tank faces another way) or 'move' (tank tries to drive).
function actKind(s,a){return a===4?'shot':s.td!==a?'turn':'move';}
function act(s,a,F){
  if(s.dead||s.won)return false;
  if(a===4){fire(s,F);checkAT(s,F);settle(s,-1,F);return true;}
  if(s.td!==a){s.td=a;snap(s,F);return true;}
  if(!stepTank(s,a,F))return false;
  settle(s,a,F);return true;
}

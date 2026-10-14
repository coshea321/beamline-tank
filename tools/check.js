// Smoke test of the built PWA: serves docs/, loads it in headless Chromium, checks for script errors,
// service-worker registration, an offline reload, tap-to-drive, tap-to-shoot, the sideways-phone layout, the collapsible sector strip and its groups, and switching level mid-animation. Needs: npm i -D playwright (or a Chromium on PATH).
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..','docs');
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(8099);
(async()=>{
  const exe=process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
  const b=await chromium.launch(exe?{executablePath:exe}:{});const ctx=await b.newContext({viewport:{width:400,height:860}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8099/');await p.waitForFunction(()=>navigator.serviceWorker.controller||new Promise(r=>navigator.serviceWorker.ready.then(()=>r(true))));
  const sw=await p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()));
  await p.reload();await ctx.setOffline(true);await p.reload();const offline=await p.locator('#lname').textContent();await ctx.setOffline(false);
  // The sector strip is collapsed by default, opens from its summary and closes again after a pick.
  const shut=await p.locator('#strip button').first().isHidden();
  await p.click('#sectors summary');await p.click('#strip button:nth-child(1)');const reshut=!(await p.evaluate(()=>document.getElementById('sectors').open));
  const box=await p.locator('#cv').boundingBox();const c=box.width/12;
  await p.mouse.click(box.x+c*4.5,box.y+c*1.5);await p.waitForTimeout(800);
  const moves=await p.locator('#count').textContent();
  // Tap-to-shoot: drive beside the brick (arriving face down), then tap the brick itself: the turn is free and the shot adds 1 to Shots.
  await p.mouse.click(box.x+c*4.5,box.y+c*3.5);await p.waitForTimeout(800);
  const n0=(await p.locator('#count').textContent()).match(/Moves (\d+)\D+Shots (\d+)/).slice(1).map(Number);
  await p.mouse.click(box.x+c*5.5,box.y+c*3.5);await p.waitForTimeout(1200);
  const n1=(await p.locator('#count').textContent()).match(/Moves (\d+)\D+Shots (\d+)/).slice(1).map(Number);
  // Then the brick's square is open: tapping it again drives one step onto it.
  await p.mouse.click(box.x+c*5.5,box.y+c*3.5);await p.waitForTimeout(800);
  const n2=(await p.locator('#count').textContent()).match(/Moves (\d+)\D+Shots (\d+)/).slice(1).map(Number);
  const shot=n1[0]-n0[0]===0&&n1[1]-n0[1]===1&&n2[0]-n1[0]===1&&n2[1]===n1[1];
  // Switching level mid-animation: no frame of the old level may be drawn after the switch.
  await p.click('#sectors summary');await p.click('#strip button:nth-child(1)');await p.waitForTimeout(200);
  const frames=await p.evaluate(()=>new Promise(r=>{const cv=document.getElementById('cv'),out=[];
    dispatchEvent(new KeyboardEvent('keydown',{key:' '}));document.querySelector('#strip button:nth-child(2)').click();
    const t=setInterval(()=>{out.push(cv.toDataURL());if(out.length>=40){clearInterval(t);r(out);}},15);}));
  const stale=frames.filter(f=>f!==frames[frames.length-1]).length;
  // Sector groups: the second group tab shows sectors 21 onward, and picking one opens that sector and its group next time.
  await p.click('#sectors summary');await p.click('#groups button:nth-child(2)');
  const firstShown=await p.locator('#strip button:visible').first().textContent();
  await p.locator('#strip button:visible').first().click();const picked=await p.locator('#lname').textContent();
  await p.click('#sectors summary');const reopened=await p.locator('#strip button:visible').first().textContent();await p.click('#sectors summary');
  const groups=firstShown==='21'&&picked.startsWith('21 /')&&reopened==='21';
  // Show solution: asks first (Show it / Cancel), then plays the shortest route from the start and ends on the "Shortest route shown" banner without marking the sector solved.
  await p.click('#show');
  const asked=await p.locator('#bbtns button',{hasText:'Show it'}).isVisible();
  await p.click('#bbtns button:has-text("Show it")');
  const shown=asked&&await p.waitForFunction(()=>/shortest route shown/i.test(document.body.innerText),null,{timeout:180000}).then(()=>true,()=>false);
  // Phone turned sideways: only the board, controls and level name show, all inside the screen without scrolling.
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);
  const land=await p.evaluate(()=>{const v=id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;};
    const hid=!!document.getElementById('lname').offsetParent&&['count','tip','sectors'].every(id=>!document.getElementById(id).offsetParent)&&!document.querySelector('header').offsetParent;
    return hid&&['cv','k0','k2','fire','undo','show'].every(v)&&document.documentElement.scrollHeight<=innerHeight&&document.getElementById('cv').getBoundingClientRect().height>250;});
  console.log({errors:errs,landscape:land,showSolution:shown,sectorsCollapse:shut&&reshut,serviceWorker:sw,offlineTitle:offline,afterTap:moves,tapToShoot:shot,sectorGroups:groups,staleFramesAfterSwitch:stale});
  await b.close();srv.close();process.exit(errs.length||!shut||!reshut||!sw||!/Moves [1-9]/.test(moves)||!shot||!groups||!shown||!land||stale?1:0);
})();

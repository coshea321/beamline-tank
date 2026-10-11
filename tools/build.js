// Builds two outputs from src/:
//   docs/index.html (+ manifest, service worker, icons)  -> installable PWA, served by GitHub Pages from /docs
//   build/artifact.html                                 -> the claude.ai artifact version (no <html>/<head>, no service worker)
// It also solves every level and bakes the shortest move counts in as PAR. Fails if a level is unsolvable.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=(...p)=>path.join(__dirname,'..',...p),read=f=>fs.readFileSync(R(f),'utf8');
const {par,best,bad}=require('./solve.js')(null,true);
if(bad){console.error('A level is unsolvable or ragged. Run: npm run solve');process.exit(1);}
// The version shown in the header comes from package.json: bump it in every PR that players will notice.
const APPVERSION=JSON.parse(read('package.json')).version;
const shell=read('src/shell.html').replace('__APPVERSION__',APPVERSION),cut=shell.indexOf('<main');
const headPart=shell.slice(0,cut),bodyPart=shell.slice(cut);
const script=read('src/engine.js')+read('src/levels.js')+'const PAR='+JSON.stringify(par)+';const BEST='+JSON.stringify(best)+';\n'+read('src/ui.js');
fs.mkdirSync(R('build'),{recursive:true});
fs.writeFileSync(R('build/artifact.html'),shell+script+'</script>\n');
const pwa=`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#d8d5c0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151912" media="(prefers-color-scheme: dark)">
<meta name="description" content="A LaserTank-style puzzle game.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Beamline">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}[hidden]{display:none!important}html{-webkit-text-size-adjust:100%}</style>
${headPart}</head>
<body>
${bodyPart}${script}
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
</body></html>
`;
fs.mkdirSync(R('docs/icons'),{recursive:true});
fs.writeFileSync(R('docs/index.html'),pwa);
for(const f of fs.readdirSync(R('pwa/icons')))fs.copyFileSync(R('pwa/icons',f),R('docs/icons',f));
fs.copyFileSync(R('pwa/manifest.webmanifest'),R('docs/manifest.webmanifest'));
const ver=crypto.createHash('sha1').update(pwa+read('pwa/manifest.webmanifest')).digest('hex').slice(0,10);
fs.writeFileSync(R('docs/sw.js'),read('pwa/sw.js').replace('__VERSION__',ver));
fs.writeFileSync(R('docs/.nojekyll'),'');
console.log('Built v'+APPVERSION+': docs/ (PWA, cache '+ver+') and build/artifact.html. PAR:',par.join(' '));

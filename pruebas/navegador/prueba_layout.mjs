const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const SP = process.env.CAPTURAS_DIR || '/tmp/capturas_turborace'; (await import('fs')).mkdirSync(SP, { recursive: true });
const parchear = async route => {
  const url = route.request().url();
  if (url.startsWith('https://')) { await route.abort(); return; }
  try {
    const res = await route.fetch();
    const ct = res.headers()['content-type'] ?? '';
    if (!ct.includes('text/html')) { await route.fulfill({ response: res }); return; }
    let body = await res.text();
    body = body.replace('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js','/node_modules/three/build/three.module.min.js')
               .replace('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/','/node_modules/three/examples/jsm/');
    await route.fulfill({ response: res, body });
  } catch { await route.abort(); }
};
let ok=0, fallos=0;
const check=(c,m)=>{ if(c){ok++;console.log('OK  ',m);} else {fallos++;console.log('FALLO',m);} };
const browser = await chromium.launch({ headless:false, args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const casos = [
  { nombre:'timon_390', vp:{width:390,height:844}, movil:true, control:'timon' },
  { nombre:'timon_1280', vp:{width:1280,height:960}, movil:false, control:'timon' },
  { nombre:'teclado_1280', vp:{width:1280,height:960}, movil:false, control:'teclado' },
];
for (const c of casos) {
  const ctx = await browser.newContext({ viewport:c.vp, hasTouch:c.movil, isMobile:c.movil });
  await ctx.addInitScript(t => localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara:'chase', alturaCamara:2.8, tipoControl:t })), c.control);
  const page = await ctx.newPage();
  const errores=[]; page.on('pageerror', e=>{ if(!/ServiceWorker/.test(e.message)) errores.push(e.message); });
  await page.route('**', parchear);
  await page.goto('http://localhost:8099/', { waitUntil:'load' });
  await page.waitForTimeout(2500);
  await page.click('#btn-solo');
  await page.waitForTimeout(6000);
  const m = await page.evaluate(() => {
    const r = id => { const e=document.getElementById(id); if(!e) return null; const b=e.getBoundingClientRect(); const vis=getComputedStyle(e).display!=='none' && b.width>0; return vis?{x:b.left,y:b.top,r:b.right,b:b.bottom}:null; };
    const ancho=Math.min(innerWidth,480), izq=(innerWidth-ancho)/2;
    const v={x:izq+ancho-56-48, y:innerHeight-176-48, r:izq+ancho-56+48, b:innerHeight-176+48};
    return { H:innerHeight, W:innerWidth, izq, der:izq+ancho, vel:v,
      elems:{ 'canvas-timon':r('canvas-timon'), 'btn-acelerar':r('btn-acelerar'), 'btn-freno':r('btn-freno'),
              'btn-izq':r('btn-izq'), 'btn-der':r('btn-der'), 'btn-gas':r('btn-gas'), 'btn-rev':r('btn-rev') } };
  });
  const solapa=(a,b)=>a.x<b.r&&b.x<a.r&&a.y<b.b&&b.y<a.b;
  console.log('--', c.nombre, JSON.stringify(m.elems));
  const visibles = Object.entries(m.elems).filter(([,b])=>b);
  check(visibles.length>=3, c.nombre+': controles visibles '+visibles.map(v=>v[0]).join(','));
  for (const [id,b] of visibles) {
    check(b.b<=m.H+0.5 && b.y>=0, c.nombre+': '+id+' sin cortar ('+b.y.toFixed(0)+'..'+b.b.toFixed(0)+' de '+m.H+')');
    check(b.x>=m.izq-0.5 && b.r<=m.der+0.5, c.nombre+': '+id+' dentro de la columna');
    check(!solapa(b,m.vel), c.nombre+': '+id+' no solapa velocímetro');
  }
  await page.screenshot({ path: SP+'/layout_'+c.nombre+'.png' });
  // Panel de resultado sobre un overlay visible (RF-27)
  await page.evaluate(() => {
    const o = window.CarreraVueltas.prototype.actualizar;
    window.CarreraVueltas.prototype.actualizar = function(...a){ o.apply(this,a); return 'meta'; };
  });
  await page.waitForTimeout(800);
  const z = await page.evaluate(() => {
    for (const id of ['ctrl-timon','ctrl-botones']) document.getElementById(id).style.display='flex';
    const p=document.getElementById('resultado-carrera-solo'); const b=p.getBoundingClientRect();
    const pts=[[b.left+60, innerHeight-60],[b.right-60, innerHeight-60],[b.left+b.width/2, b.top+b.height/2]];
    const res=pts.map(([x,y])=>{ const e=document.elementFromPoint(x,y); return !!e && (e===p||p.contains(e)); });
    for (const id of ['ctrl-timon','ctrl-botones']) document.getElementById(id).style.display='none';
    return { visible:getComputedStyle(p).display, res };
  });
  check(z.visible==='flex' && z.res.every(Boolean), c.nombre+': panel resultado por encima de overlays '+JSON.stringify(z));
  await page.screenshot({ path: SP+'/layout_'+c.nombre+'_resultado.png' });
  await page.click('#btn-menu-solo');
  await page.waitForTimeout(500);
  const fin = await page.evaluate(()=>({ act:document.querySelector('.pantalla.activa')?.id, cls:document.getElementById('pantalla-carrera-solo').className }));
  check(fin.act==='pantalla-inicio' && !/con-resultado/.test(fin.cls), c.nombre+': menú limpia con-resultado '+JSON.stringify(fin));
  check(errores.length===0, c.nombre+': sin pageerror '+errores.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(`OK ${ok}, fallos ${fallos}`);
process.exitCode = fallos ? 1 : 0;

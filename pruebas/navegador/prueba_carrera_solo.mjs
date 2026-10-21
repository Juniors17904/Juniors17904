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
const ctx = await browser.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
const page = await ctx.newPage();
const errores=[];
page.on('pageerror', e=>errores.push('pageerror: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errores.push('console: '+m.text()); });
await page.route('**', parchear);
await page.goto('http://localhost:8099/', { waitUntil:'load' });
await page.waitForTimeout(2500);
// Espiar CarreraVueltas.actualizar
await page.evaluate(()=>{
  const orig = window.CarreraVueltas.prototype.actualizar;
  window.__llamadas=0; window.__pos=[];
  window.CarreraVueltas.prototype.actualizar = function(px,pz,pasos){
    window.__llamadas++; window.__pos.push([px,pz,pasos]);
    const ev = orig.call(this,px,pz,pasos);
    if (window.__forzarMeta) { window.__forzarMeta=false; return 'meta'; }
    return ev;
  };
});
const activa = () => page.evaluate(()=>document.querySelector('.pantalla.activa')?.id);
const cuenta = () => page.evaluate(()=>{const c=document.getElementById('cuenta-carrera-solo');return c.style.display==='none'?'':c.textContent;});
await page.evaluate(()=>{ window.__linea=[]; const c=document.getElementById('cuenta-carrera-solo'); const t0=performance.now();
  new MutationObserver(()=>{ const v=c.style.display==='none'?'':c.textContent; const u=window.__linea[window.__linea.length-1];
    if(!u||u[0]!==v) window.__linea.push([v, Math.round(performance.now()-t0)]); }).observe(c,{childList:true,attributes:true,characterData:true,subtree:true}); });
await page.evaluate(()=>document.getElementById('btn-solo').click());
check(await activa()==='pantalla-carrera-solo','pantalla activa carrera-solo');
check(await page.evaluate(()=>getComputedStyle(document.getElementById('pantalla-rotar')).display)==='none','sin pantalla-rotar');
check(await page.evaluate(()=>getComputedStyle(document.getElementById('ctrl-timon')).display)!=='none','timón visible');
const t = await page.evaluate(()=>{const cs=getComputedStyle(document.getElementById('ctrl-timon'));return cs.transform+' '+cs.width;});
console.log('   ctrl-timon en carrera:', t);
check(await page.evaluate(()=>window.__llamadas)===0,'modelo no se actualiza durante la cuenta');
await page.waitForFunction(()=>window.__linea.some(x=>x[0]==='¡YA!'),null,{timeout:12000});
const linea = await page.evaluate(()=>window.__linea);
console.log('   línea de la cuenta:', JSON.stringify(linea));
const idx = k=>linea.find(x=>x[0]===k)?.[1];
check(idx('3')!==undefined && idx('2')-idx('3')>=850 && idx('1')-idx('2')>=850 && idx('¡YA!')-idx('1')>=850,'3-2-1-¡YA! cada ~900 ms');
// acelerar
const b = await page.$('#btn-acelerar'); const bb = await b.boundingBox();
await page.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2); await page.mouse.down();
await page.dispatchEvent('#btn-acelerar','touchstart').catch(()=>{});
await page.waitForTimeout(1000);
check(await cuenta()==='','¡YA! desaparece');
await page.waitForTimeout(1500);
await page.screenshot({ path: SP+'/carrera_solo_390.png' });
const pos = await page.evaluate(()=>[window.__llamadas, window.__pos[0], window.__pos[window.__pos.length-1]]);
console.log('   llamadas/pos:', JSON.stringify(pos));
check(pos[0]>10,'modelo se actualiza corriendo');
check(Math.hypot(pos[2][0]-pos[1][0],pos[2][1]-pos[1][1])>0.5,'el carro avanza con ACEL');
await page.mouse.up();
// Forzar meta
await page.evaluate(()=>window.__forzarMeta=true); await page.waitForTimeout(400);
check(await page.evaluate(()=>getComputedStyle(document.getElementById('resultado-carrera-solo')).display)==='flex','panel resultado visible');
check(await page.evaluate(()=>getComputedStyle(document.getElementById('ctrl-timon')).display)==='none','timón oculto en resultado');
console.log('   texto resultado:', await page.evaluate(()=>document.getElementById('resultado-carrera-solo').innerText.replace(/\n/g,' | ')));
await page.screenshot({ path: SP+'/resultado_390.png' });
const canvases0 = await page.evaluate(()=>document.querySelectorAll('canvas').length);
// Revancha x2
for (let i=0;i<2;i++){
  await page.click('#btn-revancha-solo'); await page.waitForTimeout(200);
  check(await cuenta()==='3','revancha: cuenta 3');
  check(await page.evaluate(()=>getComputedStyle(document.getElementById('ctrl-timon')).display)!=='none','revancha: timón visible');
  await page.waitForTimeout(2900);
  await page.evaluate(()=>window.__forzarMeta=true); await page.waitForTimeout(400);
}
check(await page.evaluate(()=>document.querySelectorAll('canvas').length)===canvases0,'revancha no crea canvas');
// Menú
await page.click('#btn-menu-solo'); await page.waitForTimeout(300);
check(await activa()==='pantalla-inicio','menú → inicio');
const est = await page.evaluate(()=>{const cs=getComputedStyle(document.getElementById('ctrl-timon'));return [cs.display,cs.left,cs.transform];});
check(est[0]==='none' && est[1]==='0px' && est[2]==='none','ctrl-timon oculto y con estilo original '+est.join(','));
// adelante / atrás
await page.goBack(); await page.waitForTimeout(400);
console.log('   tras atrás:', await activa());
await page.goForward(); await page.waitForTimeout(400);
check(await activa()!=='pantalla-carrera-solo','adelante no deja pantalla vacía: '+await activa());
// Atrás a mitad de carrera
const n0 = await page.evaluate(()=>window.__llamadas);
await page.evaluate(()=>{ history.pushState({pantalla:'pantalla-inicio'},''); });
await page.click('#btn-solo');
await page.waitForFunction(()=>document.getElementById('cuenta-carrera-solo').textContent==='¡YA!',null,{timeout:10000});
check(true,'segunda entrada llega a ¡YA!');
await page.waitForTimeout(1500);
check(await page.evaluate(()=>window.__llamadas)>n0,'segunda entrada actualiza el modelo');
await page.goBack(); await page.waitForTimeout(500);
check(await activa()!=='pantalla-carrera-solo','atrás a mitad de carrera sale: '+await activa());
check(await page.evaluate(()=>getComputedStyle(document.getElementById('ctrl-timon')).display)==='none','timón oculto tras atrás');
const n1 = await page.evaluate(()=>window.__llamadas); await page.waitForTimeout(500);
check(await page.evaluate(()=>window.__llamadas)===n1,'sin frames tras salir');
// Clásico 2D
await page.evaluate(()=>document.getElementById('btn-garage').click()); await page.waitForTimeout(300);
await page.evaluate(()=>document.getElementById('btn-clasico-2d').click()); await page.waitForTimeout(300);
console.log('   clásico 2D →', await activa());
check(['pantalla-espera','pantalla-rotar'].includes(await activa()) || await page.evaluate(()=>getComputedStyle(document.getElementById('pantalla-espera')).display!=='none'),'clásico 2D abre pantalla-espera');
console.log('__modelErrors:', JSON.stringify(await page.evaluate(()=>window.__modelErrors)));
console.log('errores:', errores.join('\n'));
console.log(`OK ${ok}, fallos ${fallos}`);
await browser.close();
process.exitCode = fallos ? 1 : 0;

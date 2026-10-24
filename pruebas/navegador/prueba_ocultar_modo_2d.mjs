// ================================================================
// Prueba en navegador real del PRD 002 — Ocultar el modo 2D,
// ajustada por el PRD 005 — Archivar el motor 2D (D8).
// Lo 2D ya no se oculta: se borró. Esta prueba comprueba que no
// existe (PRD 005 RF-02, RF-08), que Multijugador y Únete siguen
// con "Próximamente" (RF-07) y que atrás, adelante o un enlace a
// una pantalla que no existe llevan a Inicio (RF-03). Conserva toda
// la cobertura del 3D. Los errores de consola cuentan como fallo.
// ================================================================
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const SP = process.env.CAPTURAS_DIR || '/tmp/capturas_turborace'; (await import('fs')).mkdirSync(SP, { recursive: true });
const URL_JUEGO = 'http://localhost:8099/';
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

// ── Utilidades sobre una página ────────────────────────────────
const activa = page => page.evaluate(()=>document.querySelector('.pantalla.activa')?.id);
const existe = (page, id) => page.evaluate(i=>!!document.getElementById(i), id);
const visible = (page, id) => page.evaluate(i=>{ const b=document.getElementById(i);
  if(!b || b.hidden) return false; const cs=getComputedStyle(b); const r=b.getBoundingClientRect();
  return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0; }, id);
const clic = (page, id) => page.evaluate(i=>document.getElementById(i).click(), id);
const esperar = (page, ms) => page.waitForTimeout(ms);
const irAInicio = async page => {
  for (let i=0;i<6 && await activa(page)!=='pantalla-inicio';i++){ await page.goBack().catch(()=>{}); await esperar(page,300); }
};
const irAAjustes = async page => {
  if (await activa(page)!=='pantalla-ajustes') { await irAInicio(page); await clic(page,'btn-garage'); await esperar(page,300); }
};

async function abrir(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch:true, isMobile:true });
  const page = await ctx.newPage();
  const errores=[];
  page.on('pageerror', e=>errores.push('pageerror: '+e.message));
  page.on('console', m=>{ if(m.type()==='error') errores.push('console: '+m.text()); });
  await page.route('**', parchear);
  await page.goto(URL_JUEGO, { waitUntil:'load' });
  await page.waitForTimeout(2500);
  await page.waitForFunction(()=>window.VisorTestdriveRecto && window.VisorTestdriveRuta, null, { timeout:15000 }).catch(()=>{});
  return { ctx, page, errores };
}

async function revisarInicio(page, etiqueta) {
  check(await activa(page)==='pantalla-inicio', `PRD 002 RF-11 ${etiqueta}: arranca en pantalla-inicio`);
  const fuera = await page.evaluate(()=>{
    const W=innerWidth, H=innerHeight, malos=[];
    for (const b of document.querySelectorAll('#pantalla-inicio button')) {
      if (b.hidden || getComputedStyle(b).display==='none') continue;
      const r=b.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (r.left<-1 || r.top<-1 || r.right>W+1 || r.bottom>H+1) malos.push(`${b.id||b.textContent.trim()} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
    }
    return malos;
  });
  check(fuera.length===0, `PRD 002 RNF-03 ${etiqueta}: botones de Inicio dentro de la pantalla ${fuera.join(' | ')}`);
  for (const id of ['btn-solo','btn-crear','btn-unirse','btn-garage'])
    check(await visible(page,id), `PRD 002 RNF-03 ${etiqueta}: ${id} visible en Inicio`);
  await page.screenshot({ path: `${SP}/prd002_inicio_${etiqueta}.png` });
}

async function revisarAjustes(page, etiqueta) {
  await irAAjustes(page);
  check(await activa(page)==='pantalla-ajustes', `PRD 002 RF-01 ${etiqueta}: ⚙ abre ajustes`);
  check(!(await existe(page,'btn-clasico-2d')), `PRD 005 RF-02 RF-08 ${etiqueta}: "Clásico 2D" no existe en el DOM`);
  check(!(await existe(page,'btn-test-drive')), `PRD 005 RF-02 RF-08 ${etiqueta}: "Test Drive" (2D) no existe en el DOM`);
  for (const id of ['btn-ir-garage','btn-ir-giro','btn-ir-pista','btn-test-drive-3d','btn-ir-controles',
                    'btn-ir-velocimetro','btn-ir-vista-conduccion','btn-ir-diseno-general','btn-ir-diseno-objetos'])
    check(await visible(page,id), `PRD 002 RF-02 ${etiqueta}: ${id} visible en ⚙`);
  await page.screenshot({ path: `${SP}/prd002_ajustes_${etiqueta}.png` });
}

async function entrarTestDrive3D(page, boton, salida, lienzo, etiqueta) {
  await irAAjustes(page);
  await clic(page,'btn-test-drive-3d'); await esperar(page,300);
  check(await activa(page)==='pantalla-td3d-selector', `PRD 002 RF-02 ${etiqueta}: Test Drive 3D abre el selector`);
  await clic(page,boton);
  await esperar(page,3000);
  check(await activa(page)==='pantalla-juego', `PRD 002 RF-09 ${etiqueta}: sigue en pantalla-juego tras 3 s (no redirige a Inicio)`);
  check(await visible(page,lienzo), `PRD 002 RF-09 ${etiqueta}: ${lienzo} visible`);
  await page.screenshot({ path: `${SP}/prd002_${etiqueta}.png` });
  if (await visible(page,salida)) await clic(page,salida);
  await esperar(page,400);
}

// ════════════════════════════════════════════════════════════════
// Vertical 390x844
// ════════════════════════════════════════════════════════════════
{
  const { ctx, page, errores } = await abrir({ width:390, height:844 });
  const V = 'vertical';
  await revisarInicio(page, V);

  // PRD 005 RF-07 (antes PRD 002 RF-04 / RF-05): Multijugador y Únete visibles con "Próximamente" y no abren nada
  for (const [id, rf, nombre] of [['btn-crear','RF-07','Multijugador'],['btn-unirse','RF-07','Únete']]) {
    const info = await page.evaluate(i=>{ const b=document.getElementById(i); return { txt:b.textContent, dis:b.disabled }; }, id);
    check(/Próximamente/.test(info.txt), `PRD 005 ${rf} "${nombre}" muestra "Próximamente" (${info.txt.trim()})`);
    check(info.dis===true, `PRD 005 ${rf} "${nombre}" está desactivado`);
    await page.click('#'+id, { force:true, timeout:2000 }).catch(()=>{});
    await page.evaluate(i=>document.getElementById(i).dispatchEvent(new MouseEvent('click',{bubbles:true})), id);
    await esperar(page,400);
    check(await activa(page)==='pantalla-inicio', `PRD 005 ${rf} al tocar "${nombre}" se queda en pantalla-inicio`);
  }

  // PRD 002 RF-06 / PRD 005 RF-08: selector de control visible y "Timón" abre el diseño del timón
  check(await visible(page,'control-tabs'), 'PRD 002 RF-06 selector Botones / Timón / Giroscopio visible en Inicio');
  for (const c of ['botones','timon','giro'])
    check(await page.evaluate(k=>{ const b=document.querySelector(`#control-tabs [data-ctrl="${k}"]`); return !!b && getComputedStyle(b).display!=='none' && b.getBoundingClientRect().width>0; }, c),
      `PRD 002 RF-06 pestaña ${c} visible`);
  await page.evaluate(()=>document.querySelector('#control-tabs [data-ctrl="timon"]').click()); await esperar(page,400);
  check(await activa(page)==='pantalla-timon-diseno', 'PRD 002 RF-06 la pestaña Timón abre pantalla-timon-diseno');
  await clic(page,'btn-volver-timon-diseno'); await esperar(page,300);
  check(await activa(page)==='pantalla-inicio', 'PRD 002 RF-06 volver del diseño del timón regresa a Inicio');

  // PRD 005 RF-02 / RF-08 (antes PRD 002 RF-01 / RF-02): ⚙ sin modos 2D, con el resto visible y funcionando
  await revisarAjustes(page, V);
  const destinos = [
    ['btn-ir-garage','pantalla-garage','btn-volver-garage'],
    ['btn-ir-giro','pantalla-giro','btn-volver-giro'],
    ['btn-ir-pista','pantalla-pista','btn-volver-pista'],
    ['btn-test-drive-3d','pantalla-td3d-selector','btn-volver-td3d-selector'],
    ['btn-ir-controles','pantalla-controles','btn-volver-controles'],
    ['btn-ir-velocimetro','pantalla-velocimetro-diseno','btn-volver-velocimetro-diseno'],
    ['btn-ir-vista-conduccion','pantalla-vista-conduccion','btn-volver-vista-conduccion'],
    ['btn-ir-diseno-general','pantalla-diseno-general','btn-volver-diseno-general'],
    ['btn-ir-diseno-objetos','pantalla-diseno-objetos','btn-volver-diseno-objetos'],
  ];
  for (const [boton, pantalla, volver] of destinos) {
    await irAAjustes(page);
    await clic(page,boton); await esperar(page, /diseno/.test(pantalla) ? 2500 : 500);
    check(await activa(page)===pantalla, `PRD 002 RF-02 ${boton} abre ${pantalla}`);
    await clic(page,volver).catch(()=>{}); await esperar(page,400);
  }

  // RF-09: entradas normales del 3D nunca se redirigen
  await entrarTestDrive3D(page, 'btn-td3d-simple', 'btn-exit-td3d', 'canvas-td3d', 'td3d_simple');
  await entrarTestDrive3D(page, 'btn-td3d-con-ruta', 'btn-exit-cir3d', 'canvas-cir3d', 'td3d_con_ruta');
  await irAAjustes(page);
  await clic(page,'btn-ir-pista'); await esperar(page,300);
  await page.evaluate(()=>document.querySelector('.pista-card[data-pista="ciudad"]').click()); await esperar(page,400);
  check(await activa(page)==='pantalla-detalle-pista', 'PRD 002 RF-02 Diseño de Pistas abre el detalle de la pista');
  await clic(page,'btn-seleccionar-pista'); await esperar(page,3000);
  check(await activa(page)==='pantalla-juego', 'PRD 002 RF-09 Diseño de Pistas → Entrar sigue en pantalla-juego tras 3 s');
  await page.screenshot({ path: `${SP}/prd002_diseno_pistas_entrar.png` });
  if (await visible(page,'btn-exit-cir3d')) await clic(page,'btn-exit-cir3d');
  await esperar(page,400);

  // RF-03: Jugar Solo llega a ¡YA!
  await irAInicio(page);
  await clic(page,'btn-solo'); await esperar(page,200);
  check(await activa(page)==='pantalla-carrera-solo', 'PRD 002 RF-03 Jugar Solo abre pantalla-carrera-solo (no redirige)');
  const llegoYa = await page.waitForFunction(()=>document.getElementById('cuenta-carrera-solo')?.textContent==='¡YA!',null,{timeout:12000}).then(()=>true,()=>false);
  check(llegoYa, 'PRD 002 RF-03 Jugar Solo llega a ¡YA!');
  await page.screenshot({ path: `${SP}/prd002_jugar_solo.png` });
  await irAInicio(page);

  // PRD 005 RF-03: atrás y adelante hacia pantallas borradas (o pantalla-juego sin visor) terminan en Inicio
  for (const destino of ['pantalla-crear','pantalla-unirse','pantalla-espera','pantalla-resultado','pantalla-juego']) {
    const rf = destino==='pantalla-juego' ? 'PRD 002 RF-09 / PRD 005 RF-03' : 'PRD 005 RF-03';
    await irAInicio(page);
    // atrás: [destino] ← [ajustes]
    await page.evaluate(d=>{ history.pushState({pantalla:d},''); history.pushState({pantalla:'pantalla-ajustes'},''); }, destino);
    await page.evaluate(()=>history.back()); await esperar(page,500);
    check(await activa(page)==='pantalla-inicio', `${rf} atrás hacia ${destino} muestra Inicio (${await activa(page)})`);
    // adelante: [ajustes] → [destino]
    await page.evaluate(d=>{ history.pushState({pantalla:'pantalla-ajustes'},''); history.pushState({pantalla:d},''); }, destino);
    await page.evaluate(()=>history.back()); await esperar(page,400);
    await page.evaluate(()=>history.forward()); await esperar(page,500);
    check(await activa(page)==='pantalla-inicio', `${rf} adelante hacia ${destino} muestra Inicio (${await activa(page)})`);
  }

  // PRD 005 RF-02: "GIRA TU CELULAR" y las pantallas 2D ya no existen en el DOM
  for (const id of ['pantalla-rotar','pantalla-crear','pantalla-unirse','pantalla-espera','pantalla-resultado'])
    check(!(await existe(page,id)), `PRD 005 RF-02 ${V}: ${id} no existe en el DOM`);
  console.log('__modelErrors:', JSON.stringify(await page.evaluate(()=>window.__modelErrors)));
  const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)/.test(t));
  console.log('errores:', errores.join('\n'));
  check(reales.length===0, `PRD 002 RF-11 / PRD 005 RF-09 ${V}: sin errores de consola ${reales.join(' | ')}`);
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════
// Horizontal 844x390
// ════════════════════════════════════════════════════════════════
{
  const { ctx, page, errores } = await abrir({ width:844, height:390 });
  const H = 'horizontal';
  await revisarInicio(page, H);
  await revisarAjustes(page, H);
  await entrarTestDrive3D(page, 'btn-td3d-simple', 'btn-exit-td3d', 'canvas-td3d', 'td3d_simple_horizontal');
  await entrarTestDrive3D(page, 'btn-td3d-con-ruta', 'btn-exit-cir3d', 'canvas-cir3d', 'td3d_con_ruta_horizontal');
  await irAInicio(page);
  await clic(page,'btn-solo');
  const llegoYa = await page.waitForFunction(()=>document.getElementById('cuenta-carrera-solo')?.textContent==='¡YA!',null,{timeout:12000}).then(()=>true,()=>false);
  check(llegoYa, `PRD 002 RF-03 ${H}: Jugar Solo llega a ¡YA!`);
  await irAInicio(page);
  check(!(await existe(page,'pantalla-rotar')), `PRD 005 RF-02 ${H}: "GIRA TU CELULAR" (pantalla-rotar) no existe en el DOM`);
  // Un enlace a una pantalla oculta (recarga con hash) termina en Inicio
  await page.goto(URL_JUEGO+'#pantalla-crear', { waitUntil:'load' }); await esperar(page,1500);
  check(await activa(page)==='pantalla-inicio', `PRD 005 RF-03 ${H}: enlace a pantalla-crear (borrada) muestra Inicio`);
  const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)/.test(t));
  console.log('errores:', errores.join('\n'));
  check(reales.length===0, `PRD 002 RF-11 / PRD 005 RF-09 ${H}: sin errores de consola ${reales.join(' | ')}`);
  await ctx.close();
}

console.log(`OK ${ok}, fallos ${fallos}`);
await browser.close();
process.exitCode = fallos ? 1 : 0;

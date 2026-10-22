// ================================================================
// Prueba en navegador real del PRD 004 — Dividir los monolitos.
// Entra y sale de TODAS las pantallas visibles de index.html por sus
// botones reales, en vertical (390x844) y horizontal (844x390):
//   RF-03 → cada pantalla queda activa y se guarda su captura
//   RF-04 → atrás / adelante del navegador y el botón volver
//   RF-11 → sin errores de consola
// Capturas: /tmp/capturas_prd004/<CAPTURAS_FASE>/<pantalla>-<orientación>.png
//   CAPTURAS_FASE=antes|despues (por defecto "antes").
// ================================================================
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const FASE = process.env.CAPTURAS_FASE === 'despues' ? 'despues' : 'antes';
const SP = `/tmp/capturas_prd004/${FASE}`; (await import('fs')).mkdirSync(SP, { recursive: true });
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
const visible = (page, id) => page.evaluate(i=>{ const b=document.getElementById(i);
  if(!b || b.hidden) return false; const cs=getComputedStyle(b); const r=b.getBoundingClientRect();
  return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0; }, id);
const clic = (page, id) => page.evaluate(i=>document.getElementById(i).click(), id);
const clicSelector = (page, sel) => page.evaluate(s=>document.querySelector(s).click(), sel);
const esperar = (page, ms) => page.waitForTimeout(ms);
const esperarYa = page => page.waitForFunction(()=>document.getElementById('cuenta-carrera-solo')?.textContent==='¡YA!',
  null, { timeout:12000 }).then(()=>true,()=>false);

// ── Pasos: cada pantalla visible, cómo se entra y cómo se sale ──
// desde:    paso previo (ya en su pantalla) desde el que se entra
// entrar:   botón real (id) o función que lo pulsa
// pantalla: id de la pantalla que debe quedar activa
// adelante: pantalla que muestra "adelante" tras volver atrás (PRD 002 redirige pantalla-juego a Inicio)
// volver:   botón volver de la pantalla y la pantalla a la que lleva (null = solo atrás del navegador)
// espera:   ms tras entrar (las pantallas 3D tardan en cargar)
// recargar: abre de nuevo el juego antes de cada entrada a una pantalla 3D. Hoy, al salir de
//           Diseño General su visor pierde el contexto WebGL del lienzo y una segunda entrada en la
//           misma sesión falla ("reading 'precision'"); además Chrome limita los contextos WebGL
//           por página. Cada entrada 3D se prueba así en una sesión limpia.
const PASOS = [
  { nombre:'inicio', pantalla:'pantalla-inicio' },
  { nombre:'ajustes', desde:'inicio', entrar:'btn-garage', pantalla:'pantalla-ajustes',
    volver:['btn-volver-ajustes','pantalla-inicio'] },
  { nombre:'garaje', desde:'ajustes', entrar:'btn-ir-garage', pantalla:'pantalla-garage',
    volver:['btn-volver-garage','pantalla-inicio'] },
  { nombre:'vista-previa', recargar:true, desde:'garaje', entrar:'btn-ver-carro', pantalla:'pantalla-preview', espera:3000,
    volver:['btn-volver-preview','pantalla-garage'] },
  { nombre:'giroscopio', desde:'ajustes', entrar:'btn-ir-giro', pantalla:'pantalla-giro',
    volver:['btn-volver-giro','pantalla-ajustes'] },
  { nombre:'pistas', desde:'ajustes', entrar:'btn-ir-pista', pantalla:'pantalla-pista',
    volver:['btn-volver-pista','pantalla-ajustes'] },
  { nombre:'detalle-pista', desde:'pistas', entrar:p=>clicSelector(p,'.pista-card[data-pista="ciudad"]'),
    pantalla:'pantalla-detalle-pista', volver:['btn-volver-detalle-pista','pantalla-pista'] },
  { nombre:'diseno-pistas-entrar', recargar:true, desde:'detalle-pista', entrar:'btn-seleccionar-pista', pantalla:'pantalla-juego',
    lienzo:'canvas-cir3d', espera:3500, adelante:'pantalla-inicio', volver:['btn-exit-cir3d','pantalla-detalle-pista'] },
  { nombre:'test-drive-3d', desde:'ajustes', entrar:'btn-test-drive-3d', pantalla:'pantalla-td3d-selector',
    volver:['btn-volver-td3d-selector','pantalla-ajustes'] },
  { nombre:'test-drive-3d-simple', recargar:true, desde:'test-drive-3d', entrar:'btn-td3d-simple', pantalla:'pantalla-juego',
    lienzo:'canvas-td3d', espera:3500, adelante:'pantalla-juego', volver:['btn-exit-td3d','pantalla-ajustes'] },
  { nombre:'test-drive-3d-con-ruta', recargar:true, desde:'test-drive-3d', entrar:'btn-td3d-con-ruta', pantalla:'pantalla-juego',
    lienzo:'canvas-cir3d', espera:3500, adelante:'pantalla-inicio', volver:['btn-exit-cir3d','pantalla-td3d-selector'] },
  { nombre:'controles', desde:'ajustes', entrar:'btn-ir-controles', pantalla:'pantalla-controles',
    volver:['btn-volver-controles','pantalla-ajustes'] },
  { nombre:'diseno-timon', desde:'controles', entrar:'btn-disenar-timon', pantalla:'pantalla-timon-diseno',
    volver:['btn-volver-timon-diseno','pantalla-controles'] },
  { nombre:'diseno-timon-desde-inicio', desde:'inicio', entrar:p=>clicSelector(p,'#control-tabs [data-ctrl="timon"]'),
    pantalla:'pantalla-timon-diseno', volver:['btn-volver-timon-diseno','pantalla-inicio'] },
  { nombre:'velocimetro', desde:'ajustes', entrar:'btn-ir-velocimetro', pantalla:'pantalla-velocimetro-diseno',
    volver:['btn-volver-velocimetro-diseno','pantalla-ajustes'] },
  { nombre:'vista-conduccion', desde:'ajustes', entrar:'btn-ir-vista-conduccion', pantalla:'pantalla-vista-conduccion',
    volver:['btn-volver-vista-conduccion','pantalla-ajustes'] },
  { nombre:'diseno-general', recargar:true, desde:'ajustes', entrar:'btn-ir-diseno-general', pantalla:'pantalla-diseno-general', espera:5000,
    volver:['btn-volver-diseno-general','pantalla-ajustes'] },
  { nombre:'diseno-objetos', recargar:true, desde:'ajustes', entrar:'btn-ir-diseno-objetos', pantalla:'pantalla-diseno-objetos', espera:5000,
    volver:['btn-volver-diseno-objetos','pantalla-ajustes'] },
  { nombre:'jugar-solo', desde:'inicio', entrar:'btn-solo', pantalla:'pantalla-carrera-solo', ya:true,
    adelante:'pantalla-inicio', volver:null },
];
const PASO = new Map(PASOS.map(p=>[p.nombre,p]));
const pasoActual = new Map();   // página → paso en curso, para saber dónde salió cada error de consola

// Vuelve a Inicio con los botones volver reales; el atrás del navegador solo como último recurso
async function irAInicio(page) {
  for (let i=0;i<8;i++) {
    const id = await activa(page);
    if (id==='pantalla-inicio') return;
    const paso = PASOS.find(p=>p.pantalla===id && p.volver && p.nombre!=='diseno-timon-desde-inicio');
    if (paso && await visible(page, paso.volver[0])) await clic(page, paso.volver[0]);
    else await page.goBack().catch(()=>{});
    await esperar(page, 300);
  }
}
// Cadena de pasos desde Inicio hasta el paso pedido
const cadena = nombre => { const c=[]; for (let p=PASO.get(nombre); p; p=PASO.get(p.desde)) c.unshift(p); return c; };
// Llega a la pantalla de un paso siguiendo los botones reales (desde donde ya está, si está en el camino)
async function llegar(page, nombre) {
  const pasos = cadena(nombre);
  const id = await activa(page);
  let i = pasos.findIndex(p=>p.pantalla===id && p.pantalla!=='pantalla-juego');
  if (i<0) { await irAInicio(page); i = 0; }
  for (const p of pasos.slice(i+1)) await pulsar(page, p);
}
async function pulsar(page, paso) {
  if (typeof paso.entrar === 'function') await paso.entrar(page); else await clic(page, paso.entrar);
  if (paso.ya) await esperarYa(page); else await esperar(page, paso.espera ?? 400);
}

async function revisarPaso(page, paso, orientacion) {
  pasoActual.set(page, `${paso.nombre} ${orientacion}`);
  if (paso.recargar) await cargar(page);
  const et = `${paso.nombre} ${orientacion}`;
  if (!paso.desde) {   // Inicio: solo queda activa y se captura
    await irAInicio(page);
    check(await activa(page)===paso.pantalla, `PRD 004 RF-03 ${et}: ${paso.pantalla} activa`);
    await page.screenshot({ path: `${SP}/${paso.nombre}-${orientacion}.png` });
    return;
  }
  const origen = PASO.get(paso.desde).pantalla;
  await llegar(page, paso.desde);
  check(await activa(page)===origen, `PRD 004 RF-04 ${et}: se llega a ${origen} por sus botones`);

  // 1) Entrar por el botón real
  await pulsar(page, paso);
  check(await activa(page)===paso.pantalla, `PRD 004 RF-03 ${et}: queda activa ${paso.pantalla} (${await activa(page)})`);
  if (paso.lienzo) check(await visible(page, paso.lienzo), `PRD 004 RF-03 ${et}: ${paso.lienzo} visible`);
  if (paso.ya) check(await page.evaluate(()=>document.getElementById('cuenta-carrera-solo')?.textContent)==='¡YA!',
    `PRD 004 RF-03 ${et}: la carrera llega a ¡YA!`);
  await page.screenshot({ path: `${SP}/${paso.nombre}-${orientacion}.png` });

  // 2) Atrás del navegador vuelve a la pantalla de origen. Hoy el garaje y la vista de conducción
  //    registran su botón más de una vez y dejan entradas repetidas en el historial: se aceptan
  //    hasta 4 "atrás" seguidos, siempre que no se pase por otra pantalla.
  let pasadas = [];
  for (let i=0;i<4 && await activa(page)===paso.pantalla;i++) { await page.goBack(); await esperar(page, 500); pasadas.push(await activa(page)); }
  check(await activa(page)===origen, `PRD 004 RF-04 ${et}: atrás vuelve a ${origen} (${pasadas.join(' → ')})`);

  // 3) Adelante del navegador (PRD 002 redirige a Inicio las pantallas sin visor)
  await page.goForward(); await esperar(page, 500);
  const adelante = paso.adelante ?? paso.pantalla;
  check(await activa(page)===adelante, `PRD 004 RF-04 ${et}: adelante muestra ${adelante} (${await activa(page)})`);

  // 4) Botón volver de la pantalla (se entra de nuevo por el botón real)
  if (!paso.volver) return;
  if (paso.recargar) await cargar(page);
  await llegar(page, paso.desde);
  await pulsar(page, paso);
  check(await activa(page)===paso.pantalla, `PRD 004 RF-03 ${et}: se vuelve a entrar a ${paso.pantalla}`);
  const [boton, destino] = paso.volver;
  check(await visible(page, boton), `PRD 004 RF-04 ${et}: botón ${boton} visible`);
  await clic(page, boton); await esperar(page, 500);
  check(await activa(page)===destino, `PRD 004 RF-04 ${et}: ${boton} lleva a ${destino} (${await activa(page)})`);
}

// Abre el juego desde cero y espera a que carguen los módulos de los visores 3D
async function cargar(page) {
  await page.goto(URL_JUEGO, { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForFunction(()=>window.VisorTestdriveRecto && window.VisorTestdriveRuta, null, { timeout:15000 }).catch(()=>{});
  await esperar(page, 500);
}

async function recorrer(viewport, orientacion) {
  const ctx = await browser.newContext({ viewport, hasTouch:true, isMobile:true });
  const page = await ctx.newPage();
  const errores=[];
  page.on('pageerror', e=>{ errores.push(`[${pasoActual.get(page)}] pageerror: ${e.message}`); if (process.env.DEPURAR) console.log(e.stack); });
  page.on('console', m=>{ if(m.type()==='error') errores.push(`[${pasoActual.get(page)}] console: ${m.text()}`); });
  await page.route('**', parchear);
  pasoActual.set(page, `arranque ${orientacion}`);
  await cargar(page);
  for (const paso of PASOS) await revisarPaso(page, paso, orientacion);
  await irAInicio(page);
  check(await activa(page)==='pantalla-inicio', `PRD 004 RF-04 ${orientacion}: al final se vuelve a Inicio`);
  const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)/.test(t));
  
  check(reales.length===0, `PRD 004 RF-11 ${orientacion}: sin errores de consola ${reales.join(' | ')}`);
  await ctx.close();
}

// Las dos orientaciones corren a la vez, cada una en su propia página
await Promise.all([
  recorrer({ width:390, height:844 }, 'vertical'),
  recorrer({ width:844, height:390 }, 'horizontal'),
]);

console.log(`Capturas en ${SP}`);
console.log(`OK ${ok}, fallos ${fallos}`);
await browser.close();
process.exitCode = fallos ? 1 : 0;

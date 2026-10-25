const vm=require('vm'),fs=require('fs');
// Prueba de HudCarrera (PRD 006) y de la posición y la tabla final (PRD 013, RF-09 y D5)
function el(id){const e={id,style:{},children:[],textContent:'',parentNode:null,className:'',onclick:null,
 classList:{add(c){if(!(' '+e.className+' ').includes(' '+c+' '))e.className=(e.className?e.className+' ':'')+c;}},
 replaceChildren(){e.children=[];},
 appendChild(c){c.parentNode=e;e.children.push(c);return c;},
 insertBefore(c,a){c.parentNode=e;const i=a?e.children.indexOf(a):0;e.children.splice(i<0?0:i,0,c);return c;},
 get firstChild(){return e.children[0]||null;},
 querySelector(q){const b=(n)=>{for(const c of n.children){if((q[0]=='#'&&c.id==q.slice(1))||(q[0]=='.'&&c.className.split(' ').includes(q.slice(1))))return c;const r=b(c);if(r)return r;}return null;};return b(e);}};
 Object.defineProperty(e.style,'cssText',{set(){},get(){return ''}});return e;}
const llamadas=[];const textos=[];const ctx=new Proxy({fillText:(t)=>textos.push(t)},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)});
const canvas=el('c');canvas.getContext=()=>ctx;
const panel=el('resultado');const rev=panel.appendChild(el('btn-revancha-solo'));const men=panel.appendChild(el('btn-menu-solo'));
const cuenta=el('cuenta');const listeners={};
const window={innerWidth:390,innerHeight:844,devicePixelRatio:2,addEventListener:(t,f)=>listeners[t]=f,removeEventListener:(t)=>delete listeners[t],
 RenderizadorVelocimetro:{dibujar:(...a)=>llamadas.push(a)}};
const document={createElement:()=>el('')};
const leer=(r)=>fs.readFileSync(require('path').join(__dirname,'../../src/'+r),'utf8');
const contexto={window,document,console,Number,Math,String,Array,Error,performance:{now:()=>0}};
for(const r of ['model/cronometro.js','view/tabla_final_carrera.js','view/hud_carrera.js'])vm.runInNewContext(leer(r),contexto);
const ok=(c,m)=>{if(!c){console.log('FALLO',m);process.exitCode=1}else console.log('ok',m)};
ok(!window.__modelErrors,'sin errores de carga');
const h=new window.HudCarrera(canvas,cuenta,panel);
ok(canvas.width==780&&canvas.style.width=='390px','dimensiona a columna');
h.dibujar(2,3,'0:12.34',0.5,1);
ok(!textos.some(t=>t.includes('/5')),'RF-09: sin texto de posicion no dibuja posicion');
textos.length=0;h.dibujar(2,3,'0:12.34',0.5,1,'2.º/5');ok(textos.includes('2.º/5'),'RF-09: dibuja la posicion 2.º/5 en la barra');llamadas.length=1;
ok(llamadas.length==1&&llamadas[0][1]==334&&llamadas[0][2]==668&&llamadas[0][3]==40&&llamadas[0][5]==1,'velocimetro posicion fija '+JSON.stringify(llamadas[0].slice(1)));
window.innerWidth=1280;listeners.resize();ok(canvas.style.width=='480px','resize max 480');
delete window.RenderizadorVelocimetro;h.dibujar(1,3,'0:00.00',0,0);ok(true,'sin renderizador no falla');
h.mostrarCuenta('3');ok(cuenta.style.display=='flex'&&cuenta.textContent=='3','cuenta');h.ocultarCuenta();ok(cuenta.style.display=='none','ocultar cuenta');
let r=0,m=0;h.mostrarResultado('1:23.45','0:27.10',()=>r++,()=>m++);
ok(panel.style.display=='flex'&&panel.style.zIndex=='30'&&panel.style.position=='fixed','panel visible fixed z30');
rev.onclick();rev.onclick();men.onclick&&men.onclick();ok(r==1&&m==0,'un solo disparo');
h.ocultarResultado();h.mostrarResultado('a','b',()=>r++,()=>m++);men.onclick();ok(m==1,'menu');
const tabla=panel.querySelector('.resultado-carrera-tabla');
ok(tabla&&tabla.style.display=='none','D5: sin filas la tabla no se ve');
const fila=(puesto,nombre,esJugador,terminado,tiempoMs)=>({puesto,nombre,esJugador,terminado,tiempoMs});
h.ocultarResultado();
h.mostrarResultado('1:23.45','0:27.10',()=>{},()=>{},[fila(1,'Ana · Experto',false,true,83000),fila(2,'Jugador',true,true,85120),fila(3,'Luis · Novato',false,false,null)]);
ok(tabla.style.display=='flex'&&tabla.children.length==3,'D5: la tabla muestra una fila por puesto');
const celdas=(i)=>tabla.children[i].children.map(c=>c.textContent);
ok(JSON.stringify(celdas(0))==JSON.stringify(['1.º','Ana · Experto','1:23.00']),'D5: puesto, nombre y tiempo '+celdas(0));
ok(celdas(2)[2]=='en carrera','D5: el que no llego dice en carrera');
ok(tabla.children[1].className.includes('es-jugador')&&!tabla.children[0].className.includes('es-jugador'),'D5: el jugador va resaltado');
h.actualizarTabla([fila(1,'Ana · Experto',false,true,83000),fila(2,'Jugador',true,true,85120),fila(3,'Luis · Novato',false,true,91000)]);
ok(tabla.children.length==3&&celdas(2)[2]=='1:31.00','D5: actualizarTabla rehace la tabla con la nueva llegada');
h.ocultarResultado();ok(tabla.style.display=='none'&&tabla.children.length==0,'ocultar resultado vacia la tabla');
ok(Object.keys(h).length==0,'sin campos publicos');
h.destruir();h.destruir();ok(!listeners.resize,'destruir idempotente y quita resize');

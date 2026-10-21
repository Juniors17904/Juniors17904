const vm=require('vm'),fs=require('fs');
function el(id){const e={id,style:{},children:[],textContent:'',parentNode:null,className:'',onclick:null,
 appendChild(c){c.parentNode=e;e.children.push(c);return c;},
 insertBefore(c,a){c.parentNode=e;const i=a?e.children.indexOf(a):0;e.children.splice(i<0?0:i,0,c);return c;},
 get firstChild(){return e.children[0]||null;},
 querySelector(q){const b=(n)=>{for(const c of n.children){if((q[0]=='#'&&c.id==q.slice(1))||(q[0]=='.'&&c.className==q.slice(1)))return c;const r=b(c);if(r)return r;}return null;};return b(e);}};
 Object.defineProperty(e.style,'cssText',{set(){},get(){return ''}});return e;}
const llamadas=[];const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)});
const canvas=el('c');canvas.getContext=()=>ctx;
const panel=el('resultado');const rev=panel.appendChild(el('btn-revancha-solo'));const men=panel.appendChild(el('btn-menu-solo'));
const cuenta=el('cuenta');const listeners={};
const window={innerWidth:390,innerHeight:844,devicePixelRatio:2,addEventListener:(t,f)=>listeners[t]=f,removeEventListener:(t)=>delete listeners[t],
 RenderizadorVelocimetro:{dibujar:(...a)=>llamadas.push(a)}};
const document={createElement:()=>el('')};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../../src/view/hud_carrera.js'),'utf8'),{window,document,console,Number,Math,String});
const ok=(c,m)=>{if(!c){console.log('FALLO',m);process.exitCode=1}else console.log('ok',m)};
ok(!window.__modelErrors,'sin errores de carga');
const h=new window.HudCarrera(canvas,cuenta,panel);
ok(canvas.width==780&&canvas.style.width=='390px','dimensiona a columna');
h.dibujar(2,3,'0:12.34',0.5,1);
ok(llamadas.length==1&&llamadas[0][1]==334&&llamadas[0][2]==668&&llamadas[0][3]==40&&llamadas[0][5]==1,'velocimetro posicion fija '+JSON.stringify(llamadas[0].slice(1)));
window.innerWidth=1280;listeners.resize();ok(canvas.style.width=='480px','resize max 480');
delete window.RenderizadorVelocimetro;h.dibujar(1,3,'0:00.00',0,0);ok(true,'sin renderizador no falla');
h.mostrarCuenta('3');ok(cuenta.style.display=='flex'&&cuenta.textContent=='3','cuenta');h.ocultarCuenta();ok(cuenta.style.display=='none','ocultar cuenta');
let r=0,m=0;h.mostrarResultado('1:23.45','0:27.10',()=>r++,()=>m++);
ok(panel.style.display=='flex'&&panel.style.zIndex=='30'&&panel.style.position=='fixed','panel visible fixed z30');
rev.onclick();rev.onclick();men.onclick&&men.onclick();ok(r==1&&m==0,'un solo disparo');
h.ocultarResultado();h.mostrarResultado('a','b',()=>r++,()=>m++);men.onclick();ok(m==1,'menu');
ok(Object.keys(h).length==0,'sin campos publicos');
h.destruir();h.destruir();ok(!listeners.resize,'destruir idempotente y quita resize');

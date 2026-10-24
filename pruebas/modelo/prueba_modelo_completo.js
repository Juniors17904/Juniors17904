const fs=require('fs'),vm=require('vm');
const R=require('path').join(__dirname,'../../src/')+'model/';
const ctx={console,performance,Math,Object,Array,Number,String,Error,Infinity};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['muestra_ruta.js','cronometro.js','medida_carro.js','medidas_escena.js','superficies/superficie.js','superficies/superficie_asfalto.js','superficies/superficie_piano.js','superficies/superficie_pasto.js','superficies/detector_superficie.js','carrera_vueltas.js'])vm.runInContext(fs.readFileSync(R+f,'utf8'),ctx,{filename:f});
const fallos=[];const ok=(c,m)=>{if(!c)fallos.push(m);};
ok(!ctx.__modelErrors,'modelErrors '+ctx.__modelErrors);
const C=ctx.Cronometro, CV=ctx.CarreraVueltas, M=ctx.MuestraRuta;
const mr=o=>new M(o.x,o.z,o.angle);
// RF-05..04
new C();
let t=0;const c=new C(()=>t);c.iniciar();t+=1000;ok(c.tiempoTotalMs===1000,'RF-05 a');
c.pausar();t+=500;ok(c.tiempoTotalMs===1000,'RF-05 pausa');c.reanudar();t+=200;ok(c.tiempoTotalMs===1200,'RF-05 b '+c.tiempoTotalMs);
ok(c.corriendo===undefined,'sin getter corriendo (RNF-01)');
c.reiniciar();ok(c.tiempoTotalMs===0&&c.mejorVueltaMs===null,'RF-05 null');
c.iniciar();t+=30000;c.marcarVuelta();ok(c.tiempoVueltaActualMs===0,'RF-05 reinicia vuelta');t+=28000;c.marcarVuelta();t+=29000;c.marcarVuelta();
ok(c.mejorVueltaMs===28000,'RF-05 mejor '+c.mejorVueltaMs);ok(JSON.stringify(c.tiemposVuelta)==='[30000,28000,29000]','RF-05 lista');
const tv=c.tiemposVuelta;try{tv.push(1)}catch(e){};ok(c.tiemposVuelta.length===3,'RF-05 solo lectura');
c.detener();const tot=c.tiempoTotalMs;t+=5000;ok(c.tiempoTotalMs===tot,'detener');
// pausa doble / reanudar doble
c.reanudar();c.reanudar();t+=100;ok(c.tiempoTotalMs===tot+100,'reanudar doble');
// pausa durante vuelta
const d=new C(()=>t);d.iniciar();t+=1000;d.pausar();t+=9999;d.reanudar();t+=1000;d.marcarVuelta();ok(d.tiemposVuelta[0]===2000,'vuelta con pausa '+d.tiemposVuelta[0]);
const f=c.formatear.bind(c);
for(const [a,b] of [[83456,'1:23.45'],[0,'0:00.00'],[59999,'0:59.99'],[60000,'1:00.00'],[-5,'0:00.00'],[NaN,'0:00.00'],[null,'0:00.00'],[3600000,'60:00.00'],[9.99,'0:00.00'],[10,'0:00.01'],[599999,'9:59.99']])ok(f(a)===b,'RF-05 '+a+' -> '+f(a));
// reloj default
ok(typeof new C().tiempoTotalMs==='number','default reloj');
// RF-06..12 circulo
function circ(n,r=50){const a=[];for(let i=0;i<n;i++){const th=2*Math.PI*i/n;a.push(new M(r*Math.sin(th),r*Math.cos(th),th+Math.PI/2));}return a;}
// in circle CCW? derive angle from tangent: d/dth (sin,cos)=(cos,-sin) -> angle s.t. sin(a)=cos th, cos(a)=-sin th -> a=th+pi/2 OK
const m100=circ(100);let cv=new CV(m100);ok(cv.progreso===0&&cv.vueltaActual===1&&cv.totalVueltas===3,'RF-06');
for(let i=5;i<=25;i+=5)cv.actualizar(m100[i].x,m100[i].z);ok(cv.progreso===0.25,'RF-06 0.25 '+cv.progreso);
cv.actualizar(m100[20].x,m100[20].z);ok(cv.progreso===0.2,'RF-06 atras');
cv=new CV(m100);for(let i=5;i<=95;i+=5)cv.actualizar(m100[i].x,m100[i].z);cv.actualizar(m100[98].x,m100[98].z);cv.actualizar(m100[1].x,m100[1].z);ok(cv.progreso===0.01,'RF-06 wrap '+cv.progreso);
// lateral
function pt(m,i,off){const n=m.length,a=m[i],b=m[(i+1)%n];const ux=b.x-a.x,uz=b.z-a.z,L=Math.hypot(ux,uz);return [a.x+uz/L*off,a.z-ux/L*off];}
cv=new CV(m100);let p=pt(m100,0,5);cv.actualizar(...p);ok(cv.enPasto===true,'RF-07 5u '+cv.lateral);
cv=new CV(m100);p=pt(m100,0,-5);cv.actualizar(...p);ok(cv.enPasto===true,'RF-07 -5u '+cv.lateral);
cv=new CV(m100);p=pt(m100,0,3);cv.actualizar(...p);ok(cv.enPasto===false,'RF-07 3u');
// segmento largo: 4 muestras de cuadrado de lado 100
const cuad=[{x:0,z:0,angle:0},{x:0,z:100,angle:Math.PI/2},{x:100,z:100,angle:Math.PI},{x:100,z:0,angle:-Math.PI/2}].map(mr);
cv=new CV(cuad);cv.actualizar(3,50);ok(cv.enPasto===false,'RF-07 mitad seg 3u lat='+cv.lateral);cv=new CV(cuad);cv.actualizar(-3,50);ok(cv.enPasto===false,'RF-07 mitad seg -3u lat='+cv.lateral);
cv=new CV(cuad);cv.actualizar(5,50);ok(cv.enPasto===true,'RF-07 mitad seg 5u');
// mitad de segmento con muchos puntos: muestra 0..10 en recta sep 20
const recta=[];for(let i=0;i<20;i++)recta.push(new M(0,i*20,0));
cv=new CV(recta);cv.actualizar(3,10);ok(!cv.enPasto,'RF-07 recta 3u '+cv.lateral);cv=new CV(recta);cv.actualizar(3,30);ok(!cv.enPasto,'RF-07 recta 3u b '+cv.lateral);
// pasto
// PRD 008 RF-01/RF-03: la superficie cambia al salir y volver al asfalto
cv=new CV(m100);p=pt(m100,0,6);cv.actualizar(...p);ok(cv.superficie.nombre==='pasto','PRD 008 RF-01 pasto a 6u');
cv.actualizar(m100[0].x,m100[0].z);ok(cv.superficie.nombre==='asfalto','PRD 008 RF-03 vuelve al asfalto');
cv=new CV(m100);cv.actualizar(...pt(m100,0,4.3));ok(cv.superficie.nombre==='piano','PRD 008 RF-04 piano a 4.3u');
// secuencias con progreso
function irA(cv,m,desde,hasta,dir){const n=m.length;let x=desde;const ev=[];const step=0.05*dir;let cnt=0;
 while(true){let next=x+step;let fin=false;const dist=dir>0?((hasta-x)%1+1)%1:((x-hasta)%1+1)%1;if(dist<=0.05+1e-9){next=hasta;fin=true;}
 x=((next%1)+1)%1;const i=Math.round(x*n)%n;ev.push(cv.actualizar(m[i].x,m[i].z));if(fin||++cnt>100)break;}return ev;}
const m400=circ(400,200);
cv=new CV(m400);irA(cv,m400,0,0.5,1);irA(cv,m400,0.5,0,-1);ok(cv.vueltaActual===1,'RF-06 a');
cv=new CV(m400);let ev=[];for(const [a,b] of [[0,0.34],[0.34,0.67],[0.67,0.99],[0.99,0.01]])ev.push(...irA(cv,m400,a,b,1));ok(cv.vueltaActual===2,'RF-06 b '+cv.vueltaActual);ok(ev.filter(e=>e==='vuelta').length===1&&ev.filter(e=>e==='puntoControl').length===2,'RF-06 eventos '+ev);
cv=new CV(m400);irA(cv,m400,0,0.1,1);cv.actualizar(m400[200].x,m400[200].z);ok(cv.progreso<=0.2&&cv.puntoControlSiguiente===1&&cv.vueltaActual===1,'RF-06 corte '+cv.progreso);
// RF-06
cv=new CV(m400);irA(cv,m400,0,0.05,1);irA(cv,m400,0.05,0.95,-1);let e2=irA(cv,m400,0.95,0.05,1);ok(cv.vueltaActual===1,'RF-06 sin vuelta');
for(const [a,b] of [[0.05,0.34],[0.34,0.67],[0.67,0.99],[0.99,0.01]])irA(cv,m400,a,b,1);ok(cv.vueltaActual===2,'RF-06 1 vuelta '+cv.vueltaActual);
// RF-06 variante: PCs marcados, retroceder por la meta, volver adelante -> no vuelta
cv=new CV(m400);for(const [a,b] of [[0,0.34],[0.34,0.67],[0.67,0.99]])irA(cv,m400,a,b,1);irA(cv,m400,0.99,0.01,1);ok(cv.vueltaActual===2,'pre');
for(const [a,b] of [[0.01,0.34],[0.34,0.67],[0.67,0.99]])irA(cv,m400,a,b,1); // pcs marcados
irA(cv,m400,0.99,0.05,1);ok(cv.vueltaActual===3,'v3');
// 3 vueltas, RF-06/11
cv=new CV(m400);ev=[];for(let v=0;v<3;v++)for(const [a,b] of [[0.01,0.34],[0.34,0.67],[0.67,0.99],[0.99,0.01]])ev.push(...irA(cv,m400,a,b,1));
const lv=ev.filter(e=>e==='vuelta'||e==='meta');ok(JSON.stringify(lv)==='["vuelta","vuelta","meta"]','RF-06 '+lv);ok(cv.terminada&&cv.vueltaActual===3,'RF-06');
for(let v=0;v<2;v++)for(const [a,b] of [[0.01,0.34],[0.34,0.67],[0.67,0.99],[0.99,0.01]])irA(cv,m400,a,b,1).forEach(e=>ok(e==='nada','post-meta evento '+e));ok(cv.vueltaActual===3,'RF-06 fijo');
ok([1,2,3].includes(cv.puntoControlSiguiente),'pcs');
cv.reiniciar();ok(cv.vueltaActual===1&&cv.progreso===0&&!cv.terminada&&cv.superficie.nombre==='asfalto'&&cv.puntoControlSiguiente===1,'RF-06');
// puntoControlSiguiente
cv=new CV(m400);irA(cv,m400,0,0.34,1);ok(cv.puntoControlSiguiente===2,'pcs2');irA(cv,m400,0.34,0.67,1);ok(cv.puntoControlSiguiente===3,'pcs3');
// meta: mover justo a la muestra 0 (exacta) cuenta
cv=new CV(m400);for(const [a,b] of [[0,0.34],[0.34,0.67],[0.67,0.99]])irA(cv,m400,a,b,1);ok(cv.actualizar(m400[0].x,m400[0].z)==='vuelta','meta en idx 0');
// marcha atras desde salida
cv=new CV(m400);cv.actualizar(m400[399].x,m400[399].z);ok(cv.progreso===399/400,'atras salida');ok(cv.actualizar(m400[2].x,m400[2].z)==='nada'&&cv.vueltaActual===1,'cruce sin pcs');
// ventana N=400 => 40
cv=new CV(m400);cv.actualizar(m400[45].x,m400[45].z);ok(cv.progreso===0.1,'V=40 '+cv.progreso);
// N=100 => 10
cv=new CV(m100);cv.actualizar(m100[50].x,m100[50].z);ok(cv.progreso<=0.1,'V=10 '+cv.progreso);
// totalVueltas param
cv=new CV(m400,1);ev=[];for(const [a,b] of [[0,0.34],[0.34,0.67],[0.67,0.99],[0.99,0.01]])ev.push(...irA(cv,m400,a,b,1));ok(ev.includes('meta')&&cv.terminada,'1 vuelta');
// constructor invalido
try{new CV([]);ok(false,'vacio no lanza')}catch(e){}
// RNF-01: MuestraRuta solo lectura y CarreraVueltas rechaza literales
{const m=new M(1,2,3);ok(m.x===1&&m.z===2&&m.angulo===3,'RNF-01 getters');m.x=9;ok(m.x===1,'RNF-01 solo lectura');}
try{new CV([{x:0,z:0,angle:0},{x:0,z:1,angle:0}]);ok(false,'RNF-01 literales no lanza')}catch(e){}
ok(!/\{ *x *:/.test(fs.readFileSync(R+'carrera_vueltas.js','utf8')),'RNF-01 sin literales en carrera_vueltas');
// sin DOM/Three
const src=fs.readFileSync(R+'carrera_vueltas.js','utf8');ok(!/THREE|document\./.test(src),'deps');
console.log(fallos.length?fallos.join('\n'):'TODO OK');
process.exitCode = fallos.length ? 1 : 0;

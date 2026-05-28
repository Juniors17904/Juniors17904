import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let _gltf = null;
async function _loadGLTF() {
    if (_gltf) return _gltf;
    return (_gltf = await new GLTFLoader().loadAsync('models/vehicles_pack.glb'));
}

const _CAR = { deportivo:'Sports', suv:'SUV', formula:'Formula', pickup:'Pickup', retro:'Retro' };

class Circuito3D {
    #canvas; #renderer=null; #scene=null; #camera=null; #raf=0;
    #carGroup=null; #leanGroup=null; #wheels=[]; #sun=null;
    #resizeHandler=null;

    #pathPts=[];
    #segLens=[];
    #pathLen=0;

    #progress=0; #speed=0; #accel=0; #maxSpeed=0; #carLean=0;
    #px=0; #pz=0; #rotY=0;

    accelInput=0; steerInput=0; camHeight=2.8;

    get speed()    { return this.#speed; }
    get accel()    { return this.#accel; }
    get maxSpeed() { return this.#maxSpeed; }
    get progress() { return this.#progress; }
    get rotY()     { return this.#rotY; }
    get rotZ()     { return this.#carLean; }
    get px()       { return this.#px; }
    get pz()       { return this.#pz; }
    get camRotY()  { return this.#rotY; }
    get physics()  { return {maxFwd:0.74,maxRev:0.28,accel:0.006,brake:0.026,drag:0.009,steer:0.010,camDist:7}; }

    constructor(canvas, tipoPista='ciudad') {
        this.#canvas = canvas;
        this.#initScene();
        this.#genPath(tipoPista);
        this.#buildRoad();
    }

    #initScene() {
        const W=window.innerWidth, H=window.innerHeight;
        this.#renderer = new THREE.WebGLRenderer({canvas:this.#canvas, antialias:true});
        this.#renderer.setSize(W, H, false);
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x060a14);
        this.#scene.fog = new THREE.Fog(0x060a14, 80, 250);

        this.#camera = new THREE.PerspectiveCamera(65, W/H, 0.1, 300);

        this.#scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        this.#sun = new THREE.DirectionalLight(0xffffff, 1.2);
        this.#sun.castShadow = true;
        this.#sun.shadow.mapSize.set(1024, 1024);
        this.#scene.add(this.#sun);
        this.#scene.add(this.#sun.target);
    }

    #genPath(tipoPista) {
        const pista = window.PISTAS?.[tipoPista];
        if (!pista?.tramos) return;
        const paso = 4;
        let x=0, z=0, angle=0;
        const pts = [{x:0, z:0}];
        for (let i=0; i<pista.totalSegs; i++) {
            const tr = pista.tramos.find(([d,h]) => i>=d && i<h);
            angle += (tr ? tr[2] : 0) * 0.045;
            x += Math.sin(angle) * paso;
            z += Math.cos(angle) * paso;
            pts.push({x, z});
        }
        pts.push(pts[0]); // close loop
        this.#pathPts = pts;
        let total=0;
        for (let i=0; i<pts.length-1; i++) {
            const dx=pts[i+1].x-pts[i].x, dz=pts[i+1].z-pts[i].z;
            const d=Math.sqrt(dx*dx+dz*dz);
            this.#segLens.push(d); total+=d;
        }
        this.#pathLen = total;
        this.#px=pts[0].x; this.#pz=pts[0].z;
        if (pts.length>1) this.#rotY=Math.atan2(pts[1].x-pts[0].x, pts[1].z-pts[0].z);
    }

    #posAt(prog) {
        let t=((prog%1)+1)%1*this.#pathLen;
        const p=this.#pathPts;
        for (let i=0; i<this.#segLens.length; i++) {
            if (t<=this.#segLens[i]) {
                const f=t/this.#segLens[i];
                return {
                    x:p[i].x+f*(p[i+1].x-p[i].x),
                    z:p[i].z+f*(p[i+1].z-p[i].z),
                    angle:Math.atan2(p[i+1].x-p[i].x, p[i+1].z-p[i].z)
                };
            }
            t-=this.#segLens[i];
        }
        return {x:p[0].x, z:p[0].z, angle:this.#rotY};
    }

    #buildRoad() {
        const pts=this.#pathPts;
        if (pts.length<2) return;
        const W=8;

        // Grass
        const grass=new THREE.Mesh(
            new THREE.PlaneGeometry(3000,3000),
            new THREE.MeshStandardMaterial({color:0x1a5c1a,roughness:0.9})
        );
        grass.rotation.x=-Math.PI/2; grass.position.y=-0.01; grass.receiveShadow=true;
        this.#scene.add(grass);

        // Road ribbon
        const verts=[], idx=[], uvArr=[];
        for (let i=0; i<pts.length; i++) {
            const prev=pts[Math.max(0,i-1)], next=pts[Math.min(pts.length-1,i+1)];
            let dx=next.x-prev.x, dz=next.z-prev.z;
            const len=Math.sqrt(dx*dx+dz*dz)||1; dx/=len; dz/=len;
            const nx=-dz, nz=dx;
            verts.push(pts[i].x+nx*W/2, 0.005, pts[i].z+nz*W/2);
            verts.push(pts[i].x-nx*W/2, 0.005, pts[i].z-nz*W/2);
            uvArr.push(0,i/pts.length, 1,i/pts.length);
            if (i>0) { const v=(i-1)*2; idx.push(v,v+1,v+2, v+1,v+3,v+2); }
        }
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts,3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr,2));
        geo.setIndex(idx); geo.computeVertexNormals();
        const road=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x3a3a3a,roughness:0.85}));
        road.receiveShadow=true; this.#scene.add(road);

        // Center line dashes
        for (let i=0; i<pts.length-1; i+=6) {
            const mx=(pts[i].x+pts[i+1].x)/2, mz=(pts[i].z+pts[i+1].z)/2;
            const ang=Math.atan2(pts[i+1].x-pts[i].x, pts[i+1].z-pts[i].z);
            const dash=new THREE.Mesh(
                new THREE.PlaneGeometry(0.3,2.5),
                new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5})
            );
            dash.rotation.x=-Math.PI/2; dash.rotation.z=-ang;
            dash.position.set(mx,0.02,mz);
            this.#scene.add(dash);
        }

        // Start/finish line
        if (pts.length>1) {
            const ang=Math.atan2(pts[1].x-pts[0].x, pts[1].z-pts[0].z);
            const finish=new THREE.Mesh(
                new THREE.PlaneGeometry(W,1.5),
                new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5})
            );
            finish.rotation.x=-Math.PI/2; finish.rotation.z=-ang;
            finish.position.set(pts[0].x,0.02,pts[0].z);
            this.#scene.add(finish);
        }
    }

    async cargar(tipo, color) {
        try { this.#setCar(await _loadGLTF(), tipo, color); }
        catch(e) { console.error('Circuito3D:', e); }
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) this.#scene.remove(this.#carGroup);
        const sc=gltf.scene.clone();
        const prefix=_CAR[tipo]??'Sports';
        sc.traverse(m=>{
            if (!m.isMesh) return;
            if (m.name.startsWith(prefix)) {
                m.visible=true; m.castShadow=true;
                if (m.name.endsWith('_body')) { m.material=m.material.clone(); m.material.color.set(color); }
            } else m.visible=false;
        });
        const box=new THREE.Box3().setFromObject(sc);
        const c=box.getCenter(new THREE.Vector3());
        const inner=new THREE.Group(); inner.add(sc);
        inner.position.set(-c.x,-box.min.y,-c.z);
        const lean=new THREE.Group(); lean.add(inner); this.#leanGroup=lean;
        const outer=new THREE.Group(); outer.add(lean);
        this.#scene.add(outer); this.#carGroup=outer;
        this.#wheels=[];
        for (const w of ['front_right','front_left','rear_right','rear_left']) {
            const n=sc.getObjectByName(`${prefix}_wheel_${w}`);
            if (n) this.#wheels.push(n);
        }
    }

    iniciar() {
        if (!this.#raf) {
            this.#resizeHandler=()=>{
                const W=window.innerWidth,H=window.innerHeight;
                this.#canvas.width=W; this.#canvas.height=H;
                this.#camera.aspect=W/H; this.#camera.updateProjectionMatrix();
                this.#renderer?.setSize(W,H,false);
            };
            window.addEventListener('resize',this.#resizeHandler);
            window.addEventListener('orientationchange',()=>setTimeout(this.#resizeHandler,120));
            this.#tick();
        }
    }

    detener() {
        cancelAnimationFrame(this.#raf); this.#raf=0;
        if (this.#resizeHandler) { window.removeEventListener('resize',this.#resizeHandler); this.#resizeHandler=null; }
        this.#renderer?.dispose(); this.#renderer=null;
    }

    #tick() {
        this.#raf=requestAnimationFrame(()=>this.#tick());
        this.#updatePhysics();
        this.#updateCamera();
        this.#sun?.position.set(this.#px+10,20,this.#pz+10);
        this.#sun?.target.position.set(this.#px,0,this.#pz);
        this.#sun?.target.updateMatrixWorld();
        this.#renderer.render(this.#scene,this.#camera);
    }

    #updatePhysics() {
        const MAX_FWD=0.74,MAX_REV=0.28,ACCEL=0.006,BRAKE=0.026,DRAG=0.009;
        const prev=this.#speed;
        if (this.accelInput===1)       this.#speed=Math.min(MAX_FWD,this.#speed+ACCEL);
        else if (this.accelInput===-1) {
            if (this.#speed>0.01) this.#speed=Math.max(0,this.#speed-BRAKE);
            else                  this.#speed=Math.max(-MAX_REV,this.#speed-ACCEL*0.6);
        } else {
            if (this.#speed>0) this.#speed=Math.max(0,this.#speed-DRAG);
            else               this.#speed=Math.min(0,this.#speed+DRAG);
        }
        this.#accel=this.#speed-prev;
        if (Math.abs(this.#speed)>this.#maxSpeed) this.#maxSpeed=Math.abs(this.#speed);

        if (this.#pathLen>0) {
            this.#progress=((this.#progress+this.#speed/this.#pathLen)%1+1)%1;
            const p=this.#posAt(this.#progress);
            this.#px=p.x; this.#pz=p.z; this.#rotY=p.angle;
        }

        const sf=Math.abs(this.#speed)/0.74;
        this.#carLean+=(-this.steerInput*0.22*sf-this.#carLean)*0.08;
        if (this.#carGroup) { this.#carGroup.position.set(this.#px,0,this.#pz); this.#carGroup.rotation.y=this.#rotY; }
        if (this.#leanGroup) this.#leanGroup.rotation.z=this.#carLean;
        for (const w of this.#wheels) w.rotation.x+=this.#speed*6;
    }

    #updateCamera() {
        const D=7;
        this.#camera.position.set(
            this.#px-Math.sin(this.#rotY)*D, this.camHeight, this.#pz-Math.cos(this.#rotY)*D
        );
        this.#camera.lookAt(this.#px+Math.sin(this.#rotY)*4, 0.6, this.#pz+Math.cos(this.#rotY)*4);
    }
}

window.Circuito3D = Circuito3D;

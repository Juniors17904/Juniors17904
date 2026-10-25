# CLAUDE.md — Reglas del proyecto TurboRace

## Idioma
- Responder SIEMPRE en español en el texto de respuesta (lo que ve el usuario)
- El razonamiento interno (proceso de pensamiento) también en español
- Las descripciones de herramientas y comandos también en español
- **TODO el código fuente en español**: nombres de clases, archivos, métodos y atributos en español
- Solo se permite inglés en: APIs externas (Three.js, Supabase), nombres de librerías, acrónimos universales (HUD, SUV, F1)

## 🗂️ FORMA DE RESPONDER — acordada con el usuario el 2026-10-25

Vale para esta y para todas las conversaciones. El usuario tiene que ubicar rápido qué se hizo, qué se sugiere y qué decisión le toca.

**Cada respuesta va con títulos (`##`)**, solo las secciones que hagan falta y en este orden:

1. **Resumen** — una o dos líneas con lo más importante.
2. **Qué hice** — lo que cambió, en viñetas cortas.
3. **Problemas** — lo que falló o falta, dicho claro.
4. **Decisión que necesito de ti** — opciones con letra (A, B, C) y cuál se recomienda.
5. **Siguiente paso** — una sola pregunta al final.

**Reglas:**
- Frases cortas y palabras simples, sin jerga.
- Si no hay nada que decidir, esa sección no aparece.
- Si hay que preguntar o avisar algo, va en su propio título; nunca escondido dentro de un párrafo.
- La pregunta del final y el párrafo de conclusión de cada cambio de código (ver más abajo) siguen valiendo y entran en estas secciones.

## Reglas de código — CRÍTICAS
- NUNCA modificar, editar, crear ni borrar código sin que el usuario use palabras de acción explícitas:
  hazlo, impleméntalo, cámbialo, ponlo, agrégalo, modifica, arréglalo, crea, borra, actualiza, pushealo, commitea, aplícalo
- Si el usuario hace una pregunta → responder solo con texto, SIN tocar el código
- Si el usuario dice "no toques el código" → parar inmediatamente, solo texto
- Ante cualquier duda, preguntar antes de programar

## ⚠️ ARQUITECTURA POO — REGLA ABSOLUTA E INNEGOCIABLE ⚠️

### TODO lo que se cree DEBE ser una clase. Sin excepciones. Sin atajos.

- **PROHIBIDO**: funciones sueltas, objetos literales como sustituto de instancias, métodos estáticos cuando la entidad tiene identidad propia, números o strings para representar entidades del juego
- **OBLIGATORIO**: cada entidad nueva del juego es una clase instanciable con sus propios atributos y métodos

### Una clase = un archivo. Sin excepciones.
- **CADA CLASE VIVE EN SU PROPIO ARCHIVO**
- El nombre del archivo debe coincidir con el nombre de la clase en snake_case español
- Ejemplos: `TimonClasico` → `timon_clasico.js`, `CamaraSeguimiento` → `camara_seguimiento.js`
- **PROHIBIDO** definir más de una clase por archivo

### Nombres en español obligatorio
- Clases: `ControlTimon`, `CamaraSeguimiento`, `GestorAlertas`, `RenderizadorTimon`
- Archivos: `control_timon.js`, `camara_seguimiento.js`, `gestor_alertas.js`
- Métodos y atributos: `actualizar()`, `dibujar()`, `#velocidad`, `#angulo`
- **PROHIBIDO** nombres en inglés para entidades del proyecto

### Regla de oro — ¿Cómo sé si necesita ser una clase?
> Si la entidad tiene nombre propio, comportamiento y puede existir en múltiples variantes → **ES UNA CLASE**
> Ejemplos: `TimonClasico`, `TimonF1`, `PistaUrbana`, `CarroDeportivo`, `PowerUpTurbo`

## 🚨 PROHIBICIÓN ABSOLUTA: OBJETOS LITERALES COMO ENTIDADES 🚨

### NUNCA usar `{ }` para representar una entidad del juego. SIEMPRE una clase.

Este es el error más común y más grave del proyecto. Ocurre cuando se usa un objeto literal como atajo para configuración o datos de una entidad que debería ser una clase.

**¿Cómo detectarlo?** Si el objeto tiene nombre propio (una pista, un nivel, un obstáculo, una configuración específica) → ES UNA CLASE.

```javascript
// ❌ GRAVÍSIMO — objeto literal como entidad
window.PISTAS.ciudad = {
    nombre: 'Circuito Urbano',
    totalSegs: 300,
    tramos: [...],
};

// ✅ CORRECTO — clase instanciable en su propio archivo
// archivo: pistas/pista_ciudad.js
class PistaCiudad extends PistaConfig {
    constructor() {
        super();
        this.nombre    = 'Circuito Urbano';
        this.totalSegs = 300;
        this.tramos    = [...];
    }
}

// ❌ GRAVÍSIMO — configuración como objeto literal
const nivelConfig = { cielo: '#060a14', cesped: '#0a200a' };

// ✅ CORRECTO — clase con sus datos
class NivelCiudad extends Nivel {
    get cielo()  { return '#060a14'; }
    get cesped() { return '#0a200a'; }
}
```

### Checklist ANTES de escribir cualquier `{ }` con datos:
1. ¿Tiene nombre propio? → ES UNA CLASE
2. ¿Tiene variantes (ciudad, desierto, montaña)? → ES UNA JERARQUÍA DE CLASES
3. ¿Se accede por clave string (`PISTAS['ciudad']`)? → ES UNA CLASE registrada en un registro
4. ¿Tiene más de 2 propiedades? → PROBABLEMENTE ES UNA CLASE

### La única excepción permitida para `{ }`:
- Parámetros de configuración internos dentro de un método (variables locales temporales)
- Nunca como propiedad persistente de otra clase ni como `window.X`

### MVC obligatorio
- **Model** → datos y física (`Carro`, `Ruta`, `CarreraVueltas`). Sin lógica de vista.
- **View** → dibujo, cámaras, controles UI (`CamaraSeguimiento`, `ControlTimon`, `MapaDetallePista`). Sin lógica de negocio.
- **Controller** → orquesta Model y View (`aplicacion.js`, `controlador_carrera_solo.js`). Sin física ni dibujo directo.
- **Excepción permitida — visores 3D:** un visor de pista (subclase de `VisorBase`) puede crear su `Ruta` y su `Carro` y avanzar la física con paso fijo, porque la integración va atada al render. Las **reglas de negocio** (vueltas, tiempos, penalizaciones como el pasto) viven siempre en clases del modelo (`CarreraVueltas`, `Cronometro`…); el visor solo aplica lo que el modelo calcula.

### Escala del juego 3D
- **1 unidad = 1 metro** (PRD 009). Las medidas del carro (por tipo) y de la pista viven en `MedidasEscena` (`src/model/medidas_escena.js`); ahí también viven las medidas de los objetos (árbol, poste y señal de curva) y la distancia de postes y señales al centro de la pista (PRD 010), las del piso (PRD 012) las de la señalética: flechas de curva, arcos de meta y salida y cartel de aviso (PRD 011), y el radio mínimo del cierre de las pistas abiertas (PRD 014). Nadie repite esos números.

### POO obligatorio — checklist antes de escribir cualquier código nuevo
1. ¿Tiene nombre propio? → clase con ese nombre en español
2. ¿Tiene datos internos? → campos privados `#campo`
3. ¿Tiene comportamiento? → métodos de instancia (no estáticos)
4. ¿Hay variantes del mismo concepto? → subclases o clases separadas que comparten interfaz
5. ¿Solo se expone lo necesario? → getters para lo que otros necesitan leer
6. ¿Está en su propio archivo? → si no, moverla antes de continuar

---

## 📏 ANTI-MONOLITO

- **Máximo 400 líneas** por archivo `.js` o `.mjs` en `src/`, en la raíz y en `pruebas/`. No aplica a `docs/`.
- **Responsabilidad única:** si para describir lo que hace una clase hay que decir "y además…", se divide en dos clases.
- **Cada pantalla tiene su propio controlador** (por ejemplo, Jugar Solo → `ControladorCarreraSolo`). `Aplicacion` solo guarda el controlador de cada pantalla.
- **MVC sigue igual:** Model, View y Controller como dice la sección "MVC obligatorio".

No hay excepciones: `scripts/archivos_grandes_aceptados.txt` está vacío (B10 cerrado por el PRD 004).

Cualquier archivo de más de 400 líneas, nuevo o existente (también renombrado o copiado), bloquea el commit. El chequeo corre solo en cada commit (se instala con `npm install`) y también con `npm test`.

---

## 🏗️ HERENCIA Y ENCAPSULAMIENTO — REGLA OBLIGATORIA EN ESTE PROYECTO

### Cuándo crear una superclase (clase padre)

Siempre que existan **dos o más clases que comparten la misma interfaz pública**, deben tener una superclase común.

**Señales de que falta una superclase:**
- Dos clases tienen los mismos nombres de métodos (`activar`, `destruir`, `dibujar`, `actualizar`)
- El código que usa esas clases hace `if (tipo === 'x') ... else ...` para decidir cuál instanciar
- Se repite lógica similar en múltiples clases

```javascript
// ❌ MAL — sin superclase, el controller decide todo
if (modo === 'timon') {
    const t = new ControlTimon(); t.activar(cir);
} else {
    const t = new ControlTeclado(); t.activar(cir);
}

// ✅ BIEN — superclase define la interfaz, subclases la implementan
class ControlEntrada {           // superclase en su propio archivo
    activar(circuito) {}
    destruir() {}
}
class ControlTimon   extends ControlEntrada { ... }  // archivo: control_timon.js
class ControlTeclado extends ControlEntrada { ... }  // archivo: control_teclado.js

// El controller solo conoce la interfaz, no el tipo concreto:
this.#control = new ControlTimon();
this.#control.activar(circuito); // funciona igual con cualquier subclase
```

### Jerarquías activas en el proyecto (NO romper)

| Superclase | Subclases | Interfaz obligatoria |
|---|---|---|
| `ControlEntrada` | `ControlTimon`, `ControlTeclado` | `activar(cir)`, `destruir()` |
| `ConfigPista` | `ConfigPistaCiudad`, `ConfigPistaDesierto`, … | `nombre`, `tramos`, `totalSegs` |
| `Velocimetro` | `VelocimetroClasico`, `VelocimetroF1`, … | `dibujar(ctx, S, vel)` |
| `Timon` | `TimonClasico`, `TimonDeportivo`, … | `dibujar(ctx, S)` |
| `VisorBase` | `VisorTestdriveRecto`, `VisorTestdriveRuta`, `VisorCarreraUrbana`, `VisorDisenoPista`, `VisorCarreraSolo`, `Visor3D` (vista previa del garaje) | (utilidades Three.js) |
| `MinimapBase` | `MinimapaDisenoGeneral` | `setCircuito(cfg)`, `dibujar(ctx, …)` |
| `ControladorPantalla` | `ControladorInicio`, `ControladorAjustes`, `ControladorGaraje`, `ControladorGiroscopio`, `ControladorPistas`, `ControladorDisenoPistas`, `ControladorTestDrive3D`, `ControladorControles`, `ControladorVelocimetro`, `ControladorVistaConduccion`, `ControladorDisenoGeneral`, `ControladorDisenoObjetos` | `iniciar()`, `detener()`, `irA(id)` |
| `ControladorPantallaJuego` (hereda de `ControladorPantalla`) | `ControladorTestDrive3D`, `ControladorDisenoPistas` | `tieneVisor`, `ocupaPantallaJuego`, `cancelarArranque()` |
| `DestinoCircuito3D` | `DestinoCarreraUrbana`, `DestinoTestDriveRuta` | `claseVisor`, `titulo`, `origen` |
| `MapaConduccion` | `MinimapaCircuito3D`, `RecorridoCircuito3D`, `MinimapaTestDriveRecto`, `RecorridoTestDriveRecto` | `mostrar()`, `dibujar(visor)`, `visible` |
| `ParMapasConduccion` | `MapasCircuito3D`, `MapasTestDriveRecto` | `mostrar()`, `dibujar(visor)` |
| `PanelDatos` | `PanelDatosCircuito3D`, `PanelDatosTestDriveRecto`, `PanelDatosDisenoGeneral` | `mostrar()`, `actualizar()` |
| `Carro` | `CarroDeportivo`, `CarroSUV`, `CarroMusculo`, `CarroFormula`, `CarroPickup`, `CarroClasico` (las crea `RegistroCarros`) | `actualizar(dtMs)`, `constantes` (`ConstantesFisica`) |
| `Superficie` | `SuperficieAsfalto`, `SuperficiePiano`, `SuperficiePasto` (las entrega `DetectorSuperficie`) | `nombre`, `rozamiento`, `esPasto` |
| `ObjetoSolido` | `ArbolSolido`, `PosteSolido`, `SenalCurvaSolida`, `FlechaCurvaSolida` (los crea `FabricaObjetosSolidos`; los usa `DetectorChoques`) | `x`, `z`, `radio`, `tipo`, `alcance`, `puntoCercano(rectangulo)` (cada objeto calcula su propio choque contra el `RectanguloCarro`, PRD 011) |
| `TrazadoPiso` | `TrazadoPisoCurva`, `TrazadoPisoRecto` (los usa `ConstructorPisoPista`, PRD 012) | `largo`, `cerrado`, `puntoEn(s)`, `distanciasEntre(s0, s1)` |
| `PerfilCarro` | `PerfilCarroDeportivo`, `PerfilCarroSuv`, `PerfilCarroMuscle`, `PerfilCarroFormula`, `PerfilCarroPickup`, `PerfilCarroClasico` | `tipo`, `nombre`, `dibujar(ctx, color)` |
| `PilotoPC` | `PilotoPrudente`, `PilotoAgresivo`, `PilotoNovato`, `PilotoExperto` (los crea `CarreraConRivales`, PRD 013) | `nombre`, `tipoAuto`, `color`, `progreso`, `decidir(carro, ritmo)`, `ubicar(carro)` |

**Carpetas de jerarquías** — cada familia vive en su propia carpeta:
- `src/view/controles/` → `ControlEntrada` + subclases + timones
- `src/view/velocimetros/` → `Velocimetro` + subclases
- `src/view/minimapas/` → `MinimapBase` + subclases, y `MapaConduccion` / `ParMapasConduccion` + subclases
- `src/view/paneles/` → `PanelDatos` + subclases
- `src/view/pistas/` → visores de pista (uno por pantalla, todos independientes); `src/view/pistas/comun/` → piezas que comparten (`BuclePasoFijo`, `ConductorPasoFijo` y el piso de la pista del PRD 012: `ConstructorPisoPista` con sus ayudantes `TrazadoPiso`, `TrazadoPisoCurva`, `TrazadoPisoRecto`, `PuntoPiso` y `AcumuladorGeometria`)
- `src/model/carros/` → `Carro` + subclases, `ConstantesFisica` y `RegistroCarros`
- `src/model/superficies/` → `Superficie` + subclases y `DetectorSuperficie`
- `src/model/choques/` → `ObjetoSolido` + subclases, `FabricaObjetosSolidos`, `DetectorChoques`, `RectanguloCarro` y `PuntoChoque`
- `src/model/pilotos/` → `PilotoPC` + subclases y `Rival` (PRD 013)

### Visores de pista — REGLA: uno por pantalla, todos independientes

Cada pantalla que muestra un circuito 3D tiene su propia clase. Nunca dos pantallas comparten la misma instancia ni la misma clase si tienen identidad distinta.

| Pantalla | Clase | Archivo |
|---|---|---|
| Test Drive 3D → Simple | `VisorTestdriveRecto` | `pistas/visor_testdrive_recto.js` |
| Test Drive 3D → Con Ruta | `VisorTestdriveRuta` | `pistas/visor_testdrive_ruta.js` |
| Diseño de Pistas → Entrar | `VisorCarreraUrbana` | `pistas/visor_carrera_urbana.js` |
| 🎨 Diseño General | `VisorDisenoPista` | `pistas/visor_diseno_pista.js` |
| Jugar Solo (carrera 3D vertical) | `VisorCarreraSolo` | `pistas/visor_carrera_solo.js` |

**Regla: cada pantalla tiene su propio controlador.** El visor vive dentro de ese controlador y `Aplicacion` guarda el controlador en su campo privado (Jugar Solo: `#carreraSolo` → `ControladorCarreraSolo` → `VisorCarreraSolo`). Solo uno puede estar activo a la vez. Al cambiar de pantalla: `.detener()` → `null` → nueva instancia.

### Encapsulamiento — reglas estrictas

```javascript
// ❌ MAL — atributos públicos que otros modifican directo
class ControlTimon {
    steerInput = 0;      // cualquiera puede escribir esto
    circuito   = null;
}

// ✅ BIEN — privados con # y exposición controlada
class ControlTimon extends ControlEntrada {
    #steerInput = 0;     // solo esta clase lo modifica
    #circuito   = null;
    // nadie de afuera necesita leerlo → ni getter
}
```

**Reglas de encapsulamiento:**
- Todo estado interno → campo privado `#campo`
- Solo agregar getter si otra clase necesita **leer** el valor
- Solo agregar setter si otra clase necesita **escribir** el valor con validación
- NUNCA exponer campos privados solo por comodidad
- Si un campo lo escriben muchas clases → rediseñar, probablemente falta encapsulamiento

### Checklist ANTES de agregar cualquier nueva clase al proyecto

1. **¿Ya existe una superclase para esto?** → revisar la tabla de jerarquías de arriba
2. **¿Comparte interfaz con otra clase?** → si sí, ambas deben extender la misma superclase
3. **¿Los datos son privados (`#`)?** → si no, hacerlos privados
4. **¿Cada getter/setter tiene razón de existir?** → si nadie de afuera lo necesita, no lo expongas
5. **¿La subclase llama `super()` en el constructor?** → obligatorio al extender
6. **¿El archivo de la superclase se carga ANTES en el HTML?** → el orden de `<script>` importa

### Ejemplos correctos vs incorrectos

```javascript
// ❌ MAL — múltiples clases en un archivo
// carro.js contiene: Carro, CarroDeportivo, CarroSUV

// ✅ BIEN — cada clase en su archivo
// carro.js → class Carro
// carro_deportivo.js → class CarroDeportivo
// carro_suv.js → class CarroSUV

// ❌ MAL — nombre en inglés
class TimonRenderer { }   // archivo: timon_renderer.js

// ✅ BIEN — nombre en español
class RenderizadorTimon { }   // archivo: renderizador_timon.js

// ❌ MAL — switch/case con lógica de dibujo mezclada
switch(modelo) { case 'f1': drawF1Lines(ctx); break; }

// ✅ BIEN — cada clase se dibuja a sí misma
class TimonF1 { dibujar(ctx, S) { /* lógica F1 aquí */ } }
```

### CADA CLASE DEBE TENER SENTIDO PROPIO
- Sus atributos y métodos deben pertenecer naturalmente a ella
- Si un atributo describe a otra clase, DEBE vivir en esa clase
- Cada clase tiene UNA responsabilidad clara
- Los datos internos van como privados (`#campo`), solo se exponen públicamente los que otros objetos necesitan leer
- Antes de agregar código suelto, preguntar: ¿a qué clase pertenece esto?
- NUNCA poner en una clase atributos o lógica que pertenezcan a otra clase


- Al terminar cada respuesta, hacer exactamente 1 pregunta corta a modo de sugerencia sobre qué podría querer hacer el usuario a continuación
- La pregunta debe ser relevante al contexto actual del proyecto
- Formularla como opción concreta, no genérica

- Al terminar cada cambio de código, escribir un párrafo breve de conclusión con palabras simples explicando qué se hizo y por qué. Usar ejemplos de código básicos si ayuda a entender. El objetivo es que cualquier persona entienda el cambio sin saber programación avanzada.

- Desarrollar en la rama `claude/system-overview-Z6Zik`
- **SIEMPRE** al terminar cada cambio: hacer merge a `main` y push a `main`
- El sitio se sirve desde `main` (Vercel apunta a `main`)
- Flujo obligatorio después de cada commit: `git checkout main && git merge claude/system-overview-Z6Zik && git push origin main`
- Nunca dejar cambios solo en la rama de desarrollo sin mergear a main

## 📋 FORMA DE TRABAJAR CON PRD (forma corta)

Acordada con el usuario el 2026-10-24. Vale para todo PRD desde el PRD 010.

| Paso | Qué se hace | ¿Se le pregunta al usuario? |
|---|---|---|
| 1 | **Crear el PRD** con `docs/PRD_CREATOR.md`: Prompt 1 (decisiones), Prompt 2 (bloquearlas) y Prompt 3 (escribirlo). | **Sí:** el usuario aprueba las decisiones del Prompt 1. |
| 2 | **Revisión única del PRD**, con el Verificador PRD (revisores de contradicciones y de código). | **No.** Se corre sola apenas el PRD queda escrito. Los detalles se corrigen sin preguntar. Solo se pregunta si aparece un problema de fondo (cambia una decisión). |
| 3 | **Programar** el PRD con sus pruebas en `pruebas/`. | **No**, si el usuario ya pidió implementarlo. Si no lo pidió, se pregunta una vez: "¿lo programo?". |
| 4 | **Revisión después de programar**, con el Verificador PRD: revisor de código y revisor de pruebas. El de contradicciones solo si el cambio tocó otros PRD o `CLAUDE.md`. | **No.** Se corre sola apenas termina la programación. |
| 5 | **Corregir** lo que encuentren y correr `npm run test:todo`. | **No.** Solo se pregunta si una corrección cambia una decisión. |
| 6 | **Llevar a `main`.** | **No.** Se hace solo cuando `npm run test:todo` pasa entero. **Nunca antes**, ni aunque falte poco. |

**Reglas para no olvidarse:**
- Un paso marcado "No" **no se ofrece como pregunta** al final de la respuesta: se hace y se informa.
- Al terminar cada paso se dice en qué paso va el PRD (por ejemplo, "PRD 014: paso 2 de 6, revisión única corriendo").
- Si una prueba de navegador falla por carga lenta, primero se revisa que el servidor del puerto 8099 sea el del ejecutor (`npm run test:todo` levanta el suyo); no se deja otro servidor corriendo.

**Los acuerdos se escriben.** Todo acuerdo de trabajo con el usuario se escribe en el repositorio (este archivo, `docs/PRD_CREATOR.md`, las skills o `docs/LECCIONES_APRENDIDAS.md`). Lo que queda solo en el chat, las otras sesiones no lo saben.

---

## 📸 CAPTURAS DE PANTALLA — SISTEMA Y USO

### Problema: Three.js se ve negro sin `--use-gl=angle`

Three.js usa `MeshStandardMaterial` (materiales PBR — físicamente basados). Estos materiales requieren el **pipeline de GPU real** para renderizar luz, sombras y texturas.

**El error común**: usar `--use-gl=swiftshader` (o no pasar ningún flag, que cae en SwiftShader como fallback). SwiftShader es un renderizador por software que **NO soporta PBR**. Resultado: toda la escena Three.js se ve negra — el canvas existe, pero nada se renderiza visualmente.

**La solución**: `--use-gl=angle` hace que Chrome use ANGLE para traducir WebGL → OpenGL real a través de Xvfb. Esto activa el pipeline completo de GPU y Three.js renderiza correctamente.

```
❌ --use-gl=swiftshader  →  Three.js negro (software renderer, sin PBR)
✅ --use-gl=angle        →  Three.js correcto (OpenGL real vía ANGLE + Xvfb)
```

También es obligatorio `headless: false` + Xvfb. Con `headless: true` Chrome usa una ruta diferente que no pasa por ANGLE correctamente.

### Importmap patch — por qué es necesario

El HTML del juego carga Three.js desde CDN (`cdn.jsdelivr.net`). En el entorno de capturas **se bloquean todas las URLs `https://`** para evitar dependencias externas. El script parcha el importmap en el HTML al vuelo para apuntar a los módulos locales en `node_modules/three/`.

La detección del HTML se hace por `content-type: text/html` (NO por `url.endsWith('.html')`), porque la URL raíz es `/` y el servidor responde con `Content-Type: text/html`.

### Script `captura.mjs` — cómo usar

**Requisitos previos:**
1. Tener Xvfb instalado: `apt install xvfb`
2. Tener Playwright en `/opt/node22/lib/node_modules/playwright`
3. Tener Three.js local: `npm install` en la raíz del proyecto
4. Tener el servidor HTTP corriendo: `python3 -m http.server 8099`

**Comando para tomar capturas:**
```bash
# Diseño General (portrait + landscape → /tmp/dg_portrait.png y /tmp/dg_landscape.png)
xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" node captura.mjs diseno-general

# Diseño Objetos (portrait + landscape → /tmp/do_portrait.png y /tmp/do_landscape.png)
xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" node captura.mjs diseno-objetos
```

**Si Xvfb falla con "failed to start":**
```bash
rm -f /tmp/.X*-lock   # eliminar lock files de sesiones anteriores
```

**Parámetros del script:**
- `ESPERA = 12000` ms — tiempo que se espera para que Three.js cargue el modelo GLB y renderice
- Portrait: 390×844 px, Landscape: 844×390 px
- Navegación automática: Home → Garage (`#btn-garage`) → pantalla destino

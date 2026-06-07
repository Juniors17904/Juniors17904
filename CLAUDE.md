# CLAUDE.md — Reglas del proyecto TurboRace

## Idioma
- Responder SIEMPRE en español en el texto de respuesta (lo que ve el usuario)
- El razonamiento interno (proceso de pensamiento) también en español
- Las descripciones de herramientas y comandos también en español
- **TODO el código fuente en español**: nombres de clases, archivos, métodos y atributos en español
- Solo se permite inglés en: APIs externas (Three.js, Supabase), nombres de librerías, acrónimos universales (HUD, SUV, F1)

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
- **Model** → datos y física (`Carro`, `Ruta`, `MovimientoLibre`). Sin lógica de vista.
- **View** → dibujo, cámaras, controles UI (`CamaraSeguimiento`, `ControlTimon`, `Minimapa`). Sin lógica de negocio.
- **Controller** → orquesta Model y View (`aplicacion.js`, `juego.js`). Sin física ni dibujo directo.

### POO obligatorio — checklist antes de escribir cualquier código nuevo
1. ¿Tiene nombre propio? → clase con ese nombre en español
2. ¿Tiene datos internos? → campos privados `#campo`
3. ¿Tiene comportamiento? → métodos de instancia (no estáticos)
4. ¿Hay variantes del mismo concepto? → subclases o clases separadas que comparten interfaz
5. ¿Solo se expone lo necesario? → getters para lo que otros necesitan leer
6. ¿Está en su propio archivo? → si no, moverla antes de continuar

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
| `VisorBase` | `VisorTestdriveRecto`, `VisorTestdriveRuta`, `VisorCarreraUrbana`, `VisorDisenoPista` | (utilidades Three.js) |
| `MinimapBase` | `MinimapaConductor`, `MinimapaDisenoGeneral` | `setCircuito(cfg)`, `dibujar(ctx, …)` |

**Carpetas de jerarquías** — cada familia vive en su propia carpeta:
- `src/view/controles/` → `ControlEntrada` + subclases + timones
- `src/view/velocimetros/` → `Velocimetro` + subclases
- `src/view/minimapas/` → `MinimapBase` + subclases
- `src/view/pistas/` → visores de pista (uno por pantalla, todos independientes)

### Visores de pista — REGLA: uno por pantalla, todos independientes

Cada pantalla que muestra un circuito 3D tiene su propia clase. Nunca dos pantallas comparten la misma instancia ni la misma clase si tienen identidad distinta.

| Pantalla | Clase | Archivo |
|---|---|---|
| Test Drive 3D → Simple | `VisorTestdriveRecto` | `pistas/visor_testdrive_recto.js` |
| Test Drive 3D → Con Ruta | `VisorTestdriveRuta` | `pistas/visor_testdrive_ruta.js` |
| Diseño de Pistas → Entrar | `VisorCarreraUrbana` | `pistas/visor_carrera_urbana.js` |
| 🎨 Diseño General | `VisorDisenoPista` | `pistas/visor_diseno_pista.js` |

`Aplicacion` guarda cada instancia en su propio campo privado (`#td3d`, `#cir3d`, `#visorDG`, `#visorDO`). Solo uno puede estar activo a la vez. Al cambiar de pantalla: `.detener()` → `null` → nueva instancia.

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

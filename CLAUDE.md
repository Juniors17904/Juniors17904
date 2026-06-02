# CLAUDE.md — Reglas del proyecto TurboRace

## Idioma
- Responder SIEMPRE en español en el texto de respuesta (lo que ve el usuario)
- El razonamiento interno (proceso de pensamiento) también en español
- Las descripciones de herramientas y comandos también en español
- Solo se permite inglés en: nombres de variables, funciones, y código fuente donde ya existe convención en inglés

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

### Regla de oro — ¿Cómo sé si necesita ser una clase?
> Si la entidad tiene nombre propio, comportamiento y puede existir en múltiples variantes → **ES UNA CLASE**
> Ejemplos: `TimonClasico`, `TimonF1`, `PistaUrbana`, `CarroDeportivo`, `PowerUpTurbo`

### MVC obligatorio
- **Model** → datos y física (`Carro`, `Ruta`, `MovimientoLibre`, `TimonClasico`). Sin lógica de vista.
- **View** → dibujo, cámaras, controles UI (`CamaraChase`, `TimonControl`, `Minimap`). Sin lógica de negocio.
- **Controller** → orquesta Model y View (`app.js`, `game.js`). Sin física ni dibujo directo.

### POO obligatorio — checklist antes de escribir cualquier código nuevo
1. ¿Tiene nombre propio? → clase con ese nombre
2. ¿Tiene datos internos? → campos privados `#campo`
3. ¿Tiene comportamiento? → métodos de instancia (no estáticos)
4. ¿Hay variantes del mismo concepto? → subclases o clases separadas que comparten interfaz
5. ¿Solo se expone lo necesario? → getters para lo que otros necesitan leer

### Ejemplos correctos vs incorrectos

```javascript
// ❌ MAL — número como modelo de timón
TimonRenderer.dibujar(ctx, S, 2); // ¿qué es 2?

// ✅ BIEN — objeto con identidad propia
const timon = new TimonF1();
timon.dibujar(ctx, S);

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


- Al terminar cada respuesta, hacer 1 a 3 preguntas cortas a modo de sugerencia sobre qué podría querer hacer el usuario a continuación
- Las preguntas deben ser relevantes al contexto actual del proyecto
- Formularlas como opciones concretas, no genéricas

- Desarrollar en la rama `claude/system-overview-Z6Zik`
- **SIEMPRE** al terminar cada cambio: hacer merge a `main` y push a `main`
- El sitio se sirve desde `main` (Vercel apunta a `main`)
- Flujo obligatorio después de cada commit: `git checkout main && git merge claude/system-overview-Z6Zik && git push origin main`
- Nunca dejar cambios solo en la rama de desarrollo sin mergear a main

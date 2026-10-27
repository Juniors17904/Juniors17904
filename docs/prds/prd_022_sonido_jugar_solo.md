# PRD 022 — Sonido en Jugar Solo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — programado |
| Fecha | 2026-10-27 |
| Backlog | B6 (`docs/BACKLOG.md`) |
| Depende de | PRD 001 (carrera), PRD 018 ("Preparar carrera") y PRD 020 (récords) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Suena solo Jugar Solo. Las otras pantallas siguen en silencio. |
| D2 | Alcance | Suenan: el **motor del jugador** (el tono sube con la velocidad), la **cuenta 3-2-1** (un pitido por número y uno más agudo en "¡YA!"), las **llantas** (chirrido al derrapar o frenar fuerte), los **choques** (golpe seco contra un árbol, un poste o un rival) y la **meta** (fanfarria corta; con récord nuevo, además una campanita). |
| D3 | Alcance | Los motores de los rivales no suenan. |
| D4 | Alcance | La música queda fuera de este PRD. |
| D5 | Usuarios | Un botón 🔊/🔇 en la carrera y en "Preparar carrera". Se recuerda lo elegido; al principio el sonido está prendido. No tapa el mapa, el velocímetro ni los controles. |
| D6 | Usuarios | Volumen moderado. Todo se calla al salir de la carrera, al aparecer el resultado (menos la fanfarria y la campanita) y cuando la pantalla del celular se apaga o se cambia de app. |
| D7 | Técnico | Sin archivos de audio: todos los sonidos los genera el navegador, así que no hay nada que descargar y funciona sin internet. El sonido arranca con el toque en "¡Correr!" (los navegadores no dejan sonar sin un toque del jugador). |
| D8 | Técnico y dominio | Clases de la vista en `src/view/sonidos/`: una superclase para los sonidos y una clase por sonido; una clase que reconoce, con lo que ya se ve de la carrera (velocidad, pedales, dirección, cuenta y meta), cuándo hay un choque o un derrape; una clase que maneja todos los sonidos de la carrera (el controlador solo la avisa); una clase con el audio de la partida y su silencio (`AudioJuego`, que usa la que recuerda 🔊/🔇; `Aplicacion` solo la crea y se la pasa a las dos pantallas), y una para los botones 🔊/🔇. El modelo no cambia y `VisorCarreraSolo` no crece. Pruebas en Node con un audio de mentira y en navegador real, en vertical y en horizontal. **Reemplaza (solo para el sonido y su botón):** "sonido de choque (B6)" del Out of scope del PRD 008, "sonido (B6)" del Out of scope del PRD 013 y "los sonidos (B6)" del Out of scope del PRD 019; `ControladorCarreraSolo` en las listas de los PRD 002, 005 y 016, y "los elementos dibujados en 2D" de la lista del PRD 002; `Aplicacion` en la lista del PRD 005, y la D5 y el RF-01 del PRD 004 (`Aplicacion` también crea la clase del sonido); "la cuenta 3-2-1 y el resultado" de la lista del PRD 006 y "el resultado" de la del PRD 008; "el comportamiento y el aspecto del juego" de los PRD 004 y 005; la elección de "Preparar carrera" en la lista del PRD 020; y el lugar del botón (se suma sin mover nada): la D10 del PRD 001, la D4, la D5, el RF-01, el RF-03 y "el diseño vertical" de la lista del PRD 015, "los controles del jugador" de la lista del PRD 013, y los diseños y los controles en las listas de los PRD 017, 018, 019, 020 y 021. Los estilos van en `index.html` o en las clases de la vista; `src/style.css` no cambia. `CLAUDE.md` suma la jerarquía de los sonidos y su carpeta. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Jugar Solo no tiene ningún sonido: no se oye el motor, ni la cuenta, ni la meta. La carrera se siente vacía y cuesta darse cuenta de un choque o de cuándo arranca.

## 2. Objetivo
Que la carrera se oiga: motor, cuenta, llantas, choques y meta, con un botón para silenciar.

## 3. Público objetivo y usuarios
- **Jugador:** oye cuándo arrancar, cuánto acelera y cuándo choca.
- **Jugador en un lugar silencioso:** apaga el sonido con un toque y queda apagado la próxima vez.

## 4. Alcance
**In scope:** D1 a D8.

**Out of scope:** la música (D4), los motores de los rivales (D3), el volumen por separado de cada sonido, el sonido de las otras pantallas y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los choques, los rivales, las vueltas, el cronómetro y los récords (PRD 006 a 014 y 018 a 020): el sonido solo escucha lo que ya pasa.
- `VisorCarreraSolo` (no crece) y `HudCarrera`.
- Los diseños vertical y horizontal, los controles, el minimapa y el velocímetro (PRD 015 a 017 y 021), salvo sumar el botón sin moverlos.
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Sonido de la carrera | Un sonido que el navegador genera en el momento (motor, pitido, chirrido, golpe, fanfarria, campanita). |
| Silencio | Estado del botón 🔊/🔇: si está en 🔇, no suena nada. |

## 6. Requerimientos funcionales
- **RF-01 (D2, D7):** al tocar "¡Correr!" el motor empieza a sonar; su tono sube cuando el carro va más rápido y baja cuando va más lento.
- **RF-02 (D2):** en la cuenta suena un pitido en "3", "2" y "1", y uno más agudo en "¡YA!".
- **RF-03 (D2):** al frenar fuerte o derrapar a buena velocidad suenan las llantas; al dejar de hacerlo, se callan.
- **RF-04 (D2):** al chocar contra un árbol, un poste o un rival suena un golpe seco, una vez por choque.
- **RF-05 (D2, D6):** al cruzar la meta se calla todo y suena una fanfarria corta; si además es récord nuevo (PRD 020), suena una campanita.
- **RF-06 (D3):** los motores de los rivales no suenan.
- **RF-07 (D5):** el botón 🔊/🔇 se ve en la carrera y en "Preparar carrera", en 390×844 y en 844×390, sin tapar el mapa, el velocímetro, la barra de arriba ni los controles.
- **RF-08 (D5):** con 🔇 no suena nada; con 🔊 vuelve a sonar. Lo elegido se recuerda después de recargar; la primera vez el sonido está prendido.
- **RF-09 (D6):** al salir de la carrera (Menú o atrás), al ocultar la página o al pasar a otra app, todo se calla; al volver a la página con la carrera todavía en curso, el motor vuelve.
- **RF-10 (D1):** en las otras pantallas no suena nada.
- **RF-11 (D7):** si el navegador no permite sonido, el juego funciona igual y sin errores.
- **RF-12 (D8):** los PRD de D8 tienen su nota; `CLAUDE.md` suma la jerarquía de los sonidos y su carpeta; el backlog enlaza B6 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D8), reglas del proyecto:** cada sonido es una clase de la vista en su archivo, con una superclase común; nada de objetos literales como entidades. Se cumple `CLAUDE.md`.
- **RNF-02 (D8), MVC:** el sonido solo escucha lo que la carrera ya muestra; el modelo no cambia.
- **RNF-03 (D8), anti-monolito:** `VisorCarreraSolo` no crece y ningún archivo pasa de 400 líneas.
- **RNF-04 (D8), pruebas:** en Node, con un audio de mentira, qué suena en cada momento y que el silencio calla todo; en navegador real (390×844 y 844×390), que los sonidos se crean al correr, el botón y que se recuerda, con capturas.
- **RNF-05 (D8), entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. La carrera se oye: motor, cuenta, llantas, choques y meta.
2. El botón 🔊/🔇 calla todo y se recuerda.
3. Nada suena fuera de la carrera.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **iPhone en modo silencio:** algunos celulares no suenan si tienen el interruptor de silencio puesto; no se puede cambiar desde una página web.
- **Choques y derrapes reconocidos desde afuera:** como el modelo no cambia, el choque se reconoce por una frenada brusca que no viene del pedal, y el derrape por frenar fuerte o girar a fondo a buena velocidad; puede haber algún golpe o chirrido de más o de menos.
- **Pruebas:** en las pruebas no se puede escuchar; se comprueba qué sonidos se piden y cuándo.

### Historial
- **v1** (2026-10-27): primera versión, con las 8 decisiones aprobadas por el usuario (opción A).
- **v2** (2026-10-27): revisión única (forma corta). D8 completa (PRD 001 D10, 002, 004 D5 y RF-01, 005, 006, 008, 015, 017 a 021) y nombra la clase que maneja los sonidos y la que recuerda el silencio; la dirección entra en lo que se escucha; RF-05 calla todo en la meta; RF-09 solo con la carrera en curso; pruebas en Node.
- **v3** (2026-10-27): programado. D8 nombra `AudioJuego` y los botones; suma la D5 y el RF-03 del PRD 015, los controles del PRD 013 y la nota del PRD 021 (ya en `main`); sin `ControladorInicio` (no cambió).

# PRD 026 — Pantallas con estilo de juego de carreras (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — programado y en `main` |
| Fecha | 2026-10-29 |
| Backlog | B27 (`docs/BACKLOG.md`) |
| Depende de | PRD 015 (vertical y horizontal), PRD 016 y 021 (controles y pedales), PRD 018 ("Preparar carrera"), PRD 020 (récords) y PRD 022 (sonido). El PRD 025 es de la otra sesión (impares). |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | El estilo nuevo ("A · Juego de carreras moderno", elegido por el usuario en la página de muestra) vale para **todas las pantallas de menú**: Inicio, Preparar carrera, Ajustes, el garaje y su vista previa, Pistas y su detalle, Controles y las galerías de timón, pedales y velocímetro, Vista de conducción, Giroscopio y el selector de Test Drive. Los textos sobre la carrera (la cuenta, la barra de arriba del HUD, el resultado y su récord) toman la letra y los colores nuevos. Las pantallas 3D de herramientas (Diseño General, Diseño de Objetos y Test Drive en marcha) quedan como están. |
| D2 | Usuarios | **El aspecto:** fondo de asfalto oscuro, tarjetas gris oscuro, un color de acento **naranja** para lo elegido y los botones principales, y **amarillo** para "¡Correr!" y los récords (las mayúsculas las pone el estilo: el texto de los botones no cambia); títulos y botones con letra gruesa, condensada y en cursiva (Saira Condensed) y texto en Saira. Todo botón mide al menos 44 px de alto y todo texto se lee bien (contraste 4,5:1). |
| D3 | Usuarios | **Inicio:** arriba el título grande "TURBO RACE" sobre franjas en diagonal, y el carro elegido dibujado de lado en grande con el color elegido (cambia al tocar otro color). "JUGAR SOLO" es el botón más grande, inclinado como en un juego de carreras. Nombre, color y control siguen en la pantalla, más compactos; ⚙, ↺, "Multijugador" y "Únete" siguen igual que hoy ("Próximamente", PRD 002). |
| D4 | Usuarios | **Preparar carrera:** las pistas se ven como tarjetas grandes, cada una con su color (lo pone el estilo según la clave de la pista; `ConfigPista*` no cambia); la elegida resalta en naranja y su récord se ve en amarillo. Modo, rivales y dificultad son botones grandes, y "¡CORRER!" es un botón amarillo grande e inclinado. |
| D5 | Usuarios | **Ajustes** se ordena en dos grupos con título: **"Tu juego"** (diseño de carro, botones y pedales, velocímetro, vista de conducción y verificar giroscopio) y **"Taller"** (diseño de pista, Test Drive 3D, diseño general y diseño de objetos). Los botones y lo que abren no cambian. |
| D6 | Técnico | Los estilos nuevos van en un archivo nuevo, `src/tema_carreras.css`, que se carga después de `src/style.css` (este no cambia). Para el carro de Inicio se crea la clase de vista `PortadaCarro`, que lo dibuja con los perfiles que ya existen (`PerfilCarro`); vive en `ControladorInicio`, y `Aplicacion` solo le avisa a ese controlador cuando se vuelve a Inicio, como ya hace con "Preparar carrera". La letra y los colores del texto de la carrera los ponen `HudCarrera` y `AvisoRecord`. Los ids, los textos que ya existen y lo que hace cada botón no cambian, así las pruebas que ya existen siguen valiendo. |
| D7 | Técnico | **No cambian:** los dibujos en canvas (velocímetros, timones, minimapas, perfiles de carros), salvo la letra y los colores del texto de la barra del HUD; las escenas 3D; el tamaño y el lugar de los controles de carrera, del HUD y del botón 🔊 de la carrera; los estilos de pedales (PRD 016 y 021); ni las pantallas 3D de herramientas. Pruebas en navegador real, en 390×844 y 844×390, con capturas. *(v2: opción recomendada, acuerdo del 2026-10-29)* |
| D8 | Dominio | **Reemplaza (solo el aspecto de las pantallas de menú y la letra y los colores del texto de la carrera):** "el comportamiento y el aspecto del juego" de los PRD 004 y 005; `index.html` y las reglas de `src/style.css` en las listas de los PRD que las protegen (las reglas de `src/style.css` no se tocan: el tema nuevo las cubre desde otro archivo); "las otras pantallas … y el garaje" de los PRD 015 a 018, 020, 021 y 022; el aspecto de "Preparar carrera" (PRD 018), del récord (PRD 020), de las galerías de pedales y de velocímetros (PRD 021, D2 y su lista) y del botón 🔊 de "Preparar carrera" (PRD 022), y "los estilos van en `index.html` o en las clases de la vista" de los PRD 020 y 022; `HudCarrera`, la cuenta y el resultado en las listas de los PRD 002, 006, 008 a 012, 014, 017, 019 y 022 (solo letra y colores); `ControladorInicio` (PRD 005) y `Aplicacion` (PRD 004, D5 y RF-01: solo avisa a Inicio al volver). `CLAUDE.md` nombra la clase nueva. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El usuario ve las pantallas anticuadas: todas son cajas oscuras con borde morado, sin carro ni pista a la vista, con letra chica y muy separada, y Ajustes mezcla lo del jugador con herramientas de prueba.

## 2. Objetivo
Que el juego se vea como un juego de carreras moderno y se lea fácil en el celular.

## 3. Público objetivo y usuarios
- **Jugador en el celular:** entiende de un vistazo qué tocar para correr.

## 4. Alcance
**In scope:** D1 a D8.

**Out of scope:** imágenes reales de las pistas, el carro en 3D en Inicio, animaciones de entrada, cambiar los íconos, cambiar lo que hace cada botón, y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- `src/style.css`, los ids y los textos que ya existen en `index.html`, y lo que hace cada botón.
- Los dibujos en canvas, las escenas 3D, la física, los rivales, las vueltas, los récords guardados y el sonido (PRD 006 a 014, 019, 020, 022 y 024).
- El tamaño y el lugar de los controles de carrera y los estilos de pedales (PRD 015, 016 y 021).
- Las pantallas 3D de herramientas, salvo los colores que heredan sus botones (D7).

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Tema de carreras | El conjunto de colores, letras y formas del estilo A. |
| Portada | El carro grande que se ve en Inicio. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** en todas las pantallas de D1, el fondo es asfalto oscuro y los títulos y botones usan la letra condensada; no queda el morado de antes en botones ni bordes.
- **RF-02 (D2):** lo elegido (color, control, modo, pista, rivales, dificultad, timón, pedales, velocímetro y carro) se marca con el acento naranja.
- **RF-03 (D3):** Inicio muestra "TURBO RACE" y el carro elegido de lado en grande, con el color elegido; al tocar otro color o volver del garaje con otro carro, el dibujo cambia.
- **RF-04 (D3):** "JUGAR SOLO" es el botón más grande de Inicio y está inclinado.
- **RF-05 (D4):** en Preparar carrera, cada pista es una tarjeta con su propio color; la elegida resalta en naranja y el récord se ve en amarillo.
- **RF-06 (D4):** "¡CORRER!" es amarillo, grande e inclinado.
- **RF-07 (D5):** Ajustes muestra los títulos "Tu juego" y "Taller", cada uno con sus botones de D5, y cada botón abre lo mismo que antes.
- **RF-08 (D2):** todo botón de las pantallas de D1 mide al menos 44 px de alto, y el texto tiene contraste 4,5:1 o más con su fondo.
- **RF-09 (D1, D7):** en 390×844 y 844×390 ninguna pantalla de D1 se corta ni se desplaza de lado; en horizontal, la que no entra se puede desplazar hacia abajo.
- **RF-10 (D1, D7):** la cuenta, la barra de arriba del HUD, el resultado y su récord usan la letra y los colores nuevos, sin cambiar su lugar ni el de los controles.
- **RF-11 (D8):** los PRD de D8 tienen su nota; `CLAUDE.md` nombra `PortadaCarro`; el backlog enlaza B27 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6), reglas del proyecto:** `PortadaCarro` es una clase de la vista en su archivo; los estilos van en `src/tema_carreras.css`. Se cumple `CLAUDE.md`.
- **RNF-02 (D6), MVC:** el controlador de Inicio solo le pide a la vista que dibuje el carro con el tipo y el color del estado; `Aplicacion` no dibuja nada.
- **RNF-03 (D6), anti-monolito:** ningún archivo `.js` pasa de 400 líneas.
- **RNF-04 (D7), pruebas:** en navegador real (390×844 y 844×390), cada pantalla de D1 con capturas, colores, letra, botones de 44 px, contraste y sin desplazamiento de lado; las pruebas que ya existen siguen pasando.
- **RNF-05 (D8), entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Inicio y Preparar carrera se ven como en la opción A de la página de muestra.
2. Todas las pantallas de menú usan el mismo tema.
3. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Sin internet:** si no carga la letra de Google Fonts, se usa una letra condensada del sistema; el diseño no se rompe.
- **Pantallas largas en horizontal:** varias (Inicio, Ajustes, Controles, galerías) se desplazan hacia abajo.

### Historial
- **v1** (2026-10-29): primera versión. El usuario eligió la opción A en la página de muestra y pidió elegir siempre la opción recomendada en las demás decisiones.
- **v2** (2026-10-29): revisión única (forma corta). Problema de fondo resuelto con la opción recomendada: el texto de la barra del HUD (canvas) también toma la letra y los colores nuevos, con `HudCarrera` y `AvisoRecord`. Detalles: D8 completa (las otras pantallas y el garaje, galería de velocímetros, HUD y resultado en sus listas, botón 🔊, `Aplicacion` y `ControladorInicio`); "los textos que ya existen"; las mayúsculas las pone el estilo; Inicio conserva ⚙, ↺, Multijugador y Únete; el color de cada pista lo pone el estilo; las pantallas 3D de herramientas quedan como están.
- **v3** (2026-10-29): programado. `src/tema_carreras.css` (con `:where` para dejar fuera las pantallas 3D de herramientas), `PortadaCarro`, Ajustes en dos grupos y la letra y los colores del texto de la carrera en `HudCarrera` y `AvisoRecord` (sin cambiar su tamaño). Inicio y "Preparar carrera" van en dos columnas en horizontal y más compactos, para que sigan entrando sin desplazarse (PRD 002 RNF-03, PRD 018 RF-12 y PRD 020 RF-09).

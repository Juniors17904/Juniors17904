# PRD 004 — Dividir los monolitos (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — implementado y verificado (Verificador PRD ✅), con pruebas en `pruebas/` |
| Fecha | 2026-10-22 |
| Backlog | B10 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se dividen los 4 archivos grandes (`aplicacion.js`, `visor_carrera_solo.js`, `garaje.js`, `visor_diseno_pista.js`) en fases, empezando por `aplicacion.js`. |
| D2 | Alcance | No cambia ninguna funcionalidad: solo se reordena el código por dentro. |
| D3 | Usuarios | El jugador no nota nada: las pantallas, los botones y el comportamiento son los mismos. |
| D4 | Usuarios | Se comprueba con las pruebas actuales en verde y con capturas de cada pantalla antes y después. |
| D5 | Dominio | `Aplicacion` solo navega entre pantallas y guarda un controlador por pantalla. *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)* |
| D6 | Dominio | **Cada pantalla de `index.html` tiene su controlador** (v2): `ControladorInicio`, `ControladorAjustes`, `ControladorGaraje` (garaje y vista previa), `ControladorGiroscopio`, `ControladorPistas` (lista y detalle de pista), `ControladorDisenoPistas`, `ControladorTestDrive3D` (selector y carrera), `ControladorControles` (controles y diseño del timón), `ControladorVelocimetro`, `ControladorVistaConduccion`, `ControladorDisenoGeneral`, `ControladorDisenoObjetos`, `ControladorCarreraSolo` (ya existe) y `ControladorModo2D` (crear, unirse, espera, juego y resultado 2D, que siguen ocultos por el PRD 002). *(Según el PRD 005, D9, `ControladorModo2D` se borra.)* |
| D7 | Técnico | `Garaje` deja de ser todo `static`: pasa a ser una clase instanciable, dividida en partes con una sola responsabilidad. |
| D8 | Técnico | B10 se cierra cuando ningún archivo pasa de 400 líneas, `scripts/archivos_grandes_aceptados.txt` queda vacío y `CLAUDE.md` no tiene excepciones temporales. |
| D9 | Dominio | **Reemplaza** (v2): en las listas de lo que no se modifica de los PRD 001 y 002, quedan fuera `VisorDisenoPista`, `VisorCarreraSolo` y `Garaje`, solo para reordenarlos por dentro. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El PRD 003 prohibió crear monolitos nuevos, pero dejó 4 archivos grandes con permiso temporal. `aplicacion.js` tiene 1516 líneas y maneja casi todas las pantallas. Solo Jugar Solo tiene un controlador propio. Por eso cualquier cambio en esas partes es lento y arriesgado.

## 2. Objetivo
Que todos los archivos cumplan la regla anti-monolito sin excepciones y que cada pantalla tenga su propio controlador, sin que el jugador note nada.

## 3. Público objetivo y usuarios
- **Desarrollador y agentes:** trabajan con archivos chicos, cada uno con una sola tarea.
- **Jugador:** no nota nada.

## 4. Alcance
**In scope:**
- Dividir los 4 archivos grandes.
- Crear los controladores de D6.
- Convertir `Garaje` en una clase instanciable.
- Vaciar la lista de archivos grandes aceptados.
- Quitar las excepciones temporales de `CLAUDE.md`.
- Poner las notas de D9 en los PRD 001 y 002.
- Agregar las pruebas y capturas.

**Out of scope:** las ideas B2 a B9 del backlog y todo lo que figura en la lista única de abajo.

**Lista única de lo que NO se modifica:**
- El comportamiento y el aspecto del juego. *(El manejo cambia según el PRD 006, D8; el manejo y el garaje según el PRD 007, D8; el pasto y los choques según el PRD 008, D8.)* *(El tamaño del carro, la cámara y el piano de la recta cambian según el PRD 009, D12.)* *(El aspecto del árbol, el poste y la señal cambia según el PRD 010, D9.)* *(La señalética cambia según el PRD 011, D11.)* *(El piso cambia según el PRD 012, D11.)* *(Los rivales en Jugar Solo se agregan según el PRD 013, D9.)* *(El cierre de las pistas abiertas cambia según el PRD 014, D11.)* *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(El minimapa de Jugar Solo se suma según el PRD 017, D8.)* *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(El giro cambia con el pedal según el PRD 019, D9.)* *(Cambia según el PRD 020, D7: récords por pista.)* *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)* *(Los controles cambian según el PRD 021, D9: estilos de timón y pedales.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*
- Las decisiones de los PRD 001, 002 y 003 (solo se agregan las notas de D9). *(Reemplazado por PRD 005, D9.)* *(Del PRD 001, la D8 cambia según el PRD 006, la D4 se amplía según el PRD 007 y la D3 cambia según el PRD 008.)*
- `src/style.css`. *(Solo agregar estilos de las barras del garaje, según el PRD 007, D8.)* *(Solo agregar reglas de la posición y la tabla, según el PRD 013, D9.)* *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(`src/style.css` —solo los estilos de los pedales y de las galerías— cambia según el PRD 021, D9.)*
- `CarreraVueltas`, `Cronometro` y `MuestraRuta`. *(`CarreraVueltas` sale según el PRD 008, D8.)*
- `Modo` y sus subclases, y `ModosDisponibles`. *(Reemplazado por PRD 005, D9.)*
- El motor 2D (`Juego`, `Pista`, `Carro2D` y sus renderizadores). *(Reemplazado por PRD 005, D9: el motor 2D se borra.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Monolito | Archivo de más de 400 líneas, o clase que tiene más de una responsabilidad. |
| Controlador de pantalla | Clase que maneja una sola pantalla. `Aplicacion` la crea al entrar y la detiene al salir. |
| Navegación | Pasar de una pantalla a otra, incluidos los botones atrás y adelante. Es lo único que queda en `Aplicacion`. |
| Fase | Un archivo grande ya dividido y probado, antes de pasar al siguiente. |

## 6. Requerimientos funcionales
- **RF-01 (D5):** `Aplicacion` solo navega entre pantallas y guarda un controlador por pantalla. *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- **RF-02 (D6):** cada pantalla de `index.html` tiene el controlador que le asigna D6. *(Según el PRD 005, D9, sin `ControladorModo2D`.)*
- **RF-03 (D3, D4):** cada pantalla se ve igual que antes. Las capturas de antes y después coinciden en vertical y en horizontal.
- **RF-04 (D3):** los botones atrás y adelante funcionan igual en todas las pantallas, incluida la redirección del PRD 002.
- **RF-05 (D1):** `visor_carrera_solo.js` y `visor_diseno_pista.js` quedan por debajo de 400 líneas, y la carrera y Diseño General funcionan igual.
- **RF-06 (D7):** el garaje funciona igual: se elige el carro y el color, y se ve en 3D.
- **RF-07 (D7):** `Garaje` y sus partes no guardan su estado en métodos `static`.
- **RF-08 (D8):** ningún archivo `.js` o `.mjs` pasa de 400 líneas, y `scripts/archivos_grandes_aceptados.txt` queda vacío.
- **RF-09 (D8):** `CLAUDE.md` ya no tiene excepciones temporales en "Anti-monolito" ni en "Visores de pista".
- **RF-10 (D8, D9):** el backlog marca B10 como hecho y los PRD 001 y 002 tienen la nota de D9.
- **RF-11 (D2):** no aparecen errores nuevos en la consola en ninguna pantalla.

## 7. Requerimientos no funcionales
- **RNF-01 (D2), reglas del proyecto:** todo lo nuevo cumple `CLAUDE.md` (una clase por archivo, español, `#privados`, MVC y la regla anti-monolito).
- **RNF-02 (D4), pruebas:** `npm run test:todo` termina en verde **después de cada fase**. Se agrega una prueba que entra y sale de todas las pantallas en un navegador real, en vertical y en horizontal (lección 13).
- **RNF-03 (D1), entrega por fases:** cada fase se lleva a `main` solo cuando cumple la lista "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. Las 11 pruebas actuales y las nuevas terminan en verde.
2. Las capturas de cada pantalla coinciden antes y después.
3. Ningún archivo pasa de 400 líneas y la lista de aceptados está vacía.
4. Cada pantalla tiene su controlador y `CLAUDE.md` no tiene excepciones.
5. El Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Romper la navegación:** `aplicacion.js` es el centro de todo. Por eso se trabaja por fases y con pruebas.
- **Orden al arrancar los visores:** Test Drive 3D y Diseño de Pistas dependen del orden de los pasos (lección 6). Se prueban en un navegador real.
- **Capturas 3D:** la luz puede variar un poco de una captura a otra. Se compara la composición, no cada píxel.
- **Garaje:** es la pieza más vieja y menos probada. Se le agrega una prueba antes de dividirlo.
- **Muchos controladores:** D6 tiene 14. Algunos son chicos, y eso es lo esperado con la regla de una sola responsabilidad.

### Historial
- **v1** (2026-10-22): primera versión.
- **v2** (2026-10-22): correcciones de 2 agentes revisores, aprobadas por el usuario. D6 da un controlador a cada pantalla (opción a). Se agrega D9 (reemplaza partes de las listas de lo que no se modifica de los PRD 001 y 002). Los RNF citan su decisión. Se quitan las repeticiones del Out of scope. RNF-03 cita la lista correcta de las lecciones.

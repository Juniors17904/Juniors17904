# PRD 020 — Récords por pista (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3.1 — programado y en `main` |
| Fecha | 2026-10-26 |
| Backlog | B7 (`docs/BACKLOG.md`) |
| Depende de | PRD 001 (carrera y resultado) y PRD 018 ("Preparar carrera") |
| Reemplaza | Ver D7 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Por cada pista se guardan el **mejor tiempo total** de las 3 vueltas y la **mejor vuelta**. Solo en Jugar Solo. Se guardan en el mismo celular o navegador, sin internet. |
| D2 | Alcance | **Un solo récord por pista**, que vale para cualquier modo y dificultad (PRD 018): el tiempo es del jugador, haya rivales o no. |
| D3 | Usuarios | Solo cuenta una carrera **terminada** (las 3 vueltas). Si se sale con "Menú" a mitad de carrera, no se guarda nada. |
| D4 | Usuarios | El récord se ve en **"Preparar carrera"**, debajo de la pista elegida ("Récord 1:23.45 · Mejor vuelta 0:27.10", o "Sin récord todavía"), y en el **resultado**, junto al tiempo de la carrera. |
| D5 | Usuarios | Si se bate el récord, el resultado muestra **"¡Nuevo récord!"** bien visible. El tiempo total y la mejor vuelta se comparan cada uno por su lado. |
| D6 | Alcance | Borrar los récords queda fuera de este PRD. |
| D7 | Técnico y dominio | Clases nuevas del modelo: `RecordPista` (los dos tiempos de una pista) y `RegistroRecords` (los récords de todas las pistas, con su propia clave de guardado); en la vista, las clases que muestran el texto y el aviso. Ningún archivo pasa de 400 líneas. Pruebas en el modelo y en navegador real, en vertical y en horizontal. **Reemplaza (solo para guardar y mostrar el récord):** "récords guardados" del Out of scope del PRD 001, "récords (B7)" del Out of scope del PRD 013 y "guardar récords (B7)" del Out of scope del PRD 018; amplía lo que muestra el resultado (PRD 001 D2 y RF-10, PRD 018 D6 y RF-11, y el panel del RF-07 del PRD 015); `ControladorPrepararCarrera` y su pantalla en `index.html` muestran el récord; `HudCarrera` y el resultado en las listas de los PRD 002, 006, 008, 009 a 012, 014 y 017, y "el HUD" en la del PRD 019; `ControladorCarreraSolo` en las listas de los PRD 002, 005 y 016; "el comportamiento y el aspecto del juego" de los PRD 004 y 005. Los estilos van en `index.html` o en las clases de la vista; `src/style.css` no cambia. `CLAUDE.md` nombra las clases nuevas. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Al terminar una carrera de Jugar Solo se ve el tiempo, pero se pierde: no hay forma de saber si se mejoró ni cuál es la mejor marca de cada pista. Con el modo Contrarreloj (PRD 018) eso es lo que más falta.

## 2. Objetivo
Que el jugador tenga una marca que superar en cada pista y vea cuándo la bate.

## 3. Público objetivo y usuarios
- **Jugador:** compite contra su propio récord, sobre todo en Contrarreloj.

## 4. Alcance
**In scope:** D1 a D7.

**Out of scope:** borrar récords (D6), récords en línea o compartidos, un récord por modo o por dificultad, mostrar la diferencia con el récord durante la carrera, y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los rivales, las vueltas y el cronómetro (PRD 006 a 014, 018 y 019): el récord solo lee el tiempo que ya se calcula.
- Las pistas, los controles, el minimapa y los diseños vertical y horizontal (PRD 015 a 017). *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- La elección de "Preparar carrera" y cómo se recuerda (PRD 018): solo se suma el texto del récord. *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Récord de una pista | El mejor tiempo total y la mejor vuelta conseguidos en esa pista. |
| Nuevo récord | Un tiempo total o una vuelta mejor que el récord guardado (o el primero). |

## 6. Requerimientos funcionales
- **RF-01 (D1, D3):** al terminar las 3 vueltas, si el tiempo total es mejor que el guardado para esa pista (o no había), queda como récord.
- **RF-02 (D1, D5):** la mejor vuelta de la carrera queda como récord de vuelta si es mejor que la guardada, aunque el tiempo total no lo sea.
- **RF-03 (D2):** el récord es el mismo en Contra la PC y en Contrarreloj, y en cualquier dificultad.
- **RF-04 (D3):** salir de la carrera antes de terminar (durante la carrera se sale con el botón atrás; "Menú" solo aparece en el resultado) no cambia ningún récord.
- **RF-05 (D1):** los récords siguen ahí después de recargar la página; cada pista tiene el suyo.
- **RF-06 (D4):** en "Preparar carrera", debajo de la pista elegida, se ve el récord de la pista elegida, o "Sin récord todavía"; al cambiar de pista cambia el texto.
- **RF-07 (D4):** el resultado muestra el récord de la pista, ya actualizado con esta carrera, junto al tiempo de la carrera.
- **RF-08 (D5):** si se bate el tiempo total o la mejor vuelta, el resultado muestra "¡Nuevo récord!"; si no, no aparece. La primera carrera terminada en una pista también es un récord nuevo.
- **RF-09 (D4):** el texto del récord se ve completo en 390×844 y en 844×390, en "Preparar carrera" y en el resultado (que en horizontal ya se puede desplazar, PRD 015 RF-07). Los diseños vertical y horizontal no cambian.
- **RF-10:** un dato guardado roto o raro no rompe el juego: esa pista queda "Sin récord todavía".
- **RF-11 (D7):** los PRD de D7 tienen su nota; `CLAUDE.md` nombra las clases nuevas; el backlog enlaza B7 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7), reglas del proyecto:** `RecordPista` y `RegistroRecords` son clases del modelo, cada una en su archivo; el récord no se guarda como objeto suelto en ninguna clase (para escribirlo en el almacenamiento solo se arma un dato temporal dentro de un método, como permite `CLAUDE.md`).
- **RNF-02 (D7), MVC:** decidir si hay récord nuevo y guardarlo es del modelo; el controlador se lo pide al terminar y la vista solo muestra el texto.
- **RNF-03 (D7), anti-monolito:** ningún archivo pasa de 400 líneas; `VisorCarreraSolo` no se toca, y el texto del récord se arma fuera de `ControladorCarreraSolo` (que está cerca del límite).
- **RNF-04 (D7), pruebas:** en el modelo, comparar y guardar récords y los datos rotos; en navegador real (390×844 y 844×390), el texto en "Preparar carrera", el aviso de récord nuevo y que se recuerda al recargar, con capturas.
- **RNF-05 (D7), entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Al terminar una carrera se guarda el récord de la pista si es mejor.
2. El récord se ve antes de correr y en el resultado.
3. Batir el récord se nota con "¡Nuevo récord!".
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Otro celular u otro navegador:** los récords no se comparten; cada uno guarda los suyos.
- **Borrar los datos del navegador** borra también los récords (y la última elección del PRD 018).
- **Carreras que no son de verdad:** solo cuenta una carrera con sus 3 vueltas completas y tiempos válidos; así una meta forzada (por ejemplo, en una prueba) no deja un récord falso.
- **Física nueva (PRD 019):** si la física cambia los tiempos, los récords viejos pueden quedar más difíciles o más fáciles de batir; no se ajustan solos.

### Historial
- **v1** (2026-10-26): primera versión, con las 7 decisiones aprobadas por el usuario (opción A).
- **v2** (2026-10-26): revisión única (forma corta). Detalles: D7 suma el Out of scope del PRD 013, que el resultado se amplía (PRD 001 y 018) y que los estilos van en `index.html`; D7 deja nombrar las clases de la vista del texto; RF-04 dice que durante la carrera se sale con el botón atrás; RF-06 y D4 dicen el mismo lugar; RF-07 muestra el récord ya actualizado; RF-08 dice que la primera carrera también es récord; RF-09 aclara que los diseños no cambian; RNF citan D7; riesgo de metas forzadas.
- **v3** (2026-10-26): programado. Clases `RecordPista` y `RegistroRecords` (modelo) y `TextoRecordPista` y `AvisoRecord` (vista).
- **v3.1** (2026-10-26): revisión de contradicciones: D7 suma la D6 del PRD 018, el RF-07 del PRD 015 y `ControladorPrepararCarrera`; los estilos pueden ir en las clases de la vista; sin nota en la lista del PRD 001 (no cambió).

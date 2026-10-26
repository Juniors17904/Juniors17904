# PRD 018 — Modos de carrera y dificultad en Jugar Solo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — programado y en `main` |
| Fecha | 2026-10-26 |
| Backlog | B21 (`docs/BACKLOG.md`) |
| Depende de | PRD 013 (rivales) y PRD 017 (minimapa) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Al tocar "Jugar Solo" en Inicio aparece una pantalla nueva, **"Preparar carrera"**, antes de correr. Ahí se elige el modo, la pista, cuántos rivales y la dificultad, y un botón grande "¡Correr!" arranca la carrera. |
| D2 | Alcance | Dos modos: **Contra la PC** (como hoy) y **Contrarreloj** (solo el jugador, sin rivales, contra el reloj). El campeonato y guardar récords (B7) quedan fuera. |
| D3 | Usuarios | Rivales: de 1 a 4 (por omisión, 4). Con menos de 4, la dificultad decide quiénes corren: en Fácil entran primero el Novato y el Prudente; en Normal y Difícil, el Experto y el Agresivo. |
| D4 | Usuarios | Tres dificultades: **Fácil** (los rivales van más lentos y aflojan más: es más fácil ganar), **Normal** (igual que hoy) y **Difícil** (los rivales corren a fondo y nunca aflojan para esperar al jugador). En ninguna hacen trampa: usan la misma física que el jugador. |
| D5 | Usuarios | Se recuerda la última elección: la pantalla aparece con lo que se eligió antes. Revancha repite la misma carrera (mismo modo, pista, rivales y dificultad). |
| D6 | Usuarios | Contra la PC, la posición dice "2.º/M", con M = cantidad de carros. En Contrarreloj no hay posición ni tabla de puestos: el resultado muestra el tiempo total y la mejor vuelta, y el minimapa solo muestra al jugador. |
| D7 | Técnico | El modo y la dificultad son clases del modelo con su superclase: `ModoCarrera` (`ModoContraPC`, `ModoContrarreloj`) y `DificultadCarrera` (`DificultadFacil`, `DificultadNormal`, `DificultadDificil`). No heredan de `Modo` (los modos de Inicio, PRD 002). La pantalla nueva tiene su propio controlador. `VisorCarreraSolo` no crece; si hace falta lugar, se saca código a clases nuevas (como permitió el PRD 013, D8). Pruebas en navegador real en vertical y en horizontal. |
| D8 | Dominio | **Reemplaza (solo para Jugar Solo):** del PRD 001, su RF-01 ("Jugar Solo" pasa por "Preparar carrera") y su D4 y RF-03 (la pista también se elige en "Preparar carrera"). Del PRD 013, su D1 (siempre 4 rivales), su D4 (en Difícil los rivales no aflojan; en Fácil aflojan más), su D5 (posición "/5" y tabla de 5), "elegir la cantidad de rivales o su dificultad" de su Out of scope, y los RF y criterios que dependen de ellas (RF-01, RF-03, RF-07 —vale solo en Normal con 4 rivales—, RF-09, RF-10 y criterios 1 y 3). Del PRD 015, su D5 y RF-03, y del PRD 017, su D4, RF-02, RF-05, RNF-04 y criterio 1: en Contrarreloj no hay posición y el mapa tiene un punto. `HudCarrera` y el resultado en las listas de los PRD 002, 006, 008, 009 a 012, 014 y 017. `VisorCarreraSolo` (recibe la elección y decide si hay rivales), `RivalesCarreraSolo`, `CarreraConRivales`, `AjusteRitmo` y `Rival` en las listas de los PRD 002 ("todas las clases de la carrera 3D") y 005 (los visores). `ControladorCarreraSolo` en las listas de los PRD 002, 005 y 016; `ControladorInicio` y `Aplicacion` en la lista del PRD 005; "el comportamiento y el aspecto del juego" de los PRD 004 y 005; y "los rivales" en las listas de los PRD 015, 016 y 017 (su ritmo cambia según la dificultad). `CLAUDE.md` suma las jerarquías del modo y la dificultad y el controlador de la pantalla nueva. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Hoy "Jugar Solo" arranca siempre la misma carrera: 4 rivales, dificultad fija y la pista que se eligió en otra pantalla. No se puede practicar solo contra el reloj, ni hacer la carrera más fácil o más difícil.

## 2. Objetivo
Que el jugador arme su carrera antes de correr: con quién corre, dónde y qué tan difícil.

## 3. Público objetivo y usuarios
- **Jugador nuevo:** elige Fácil o Contrarreloj para aprender la pista sin presión.
- **Jugador con experiencia:** elige Difícil para un desafío real.

## 4. Alcance
**In scope:** D1 a D8.

**Out of scope:** el campeonato, guardar récords (B7), elegir el carro o el color en esta pantalla (sigue en el garaje), el multijugador (B3) y todo lo de la lista única de abajo. *(Cambia según el PRD 020, D7: récords por pista.)*

**Lista única de lo que NO se modifica:**
- La física de los carros, los choques, las vueltas y el cronómetro (PRD 006 a 012). *(El giro y el derrape de `Carro` suman el peso del carro según el PRD 019, D9.)*
- Las personalidades de los rivales (PRD 013, D2) y su manejo natural sin trampa (D3). *(Su manejo natural se puede ajustar según el PRD 019, D9, sin cambiar las personalidades.)*
- Las pistas, el piso, los objetos, la señalética y el camino de vuelta (PRD 009 a 014).
- Los diseños vertical y horizontal, los controles y el minimapa (PRD 015 a 017), salvo lo que dicen D6 y D8.
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Modo de carrera | Contra quién se corre: Contra la PC o Contrarreloj. |
| Dificultad | Qué tan rápido y qué tan parejo corren los rivales. |
| Preparar carrera | Pantalla donde se eligen modo, pista, rivales y dificultad. |

## 6. Requerimientos funcionales
- **RF-01 (D1):** al tocar "Jugar Solo" se abre "Preparar carrera", no la carrera. "¡Correr!" arranca la carrera con lo elegido; "Volver" regresa a Inicio. Al terminar la carrera, "Menú" sigue volviendo a Inicio (PRD 001, RF-11).
- **RF-02 (D1):** en "Preparar carrera" se elige la pista entre las 5; la pista elegida es la que se corre.
- **RF-03 (D2):** en Contrarreloj la carrera no tiene rivales en la pista.
- **RF-04 (D2, D3):** Contra la PC corren entre 1 y 4 rivales, según lo elegido; por omisión, 4.
- **RF-05 (D3):** con menos de 4 rivales, en Fácil corren primero el Novato y el Prudente; en Normal y Difícil, primero el Experto y el Agresivo.
- **RF-06 (D4):** en Fácil los rivales son más lentos que en Normal; en Difícil, más rápidos que en Normal, sin pasar nunca el tope de su carro.
- **RF-07 (D4):** en Difícil un rival que va adelante del jugador no afloja para esperarlo; en Normal afloja como hoy, y en Fácil afloja más que en Normal.
- **RF-08 (D4):** en Normal los rivales corren igual que antes de este PRD. *(Los números de manejo de los pilotos se pueden ajustar según el PRD 019, D9, si esto se sigue cumpliendo.)*
- **RF-09 (D5):** al volver a "Preparar carrera" (también tras recargar la página) aparece la última elección; Revancha repite la misma carrera.
- **RF-10 (D6):** Contra la PC, la posición dice "N.º/M" con M = rivales + 1, y la tabla final tiene M puestos.
- **RF-11 (D6):** en Contrarreloj no se ve la posición ni la tabla de puestos; el resultado muestra el tiempo total y la mejor vuelta, y el minimapa tiene un solo punto. *(Cambia según el PRD 020, D7: récords por pista.)*
- **RF-12 (D1, D7):** "Preparar carrera" se ve completa y se puede usar en 390×844 y en 844×390.
- **RF-13 (D8):** los PRD de D8 tienen su nota; `CLAUDE.md` suma las jerarquías del modo y la dificultad y el controlador nuevo; el backlog enlaza B21 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7), reglas del proyecto:** el modo y la dificultad son clases del modelo, cada una en su archivo, con su superclase; la pantalla tiene su controlador; nada de objetos literales como entidades. Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** la regla de qué rivales corren y cómo cambia su ritmo vive en el modelo; la pantalla solo muestra y guarda la elección.
- **RNF-03 (D7), anti-monolito:** `VisorCarreraSolo` no crece y ningún archivo pasa de 400 líneas.
- **RNF-04 (D7), pruebas:** en el modelo, la elección de rivales, el ritmo de cada dificultad y que Normal no cambia; en navegador real (390×844 y 844×390), la pantalla nueva, los dos modos, la cantidad de rivales y que se recuerda la elección, con capturas.
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Antes de correr se elige modo, pista, rivales y dificultad.
2. Contrarreloj corre sin rivales; Contra la PC con los rivales elegidos.
3. Fácil se gana más fácil y Difícil cuesta más.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Llegada pareja:** en Difícil los rivales ya no esperan, así que pueden llegar muy separados del jugador; es lo buscado.
- **Margen de Difícil:** varios rivales ya van al tope de su carro en las rectas; en Difícil ganan sobre todo en las curvas y porque no aflojan. La diferencia con Normal es real pero moderada.
- **Lugar en el visor:** el visor está en 376 de 400 líneas; si la cantidad de rivales lo hace crecer, se saca código a clases nuevas (D7).
- **Pista elegida en dos lugares:** la pantalla Pistas y "Preparar carrera" comparten la pista elegida mientras el juego está abierto; tras recargar, la que se recuerda es la de "Preparar carrera". La pantalla Pistas no cambia (sigue marcando su tarjeta y ajustando timón y velocímetro como antes).

### Historial
- **v1** (2026-10-26): primera versión, con las 8 decisiones aprobadas por el usuario (opción A).
- **v2** (2026-10-26): revisión única (forma corta). Detalles: D8 completa (PRD 001 RF-01, D4 y RF-03; PRD 013 Out of scope, RF y criterio; PRD 015 y 017 por la posición y el punto único; `HudCarrera`, `ControladorCarreraSolo`, `ControladorInicio` y `Aplicacion` en sus listas); D3 dice el orden en Normal; D6 y RF-10 usan las mismas letras; RF-07 suma Fácil; D7 nombra las superclases `ModoCarrera` y `DificultadCarrera` (no heredan de `Modo`); "Menú" sigue yendo a Inicio; riesgo del margen de Difícil.
- **v3** (2026-10-26): programado. D8 suma el resultado del PRD 008, el criterio 3 del PRD 013 y las clases de la carrera 3D que cambian (PRD 002 y 005); la nota del RF-07 del PRD 013 dice que vale solo en Normal con 4 rivales.

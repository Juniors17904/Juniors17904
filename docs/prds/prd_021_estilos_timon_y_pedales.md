# PRD 021 — Estilos de timón y pedales (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — escrito, falta la revisión única |
| Fecha | 2026-10-27 |
| Backlog | B25 (`docs/BACKLOG.md`) |
| Depende de | PRD 016 (controles cómodos) y PRD 015 (vertical y horizontal) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Los **pedales con estilo** (ACEL y FRENO) se ven en Jugar Solo, en vertical y en horizontal. Los **timones nuevos** se ven en todas las pantallas que ya muestran el timón elegido. |
| D2 | Alcance | El estilo de los pedales se elige en Ajustes → "Diseño de botones y pedales", con una galería de 4 pedales parecida a la del timón. La galería de timones pasa de 4 a 6 modelos. |
| D3 | Usuarios | **4 estilos de pedales:** **Clásico** (los de hoy, elegido de fábrica), **Deportivo** (pedal metálico: el acelerador alto y el freno ancho), **F1** (con forma de leva) y **Retro** (botón redondo de arcade). |
| D4 | Usuarios | **Solo cambia el dibujo de los pedales.** El tamaño mínimo, el lugar, la separación, la luz y la vibración al tocar quedan como en el PRD 016 (D5 y D6), en todos los estilos. |
| D5 | Usuarios | **2 timones nuevos:** **Rally** (con una marca roja arriba) y **Camión** (grande, de dos rayos). Los 4 de hoy no cambian. |
| D6 | Usuarios | El juego **recuerda** el timón y los pedales elegidos, también después de recargar la página. Elegir una pista **ya no cambia** el timón ni el velocímetro elegidos (hoy Ciudad pone el timón Clásico y el velocímetro F1). |
| D7 | Técnico | Una superclase `EstiloPedales` con sus 4 subclases, una por estilo; `TimonRally` y `TimonCamion` heredan de `Timon`; una clase del modelo guarda lo elegido con su propia clave de guardado. La galería de pedales es una pantalla nueva con su propio controlador. Ningún archivo pasa de 400 líneas. |
| D8 | Técnico | Pruebas en el modelo (lo elegido se recuerda) y en navegador real en 390×844 y 844×390: cada estilo de pedal respeta el tamaño mínimo, los toques funcionan y se toman capturas. |
| D9 | Dominio | **Reemplaza (solo para sumar los estilos de pedales, los 2 timones nuevos y recordar lo elegido):** del PRD 001, su D4 ("el timón y el velocímetro del garaje": ahora salen de lo elegido y guardado); del PRD 002, "los timones" y "los elementos dibujados en 2D" de su lista (su RF-06 sigue valiendo); de los PRD 004 y 005, "el comportamiento y el aspecto del juego" (solo los controles), y del PRD 005 "los timones y los velocímetros" de su lista; del PRD 016, "los dibujos de los timones" de su lista y "los modelos de timón del garaje" de su Out of scope (D4 de este PRD mantiene sus D5 y D6); del PRD 020, "los controles" de su lista; de los PRD 002 y 004 a 020, `src/style.css` e `index.html` (solo los estilos de los pedales, la galería de pedales y los 2 timones nuevos). Esos PRD llevan una nota que lo indica. `CLAUDE.md` suma `EstiloPedales` a su tabla de jerarquías y los 2 timones a la de `Timon`. |

## 1. Contexto y problema
El timón ya tiene 4 estilos para elegir (Clásico, Deportivo, F1 y Vintage), pero ACEL y FRENO son siempre los mismos dos botones. Además, lo elegido se pierde al recargar la página, y al elegir la pista Ciudad el juego pone de nuevo el timón Clásico y el velocímetro F1, aunque el jugador haya elegido otros.

## 2. Objetivo
Que el jugador arme el aspecto de sus controles a su gusto (timón y pedales) y que el juego lo respete siempre.

## 3. Público objetivo y usuarios
- **Jugador:** elige el timón y los pedales que más le gustan y los encuentra igual cada vez que juega.
- **Desarrollador y agentes:** suman un estilo nuevo con una clase nueva, sin tocar las demás.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** un acelerador que dosifica la fuerza (el pedal sigue siendo todo o nada, PRD 013 y 019); el giroscopio y el selector Botones / Timón / Giroscopio (B4); estilos nuevos de velocímetro; cambiar el tamaño o el lugar de los controles; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los rivales, las vueltas, el cronómetro y los récords (PRD 006 a 014 y 018 a 020): solo cambia cómo se ven los controles.
- Cómo se toca: la zona de giro, el recorrido de giro y los toques a la vez (PRD 016, D3, D4 y D7), y el control por teclado en PC.
- Los diseños vertical y horizontal y sus medidas (PRD 015 y 016, D9).
- Los dibujos de los 4 timones de hoy y los 4 velocímetros.
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje (salvo que sus timones pueden ser también los 2 nuevos, D1).

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Estilo de pedales | El dibujo de ACEL y FRENO: Clásico, Deportivo, F1 o Retro. |
| Modelo de timón | El dibujo del timón: Clásico, Deportivo, F1, Vintage, Rally o Camión. |
| Lo elegido | El timón y el estilo de pedales que el jugador eligió, guardados en su celular o navegador. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** en Ajustes → "Diseño de botones y pedales" hay un acceso a la galería de pedales, que muestra los 4 estilos con su nombre y su dibujo, y marca el elegido.
- **RF-02 (D3):** al elegir un estilo de pedales y entrar a Jugar Solo, ACEL y FRENO se ven con ese estilo; sin elección previa se ve el Clásico, igual que hoy.
- **RF-03 (D3):** los 4 estilos se distinguen a simple vista: en cada uno, ACEL y FRENO tienen forma o dibujo propio y se sigue leyendo cuál es cuál.
- **RF-04 (D4):** con cualquier estilo, en 390×844 y en 844×390, ACEL y FRENO miden al menos lo que pide el PRD 016 (72 px en vertical, 88 px en horizontal), están en el mismo lugar y con la misma separación.
- **RF-05 (D4):** con cualquier estilo, el pedal apretado se ilumina y se ve hundido, y acelerar, frenar y girar a la vez funciona igual que hoy.
- **RF-06 (D5):** la galería de timones muestra 6 modelos: los 4 de hoy, Rally y Camión, cada uno con su dibujo.
- **RF-07 (D1, D5):** al elegir Rally o Camión, ese timón se ve y gira en Jugar Solo y en las demás pantallas que muestran el timón elegido.
- **RF-08 (D6):** después de recargar la página, el timón y los pedales elegidos siguen siendo los mismos.
- **RF-09 (D6):** elegir una pista no cambia el timón ni el velocímetro elegidos.
- **RF-10 (D9):** los PRD de D9 tienen su nota, `CLAUDE.md` nombra `EstiloPedales` y los 2 timones nuevos, y el backlog enlaza B25 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7), reglas del proyecto:** cada estilo de pedales y cada timón nuevo es una clase en su propio archivo, en español y con campos `#privados`; la pantalla nueva tiene su controlador. Ningún archivo pasa de 400 líneas.
- **RNF-02 (D8), pruebas:** las pruebas citan los RF de este PRD y corren en `npm run test:todo`.
- **RNF-03, entrega:** llega a `main` con la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Se eligen 4 estilos de pedales y 6 timones, y se ven en la carrera.
2. Los pedales siguen siendo igual de grandes y cómodos que en el PRD 016.
3. Lo elegido se recuerda al recargar y la pista no lo cambia.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Formas distintas al mismo tamaño:** el pedal Deportivo (alto y angosto) y la leva F1 cambian la forma; el área que se toca sigue siendo al menos la del PRD 016, aunque el dibujo no la llene entera.
- **Datos guardados viejos o rotos:** si lo guardado no es un estilo o un timón conocido, se usa el Clásico.
- **Pista con timón propio:** hoy solo Ciudad pone un timón y un velocímetro; al quitarlo, quien nunca eligió sigue viendo el Clásico y el velocímetro de fábrica.
- **Nombre Vintage:** el cuarto timón se llama "Vintage" en pantalla; no cambia.

### Historial
- **v1** (2026-10-27): primera versión, con las decisiones aceptadas por el usuario (opción A).

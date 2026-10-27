# PRD 021 — Estilos de timón y pedales (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — revisado (forma corta), listo para implementar |
| Fecha | 2026-10-27 |
| Backlog | B25 (`docs/BACKLOG.md`) |
| Depende de | PRD 016 (controles cómodos) y PRD 015 (vertical y horizontal) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Los **pedales con estilo** (ACEL y FRENO) se ven solo en Jugar Solo, en vertical y en horizontal. Los **timones nuevos** se ven en las 3 pantallas que muestran el timón elegido: Jugar Solo, Diseño General y Diseño de Pistas → Entrar. |
| D2 | Alcance | El estilo de los pedales se elige en Ajustes → "Diseño de botones y pedales", con una galería de 4 pedales parecida a la del timón. La galería de timones pasa de 4 a 6 modelos. Las dos galerías se ven enteras en vertical y en horizontal (si no entran, su pantalla se desplaza); la galería de velocímetros no cambia. |
| D3 | Usuarios | **4 estilos de pedales:** **Clásico** (los de hoy, elegido de fábrica), **Deportivo** (pedal metálico: el acelerador alto y angosto, el freno ancho), **F1** (con forma de leva) y **Retro** (botón de arcade con borde grueso). |
| D4 | Usuarios | **Solo cambia el dibujo de los pedales.** El área que se toca es la misma caja del PRD 016 (su tamaño, lugar y separación, D5) y cada estilo dibuja su forma dentro de ella; la luz y la vibración al tocar quedan como en el PRD 016 (D6). Así el velocímetro no se mueve. |
| D5 | Usuarios | **2 timones nuevos:** **Rally** (con una marca roja arriba) y **Camión** (de dos rayos y aro grueso, que llena su lugar), en el mismo lugar y tamaño que los de hoy. Los 4 de hoy no cambian. |
| D6 | Usuarios | El juego **recuerda** el timón y los pedales elegidos, también después de recargar la página. Elegir una pista **ya no cambia** el timón ni el velocímetro elegidos (hoy Ciudad pone el timón Clásico y el velocímetro F1). El velocímetro sigue sin guardarse al recargar, como hoy. Quien nunca eligió velocímetro ve el de fábrica (Clásico) en todas partes, también en Diseño de Pistas, donde hoy veía el F1 por tocar Ciudad *(v2: opción A, decisión del usuario)*. |
| D7 | Técnico | Una superclase `EstiloPedales` (`clave`, `nombre`) con sus 4 subclases en `src/view/controles/` (`PedalesClasicos`, `PedalesDeportivos`, `PedalesF1`, `PedalesRetro`); `TimonRally` y `TimonCamion` heredan de `Timon`. Una clase del modelo, `PreferenciasControles`, guarda el timón y los pedales elegidos por su clave (por ejemplo `rally`), no por número, con su propia clave de guardado; si lo guardado no se conoce, usa el Clásico. La galería de pedales es una pantalla nueva con su propio controlador. El estilo llega a los pedales de Jugar Solo por las piezas de diseño del PRD 015 y 016, sin sumar lógica a `ControladorCarreraSolo`. Ningún archivo pasa de 400 líneas. |
| D8 | Técnico | Pruebas en el modelo (lo elegido se recuerda, lo roto cae en Clásico) y en navegador real en 390×844 y 844×390: cada estilo de pedal mide la caja del PRD 016, se ilumina al tocar y funciona con toques a la vez; las dos galerías se ven enteras; capturas. |
| D9 | Dominio | **Reemplaza (solo para sumar los estilos de pedales, los 2 timones nuevos y recordar lo elegido):** del PRD 001, su D4 (el timón sale de lo guardado) y `src/style.css`, `ControlTimon` y `VistaConduccion` de su lista; del PRD 002, "cambiar los elementos dibujados en 2D" de su Out of scope y "los timones", "todas las clases de la carrera 3D" y "los elementos dibujados en 2D" de su lista (su RF-06 sigue valiendo); de los PRD 004 y 005, "el comportamiento y el aspecto del juego" (solo los controles); del PRD 005, "los timones y los velocímetros" y "solo cambia cómo piden una pista" (`ControladorPistas` y `ControladorControles`); de los PRD 006 a 009, los timones (`ControlTimon`) de sus listas; de los PRD 013, 017, 019 y 020, "los controles" de sus listas; del PRD 015, su D1, "las otras pantallas no cambian" y "cambiar la forma del timón y los botones" de su Out of scope; del PRD 016, su D1, "los controles de las otras pantallas" y "los modelos de timón del garaje" de su Out of scope, y `VistaConduccion`, `ControladorCarreraSolo` y "los dibujos de los timones" de su lista (sus D5, D6 y D9 siguen valiendo por D4); del PRD 018, "la pantalla Pistas… sigue ajustando timón y velocímetro" de sus riesgos y "los controles" de su lista; y `src/style.css` en las listas de los PRD 001, 002, 004 a 014 y 019 (solo los estilos de los pedales y de las galerías). Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El timón ya tiene 4 estilos para elegir (Clásico, Deportivo, F1 y Vintage), pero ACEL y FRENO son siempre los mismos dos botones. Además, el timón elegido se pierde al recargar la página, y al elegir la pista Ciudad el juego pone de nuevo el timón Clásico y el velocímetro F1, aunque el jugador haya elegido otros.

## 2. Objetivo
Que el jugador arme el aspecto de sus controles a su gusto (timón y pedales) y que el juego lo respete siempre.

## 3. Público objetivo y usuarios
- **Jugador:** elige el timón y los pedales que más le gustan y los encuentra igual cada vez que juega.
- **Desarrollador y agentes:** suman un estilo nuevo con una clase nueva, sin tocar las demás.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** un acelerador que dosifica la fuerza (el pedal sigue siendo todo o nada, PRD 013 y 019); el giroscopio y el selector Botones / Timón / Giroscopio, que no se recuerda (B4); guardar el velocímetro y estilos nuevos de velocímetro; cambiar el tamaño o el lugar de los controles; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los rivales, las vueltas, el cronómetro y los récords (PRD 006 a 014 y 018 a 020): solo cambia cómo se ven los controles.
- Cómo se toca: la zona de giro, el recorrido de giro y los toques a la vez (PRD 016, D3, D4 y D7), y el control por teclado en PC, que no muestra timón ni pedales.
- Los diseños vertical y horizontal y sus medidas (PRD 015 y 016, D9), y el lugar del velocímetro. *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- Los dibujos de los 4 timones de hoy, los 4 velocímetros y su galería.
- Test Drive, Diseño de Objetos y el garaje; en Diseño General y Diseño de Pistas solo se suman los 2 timones nuevos (D1) y, en Diseño de Pistas, el velocímetro de fábrica (D6).

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Estilo de pedales | El dibujo de ACEL y FRENO: Clásico, Deportivo, F1 o Retro. |
| Modelo de timón | El dibujo del timón: Clásico, Deportivo, F1, Vintage, Rally o Camión. |
| Lo elegido | El timón y el estilo de pedales que el jugador eligió, guardados en su celular o navegador. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** en Ajustes → "Diseño de botones y pedales" hay un acceso a la galería de pedales, que muestra los 4 estilos con su nombre y su dibujo, y marca el elegido.
- **RF-02 (D1, D3):** con el control de timón, al elegir un estilo de pedales y entrar a Jugar Solo, ACEL y FRENO se ven con ese estilo; sin elección previa se ve el Clásico, igual que hoy. En las otras pantallas los botones no cambian.
- **RF-03 (D3):** los 4 estilos se distinguen a simple vista por su forma o su borde, y en todos ACEL y FRENO conservan su texto o un ícono con su nombre.
- **RF-04 (D4):** con cualquier estilo, en 390×844 y en 844×390, el área que se toca de ACEL y FRENO mide lo que pide el PRD 016 (72 px en vertical, 88 px en horizontal), en el mismo lugar y con la misma separación, y el velocímetro queda donde estaba.
- **RF-05 (D4):** con cualquier estilo, el pedal apretado se ilumina y se ve hundido, y acelerar, frenar y girar a la vez funciona igual que hoy.
- **RF-06 (D2, D5):** la galería de timones muestra 6 modelos (los 4 de hoy, Rally y Camión) con su dibujo y su nombre; las galerías de timones y de pedales se ven enteras en 390×844 y en 844×390.
- **RF-07 (D1, D5):** con el control de timón, al elegir Rally o Camión, ese timón se ve y gira en Jugar Solo, Diseño General y Diseño de Pistas → Entrar.
- **RF-08 (D6):** después de recargar la página, el timón y los pedales elegidos siguen siendo los mismos; si lo guardado está roto o no se conoce, se ve el Clásico.
- **RF-09 (D6):** mientras el juego está abierto, elegir una pista no cambia el timón ni el velocímetro elegidos.
- **RF-10 (D7, D9):** los PRD de D9 tienen su nota; `CLAUDE.md` suma la familia `EstiloPedales` (con su carpeta), los 2 timones a la fila de `Timon`, el controlador de la galería de pedales a la de `ControladorPantalla` y `PreferenciasControles`; el backlog enlaza B25 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7), reglas del proyecto:** cada estilo de pedales y cada timón nuevo es una clase en su propio archivo, en español y con campos `#privados`; la pantalla nueva tiene su controlador; la vista no lee lo guardado (MVC). Ningún archivo pasa de 400 líneas.
- **RNF-02 (D8), pruebas:** las pruebas citan los RF de este PRD y corren en `npm run test:todo`.
- **RNF-03, entrega:** llega a `main` con la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Se eligen 4 estilos de pedales y 6 timones, y se ven en la carrera.
2. Los pedales siguen siendo igual de grandes y cómodos que en el PRD 016.
3. Lo elegido se recuerda al recargar y la pista no lo cambia.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Formas distintas en la misma caja:** el pedal Deportivo y la leva F1 no llenan toda la caja, pero se toca la caja entera (D4).
- **El orden de los timones:** hoy los timones se eligen por su lugar en la lista; Rally y Camión van al final para no cambiar los de hoy.
- **Nombre Vintage:** el cuarto timón dice "Vintage" en pantalla aunque su clase se llame `TimonRetro`; la galería sigue mostrando "Vintage". Las clases de pedales llevan "Pedales" en el nombre para no confundirse con los timones.
- **Archivos casi llenos:** `ControladorCarreraSolo` y `VisorCarreraSolo` están cerca de 400 líneas; por eso el estilo llega por las piezas de diseño (D7).

### Historial
- **v1** (2026-10-27): primera versión, con las decisiones aceptadas por el usuario (opción A).
- **v2** (2026-10-27): revisión única (forma corta). Detalles: D9 completa (PRD 001, 002, 005 a 009, 013, 015 a 020 y la lista exacta de `src/style.css`); la caja que se toca es la del PRD 016 (D4); las galerías se ven enteras (D2); las 3 pantallas del timón (D1); lo elegido se guarda por clave y lo roto cae en Clásico (D7); el velocímetro no se guarda; nombres de clases y carpeta; RF-10 con `CLAUDE.md` completo. Decisión del usuario: quien nunca eligió velocímetro ve el Clásico en todas partes (D6, opción A).

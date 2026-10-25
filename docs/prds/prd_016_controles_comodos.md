# PRD 016 — Controles más cómodos en Jugar Solo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — programado y en `main` |
| Fecha | 2026-10-25 |
| Backlog | B23 (`docs/BACKLOG.md`) |
| Depende de | PRD 015 (diseños vertical y horizontal) |
| Reemplaza | Ver D11 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Solo Jugar Solo, en los dos diseños (vertical y horizontal). Las otras pantallas no cambian. |
| D2 | Alcance | Entran el timón y los botones ACEL y FRENO. El giroscopio y el selector Botones / Timón / Giroscopio quedan fuera (B4). |
| D3 | Usuarios | **Girar es más fácil:** se puede tocar y arrastrar en cualquier parte del tercio izquierdo de abajo de la pantalla (nunca más chica que el timón), sin tener que acertar el timón. El timón dibujado sigue mostrando cuánto se gira. Un segundo dedo en la zona no endereza el timón. |
| D4 | Usuarios | **Giro según la pantalla:** en horizontal, el giro máximo se alcanza arrastrando una cuarta parte del ancho de la pantalla; en vertical, con un arrastre fijo de unos 85 px, para no llegar al borde donde Android tiene el gesto de volver. *(v2: aprobado por el usuario)* |
| D5 | Usuarios | **ACEL y FRENO más grandes y separados:** en vertical, de al menos 72 px, con 16 px entre ellos; en horizontal, lado a lado como pedales (FRENO a la izquierda, ACEL a la derecha), de al menos 88 px, con 16 px entre ellos. En vertical el velocímetro sube para dejarles lugar: cada diseño dice cuánto alto ocupan los controles. *(v2: aprobado por el usuario)* |
| D6 | Usuarios | **Se nota el toque:** el botón apretado se ilumina y se ve hundido; si el celular lo permite, vibra muy corto al empezar a acelerar o frenar. |
| D7 | Usuarios | **Todo a la vez:** se puede girar con un dedo y acelerar o frenar con otro, sin que uno corte al otro. |
| D8 | Usuarios | Los controles no tapan el velocímetro, la posición ni el tiempo, y nada se corta en ningún diseño. |
| D9 | Técnico | El tamaño y el lugar de los controles los define cada diseño (`DisenoVertical` y `DisenoHorizontal`, PRD 015), así hay un solo lugar para cambiarlos. Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. *(v3: la zona de giro y la altura mínima del velocímetro son iguales en los dos diseños, por eso viven en el CSS de la zona y en `HudCarrera`.)* |
| D10 | Técnico | Pruebas en navegador real en 390×844 y 844×390: tamaño mínimo de cada control, zona de giro, toques a la vez y capturas. |
| D11 | Dominio | **Reemplaza:** del PRD 001, su D10 (ubicación de ACEL y FRENO; su tamaño está en `index.html` y `src/style.css`) y `ControlTimon` y `src/style.css` en su lista. Del PRD 002, "cambiar los elementos dibujados en 2D" en su Out of scope, los timones, "todas las clases de la carrera 3D", "los elementos dibujados en 2D" y `src/style.css` en su lista, y su criterio 5 ("funcionan igual que antes"), solo para los controles de Jugar Solo. De los PRD 004 y 005, "el comportamiento y el aspecto del juego" (solo los controles de Jugar Solo); del PRD 005, también los timones (`ControlTimon`). Del PRD 015, su D4, su RF-01 y "el diseño vertical" en su lista (en vertical los controles crecen) y "solo cambia su ubicación, no su dibujo" de su D12; también crece la interfaz de `DisenoCarrera`. `HudCarrera` (PRD 006 y 009 a 014): el velocímetro se ubica según el alto de los controles de cada diseño. De los PRD 006, 007, 008, 009 y 013, `ControlTimon` y los controles del jugador en sus listas. De los PRD 002 y 004 a 014, `src/style.css` (solo los estilos de los controles de Jugar Solo). Esos PRD llevan una nota que lo indica. *(v2: completa)* |

## 1. Contexto y problema
En Jugar Solo el timón solo responde si se toca justo encima de su dibujo (160 px) y el giro máximo pide un arrastre fijo de 80 px, igual en cualquier pantalla. ACEL y FRENO quedaron de 52 px, apilados y a 8 px uno del otro, así que es fácil apretar el equivocado, y al tocarlos no se ve una respuesta clara.

## 2. Objetivo
Que manejar en Jugar Solo sea cómodo e intuitivo en el celular, en vertical y en horizontal.

## 3. Público objetivo y usuarios
- **Jugador en celular:** gira y acelera sin mirar los controles y sin apretar el botón equivocado.
- **Desarrollador y agentes:** cambian el tamaño y el lugar de los controles en un solo lugar por diseño.

## 4. Alcance
**In scope:** D1 a D11.

**Out of scope:** el giroscopio y el selector de controles (B4); los controles de las otras pantallas; los modelos de timón del garaje; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los choques, las vueltas, el cronómetro y los rivales (PRD 006 a 014): solo cambia cómo se toca, no cómo maneja el carro.
- El control por teclado en PC (flechas y WASD) y los botones táctiles ◀ ▲ ▼ ▶ del modo botones.
- `VistaConduccion` y `ControladorCarreraSolo`: el timón reconoce solo la zona de giro de Jugar Solo.
- Los dibujos de los timones (`TimonClasico`, `TimonDeportivo`, `TimonF1`, `TimonRetro`) y el velocímetro.
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Zona de giro | Parte de la pantalla donde arrastrar el dedo gira el carro (D3). |
| Recorrido de giro | Cuánto hay que arrastrar el dedo para llegar al giro máximo (D4). |
| Pedales | ACEL y FRENO lado a lado, en horizontal (D5). |

## 6. Requerimientos funcionales
- **RF-01 (D3):** tocar y arrastrar en cualquier parte del tercio izquierdo de abajo de la pantalla (un tercio del ancho, con un mínimo de 200 px) gira el carro, aunque no se toque el dibujo del timón.
- **RF-02 (D3):** el timón dibujado gira igual que el carro mientras se arrastra en la zona de giro.
- **RF-03 (D4):** en horizontal, el giro máximo se alcanza arrastrando una cuarta parte del ancho de la pantalla; en vertical, con unos 85 px.
- **RF-04 (D5):** en vertical, ACEL y FRENO miden al menos 72 px y están separados al menos 16 px.
- **RF-05 (D5):** en horizontal, FRENO y ACEL están lado a lado (FRENO a la izquierda), miden al menos 88 px y están separados al menos 16 px.
- **RF-06 (D6):** mientras se aprieta ACEL o FRENO, el botón se ve iluminado y hundido, y vuelve a su aspecto al soltarlo.
- **RF-07 (D6):** si el celular permite vibrar, vibra muy corto al empezar a acelerar o frenar; si no, no pasa nada y no hay error.
- **RF-08 (D7):** con un dedo girando y otro en ACEL o FRENO, el carro gira y acelera (o frena) a la vez; soltar uno no corta al otro, y un segundo dedo en la zona de giro no endereza el timón.
- **RF-09 (D8):** en los dos diseños los controles no tapan el velocímetro, la posición ni el tiempo, y ninguno se corta.
- **RF-10 (D11):** los PRD de D11 tienen su nota; `CLAUDE.md` suma a la interfaz de `DisenoCarrera` los tamaños de los controles y nombra las clases nuevas en `src/view/controles/`; el backlog enlaza B23 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D9), reglas del proyecto:** los tamaños y lugares de los controles viven en los diseños del PRD 015; la respuesta al toque es una clase de la vista en `src/view/controles/`, en su archivo. Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** los controles solo entregan cuánto se gira, acelera o frena; el modelo no cambia.
- **RNF-03 (D9), anti-monolito:** ningún archivo pasa de 400 líneas.
- **RNF-04 (D10), pruebas:** navegador real con pantalla táctil en 390×844 y 844×390, toques a la vez y capturas (lecciones 13 y 16). Las pruebas de layout de hoy (`prueba_layout.mjs`, `prueba_vertical_horizontal.mjs`, `prueba_hud_carrera.js`) se ajustan a los tamaños nuevos. Los toques a la vez se prueban con dos dedos reales.
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo se gira arrastrando en la zona de giro, sin tener que acertar el timón.
2. ACEL y FRENO son grandes, están separados y se nota cuando se aprietan.
3. Se puede girar y acelerar a la vez.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Zona de giro y otros toques:** la zona va dentro de los controles, así se oculta con ellos cuando aparece el panel de resultado y no tapa Revancha ni Menú. Solo existe en Jugar Solo.
- **Vibración:** iPhone (Safari) no permite vibrar desde una página web; ahí D6 se cumple solo con el aspecto del botón.
- **Pantallas chicas:** en un celular muy angosto, ACEL y FRENO de 72 px pueden acercarse al velocímetro; RF-09 manda y se ajusta su lugar. *(v3: resuelto, el velocímetro sube según el alto de los controles.)*

### Historial
- **v1** (2026-10-25): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-25): revisión única (forma corta). Decisiones aprobadas por el usuario: el velocímetro sube en vertical para dejar lugar a ACEL y FRENO (D5) y el giro en vertical es de unos 85 px fijos (D4). También: Detalles: D11 completa (PRD 002, PRD 004 y 005, PRD 015 D4/RF-01/lista, rango de `src/style.css`, cita del PRD 001 sin "52 px"), separación en horizontal en D5, botones táctiles del modo botones fuera, `VistaConduccion` y `ControladorCarreraSolo` no cambian, RF-10 y RNF-01 con la tabla de `CLAUDE.md` y la carpeta.
- **v3** (2026-10-25): programado. Detalle: el velocímetro nunca baja de su altura de antes (176 px sobre el borde), así en horizontal no tapa los botones del modo botones ni los pedales; en vertical sube encima de ACEL y FRENO. La zona de giro mide un tercio del ancho, con un mínimo de 200 px.

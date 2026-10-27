# PRD 015 — Jugar Solo en vertical y en horizontal (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — implementado |
| Fecha | 2026-10-25 |
| Backlog | B20 (`docs/BACKLOG.md`) |
| Depende de | PRD 001 (Jugar Solo vertical), PRD 013 (rivales y posición en el HUD) |
| Reemplaza | Ver D12 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Solo Jugar Solo. Test Drive, Diseño de Pistas y Diseño General ya funcionan en horizontal y no cambian: el estilo horizontal de los controles (que son comunes a todas las pantallas) vale solo mientras la carrera está activa. *(El timón elegido también se ve en Diseño General y en Diseño de Pistas → Entrar, según el PRD 021, D9: estilos de timón y pedales.)* |
| D2 | Alcance | Se puede jugar con el celular en vertical o en horizontal. Al girarlo en plena carrera, la carrera **sigue sin pausa**: no se reinicia, el cronómetro sigue y los rivales siguen. |
| D3 | Alcance | No se bloquea la orientación ni aparece un aviso de "gira tu celular". Se borra el estilo del aviso viejo `#pantalla-rotar`, que quedó sin uso. |
| D4 | Usuarios | El diseño **vertical** queda igual que hoy (PRD 001, D10). *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(El minimapa de Jugar Solo se suma según el PRD 017, D8.)* *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)* |
| D5 | Usuarios | El diseño **horizontal** usa la pantalla completa, sin franjas a los lados: arriba la vuelta, la posición y el tiempo; abajo a la izquierda el timón; abajo a la derecha ACEL y FRENO, con el velocímetro encima. Con el control de botones (teclado), los botones conservan su orden de hoy, a lo ancho. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)* |
| D6 | Usuarios | En horizontal se ve más pista hacia los costados y la cámara sigue mostrando al menos 30 m hacia adelante (PRD 009). |
| D7 | Usuarios | En PC, si la ventana es más ancha que alta, se usa el diseño horizontal. |
| D8 | Dominio | El diseño se elige solo por la forma de la pantalla: más ancha que alta es horizontal; si no, vertical. *(v2: hoy la cámara se elige por la forma del lienzo, que en PC 1280×960 mide 480×960 y queda vertical; con D7 pasa a horizontal.)* |
| D9 | Técnico | Cada diseño (vertical y horizontal) es una clase de la vista, en su propio archivo, con una superclase común, en su propia carpeta (`src/view/disenos/`). `VisorCarreraSolo` no crece (está en 376 de 400 líneas). |
| D10 | Técnico | Pruebas en navegador real con capturas en 390×844 y 844×390, y una prueba que gira la pantalla en plena carrera. |
| D11 | Alcance | Los dos diseños se arman para **cualquier carrera 3D**, no solo para la de un jugador: cuando exista el multijugador en 3D (B3), usa los mismos diseños sin rehacerlos. Este PRD no construye el multijugador. *(pedido del usuario)* |
| D12 | Dominio | **Reemplaza:** del PRD 001, su D10 (se suma el horizontal y, por D7, en PC ancha deja de ser "igual, centrado"), su RF-01 y su RF-09 (se amplían), la cámara en su D8, "modo horizontal" en su Out of scope y `ControlTimon`, `ControlTeclado`, `RenderizadorVelocimetro` y `src/style.css` en su lista. Del PRD 002, `VisorCarreraSolo`, `ControladorCarreraSolo` y `HudCarrera` dentro de "todas las clases de la carrera 3D", "los elementos dibujados en 2D" (solo su ubicación) y `src/style.css`. De los PRD 004 y 005, "el comportamiento y el aspecto del juego" (solo el diseño horizontal de Jugar Solo); del PRD 005, también `ControladorCarreraSolo` y `VisorCarreraSolo` en su lista de visores y controladores. De los PRD 004 a 014, `src/style.css` (se cambian y se borran reglas, no solo se agregan). `HudCarrera` (PRD 006, 009, 010, 011, 012 y 014) y "la cámara" (PRD 010 a 014), solo para acomodarse en horizontal; del PRD 010, también "de los visores solo cambia la lectura de las medidas nuevas". Los timones, velocímetros y el panel de resultado (PRD 005, 006, 007, 008 y 009) y los controles del jugador (PRD 013): solo cambia su ubicación, no su dibujo. Esos PRD llevan una nota que lo indica. *(v2: completa)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* |

## 1. Contexto y problema
Jugar Solo se diseñó en vertical (PRD 001). Hoy nada impide girar el celular, pero todo vive en una columna de 480 px centrada: en horizontal la carrera se ve como un vertical angosto con franjas negras a los lados, el timón y los botones quedan apretados y no se aprovecha la pantalla. Ninguna prueba revisa Jugar Solo en horizontal ni el giro en plena carrera.

## 2. Objetivo
Que Jugar Solo se juegue cómodo con el celular en cualquier posición, y que girarlo en plena carrera no la corte.

## 3. Público objetivo y usuarios
- **Jugador:** elige cómo sostener el celular y puede cambiar en plena carrera.
- **Desarrollador y agentes:** los dos diseños quedan listos para el multijugador en 3D (D11).

## 4. Alcance
**In scope:** D1 a D12.

**Out of scope:** cambiar el tamaño o la forma del timón y los botones (B23); el multijugador en 3D (B3, D11); las otras pantallas 3D (D1); y todo lo de la lista única de abajo. *(Lo hace el PRD 016.)* *(Cambia según el PRD 021, D9: estilos de timón y pedales.)*

**Lista única de lo que NO se modifica:**
- La física, los choques, las vueltas, el cronómetro y los rivales (PRD 006 a 014): girar no cambia nada del juego. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(El giro y el derrape suman el peso del carro, y el manejo de los rivales se puede ajustar, según el PRD 019, D9.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*
- Las pistas, el piso, los objetos y la señalética.
- El diseño vertical de Jugar Solo (D4). *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(El minimapa de Jugar Solo se suma según el PRD 017, D8.)* *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje. *(El timón elegido también se ve en Diseño General y en Diseño de Pistas → Entrar, según el PRD 021, D9: estilos de timón y pedales.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Diseño vertical | Cómo se acomoda Jugar Solo con la pantalla más alta que ancha (el de hoy). |
| Diseño horizontal | Cómo se acomoda con la pantalla más ancha que alta, a pantalla completa (D5). |
| Girar en plena carrera | Cambiar de vertical a horizontal o al revés mientras se corre. |

## 6. Requerimientos funcionales
- **RF-01 (D4):** en vertical, Jugar Solo se ve igual que hoy. *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(El minimapa de Jugar Solo se suma según el PRD 017, D8.)* *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- **RF-02 (D5):** en horizontal, la pista ocupa toda la pantalla, sin franjas a los lados.
- **RF-03 (D5):** en horizontal, la vuelta, la posición y el tiempo se ven arriba; el timón abajo a la izquierda; ACEL y FRENO abajo a la derecha, con el velocímetro encima; nada se corta ni se tapa. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)*
- **RF-04 (D6):** en horizontal la cámara muestra al menos 30 m hacia adelante.
- **RF-05 (D2):** al girar el celular en plena carrera, la carrera sigue: el mismo carro, en el mismo lugar, el cronómetro sigue y los rivales siguen.
- **RF-06 (D2):** después de girar, el timón, ACEL y FRENO responden en el diseño nuevo.
- **RF-07 (D4, D5):** el panel de resultado (¡META!, la tabla de posiciones, Revancha y Menú) se ve completo en los dos diseños; en horizontal, si no entra, se puede desplazar. *(Cambia según el PRD 020, D7: récords por pista.)*
- **RF-08 (D7, D8):** en PC, con la ventana más ancha que alta, se usa el diseño horizontal.
- **RF-09 (D3):** no aparece ningún aviso de "gira tu celular" y el estilo viejo ya no existe (`#pantalla-rotar`, `.rotar-icono`, `@keyframes balanceo`, `.rotar-msg`, `.rotar-titulo`, `.rotar-sub` y su media query).
- **RF-10 (D12):** los PRD de D12 tienen su nota; `CLAUDE.md` suma la jerarquía de los diseños y su carpeta, y la tabla de visores deja de decir que Jugar Solo es solo vertical; el backlog enlaza B20 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D9, D11), reglas del proyecto:** los diseños son clases de la vista (una superclase y una subclase por diseño, cada una en su archivo) que no dependen de que la carrera sea de un jugador. Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** elegir y aplicar el diseño es de la vista; el modelo no se entera del giro. La regla para elegirlo (D8) vive en una sola clase y la usan el visor, el HUD y el estilo de la pantalla.
- **RNF-03 (D9), anti-monolito:** ningún archivo pasa de 400 líneas; `VisorCarreraSolo` no crece.
- **RNF-04 (D10), pruebas:** navegador real con capturas en 390×844 y 844×390, y giro en plena carrera (lecciones 13 y 16). Las pruebas de layout de hoy siguen pasando en vertical; las que miden PC 1280×960 como columna de 480 se actualizan, porque en PC el diseño pasa a ser horizontal (D7). RF-04 se mide como en el PRD 009 (RF-08), con la altura de cámara por defecto.
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Jugar Solo se juega cómodo en vertical y en horizontal.
2. Girar el celular en plena carrera no la corta.
3. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **iPhone:** al girar, Safari cambia el alto visible por la barra de direcciones; el diseño se recalcula también cuando cambia el alto.
- **Pantallas muy anchas (PC):** el timón y los botones quedan en las esquinas; si se ven lejos, se ajusta en B23.
- **Altura de cámara alta:** en horizontal se usa la altura que eligió el jugador (1 a 8); con un carro corto y la altura cerca de 8, la cámara puede ver menos de 30 m adelante. Ya pasaba antes de este PRD; se deja así.
- **Multijugador (B3):** D11 deja los diseños listos, pero el multijugador puede necesitar mostrar más datos (por ejemplo, el nombre del otro jugador). El estilo horizontal está escrito para la pantalla de Jugar Solo: la pantalla del multijugador tendrá que sumarse a esas reglas.

### Historial
- **v1** (2026-10-25): primera versión, con las decisiones aceptadas por el usuario. El usuario pidió que los diseños sirvan también para jugar en grupo (D11).
- **v2** (2026-10-25): revisión única (forma corta), sin decisiones nuevas. Detalles: estilo horizontal limitado a la carrera activa (D1), control de botones (D5), cámara en PC (D8), panel de resultado con desplazamiento (RF-07), lista del estilo viejo (RF-09), una sola regla (RNF-02), pruebas de PC que se actualizan y RF-04 con la altura por defecto (RNF-04, riesgo de altura alta); D12 completa (PRD 001 en PC, RF-01, RF-09, cámara y `src/style.css`; PRD 002 elementos 2D; PRD 004 y 005 aspecto del juego; PRD 005 visores y controladores; timones, velocímetros y resultado solo de lugar; se saca el PRD 003, que no se reemplaza), carpeta de los diseños, cita de RF-07 y RF-10 con `CLAUDE.md`.
- **v3** (2026-10-25): implementado. Clases de la vista en `src/view/disenos/`: `DisenoCarrera`, `DisenoVertical`, `DisenoHorizontal`, `SelectorDisenoCarrera` (la regla de D8) y `AdaptadorDisenoCarrera` (marca la pantalla con `data-diseno` y la sigue al girar). `HudCarrera` y `VisorCarreraSolo` piden el ancho al diseño; `ControladorCarreraSolo` crea y destruye el adaptador. Estilo horizontal en `index.html`, limitado a la carrera activa; se borra el estilo del aviso de girar de `src/style.css`. Pruebas: `pruebas/modelo/prueba_disenos_carrera.js` y `pruebas/navegador/prueba_vertical_horizontal.mjs`; se actualizaron `prueba_hud_carrera.js` y `prueba_layout.mjs` (PC pasa a horizontal y se suma el caso 844×390).
- **v3.1** (2026-10-25): revisión después de programar (código, pruebas y contradicciones). Se corrige: la cámara del visor usa la regla del diseño (`camaraVertical` y `fovCamara` en `DisenoVertical` y `DisenoHorizontal`), el adaptador ya no expone un getter sin uso, la nota que faltaba en el PRD 005 y notas más precisas en los PRD 006 a 009, riesgo del estilo atado a Jugar Solo. Pruebas nuevas: HUD arriba (RF-03), 30 m después de girar (RF-04), los mismos 5 carros (RF-05), el carro responde a ACEL y al timón (RF-06), todo el estilo viejo (RF-09) y PC con FOV 55 en `prueba_visor_controlador.mjs`.

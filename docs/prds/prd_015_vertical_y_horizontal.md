# PRD 015 — Jugar Solo en vertical y en horizontal (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — escrito, falta la revisión única (forma corta) |
| Fecha | 2026-10-25 |
| Backlog | B20 (`docs/BACKLOG.md`) |
| Depende de | PRD 001 (Jugar Solo vertical), PRD 013 (rivales y posición en el HUD) |
| Reemplaza | Ver D12 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Solo Jugar Solo. Test Drive, Diseño de Pistas y Diseño General ya funcionan en horizontal y no cambian. |
| D2 | Alcance | Se puede jugar con el celular en vertical o en horizontal. Al girarlo en plena carrera, la carrera **sigue sin pausa**: no se reinicia, el cronómetro sigue y los rivales siguen. |
| D3 | Alcance | No se bloquea la orientación ni aparece un aviso de "gira tu celular". Se borra el estilo del aviso viejo `#pantalla-rotar`, que quedó sin uso. |
| D4 | Usuarios | El diseño **vertical** queda igual que hoy (PRD 001, D10). |
| D5 | Usuarios | El diseño **horizontal** usa la pantalla completa, sin franjas a los lados: arriba la vuelta, la posición y el tiempo; abajo a la izquierda el timón; abajo a la derecha ACEL y FRENO, con el velocímetro encima. |
| D6 | Usuarios | En horizontal se ve más pista hacia los costados y la cámara sigue mostrando al menos 30 m hacia adelante (PRD 009). |
| D7 | Usuarios | En PC, si la ventana es más ancha que alta, se usa el diseño horizontal. |
| D8 | Dominio | El diseño se elige solo por la forma de la pantalla: más ancha que alta es horizontal; si no, vertical. |
| D9 | Técnico | Cada diseño (vertical y horizontal) es una clase de la vista, en su propio archivo, con una superclase común. `VisorCarreraSolo` no crece (está en 376 de 400 líneas). |
| D10 | Técnico | Pruebas en navegador real con capturas en 390×844 y 844×390, y una prueba que gira la pantalla en plena carrera. |
| D11 | Alcance | Los dos diseños se arman para **cualquier carrera 3D**, no solo para la de un jugador: cuando exista el multijugador en 3D (B3), usa los mismos diseños sin rehacerlos. Este PRD no construye el multijugador. *(pedido del usuario)* |
| D12 | Dominio | **Reemplaza:** del PRD 001, su D10 (se suma el diseño horizontal) y "modo horizontal" en su Out of scope; del PRD 002, `VisorCarreraSolo`, `ControladorCarreraSolo` y `HudCarrera` dentro de "todas las clases de la carrera 3D", y `src/style.css`; del PRD 003, `index.html` y `src/style.css`; de los PRD 004 a 014, `src/style.css` (se cambian y se borran reglas, no solo se agregan); de los PRD 006 y 009 a 014, `HudCarrera` y "la cámara" (solo para ubicarse en horizontal); de los PRD 001, 006, 007, 008, 009 y 013, `ControlTimon` y los controles del jugador (solo su ubicación). Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Jugar Solo se diseñó en vertical (PRD 001). Hoy nada impide girar el celular, pero todo vive en una columna de 480 px centrada: en horizontal la carrera se ve como un vertical angosto con franjas negras a los lados, el timón y los botones quedan apretados y no se aprovecha la pantalla. Ninguna prueba revisa Jugar Solo en horizontal ni el giro en plena carrera.

## 2. Objetivo
Que Jugar Solo se juegue cómodo con el celular en cualquier posición, y que girarlo en plena carrera no la corte.

## 3. Público objetivo y usuarios
- **Jugador:** elige cómo sostener el celular y puede cambiar en plena carrera.
- **Desarrollador y agentes:** los dos diseños quedan listos para el multijugador en 3D (D11).

## 4. Alcance
**In scope:** D1 a D12.

**Out of scope:** cambiar el tamaño o la forma del timón y los botones (B23); el multijugador en 3D (B3, D11); las otras pantallas 3D (D1); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los choques, las vueltas, el cronómetro y los rivales (PRD 006 a 014): girar no cambia nada del juego.
- Las pistas, el piso, los objetos y la señalética.
- El diseño vertical de Jugar Solo (D4).
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Diseño vertical | Cómo se acomoda Jugar Solo con la pantalla más alta que ancha (el de hoy). |
| Diseño horizontal | Cómo se acomoda con la pantalla más ancha que alta, a pantalla completa (D5). |
| Girar en plena carrera | Cambiar de vertical a horizontal o al revés mientras se corre. |

## 6. Requerimientos funcionales
- **RF-01 (D4):** en vertical, Jugar Solo se ve igual que hoy.
- **RF-02 (D5):** en horizontal, la pista ocupa toda la pantalla, sin franjas a los lados.
- **RF-03 (D5):** en horizontal, la vuelta, la posición y el tiempo se ven arriba; el timón abajo a la izquierda; ACEL y FRENO abajo a la derecha, con el velocímetro encima; nada se corta ni se tapa.
- **RF-04 (D6):** en horizontal la cámara muestra al menos 30 m hacia adelante.
- **RF-05 (D2):** al girar el celular en plena carrera, la carrera sigue: el mismo carro, en el mismo lugar, el cronómetro sigue y los rivales siguen.
- **RF-06 (D2):** después de girar, el timón, ACEL y FRENO responden en el diseño nuevo.
- **RF-07 (D2):** el panel de resultado (Revancha y Menú) se ve completo en los dos diseños.
- **RF-08 (D7, D8):** en PC, con la ventana más ancha que alta, se usa el diseño horizontal.
- **RF-09 (D3):** no aparece ningún aviso de "gira tu celular" y el estilo viejo `#pantalla-rotar` ya no existe.
- **RF-10 (D12):** los PRD de D12 tienen su nota; `CLAUDE.md` suma la jerarquía de los diseños; el backlog enlaza B20 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D9, D11), reglas del proyecto:** los diseños son clases de la vista (una superclase y una subclase por diseño, cada una en su archivo) que no dependen de que la carrera sea de un jugador. Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** elegir y aplicar el diseño es de la vista; el modelo no se entera del giro.
- **RNF-03 (D9), anti-monolito:** ningún archivo pasa de 400 líneas; `VisorCarreraSolo` no crece.
- **RNF-04 (D10), pruebas:** navegador real con capturas en 390×844 y 844×390, y giro en plena carrera (lecciones 13 y 16). Las pruebas de layout de hoy siguen pasando en vertical.
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Jugar Solo se juega cómodo en vertical y en horizontal.
2. Girar el celular en plena carrera no la corta.
3. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **iPhone:** al girar, Safari cambia el alto visible por la barra de direcciones; el diseño se recalcula también cuando cambia el alto.
- **Pantallas muy anchas (PC):** el timón y los botones quedan en las esquinas; si se ven lejos, se ajusta en B23.
- **Multijugador (B3):** D11 deja los diseños listos, pero el multijugador puede necesitar mostrar más datos (por ejemplo, el nombre del otro jugador).

### Historial
- **v1** (2026-10-25): primera versión, con las decisiones aceptadas por el usuario. El usuario pidió que los diseños sirvan también para jugar en grupo (D11).

# PRD 008 — Superficie y choques (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v5 — implementado y verificado (Verificador PRD ✅), con pruebas en `pruebas/` |
| Fecha | 2026-10-24 |
| Backlog | B13 (`docs/BACKLOG.md`) |
| Depende de | PRD 006 (física de manejo) y PRD 007 (carros con personalidad) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | El pasto frena con rozamiento según la superficie, en vez del tope al 40 % más el arrastre ×3 de hoy. |
| D2 | Alcance | Hay choques contra los objetos sólidos junto a la pista: árboles, postes y señales de curva. Las flechas de curva **no** son sólidas, porque quedan sobre el piano. El carro rebota y pierde velocidad. No hay daños ni reinicio. *(v2, aprobado por el usuario)* *(Los tamaños de choque cambian según el PRD 010, D9.)* *(Las flechas pasan a ser sólidas según el PRD 011, D11.)* |
| D3 | Usuarios | Salirse al pasto cuesta más o menos lo mismo que hoy: el carro queda cerca del 40 % de su velocidad máxima. |
| D4 | Usuarios | Al chocar, el carro nunca atraviesa el objeto ni queda atrapado en él. |
| D5 | Dominio | La superficie (asfalto, piano o pasto) es una jerarquía de clases (`Superficie` y subclases) que el modelo consulta. Qué superficie hay bajo el carro (incluido el ancho del piano) lo calcula una clase nueva del modelo, sin tocar `Ruta`. *(v4 aprobado por el usuario)* *(Dónde viven las medidas de la superficie cambia según el PRD 009, D12: pasan a `MedidasEscena`.)* *(El ancho del piano no cambia; la ruta que se lee cambia según el PRD 014, D9.)* |
| D6 | Técnico | Los choques los calcula el modelo; el visor solo los aplica (MVC). El modelo crea una instancia por cada objeto, a partir de los datos de la pista, **sin cambiar esos datos**. `ObjetoSolido` es la superclase, con una subclase por tipo: árbol, poste y señal de curva (`CLAUDE.md`: variantes → subclases). *(v2; v3 aclara)* *(Solo la distancia de postes y señales cambia según el PRD 010, D9.)* *(La distancia de las flechas cambia según el PRD 011, D11.)* |
| D7 | Técnico | Solo para Jugar Solo. Las otras 4 pantallas del PRD 006 (D2) quedan como están. |
| D8 | Dominio | **Reemplaza:** del PRD 001, la D3 ("no hay choques"), el RF-07 (el pasto como tope) y "choques o daños" de su Out of scope. Del PRD 002, `CarreraVueltas`, `VisorCarreraSolo` y `ControladorCarreraSolo` dentro de "todas las clases de la carrera 3D". Del PRD 004, "el comportamiento y el aspecto del juego" (solo el pasto y los choques) y `CarreraVueltas`. Del PRD 005, "el comportamiento y el aspecto del juego 3D" (solo el pasto y los choques), `CarreraVueltas`, `VisorCarreraSolo` y `ControladorCarreraSolo`. Los PRD 006 y 007 ya dejan el pasto fuera de su alcance. Esos PRD llevan una nota que lo indica. *(v2: completa)* |
| D9 | Técnico | `Superficie` y `ObjetoSolido` se agregan a la tabla de jerarquías de `CLAUDE.md`. Lo nuevo va en clases aparte; el visor solo las llama, para no pasar de 400 líneas. *(v2)* |

## 1. Contexto y problema
Hoy el pasto baja el tope al 40 % y triplica el arrastre, pero no hay rozamiento por superficie. Los árboles, postes y señales junto a la pista se pueden atravesar como si no existieran. Salirse de la pista casi no tiene consecuencias visibles.

## 2. Objetivo
Que salirse de la pista se sienta: el pasto frena y los objetos son sólidos, sin volver el juego frustrante.

## 3. Público objetivo y usuarios
- **Jugador:** entiende que debe quedarse en el asfalto porque el pasto frena y los objetos lo detienen.
- **Jugador nuevo:** puede chocar sin quedar trabado ni tener que reiniciar.

## 4. Alcance
**In scope:** D1 a D9, solo en Jugar Solo (D7).

**Out of scope:** daños, reinicio, sonido de choque (B6), choques entre carros (B5), barreras a los lados de la pista (otro PRD; ya existen `BarreraEscena` y `GuardarrailEscena` en Diseño de Objetos) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- Las reglas de física del PRD 006 y las físicas por carro del PRD 007.
- Las vueltas, los puntos de control, `Cronometro`, `MuestraRuta` y el resultado.
- Los datos de cada pista (`ConfigPista*`) y `FabricaObjetoEscena`. *(Cambian según el PRD 010, D9: árbol, poste, señal y su distancia.)* *(También según el PRD 011, D11: flechas.)*
- `VisorTestdriveRecto`, `VisorTestdriveRuta`, `VisorCarreraUrbana` y `VisorDisenoPista` (D7). *(Estos visores cambian según el PRD 009, D12: tamaño del carro y cámara.)* *(Estos visores cambian el dibujo del piso y la altura del carro según el PRD 012, D11.)*
- `ControlTimon`, `ControlTeclado`, `CamaraSeguimiento`, los cielos, los velocímetros y `src/style.css`. *(`CamaraSeguimiento` sale de esta lista según el PRD 009, D12.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Superficie | El tipo de piso bajo el carro: asfalto, piano o pasto. Cada una frena distinto. |
| Rozamiento | Lo que frena al carro según la superficie, aun sin pisar el freno. |
| Objeto sólido | Árbol, poste o señal de curva de la pista que el carro no puede atravesar. |
| Choque | El carro toca un objeto sólido: rebota hacia afuera y pierde velocidad. |

## 6. Requerimientos funcionales
- **RF-01 (D1, D5):** si el carro entra al pasto por encima del 40 % de su velocidad máxima, pierde velocidad aunque se acelere, más que en el asfalto.
- **RF-02 (D3):** acelerando a fondo en el pasto, la velocidad se estabiliza cerca del 40 % de la máxima (entre 35 % y 45 %).
- **RF-03 (D1):** al volver al asfalto, el carro recupera la aceleración normal.
- **RF-04 (D5):** el piano frena poco: menos que el pasto y algo más que el asfalto.
- **RF-05 (D2):** el carro no puede atravesar ningún árbol, poste ni señal de curva.
- **RF-06 (D2):** las flechas de curva no detienen al carro. *(Reemplazado por PRD 011, D11: las flechas son sólidas.)*
- **RF-07 (D2):** al chocar, el carro rebota hacia afuera del objeto y pierde velocidad; más rápido = más pérdida.
- **RF-08 (D4):** después de un choque, el carro siempre puede seguir manejando: nunca queda atrapado dentro del objeto.
- **RF-09 (D2):** chocar no reinicia la carrera, no daña el carro y no detiene el cronómetro.
- **RF-10 (D7):** las otras 4 pantallas del PRD 006 (D2) se manejan igual que antes de este PRD.
- **RF-11 (D1, D2):** las vueltas y los puntos de control siguen funcionando igual con choques y pasto.
- **RF-12 (D8, D9):** los PRD 001, 002, 004 y 005 tienen la nota de D8, `CLAUDE.md` tiene las familias nuevas y el backlog enlaza B13 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D5, D6, D9), reglas del proyecto:** cada tipo de superficie y cada tipo de objeto sólido es una clase en su propio archivo; nada de `{ }` como entidad. Se cumple `CLAUDE.md` y la regla anti-monolito.
- **RNF-02 (D6), MVC:** las superficies y los choques viven en el modelo; el visor solo aplica el resultado (excepción de visores 3D de `CLAUDE.md`).
- **RNF-03, rendimiento:** detectar choques no baja Jugar Solo de 30 FPS en un celular de gama media.
- **RNF-04, pruebas:** pasto y choques se prueban en el modelo con reloj controlado (lección 9), incluido el caso de chocar a máxima velocidad.
- **RNF-05, entrega:** llega a `main` solo cumpliendo "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo, salirse al pasto frena el carro aunque se acelere.
2. El carro no atraviesa árboles, postes ni señales y nunca queda atrapado.
3. La carrera se puede terminar normalmente aunque se choque.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Pruebas del pasto actual:** `prueba_carrera_vueltas.js`, `prueba_modelo_completo.js` y `prueba_visor_controlador.mjs` comprueban el tope y el arrastre ×3 del RF-07 del PRD 001; se reescriben y citan los RF de este PRD (lección 10).
- **Posición de los objetos y ancho del piano:** hoy solo los conoce la vista (el modelo solo sabe dónde empieza el pasto); el modelo tiene que calcularlos igual a partir de los datos de la pista.
- **Pistas distintas:** solo Ciudad tiene árboles y postes; las demás solo tienen señales de curva.
- **Choques a alta velocidad:** el carro podría saltarse un objeto entre dos pasos; RF-05 y RNF-04 lo cubren.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): Reparador PRD, vuelta 1. Decisiones aprobadas por el usuario: D2 con objetos sólidos sin flechas, D6 con `ObjetoSolido` sin cambiar los datos, D9 tabla de `CLAUDE.md` y clases aparte. Detalles: contexto del pasto corregido (arrastre ×3), D8 completa con los PRD 002 y 004, cita del RF-11 corregida, riesgo de pruebas viejas y se quita "mover objetos en los datos".
- **v3** (2026-10-24): Reparador PRD, vuelta 2. Detalles: depende también del PRD 007, D6 aclara instancia y subclases de `ObjetoSolido`, D8 suma `CarreraVueltas` (PRD 002) y `ControladorCarreraSolo` (PRD 005), D8 entra al In scope, riesgo del ancho del piano.
- **v4** (2026-10-24): cierre con el usuario. Decisión aprobada: el ancho del piano lo calcula una clase nueva del modelo, sin tocar `Ruta` (D5). Detalles: RF-01 y D3 precisan "de la velocidad máxima", historial ordenado.
- **v5** (2026-10-24): implementado y verificado con el Verificador PRD; estado al día. La creación de los sólidos queda en `FabricaObjetosSolidos` (responsabilidad única).

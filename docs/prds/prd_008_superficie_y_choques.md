# PRD 008 — Superficie y choques (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B13 (`docs/BACKLOG.md`) |
| Depende de | PRD 006 (física de manejo) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | El pasto frena de verdad, con más rozamiento, en vez de solo bajar el tope de velocidad. |
| D2 | Alcance | Hay choques contra los objetos sólidos junto a la pista (árboles, postes y señales): el carro rebota y pierde velocidad. No hay daños ni reinicio. |
| D3 | Usuarios | Salirse al pasto cuesta más o menos lo mismo que hoy: el carro queda cerca del 40 % de su velocidad. |
| D4 | Usuarios | Al chocar, el carro nunca atraviesa el objeto ni queda atrapado en él. |
| D5 | Dominio | La superficie (asfalto, piano o pasto) es una jerarquía de clases que el modelo consulta. |
| D6 | Técnico | Los choques los calcula el modelo; el visor solo los aplica (MVC). |
| D7 | Técnico | Solo para Jugar Solo. Test Drive y Diseño General quedan como están. |
| D8 | Dominio | **Reemplaza:** del PRD 001, la D3 ("no hay choques"), el RF-07 (el pasto como tope) y "choques o daños" de su Out of scope. Del PRD 005, `CarreraVueltas` y los visores 3D de su lista de lo que no se modifica. Los PRD 001 y 005 llevan una nota que lo indica. |

## 1. Contexto y problema
Hoy el pasto solo baja el tope de velocidad: si el carro ya va lento, no se nota. Los árboles y las señales junto a la pista se pueden atravesar como si no existieran. Salirse de la pista casi no tiene consecuencias visibles.

## 2. Objetivo
Que salirse de la pista se sienta: el pasto frena y los objetos son sólidos, sin volver el juego frustrante.

## 3. Público objetivo y usuarios
- **Jugador:** entiende que debe quedarse en el asfalto porque el pasto frena y los objetos lo detienen.
- **Jugador nuevo:** puede chocar sin quedar trabado ni tener que reiniciar.

## 4. Alcance
**In scope:** rozamiento por superficie (D1, D5) y choques contra los objetos sólidos (D2, D4), solo en Jugar Solo (D7).

**Out of scope:** daños, reinicio, sonido de choque (B6), choques entre carros (B5) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- Las reglas de física del PRD 006 y las físicas por carro del PRD 007.
- Las vueltas, los puntos de control, el cronómetro y el resultado.
- Test Drive y Diseño General (D7).
- Los controles, la cámara, los cielos, los velocímetros y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Superficie | El tipo de piso bajo el carro: asfalto, piano o pasto. Cada una frena distinto. |
| Rozamiento | Lo que frena al carro según la superficie, aun sin pisar el freno. |
| Objeto sólido | Árbol, poste o señal colocada por la pista que el carro no puede atravesar. |
| Choque | El carro toca un objeto sólido: rebota hacia afuera y pierde velocidad. |

## 6. Requerimientos funcionales
- **RF-01 (D1, D5):** en el pasto el carro pierde velocidad aunque se acelere, más que en el asfalto.
- **RF-02 (D3):** acelerando a fondo en el pasto, la velocidad se estabiliza cerca del 40 % de la máxima (entre 35 % y 45 %).
- **RF-03 (D1):** al volver al asfalto, el carro recupera la aceleración normal.
- **RF-04 (D5):** el piano frena poco: menos que el pasto y algo más que el asfalto.
- **RF-05 (D2):** el carro no puede atravesar ningún objeto sólido junto a la pista.
- **RF-06 (D2):** al chocar, el carro rebota hacia afuera del objeto y pierde velocidad; más rápido = más pérdida.
- **RF-07 (D4):** después de un choque, el carro siempre puede seguir manejando: nunca queda atrapado dentro del objeto.
- **RF-08 (D2):** chocar no reinicia la carrera, no daña el carro y no detiene el cronómetro.
- **RF-09 (D7):** Test Drive y Diseño General se manejan igual que antes de este PRD.
- **RF-10 (D6):** las vueltas y los puntos de control siguen funcionando igual con choques y pasto.
- **RF-11 (D8):** los PRD 001 y 005 tienen la nota de D8 y el backlog enlaza B13 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D5), reglas del proyecto:** cada superficie es una clase en su propio archivo; nada de `{ }` como entidad. Se cumple `CLAUDE.md` y la regla anti-monolito.
- **RNF-02 (D6), MVC:** las superficies y los choques viven en el modelo; el visor solo aplica el resultado (excepción de visores 3D de `CLAUDE.md`).
- **RNF-03, rendimiento:** detectar choques no baja Jugar Solo de 30 FPS en un celular de gama media.
- **RNF-04, pruebas:** pasto y choques se prueban en el modelo con reloj controlado (lección 9), incluido el caso de chocar a máxima velocidad.
- **RNF-05, entrega:** llega a `main` solo cumpliendo "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo, salirse al pasto frena el carro aunque se acelere.
2. El carro no atraviesa árboles ni señales y nunca queda atrapado.
3. La carrera se puede terminar normalmente aunque se choque.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Hoy no hay barreras en las pistas:** solo decoración (árboles y señales). Si se quieren barreras a los lados, va en otro PRD.
- **Objetos muy cerca del asfalto:** podrían tapar el camino; se mueven en los datos de la pista sin tocar los RF.
- **Choques a alta velocidad:** el carro podría saltarse un objeto entre dos pasos; RF-05 y RNF-04 lo cubren.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario y los choques con los PRD 001 y 005 resueltos en D8. En D2, "barreras" se aclara como "objetos sólidos junto a la pista", porque las pistas no tienen barreras.

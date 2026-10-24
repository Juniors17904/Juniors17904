# PRD 007 — Carros con personalidad (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B12 (`docs/BACKLOG.md`) |
| Depende de | PRD 006 (física de manejo) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | El carro elegido en el garaje usa su propia física. Hoy todos manejan igual. |
| D2 | Alcance | Cada tipo de carro tiene masa (cuánto le cuesta acelerar y frenar) y agarre (cuánto derrapa). |
| D3 | Usuarios | Las diferencias se notan, pero ninguno queda injugable: en Ciudad, el más lento termina la vuelta a menos de 15 % del más rápido. |
| D4 | Usuarios | El garaje muestra los datos de cada carro con barras simples: velocidad, aceleración y agarre. |
| D5 | Dominio | Un registro del modelo decide qué clase de física corresponde a cada modelo del garaje. |
| D6 | Dominio | Hay 6 modelos en el garaje (deportivo, SUV, muscle, fórmula, pickup y clásico) y solo 3 físicas. Se crean las 3 que faltan. |
| D7 | Técnico | El turbo por tipo de carro no entra; es B9. |
| D8 | Dominio | **Reemplaza:** del PRD 005, los visores 3D de su lista de lo que no se modifica, solo para crear el carro desde el registro. Amplía (no contradice) la D4 del PRD 001: el carro del garaje ahora también trae su física. Los PRD 001 y 005 llevan una nota que lo indica. |

## 1. Contexto y problema
En el garaje se elige entre 6 carros, pero todos manejan igual: los visores siempre crean el mismo `Carro` básico. Las clases `CarroDeportivo`, `CarroSUV` y `CarroMusculo` existen y nadie las usa. Elegir carro solo cambia el aspecto.

## 2. Objetivo
Que elegir carro sea una decisión de juego: cada uno se maneja distinto y el garaje muestra en qué se diferencia.

## 3. Público objetivo y usuarios
- **Jugador:** elige el carro por cómo se maneja, no solo por cómo se ve.
- **Jugador nuevo:** entiende las diferencias mirando las barras del garaje.

## 4. Alcance
**In scope:** masa y agarre por tipo (D2), las 6 físicas (D6), el registro (D5), las barras del garaje (D4) y que los visores 3D creen el carro elegido (D1).

**Out of scope:** turbo por carro (B9), mejoras o compras de carros, pasto y choques (PRD 008) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- Las reglas de física del PRD 006 (giro, aire y aceleración): cada carro solo cambia sus números.
- `CarreraVueltas`, `Cronometro`, `MuestraRuta` y la regla del pasto al 40 %.
- Los perfiles de dibujo del garaje (`PerfilCarro` y sus subclases) y los modelos 3D.
- Los controles, la cámara, los cielos, los velocímetros y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Masa | Cuánto le cuesta al carro ganar y perder velocidad. |
| Agarre | Cuánto se pega el carro al piso en curva; menos agarre = más derrape. |
| Física del carro | Subclase de `Carro` con los números de un tipo (por ejemplo, `CarroPickup`). |
| Registro de carros | Clase del modelo que entrega la física que corresponde a un modelo del garaje. |

## 6. Requerimientos funcionales
- **RF-01 (D1, D6):** cada uno de los 6 modelos del garaje tiene su propia física.
- **RF-02 (D1):** en Jugar Solo, Test Drive y Diseño General se maneja con la física del carro elegido.
- **RF-03 (D5):** si el modelo elegido no tiene física registrada, se usa la del carro básico y se registra el error en la consola.
- **RF-04 (D2):** un carro con más masa tarda más en llegar al tope y en frenar que uno con menos masa.
- **RF-05 (D2):** en la misma curva y a la misma velocidad, un carro con menos agarre derrapa más.
- **RF-06 (D3):** en Ciudad, la vuelta del carro más lento tarda menos de 15 % más que la del más rápido.
- **RF-07 (D3):** todos los carros pueden completar las 3 vueltas de Jugar Solo sin quedar trabados en ninguna curva.
- **RF-08 (D4):** el garaje muestra, para el carro elegido, tres barras: velocidad, aceleración y agarre.
- **RF-09 (D4):** las barras salen de la física del carro y cambian al elegir otro.
- **RF-10 (D4):** las barras se ven completas en vertical y en horizontal, sin tapar el carro ni los botones.
- **RF-11 (D8):** los PRD 001 y 005 tienen la nota de D8 y el backlog enlaza B12 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D5, D6), reglas del proyecto:** cada física es una clase en su archivo dentro de `src/model/carros/`; el registro es una clase, no un `{ }`. Se cumple `CLAUDE.md` y la regla anti-monolito.
- **RNF-02 (D4), MVC:** las barras son vista; leen los datos del modelo y no calculan física.
- **RNF-03 (D3), pruebas:** las pruebas comparan los carros en el modelo con reloj controlado (lección 9). Las barras se prueban en navegador real (lección 13).
- **RNF-04, entrega:** llega a `main` solo cumpliendo "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. Cambiar de carro en el garaje cambia cómo se maneja en Jugar Solo.
2. El garaje muestra las 3 barras y cambian con el carro.
3. Todos los carros pueden terminar una carrera en Ciudad.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Balance:** un carro puede quedar demasiado bueno; se ajustan sus números sin tocar los RF.
- **Supuesto:** el garaje guarda el modelo elegido y la carrera lo puede leer; si no, se agrega solo esa lectura.
- **Depende del PRD 006:** sin masa ni aire en la física base, los carros solo se diferenciarían por el tope.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario y los choques con los PRD 001 y 005 resueltos en D8.

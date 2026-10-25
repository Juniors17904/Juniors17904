# PRD 013 — Rivales de la PC en Jugar Solo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — implementado, con pruebas en `pruebas/` |
| Fecha | 2026-10-25 |
| Backlog | B5 (`docs/BACKLOG.md`) |
| Depende de | PRD 011 (señalética): se programa cuando llegue a `main`, porque también toca Jugar Solo |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Solo en Jugar Solo: **4 rivales de la PC y el jugador**, 5 carros en total. Las otras 4 pantallas 3D no cambian. |
| D2 | Usuarios | 4 personalidades fijas, cada una con nombre visible, carro y color distintos: **Prudente** (frena antes de las curvas, casi no se equivoca), **Agresivo** (rápido, frena tarde, a veces se sale), **Novato** (lento e irregular, pisa pasto) y **Experto** (el más rápido, con errores muy raros). |
| D3 | Usuarios | Manejo natural: cada rival sigue la pista con pequeñas variaciones y comete errores al azar según su personalidad. Nunca hace trampa: usa la misma física, el mismo pasto y los mismos choques que el jugador. |
| D4 | Usuarios | Llegada natural **de los 5 carros** *(v2, decisión del usuario)*: cada uno llega entre 2 y 15 segundos después del anterior. Para lograrlo, los rivales ajustan su ritmo según el jugador: el que va muy adelante afloja y el que va muy atrás arriesga más, sin pasar nunca el tope de su física. Si el jugador es más rápido o más lento de lo que la física de los rivales permite alcanzar, la diferencia puede salir de ese rango. |
| D5 | Usuarios | Arriba se ve la posición en vivo ("2.º/5"). Si el jugador llega antes, los rivales **siguen corriendo** hasta terminar y la tabla final se completa con sus tiempos reales *(v2, decisión del usuario)*. La tabla muestra los 5 puestos con nombre y tiempo, y la mejor vuelta del jugador. |
| D6 | Dominio | Cada rival es una clase: una superclase `PilotoPC` y una subclase por personalidad (`PilotoPrudente`, `PilotoAgresivo`, `PilotoNovato`, `PilotoExperto`), en `src/model/pilotos/`. El piloto decide las entradas del carro (acelerar, frenar y girar) en cada paso de la física, no una vez por cuadro. Su azar sale de una semilla que se puede fijar para las pruebas. Cada rival tiene su propio `Carro`, `CarreraVueltas` y `Cronometro`, sin modificar esas clases. |
| D7 | Técnico | Los carros chocan entre sí con la misma forma rectangular del PRD 009 (D6) y rebotan como con los árboles. Se agrega a `DetectorChoques` sin cambiar los choques que ya existen, revisando solo lo cercano (como pide el PRD 011, RNF-04). |
| D8 | Técnico | Lo nuevo va en clases aparte. `VisorCarreraSolo` crea, avanza con paso fijo y dibuja a los rivales (excepción de visores de `CLAUDE.md`). Se permite **sacar código del visor a clases nuevas** para hacer espacio, sin cambiar cómo se juega *(v2, decisión del usuario)*. Ningún archivo pasa de 400 líneas. |
| D9 | Dominio | **Reemplaza:** del PRD 001, "rivales" de su Out of scope, y amplía su D2 y su RF-10 (la tabla). De las listas de lo que no se modifica: `VisorCarreraSolo` (PRD 001, 002, 005 y 010) y `ControladorCarreraSolo` (PRD 002 y 005), para crear, mover, dibujar y reiniciar a los rivales y para lo que permite D8; `DetectorChoques` (PRD 002), para los choques entre carros; `HudCarrera` (PRD 006, 009, 010, 011 y 012) y "el resultado" de Jugar Solo (PRD 006 y 008), para la posición y la tabla; "el comportamiento y el aspecto del juego" (PRD 004 y 005), solo los rivales en Jugar Solo; y `src/style.css` (PRD 001, 002, 004, 005, 006, 008, 009, 010, 011 y 012), solo para agregar reglas de la posición y la tabla. Esos PRD llevan una nota; la del PRD 011, cuando llegue a `main`. |

## 1. Contexto y problema
En Jugar Solo el jugador corre sin nadie al lado: solo compite contra el reloj, y la carrera no se siente como una competencia. El multijugador en línea (B3) todavía no existe porque faltan las claves de Supabase.

## 2. Objetivo
Que Jugar Solo sea una carrera de verdad contra 4 rivales que manejan como personas distintas y llegan a la meta de forma natural, sin depender de internet.

## 3. Público objetivo y usuarios
- **Jugador:** tiene contra quién correr, ve en qué puesto va y a veces gana y a veces no.
- **Desarrollador y agentes:** agregan o ajustan una personalidad creando una subclase de `PilotoPC`.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** el multijugador en línea (B3); elegir la cantidad de rivales o su dificultad; rivales en las otras 4 pantallas; sonido (B6); récords (B7); turbo (B9); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física: `Carro`, `ConstantesFisica` y las 6 físicas de carro. Los rivales las usan tal cual (el pedal es todo o nada; la dirección, gradual).
- `CarreraVueltas`, `Cronometro`, `MuestraRuta`, `Ruta` y `DetectorSuperficie`: se crea una instancia por rival.
- Los choques con árboles, postes y señales (PRD 008, 010 y 011).
- La pista, sus objetos, el piso (PRD 012) y la señalética (PRD 011).
- La cámara, los controles del jugador, los cielos y las reglas que ya existen en `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Rival | Un carro de la PC con su propio piloto, vueltas y tiempo. |
| Piloto PC | La clase que decide cómo maneja un rival. Hay una por personalidad. |
| Error natural | Una equivocación al azar del piloto: abrirse en una curva, frenar tarde o pisar el pasto. |
| Ajuste de ritmo | El cambio de ritmo de un rival para quedar cerca del jugador y de los demás (D4). |
| Posición | El puesto de cada carro según vueltas y avance; un carro que sale detrás de la meta cuenta como vuelta 0. |
| Grilla de salida | Los lugares de salida en filas, para que los 5 carros no aparezcan en el mismo punto. |

## 6. Requerimientos funcionales
- **RF-01 (D1):** al arrancar Jugar Solo hay 5 carros en la grilla de salida, sin tocarse, y todos esperan la cuenta 3-2-1-¡YA!
- **RF-02 (D2):** cada rival tiene nombre, carro y color distintos, y su nombre se ve en la tabla final.
- **RF-03 (D3):** los 4 rivales completan las 3 vueltas sin quedarse atascados ni salirse de la pista para siempre.
- **RF-04 (D2, D3):** en 10 carreras simuladas sin ajuste de ritmo, el Experto termina en promedio antes que el Novato, y el Novato pisa el pasto más veces que el Prudente.
- **RF-05 (D3, D6):** con semillas distintas, dos carreras no son iguales: los tiempos de cada rival cambian.
- **RF-06 (D3):** los rivales sufren el mismo freno del pasto y los mismos choques que el jugador.
- **RF-07 (D4):** con un jugador simulado que maneja a un ritmo normal, los 5 carros llegan separados entre 2 y 15 segundos en al menos 8 de cada 10 carreras simuladas.
- **RF-08 (D4):** un jugador que maneja bien puede ganar, y uno que maneja muy lento queda último.
- **RF-09 (D5):** durante la carrera se ve la posición del jugador ("2.º/5") y cambia al adelantar o ser adelantado.
- **RF-10 (D5):** si el jugador llega antes, los rivales siguen hasta terminar; después se ve la tabla con los 5 puestos, nombres y tiempos, y la mejor vuelta del jugador. Revancha vuelve a la grilla con los mismos 4 rivales y Menú vuelve a Inicio.
- **RF-11 (D7):** el jugador y los rivales no se atraviesan: al tocarse rebotan y pierden algo de velocidad.
- **RF-12 (D1):** las otras 4 pantallas 3D se ven y se manejan igual que antes.
- **RF-13 (D9):** los PRD de D9 tienen su nota; `CLAUDE.md` agrega la jerarquía `PilotoPC` y su carpeta `src/model/pilotos/`; el backlog enlaza B5 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6, D8), reglas del proyecto:** todo lo nuevo cumple `CLAUDE.md`: una clase por archivo, español, `#privados`, MVC (los pilotos, la posición y el ajuste de ritmo son del modelo) y ningún archivo de más de 400 líneas.
- **RNF-02 (D7), rendimiento:** con 5 carros, Jugar Solo mantiene al menos 30 cuadros por segundo en un celular común, y revisar los choques de los 5 carros sigue por debajo de 0,05 ms por paso.
- **RNF-03, pruebas:** el manejo, las llegadas y las posiciones se prueban en el modelo con carreras simuladas y semilla fija (se puede partir de `pruebas/modelo/piloto_automatico.cjs`); la posición en vivo, la tabla y los choques entre carros, en navegador real en vertical. Las pruebas citan los RF de este PRD.
- **RNF-04, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md` y la lista "Antes de llevar algo a main".

## 8. Criterios de aceptación del MVP
1. Jugar Solo arranca con 5 carros en la grilla y los 4 rivales terminan la carrera.
2. Cada rival maneja distinto y comete errores propios de su personalidad.
3. Las llegadas quedan separadas de forma natural y se ve la posición y la tabla final.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Límite de líneas:** `VisorCarreraSolo` está cerca de 400 y el PRD 011 también lo toca; por eso D8 permite sacar código a clases nuevas. Se vuelve a medir antes de programar.
- **Ajuste de ritmo visible:** si es muy fuerte, el jugador nota que los rivales lo esperan; se prueba con carreras simuladas.
- **Pruebas al azar:** las pruebas de RF-04, RF-05 y RF-07 usan semilla fija para no fallar de vez en cuando.
- **Rendimiento:** 4 carros más con sus modelos 3D pueden bajar los cuadros por segundo en celulares viejos.

### Historial
- **v1** (2026-10-25): primera versión, con las decisiones aceptadas por el usuario (4 rivales más el jugador).
- **v2** (2026-10-25): revisión única (forma corta). Decisiones del usuario: los rivales siguen corriendo si el jugador llega antes (D5); se permite sacar código del visor (D8); la llegada separada vale para los 5 carros (D4). Detalles: D9 completa (Out of scope del PRD 001, PRD 004, 005, 006, 008 y 009, `src/style.css`, "el resultado"), piloto por paso y con semilla, forma rectangular y choques solo cercanos, grilla de salida, carpeta `src/model/pilotos/`, pedal todo o nada y base `piloto_automatico.cjs`.

# PRD 024 — Acelerar y frenar sin retardo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — escrito, con las decisiones aprobadas por el usuario |
| Fecha | 2026-10-27 |
| Backlog | B26 (`docs/BACKLOG.md`) |
| Depende de | PRD 006 y 007 (física), PRD 016 (controles), PRD 019 (peso al girar) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Vale en Jugar Solo para el jugador y para los rivales, porque usan la misma física y no hacen trampa (PRD 013). |
| D2 | Usuarios | **Deslizar entre pedales:** deslizar el dedo de ACEL a FRENO, o al revés, cambia de pedal sin levantarlo, como pisar los pedales de un carro de verdad. |
| D3 | Usuarios | **Arranque más vivo:** todos los carros llegan a la mitad de su velocidad en unos 0,6 s (hoy, cerca de 1 s), sin cambiar su velocidad máxima ni el orden de rapidez entre ellos. |
| D4 | Usuarios | **Soltar frena un poco más:** al soltar ACEL el carro pierde velocidad un poco más rápido que hoy (freno de motor), para entrar mejor en las curvas. |
| D5 | Usuarios | **El freno queda igual:** hoy ya detiene el carro en menos de 0,7 s. |
| D6 | Técnico | **Medido en navegador real:** desde el toque hasta que cambia la velocidad no pasa más de un cuadro, también con pocas imágenes por segundo. Si aparece otra causa de retardo, se arregla dentro de este PRD. |
| D7 | Técnico | Se cuidan el balance entre los 6 carros (PRD 007) y la llegada pareja de los rivales en Normal (PRD 013 y 018). Los tiempos de vuelta bajan, así que los récords viejos (PRD 020) quedan más fáciles de batir; no se borran ni se ajustan. |
| D8 | Dominio | **Reemplaza (solo para el arranque, el freno de motor y deslizar entre pedales):** la aceleración y el arrastre al soltar de la física de los PRD 006 y 007 (y la física en las listas de los PRD 008 a 020, como hizo el PRD 019); `ControlTimon` y los controles de Jugar Solo en las listas de los PRD 016 y 021; "cómo se toca" del PRD 021; los tiempos de vuelta del PRD 019 (D7) y el riesgo de física nueva del PRD 020. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Al probar en el celular, acelerar y frenar se siente con retardo y maniobrar en la pista es incómodo. El toque llega enseguida al carro, pero: para pasar de ACEL a FRENO hay que levantar el dedo y volver a apretar; el carro tarda unos 2 s en llegar cerca de su tope, así que se siente pesado al salir de una curva; y al soltar ACEL casi no pierde velocidad.

## 2. Objetivo
Que los pedales respondan al instante y que el carro se sienta ágil para maniobrar.

## 3. Público objetivo y usuarios
- **Jugador en el celular:** pasa de acelerar a frenar deslizando el dedo y el carro reacciona enseguida.

## 4. Alcance
**In scope:** D1 a D8.

**Out of scope:** el giro y la zona de giro (PRD 016), el turbo (B9), el giroscopio (B4), cambiar los récords guardados, y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La velocidad máxima, el freno y el giro de cada carro (PRD 006, 007 y 019).
- Las personalidades de los rivales y su manejo sin trampa (PRD 013).
- Los choques, el pasto, las vueltas, el cronómetro y los récords guardados (PRD 008 a 014 y 020).
- El tamaño, el lugar y los estilos de los botones (PRD 016 y 021), el sonido (PRD 022) y las otras pantallas.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Arranque | Lo rápido que el carro gana velocidad al apretar ACEL. |
| Freno de motor | Lo que el carro frena solo al soltar ACEL, sin tocar FRENO. |
| Deslizar entre pedales | Pasar el dedo de un botón al otro sin levantarlo. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** con el dedo en ACEL, deslizarlo hasta FRENO pasa a frenar sin levantarlo; deslizarlo de vuelta pasa a acelerar.
- **RF-02 (D2):** el botón que queda bajo el dedo se ve apretado; el otro, suelto.
- **RF-03 (D2):** al levantar el dedo, donde sea, el carro deja de acelerar o frenar.
- **RF-04 (D2):** deslizar entre pedales no corta el giro de otro dedo (PRD 016, D7).
- **RF-05 (D3):** cada carro llega a la mitad de su velocidad máxima en 0,5 a 0,7 s, y su velocidad máxima no cambia.
- **RF-06 (D3, D7):** el orden de rapidez al arrancar entre los 6 carros es el mismo que antes.
- **RF-07 (D4):** al soltar ACEL, cada carro pierde la mitad de su velocidad más rápido que antes.
- **RF-08 (D5):** frenar a fondo detiene el carro en el mismo tiempo que antes.
- **RF-09 (D6):** desde el toque en ACEL o FRENO hasta que cambia la velocidad del carro pasa como mucho un cuadro, también con pocas imágenes por segundo.
- **RF-10 (D7):** en Normal con 4 rivales, las llegadas siguen separadas como pide el PRD 013 (RF-07), y en Fácil y Difícil siguen valiendo los RF-06 y RF-07 del PRD 018.
- **RF-11 (D8):** los PRD de D8 tienen su nota; el backlog enlaza B26 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D8), reglas del proyecto:** los números del arranque y del freno de motor viven en un solo lugar de la física; deslizar entre pedales es una clase de la vista en `src/view/controles/`, en su archivo. Se cumple `CLAUDE.md`.
- **RNF-02 (D1), MVC:** la física cambia en el modelo; los controles solo dicen qué pedal está apretado.
- **RNF-03 (D8), anti-monolito:** ningún archivo pasa de 400 líneas; `VisorCarreraSolo` no crece.
- **RNF-04 (D6), pruebas:** en el modelo, el arranque, el freno de motor, el freno y el orden de los carros, comparando con los valores de antes; en navegador real (390×844 y 844×390), deslizar entre pedales con toques reales y el tiempo hasta que cambia la velocidad.
- **RNF-05 (D8), entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. Se pasa de acelerar a frenar deslizando el dedo.
2. El carro arranca más rápido y frena un poco solo al soltar.
3. Las carreras contra los rivales siguen parejas en Normal.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Récords:** los tiempos bajan, así que los récords guardados antes de este PRD se baten más fácil (D7).
- **Rivales:** si las llegadas dejan de ser parejas, se ajustan los números de manejo de los pilotos sin cambiar sus personalidades (como permitió el PRD 019).
- **Pocas imágenes por segundo:** si el celular dibuja muy lento, el carro se ve reaccionar tarde aunque la física responda enseguida; eso se mide (RF-09), pero mejorar el dibujo queda fuera.

### Historial
- **v1** (2026-10-27): primera versión, con las 8 decisiones aprobadas por el usuario (opción A).

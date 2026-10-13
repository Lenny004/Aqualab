# AquaLab · Propuestas para el simulador a partir de los documentos

Fuentes: **D1** = *Agua lluvia en barril.docx* · **D2** = *Purificacion de agua para tomar y cultivar.docx* · **P1** = *Barril de agua lluvia.pptx* · **P2** = *Purificación de agua.pptx* · **X1** = *Presupuesto agua en barril.xlsx*. Texto extraído en `/workspace/h2_extract/*.txt` (5 archivos).

Cobertura del repo: **Sí** = ya existe · **Parcial** = existe algo relacionado · **No** = no existe.

## 1. Lo que ya hace el simulador (repo `purificador_agua3d`, sin modificar)
- Vite + Three.js, todo en `src/main.js` (unas 300 líneas). Una sola escena: un **barril/filtro de vidrio con capas apiladas**, un **balde** que vierte el agua por arriba, partículas, modo *Radiografía*, controles de cámara (centrar, acercar, alejar, fijar vista).
- `FILTERS` tiene 4 capas que se pueden activar o desactivar: **Grava**, **Arena**, **Carbón activado** (activas por defecto) y **Membrana fina** (desactivada). Cada capa tiene una duración y fracciones de reducción.
- Métricas ilustrativas: turbidez, **cloro**, minerales (mg/L) y microorganismos. Hay un índice de calidad de 0 a 100 con pesos fijos. Los valores de entrada están fijos en el código (`INITIAL`).
- UI: panel de capas, inspector (índice, comparación antes/después de la etapa), línea de tiempo con velocidades de 0,5× a 4×, gráfica de evolución, modal de ayuda. Avisa de que los datos son ilustrativos y de que no certifica potabilidad.
- **No tiene**: captación (techo, canaleta, malla), desvío de primeras aguas, sedimentación, desinfección, almacenamiento, separación entre uso para beber y uso para cultivo, cálculos, presupuesto, mantenimiento, riesgos ni control de calidad. Las métricas "cloro" y "minerales", y la "membrana", no corresponden al sistema de barril que describen los documentos (D2 solo menciona la ósmosis inversa como antecedente de Israel).

## 2. Resumen de lo que dicen los documentos
- **Idea central**: barreras múltiples desde el techo hasta el punto de uso. "FILTRAR NO ES LO MISMO QUE POTABILIZAR" (D2). El agua se trata como **NO POTABLE** hasta que un laboratorio confirme que cumple el **RTS 13.02.01:14** (El Salvador). La NSO 13.07.01:08 está derogada (D1).
- **Secuencia en 8 pasos del barril (P1, D1 §6.1)**: techo y canaleta → malla → primeras aguas → depósito de agua cruda → filtro → desinfección validada → depósito limpio → control. Recomienda **separar el agua cruda de la tratada**: no presentar un único barril con capas como sistema completo.
- **Secuencia en 10 pasos (D2)**: superficie → canaleta con malla → desvío de primera escorrentía → **sedimentación** → grava graduada → arena silícea lavada → carbón activado certificado → desinfección → almacenamiento higiénico → verificación.
- **Orden de los medios (P1, diap. 7)**: entrada → grava lavada → arena filtrante → carbón activado* → salida. El asterisco dice que es una ilustración: orden, espesor y granulometría deben venir de un diseño hidráulico. Las capas van separadas con malla y no deben compactarse. Tampoco se debe usar tierra de jardín.
- **Función de cada material (D2)**: grava = soporte y retención de partículas gruesas; arena = turbidez; carbón = adsorción, olor y sabor, se satura y puede favorecer crecimiento microbiano; zeolita = adsorción e intercambio iónico (Tikal), solo como etapa complementaria; malla sanitaria. Ninguno elimina patógenos de forma garantizada.
- **Desinfección**: barrera validada (cloración controlada o tratamiento térmico). La dosis no se improvisa y se mide el cloro residual libre. La ebullición sirve como medida de emergencia, pero no elimina químicos.
- **Cálculos (D1, X1)**: V = P×A×C. Ejemplo: 20 mm × 40 m² × 0,80 = **640 L**. El barril es de **200 L** nominales (unos 200 kg de agua, base para más de 200 kg). Número de barriles = ROUNDUP(640/200) = **4** en X1. En el ejemplo de D1, 400/200 = 2. Demanda no potable de ejemplo: **40 L/día**. Primera descarga: **25 L** (la OMS cita 20–25 L como orientación). Caudal Q = volumen/tiempo, con ejemplo de **2 L/min** y prueba de 10 L, es decir **5 min**. En X1 los "días de cobertura" aparecen vacíos porque la fórmula `=B7*B9/B10` apunta a celdas desplazadas; con los valores visibles daría 4×200/40 = 20 días.
- **Presupuesto (X1, USD ilustrativos, no son cotizaciones)**: barril 45; malla 8; canaleta y bajante 45; desviador 25; recipiente de prefiltro 15; grava 10; arena 12; carbón 22; tuberías 30; válvulas y grifos 18; depósito final 45; tapa, malla de rebose y sellos 10; herramientas 15; pruebas de calidad iniciales 55; desinfección y equipo de control 30; señalización 5. **Subtotal 390 + contingencia 10 % (39) = 429**.
- **Indicadores (D1)**: volumen captado, reducción de turbidez (%), caudal, cumplimiento microbiológico, disponibilidad, costo por litro, % de mantenimiento cumplido, % de aprovechamiento.
- **Calidad (D1, X1, P2)**: físicas (turbidez, color, olor, temperatura); químicas (pH, conductividad, cloro residual, nitratos y nitritos, metales); microbiológicas (E. coli, coliformes). Puntos de muestreo: agua captada → después del filtro → después de la desinfección.
- **Para cultivo (D2, FAO)**: EC, TDS, pH, sodio/SAR, cloruros, boro y nitratos. Riego por goteo y más cuidado con cultivos que se comen crudos.
- **Mantenimiento**: después de cada lluvia (mallas, desviador, rebose), semanal (tapa, grifo, insectos), mensual (tuberías, base, caudal, turbidez), según desempeño (medios y carbón), anual. D2 añade purga del sedimentador al menos mensual y limpieza del tanque por biofilm.
- **Cronograma (D1, X1)**: 8 fases (inspección 1–2 d, medición 1–2 d, diseño 2–4 d, compra 2–5 d, montaje 1–3 d, pruebas 1–2 d, laboratorio según plazos, entrega 1 d).
- **Contexto adicional (D2, P2)**: antecedentes (mayas de Tikal, incas, India, Egipto, China, aljibes de España, chinampas de México, EE. UU., Israel); el proceso de potabilización de ANDA; los Métodos A, B y C y los Diseños 1, 2 y 3; pozo privado y comunitario; ciclo de un manantial.

## 3. Propuestas (agrupadas por categoría)

### A. Captación de agua lluvia y barril
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| A1 | Escena de captación | Modelo 3D de techo, canaleta con pendiente, bajante y **malla para hojas e insectos** antes del barril | D1, P1, D2 | No (hoy el agua entra con un balde) |
| A2 | Desviador de primeras aguas | Tubo o cámara que retiene la primera escorrentía (25 L de ejemplo, editable) con drenaje. Animación de agua sucia que se desvía | D1, X1, P1 | No |
| A3 | Rebose seguro | Salida de rebose con malla cuando el barril llega a 200 L, con mensaje sobre erosión y cimientos | D1, P1 | No |
| A4 | Arquitectura de recipientes separados | Depósito de agua cruda → filtro → desinfección → depósito de agua tratada, como alternativa al barril único. Aviso de que un barril con capas no es un sistema completo | D1 §6.1, P1 | No (el modelo actual es un solo barril con capas) |
| A5 | Barril realista | Barril opaco con tapa, grifo higiénico y base nivelada. Indicar masa de unos 200 kg + equipo | D1, P1 | Parcial (barril de vidrio) |
| A6 | Tipos de techo y riesgos | Selector de techo: compatible o con pinturas, plomo o asbesto (excluido para beber) | D1 | No |

### B. Etapas de filtración
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| B1 | Etapa de sedimentación | Tanque o cámara de reposo con purga de lodos antes del filtro | D2 (Egipto, ANDA, Métodos A–C) | No |
| B2 | Prefiltro de sedimentos | Etapa previa al lecho granular | D1, X1 (MAT-05) | No |
| B3 | Orden documentado de capas | Grava → arena → carbón, con nota de que es una ilustración conceptual y de que el orden, espesor y granulometría se definen por diseño hidráulico | P1 diap. 7, D1 §5.3 | Sí (mismo orden; falta la nota) |
| B4 | Mallas separadoras entre capas | Mostrar mallas que evitan el arrastre de arena y carbón | D2 §2.1 | No |
| B5 | Carbón opcional y que se satura | Marcar el carbón como "opcional"; estado de saturación con el uso | P1, D1, D2 | Parcial (se puede desactivar, sin saturación) |
| B6 | Capa de zeolita (experimental) | Capa opcional con aviso "caracterizada, complementaria, no sustituye desinfección" | D2 (Tikal, tabla de materiales) | No |
| B7 | Revisar la "Membrana fina" | No aparece en el sistema de barril. Quitarla o etiquetarla como avanzada (ósmosis inversa, solo como referencia de Israel: requiere pretratamiento, energía y mantenimiento) | D2 §3.10 | Existe, pero sin respaldo en los documentos |
| B8 | Ajustar métricas | Cambiar "cloro" y "minerales" por los parámetros de los documentos: turbidez, color, olor, pH, conductividad, E. coli y coliformes. La filtración **no** debe llevar microorganismos a niveles seguros | D1, P2, D2 | Parcial (hoy el carbón y la membrana reducen microorganismos un 35 % y un 93 %) |
| B9 | Caudal y colmatación | Calcular Q = L/min. Si baja, colmatación; si sube de forma inusual, canalización o rotura del lecho | D1 §7.4, X1 | No |

### C. Desinfección
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| C1 | Etapa de desinfección validada | Etapa posterior al filtro: cloración controlada o tratamiento térmico, con tiempo de contacto y cloro residual libre (sin dosis inventadas) | D1 §5.4, D2 | No |
| C2 | "Filtrar ≠ potabilizar" | Mensaje y animación: la filtración mejora la calidad física y solo la desinfección actúa como barrera microbiológica | D2, P2 diap. 6 | Parcial (aviso genérico en el README y el pie) |
| C3 | Ebullición como emergencia | Información: no elimina metales ni químicos; riesgo de recontaminar el agua hervida | D1, D2 (India) | No |
| C4 | La turbidez condiciona la desinfección | Aviso de que con turbidez alta la desinfección es menos eficaz ("no desinfectar a ciegas") | D1, P1 | No |

### D. Agua para tomar y agua para cultivar
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| D1 | Selector de uso final | Modos "Tomar", "Cultivar" y "Usos no potables" (riego ornamental, limpieza exterior, descarga sanitaria). Cambian las etapas y los indicadores | D2 §1, P1 diap. 9 | No |
| D2 | Recetas de diseño | Presets: Método A/Diseño 1 "Agua segura para tomar", Método B/Diseño 2 "Agua para cultivar" (filtro de sólidos, tanque cerrado, filtro de emisores, goteo) y Método C/Diseño 3 "Sistema comunitario" | D2 §5, §11 | No |
| D3 | Panel agronómico | EC, TDS, pH, sodio/SAR, cloruros, boro y nitratos, con qué indica cada uno y qué acción tomar | D2 §8.2 | No |
| D4 | Riego por goteo y cultivos comestibles | Módulo de goteo; diferencia entre cultivos que se comen crudos y cocidos; evitar mojar hojas y frutos | D2 §8.3 | No |
| D5 | Estado de liberación | Indicador "NO POTABLE" hasta completar la lista de verificación (Anexo A) y tener resultados de laboratorio | D1 Anexo A, P1 | No |

### E. Presupuesto, materiales y cálculos
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| E1 | Calculadora de captación | Entradas P, A y C → V. Número de barriles (ROUNDUP), días de cobertura con la demanda, aviso de rebose | D1 §7, X1 Cálculos | No |
| E2 | Presupuesto interactivo | Tabla MAT-01 a MAT-16, cantidades y precios editables, subtotal, contingencia del 10 % y total (390 / 39 / 429 por defecto). Aviso de que son "precios ilustrativos" | X1, D1 §13, P1 | No |
| E3 | Indicadores económicos | Costo inicial, costo anual, costo por litro, % de aprovechamiento, costo por evento de mantenimiento | D1 §13.1 | No |
| E4 | Ficha de materiales | Especificación y criterio de compra (barril sin uso químico previo, arena filtrante y no de construcción, carbón con ficha técnica) al pulsar cada componente 3D | D1 §8, X1 | Parcial (descripciones cortas de las capas) |
| E5 | Cronograma | Las 8 fases con duración y entregable | D1 §14, X1 | No |

### F. Mantenimiento, riesgos y control de calidad
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| F1 | Calendario de mantenimiento | Tareas por frecuencia (después de lluvia, semanal, mensual, según desempeño, anual) y por componente, con bitácora de responsable, hallazgo y costo | D1 §12, X1, P1, D2 §14 | No |
| F2 | Simular el deterioro | Con el tiempo de uso: carbón agotado, lecho colmatado, biofilm en el tanque, mosquitos en el desviador. Acción correctiva para cada caso | D1 §11, D2 §12 | No |
| F3 | Matriz de riesgos | Peligro → consecuencia → prevención → acción (excrementos, turbidez, techo químico, conexión cruzada, base inestable, falta de análisis) | D1 §11, P1 diap. 10, P2 diap. 10 | No |
| F4 | Puntos de muestreo | Sondas virtuales en agua captada, después del filtro y después de la desinfección, con parámetro, unidad y criterio RTS ("pendiente") | X1 Control de calidad, D2 §13 | Parcial (comparación antes/después por capa) |
| F5 | Pruebas físicas, químicas y microbiológicas | Tarjetas con los 11 parámetros de P2 diap. 9 | P2, D2 §7.2 | No |
| F6 | Indicadores del proyecto | Reducción de turbidez (%), disponibilidad (%), mantenimiento cumplido (%) | D1 §15 | Parcial (índice de calidad genérico) |

### G. UI y contenido educativo
| # | Propuesta | Qué agrega | Fuente | Repo |
|---|---|---|---|---|
| G1 | Timeline de 8 o 10 pasos | Ampliar la línea de tiempo con captación → malla → primeras aguas → sedimentación → capas → desinfección → almacenamiento → control | P1 diap. 4, D2 §2 | Parcial (timeline solo con capas) |
| G2 | Aviso de seguridad visible | Nota crítica: propuesta académica, no apta para beber sin laboratorio, referencia al RTS 13.02.01:14 | D1, P1 diap. 11 | Parcial |
| G3 | Línea de tiempo histórica | Tikal (zeolita y cuarzo), incas, India, Egipto, China, aljibes, chinampas, EE. UU., Israel; cada uno con su lectura "para tomar" y "para cultivar" | D2 §3, P2 diap. 7 | No |
| G4 | Proceso de ANDA | Animación de la planta: captación → cribado → coagulación y floculación → sedimentación → filtración → cloración → control, con la nota de que no se debe copiar a escala doméstica | D2 §4 | No |
| G5 | Ciclo del manantial | Precipitación → infiltración → percolación → acuífero → movimiento → salida → manantial | D2 §10 | No |
| G6 | Pozo privado y comunitario | Esquema educativo de pasos (sellado sanitario, prueba de caudal, análisis), sin valor de plano constructivo | D2 §9 | No |
| G7 | Ventajas y desventajas | Tabla 5 vs 5 | D2 §6 | No |
| G8 | Guion para exponer | Texto de D2 §15 como tarjeta o modo presentación | D2 §15 | No |
| G9 | Calidad del agua en El Salvador | MARN, Ministerio de Salud y ANDA; "evaluar con datos, no por apariencia" | P2 diap. 8, D1 | No |

## 4. Notas
- Todos los números de los documentos son ejemplos o valores ilustrativos (lluvia, precios, caudal, 25 L). El simulador debería mostrarlos como valores editables y con esa etiqueta.
- Los documentos no dan espesores, granulometrías, dosis de cloro ni límites numéricos del RTS. No hay que inventarlos.
- En X1, la fórmula de días de cobertura (`=B7*B9/B10`) y la de tiempo de prueba (`=B14/B13`) referencian celdas que no coinciden con las filas visibles, por eso salen vacías.

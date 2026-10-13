export const INITIAL = {
  turbidity: 86,
  color: 68,
  odor: 52,
  ph: 6.6,
  conductivity: 180,
  ecoli: 92,
  coliforms: 94,
};

const NO_MICROBIAL_REDUCTION = {
  turbidity: 0,
  color: 0,
  odor: 0,
  ph: 0,
  conductivity: 0,
  ecoli: 0,
  coliforms: 0,
};

export const LAYERS = [
  { id: 'captacion', name: 'Captación', short: 'Techo y canaleta', duration: 7, description: 'Techo inclinado, canaleta con pendiente y bajante conducen la lluvia.', reductions: NO_MICROBIAL_REDUCTION, enabled: true },
  { id: 'malla', name: 'Malla', short: 'Hojas e insectos', color: 0x8ad7c6, duration: 6, description: 'La malla retiene hojas e insectos antes de entrar al sistema.', reductions: { ...NO_MICROBIAL_REDUCTION, turbidity: 0.08 }, enabled: true },
  { id: 'primeras-aguas', name: 'Primeras aguas', short: 'Desviador con drenaje', duration: 8, description: 'Desvía el primer escurrimiento sucio. El volumen de referencia es editable en la UI.', reductions: { ...NO_MICROBIAL_REDUCTION, turbidity: 0.16, color: 0.08, odor: 0.04 }, enabled: true },
  { id: 'deposito-crudo', name: 'Depósito crudo', short: '200 L y rebose con malla', duration: 7, description: 'Depósito de agua cruda de 200 L nominales, con tapa y rebose protegido.', reductions: { ...NO_MICROBIAL_REDUCTION, turbidity: 0.05 }, enabled: true },
  { id: 'sedimentacion', name: 'Sedimentación opcional', short: 'Reposo y purga de lodos', duration: 8, description: 'Cámara opcional de reposo. Incluye purga de lodos y no sustituye la desinfección.', reductions: { ...NO_MICROBIAL_REDUCTION, turbidity: 0.28, color: 0.12 }, enabled: false },
  { id: 'filtro-granular', name: 'Filtro granular', short: 'Grava · arena · carbón', duration: 12, description: 'Orden conceptual: grava, arena y carbón activado, separados por mallas. Orden, espesor y granulometría requieren diseño hidráulico.', reductions: { ...NO_MICROBIAL_REDUCTION, turbidity: 0.45, color: 0.32, odor: 0.48 }, enabled: true },
  { id: 'disinfection', name: 'Desinfección', short: 'Cloración o tratamiento térmico', duration: 10, description: 'Etapa validada: mostrar tiempo de contacto y cloro residual libre: medir.', reductions: { ...NO_MICROBIAL_REDUCTION, turbidity: 0.02, ecoli: 0.92, coliforms: 0.92 }, enabled: true },
  { id: 'deposito-limpio', name: 'Depósito limpio', short: 'Tapa y grifo higiénico', duration: 7, description: 'Almacena el agua tratada en un depósito cerrado, con tapa y grifo higiénico.', reductions: NO_MICROBIAL_REDUCTION, enabled: true },
  { id: 'control', name: 'Control', short: 'Puntos de muestreo', duration: 6, description: 'Muestrea agua captada, después del filtro y después de la desinfección.', reductions: NO_MICROBIAL_REDUCTION, enabled: true },
];

export const METRICS = [
  { key: 'turbidity', label: 'Turbidez', unit: 'UTN · ilustrativo', max: 100 },
  { key: 'color', label: 'Color', unit: 'índice · ilustrativo', max: 100 },
  { key: 'odor', label: 'Olor', unit: 'índice · ilustrativo', max: 100 },
  { key: 'ph', label: 'pH', unit: 'ilustrativo', max: 14 },
  { key: 'conductivity', label: 'Conductividad', unit: 'µS/cm · ilustrativo', max: 500 },
  { key: 'ecoli', label: 'E. coli', unit: 'índice · ilustrativo', max: 100 },
  { key: 'coliforms', label: 'Coliformes', unit: 'índice · ilustrativo', max: 100 },
];

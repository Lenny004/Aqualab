/**
 * @module main
 * @description
 * Coordina la simulación educativa de purificación de agua, la interfaz HTML y
 * la escena 3D. El cálculo de calidad se mantiene separado del adaptador de
 * Three.js para que el mismo estado pueda representarse en métricas, timeline
 * y gráficos sin depender del renderizado.
 *
 * El modelo usa valores ilustrativos y no certifica potabilidad. Las métricas
 * de minerales se expresan en mg/L; turbidez, cloro y microorganismos se
 * representan como índices porcentuales de la simulación.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

/** @typedef {{ turbidity: number, chlorine: number, minerals: number, microorganisms: number }} WaterQuality */
/**
 * @typedef {Object} FilterDefinition
 * @property {string} id Identificador estable usado por la UI y la escena.
 * @property {string} name Nombre visible de la etapa.
 * @property {string} short Descripción breve para la lista de capas.
 * @property {number} color Color hexadecimal de la geometría de la capa.
 * @property {number} duration Duración didáctica de la etapa, en segundos simulados.
 * @property {string} description Explicación educativa de la etapa.
 * @property {{turbidity: number, chlorine: number, minerals: number, microorganisms: number}} reductions Fracciones de reducción por métrica.
 * @property {boolean} enabled Indica si la etapa participa en el recorrido actual.
 */
/** @typedef {{ filter: FilterDefinition|null, quality: WaterQuality, label: string }} SimulationStage */
/**
 * @typedef {Object} SimulationSnapshot
 * @property {FilterDefinition[]} filters Etapas activas en el orden de filtración.
 * @property {SimulationStage[]} stages Estado acumulado antes y después de cada etapa.
 * @property {WaterQuality} current Calidad interpolada en el timeline.
 * @property {number} currentIndex Índice de la etapa que se está mostrando.
 * @property {number} local Progreso dentro de la etapa actual, entre 0 y 1.
 * @property {number} totalDuration Duración total del recorrido, en segundos simulados.
 */

/**
 * Configuración declarativa de las etapas. La simulación recorre esta lista y
 * no necesita conocer detalles de la interfaz para calcular la calidad.
 * @type {FilterDefinition[]}
 */
const FILTERS = [
  { id: 'gravel', name: 'Grava', short: 'Partículas grandes', color: 0xb38d61, duration: 9, description: 'Retiene hojas, piedras y partículas visibles de mayor tamaño.', reductions: { turbidity: .26, chlorine: .02, minerals: .01, microorganisms: .04 } },
  { id: 'sand', name: 'Arena', short: 'Sedimentos finos', color: 0xd7b778, duration: 12, description: 'Atrapa sedimentos pequeños y reduce la turbidez del agua.', reductions: { turbidity: .56, chlorine: .04, minerals: .03, microorganisms: .16 } },
  { id: 'carbon', name: 'Carbón activado', short: 'Olor y compuestos', color: 0x385c52, duration: 14, description: 'Adsorbe compuestos que afectan el color, el olor y el sabor.', reductions: { turbidity: .19, chlorine: .68, minerals: .08, microorganisms: .35 } },
  { id: 'membrane', name: 'Membrana fina', short: 'Filtración avanzada', color: 0x48a9a7, duration: 13, description: 'Representa una etapa avanzada de filtración de microorganismos y sales.', reductions: { turbidity: .75, chlorine: .08, minerals: .64, microorganisms: .93 } },
];

/** Calidad inicial usada como referencia para todos los recorridos. Minerales: mg/L. */
const INITIAL = { turbidity: 92, chlorine: 68, minerals: 420, microorganisms: 88 };
const state = { progress: 0, playing: false, speed: 1, xray: false, selected: 'bucket', realElapsed: 0, lastFrame: performance.now() };
const dom = {};
let scene;

/** Limita un valor de entrada al intervalo permitido por el dominio visual. */
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const formatNumber = (value) => new Intl.NumberFormat('es-SV', { maximumFractionDigits: 0 }).format(Math.round(value));
const enabledFilters = () => FILTERS.filter((filter) => filter.enabled !== false);

FILTERS.forEach((filter, index) => { filter.enabled = index < 3; });

/**
 * Calcula el estado posterior a una etapa aplicando reducciones independientes.
 * Las concentraciones no se suman: cada resultado se deriva del estado anterior
 * para conservar un recorrido determinista y reversible en el timeline.
 *
 * @param {WaterQuality} quality Estado previo de la muestra.
 * @param {FilterDefinition} filter Etapa cuyos factores se aplican.
 * @returns {WaterQuality} Estado posterior de la muestra.
 */
function qualityAfter(quality, filter) {
  return {
    turbidity: quality.turbidity * (1 - filter.reductions.turbidity),
    chlorine: quality.chlorine * (1 - filter.reductions.chlorine),
    minerals: quality.minerals * (1 - filter.reductions.minerals),
    microorganisms: quality.microorganisms * (1 - filter.reductions.microorganisms),
  };
}

/**
 * Convierte las métricas de calidad en un índice didáctico de 0 a 100.
 * El índice sirve para comparar etapas; no es una norma sanitaria.
 *
 * @param {WaterQuality} quality Métricas actuales de la muestra.
 * @returns {number} Índice de calidad normalizado.
 */
function qualityScore(quality) {
  const normalized = (1 - quality.turbidity / 100) * .34 + (1 - quality.chlorine / 100) * .18 + (1 - quality.minerals / INITIAL.minerals) * .18 + (1 - quality.microorganisms / 100) * .30;
  return Math.round(clamp(normalized, 0, 1) * 100);
}

/**
 * Construye una instantánea pura del proceso a partir del progreso solicitado.
 * Recalcular desde el inicio permite avanzar, pausar o retroceder sin acumular
 * errores de redondeo ni depender del orden de renderizado.
 *
 * @param {number} progress Progreso normalizado del timeline, entre 0 y 1.
 * @returns {SimulationSnapshot} Estado completo de la simulación.
 */
function computeSimulation(progress = state.progress) {
  const filters = enabledFilters();
  const stages = [{ filter: null, quality: { ...INITIAL }, label: 'Entrada' }];
  filters.forEach((filter) => stages.push({ filter, quality: qualityAfter(stages.at(-1).quality, filter), label: filter.name }));
  if (!filters.length) return { filters, stages, current: { ...INITIAL }, currentIndex: 0, local: 0, totalDuration: 0 };
  const totalDuration = filters.reduce((sum, filter) => sum + filter.duration, 0);
  const elapsed = clamp(progress) * totalDuration;
  let accumulated = 0;
  let index = filters.length - 1;
  let local = 1;
  if (progress < 1) {
    for (let candidate = 0; candidate < filters.length; candidate += 1) {
      if (elapsed < accumulated + filters[candidate].duration) { index = candidate; break; }
      accumulated += filters[candidate].duration;
    }
    local = (elapsed - accumulated) / filters[index].duration;
  }
  const current = {};
  Object.keys(INITIAL).forEach((key) => { current[key] = lerp(stages[index].quality[key], stages[index + 1].quality[key], local); });
  return { filters, stages, current, currentIndex: index + 1, local, totalDuration };
}

/**
 * Conecta los controles del documento con el estado de la simulación.
 * Las entradas visibles proceden de listas cerradas de capas y velocidades;
 * el progreso se limita al recalcular el snapshot antes de representarlo.
 */
function setupDOM() {
  ['sceneCanvas', 'sceneViewport', 'sceneStatus', 'activeLayerName', 'activeLayerHint', 'sceneTime', 'realTime', 'xrayButton', 'resetViewButton', 'zoomOutButton', 'zoomInButton', 'lockViewButton', 'inspectorTitle', 'inspectorDescription', 'qualityBadge', 'qualityRing', 'qualityScore', 'qualityState', 'qualityDelta', 'metricsGrid', 'selectedStageNumber', 'beforeScore', 'beforeLabel', 'afterScore', 'afterLabel', 'currentTime', 'totalTime', 'timelineFill', 'timelineThumb', 'timelineInput', 'timelineMarkers', 'playButton', 'playLabel', 'restartButton', 'speedOptions', 'layerCount', 'layerList', 'evolutionChart', 'trendPill', 'helpButton', 'helpModal', 'closeHelpButton'].forEach((id) => { dom[id] = document.getElementById(id); });
  dom.playButton.addEventListener('click', () => { state.playing = !state.playing; if (state.progress >= 1) state.progress = 0; renderUI(); });
  dom.restartButton.addEventListener('click', () => { state.playing = false; state.progress = 0; state.realElapsed = 0; state.selected = 'bucket'; renderUI(); });
  dom.timelineInput.addEventListener('input', (event) => { state.progress = Number(event.target.value) / 1000; state.playing = false; renderUI(); });
  dom.xrayButton.addEventListener('click', () => { state.xray = !state.xray; dom.xrayButton.classList.toggle('is-active', state.xray); scene?.setXray(state.xray); });
  dom.resetViewButton.addEventListener('click', () => scene?.resetCamera());
  dom.zoomOutButton.addEventListener('click', () => scene?.zoom(1.16));
  dom.zoomInButton.addEventListener('click', () => scene?.zoom(.86));
  dom.lockViewButton.addEventListener('click', () => { const locked = scene?.toggleViewLock(); dom.lockViewButton.classList.toggle('is-active', locked); dom.lockViewButton.setAttribute('aria-pressed', String(locked)); dom.lockViewButton.innerHTML = `<span class="tool-button__icon">${locked ? '▣' : '◇'}</span> ${locked ? 'Liberar vista' : 'Fijar vista'}`; });
  dom.speedOptions.addEventListener('click', (event) => { const button = event.target.closest('button'); if (!button) return; state.speed = Number(button.dataset.speed); dom.speedOptions.querySelectorAll('button').forEach((item) => item.classList.toggle('is-active', item === button)); });
  dom.layerList.addEventListener('click', (event) => { const row = event.target.closest('[data-filter]'); if (!row) return; const filter = FILTERS.find((item) => item.id === row.dataset.filter); if (!filter) return; if (event.target.closest('.layer-row__toggle')) { filter.enabled = !filter.enabled; if (!enabledFilters().length) filter.enabled = true; state.progress = Math.min(state.progress, 1); renderUI(); return; } state.selected = filter.id; renderUI(); scene?.select(state.selected); });
  dom.helpButton.addEventListener('click', () => { dom.helpModal.hidden = false; });
  dom.closeHelpButton.addEventListener('click', () => { dom.helpModal.hidden = true; });
  dom.helpModal.addEventListener('click', (event) => { if (event.target === dom.helpModal) dom.helpModal.hidden = true; });
  renderLayerList();
}

/** Renderiza la configuración de capas usando únicamente datos declarados localmente. */
function renderLayerList() {
  dom.layerList.innerHTML = FILTERS.map((filter) => `<div class="layer-row ${filter.enabled ? '' : 'is-disabled'} ${state.selected === filter.id ? 'is-selected' : ''}" data-filter="${filter.id}"><span class="layer-row__swatch layer-row__swatch--${filter.id}"></span><span class="layer-row__main"><b>${filter.name}</b><small>${filter.short}</small></span><label class="layer-row__toggle" aria-label="Activar ${filter.name}"><input type="checkbox" ${filter.enabled ? 'checked' : ''} /><span class="layer-row__track"></span></label></div>`).join('');
}

/** @param {SimulationSnapshot} simulation Estado utilizado para ubicar las etapas. */
function renderTimelineMarkers(simulation) {
  let elapsed = 0;
  const markers = [{ label: 'Entrada', position: 0 }, ...simulation.filters.map((filter) => { elapsed += filter.duration; return { label: filter.name, position: elapsed / simulation.totalDuration }; })];
  dom.timelineMarkers.innerHTML = markers.map((marker, index) => `<span class="timeline-marker ${state.progress * simulation.filters.length >= index ? 'is-active' : ''}" style="--marker-position:${marker.position * 100}%">${marker.label}</span>`).join('');
}

/** @param {WaterQuality} quality Métricas que se presentan en el inspector. */
function renderMetrics(quality) {
  const metrics = [
    ['Turbidez', formatNumber(quality.turbidity), '%', quality.turbidity, 'inverse'],
    ['Cloro', formatNumber(quality.chlorine), '%', quality.chlorine, 'inverse'],
    ['Minerales', formatNumber(quality.minerals), 'mg/L', quality.minerals / 4.2, 'inverse'],
    ['Microorganismos', formatNumber(quality.microorganisms), '%', quality.microorganisms, 'inverse'],
  ];
  dom.metricsGrid.innerHTML = metrics.map(([label, value, unit, amount]) => `<div class="metric"><div class="metric-label"><span>${label}</span><span>${unit}</span></div><strong class="metric-value">${value} <small>${unit}</small></strong><div class="metric-bar"><span style="width:${clamp(amount / (label === 'Minerales' ? 100 : 100)) * 100}%"></span></div></div>`).join('');
}

/**
 * Obtiene la comparación antes/después de la capa seleccionada.
 * Una capa desactivada conserva una lectura explícita y no se incorpora al
 * resultado, evitando presentar como ejecutada una etapa que el usuario excluyó.
 *
 * @param {SimulationSnapshot} simulation Estado actual del recorrido.
 * @returns {{ title: string, description: string, badge: string, badgeClass: string, before: WaterQuality, after: WaterQuality, beforeLabel: string, afterLabel: string, stage: string }} Detalle visible en el inspector.
 */
function getSelectedDetails(simulation) {
  if (state.selected === 'bucket') {
    const after = simulation.stages[1]?.quality || INITIAL;
    const firstFilter = simulation.filters[0]?.name;
    return { title: 'Agua de entrada', description: 'Este es el punto de partida. El agua contiene partículas, color y microorganismos antes de atravesar el sistema.', badge: 'Turbia', badgeClass: 'low', before: INITIAL, after, beforeLabel: 'Agua sin tratar', afterLabel: firstFilter ? `Después de ${firstFilter}` : 'Sin etapas activas', stage: 'Entrada' };
  }
  const filter = FILTERS.find((item) => item.id === state.selected);
  const index = simulation.filters.findIndex((item) => item.id === state.selected);
  if (index < 0) return { title: filter.name, description: 'Esta capa está desactivada. Actívala para incluirla en el recorrido.', badge: 'Inactiva', badgeClass: 'low', before: INITIAL, after: INITIAL, beforeLabel: 'Sin etapa', afterLabel: 'No participa', stage: 'Desactivada' };
  const before = simulation.stages[index].quality;
  const after = simulation.stages[index + 1].quality;
  const score = qualityScore(after);
  return { title: filter.name, description: filter.description, badge: score > 65 ? 'Más limpia' : 'En proceso', badgeClass: score > 65 ? 'good' : 'medium', before, after, beforeLabel: index === 0 ? 'Agua sin tratar' : simulation.filters[index - 1].name, afterLabel: index === simulation.filters.length - 1 ? 'Resultado actual' : simulation.filters[index + 1].name, stage: `Etapa ${index + 1}` };
}

/** @param {SimulationSnapshot} simulation Estado que alimenta la comparación visual. */
function renderChart(simulation) {
  const points = [{ label: 'Entrada', before: qualityScore(INITIAL), after: qualityScore(INITIAL) }, ...simulation.filters.map((filter, index) => ({ label: filter.name.split(' ')[0], before: qualityScore(simulation.stages[index].quality), after: qualityScore(simulation.stages[index + 1].quality) }))];
  dom.evolutionChart.innerHTML = points.map((point, index) => `<div class="chart-column ${index === simulation.currentIndex ? 'current' : ''}"><span class="chart-bar before" style="height:${Math.max(4, point.before)}%"></span><span class="chart-bar after" style="height:${Math.max(4, point.after)}%"></span><span class="chart-label">${point.label}</span></div>`).join('');
  const gain = qualityScore(simulation.current) - qualityScore(INITIAL);
  dom.trendPill.textContent = `${gain >= 0 ? '+' : ''}${gain}% calidad`;
}

/** Renderiza todos los consumidores del snapshot sin introducir reglas de negocio nuevas. */
function renderUI() {
  const simulation = computeSimulation();
  const details = getSelectedDetails(simulation);
  const score = qualityScore(simulation.current);
  const time = simulation.totalDuration * state.progress;
  const active = state.progress >= 1 ? 'Proceso completo' : state.progress === 0 ? 'Agua sin tratar' : simulation.filters.length ? `Filtrando con ${simulation.filters[simulation.currentIndex - 1]?.name || simulation.filters[0].name}` : 'Agua sin tratar';
  dom.sceneStatus.textContent = active;
  dom.realTime.textContent = formatTime(state.realElapsed);
  dom.activeLayerName.textContent = details.title.replace('Agua de entrada', 'Entrada');
  dom.activeLayerHint.textContent = details.stage === 'Entrada' ? 'Selecciona una capa para inspeccionarla' : details.description;
  dom.sceneTime.textContent = formatTime(time); dom.currentTime.textContent = formatTime(time); dom.totalTime.textContent = formatTime(simulation.totalDuration);
  dom.timelineInput.value = Math.round(state.progress * 1000); dom.timelineFill.style.width = `${state.progress * 100}%`; dom.timelineThumb.style.left = `${state.progress * 100}%`;
  dom.inspectorTitle.textContent = details.title; dom.inspectorDescription.textContent = details.description; dom.qualityBadge.textContent = details.badge; dom.qualityBadge.className = `quality-badge ${details.badgeClass}`;
  dom.qualityScore.textContent = score; dom.qualityRing.style.setProperty('--ring', `${Math.max(5, score)}%`); dom.qualityState.textContent = score > 70 ? 'Agua más limpia' : score > 40 ? 'En purificación' : 'Requiere filtración'; dom.qualityDelta.textContent = `${qualityScore(simulation.current) - qualityScore(INITIAL) >= 0 ? '+' : ''}${qualityScore(simulation.current) - qualityScore(INITIAL)} puntos desde la entrada`;
  renderMetrics(simulation.current); dom.selectedStageNumber.textContent = details.stage; dom.beforeScore.textContent = qualityScore(details.before); dom.afterScore.textContent = qualityScore(details.after); dom.beforeLabel.textContent = details.beforeLabel; dom.afterLabel.textContent = details.afterLabel;
  dom.playLabel.textContent = state.playing ? 'Pausar' : 'Reproducir'; dom.playButton.querySelector('.play-button__icon').textContent = state.playing ? 'Ⅱ' : '▶';
  dom.layerCount.textContent = `${simulation.filters.length} / ${FILTERS.length}`; renderLayerList(); renderTimelineMarkers(simulation); renderChart(simulation); scene?.update(simulation, state);
}

/**
 * Adaptador de presentación 3D. Construye la geometría, recibe el snapshot
 * calculado por el dominio visual y traduce selección, radiografía y progreso
 * a materiales, posiciones y partículas de Three.js.
 */
class PurificationScene {
  constructor(canvas) {
    this.canvas = canvas; this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.interactives = [];
    this.scene = new THREE.Scene(); this.scene.fog = new THREE.Fog('#0a1b1c', 12, 28);
    this.camera = new THREE.PerspectiveCamera(30, 1, .1, 100); this.camera.position.set(8.4, 5.5, 11.5);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.controls = new OrbitControls(this.camera, canvas); this.controls.enableDamping = true; this.controls.enablePan = false; this.controls.minDistance = 7; this.controls.maxDistance = 17; this.controls.target.set(0, 3.5, 0); this.controls.update();
    this.clock = new THREE.Clock(); this.glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9ad6ce, transparent: true, opacity: .17, roughness: .08, metalness: .05, transmission: .15, side: THREE.DoubleSide, depthWrite: false });
    this.layerObjects = new Map(); this.createLights(); this.createEnvironment(); this.createBarrel(); this.createWater(); this.createParticles(); this.createBucket(); this.resize(); window.addEventListener('resize', () => this.resize()); canvas.addEventListener('pointerdown', (event) => this.onPointer(event)); this.animate();
  }
  createLights() { const hemi = new THREE.HemisphereLight(0xb8eee0, 0x071111, 2.2); this.scene.add(hemi); const key = new THREE.DirectionalLight(0xb3e8d5, 3.4); key.position.set(-5, 11, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); this.scene.add(key); const rim = new THREE.PointLight(0x45d1b0, 3, 15); rim.position.set(4, 5, -4); this.scene.add(rim); }
  createEnvironment() { const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshBasicMaterial({ color: 0x0a2020, transparent: true, opacity: .8 })); floor.rotation.x = -Math.PI / 2; floor.position.y = .02; this.scene.add(floor); const ring = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.8, 64), new THREE.MeshBasicMaterial({ color: 0x246058, transparent: true, opacity: .28, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; this.scene.add(ring); }
  createBarrel() {
    this.barrel = new THREE.Group();
    this.scene.add(this.barrel);

    // Un perfil suavemente curvado integra la base y el hombro del recipiente en una sola silueta.
    const profile = [
      new THREE.Vector2(2.03, 0),
      new THREE.Vector2(2.16, .1),
      new THREE.Vector2(2.23, .35),
      new THREE.Vector2(2.23, 6.12),
      new THREE.Vector2(2.18, 6.38),
      new THREE.Vector2(2.04, 6.5),
    ];
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), this.glassMaterial);
    body.position.y = .3;
    body.userData = { type: 'bucket' };
    body.castShadow = true;
    body.receiveShadow = true;
    this.barrel.add(body);
    this.interactives.push(body);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.04, .18, 64), new THREE.MeshStandardMaterial({ color: 0x537e76, transparent: true, opacity: .48, roughness: .3, metalness: .15 }));
    base.position.y = .22;
    base.castShadow = true;
    this.barrel.add(base);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.48, .58, .24, 32), new THREE.MeshStandardMaterial({ color: 0x78bdb0, roughness: .25, metalness: .2 }));
    cap.position.set(0, 6.87, 0);
    cap.castShadow = true;
    this.barrel.add(cap);

    FILTERS.forEach((filter, index) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.02, .72, 64), new THREE.MeshStandardMaterial({ color: filter.color, roughness: .78, metalness: filter.id === 'membrane' ? .22 : 0, transparent: true, opacity: .94 }));
      mesh.position.y = .85 + index * .88;
      mesh.userData = { type: 'filter', id: filter.id };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.barrel.add(mesh);
      this.layerObjects.set(filter.id, { mesh, baseY: mesh.position.y });
      this.interactives.push(mesh);
    });
  }
  createWater() { this.water = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 1.8, 48), new THREE.MeshPhysicalMaterial({ color: 0xb8915c, transparent: true, opacity: .57, roughness: .16, transmission: .22, side: THREE.DoubleSide })); this.water.position.y = 5.5; this.water.castShadow = true; this.barrel.add(this.water); }
  createParticles() { const count = 120; const positions = new Float32Array(count * 3); this.particleOffsets = []; for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2; const radius = Math.random() * 1.55; positions[i * 3] = Math.cos(angle) * radius; positions[i * 3 + 1] = Math.random() * 5.7 + .6; positions[i * 3 + 2] = Math.sin(angle) * radius; this.particleOffsets.push(Math.random() * 5.7); } const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf0c27f, size: .055, transparent: true, opacity: .8, sizeAttenuation: true })); this.barrel.add(this.particles); }
  createBucket() { this.bucket = new THREE.Group(); this.bucket.position.set(3.7, 6.25, .3); this.bucket.rotation.z = -.12; const body = new THREE.Mesh(new THREE.CylinderGeometry(.58, .48, 1.05, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fd6c5, transparent: true, opacity: .52, roughness: .25, metalness: .05 })); body.userData = { type: 'bucket' }; this.bucket.add(body); const rim = new THREE.Mesh(new THREE.TorusGeometry(.58, .055, 10, 32), new THREE.MeshStandardMaterial({ color: 0xb3ead7, roughness: .2 })); rim.position.y = .53; this.bucket.add(rim); const handle = new THREE.Mesh(new THREE.TorusGeometry(.62, .045, 10, 32, Math.PI), new THREE.MeshStandardMaterial({ color: 0x72b8a7, roughness: .3 })); handle.rotation.x = Math.PI / 2; handle.position.y = .42; this.bucket.add(handle); const water = new THREE.Mesh(new THREE.CircleGeometry(.43, 24), new THREE.MeshBasicMaterial({ color: 0xb28b5c, transparent: true, opacity: .75, side: THREE.DoubleSide })); water.rotation.x = -Math.PI / 2; water.position.y = .48; this.bucket.add(water); this.scene.add(this.bucket); this.interactives.push(body); }
  /** Traduce una selección del canvas a un identificador cerrado de la interfaz. */
  onPointer(event) { const rect = this.canvas.getBoundingClientRect(); this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; this.raycaster.setFromCamera(this.pointer, this.camera); const hits = this.raycaster.intersectObjects(this.interactives, false); if (!hits.length) return; const item = hits[0].object.userData; state.selected = item.type === 'filter' ? item.id : 'bucket'; renderUI(); }
  select(id) { this.interactives.forEach((object) => { if (object.userData.type !== 'filter') return; const material = object.material; const selected = object.userData.id === id; material.emissive?.set(selected ? 0x76dcb9 : 0x000000); material.emissiveIntensity = selected ? .45 : 0; }); }
  setXray(enabled) { this.glassMaterial.opacity = enabled ? .045 : .17; this.glassMaterial.transmission = enabled ? .35 : .15; this.bucket.children.forEach((child) => { if (child.material.transparent) child.material.opacity = enabled ? .25 : .52; }); }
  /** @param {SimulationSnapshot} simulation @param {{ progress: number, xray: boolean, selected: string }} currentState */
  update(simulation, currentState) { const color = new THREE.Color(0xb58b55).lerp(new THREE.Color(0x64d6d1), qualityScore(simulation.current) / 100); this.water.material.color.copy(color); this.water.position.y = lerp(5.55, 2.3, currentState.progress); this.water.scale.y = 1.05 + Math.sin(currentState.progress * Math.PI) * .18; this.particles.material.color.copy(new THREE.Color(0xe9bd78).lerp(new THREE.Color(0x9be4c7), currentState.progress)); this.layerObjects.forEach((entry, id) => { const filter = FILTERS.find((item) => item.id === id); const index = FILTERS.findIndex((item) => item.id === id); const offset = currentState.xray ? index * .08 : 0; entry.mesh.visible = filter?.enabled !== false; entry.mesh.position.y = entry.baseY + offset; const selected = currentState.selected === id; entry.mesh.material.emissive?.set(selected ? 0x72d6b5 : 0x000000); entry.mesh.material.emissiveIntensity = selected ? .55 : 0; entry.mesh.material.opacity = currentState.xray ? .75 : .94; }); this.select(currentState.selected); }
  zoom(factor) { const offset = this.camera.position.clone().sub(this.controls.target); const distance = clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance); this.camera.position.copy(this.controls.target).add(offset.normalize().multiplyScalar(distance)); this.controls.update(); }
  toggleViewLock() { this.viewLocked = !this.viewLocked; this.controls.enableRotate = !this.viewLocked; this.controls.enableZoom = !this.viewLocked; return this.viewLocked; }
  resetCamera() { this.camera.position.set(8.4, 5.5, 11.5); this.controls.target.set(0, 3.5, 0); this.controls.update(); }
  resize() { const width = this.canvas.clientWidth || 700; const height = this.canvas.clientHeight || 575; this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false); }
  /** Mantiene el reloj visual y el movimiento de partículas con un delta acotado. */
  animate() { requestAnimationFrame(() => this.animate()); const now = performance.now(); const delta = Math.min((now - state.lastFrame) / 1000, .1); state.lastFrame = now; if (state.playing) { state.progress += delta * state.speed / Math.max(computeSimulation().totalDuration, 1); state.realElapsed += delta; if (state.progress >= 1) { state.progress = 1; state.playing = false; } renderUI(); } const time = this.clock.getElapsedTime(); if (this.particles) { const positions = this.particles.geometry.attributes.position.array; for (let i = 0; i < this.particleOffsets.length; i++) { const x = positions[i * 3]; const z = positions[i * 3 + 2]; positions[i * 3 + 1] = .5 + ((this.particleOffsets[i] + time * .35 + state.progress * 5.7) % 5.7); positions[i * 3] = x + Math.sin(time * .7 + i) * .012; positions[i * 3 + 2] = z + Math.cos(time * .6 + i) * .012; } this.particles.geometry.attributes.position.needsUpdate = true; } this.controls.update(); this.renderer.render(this.scene, this.camera); }
}

setupDOM();
scene = new PurificationScene(dom.sceneCanvas);
renderUI();

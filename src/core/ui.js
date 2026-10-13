import { computeSimulation, formatNumber, qualityScore } from './metrics.js';
import { formatTime, normalizeProgress, renderTimelineMarkers, updateTimelineMarkers } from './timeline.js';
import { renderUsage, USAGES } from './tools/usage.js';
import { renderCalculator } from './tools/calculator.js';
import { createBudgetState, renderBudget } from './tools/budget.js';
import { createMaintenanceState, renderMaintenance } from './tools/maintenance.js';
import { renderSampling } from './tools/sampling.js';
import { renderSafety } from './tools/safety.js';
import { renderRisks } from './tools/risks.js';
import { renderSchedule } from './tools/schedule.js';
import { renderEconomics } from './tools/economics.js';
import { renderPresets } from './tools/presets.js';
import { renderAgronomy } from './tools/agronomy.js';

const ids = [
  'sceneStatus', 'activeLayerName', 'activeLayerHint', 'sceneTime', 'realTime', 'xrayButton',
  'resetViewButton', 'zoomOutButton', 'zoomInButton', 'lockViewButton', 'inspectorTitle',
  'inspectorDescription', 'qualityBadge', 'qualityRing', 'qualityScore', 'qualityState',
  'qualityDelta', 'metricsGrid', 'selectedStageNumber', 'beforeScore', 'beforeLabel',
  'afterScore', 'afterLabel', 'currentTime', 'totalTime', 'timelineFill', 'timelineThumb',
  'timelineInput', 'timelineMarkers', 'playButton', 'playLabel', 'restartButton',
  'speedOptions', 'layerCount', 'layerList', 'evolutionChart', 'trendPill', 'helpButton',
  'helpModal', 'closeHelpButton', 'helpDescription', 'scenarioDescription',
  'activeStagesChip',
  'scenarioControls',
  'presetTool',
  'qualitySelect', 'qualityStatus',
  'usageTool', 'calculatorTool', 'budgetTool', 'maintenanceTool', 'samplingTool', 'safetyTool', 'risksTool', 'scheduleTool', 'economicsTool', 'agronomyTool', 'toolsTabs',
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const inspectorNotes = {
  'deposito-crudo': 'Rebose protegido: considerar el riesgo de erosión y cimentaciones.',
  'filtro-granular': 'Orden por diseño hidráulico: grava, arena y carbón.',
  disinfection: 'Tiempo de contacto; cloro residual libre: medir. Turbidez alta reduce eficacia; ebullición solo emergencia.',
};

export function createUI(scenario, scene) {
  const layers = scenario.layers;
  const initial = scenario.initial;
  const dom = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const state = { progress: 0, playing: false, speed: 1, xray: false, selected: 'input', finalUse: 'tomar', realElapsed: 0, playedTime: 0, lastFrame: performance.now() };
  const scenarioState = Object.fromEntries((scenario.controls || []).map((control) => [control.key, control.value]));
  const calculatorState = { p: 20, area: 40, coefficient: 0.8, capacity: 200, demand: 40 };
  const budgetState = createBudgetState();
  const maintenanceState = createMaintenanceState();
  let currentQuality = initial;
  let qualityMode = 'auto';
  let lastUiUpdate = 0;
  let lastStageIndex = -1;
  let staticSignature = '';
  let layerListSignature = '';
  let samplingSignature = '';
  let samplingUpdater;
  const metricNodes = new Map();
  const chartNodes = [];
  const controller = new AbortController();
  let animationFrame;
  let renderingUi = false;
  let uiErrorLogged = false;
  let economicsUpdater;
  let risksUpdater;

  const handleUiError = (event) => {
    if (!renderingUi || uiErrorLogged) return;
    uiErrorLogged = true;
    console.error('Error de UI; la escena continuará reproduciéndose.', event.error || event.message);
  };

  dom.scenarioDescription.textContent = scenario.text.description;
  dom.helpDescription.textContent = scenario.text.help;
  scene.onQualityChange = (mode) => {
    qualityMode = mode;
    if (dom.qualitySelect) dom.qualitySelect.value = mode;
    if (dom.qualityStatus) dom.qualityStatus.textContent = 'Ligera por rendimiento';
  };
  renderScenarioControls();
  renderTools();
  const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: controller.signal });
  listen(window, 'error', handleUiError);

  listen(document, 'scene-select', (event) => {
    state.selected = event.detail;
    render();
  });
  listen(dom.playButton, 'click', () => {
    state.playing = !state.playing;
    if (state.progress >= 1) state.progress = 0;
    render();
  });
  listen(dom.restartButton, 'click', () => {
    state.playing = false;
    state.progress = 0;
    state.realElapsed = 0;
    state.selected = 'input';
    state.playedTime = 0;
    render();
  });
  listen(dom.timelineInput, 'input', (event) => {
    state.progress = normalizeProgress(event.target.value);
    state.playing = false;
    render();
  });
  listen(dom.xrayButton, 'click', () => {
    state.xray = !state.xray;
    dom.xrayButton.classList.toggle('is-active', state.xray);
    scene.setXray(state.xray);
  });
  listen(dom.resetViewButton, 'click', () => scene.resetCamera());
  listen(dom.zoomOutButton, 'click', () => scene.zoom(1.16));
  listen(dom.zoomInButton, 'click', () => scene.zoom(0.86));
  listen(dom.lockViewButton, 'click', () => {
    const locked = scene.toggleViewLock();
    dom.lockViewButton.classList.toggle('is-active', locked);
    dom.lockViewButton.setAttribute('aria-pressed', String(locked));
  });
  listen(dom.speedOptions, 'click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.speed = Number(button.dataset.speed);
    dom.speedOptions.querySelectorAll('button').forEach((item) => item.classList.toggle('is-active', item === button));
  });
  listen(dom.layerList, 'click', (event) => {
    const row = event.target.closest('[data-filter]');
    if (!row) return;
    const layer = layers.find((item) => item.id === row.dataset.filter);
    if (!layer) return;
    if (event.target.closest('.layer-row__toggle')) {
      layer.enabled = !layer.enabled;
      if (!layers.some((item) => item.enabled !== false)) layers[0].enabled = true;
      render();
      return;
    }
    state.selected = layer.id;
    render();
  });
  listen(dom.scenarioControls, 'input', handleScenarioControl);
  listen(dom.scenarioControls, 'change', handleScenarioControl);
  listen(dom.qualitySelect, 'change', (event) => {
    qualityMode = event.target.value;
    scene.setQuality(event.target.value);
    dom.qualityStatus.textContent = event.target.value === 'auto' ? 'Auto' : event.target.value === 'light' ? 'Ligera' : 'Alta';
  });
  listen(dom.toolsTabs, 'click', (event) => {
    const button = event.target.closest('[data-tool-tab]');
    if (!button) return;
    dom.toolsTabs.querySelectorAll('[data-tool-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-tool-panel]').forEach((panel) => { panel.hidden = panel.dataset.toolPanel !== button.dataset.toolTab; });
  });
  listen(dom.helpButton, 'click', () => { dom.helpModal.hidden = false; });
  listen(dom.closeHelpButton, 'click', () => { dom.helpModal.hidden = true; });
  listen(dom.helpModal, 'click', (event) => { if (event.target === dom.helpModal) dom.helpModal.hidden = true; });

  function renderLayerList() {
    const signature = layers.map((layer) => layer.id).join('|');
    if (layerListSignature !== signature) {
      layerListSignature = signature;
      dom.layerList.replaceChildren(...layers.map((layer) => {
        const row = document.createElement('div');
        row.className = 'layer-row';
        row.dataset.filter = layer.id;
        row.innerHTML = `<span class="layer-row__swatch layer-row__swatch--${layer.id}"></span><span class="layer-row__main"><b>${layer.name}</b><small>${layer.short}</small></span><label class="layer-row__toggle" aria-label="Activar ${layer.name}"><input type="checkbox" /><span class="layer-row__track"></span></label>`;
        return row;
      }));
    }
    layers.forEach((layer, index) => {
      const row = dom.layerList.children[index];
      row.classList.toggle('is-disabled', layer.enabled === false);
      row.classList.toggle('is-selected', state.selected === layer.id);
      row.querySelector('input').checked = layer.enabled !== false;
    });
  }

  function renderScenarioControls() {
    if (!dom.scenarioControls || !scenario.controls?.length) return;
    dom.scenarioControls.innerHTML = scenario.controls.map((control) => {
      if (control.type === 'select') {
        const options = control.options.map((option) => `<option value="${option.value}" ${scenarioState[control.key] === option.value ? 'selected' : ''}>${option.label}</option>`).join('');
        return `<label class="scenario-controls__field"><span>${control.label}</span><select class="scenario-controls__select" data-scenario-control="${control.key}">${options}</select><small>${control.help}</small></label>`;
      }
      return `<label class="scenario-controls__field"><span>${control.label}</span><input class="scenario-controls__input" data-scenario-control="${control.key}" type="${control.type}" value="${scenarioState[control.key]}" min="${control.min}" max="${control.max}" step="${control.step}" /><small>${control.help}</small></label>`;
    }).join('');
  }

  function handleScenarioControl(event) {
    const control = event.target.closest('[data-scenario-control]');
    if (!control) return;
    const definition = scenario.controls.find((item) => item.key === control.dataset.scenarioControl);
    scenarioState[definition.key] = definition.type === 'number' ? Number(control.value) : control.value;
    scenario.onControlChange?.(definition.key, scenarioState[definition.key], { layers, state: scenarioState });
    render();
  }

  function renderTools() {
    renderPresets(dom.presetTool, {
      scenario,
      onApply: (preset) => {
        const result = scenario.applyPreset?.(preset.id, {
          layers,
          state: scenarioState,
          setFinalUse: (value) => {
            state.finalUse = value;
            scenario.onUsageChange?.(value, { scene });
          },
        });
        renderUsage(dom.usageTool, { value: state.finalUse, onChange: handleUsageChange });
        risksUpdater?.(state.finalUse);
        render();
        return result;
      },
    });
    renderAgronomy(dom.agronomyTool);
    const handleUsageChange = (value) => {
      state.finalUse = value;
      scenario.onUsageChange?.(value, { scene });
      risksUpdater?.(value);
      renderUsage(dom.usageTool, { value, onChange: handleUsageChange });
      render();
    };
    renderUsage(dom.usageTool, { value: state.finalUse, onChange: handleUsageChange });
    renderCalculator(dom.calculatorTool, calculatorState, (values) => {
      Object.assign(calculatorState, values);
      economicsUpdater?.();
    });
    renderBudget(dom.budgetTool, budgetState, (change) => {
      Object.assign(budgetState, change);
      economicsUpdater?.();
    });
    renderMaintenance(dom.maintenanceTool, maintenanceState, (values) => Object.assign(maintenanceState, values));
    renderSafety(dom.safetyTool);
    risksUpdater = renderRisks(dom.risksTool, state.finalUse);
    renderSchedule(dom.scheduleTool);
    economicsUpdater = renderEconomics(dom.economicsTool, { calculatorState, budgetState });
  }

  function renderMetrics(quality) {
    const usage = USAGES[state.finalUse] || USAGES.tomar;
    scenario.metrics.forEach((metric) => {
      const item = metricNodes.get(metric.key);
      if (!item) return;
      const value = quality[metric.key];
      item.value.textContent = formatNumber(value);
      item.bar.style.transform = `scaleX(${clamp(value / metric.max)})`;
      item.root.classList.toggle('is-relevant', usage.metricKeys.includes(metric.key));
      item.root.classList.toggle('is-muted', !usage.metricKeys.includes(metric.key));
      item.root.classList.toggle('is-highlighted', usage.highlighted.includes(metric.key));
    });
  }

  function mountMetrics() {
    metricNodes.clear();
    dom.metricsGrid.replaceChildren(...scenario.metrics.map((metric) => {
      const root = document.createElement('div');
      root.className = 'metric';
      root.innerHTML = `<div class="metric-label"><span>${metric.label}</span><span>${metric.unit}</span></div><strong class="metric-value"><span></span>${metric.unit ? ` <small>${metric.unit}</small>` : ''}</strong><div class="metric-bar"><span></span></div>`;
      metricNodes.set(metric.key, { root, value: root.querySelector('.metric-value span'), bar: root.querySelector('.metric-bar span') });
      return root;
    }));
  }

  function mountEvolutionChart(simulation) {
    const chartPoints = [
      { label: 'Entrada', before: qualityScore(initial, initial), after: qualityScore(initial, initial) },
      ...simulation.filters.map((layer, index) => ({
        label: layer.name.split(' ')[0],
        before: qualityScore(simulation.stages[index].quality, initial),
        after: qualityScore(simulation.stages[index + 1].quality, initial),
      })),
    ];
    chartNodes.length = 0;
    dom.evolutionChart.replaceChildren(...chartPoints.map((point) => {
      const column = document.createElement('div');
      column.className = 'chart-column';
      column.innerHTML = `<span class="chart-bar before"></span><span class="chart-bar after"></span><span class="chart-label"></span>`;
      column.querySelector('.chart-label').textContent = point.label;
      chartNodes.push({ column, before: column.querySelector('.before'), after: column.querySelector('.after'), point });
      return column;
    }));
  }

  function updateEvolutionChart(simulation) {
    chartNodes.forEach(({ column, before, after, point }, index) => {
      const stage = simulation.stages[index];
      const next = simulation.stages[index + 1];
      if (stage) point.before = qualityScore(stage.quality, initial);
      if (next) point.after = qualityScore(next.quality, initial);
      before.style.transform = `scaleY(${Math.max(4, point.before) / 100})`;
      after.style.transform = `scaleY(${Math.max(4, point.after) / 100})`;
      column.classList.toggle('current', index === simulation.currentIndex);
    });
  }

  function getDetails(simulation) {
    if (state.selected === 'input') {
      return { title: 'Agua de entrada', description: scenario.text.inputDescription, before: initial, after: simulation.stages[1]?.quality || initial, beforeLabel: 'Agua sin tratar', afterLabel: simulation.filters[0]?.name || 'Sin etapas activas', stage: 'Entrada' };
    }

    const layer = layers.find((item) => item.id === state.selected);
    const index = simulation.filters.findIndex((item) => item.id === state.selected);

    if (index < 0) {
      return { title: layer.name, description: scenario.text.disabledDescription, before: initial, after: initial, beforeLabel: 'Sin etapa', afterLabel: 'No participa', stage: 'Desactivada' };
    }

    return { title: layer.name, description: [layer.description, inspectorNotes[layer.id]].filter(Boolean).join(' '), before: simulation.stages[index].quality, after: simulation.stages[index + 1].quality, beforeLabel: index ? simulation.filters[index - 1].name : 'Agua sin tratar', afterLabel: index === simulation.filters.length - 1 ? 'Resultado actual' : simulation.filters[index + 1].name, stage: `Etapa ${index + 1}` };
  }

  function render() {
    renderingUi = true;
    const carbon = layers.find((layer) => layer.id === 'carbon');
    const totalDuration = computeSimulation(0, { initial, layers }).totalDuration;
    if (carbon) carbon.saturation = totalDuration ? clamp(state.playedTime / totalDuration) : 0;
    const simulation = computeSimulation(state.progress, { initial, layers });
    currentQuality = simulation.current;
    const renderState = { ...state, ...scenarioState };
    scene.setState(renderState);
    scene.update(simulation, renderState);
    const now = performance.now();
    document.documentElement.classList.toggle('is-playing', state.playing);
    const updateUi = !state.playing || qualityMode !== 'light' || now - lastUiUpdate >= 250;
    const structureSignature = `${layers.map((layer) => `${layer.id}:${layer.enabled !== false}`).join('|')}`;
    if (staticSignature !== structureSignature) {
      staticSignature = structureSignature;
      renderLayerList();
      renderTimelineMarkers(dom.timelineMarkers, simulation);
      mountEvolutionChart(simulation);
    }
    if (updateUi) {
      lastUiUpdate = now;
      const samplingSimulation = computeSimulation(1, { initial, layers });
      const usage = USAGES[state.finalUse] || USAGES.tomar;
      const samplingData = { metrics: scenario.metrics, initial, stages: samplingSimulation.stages, samplingStages: scenario.samplingStages, usage };
      const signature = JSON.stringify({ stages: samplingSimulation.stages.map((stage) => stage.quality), samplingStages: scenario.samplingStages, usage: state.finalUse });
      if (signature !== samplingSignature) {
        samplingSignature = signature;
        samplingUpdater = renderSampling(dom.samplingTool, samplingData);
      } else if (samplingUpdater && simulation.currentIndex !== lastStageIndex) {
        samplingUpdater(samplingData);
      }
      renderMetrics(simulation.current);
      updateEvolutionChart(simulation);
      updateTimelineMarkers(dom.timelineMarkers, state.progress);
    }
    lastStageIndex = simulation.currentIndex;
    if (!updateUi) {
      renderingUi = false;
      return;
    }
    const detail = getDetails(simulation);
    const score = qualityScore(simulation.current, initial);
    const time = simulation.totalDuration * state.progress;

    dom.sceneStatus.textContent = `${state.progress >= 1 ? 'Proceso completo' : state.progress ? `Filtrando con ${simulation.filters[simulation.currentIndex - 1]?.name}` : 'Agua sin tratar'} · NO POTABLE`;
    dom.realTime.textContent = formatTime(state.realElapsed);
    dom.activeLayerName.textContent = detail.title.replace('Agua de entrada', 'Entrada');
    dom.activeLayerHint.textContent = detail.description;
    dom.sceneTime.textContent = formatTime(time);
    dom.currentTime.textContent = formatTime(time);
    dom.totalTime.textContent = formatTime(simulation.totalDuration);
    dom.timelineInput.value = Math.round(state.progress * 1000);
    dom.timelineFill.style.transform = `scaleX(${state.progress})`;
    dom.timelineThumb.style.left = `${state.progress * 100}%`;
    dom.inspectorTitle.textContent = detail.title;
    dom.inspectorDescription.textContent = detail.description;
    dom.qualityBadge.textContent = 'NO POTABLE';
    dom.qualityBadge.className = 'quality-badge low';
    dom.qualityScore.textContent = score;
    dom.qualityRing.style.setProperty('--ring', `${Math.max(5, score)}%`);
    dom.qualityState.textContent = 'NO POTABLE';
    dom.qualityDelta.textContent = 'Filtrar no es potabilizar';
    dom.selectedStageNumber.textContent = detail.stage;
    dom.beforeScore.textContent = qualityScore(detail.before, initial);
    dom.afterScore.textContent = qualityScore(detail.after, initial);
    dom.beforeLabel.textContent = detail.beforeLabel;
    dom.afterLabel.textContent = detail.afterLabel;
    dom.playLabel.textContent = state.playing ? 'Pausar' : 'Reproducir';
    dom.playButton.querySelector('.play-button__icon').textContent = state.playing ? 'Ⅱ' : '▶';
    dom.layerCount.textContent = `${simulation.filters.length} / ${layers.length}`;
    dom.activeStagesChip.textContent = `${simulation.filters.length} ${simulation.filters.length === 1 ? 'etapa' : 'etapas'}`;
    dom.trendPill.textContent = `+${Math.max(0, score - qualityScore(initial, initial))} calidad`;
    const agronomyTab = dom.toolsTabs?.querySelector('[data-tool-tab="agronomyTool"]');
    agronomyTab?.classList.toggle('is-recommended', state.finalUse === 'cultivar');
    agronomyTab?.setAttribute('aria-label', state.finalUse === 'cultivar' ? 'Agronomía: recomendada para Cultivar' : 'Agronomía');
    renderingUi = false;
  }

  function tick() {
    animationFrame = requestAnimationFrame(tick);
    const now = performance.now();
    const delta = Math.min((now - state.lastFrame) / 1000, 0.1);
    state.lastFrame = now;

    if (state.playing) {
      const totalDuration = computeSimulation(0, { initial, layers }).totalDuration;
      state.progress += delta * state.speed / Math.max(totalDuration, 1);
      state.playedTime += delta * state.speed;
      state.realElapsed += delta;
      if (state.progress >= 1) { state.progress = 1; state.playing = false; }
      render();
    }

  }

  mountMetrics();
  render();
  tick();

  return {
    dispose() {
      controller.abort();
      cancelAnimationFrame(animationFrame);
      dom.layerList.replaceChildren();
      dom.metricsGrid.replaceChildren();
      dom.evolutionChart.replaceChildren();
      dom.timelineMarkers.replaceChildren();
      dom.timelineMarkers._timelineMarkers = [];
      dom.samplingTool.replaceChildren();
      metricNodes.clear();
      chartNodes.length = 0;
      samplingUpdater = undefined;
    },
  };
}

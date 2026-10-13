import { computeSimulation, formatNumber, qualityScore } from './metrics.js';
import { formatTime, normalizeProgress, renderTimelineMarkers } from './timeline.js';

const ids = [
  'sceneStatus', 'activeLayerName', 'activeLayerHint', 'sceneTime', 'realTime', 'xrayButton',
  'resetViewButton', 'zoomOutButton', 'zoomInButton', 'lockViewButton', 'inspectorTitle',
  'inspectorDescription', 'qualityBadge', 'qualityRing', 'qualityScore', 'qualityState',
  'qualityDelta', 'metricsGrid', 'selectedStageNumber', 'beforeScore', 'beforeLabel',
  'afterScore', 'afterLabel', 'currentTime', 'totalTime', 'timelineFill', 'timelineThumb',
  'timelineInput', 'timelineMarkers', 'playButton', 'playLabel', 'restartButton',
  'speedOptions', 'layerCount', 'layerList', 'evolutionChart', 'trendPill', 'helpButton',
  'helpModal', 'closeHelpButton', 'scenarioDescription',
  'scenarioControls',
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function createUI(scenario, scene) {
  const layers = scenario.layers;
  const initial = scenario.initial;
  const dom = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const state = { progress: 0, playing: false, speed: 1, xray: false, selected: 'bucket', realElapsed: 0, lastFrame: performance.now() };
  const scenarioState = Object.fromEntries((scenario.controls || []).map((control) => [control.key, control.value]));
  const controller = new AbortController();
  let animationFrame;

  dom.scenarioDescription.textContent = scenario.text.description;
  renderScenarioControls();
  const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: controller.signal });

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
    state.selected = 'bucket';
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
  listen(dom.helpButton, 'click', () => { dom.helpModal.hidden = false; });
  listen(dom.closeHelpButton, 'click', () => { dom.helpModal.hidden = true; });
  listen(dom.helpModal, 'click', (event) => { if (event.target === dom.helpModal) dom.helpModal.hidden = true; });

  function renderLayerList() {
    dom.layerList.innerHTML = layers.map((layer) => `<div class="layer-row ${layer.enabled ? '' : 'is-disabled'} ${state.selected === layer.id ? 'is-selected' : ''}" data-filter="${layer.id}"><span class="layer-row__swatch layer-row__swatch--${layer.id}"></span><span class="layer-row__main"><b>${layer.name}</b><small>${layer.short}</small></span><label class="layer-row__toggle" aria-label="Activar ${layer.name}"><input type="checkbox" ${layer.enabled ? 'checked' : ''} /><span class="layer-row__track"></span></label></div>`).join('');
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

  function renderMetrics(quality) {
    dom.metricsGrid.innerHTML = scenario.metrics.map((metric) => `<div class="metric"><div class="metric-label"><span>${metric.label}</span><span>${metric.unit}</span></div><strong class="metric-value">${formatNumber(quality[metric.key])} <small>${metric.unit}</small></strong><div class="metric-bar"><span style="width:${clamp(quality[metric.key] / metric.max) * 100}%"></span></div></div>`).join('');
  }

  function getDetails(simulation) {
    if (state.selected === 'bucket') {
      return { title: 'Agua de entrada', description: scenario.text.inputDescription, before: initial, after: simulation.stages[1]?.quality || initial, beforeLabel: 'Agua sin tratar', afterLabel: simulation.filters[0]?.name || 'Sin etapas activas', stage: 'Entrada' };
    }

    const layer = layers.find((item) => item.id === state.selected);
    const index = simulation.filters.findIndex((item) => item.id === state.selected);

    if (index < 0) {
      return { title: layer.name, description: scenario.text.disabledDescription, before: initial, after: initial, beforeLabel: 'Sin etapa', afterLabel: 'No participa', stage: 'Desactivada' };
    }

    return { title: layer.name, description: layer.description, before: simulation.stages[index].quality, after: simulation.stages[index + 1].quality, beforeLabel: index ? simulation.filters[index - 1].name : 'Agua sin tratar', afterLabel: index === simulation.filters.length - 1 ? 'Resultado actual' : simulation.filters[index + 1].name, stage: `Etapa ${index + 1}` };
  }

  function render() {
    const carbon = layers.find((layer) => layer.id === 'carbon');
    if (carbon) carbon.saturation = Math.max(carbon.saturation || 0, state.progress);

    const simulation = computeSimulation(state.progress, { initial, layers });
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
    dom.timelineFill.style.width = `${state.progress * 100}%`;
    dom.timelineThumb.style.left = `${state.progress * 100}%`;
    dom.inspectorTitle.textContent = detail.title;
    dom.inspectorDescription.textContent = detail.description;
    dom.qualityBadge.textContent = 'NO POTABLE';
    dom.qualityBadge.className = 'quality-badge low';
    dom.qualityScore.textContent = score;
    dom.qualityRing.style.setProperty('--ring', `${Math.max(5, score)}%`);
    dom.qualityState.textContent = 'NO POTABLE';
    dom.qualityDelta.textContent = 'Filtrar no es potabilizar';
    renderMetrics(simulation.current);
    dom.selectedStageNumber.textContent = detail.stage;
    dom.beforeScore.textContent = qualityScore(detail.before, initial);
    dom.afterScore.textContent = qualityScore(detail.after, initial);
    dom.beforeLabel.textContent = detail.beforeLabel;
    dom.afterLabel.textContent = detail.afterLabel;
    dom.playLabel.textContent = state.playing ? 'Pausar' : 'Reproducir';
    dom.playButton.querySelector('.play-button__icon').textContent = state.playing ? 'Ⅱ' : '▶';
    dom.layerCount.textContent = `${simulation.filters.length} / ${layers.length}`;
    renderLayerList();
    renderTimelineMarkers(dom.timelineMarkers, simulation, state.progress);
    const chartPoints = [
      { label: 'Entrada', before: qualityScore(initial, initial), after: qualityScore(initial, initial) },
      ...simulation.filters.map((layer, index) => ({
        label: layer.name.split(' ')[0],
        before: qualityScore(simulation.stages[index].quality, initial),
        after: qualityScore(simulation.stages[index + 1].quality, initial),
      })),
    ];
    dom.evolutionChart.innerHTML = chartPoints.map((point, index) => `<div class="chart-column ${index === simulation.currentIndex ? 'current' : ''}"><span class="chart-bar before" style="height:${Math.max(4, point.before)}%"></span><span class="chart-bar after" style="height:${Math.max(4, point.after)}%"></span><span class="chart-label">${point.label}</span></div>`).join('');
    dom.trendPill.textContent = `+${Math.max(0, score - qualityScore(initial, initial))} calidad`;
    const renderState = { ...state, ...scenarioState };
    scene.setState(renderState);
    scene.update(simulation, renderState);
  }

  function tick() {
    const now = performance.now();
    const delta = Math.min((now - state.lastFrame) / 1000, 0.1);
    state.lastFrame = now;

    if (state.playing) {
      const totalDuration = computeSimulation(0, { initial, layers }).totalDuration;
      state.progress += delta * state.speed / Math.max(totalDuration, 1);
      state.realElapsed += delta;
      if (state.progress >= 1) { state.progress = 1; state.playing = false; }
      render();
    }

    animationFrame = requestAnimationFrame(tick);
  }

  render();
  tick();

  return {
    dispose() {
      controller.abort();
      cancelAnimationFrame(animationFrame);
    },
  };
}

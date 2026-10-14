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
import { createDeteriorationState, getDeteriorationEffects, renderDeterioration, updateDeterioration } from './tools/deterioration.js';

const ids = [
  'sceneStatus', 'activeLayerName', 'activeLayerHint', 'sceneTime', 'realTime', 'xrayButton', 'inspector',
  'resetViewButton', 'zoomOutButton', 'zoomInButton', 'lockViewButton', 'inspectorTitle',
  'inspectorDescription', 'qualityBadge', 'qualityRing', 'qualityScore', 'qualityState',
  'qualityDelta', 'metricsGrid', 'selectedStageNumber', 'beforeScore', 'beforeLabel',
  'afterScore', 'afterLabel', 'currentTime', 'totalTime', 'timelineFill', 'timelineThumb',
  'timelineInput', 'timelineMarkers', 'playButton', 'playLabel', 'restartButton',
  'previousStageButton', 'nextStageButton', 'stageCounter', 'stageDescription',
  'speedOptions', 'layerCount', 'layerList', 'evolutionChart', 'trendPill', 'helpButton',
  'helpModal', 'closeHelpButton', 'helpDescription', 'scenarioDescription',
  'activeStagesChip',
  'scenarioControls',
  'presetTool',
  'qualitySelect', 'qualityStatus',
  'journeyScenario', 'journeyPlay', 'journeyStages', 'journeyResults',
  'tourOverlay', 'tourTitle', 'tourDescription', 'tourNextButton', 'tourSkipButton',
  'usageTool', 'calculatorTool', 'budgetTool', 'maintenanceTool', 'deteriorationTool', 'samplingTool', 'safetyTool', 'risksTool', 'scheduleTool', 'economicsTool', 'agronomyTool', 'toolsTabs', 'toolsSections',
  'mobileSheet', 'mobileSheetToggle', 'mobileSheetBody', 'mobileSheetStage', 'mobileSheetStatus', 'mobileSheetQuality',
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
  const deteriorationState = createDeteriorationState();
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
  let journeyStep = 1;
  let currentSimulation;
  let tourIndex = 0;
  let tourTrigger;
  const tourEnabled = new URLSearchParams(window.location.search).get('tour') !== '0';
  const tourSteps = [
    { target: 'scenarioSelect', title: 'Elige un escenario', description: 'Cambia entre los sistemas disponibles para comparar su recorrido.' },
    { target: 'playButton', title: 'Reproduce el recorrido', description: 'Pulsa Reproducir para ver cómo avanza el agua por el sistema.' },
    { target: 'stage-navigation', title: 'Explora las etapas', description: 'Usa la línea de tiempo o los botones de etapa para inspeccionar cada parte.' },
    { target: 'toolsSections', title: 'Prueba las herramientas', description: 'Encuentra controles de calidad, planificación y gestión.' },
    { target: 'advancedPanel', title: 'Ajusta Avanzado', description: 'Aquí puedes cambiar la calidad de escena y usar presets.' },
  ];

  function updateJourney() {
    const steps = [dom.journeyScenario, dom.journeyPlay, dom.journeyStages, dom.journeyResults];
    steps.forEach((step, index) => step?.classList.toggle('is-current', index + 1 === journeyStep));
  }

  function closeTour(save = true) {
    if (save) localStorage.setItem('aqualab.tourDone', '1');
    dom.tourOverlay.hidden = true;
    dom.tourOverlay.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.is-tour-target').forEach((node) => node.classList.remove('is-tour-target'));
    tourTrigger?.focus?.();
    tourTrigger = undefined;
  }

  function renderTourStep() {
    const step = tourSteps[tourIndex];
    const targetId = window.matchMedia('(max-width: 600px)').matches && step.target === 'toolsSections' ? 'mobileSheetToggle' : step.target;
    const target = document.getElementById(targetId) || document.querySelector(`.${targetId}`);
    if (!target) return;
    document.querySelectorAll('.is-tour-target').forEach((node) => node.classList.remove('is-tour-target'));
    target.classList.add('is-tour-target');
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    dom.tourTitle.textContent = step.title;
    dom.tourDescription.textContent = step.description;
    dom.tourNextButton.textContent = tourIndex === tourSteps.length - 1 ? 'Listo' : 'Siguiente';
    dom.tourOverlay.hidden = false;
    dom.tourOverlay.setAttribute('aria-hidden', 'false');
    dom.tourNextButton.focus();
  }

  function openTour() {
    if (!tourEnabled) return;
    tourTrigger = document.activeElement;
    tourIndex = 0;
    renderTourStep();
  }

  function trapTourFocus(event) {
    if (dom.tourOverlay.hidden || event.key !== 'Tab') return;
    const focusable = [...dom.tourOverlay.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderUsageTool() {
    const blocked = Boolean(scenarioState.roofType && scenarioState.roofType !== 'compatible');
    renderUsage(dom.usageTool, { value: state.finalUse, blocked, onChange: handleUsageChange });
  }

  function handleUsageChange(value) {
    if (value === 'tomar' && scenarioState.roofType && scenarioState.roofType !== 'compatible') {
      state.finalUse = 'no-potable';
      scenario.onUsageChange?.('no-potable', { scene });
      renderUsageTool();
      render();
      return;
    }
    state.finalUse = value;
    scenario.onUsageChange?.(value, { scene });
    risksUpdater?.(value);
    renderUsageTool();
    render();
  }

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
  scenario.controls?.forEach((control) => {
    scenario.onControlChange?.(control.key, scenarioState[control.key], { layers, state: scenarioState, scene });
  });
  renderTools();
  const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: controller.signal });
  listen(window, 'error', handleUiError);

  listen(document, 'scene-select', (event) => {
    state.selected = event.detail;
    journeyStep = 3;
    render();
  });
  listen(document, 'scenario-change', () => { journeyStep = 1; render(); });
  listen(dom.playButton, 'click', () => {
    state.playing = !state.playing;
    if (state.progress >= 1) state.progress = 0;
    journeyStep = 2;
    render();
  });
  const jumpToStage = (offset) => {
    const simulation = currentSimulation;
    if (!simulation) return;
    const current = simulation.stageStarts.reduce((stage, start, index) => (state.progress >= start ? index : stage), 0);
    const target = Math.max(0, Math.min(simulation.filters.length, current + offset));
    state.playing = false;
    state.progress = simulation.stageStarts[target] || 0;
    state.selected = target === 0 ? 'input' : simulation.filters[target - 1].id;
    journeyStep = 3;
    render();
  };
  listen(dom.previousStageButton, 'click', () => jumpToStage(-1));
  listen(dom.nextStageButton, 'click', () => jumpToStage(1));
  listen(dom.restartButton, 'click', () => {
    state.playing = false;
    state.progress = 0;
    state.realElapsed = 0;
    state.selected = 'input';
    state.playedTime = 0;
    journeyStep = 2;
    render();
  });
  listen(dom.timelineInput, 'input', (event) => {
    state.progress = normalizeProgress(event.target.value);
    state.playing = false;
    journeyStep = 3;
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
    journeyStep = 3;
    render();
  });
  listen(dom.scenarioControls, 'input', handleScenarioControl);
  listen(dom.scenarioControls, 'change', handleScenarioControl);
  listen(dom.qualitySelect, 'change', (event) => {
    qualityMode = event.target.value;
    scene.setQuality(event.target.value);
    dom.qualityStatus.textContent = event.target.value === 'auto' ? 'Auto' : event.target.value === 'light' ? 'Ligera' : 'Alta';
  });
  const toolTabs = () => [...document.querySelectorAll('.tools-section-panel [data-tool-tab]')];
  const setToolTab = (button) => {
    if (!button) return;
    toolTabs().forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-tool-panel]').forEach((panel) => {
      const selected = panel.dataset.toolPanel === button.dataset.toolTab;
      panel.hidden = !selected;
      panel.setAttribute('role', 'tabpanel');
      if (selected) panel.setAttribute('aria-labelledby', button.id);
      else panel.removeAttribute('aria-labelledby');
    });
  };
  const setToolSection = (button) => {
    if (!button) return;
    document.querySelectorAll('[data-tool-section]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-tool-section-panel]').forEach((panel) => { panel.hidden = panel.dataset.toolSectionPanel !== button.dataset.toolSection; });
    setToolTab(document.querySelector(`[data-tool-section-panel="${button.dataset.toolSection}"] [data-tool-tab]`));
  };
  const mobileSheetQuery = window.matchMedia('(max-width: 600px)');
  const toolsPanel = document.getElementById('toolsPanel');
  const toolsPanelOriginalParent = toolsPanel?.parentNode;
  const toolsPanelOriginalNextSibling = toolsPanel?.nextSibling;
  const syncMobileSheetLayout = () => {
    if (!toolsPanel || !dom.mobileSheetBody || !toolsPanelOriginalParent) return;
    if (mobileSheetQuery.matches) {
      if (toolsPanel.parentNode !== dom.mobileSheetBody) dom.mobileSheetBody.append(toolsPanel);
    } else if (toolsPanel.parentNode !== toolsPanelOriginalParent) {
      toolsPanelOriginalParent.insertBefore(toolsPanel, toolsPanelOriginalNextSibling);
    }
  };
  const moveTab = (event, selector) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll(selector)];
    const current = event.target.closest(selector);
    const index = tabs.indexOf(current);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next]?.focus();
    tabs[next]?.click();
  };
  listen(dom.toolsSections, 'click', (event) => {
    setToolSection(event.target.closest('[data-tool-section]'));
    journeyStep = 4;
    render();
  });
  listen(dom.toolsSections, 'keydown', (event) => moveTab(event, '[data-tool-section]'));
  document.querySelectorAll('.tools-section-panel [data-tool-tab]').forEach((button) => {
    listen(button, 'click', () => {
      setToolTab(button);
      journeyStep = 4;
      render();
    });
    listen(button, 'keydown', (event) => moveTab(event, '.tools-section-panel:not([hidden]) [data-tool-tab]'));
  });
  setToolSection(document.querySelector('[data-tool-section].is-active'));
  listen(dom.helpButton, 'click', openTour);
  listen(dom.closeHelpButton, 'click', () => { dom.helpModal.hidden = true; });
  listen(dom.helpModal, 'click', (event) => { if (event.target === dom.helpModal) dom.helpModal.hidden = true; });
  listen(dom.tourNextButton, 'click', () => {
    if (tourIndex === tourSteps.length - 1) closeTour();
    else { tourIndex += 1; renderTourStep(); }
  });
  listen(dom.tourSkipButton, 'click', () => closeTour());
  listen(dom.tourOverlay, 'click', (event) => { if (event.target === dom.tourOverlay) closeTour(); });
  const setSheetExpanded = (expanded) => {
    if (!dom.mobileSheet || !dom.mobileSheetToggle) return;
    dom.mobileSheet.classList.toggle('is-expanded', expanded);
    dom.mobileSheetToggle.setAttribute('aria-expanded', String(expanded));
  };
  const setSheetTab = (tab) => {
    const activeTab = ['reading', 'tools', 'stages'].includes(tab) ? tab : 'reading';
    dom.mobileSheet?.querySelectorAll('[data-sheet-tab]').forEach((button) => {
      const selected = button.dataset.sheetTab === activeTab;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    dom.inspector?.classList.toggle('is-sheet-visible', activeTab === 'reading');
    toolsPanel?.classList.toggle('is-sheet-visible', activeTab === 'tools');
    document.getElementById('layersCard')?.classList.toggle('is-sheet-visible', activeTab === 'stages');
  };
  syncMobileSheetLayout();
  mobileSheetQuery.addEventListener('change', syncMobileSheetLayout);
  setSheetTab('reading');
  setSheetExpanded(false);
  listen(dom.mobileSheetToggle, 'click', () => {
    if (sheetDragged) { sheetDragged = false; return; }
    setSheetExpanded(dom.mobileSheetToggle.getAttribute('aria-expanded') !== 'true');
  });
  dom.mobileSheet?.querySelectorAll('[data-sheet-tab]').forEach((button) => listen(button, 'click', () => { setSheetTab(button.dataset.sheetTab); setSheetExpanded(true); }));
  let sheetPointerStart;
  let sheetDragged = false;
  listen(dom.mobileSheetToggle, 'pointerdown', (event) => { sheetPointerStart = event.clientY; sheetDragged = false; dom.mobileSheetToggle.setPointerCapture?.(event.pointerId); });
  listen(dom.mobileSheetToggle, 'pointermove', (event) => { if (sheetPointerStart === undefined) return; sheetDragged = Math.abs(event.clientY - sheetPointerStart) > 12; });
  listen(dom.mobileSheetToggle, 'pointerup', (event) => {
    if (sheetPointerStart === undefined) return;
    const delta = event.clientY - sheetPointerStart;
    if (Math.abs(delta) > 24) setSheetExpanded(delta < 0);
    sheetPointerStart = undefined;
  });
  listen(document, 'keydown', (event) => {
    trapTourFocus(event);
    if (event.key !== 'Escape') return;
    if (!dom.tourOverlay.hidden) closeTour();
    if (!dom.helpModal.hidden) dom.helpModal.hidden = true;
    if (dom.mobileSheetToggle?.getAttribute('aria-expanded') === 'true') setSheetExpanded(false);
  });
  if (tourEnabled && !localStorage.getItem('aqualab.tourDone')) openTour();

  function renderLayerList() {
    const signature = layers.map((layer) => layer.id).join('|');
    if (layerListSignature !== signature) {
      layerListSignature = signature;
      dom.layerList.replaceChildren(...layers.map((layer) => {
        const row = document.createElement('div');
        row.className = 'layer-row';
        row.dataset.filter = layer.id;
        row.innerHTML = `<span class="layer-row__swatch layer-row__swatch--${layer.id}"></span><span class="layer-row__main"><b class="layer-row__title">${layer.name}</b><small class="layer-row__meta">${layer.short}</small></span><label class="layer-row__toggle" aria-label="Activar ${layer.name}"><input class="layer-row__input" type="checkbox" /><span class="layer-row__track"></span></label>`;
        return row;
      }));
    }
    layers.forEach((layer, index) => {
      const row = dom.layerList.children[index];
      row.classList.toggle('is-disabled', layer.enabled === false);
      row.classList.toggle('is-selected', state.selected === layer.id);
      const input = row.querySelector('.layer-row__input');
      input.checked = layer.enabled !== false;
      input.parentElement.classList.toggle('is-checked', input.checked);
    });
  }

  function renderScenarioControls() {
    if (!dom.scenarioControls || !scenario.controls?.length) return;
    const roofBlocked = scenarioState.roofType && scenarioState.roofType !== 'compatible';
    const warning = roofBlocked
      ? '<p class="scenario-controls__warning" role="alert">\u26a0 Techo no compatible: excluido para agua de beber. Selecciona un uso no potable.</p>'
      : '';
    dom.scenarioControls.innerHTML = `${warning}${scenario.controls.map((control) => {
      if (control.type === 'select') {
        const options = control.options.map((option) => `<option value="${option.value}" ${scenarioState[control.key] === option.value ? 'selected' : ''}>${option.label}</option>`).join('');
        return `<label class="scenario-controls__field"><span>${control.label}</span><select class="scenario-controls__select" data-scenario-control="${control.key}" title="${control.help}" aria-describedby="scenario-${control.key}-hint">${options}</select><small class="scenario-controls__hint" id="scenario-${control.key}-hint">${control.help}</small></label>`;
      }
      return `<label class="scenario-controls__field"><span>${control.label}</span><input class="scenario-controls__input" data-scenario-control="${control.key}" type="${control.type}" value="${scenarioState[control.key]}" min="${control.min}" max="${control.max}" step="${control.step}" title="${control.help}" aria-describedby="scenario-${control.key}-hint" /><small class="scenario-controls__hint" id="scenario-${control.key}-hint">${control.help}</small></label>`;
    }).join('')}`;
  }

  function handleScenarioControl(event) {
    const control = event.target.closest('[data-scenario-control]');
    if (!control) return;
    const definition = scenario.controls.find((item) => item.key === control.dataset.scenarioControl);
    scenarioState[definition.key] = definition.type === 'number' ? Number(control.value) : control.value;
    if (definition.key === 'roofType' && scenarioState.roofType !== 'compatible' && state.finalUse === 'tomar') {
      state.finalUse = 'no-potable';
      scenario.onUsageChange?.('no-potable', { scene });
    }
    scenario.onControlChange?.(definition.key, scenarioState[definition.key], { layers, state: scenarioState, scene });
    if (definition.key === 'roofType') {
      renderScenarioControls();
      renderUsageTool();
    }
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
            const safeValue = value === 'tomar' && scenarioState.roofType && scenarioState.roofType !== 'compatible' ? 'no-potable' : value;
            state.finalUse = safeValue;
            scenario.onUsageChange?.(safeValue, { scene });
          },
        });
        renderUsageTool();
        risksUpdater?.(state.finalUse);
        render();
        return result;
      },
    });
    renderAgronomy(dom.agronomyTool);
    renderUsageTool();
    renderCalculator(dom.calculatorTool, calculatorState, (values) => {
      Object.assign(calculatorState, values);
      economicsUpdater?.();
    });
    renderBudget(dom.budgetTool, budgetState, (change) => {
      Object.assign(budgetState, change);
      economicsUpdater?.();
    });
    renderMaintenance(dom.maintenanceTool, maintenanceState, (values) => { Object.assign(maintenanceState, values); updateDeterioration(deteriorationState, scenarioState.simulatedWeeks || 0, scenario, maintenanceState); renderDeterioration(dom.deteriorationTool, deteriorationState, (weeks) => { scenarioState.simulatedWeeks = weeks; render(); }); render(); });
    updateDeterioration(deteriorationState, scenarioState.simulatedWeeks || 0, scenario, maintenanceState);
    renderDeterioration(dom.deteriorationTool, deteriorationState, (weeks) => {
      scenarioState.simulatedWeeks = weeks;
      updateDeterioration(deteriorationState, weeks, scenario, maintenanceState);
      renderDeterioration(dom.deteriorationTool, deteriorationState, (nextWeeks) => { scenarioState.simulatedWeeks = nextWeeks; render(); });
      render();
    });
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
      root.innerHTML = `<div class="metric-label"><span class="metric-label__text">${metric.label}</span><span class="metric-label__text">${metric.unit}</span></div><strong class="metric-value"><span></span>${metric.unit ? ` <small class="metric-value__unit">${metric.unit}</small>` : ''}</strong><div class="metric-bar"><span class="metric-bar__fill"></span></div>`;
      metricNodes.set(metric.key, { root, value: root.querySelector('.metric-value span'), bar: root.querySelector('.metric-bar__fill') });
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
      column.innerHTML = `<span class="chart-bar chart-bar--before"></span><span class="chart-bar chart-bar--after"></span><span class="chart-label"></span>`;
      column.querySelector('.chart-label').textContent = point.label;
      chartNodes.push({ column, before: column.querySelector('.chart-bar--before'), after: column.querySelector('.chart-bar--after'), point });
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
      column.classList.toggle('chart-column--current', index === simulation.currentIndex);
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
    updateDeterioration(deteriorationState, scenarioState.simulatedWeeks || 0, scenario, maintenanceState);
    const effects = getDeteriorationEffects(deteriorationState);
    const carbon = layers.find((layer) => layer.id === 'carbon');
    if (carbon) carbon.saturation = effects.carbon || 0;
    const simulation = computeSimulation(state.progress, { initial, layers, deterioration: { effects } });
    currentSimulation = simulation;
    currentQuality = simulation.current;
    const renderState = { ...state, ...scenarioState };
    scene.setState({ ...renderState, deterioration: deteriorationState });
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
      const samplingSimulation = computeSimulation(1, { initial, layers, deterioration: { effects } });
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
    if (scenarioState.roofType && scenarioState.roofType !== 'compatible' && (state.selected === 'input' || state.selected === 'captacion')) {
      detail.description = `${detail.description} Excluido para agua de beber; sugiere usos no potables.`;
    }
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
    dom.qualityBadge.className = 'quality-badge quality-badge--low';
    dom.qualityScore.textContent = score;
    dom.qualityRing.style.setProperty('--ring', `${Math.max(5, score)}%`);
    dom.qualityState.textContent = 'NO POTABLE';
    dom.qualityDelta.textContent = 'Filtrar no es potabilizar';
    dom.mobileSheetStage.textContent = detail.stage === 'Entrada' ? 'Entrada' : detail.title;
    dom.mobileSheetStatus.textContent = 'NO POTABLE';
    dom.mobileSheetQuality.textContent = `${score}/100`;
    dom.selectedStageNumber.textContent = detail.stage;
    dom.beforeScore.textContent = qualityScore(detail.before, initial);
    dom.afterScore.textContent = qualityScore(detail.after, initial);
    dom.beforeLabel.textContent = detail.beforeLabel;
    dom.afterLabel.textContent = detail.afterLabel;
    dom.playLabel.textContent = state.playing ? 'Pausar' : 'Reproducir';
      dom.playButton.querySelector('.play-button__icon').textContent = state.playing ? 'Ⅱ' : '▶';
    updateJourney();
    const stageCount = simulation.filters.length + 1;
    const stageIndex = simulation.stageStarts.reduce((stage, start, index) => (state.progress >= start ? index : stage), 0);
    const stageLayer = stageIndex > 0 ? simulation.filters[stageIndex - 1] : null;
    dom.stageCounter.textContent = `Etapa ${stageIndex + 1} de ${stageCount}`;
    dom.stageDescription.textContent = stageLayer?.description || scenario.text.inputDescription;
    dom.previousStageButton.disabled = stageIndex === 0;
    dom.nextStageButton.disabled = stageIndex >= simulation.filters.length;
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
      updateDeterioration(deteriorationState, scenarioState.simulatedWeeks || 0, scenario, maintenanceState);
      const totalDuration = computeSimulation(0, { initial, layers, deterioration: { effects: getDeteriorationEffects(deteriorationState) } }).totalDuration;
      state.progress += delta * state.speed / Math.max(totalDuration, 1);
      state.playedTime += delta * state.speed;
      state.realElapsed += delta;
      if (state.progress >= 1) { state.progress = 1; state.playing = false; journeyStep = 4; }
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

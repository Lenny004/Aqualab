import './style.css';
import { scenarios, getScenario } from './scenarios/registry.js';
import { createUI } from './core/ui.js';

const canvas = document.getElementById('sceneCanvas');
const selector = document.getElementById('scenarioSelect');
let activeScene;
let activeUI;

function mountScenario(id) {
  activeUI?.dispose();
  activeScene?.dispose();

  const scenario = getScenario(id);
  activeScene = scenario.buildScene({
    canvas,
    onSelect: (selected) => document.dispatchEvent(new CustomEvent('scene-select', { detail: selected })),
  });
  activeUI = createUI(scenario, activeScene);
}

selector.innerHTML = scenarios.map((scenario) => `<option value="${scenario.id}">${scenario.name}</option>`).join('');
selector.addEventListener('change', (event) => mountScenario(event.target.value));
mountScenario(scenarios[0].id);

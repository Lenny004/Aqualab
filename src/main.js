import './style.css';
import * as THREE from 'three';
import { scenarios, getScenario } from './scenarios/registry.js';
import { createUI } from './core/ui.js';

const canvas = document.getElementById('sceneCanvas');
const selector = document.getElementById('scenarioSelect');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
let activeScene;
let activeUI;

const cloneLayers = (layers) => (typeof structuredClone === 'function'
  ? structuredClone(layers)
  : JSON.parse(JSON.stringify(layers)));

function mountScenario(id) {
  activeUI?.dispose();
  activeScene?.dispose();

  const scenario = getScenario(id);
  const layers = cloneLayers(scenario.layers);
  const mountedScenario = { ...scenario, layers };
  activeScene = scenario.buildScene({
    canvas,
    renderer,
    layers,
    camera: scenario.camera,
    onSelect: (selected) => document.dispatchEvent(new CustomEvent('scene-select', { detail: selected })),
  });
  activeUI = createUI(mountedScenario, activeScene);
}

selector.innerHTML = scenarios.map((scenario) => `<option value="${scenario.id}">${scenario.name}</option>`).join('');
selector.addEventListener('change', (event) => {
  mountScenario(event.target.value);
  document.dispatchEvent(new CustomEvent('scenario-change'));
});
mountScenario(scenarios[0].id);

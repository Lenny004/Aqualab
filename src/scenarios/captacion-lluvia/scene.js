import * as THREE from 'three';
import { createParticles } from '../../core/particles.js';
import { lerp, qualityScore } from '../../core/metrics.js';
import { INITIAL } from './layers.js';

export function getLabelScale(canvasWidth, canvasHeight, height = 0.45) {
  return new THREE.Vector3(height * (canvasWidth / canvasHeight), height, 1);
}

function makeLabel(text, color = '#b8eee0') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const lines = text.split('\n').flatMap((line) => {
    const chunks = line.match(/.{1,22}(?:\s+|$)/g);
    return chunks ? chunks.map((chunk) => chunk.trim()) : [line];
  });
  const fontSize = 48;
  const lineHeight = 56;
  const padding = 16;
  context.font = `${fontSize}px monospace`;
  canvas.width = Math.ceil(Math.max(...lines.map((line) => context.measureText(line).width)) + padding * 2);
  canvas.height = lineHeight * lines.length + padding * 2;
  context.font = `${fontSize}px monospace`;
  context.fillStyle = color;
  lines.forEach((line, index) => context.fillText(line, padding, padding + fontSize + index * lineHeight));
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.copy(getLabelScale(canvas.width, canvas.height));
  sprite.userData = { isLabel: true };
  return sprite;
}

function makeTank(group, position, color, height = 2.1) {
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.92, height, 32), new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.7, roughness: 0.35 }));
  tank.position.set(...position);
  group.add(tank);
  return tank;
}

export function createCaptacionLluviaObjects({ scene, layers, addInteractive }) {
  const root = new THREE.Group();
  const flowGroup = new THREE.Group();
  const stageObjects = new Map();
  const dirty = new THREE.MeshBasicMaterial({ color: 0xa98155 });
  const clean = new THREE.MeshBasicMaterial({ color: 0x6bd5c4, transparent: true, opacity: 0.8 });

  scene.add(root);
  root.position.x = -1.3;
  root.add(flowGroup);

  function addLabel(text, color, x, y, z) {
    const sprite = makeLabel(text, color);
    sprite.position.set(x, y, z);
    root.add(sprite);
    return sprite;
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.8), new THREE.MeshStandardMaterial({ color: 0x788f89, roughness: 0.75 }));
  roof.position.set(-2.7, 5.8, 0);
  roof.rotation.z = -0.22;
  root.add(roof);
  addLabel('techo inclinado', '#d7f7eb', -4.3, 6.35, 0);

  const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.9, 16), new THREE.MeshStandardMaterial({ color: 0x9fc9bd }));
  gutter.rotation.z = Math.PI / 2;
  gutter.position.set(-2.7, 5.25, 1.1);
  root.add(gutter);
  const downpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 16), new THREE.MeshStandardMaterial({ color: 0x9fc9bd }));
  downpipe.position.set(-0.8, 3.75, 1.1);
  root.add(downpipe);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), new THREE.MeshBasicMaterial({ color: 0xd9fff2, wireframe: true }));
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(-0.8, 4.9, 1.1);
  mesh.userData = { type: 'filter', id: 'malla' };
  root.add(mesh);
  addInteractive(mesh);

  const firstFlush = makeTank(root, [0.5, 2.15, 1.1], 0xb58b55, 1.8);
  firstFlush.userData = { type: 'filter', id: 'primeras-aguas' };
  addInteractive(firstFlush);
  addLabel('25 L · drenaje', '#f6d8a8', -0.1, 3.45, 1.1);
  const rawTank = makeTank(root, [2.4, 2.1, 0], 0x8caa9c, 2.5);
  rawTank.userData = { type: 'filter', id: 'deposito-crudo' };
  addInteractive(rawTank);
  addLabel('depósito crudo · 200 L', '#d7f7eb', 1.55, 3.85, 0);
  const overflow = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: 0xe6c36a }));
  overflow.position.set(2.4, 3.38, 0);
  overflow.rotation.x = Math.PI / 2;
  root.add(overflow);
  addLabel('rebose con malla · riesgo de erosión/cimientos', '#f6d8a8', 0.7, 4.55, 0);

  const filter = new THREE.Group();
  filter.position.set(4.2, 1.9, 0);
  root.add(filter);
  ['grava', 'arena', 'carbón'].forEach((name, index) => {
    const layer = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.35), new THREE.MeshStandardMaterial({ color: [0xb38d61, 0xd7b778, 0x385c52][index] }));
    layer.position.y = -0.7 + index * 0.58;
    filter.add(layer);
  });
  for (let index = 0; index < 2; index += 1) {
    const separator = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.03, 1.4), new THREE.MeshBasicMaterial({ color: 0xd4fff1, wireframe: true }));
    separator.position.y = -0.42 + index * 0.58;
    filter.add(separator);
  }
  filter.userData = { type: 'filter', id: 'filtro-granular' };
  addInteractive(filter);
  addLabel('grava · arena · carbón', '#d7f7eb', 3.35, 3.65, 0);
  addLabel('orden y diseño hidráulico', '#f6d8a8', 3.35, 3.15, 0);

  const disinfection = makeTank(root, [6.15, 2.1, 0], 0x9276b8, 2.2);
  disinfection.userData = { type: 'filter', id: 'disinfection' };
  addInteractive(disinfection);
  addLabel('tiempo de contacto', '#d7f7eb', 5.25, 3.75, 0);
  addLabel('cloro residual libre: medir', '#f6d8a8', 5.25, 3.25, 0);
  addLabel('turbidez alta ↓ eficacia', '#f6d8a8', 5.25, 2.75, 0);
  addLabel('ebullición: solo emergencia', '#f6d8a8', 5.25, 2.25, 0);

  const cleanTank = makeTank(root, [8.05, 2.1, 0], 0x5ea99f, 2.5);
  cleanTank.userData = { type: 'filter', id: 'deposito-limpio' };
  addInteractive(cleanTank);
  addLabel('depósito limpio · tapa', '#d7f7eb', 7.25, 3.9, 0);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 16), new THREE.MeshStandardMaterial({ color: 0xbbeee2 }));
  tap.rotation.z = Math.PI / 2;
  tap.position.set(8.95, 1.8, 0);
  root.add(tap);
  addLabel('grifo higiénico', '#d7f7eb', 7.8, 1.35, 0);

  const control = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe4c466 }));
  control.position.set(9.8, 2.1, 0);
  control.userData = { type: 'filter', id: 'control' };
  root.add(control);
  addInteractive(control);
  addLabel('muestreo', '#d7f7eb', 9.15, 3.35, 0);

  root.traverse((object) => {
    if (!object.userData.isLabel) return;
    if (window.innerWidth < 500) object.visible = false;
  });

  layers.forEach((layer) => {
    const object = layer.id === 'primeras-aguas' ? firstFlush : layer.id === 'deposito-crudo' ? rawTank : layer.id === 'disinfection' ? disinfection : layer.id === 'deposito-limpio' ? cleanTank : layer.id === 'filtro-granular' ? filter : null;
    if (object) stageObjects.set(layer.id, object);
  });

  const particles = createParticles(flowGroup, { count: 150, height: 1.2, radius: 0.28, color: 0xe9bd78, size: 0.07 });
  const path = [
    new THREE.Vector3(-4.5, 5.7, 0),
    new THREE.Vector3(-0.8, 4.8, 0),
    new THREE.Vector3(0.5, 2.7, 1.1),
    new THREE.Vector3(2.4, 2.5, 0),
    new THREE.Vector3(4.2, 2.5, 0),
    new THREE.Vector3(6.15, 2.5, 0),
    new THREE.Vector3(8.05, 2.5, 0),
    new THREE.Vector3(9.8, 2.5, 0),
  ];
  const water = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), dirty);
  root.add(water);
  const divertedWater = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: 0x8e633f, transparent: true, opacity: 0 }));
  root.add(divertedWater);

  return {
    boundsObject: root,
    particles,
    update(simulation, state) {
      const score = qualityScore(simulation.current, INITIAL) / 100;
      const segment = Math.min(path.length - 1, Math.floor(state.progress * (path.length - 1)));
      const local = state.progress * (path.length - 1) - segment;
      water.position.lerpVectors(path[segment], path[Math.min(segment + 1, path.length - 1)], local);
      const waterMaterial = score > 0.62 ? clean : dirty;
      if (water.material !== waterMaterial) water.material = waterMaterial;
      const volume = state.firstFlushVolume || 25;
      if (firstFlush.userData.volume !== volume) {
        firstFlush.scale.y = 0.8 + volume / 100;
        firstFlush.userData.volume = volume;
      }
      const divertedProgress = (state.progress - 0.08) / 0.16;
      divertedWater.position.lerpVectors(path[1], path[2], Math.min(1, Math.max(0, divertedProgress)));
      const divertedOpacity = divertedProgress >= 0 && divertedProgress <= 1 ? 0.9 : 0;
      if (divertedWater.material.opacity !== divertedOpacity) divertedWater.material.opacity = divertedOpacity;
      const layerState = layers.map((layer) => `${layer.id}:${layer.enabled !== false}`).join('|');
      if (layerState !== this.layerState) {
        stageObjects.forEach((object, id) => {
          const layer = layers.find((item) => item.id === id);
          object.visible = layer?.enabled !== false;
        });
        this.layerState = layerState;
      }
      const dirtyWater = state.progress < 0.2;
      if (this.dirtyWater !== dirtyWater) {
        particles.material.color.set(dirtyWater ? 0xe9bd78 : 0x9be4c7);
        this.dirtyWater = dirtyWater;
      }
    },
    select(id) {
      stageObjects.forEach((object, objectId) => {
        const selected = objectId === id;
        object.traverse((child) => {
          if (child.material?.emissive) child.material.emissive.set(selected ? 0x72d6b5 : 0x000000);
        });
      });
    },
    setXray(enabled) {
      root.traverse((object) => {
        if (object.material?.transparent && object.material.opacity !== undefined) object.material.opacity = enabled ? 0.32 : 0.7;
      });
    },
  };
}

import * as THREE from 'three';
import { createParticles } from '../../core/particles.js';
import { qualityScore } from '../../core/metrics.js';
import { INITIAL } from './layers.js';

const LABEL_FONT_SIZE = 64;
const LABEL_PADDING = 24;
const LABEL_HEIGHT = 80;
const LABEL_DESKTOP_HEIGHT = 14;
const LABEL_MOBILE_HEIGHT = 13;

export function getLabelScale(canvasWidth, canvasHeight, textureWidth, textureHeight, fov = 30, pixelHeight = LABEL_DESKTOP_HEIGHT) {
  const screenHeight = canvasHeight || 575;
  const worldHeight = (2 * pixelHeight * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) / screenHeight;
  return new THREE.Vector3(worldHeight * (textureWidth / textureHeight), worldHeight, 1);
}

function getDevicePixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function drawLabel(canvas, text, color) {
  const devicePixelRatio = getDevicePixelRatio();
  const context = canvas.getContext('2d');
  context.font = `${LABEL_FONT_SIZE * devicePixelRatio}px monospace`;
  canvas.width = Math.ceil(context.measureText(text).width) + LABEL_PADDING * devicePixelRatio;
  canvas.height = LABEL_HEIGHT * devicePixelRatio;
  context.font = `${LABEL_FONT_SIZE * devicePixelRatio}px monospace`;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, LABEL_PADDING * devicePixelRatio, canvas.height / 2);
}

function makeLabel(text, color = '#b8eee0') {
  const canvas = document.createElement('canvas');
  drawLabel(canvas, text, color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: false }));
  sprite.userData = { isLabel: true, labelText: text, labelColor: color, textureWidth: canvas.width, textureHeight: canvas.height };
  return sprite;
}

function setLabelText(sprite, text, viewport) {
  const canvas = sprite.material.map.image;
  drawLabel(canvas, text, sprite.userData.labelColor);
  sprite.userData.labelText = text;
  sprite.userData.textureWidth = canvas.width;
  sprite.userData.textureHeight = canvas.height;
  if (viewport) sprite.scale.copy(getLabelScale(viewport.width, viewport.height, canvas.width, canvas.height, viewport.fov, viewport.pixelHeight));
  sprite.material.map.needsUpdate = true;
}

function makeTank(group, position, color, height = 2.1) {
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.92, height, 24), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7, roughness: 0.35 }));
  tank.position.set(...position);
  group.add(tank);
  return tank;
}

export function createCaptacionLluviaObjects({ scene, layers, addInteractive }) {
  const root = new THREE.Group();
  const flowGroup = new THREE.Group();
  const stageObjects = new Map();
  const labels = new Map();
  const viewport = { width: 700, height: 575, fov: 30, pixelHeight: LABEL_DESKTOP_HEIGHT };
  const dirty = new THREE.MeshBasicMaterial({ color: 0xa98155 });
  const clean = new THREE.MeshBasicMaterial({ color: 0x6bd5c4, transparent: true, opacity: 0.8 });
  scene.add(root);
  root.position.x = -1.3;
  root.add(flowGroup);

  function addLabel(id, text, color, x, y, z) {
    const sprite = makeLabel(text, color);
    sprite.position.set(x, y, z);
    sprite.userData.labelId = id;
    labels.set(id, sprite);
    root.add(sprite);
    return sprite;
  }

  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x788f89, roughness: 0.75 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.8), roofMaterial);
  roof.position.set(-2.7, 5.8, 0);
  roof.rotation.z = -0.22;
  roof.userData = { type: 'filter', id: 'captacion' };
  root.add(roof);
  addInteractive(roof);
  addLabel('captacion', 'Techo', '#d7f7eb', -4.3, 6.35, 0);

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
  addLabel('malla', 'Malla', '#d7f7eb', -1.2, 5.2, 1.1);

  const firstFlush = makeTank(root, [0.5, 2.15, 1.1], 0xb58b55, 1.8);
  firstFlush.userData = { type: 'filter', id: 'primeras-aguas' };
  addInteractive(firstFlush);
  const firstFlushLabel = addLabel('primeras-aguas', 'Primeras aguas 25 L', '#f6d8a8', -0.1, 3.45, 1.1);
  const rawTank = makeTank(root, [2.4, 2.1, 0], 0x8caa9c, 2.5);
  rawTank.userData = { type: 'filter', id: 'deposito-crudo' };
  addInteractive(rawTank);
  addLabel('deposito-crudo', 'Depósito crudo 200 L', '#d7f7eb', 1.55, 3.85, 0);
  const overflow = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: 0xe6c36a }));
  overflow.position.set(2.4, 3.38, 0);
  overflow.rotation.x = Math.PI / 2;
  overflow.userData = { type: 'filter', id: 'deposito-crudo' };
  root.add(overflow);
  addLabel('rebose', 'Rebose', '#f6d8a8', 3.45, 2.85, 0.75);

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
  addLabel('filtro-granular', 'Filtro', '#d7f7eb', 4.2, 4.15, 0);

  const disinfection = makeTank(root, [6.15, 2.1, 0], 0x9276b8, 2.2);
  disinfection.userData = { type: 'filter', id: 'disinfection' };
  addInteractive(disinfection);
  addLabel('disinfection', 'Desinfección', '#d7f7eb', 6.15, 3.75, 0);
  const cleanTank = makeTank(root, [8.05, 2.1, 0], 0x5ea99f, 2.5);
  cleanTank.userData = { type: 'filter', id: 'deposito-limpio' };
  addInteractive(cleanTank);
  addLabel('deposito-limpio', 'Depósito limpio', '#d7f7eb', 8.05, 3.9, 0);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 16), new THREE.MeshStandardMaterial({ color: 0xbbeee2 }));
  tap.rotation.z = Math.PI / 2;
  tap.position.set(8.95, 1.8, 0);
  root.add(tap);
  const control = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe4c466 }));
  control.position.set(9.8, 2.1, 0);
  control.userData = { type: 'filter', id: 'control' };
  root.add(control);
  addInteractive(control);
  addLabel('control', 'Muestreo', '#d7f7eb', 9.8, 3.35, 0);

  labels.forEach((label) => { label.visible = window.innerWidth >= 500; });
  layers.forEach((layer) => {
    const object = layer.id === 'primeras-aguas' ? firstFlush : layer.id === 'deposito-crudo' ? rawTank : layer.id === 'disinfection' ? disinfection : layer.id === 'deposito-limpio' ? cleanTank : layer.id === 'filtro-granular' ? filter : null;
    if (object) stageObjects.set(layer.id, object);
  });
  const particles = createParticles(flowGroup, { count: 150, height: 1.2, radius: 0.28, color: 0xe9bd78, size: 0.07 });
  const path = [new THREE.Vector3(-4.5, 5.7, 0), new THREE.Vector3(-0.8, 4.8, 0), new THREE.Vector3(0.5, 2.7, 1.1), new THREE.Vector3(2.4, 2.5, 0), new THREE.Vector3(4.2, 2.5, 0), new THREE.Vector3(6.15, 2.5, 0), new THREE.Vector3(8.05, 2.5, 0), new THREE.Vector3(9.8, 2.5, 0)];
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
        setLabelText(firstFlushLabel, `Primeras aguas ${volume} L`, viewport);
      }
      const divertedProgress = (state.progress - 0.08) / 0.16;
      divertedWater.position.lerpVectors(path[1], path[2], Math.min(1, Math.max(0, divertedProgress)));
      const divertedOpacity = divertedProgress >= 0 && divertedProgress <= 1 ? 0.9 : 0;
      if (divertedWater.material.opacity !== divertedOpacity) divertedWater.material.opacity = divertedOpacity;
      let layerState = 0;
      for (let index = 0; index < layers.length; index += 1) if (layers[index].enabled !== false) layerState |= 1 << index;
      if (layerState !== this.layerState) {
        stageObjects.forEach((object, id) => { object.visible = layers.find((layer) => layer.id === id)?.enabled !== false; });
        this.layerState = layerState;
      }
      const dirtyWater = state.progress < 0.2;
      if (this.dirtyWater !== dirtyWater) {
        particles.material.color.set(dirtyWater ? 0xe9bd78 : 0x9be4c7);
        this.dirtyWater = dirtyWater;
      }
    },
    select(id) {
      this.selectedLabel = id;
      labels.forEach((label, labelId) => { label.visible = window.innerWidth >= 500 || labelId === id; });
      stageObjects.forEach((object, objectId) => {
        const selected = objectId === id;
        object.traverse((child) => { if (child.material?.emissive) child.material.emissive.set(selected ? 0x72d6b5 : 0x000000); });
      });
    },
    setXray(enabled) {
      root.traverse((object) => { if (object.material?.transparent && object.material.opacity !== undefined) object.material.opacity = enabled ? 0.32 : 0.7; });
    },
    setRoofType(type) {
      roofMaterial.color.set(type === 'compatible' ? 0x788f89 : 0x9a5f58);
    },
    setQuality(mode) {
      this.qualityMode = mode;
      const light = mode === 'light';
      particles.visible = !light;
      particles.geometry.setDrawRange(0, light ? particles.userData.offsets.length / 2 : particles.userData.offsets.length);
      labels.forEach((label, id) => { label.visible = !light && (window.innerWidth >= 500 || id === this.selectedLabel); });
    },
    setViewport(width, height, fov = 30) {
      const pixelHeight = width >= 500 ? LABEL_DESKTOP_HEIGHT : LABEL_MOBILE_HEIGHT;
      Object.assign(viewport, { width, height, fov, pixelHeight });
      labels.forEach((label, id) => {
        label.scale.copy(getLabelScale(width, height, label.userData.textureWidth, label.userData.textureHeight, fov, pixelHeight));
        label.visible = this.qualityMode !== 'light' && (width >= 500 || id === this.selectedLabel);
      });
    },
  };
}

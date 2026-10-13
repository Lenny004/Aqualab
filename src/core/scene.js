import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { updateParticles } from './particles.js';

export class PurificationScene {
  constructor({ canvas, renderer, layers, onSelect, createObjects }) {
    this.canvas = canvas;
    this.onSelect = onSelect;
    this.layers = layers;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.interactives = [];
    this.disposed = false;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#0a1b1c', 12, 28);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(8.4, 5.5, 11.5);
    this.renderer = renderer;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 17;
    this.controls.target.set(0, 3.5, 0);
    this.controls.update();
    this.clock = new THREE.Clock();
    this.viewLocked = false;
    this.createLights();
    this.createEnvironment();
    this.objects = createObjects(this.getObjectApi());
    this.resize();
    this.handleResize = () => this.resize();
    this.handlePointer = (event) => this.onPointer(event);
    window.addEventListener('resize', this.handleResize);
    canvas.addEventListener('pointerdown', this.handlePointer);
    this.animate();
  }

  getObjectApi() {
    return {
      scene: this.scene,
      interactives: this.interactives,
      layers: this.layers,
      addInteractive: (object) => this.interactives.push(object),
    };
  }

  createLights() {
    const hemi = new THREE.HemisphereLight(0xb8eee0, 0x071111, 2.2);
    const key = new THREE.DirectionalLight(0xb3e8d5, 3.4);
    const rim = new THREE.PointLight(0x45d1b0, 3, 15);

    key.position.set(-5, 11, 7);
    rim.position.set(4, 5, -4);
    this.scene.add(hemi, key, rim);
  }

  createEnvironment() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(8, 64),
      new THREE.MeshBasicMaterial({ color: 0x0a2020, transparent: true, opacity: 0.8 }),
    );

    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.02;
    this.scene.add(floor);
  }

  onPointer(event) {
    const rect = this.canvas.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const hit = this.raycaster.intersectObjects(this.interactives, false)[0];

    if (hit) {
      this.onSelect(hit.object.userData.id || 'input');
    }
  }

  update(simulation, state) {
    this.objects.update?.(simulation, state);
    this.select(state.selected);
  }

  select(id) {
    if (id === this.selectedId) return;
    this.selectedId = id;
    this.objects.select?.(id);
  }

  setXray(enabled) {
    this.objects.setXray?.(enabled);
  }

  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = Math.min(17, Math.max(7, offset.length() * factor));

    this.camera.position.copy(this.controls.target).add(offset.normalize().multiplyScalar(distance));
    this.controls.update();
  }

  toggleViewLock() {
    this.viewLocked = !this.viewLocked;
    this.controls.enableRotate = !this.viewLocked;
    this.controls.enableZoom = !this.viewLocked;
    return this.viewLocked;
  }

  resetCamera() {
    this.camera.position.set(8.4, 5.5, 11.5);
    this.controls.target.set(0, 3.5, 0);
    this.controls.update();
  }

  resize() {
    const width = this.canvas.clientWidth || 700;
    const height = this.canvas.clientHeight || 575;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setState(state) {
    this.state = state;
  }

  setUsage(usage) {
    this.state = { ...this.state, finalUse: usage };
  }

  animate() {
    if (this.disposed) {
      return;
    }

    requestAnimationFrame(() => this.animate());
    updateParticles(this.objects.particles, this.clock.getElapsedTime(), this.state?.progress || 0);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('pointerdown', this.handlePointer);
    this.objects.dispose?.();
    const textures = new Set();
    const disposeMaterial = (material) => {
      if (!material) return;
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value);
      });
      material.dispose();
    };
    this.scene.traverse((object) => {
      object.geometry?.dispose();

      if (Array.isArray(object.material)) {
        object.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(object.material);
      }
    });
    textures.forEach((texture) => texture.dispose());
    this.controls.dispose();
    this.renderer.renderLists.dispose();
  }
}

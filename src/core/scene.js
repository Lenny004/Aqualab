import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { updateParticles } from './particles.js';

export class PurificationScene {
  constructor({ canvas, renderer, layers, onSelect, createObjects, camera = {} }) {
    this.canvas = canvas;
    this.onSelect = onSelect;
    this.layers = layers;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.interactives = [];
    this.disposed = false;
    this.qualityMode = 'auto';
    this.needsRender = true;
    this.animationFrame = 0;
    this.frameSamples = [];
    this.lastFrameTime = performance.now();
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#0a1b1c', 12, 28);
    this.cameraConfig = {
      position: camera.position || [8.4, 5.5, 11.5],
      target: camera.target || [0, 3.5, 0],
      minDistance: camera.minDistance || 7,
      maxDistance: camera.maxDistance || 17,
      fitMargin: camera.fitMargin || 1.1,
    };
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.renderer = renderer;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = this.cameraConfig.minDistance;
    this.controls.maxDistance = this.cameraConfig.maxDistance;
    this.controls.target.fromArray(this.cameraConfig.target);
    this.controls.update();
    this.controls.addEventListener('change', () => this.invalidate());
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
    this.floor = floor;
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
    this.invalidate();
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
    const distance = Math.min(this.cameraConfig.maxDistance, Math.max(this.cameraConfig.minDistance, offset.length() * factor));

    this.camera.position.copy(this.controls.target).add(offset.normalize().multiplyScalar(distance));
    this.controls.update();
    this.updateFog(distance);
  }

  toggleViewLock() {
    this.viewLocked = !this.viewLocked;
    this.controls.enableRotate = !this.viewLocked;
    this.controls.enableZoom = !this.viewLocked;
    return this.viewLocked;
  }

  resetCamera() {
    this.fitCameraToContent();
  }

  resize() {
    const width = this.canvas.clientWidth || 700;
    const height = this.canvas.clientHeight || 575;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.objects.setViewport?.(width);
    this.fitCameraToContent();
  }

  fitCameraToContent() {
    const content = this.objects?.boundsObject;
    if (!content) return;

    const bounds = new THREE.Box3().setFromObject(content);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const verticalDistance = (size.y / 2) / Math.tan(verticalFov / 2);
    const horizontalDistance = (size.x / 2) / Math.tan(horizontalFov / 2);
    const distance = Math.max(verticalDistance, horizontalDistance) * this.cameraConfig.fitMargin;
    const configuredOffset = new THREE.Vector3().fromArray(this.cameraConfig.position).sub(new THREE.Vector3().fromArray(this.cameraConfig.target));
    const direction = configuredOffset.normalize();
    const fittedDistance = Math.min(this.cameraConfig.maxDistance, Math.max(this.cameraConfig.minDistance, distance));

    this.controls.target.copy(center);
    this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(fittedDistance));
    this.controls.update();
    this.updateFog(fittedDistance);

    const floorRadius = Math.max(size.x, size.z) * 0.6;
    this.floor.position.set(center.x, 0.02, center.z);
    this.floor.scale.setScalar(Math.max(0.5, floorRadius / 8));
  }

  updateFog(distance) {
    this.scene.fog.near = distance * 0.9;
    this.scene.fog.far = distance * 2.5;
  }

  setState(state) {
    this.state = state;
    if (state.playing) this.invalidate();
  }

  setQuality(mode) {
    this.qualityMode = mode;
    this.renderer.setPixelRatio(mode === 'light' ? 1 : Math.min(window.devicePixelRatio, 2));
    this.objects.setQuality?.(mode);
    this.invalidate();
  }

  invalidate() {
    this.needsRender = true;
    if (!this.animationFrame && !this.disposed) this.animate();
  }

  setUsage(usage) {
    this.state = { ...this.state, finalUse: usage };
  }

  animate() {
    if (this.disposed) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = 0;
      const now = performance.now();
      const frameDelta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      if (frameDelta > 0 && frameDelta < 1000) this.frameSamples.push({ time: now, delta: frameDelta });
      while (this.frameSamples.length && now - this.frameSamples[0].time > 2000) this.frameSamples.shift();
      if (this.state?.playing) updateParticles(this.objects.particles, this.clock.getElapsedTime(), this.state.progress || 0);
      this.controls.update();
      if (this.needsRender || this.state?.playing) {
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
      }
      this.checkAutoQuality(now);
      if (this.needsRender || this.state?.playing) this.animate();
    });
  }

  checkAutoQuality(now) {
    if (this.qualityMode !== 'auto' || this.frameSamples.length < 10) return;
    if (now - this.frameSamples[0].time < 1900) return;
    const average = this.frameSamples.reduce((sum, sample) => sum + sample.delta, 0) / this.frameSamples.length;
    if (average > 1000 / 30) {
      this.qualityMode = 'light';
      this.renderer.setPixelRatio(1);
      this.objects.setQuality?.('light');
      this.onQualityChange?.('light', average);
      this.invalidate();
    }
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
    cancelAnimationFrame(this.animationFrame);
  }
}

import * as THREE from 'three';
import { createParticles } from '../../core/particles.js';
import { lerp, qualityScore } from '../../core/metrics.js';
import { INITIAL } from './layers.js';

export function createBaldeBarrilObjects({ scene, layers, addInteractive }) {
  const layerObjects = new Map();
  const dirtyColor = new THREE.Color(0xe9bd78);
  const cleanColor = new THREE.Color(0x9be4c7);
  const waterDirtyColor = new THREE.Color(0xb58b55);
  const waterCleanColor = new THREE.Color(0x64d6d1);
  const barrel = new THREE.Group();
  const content = new THREE.Group();
  const profile = [new THREE.Vector2(2.03, 0), new THREE.Vector2(2.16, 0.1), new THREE.Vector2(2.23, 0.35), new THREE.Vector2(2.23, 6.12), new THREE.Vector2(2.18, 6.38), new THREE.Vector2(2.04, 6.5)];
  const glassMaterialOptions = { color: 0x9ad6ce, transparent: true, opacity: 0.17, roughness: 0.08, metalness: 0.05, side: THREE.DoubleSide, depthWrite: false };
  const waterMaterialOptions = { color: 0xb8915c, transparent: true, opacity: 0.57, roughness: 0.3, side: THREE.DoubleSide };
  let xrayEnabled = false;
  let qualityMode = 'high';
  let glassMaterial;

  const createGlassMaterial = (light, previous) => {
    const options = { ...glassMaterialOptions, color: previous?.color?.clone() || glassMaterialOptions.color, opacity: previous?.opacity ?? glassMaterialOptions.opacity };
    return light ? new THREE.MeshStandardMaterial(options) : new THREE.MeshPhysicalMaterial({ ...options, transmission: 0.15 });
  };
  const createWaterMaterial = (light, previous) => {
    const options = { ...waterMaterialOptions, color: previous?.color?.clone() || waterMaterialOptions.color, opacity: previous?.opacity ?? waterMaterialOptions.opacity };
    return light ? new THREE.MeshStandardMaterial(options) : new THREE.MeshPhysicalMaterial({ ...options, transmission: 0.1 });
  };
  const replaceMaterial = (mesh, createMaterial) => {
    const previous = mesh.material;
    const next = createMaterial(previous);
    mesh.material = next;
    previous.dispose();
  };
  const replaceGeometry = (mesh, createGeometry) => {
    const previous = mesh.geometry;
    mesh.geometry = createGeometry();
    previous.dispose();
  };

  scene.add(content);
  content.add(barrel);
  glassMaterial = createGlassMaterial(false);
  const segmentMeshes = [];
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), glassMaterial);
  segmentMeshes.push(body);
  body.position.y = 0.3;
  body.userData = { type: 'bucket' };
  barrel.add(body);
  addInteractive(body);

  layers.forEach((layer, index) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.02, 0.72, 64), new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.78, transparent: true, opacity: 0.94 }));
    segmentMeshes.push(mesh);
    mesh.position.y = 0.85 + index * 0.88;
    mesh.userData = { type: 'filter', id: layer.id, createGeometry: (segments) => new THREE.CylinderGeometry(2.02, 2.02, 0.72, segments) };
    barrel.add(mesh);
    layerObjects.set(layer.id, { mesh, baseY: mesh.position.y });
    addInteractive(mesh);

    if (index < layers.length - 1) {
      const separator = new THREE.Mesh(new THREE.CylinderGeometry(2.03, 2.03, 0.025, 64), new THREE.MeshBasicMaterial({ color: 0xc7eeee, transparent: true, opacity: 0.5 }));
      separator.userData.createGeometry = (segments) => new THREE.CylinderGeometry(2.03, 2.03, 0.025, segments);
      segmentMeshes.push(separator);
      separator.position.y = mesh.position.y + 0.38;
      barrel.add(separator);
    }
  });

  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 1.8, 48), createWaterMaterial(false));
  water.userData.createGeometry = (segments) => new THREE.CylinderGeometry(1.85, 1.85, 1.8, segments);
  water.position.y = 5.5;
  barrel.add(water);
  const particles = createParticles(barrel, { height: 5.7, radius: 1.55 });
  const bucket = new THREE.Group();
  bucket.position.set(3.7, 6.25, 0.3);
  bucket.rotation.z = -0.12;
  const bucketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.48, 1.05, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fd6c5, transparent: true, opacity: 0.52 }));
  bucketBody.userData = { type: 'bucket', createGeometry: (segments) => new THREE.CylinderGeometry(0.58, 0.48, 1.05, segments, 1, true) };
  bucket.add(bucketBody);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 10, 32), new THREE.MeshStandardMaterial({ color: 0xb3ead7 }));
  rim.position.y = 0.53;
  bucket.add(rim);
  content.add(bucket);
  addInteractive(bucketBody);

  return {
    boundsObject: content,
    particles,
    update(simulation, state) {
      water.material.color.copy(waterDirtyColor).lerp(waterCleanColor, qualityScore(simulation.current, INITIAL) / 100);
      water.position.y = lerp(5.55, 2.3, state.progress);
      particles.material.color.copy(dirtyColor).lerp(cleanColor, state.progress);
      let layerState = 0;
      for (let index = 0; index < layers.length; index += 1) if (layers[index].enabled !== false) layerState |= 1 << index;
      if (this.lastXray !== state.xray || this.lastLayerState !== layerState) {
        layerObjects.forEach(({ mesh, baseY }, id) => {
          const index = layers.findIndex((layer) => layer.id === id);
          const layer = layers[index];
          mesh.visible = layer?.enabled !== false;
          mesh.position.y = baseY + (state.xray ? index * 0.08 : 0);
          mesh.material.opacity = state.xray ? 0.75 : 0.94;
        });
        this.lastXray = state.xray;
        this.lastLayerState = layerState;
      }
    },
    select(id) {
      layerObjects.forEach(({ mesh }, layerId) => {
        const selected = id === layerId;
        mesh.material.emissive?.set(selected ? 0x72d6b5 : 0x000000);
        mesh.material.emissiveIntensity = selected ? 0.55 : 0;
      });
    },
    setXray(enabled) {
      xrayEnabled = enabled;
      glassMaterial.opacity = enabled ? 0.045 : 0.17;
      if (glassMaterial.transmission !== undefined) glassMaterial.transmission = enabled ? 0.35 : 0.15;
    },
    setQuality(mode) {
      const light = mode === 'light';
      if (qualityMode === (light ? 'light' : 'high')) return;
      qualityMode = light ? 'light' : 'high';
      replaceMaterial(body, (previous) => createGlassMaterial(light, previous));
      replaceMaterial(water, (previous) => createWaterMaterial(light, previous));
      glassMaterial = body.material;
      glassMaterial.opacity = xrayEnabled ? 0.045 : 0.17;
      if (glassMaterial.transmission !== undefined) glassMaterial.transmission = xrayEnabled ? 0.35 : 0.15;
      const segments = light ? 32 : 64;
      segmentMeshes.forEach((mesh) => {
        if (mesh === body) replaceGeometry(mesh, () => new THREE.LatheGeometry(profile, segments));
        else replaceGeometry(mesh, () => mesh.userData.createGeometry(segments));
      });
      replaceGeometry(water, () => water.userData.createGeometry(light ? 24 : 48));
      replaceGeometry(bucketBody, () => bucketBody.userData.createGeometry(light ? 16 : 32));
      particles.geometry.setDrawRange(0, mode === 'light' ? particles.userData.offsets.length / 2 : particles.userData.offsets.length);
    },
  };
}

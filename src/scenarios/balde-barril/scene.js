import * as THREE from 'three';
import { createParticles } from '../../core/particles.js';
import { lerp, qualityScore } from '../../core/metrics.js';
import { INITIAL, LAYERS } from './layers.js';

export function createBaldeBarrilObjects({ scene, addInteractive }) {
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9ad6ce, transparent: true, opacity: 0.17, roughness: 0.08, metalness: 0.05, transmission: 0.15, side: THREE.DoubleSide, depthWrite: false });
  const layerObjects = new Map();
  const barrel = new THREE.Group();
  const profile = [new THREE.Vector2(2.03, 0), new THREE.Vector2(2.16, 0.1), new THREE.Vector2(2.23, 0.35), new THREE.Vector2(2.23, 6.12), new THREE.Vector2(2.18, 6.38), new THREE.Vector2(2.04, 6.5)];

  scene.add(barrel);
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), glassMaterial);
  body.position.y = 0.3;
  body.userData = { type: 'bucket' };
  barrel.add(body);
  addInteractive(body);

  LAYERS.forEach((layer, index) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.02, 0.72, 64), new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.78, transparent: true, opacity: 0.94 }));
    mesh.position.y = 0.85 + index * 0.88;
    mesh.userData = { type: 'filter', id: layer.id };
    barrel.add(mesh);
    layerObjects.set(layer.id, { mesh, baseY: mesh.position.y });
    addInteractive(mesh);

    if (index < LAYERS.length - 1) {
      const separator = new THREE.Mesh(new THREE.CylinderGeometry(2.03, 2.03, 0.025, 64), new THREE.MeshBasicMaterial({ color: 0xc7eeee, transparent: true, opacity: 0.5 }));
      separator.position.y = mesh.position.y + 0.38;
      barrel.add(separator);
    }
  });

  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 1.8, 48), new THREE.MeshPhysicalMaterial({ color: 0xb8915c, transparent: true, opacity: 0.57, roughness: 0.16, transmission: 0.22, side: THREE.DoubleSide }));
  water.position.y = 5.5;
  barrel.add(water);
  const particles = createParticles(barrel, { height: 5.7, radius: 1.55 });
  const bucket = new THREE.Group();
  bucket.position.set(3.7, 6.25, 0.3);
  bucket.rotation.z = -0.12;
  const bucketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.48, 1.05, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fd6c5, transparent: true, opacity: 0.52 }));
  bucketBody.userData = { type: 'bucket' };
  bucket.add(bucketBody);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 10, 32), new THREE.MeshStandardMaterial({ color: 0xb3ead7 }));
  rim.position.y = 0.53;
  bucket.add(rim);
  scene.add(bucket);
  addInteractive(bucketBody);

  return {
    particles,
    update(simulation, state) {
      water.material.color.copy(new THREE.Color(0xb58b55).lerp(new THREE.Color(0x64d6d1), qualityScore(simulation.current, INITIAL) / 100));
      water.position.y = lerp(5.55, 2.3, state.progress);
      particles.material.color.copy(new THREE.Color(0xe9bd78).lerp(new THREE.Color(0x9be4c7), state.progress));
      layerObjects.forEach(({ mesh, baseY }, id) => {
        const index = LAYERS.findIndex((layer) => layer.id === id);
        const layer = LAYERS[index];
        mesh.visible = layer?.enabled !== false;
        mesh.position.y = baseY + (state.xray ? index * 0.08 : 0);
        mesh.material.opacity = state.xray ? 0.75 : 0.94;
      });
      this.select(state.selected);
    },
    select(id) {
      layerObjects.forEach(({ mesh }, layerId) => {
        const selected = id === layerId;
        mesh.material.emissive?.set(selected ? 0x72d6b5 : 0x000000);
        mesh.material.emissiveIntensity = selected ? 0.55 : 0;
      });
    },
    setXray(enabled) {
      glassMaterial.opacity = enabled ? 0.045 : 0.17;
      glassMaterial.transmission = enabled ? 0.35 : 0.15;
    },
  };
}

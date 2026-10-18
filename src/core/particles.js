import * as THREE from 'three';

let particleProgramId = 0;

export function createParticles(parent, options = {}) {
  const count = options.count || 120;
  const height = options.height || 5.7;
  const radius = options.radius || 1.55;
  const positions = new Float32Array(count * 3);
  const offsets = [];

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const particleRadius = Math.random() * radius;

    positions[index * 3] = Math.cos(angle) * particleRadius;
    positions[index * 3 + 1] = Math.random() * height + 0.6;
    positions[index * 3 + 2] = Math.sin(angle) * particleRadius;
    offsets.push(Math.random() * height);
  }

  const offsetAttribute = new Float32Array(count);
  for (let index = 0; index < count; index += 1) offsetAttribute[index] = offsets[index];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('offset', new THREE.BufferAttribute(offsetAttribute, 1));

  const flowUniforms = {
    time: { value: 0 },
    flowProgress: { value: 0 },
    flowHeight: { value: height },
  };
  const material = new THREE.PointsMaterial({
    color: options.color || 0xf0c27f,
    size: options.size || 0.055,
    transparent: true,
    opacity: options.opacity || 0.8,
    sizeAttenuation: true,
  });
  const flowKey = `flow-particles-${particleProgramId += 1}`;
  material.customProgramCacheKey = () => flowKey;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.time = flowUniforms.time;
    shader.uniforms.flowProgress = flowUniforms.flowProgress;
    shader.uniforms.flowHeight = flowUniforms.flowHeight;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float offset;\nuniform float time;\nuniform float flowProgress;\nuniform float flowHeight;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.y = 0.5 + mod(offset + time * 0.35 + flowProgress * flowHeight, flowHeight);
        transformed.x += sin(time * 0.7 + offset) * 0.012;
        transformed.z += cos(time * 0.6 + offset) * 0.012;`);
  };

  const points = new THREE.Points(geometry, material);

  points.userData.offsets = offsets;
  points.userData.height = height;
  points.userData.flowUniforms = flowUniforms;
  parent.add(points);

  return points;
}

export function updateParticles(points, time, progress) {
  const uniforms = points?.userData.flowUniforms;
  if (!uniforms) return;
  uniforms.time.value = time;
  uniforms.flowProgress.value = progress;
}

import * as THREE from 'three';

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

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: options.color || 0xf0c27f,
      size: options.size || 0.055,
      transparent: true,
      opacity: options.opacity || 0.8,
      sizeAttenuation: true,
    }),
  );

  points.userData.offsets = offsets;
  points.userData.height = height;
  parent.add(points);

  return points;
}

export function updateParticles(points, time, progress) {
  if (!points) {
    return;
  }

  const positions = points.geometry.attributes.position.array;
  const height = points.userData.height;

  points.userData.offsets.forEach((offset, index) => {
    const x = positions[index * 3];
    const z = positions[index * 3 + 2];

    positions[index * 3 + 1] = 0.5 + ((offset + time * 0.35 + progress * height) % height);
    positions[index * 3] = x + Math.sin(time * 0.7 + index) * 0.012;
    positions[index * 3 + 2] = z + Math.cos(time * 0.6 + index) * 0.012;
  });

  points.geometry.attributes.position.needsUpdate = true;
}

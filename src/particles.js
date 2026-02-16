import * as THREE from 'three';
import { scene } from './engine.js';

const PARTICLE_COUNT = 50;
const particles = [];
let pointsMesh = null;
let playerRef = null;

export function initParticles(playerGroup) {
  playerRef = playerGroup;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  const goldColor = new THREE.Color(0xffd700);
  const pinkColor = new THREE.Color(0xff69b4);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -10; // hide below ground initially
    positions[i * 3 + 2] = 0;

    const c = Math.random() > 0.5 ? goldColor : pinkColor;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    particles.push({
      life: 0,
      maxLife: 0.5 + Math.random() * 0.5,
      vx: 0,
      vy: 0,
      vz: 0,
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  pointsMesh = new THREE.Points(geometry, material);
  scene.add(pointsMesh);
}

let spawnIndex = 0;

export function updateParticles(dt) {
  if (!pointsMesh || !playerRef) return;

  const positions = pointsMesh.geometry.attributes.position.array;

  // Spawn a few particles at player position each frame
  for (let s = 0; s < 2; s++) {
    const i = spawnIndex % PARTICLE_COUNT;
    const p = particles[i];

    positions[i * 3] = playerRef.position.x + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = playerRef.position.y + 0.5 + Math.random() * 0.5;
    positions[i * 3 + 2] = playerRef.position.z + (Math.random() - 0.5) * 0.5;

    p.life = 0;
    p.maxLife = 0.4 + Math.random() * 0.6;
    p.vx = (Math.random() - 0.5) * 0.5;
    p.vy = 0.5 + Math.random() * 1;
    p.vz = (Math.random() - 0.5) * 0.5;

    spawnIndex++;
  }

  // Update all particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = particles[i];
    p.life += dt;

    if (p.life < p.maxLife) {
      positions[i * 3] += p.vx * dt;
      positions[i * 3 + 1] += p.vy * dt;
      positions[i * 3 + 2] += p.vz * dt;

      // Slow down
      p.vy *= 0.98;
    } else {
      // Hide dead particles
      positions[i * 3 + 1] = -10;
    }
  }

  pointsMesh.geometry.attributes.position.needsUpdate = true;
}

/**
 * Burst of celebration particles at a position.
 */
export function celebrationBurst(x, y, z) {
  if (!pointsMesh) return;

  const positions = pointsMesh.geometry.attributes.position.array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = particles[i];
    positions[i * 3] = x + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = y + Math.random() * 0.5;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

    p.life = 0;
    p.maxLife = 0.8 + Math.random() * 1;
    p.vx = (Math.random() - 0.5) * 3;
    p.vy = 2 + Math.random() * 3;
    p.vz = (Math.random() - 0.5) * 3;
  }

  pointsMesh.geometry.attributes.position.needsUpdate = true;
}

import * as THREE from 'three';
import { scene, loadModel } from './engine.js';
import { gameState } from './save.js';

// Set of npcIds currently following the player (populated by quests.js)
export const escortFollowing = new Set();

// NPC definitions
export const NPC_DEFS = {
  bunny: {
    name: 'Bunny 🐰',
    area: 'meadow',
    pos: [3, 0, -1],
    color: 0xffffff,
    bodyColor: 0xf5f5f5,
    questId: 'lost-carrot',
    modelPath: 'animals/bunny.glb',
  },
  unicorn: {
    name: 'Unicorn 🦄',
    area: 'glen',
    pos: [2, 0, 1],
    color: 0xffffff,
    bodyColor: 0xf0e6ff,
    questId: 'horn-gem',
  },
  bird: {
    name: 'Bird 🐦',
    area: 'glade',
    pos: [4, 0, 2],
    color: 0x4169e1,
    bodyColor: 0x6495ed,
    questId: 'build-nest',
    modelPath: 'animals/bird.glb',
  },
  frog: {
    name: 'Frog 🐸',
    area: 'creek',
    pos: [-4, 0, 2],
    color: 0x228b22,
    bodyColor: 0x32cd32,
    questId: 'frog-crown',
    modelPath: 'animals/frog.glb',
  },
  fox: {
    name: 'Fox Cub 🦊',
    area: 'hollow',
    pos: [-3, 0, 1],
    color: 0xff8c00,
    bodyColor: 0xff6600,
    questId: 'fox-home',
  },
  deer: {
    name: 'Baby Deer 🦌',
    area: 'bushes',
    pos: [1, 0, 2],
    color: 0xd2691e,
    bodyColor: 0xcd853f,
    questId: 'find-mom',
  },
  dragon: {
    name: 'Spark 🐉',
    area: null, // roaming -- appears contextually
    pos: [0, 0, 0],
    color: 0x9370db,
    bodyColor: 0x8a2be2,
    questId: null,
  },
};

// Currently loaded NPC meshes in the scene
let loadedNPCs = new Map();

/**
 * Create NPC mesh — loads GLB if modelPath exists, otherwise creates placeholder.
 */
async function createNPCMesh(def) {
  let group;

  if (def.modelPath) {
    // Load real GLB model
    const gltf = await loadModel(def.modelPath);
    group = gltf.scene.clone();
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  } else {
    // Placeholder primitive
    group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 8);
  const bodyMat = new THREE.MeshLambertMaterial({ color: def.bodyColor });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.scale.set(1, 0.8, 0.7);
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.3, 12, 8);
  const headMat = new THREE.MeshLambertMaterial({ color: def.color });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.1;
  group.add(head);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.1, 1.15, 0.25);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.1, 1.15, 0.25);
  group.add(eyeR);

  // Special features per NPC type
  if (def === NPC_DEFS.bunny) {
    // Ears
    const earGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6);
    const earMat = new THREE.MeshLambertMaterial({ color: 0xffc0cb });
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.12, 1.55, 0);
    earL.rotation.z = 0.15;
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.12, 1.55, 0);
    earR.rotation.z = -0.15;
    group.add(earR);
  }

  if (def === NPC_DEFS.unicorn) {
    // Horn
    const hornGeo = new THREE.ConeGeometry(0.06, 0.5, 6);
    const hornMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(0, 1.55, 0.1);
    group.add(horn);
    // Make body bigger
    body.scale.set(1.3, 1, 1.5);
    head.position.y = 1.3;
    head.position.z = 0.5;
  }

  if (def === NPC_DEFS.fox) {
    // Tail
    const tailGeo = new THREE.ConeGeometry(0.15, 0.6, 6);
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.4, -0.5);
    tail.rotation.x = -0.5;
    group.add(tail);
    // White tip
    const tipGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const tipMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0, 0.15, -0.7);
    group.add(tip);
  }

  if (def === NPC_DEFS.bird) {
    // Wings
    const wingGeo = new THREE.PlaneGeometry(0.4, 0.3);
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x4169e1, side: THREE.DoubleSide });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.45, 0.6, 0);
    wingL.rotation.y = 0.3;
    group.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0.45, 0.6, 0);
    wingR.rotation.y = -0.3;
    group.add(wingR);
    // Beak
    const beakGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 1.1, 0.35);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);
    // Smaller body
    body.scale.set(0.6, 0.6, 0.5);
    head.scale.set(0.8, 0.8, 0.8);
    head.position.y = 0.9;
  }

  if (def === NPC_DEFS.frog) {
    // Big eyes
    eyeL.scale.set(1.5, 1.5, 1.5);
    eyeR.scale.set(1.5, 1.5, 1.5);
    eyeL.position.set(-0.15, 1.25, 0.2);
    eyeR.position.set(0.15, 1.25, 0.2);
    // Wider body
    body.scale.set(1.1, 0.6, 0.8);
    head.position.y = 0.9;
  }

  if (def === NPC_DEFS.dragon) {
    // Wings (larger)
    const dwGeo = new THREE.PlaneGeometry(0.8, 0.6);
    const dwMat = new THREE.MeshLambertMaterial({ color: 0x9370db, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const dwL = new THREE.Mesh(dwGeo, dwMat);
    dwL.position.set(-0.6, 0.8, -0.1);
    dwL.rotation.set(0, -0.3, 0.2);
    group.add(dwL);
    const dwR = new THREE.Mesh(dwGeo, dwMat);
    dwR.position.set(0.6, 0.8, -0.1);
    dwR.rotation.set(0, 0.3, -0.2);
    group.add(dwR);
    // Snout
    const snoutGeo = new THREE.ConeGeometry(0.08, 0.2, 6);
    const snoutMat = new THREE.MeshLambertMaterial({ color: 0x8a2be2 });
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.position.set(0, 1.1, 0.35);
    snout.rotation.x = Math.PI / 2;
    group.add(snout);
  }
  } // End placeholder creation

  // Quest indicator (floating ! above head) -- only if quest is available
  const indicatorGeo = new THREE.SphereGeometry(0.12, 8, 6);
  const indicatorMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5 });
  const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
  indicator.position.y = 1.8;
  indicator.name = 'quest-indicator';
  indicator.visible = false;
  group.add(indicator);

  group.position.set(...def.pos);
  group.castShadow = true;
  group.name = 'npc';

  return group;
}

/**
 * Load NPCs for the given area into the scene.
 * Returns array of NPC meshes for raycasting.
 */
export async function loadNPCsForArea(areaId) {
  // Clear previous
  for (const [, mesh] of loadedNPCs) {
    scene.remove(mesh);
  }
  loadedNPCs.clear();

  const npcMeshes = [];

  // Load all NPCs in parallel
  const npcPromises = [];
  for (const [npcId, def] of Object.entries(NPC_DEFS)) {
    if (def.area !== areaId) continue;
    npcPromises.push({ npcId, def, meshPromise: createNPCMesh(def) });
  }

  for (const { npcId, def, meshPromise } of npcPromises) {
    const mesh = await meshPromise;
    mesh.userData.npcId = npcId;
    mesh.userData.interactive = true;

    // Show quest indicator if quest is not started or active
    if (def.questId) {
      const questState = gameState.quests[def.questId];
      const indicator = mesh.getObjectByName('quest-indicator');
      if (indicator) {
        indicator.visible = questState === 'notStarted' || questState === 'active';
      }
    }

    scene.add(mesh);
    loadedNPCs.set(npcId, mesh);
    npcMeshes.push(mesh);
  }

  return npcMeshes;
}

/**
 * Check if dragon should appear in the current area.
 * Dragon appears contextually: in cave to help with light, or at house to celebrate.
 */
export function shouldDragonAppear(areaId) {
  // Dragon helps in cave when horn-gem quest is active
  if (areaId === 'cave' && gameState.quests['horn-gem'] === 'active') {
    return true;
  }
  // Dragon visits house after completing a quest (celebration)
  if (areaId === 'house') {
    const completedCount = Object.values(gameState.quests).filter((s) => s === 'complete').length;
    if (completedCount > 0 && completedCount < 6) return true;
  }
  return false;
}

export async function spawnDragon(areaId) {
  const def = NPC_DEFS.dragon;
  const mesh = await createNPCMesh(def);
  mesh.userData.npcId = 'dragon';
  mesh.userData.interactive = true;

  // Position dragon based on area
  if (areaId === 'cave') {
    mesh.position.set(-2, 1.5, 0);
  } else if (areaId === 'house') {
    mesh.position.set(-3, 1, 1);
  } else {
    mesh.position.set(4, 1, -2);
  }

  scene.add(mesh);
  loadedNPCs.set('dragon', mesh);
  return mesh;
}

/**
 * Update NPC animations and escort following.
 * @param {number} dt
 * @param {THREE.Vector3} playerPos
 */
export function updateNPCs(dt, playerPos) {
  const t = Date.now() * 0.002;
  for (const [npcId, mesh] of loadedNPCs) {
    // Escort: follow the player at a short distance
    if (escortFollowing.has(npcId) && playerPos) {
      const dx = playerPos.x - mesh.position.x;
      const dz = playerPos.z - mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const FOLLOW_GAP = 1.2; // stay this far behind Lisa
      if (dist > FOLLOW_GAP + 0.1) {
        const speed = 4 * dt;
        const ratio = (dist - FOLLOW_GAP) / dist;
        mesh.position.x += dx * ratio * Math.min(speed / dist * dist, 1);
        mesh.position.z += dz * ratio * Math.min(speed / dist * dist, 1);
        mesh.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Gentle bob
    const baseY = mesh.userData.baseY ?? mesh.position.y;
    if (mesh.userData.baseY === undefined) mesh.userData.baseY = baseY;
    mesh.position.y = baseY + Math.sin(t + npcId.length) * 0.05;

    // Quest indicator pulse
    const indicator = mesh.getObjectByName('quest-indicator');
    if (indicator && indicator.visible) {
      indicator.position.y = 1.8 + Math.sin(t * 2) * 0.1;
    }
  }
}

export function getLoadedNPCs() {
  return loadedNPCs;
}

export function getNPCMeshes() {
  return Array.from(loadedNPCs.values());
}

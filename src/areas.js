import * as THREE from 'three';
import { scene, loadModel } from './engine.js';
import { AREAS, OPPOSITE_DIR, DIR_ARROWS, ENTRY_POSITIONS } from './constants.js';
import { gameState, saveGame } from './save.js';
import { setPlayerPosition } from './player.js';
import { handleHouseInteraction } from './house.js';
import { loadNPCsForArea, shouldDragonAppear, spawnDragon, updateNPCs, getNPCMeshes } from './npcs.js';
import { spawnQuestItems, handleMailbox, checkEscortArrival, handleNPCInteraction, getSpawnedItems, pickUpItem } from './quests.js';

// Current area's interactive objects and ground
let groundMesh = null;
let areaObjects = [];
let currentAreaId = null;
let fromDirection = null;

// Refs to DOM elements
const areaLabel = document.getElementById('area-label');
const navArrows = document.getElementById('nav-arrows');

// Ground textures
const textureLoader = new THREE.TextureLoader();
const groundTextures = {};

function getGroundColor(type) {
  const colors = {
    grass: 0x7ec850,
    dirt: 0xb8915a,
    wood: 0xc4956a,
  };
  return colors[type] || 0x7ec850;
}

// Pre-defined area layouts: each area has prop placements
// Since we don't have models yet, we'll use colored primitives as placeholders
const AREA_LAYOUTS = {
  house: {
    props: [
      // Cottage placeholder
      { type: 'box', color: 0xd4a574, pos: [0, 1.5, -2], scale: [3, 3, 3], name: 'cottage' },
      // Roof
      { type: 'cone', color: 0xc0392b, pos: [0, 3.5, -2], scale: [2.5, 1.5, 2.5], name: 'roof' },
      // Mailbox
      { type: 'box', color: 0x5d4e37, pos: [3, 0.6, 0], scale: [0.4, 1.2, 0.3], name: 'mailbox', interactive: true },
      // Mailbox flag
      { type: 'box', color: 0xe74c3c, pos: [3.3, 1, 0], scale: [0.3, 0.15, 0.05], name: 'mailbox-flag' },
      // Door
      { type: 'box', color: 0x8b5e3c, pos: [0, 0.9, -0.45], scale: [0.8, 1.8, 0.1], name: 'door', interactive: true },
      // Trees
      { type: 'cone', color: 0x2d8a4e, pos: [-5, 2, -4], scale: [1.5, 4, 1.5] },
      { type: 'cylinder', color: 0x8b5e3c, pos: [-5, 0.5, -4], scale: [0.3, 1, 0.3] },
      { type: 'cone', color: 0x2d8a4e, pos: [6, 2.5, -3], scale: [1.8, 5, 1.8] },
      { type: 'cylinder', color: 0x8b5e3c, pos: [6, 0.5, -3], scale: [0.3, 1, 0.3] },
      // Flowers
      { type: 'sphere', color: 0xff69b4, pos: [-2, 0.3, 2], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0xffd700, pos: [-1.5, 0.3, 2.3], scale: [0.25, 0.25, 0.25] },
      { type: 'sphere', color: 0xff69b4, pos: [4, 0.3, 2], scale: [0.3, 0.3, 0.3] },
    ],
  },
  houseInside: {
    props: [
      // Bed
      { type: 'box', color: 0xdda0dd, pos: [-4, 0.5, -3], scale: [2, 1, 1.5], name: 'bed', interactive: true },
      // Pillow
      { type: 'box', color: 0xfff0f5, pos: [-4.5, 0.85, -3], scale: [0.6, 0.3, 0.5] },
      // Stove
      { type: 'box', color: 0x888888, pos: [4, 0.7, -3], scale: [1.5, 1.4, 1], name: 'stove', interactive: true },
      // Stove top detail
      { type: 'cylinder', color: 0x333333, pos: [3.6, 1.45, -3], scale: [0.3, 0.05, 0.3] },
      { type: 'cylinder', color: 0x333333, pos: [4.4, 1.45, -3], scale: [0.3, 0.05, 0.3] },
      // Table
      { type: 'box', color: 0xdeb887, pos: [0, 0.5, 0], scale: [2, 1, 1.2], name: 'table' },
      // Toothbrush area (sink)
      { type: 'box', color: 0xb0c4de, pos: [4, 0.6, 2], scale: [1, 1.2, 0.8], name: 'toothbrush', interactive: true },
      // Toothbrush
      { type: 'cylinder', color: 0x00bfff, pos: [4.3, 1.3, 2], scale: [0.05, 0.4, 0.05] },
      // Door (exit)
      { type: 'box', color: 0x8b5e3c, pos: [0, 0.9, 4.5], scale: [1, 1.8, 0.1], name: 'door-exit', interactive: true },
      // Walls (simple)
      { type: 'box', color: 0xfff8dc, pos: [0, 1.5, -4.5], scale: [12, 3, 0.2] },
      { type: 'box', color: 0xfff8dc, pos: [-6, 1.5, 0], scale: [0.2, 3, 9] },
      { type: 'box', color: 0xfff8dc, pos: [6, 1.5, 0], scale: [0.2, 3, 9] },
      // Floor rug
      { type: 'box', color: 0xda70d6, pos: [0, 0.02, 0], scale: [4, 0.04, 3] },
    ],
  },
  glade: {
    props: [
      // Big central tree
      { type: 'cone', color: 0x228b22, pos: [0, 3, -3], scale: [3, 6, 3] },
      { type: 'cylinder', color: 0x8b4513, pos: [0, 0.8, -3], scale: [0.5, 1.6, 0.5] },
      // Smaller trees
      { type: 'cone', color: 0x2d8a4e, pos: [-6, 2, 2], scale: [1.5, 4, 1.5] },
      { type: 'cylinder', color: 0x8b5e3c, pos: [-6, 0.5, 2], scale: [0.3, 1, 0.3] },
      { type: 'cone', color: 0x3cb371, pos: [5, 2.5, -1], scale: [2, 5, 2] },
      { type: 'cylinder', color: 0x8b5e3c, pos: [5, 0.5, -1], scale: [0.35, 1, 0.35] },
      // Flowers
      { type: 'sphere', color: 0xff69b4, pos: [-3, 0.25, 1], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0xffd700, pos: [-2, 0.25, 0.5], scale: [0.25, 0.25, 0.25] },
      { type: 'sphere', color: 0xff6347, pos: [3, 0.25, 3], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0x9370db, pos: [2, 0.25, 2], scale: [0.28, 0.28, 0.28] },
      // Mushrooms
      { type: 'sphere', color: 0xff4444, pos: [-1, 0.3, 3], scale: [0.4, 0.25, 0.4] },
      { type: 'cylinder', color: 0xfaf0e6, pos: [-1, 0.15, 3], scale: [0.15, 0.3, 0.15] },
      // Rocks
      { type: 'sphere', color: 0x808080, pos: [6, 0.3, 4], scale: [0.6, 0.4, 0.5] },
    ],
  },
  meadow: {
    props: [
      // Giant mushrooms
      { type: 'sphere', color: 0xff4444, pos: [0, 1.8, 0], scale: [1.8, 1, 1.8] },
      { type: 'cylinder', color: 0xfaf0e6, pos: [0, 0.7, 0], scale: [0.5, 1.4, 0.5] },
      { type: 'sphere', color: 0xff6600, pos: [-4, 1.2, 2], scale: [1.2, 0.7, 1.2] },
      { type: 'cylinder', color: 0xfaf0e6, pos: [-4, 0.4, 2], scale: [0.35, 0.8, 0.35] },
      { type: 'sphere', color: 0xff4444, pos: [5, 0.9, -2], scale: [0.9, 0.5, 0.9] },
      { type: 'cylinder', color: 0xfaf0e6, pos: [5, 0.35, -2], scale: [0.25, 0.7, 0.25] },
      // Trees at edges
      { type: 'cone', color: 0x2d8a4e, pos: [-7, 2.5, -4], scale: [2, 5, 2] },
      { type: 'cylinder', color: 0x8b5e3c, pos: [-7, 0.5, -4], scale: [0.35, 1, 0.35] },
      // Flowers scattered
      { type: 'sphere', color: 0xffd700, pos: [2, 0.2, 3], scale: [0.25, 0.25, 0.25] },
      { type: 'sphere', color: 0xff69b4, pos: [3, 0.2, 2], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0x9370db, pos: [-2, 0.2, -1], scale: [0.25, 0.25, 0.25] },
    ],
  },
  glen: {
    props: [
      // Sparkling crystals
      { type: 'cone', color: 0xe0b0ff, pos: [-3, 1, -2], scale: [0.5, 2, 0.5] },
      { type: 'cone', color: 0xdda0dd, pos: [-2.5, 0.8, -1.5], scale: [0.4, 1.6, 0.4] },
      { type: 'cone', color: 0xee82ee, pos: [4, 1.2, -3], scale: [0.6, 2.4, 0.6] },
      // Flowers (lots)
      { type: 'sphere', color: 0xffc0cb, pos: [1, 0.2, 2], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0xffc0cb, pos: [2, 0.2, 1], scale: [0.25, 0.25, 0.25] },
      { type: 'sphere', color: 0xffc0cb, pos: [-1, 0.2, 3], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0xffd700, pos: [0, 0.2, 1], scale: [0.28, 0.28, 0.28] },
      // Trees
      { type: 'cone', color: 0x98fb98, pos: [-6, 3, 0], scale: [2, 6, 2] },
      { type: 'cylinder', color: 0xdeb887, pos: [-6, 0.6, 0], scale: [0.4, 1.2, 0.4] },
      // Rainbow arch (simplified as colored bars)
      { type: 'torus', color: 0xff0000, pos: [0, 3, -5], scale: [3, 3, 0.2], rotation: [0, 0, 0] },
    ],
  },
  hollow: {
    props: [
      // Massive old oak
      { type: 'cylinder', color: 0x654321, pos: [0, 2.5, -2], scale: [2, 5, 2] },
      { type: 'sphere', color: 0x2e8b57, pos: [0, 5.5, -2], scale: [4, 3, 4] },
      // Hollow opening
      { type: 'sphere', color: 0x1a1a2e, pos: [0, 1, -0.5], scale: [0.8, 1, 0.5] },
      // Fallen log
      { type: 'cylinder', color: 0x8b4513, pos: [4, 0.3, 2], scale: [0.4, 3, 0.4], rotation: [0, 0, Math.PI / 2] },
      // Mushrooms
      { type: 'sphere', color: 0xffa500, pos: [-3, 0.25, 1], scale: [0.35, 0.2, 0.35] },
      { type: 'cylinder', color: 0xfaf0e6, pos: [-3, 0.1, 1], scale: [0.12, 0.2, 0.12] },
      // Rocks
      { type: 'sphere', color: 0x696969, pos: [5, 0.4, -3], scale: [0.8, 0.5, 0.7] },
      { type: 'sphere', color: 0x778899, pos: [-5, 0.3, -1], scale: [0.5, 0.35, 0.45] },
    ],
  },
  cave: {
    props: [
      // Cave entrance/walls
      { type: 'box', color: 0x4a4a5a, pos: [0, 2, -4.5], scale: [12, 4, 1] },
      { type: 'box', color: 0x4a4a5a, pos: [-6, 2, 0], scale: [1, 4, 9] },
      { type: 'box', color: 0x4a4a5a, pos: [6, 2, 0], scale: [1, 4, 9] },
      // Crystals
      { type: 'cone', color: 0x00ffff, pos: [-4, 1.5, -3], scale: [0.4, 3, 0.4] },
      { type: 'cone', color: 0x7fffd4, pos: [3, 1, -2], scale: [0.3, 2, 0.3] },
      { type: 'cone', color: 0x40e0d0, pos: [4.5, 0.8, -1], scale: [0.35, 1.6, 0.35] },
      // Glowing spots (lighter colored spheres)
      { type: 'sphere', color: 0x00ffff, pos: [-2, 0.3, 1], scale: [0.3, 0.3, 0.3] },
      { type: 'sphere', color: 0x7fffd4, pos: [1, 0.3, 2], scale: [0.25, 0.25, 0.25] },
      // Stalactites
      { type: 'cone', color: 0x5a5a6a, pos: [-3, 3.5, -3], scale: [0.3, 1, 0.3], rotation: [Math.PI, 0, 0] },
      { type: 'cone', color: 0x5a5a6a, pos: [2, 3.8, -2], scale: [0.25, 0.8, 0.25], rotation: [Math.PI, 0, 0] },
    ],
  },
  creek: {
    props: [
      // Water stream (blue flat box)
      { type: 'box', color: 0x4fc3f7, pos: [0, 0.05, 0], scale: [2, 0.1, 12] },
      // Stepping stones
      { type: 'cylinder', color: 0x808080, pos: [-0.2, 0.15, -2], scale: [0.5, 0.1, 0.5] },
      { type: 'cylinder', color: 0x808080, pos: [0.3, 0.15, 0], scale: [0.5, 0.1, 0.5] },
      { type: 'cylinder', color: 0x808080, pos: [-0.1, 0.15, 2], scale: [0.5, 0.1, 0.5] },
      // Trees on banks
      { type: 'cone', color: 0x228b22, pos: [-5, 2, -3], scale: [1.5, 4, 1.5] },
      { type: 'cylinder', color: 0x8b4513, pos: [-5, 0.5, -3], scale: [0.3, 1, 0.3] },
      { type: 'cone', color: 0x228b22, pos: [4, 2.5, 1], scale: [1.8, 5, 1.8] },
      { type: 'cylinder', color: 0x8b4513, pos: [4, 0.5, 1], scale: [0.35, 1, 0.35] },
      // Cattails
      { type: 'cylinder', color: 0x2e8b57, pos: [1.5, 0.6, 3], scale: [0.05, 1.2, 0.05] },
      { type: 'sphere', color: 0x8b4513, pos: [1.5, 1.2, 3], scale: [0.1, 0.2, 0.1] },
      // Rocks by creek
      { type: 'sphere', color: 0x696969, pos: [-2, 0.25, 1], scale: [0.5, 0.3, 0.4] },
      { type: 'sphere', color: 0x708090, pos: [2.5, 0.2, -1], scale: [0.4, 0.25, 0.35] },
    ],
  },
  bushes: {
    props: [
      // Berry bushes
      { type: 'sphere', color: 0x228b22, pos: [-3, 0.8, -2], scale: [1.5, 1.2, 1.5] },
      { type: 'sphere', color: 0xff0000, pos: [-2.5, 1.2, -2.2], scale: [0.15, 0.15, 0.15] },
      { type: 'sphere', color: 0xff0000, pos: [-3.3, 1, -1.8], scale: [0.12, 0.12, 0.12] },
      { type: 'sphere', color: 0x4169e1, pos: [-3.1, 0.9, -2.5], scale: [0.13, 0.13, 0.13] },
      { type: 'sphere', color: 0x228b22, pos: [3, 0.9, 1], scale: [1.8, 1.3, 1.8] },
      { type: 'sphere', color: 0x4169e1, pos: [3.5, 1.3, 0.8], scale: [0.15, 0.15, 0.15] },
      { type: 'sphere', color: 0x4169e1, pos: [2.7, 1.1, 1.3], scale: [0.12, 0.12, 0.12] },
      { type: 'sphere', color: 0xff0000, pos: [3.2, 1, 1.5], scale: [0.13, 0.13, 0.13] },
      // More bushes
      { type: 'sphere', color: 0x2e8b57, pos: [0, 0.7, -4], scale: [1.2, 1, 1.2] },
      // Trees
      { type: 'cone', color: 0x2d8a4e, pos: [-6, 2.5, 3], scale: [2, 5, 2] },
      { type: 'cylinder', color: 0x8b5e3c, pos: [-6, 0.5, 3], scale: [0.35, 1, 0.35] },
      // Flowers
      { type: 'sphere', color: 0xffd700, pos: [1, 0.2, 3], scale: [0.25, 0.25, 0.25] },
      { type: 'sphere', color: 0xff69b4, pos: [-1, 0.2, 4], scale: [0.3, 0.3, 0.3] },
    ],
  },
};

// Create a primitive mesh from a prop definition
function createPrimitive(prop) {
  let geometry;
  switch (prop.type) {
    case 'box':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 16, 12);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(0.5, 1, 12);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(1, 0.1, 8, 32, Math.PI);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }

  const material = new THREE.MeshLambertMaterial({ color: prop.color });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...prop.pos);
  if (prop.scale) mesh.scale.set(...prop.scale);
  if (prop.rotation) mesh.rotation.set(...prop.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (prop.name) mesh.name = prop.name;
  if (prop.interactive) mesh.userData.interactive = true;

  return mesh;
}

// Interactive objects in the current area
export let interactiveObjects = [];

export async function initAreas() {
  // Pre-warm: nothing heavy needed since we use primitives for now
}

export async function buildArea(areaId, entryDir) {
  currentAreaId = areaId;
  fromDirection = entryDir || null;

  // Clear scene: only remove top-level area props/NPCs, never touch the player (lisa) or particles
  const toRemove = [];
  scene.traverse((child) => {
    if (child.name === 'lisa') return; // skip player and all descendants
    if (child instanceof THREE.Points) return; // skip particle system
    if ((child.isMesh || child.isGroup) && child.parent === scene) {
      toRemove.push(child);
    }
  });
  toRemove.forEach((obj) => {
    scene.remove(obj);
    // Dispose geometry/materials only on leaf meshes to avoid double-dispose
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      }
    });
  });
  areaObjects = [];
  interactiveObjects = [];

  const areaDef = AREAS[areaId];

  // Ground plane
  const groundSize = areaId === 'houseInside' ? 12 : 20;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
  const groundColor = getGroundColor(areaDef.ground);
  const groundMat = new THREE.MeshLambertMaterial({ color: groundColor });
  groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  groundMesh.name = 'ground';
  scene.add(groundMesh);

  // Build props
  const layout = AREA_LAYOUTS[areaId];
  if (layout) {
    for (const prop of layout.props) {
      const mesh = createPrimitive(prop);
      scene.add(mesh);
      areaObjects.push(mesh);
      if (prop.interactive) {
        interactiveObjects.push(mesh);
      }
    }
  }

  // Set player position based on entry direction
  if (fromDirection) {
    const entry = ENTRY_POSITIONS[fromDirection];
    setPlayerPosition(entry.x, entry.z);
  } else if (areaId === 'houseInside') {
    setPlayerPosition(0, 2);
  } else {
    setPlayerPosition(0, 3);
  }

  // Load NPCs for this area
  const npcMeshes = loadNPCsForArea(areaId);
  interactiveObjects.push(...npcMeshes);

  // Spawn dragon if needed
  if (shouldDragonAppear(areaId)) {
    const dragonMesh = spawnDragon(areaId);
    interactiveObjects.push(dragonMesh);
  }

  // Spawn quest items
  const questItemMeshes = spawnQuestItems(areaId);
  interactiveObjects.push(...questItemMeshes);

  // Check escort arrivals
  await checkEscortArrival(areaId);

  // Update UI
  updateAreaLabel(areaDef.name);
  updateNavArrows(areaId);

  // Track visited
  if (!gameState.visitedAreas.includes(areaId)) {
    gameState.visitedAreas.push(areaId);
  }
  gameState.currentArea = areaId;
  saveGame();
}

function updateAreaLabel(name) {
  areaLabel.textContent = name;
  areaLabel.classList.remove('hidden');
  // Fade out after 2 seconds
  setTimeout(() => {
    areaLabel.style.opacity = '0';
    setTimeout(() => {
      areaLabel.classList.add('hidden');
      areaLabel.style.opacity = '';
    }, 300);
  }, 2000);
}

function updateNavArrows(areaId) {
  navArrows.innerHTML = '';
  navArrows.classList.remove('hidden');

  const areaDef = AREAS[areaId];
  if (!areaDef.connections) return;

  for (const [dir, targetId] of Object.entries(areaDef.connections)) {
    const targetArea = AREAS[targetId];
    const btn = document.createElement('button');
    btn.className = `nav-arrow ${dir}`;
    btn.textContent = `${DIR_ARROWS[dir]} ${targetArea.name}`;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      navigateTo(targetId, dir);
    });
    navArrows.appendChild(btn);
  }

  // Special: house interior door-exit goes to house exterior
  if (areaId === 'houseInside') {
    // Door exit handled via interactive object tap, not nav arrow
  }
}

async function navigateTo(targetId, fromDir) {
  // Fade transition
  const fade = document.createElement('div');
  fade.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;z-index:80;transition:opacity 0.3s;pointer-events:none;';
  document.body.appendChild(fade);

  // Fade in
  requestAnimationFrame(() => {
    fade.style.opacity = '1';
  });

  await new Promise((r) => setTimeout(r, 300));

  // Build new area, entering from opposite direction
  const entryDir = OPPOSITE_DIR[fromDir];
  await buildArea(targetId, entryDir);

  // Fade out
  fade.style.opacity = '0';
  setTimeout(() => fade.remove(), 300);
}

async function navigateToInterior(areaId) {
  const fade = document.createElement('div');
  fade.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;z-index:80;transition:opacity 0.3s;pointer-events:none;';
  document.body.appendChild(fade);
  requestAnimationFrame(() => { fade.style.opacity = '1'; });
  await new Promise((r) => setTimeout(r, 300));
  await buildArea(areaId);
  fade.style.opacity = '0';
  setTimeout(() => fade.remove(), 300);
}

// Handle house interior interactions
export function handleAreaInteraction(objectName) {
  if (currentAreaId === 'houseInside') {
    if (objectName === 'door-exit') {
      navigateToInterior('house');
      return true;
    }
    if (['bed', 'stove', 'toothbrush'].includes(objectName)) {
      handleHouseInteraction(objectName);
      return true;
    }
  }
  if (currentAreaId === 'house') {
    if (objectName === 'door') {
      // Enter house interior (no directional transition)
      navigateToInterior('houseInside');
      return true;
    }
    if (objectName === 'mailbox') {
      handleMailbox();
      return true;
    }
  }
  return false;
}

export function getCurrentAreaId() {
  return currentAreaId;
}

export function getGroundMesh() {
  return groundMesh;
}

// Walk-to-edge area transitions. Called from main.js game loop with current player position.
let edgeTransitionLocked = false;
const EDGE_THRESHOLD = 8.5;

export function checkEdgeNavigation(playerPos) {
  if (edgeTransitionLocked || !currentAreaId) return;
  const areaDef = AREAS[currentAreaId];
  if (!areaDef || !areaDef.connections) return;

  let dir = null;
  if (playerPos.x < -EDGE_THRESHOLD && areaDef.connections.left)  dir = 'left';
  if (playerPos.x >  EDGE_THRESHOLD && areaDef.connections.right) dir = 'right';
  if (playerPos.z < -EDGE_THRESHOLD && areaDef.connections.top)   dir = 'top';
  if (playerPos.z >  EDGE_THRESHOLD && areaDef.connections.bottom) dir = 'bottom';

  if (!dir) return;

  edgeTransitionLocked = true;
  navigateTo(areaDef.connections[dir], dir).then(() => {
    edgeTransitionLocked = false;
  });
}

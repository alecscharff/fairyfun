import * as THREE from 'three';
import { scene, camera, renderer, raycaster, pointer } from './engine.js';
import { getGroundMesh, interactiveObjects, handleAreaInteraction } from './areas.js';
import { isDialogueOpen, showDialogue } from './dialogue.js';
import { handleNPCInteraction, getSpawnedItems, pickUpItem } from './quests.js';
import { gameState } from './save.js';
import { ITEM_EMOJI } from './constants.js';
import { updateInventoryUI } from './inventory.js';

// Player model (placeholder: a simple fairy-like figure)
let playerGroup = null;
let targetPosition = null;
let pendingInteraction = null; // callback to fire when Lisa arrives close enough
const INTERACT_DIST = 1.4;    // how close Lisa needs to be to trigger an interaction
const moveSpeed = 5;
let isMoving = false;

// Create a simple placeholder fairy character
function createPlaceholderFairy() {
  const group = new THREE.Group();

  // Body (dress)
  const bodyGeo = new THREE.ConeGeometry(0.4, 1.2, 8);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xda70d6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.25, 12, 8);
  const headMat = new THREE.MeshLambertMaterial({ color: 0xffdab9 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.4;
  group.add(head);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.28, 12, 8);
  const hairMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.5, -0.05);
  hair.scale.set(1, 0.8, 0.9);
  group.add(hair);

  // Wings (two flat planes)
  const wingGeo = new THREE.PlaneGeometry(0.6, 0.8);
  const wingMat = new THREE.MeshLambertMaterial({
    color: 0xb0e0e6,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.4, 1, -0.15);
  wingL.rotation.set(0, -0.4, 0.2);
  group.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.position.set(0.4, 1, -0.15);
  wingR.rotation.set(0, 0.4, -0.2);
  group.add(wingR);

  // Wand (thin cylinder + star tip)
  const wandGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
  const wandMat = new THREE.MeshLambertMaterial({ color: 0xc084fc });
  const wand = new THREE.Mesh(wandGeo, wandMat);
  wand.position.set(0.5, 0.8, 0.2);
  wand.rotation.z = -0.3;
  group.add(wand);

  // Star on wand tip
  const starGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const starMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5 });
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(0.55, 1.1, 0.2);
  group.add(star);

  group.castShadow = true;
  group.name = 'lisa';

  return group;
}

export async function initPlayer() {
  playerGroup = createPlaceholderFairy();
  playerGroup.position.set(0, 0, 2);
  scene.add(playerGroup);
}

export function setPlayerPosition(x, z) {
  if (playerGroup) {
    playerGroup.position.set(x, 0, z);
    targetPosition = null;
    isMoving = false;
  }
}

export function getPlayerPosition() {
  return playerGroup ? playerGroup.position.clone() : new THREE.Vector3();
}

export function getPlayerGroup() {
  return playerGroup;
}

export function updatePlayer(dt) {
  if (!playerGroup || !targetPosition) return;

  const dx = targetPosition.x - playerGroup.position.x;
  const dz = targetPosition.z - playerGroup.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  const arrivalDist = pendingInteraction ? INTERACT_DIST : 0.15;
  if (dist < arrivalDist) {
    isMoving = false;
    targetPosition = null;
    if (pendingInteraction) {
      const cb = pendingInteraction;
      pendingInteraction = null;
      cb();
    }
    return;
  }

  isMoving = true;
  const step = moveSpeed * dt;
  const moveX = (dx / dist) * Math.min(step, dist);
  const moveZ = (dz / dist) * Math.min(step, dist);

  playerGroup.position.x += moveX;
  playerGroup.position.z += moveZ;

  // Face movement direction
  const angle = Math.atan2(dx, dz);
  playerGroup.rotation.y = angle;

  // Simple bob animation while moving
  playerGroup.position.y = Math.sin(Date.now() * 0.008) * 0.08;
}

// Tap/click handler
function onPointerDown(e) {
  // Skip if dialogue is open
  if (isDialogueOpen()) return;

  // Skip if tapping UI elements
  if (e.target !== renderer.domElement) return;

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // Check interactive objects first
  if (interactiveObjects.length > 0) {
    const interactHits = raycaster.intersectObjects(interactiveObjects, true);
    if (interactHits.length > 0) {
      // Walk up to find the interactive root object
      let hitRoot = interactHits[0].object;
      while (hitRoot.parent && hitRoot.parent !== scene) {
        if (hitRoot.userData.interactive || hitRoot.userData.npcId || hitRoot.userData.questItem) break;
        hitRoot = hitRoot.parent;
      }

      // NPC interaction — walk to NPC first
      if (hitRoot.userData.npcId) {
        const npcPos = new THREE.Vector3();
        hitRoot.getWorldPosition(npcPos);
        targetPosition = new THREE.Vector3(npcPos.x, 0, npcPos.z);
        const npcId = hitRoot.userData.npcId;
        pendingInteraction = () => handleNPCInteraction(npcId);
        return;
      }

      // Quest item pickup — walk to item first
      if (hitRoot.userData.questItem) {
        const itemPos = new THREE.Vector3();
        hitRoot.getWorldPosition(itemPos);
        targetPosition = new THREE.Vector3(itemPos.x, 0, itemPos.z);
        const capturedHitRoot = hitRoot;
        pendingInteraction = () => {
          const items = getSpawnedItems();
          for (const [key, mesh] of items) {
            if (mesh === capturedHitRoot) {
              const success = pickUpItem(key);
              if (success) {
                const itemId = capturedHitRoot.userData.questItem;
                const emoji = ITEM_EMOJI[itemId] || '✨';
                showDialogue([{ text: `Got it! ${emoji}`, speaker: 'Lisa 🧚' }]);
                updateInventoryUI();
              }
              return;
            }
          }
        };
        return;
      }

      // Area object interaction (house items, mailbox, doors) — walk first
      let namedObj = interactHits[0].object;
      while (namedObj && !namedObj.name && namedObj.parent) {
        namedObj = namedObj.parent;
      }
      if (namedObj.name) {
        const objPos = new THREE.Vector3();
        namedObj.getWorldPosition(objPos);
        targetPosition = new THREE.Vector3(objPos.x, 0, objPos.z);
        const capturedName = namedObj.name;
        pendingInteraction = () => handleAreaInteraction(capturedName);
        return;
      }
    }
  }

  // Otherwise, tap ground to move
  const ground = getGroundMesh();
  if (!ground) return;

  const groundHits = raycaster.intersectObject(ground);
  if (groundHits.length > 0) {
    const pt = groundHits[0].point;
    targetPosition = new THREE.Vector3(pt.x, 0, pt.z);
  }
}

// Attach once to the renderer's canvas (already imported above)
renderer.domElement.addEventListener('pointerdown', onPointerDown);

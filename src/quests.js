import * as THREE from 'three';
import { scene } from './engine.js';
import { gameState, saveGame } from './save.js';
import { QUEST_ORDER, ITEM_EMOJI } from './constants.js';
import { showDialogue, speak } from './dialogue.js';
import { checkForEvening, doEvening } from './daynight.js';
import { NPC_DEFS } from './npcs.js';

// Quest definitions
export const QUEST_DEFS = {
  'lost-carrot': {
    npc: 'bunny',
    type: 'fetch',
    giveItem: 'carrot',
    itemLocations: [{ item: 'carrot', area: 'creek', pos: [3, 0.3, -2] }],
    puzzleGate: null,
    mailLetter: "Dear Lisa, 💌\nI lost my carrot! 🥕\nCan you help me find it?\n- Bunny 🐰",
    mailAudioKey: 'mail-bunny',
    dialogueNotStarted: [
      { text: "Oh no! I lost my carrot! 🥕", speaker: "Bunny 🐰", audioKey: 'bunny-01' },
      { text: "Can you help me find it?", speaker: "Bunny 🐰", audioKey: 'bunny-02' },
      { text: "I think it is by the big rocks. 🪨", speaker: "Bunny 🐰", audioKey: 'bunny-03' },
    ],
    dialogueHasItem: [
      { text: "You got my carrot! Thank you so much! 🥕🎉", speaker: "Bunny 🐰", audioKey: 'bunny-got-01' },
      { text: "Go home and check the mail! 📬", speaker: "Bunny 🐰", audioKey: 'bunny-got-02' },
    ],
    dialogueDone: [
      { text: "I love my carrot! 🥕💚", speaker: "Bunny 🐰", audioKey: 'bunny-done' },
    ],
  },
  'horn-gem': {
    npc: 'unicorn',
    type: 'fetch',
    giveItem: 'gem',
    itemLocations: [{ item: 'gem', area: 'cave', pos: [2, 0.4, 1] }],
    puzzleGate: 'connections',
    mailLetter: "Dear Lisa, 💌\nMy horn gem is gone! 💎\nIt is in the dark cave.\nCan you help me?\n- Unicorn 🦄",
    mailAudioKey: 'mail-unicorn',
    dialogueNotStarted: [
      { text: "My horn gem is gone! 💎", speaker: "Unicorn 🦄", audioKey: 'unicorn-01' },
      { text: "It is in the cave. But it is so dark!", speaker: "Unicorn 🦄", audioKey: 'unicorn-02' },
      { text: "Can you find it for me?", speaker: "Unicorn 🦄", audioKey: 'unicorn-03' },
    ],
    dialogueHasItem: [
      { text: "My gem! You got it! 💎✨", speaker: "Unicorn 🦄", audioKey: 'unicorn-got-01' },
      { text: "Thank you, Lisa! Go home and check the mail! 📬", speaker: "Unicorn 🦄", audioKey: 'unicorn-got-02' },
    ],
    dialogueDone: [
      { text: "My horn shines so nice now! ✨", speaker: "Unicorn 🦄", audioKey: 'unicorn-done' },
    ],
  },
  'build-nest': {
    npc: 'bird',
    type: 'multi-fetch',
    giveItem: 'twig',
    requiredCount: 3,
    itemLocations: [
      { item: 'twig', area: 'hollow', pos: [-2, 0.2, 0] },
      { item: 'twig', area: 'bushes', pos: [4, 0.2, -1] },
      { item: 'twig', area: 'meadow', pos: [-3, 0.2, 3] },
    ],
    puzzleGate: null,
    mailLetter: "Dear Lisa, 💌\nI need to make a nest! 🪹\nCan you find me 3 twigs? 🌿\n- Bird 🐦",
    mailAudioKey: 'mail-bird',
    dialogueNotStarted: [
      { text: "I need to make a nest! 🪹", speaker: "Bird 🐦", audioKey: 'bird-01' },
      { text: "Can you find me 3 twigs? 🌿", speaker: "Bird 🐦", audioKey: 'bird-02' },
      { text: "Look in the forest!", speaker: "Bird 🐦", audioKey: 'bird-03' },
    ],
    dialogueHasItem: [
      { text: "A twig! Thank you! 🌿", speaker: "Bird 🐦", audioKey: 'bird-got-twig' },
    ],
    dialogueAllItems: [
      { text: "You got all the twigs! Now I can make my nest! 🪹🎉", speaker: "Bird 🐦", audioKey: 'bird-all-01' },
      { text: "Go home and check the mail! 📬", speaker: "Bird 🐦", audioKey: 'bird-all-02' },
    ],
    dialogueDone: [
      { text: "I love my nest! 🪹💚", speaker: "Bird 🐦", audioKey: 'bird-done' },
    ],
  },
  'frog-crown': {
    npc: 'frog',
    type: 'fetch',
    giveItem: 'crown',
    itemLocations: [{ item: 'crown', area: 'cave', pos: [-3, 0.3, 2] }],
    puzzleGate: 'memory',
    mailLetter: "Dear Lisa, 💌\nI lost my crown! 👑\nIt is in the cave.\nCan you find it?\n- Frog 🐸",
    mailAudioKey: 'mail-frog',
    dialogueNotStarted: [
      { text: "I am a frog prince! But I lost my crown! 🐸👑", speaker: "Frog 🐸", audioKey: 'frog-01' },
      { text: "I think it is in the cave.", speaker: "Frog 🐸", audioKey: 'frog-02' },
    ],
    dialogueHasItem: [
      { text: "My crown! You got it! 👑🎉", speaker: "Frog 🐸", audioKey: 'frog-got-01' },
      { text: "Thank you, Lisa! Go home and check the mail! 📬", speaker: "Frog 🐸", audioKey: 'frog-got-02' },
    ],
    dialogueDone: [
      { text: "I feel like a prince! 👑✨", speaker: "Frog 🐸", audioKey: 'frog-done' },
    ],
  },
  'fox-home': {
    npc: 'fox',
    type: 'escort',
    destination: 'glade',
    puzzleGate: 'pattern',
    mailLetter: "Dear Lisa, 💌\nI am lost! 😢\nCan you take me home?\nI live by the big glade.\n- Fox Cub 🦊",
    mailAudioKey: 'mail-fox',
    dialogueNotStarted: [
      { text: "I am lost! 😢", speaker: "Fox Cub 🦊", audioKey: 'fox-01' },
      { text: "Can you help me get home?", speaker: "Fox Cub 🦊", audioKey: 'fox-02' },
      { text: "I live by the big glade.", speaker: "Fox Cub 🦊", audioKey: 'fox-03' },
    ],
    dialogueFollowing: [
      { text: "I will go with you! Let's go! 🦊", speaker: "Fox Cub 🦊", audioKey: 'fox-follow' },
    ],
    dialogueArrived: [
      { text: "This is it! I am home! 🎉", speaker: "Fox Cub 🦊", audioKey: 'fox-arrived-01' },
      { text: "Thank you so much, Lisa! Go home and check the mail! 📬", speaker: "Fox Cub 🦊", audioKey: 'fox-arrived-02' },
    ],
    dialogueDone: [
      { text: "I love it here! 💚", speaker: "Fox Cub 🦊", audioKey: 'fox-done' },
    ],
  },
  'find-mom': {
    npc: 'deer',
    type: 'escort',
    destination: 'glen',
    puzzleGate: 'sorting',
    mailLetter: "Dear Lisa, 💌\nI can not find my mom! 😢\nShe is in the glen.\nCan you take me to her?\n- Baby Deer 🦌",
    mailAudioKey: 'mail-deer',
    dialogueNotStarted: [
      { text: "I can not find my mom! 😢", speaker: "Baby Deer 🦌", audioKey: 'deer-01' },
      { text: "She is in the glen.", speaker: "Baby Deer 🦌", audioKey: 'deer-02' },
      { text: "Can you take me to her?", speaker: "Baby Deer 🦌", audioKey: 'deer-03' },
    ],
    dialogueFollowing: [
      { text: "Let's go find my mom! 🦌", speaker: "Baby Deer 🦌", audioKey: 'deer-follow' },
    ],
    dialogueArrived: [
      { text: "Mom! I found you! 🎉", speaker: "Baby Deer 🦌", audioKey: 'deer-arrived-01' },
      { text: "Thank you, Lisa! Go home and check the mail! 📬", speaker: "Baby Deer 🦌", audioKey: 'deer-arrived-02' },
    ],
    dialogueDone: [
      { text: "I am with my mom now! 💚", speaker: "Baby Deer 🦌", audioKey: 'deer-done' },
    ],
  },
};

// Spawned quest items currently in the scene
let spawnedItems = new Map();

// Escort NPCs following the player
let followingNPCs = new Set();

/**
 * Get the current active quest ID, or null.
 */
export function getActiveQuestId() {
  for (const qId of QUEST_ORDER) {
    if (gameState.quests[qId] === 'active') return qId;
  }
  return null;
}

/**
 * Get the next quest to offer via mailbox.
 */
export function getNextMailQuest() {
  const idx = gameState.currentQuestIndex;
  if (idx >= QUEST_ORDER.length) return null;
  return QUEST_ORDER[idx];
}

/**
 * Handle mailbox tap.
 */
export async function handleMailbox() {
  if (!gameState.hasMailFlag) {
    await showDialogue([
      { text: "No new mail! 📭", speaker: "Lisa 🧚" },
    ]);
    return;
  }

  const nextQuestId = getNextMailQuest();
  if (!nextQuestId) {
    await showDialogue([
      { text: "No more mail! All done! 🎉", speaker: "Lisa 🧚" },
    ]);
    gameState.hasMailFlag = false;
    saveGame();
    return;
  }

  const questDef = QUEST_DEFS[nextQuestId];

  // Show letter overlay
  await showMailLetter(questDef.mailLetter, questDef.mailAudioKey);

  // Activate quest
  gameState.quests[nextQuestId] = 'active';
  gameState.hasMailFlag = false;
  saveGame();

  await showDialogue([
    { text: "I will help! Let's go! 💜", speaker: "Lisa 🧚" },
  ]);
}

function showMailLetter(text, audioKey) {
  return new Promise((resolve) => {
    const letterEl = document.getElementById('mailbox-letter');
    const letterText = letterEl.querySelector('.letter-text');
    const closeBtn = document.getElementById('letter-close-btn');

    letterText.textContent = text;
    letterEl.classList.remove('hidden');

    speak(text, audioKey);

    function onClose(e) {
      e.stopPropagation();
      letterEl.classList.add('hidden');
      closeBtn.removeEventListener('pointerdown', onClose);
      resolve();
    }
    closeBtn.addEventListener('pointerdown', onClose);
  });
}

/**
 * Handle tapping on an NPC.
 */
export async function handleNPCInteraction(npcId) {
  const def = NPC_DEFS[npcId];
  if (!def) return;

  // Dragon interactions
  if (npcId === 'dragon') {
    await handleDragonInteraction();
    return;
  }

  const questId = def.questId;
  if (!questId) return;

  const questDef = QUEST_DEFS[questId];
  const questState = gameState.quests[questId];

  switch (questState) {
    case 'notStarted':
      await showDialogue(questDef.dialogueNotStarted);
      break;

    case 'active':
      await handleActiveQuestNPC(npcId, questId, questDef);
      break;

    case 'complete':
      await showDialogue(questDef.dialogueDone);
      break;
  }
}

async function handleActiveQuestNPC(npcId, questId, questDef) {
  if (questDef.type === 'fetch') {
    // Check if player has the item
    if (playerHasItem(questDef.giveItem)) {
      // Give item
      removeFromInventory(questDef.giveItem);
      await completeQuest(questId, questDef);
    } else {
      // Remind player
      await showDialogue([
        { text: `Can you find my ${questDef.giveItem}? ${ITEM_EMOJI[questDef.giveItem] || ''}`, speaker: NPC_DEFS[questDef.npc].name },
      ]);
    }
  } else if (questDef.type === 'multi-fetch') {
    if (playerHasItem(questDef.giveItem)) {
      gameState.twigCount = (gameState.twigCount || 0) + 1;
      removeFromInventory(questDef.giveItem);
      saveGame();

      if (gameState.twigCount >= questDef.requiredCount) {
        await completeQuest(questId, questDef, 'dialogueAllItems');
      } else {
        await showDialogue(questDef.dialogueHasItem);
        await showDialogue([
          { text: `I need ${questDef.requiredCount - gameState.twigCount} more! 🌿`, speaker: NPC_DEFS[questDef.npc].name },
        ]);
      }
    } else {
      const remaining = questDef.requiredCount - (gameState.twigCount || 0);
      await showDialogue([
        { text: `I still need ${remaining} twigs! 🌿`, speaker: NPC_DEFS[questDef.npc].name },
      ]);
    }
  } else if (questDef.type === 'escort') {
    if (!followingNPCs.has(npcId)) {
      followingNPCs.add(npcId);
      await showDialogue(questDef.dialogueFollowing);
    } else {
      await showDialogue([
        { text: "Let's keep going! 🏃", speaker: NPC_DEFS[questDef.npc].name },
      ]);
    }
  }
}

async function handleDragonInteraction() {
  const activeQuest = getActiveQuestId();

  if (!activeQuest) {
    await showDialogue([
      { text: "Hi Lisa! 🐉", speaker: "Spark 🐉" },
      { text: "Need any help? Just ask!", speaker: "Spark 🐉" },
    ]);
    return;
  }

  // Give a hint based on the active quest
  const hints = {
    'lost-carrot': "I saw a carrot by the creek! 🥕",
    'horn-gem': "The gem is in the cave. I can help see in the dark! 💎",
    'build-nest': "Look for twigs in the forest! 🌿",
    'frog-crown': "The crown is deep in the cave! 👑",
    'fox-home': "The fox needs to go to the glade! 🦊",
    'find-mom': "The deer mom is in the glen! 🦌",
  };

  await showDialogue([
    { text: hints[activeQuest] || "Keep looking! You can do it! 💜", speaker: "Spark 🐉" },
  ]);
}

async function completeQuest(questId, questDef, dialogueKey) {
  const lines = dialogueKey ? questDef[dialogueKey] : questDef.dialogueHasItem;
  await showDialogue(lines);

  gameState.quests[questId] = 'complete';
  gameState.currentQuestIndex++;
  gameState.questsCompletedToday++;
  gameState.hasMailFlag = gameState.currentQuestIndex < QUEST_ORDER.length;
  saveGame();

  // Check if all quests done
  if (gameState.currentQuestIndex >= QUEST_ORDER.length) {
    await showDialogue([
      { text: "You did it! All quests done! 🎉🎉🎉", speaker: "Lisa 🧚" },
      { text: "Thank you for helping everyone!", speaker: "Lisa 🧚" },
      { text: "You are the best fairy! 🧚✨💜", speaker: "" },
    ]);
  }

  // Check for evening
  if (checkForEvening()) {
    await doEvening();
    await showDialogue([
      { text: "It is getting late! 🌅", speaker: "Lisa 🧚" },
      { text: "I need to go home and sleep! 🏠", speaker: "Lisa 🧚" },
    ]);
  }
}

/**
 * Spawn quest items in the given area.
 */
export function spawnQuestItems(areaId) {
  // Clear previous spawned items
  for (const [, mesh] of spawnedItems) {
    scene.remove(mesh);
  }
  spawnedItems.clear();

  // Check all active quests for items in this area
  for (const questId of QUEST_ORDER) {
    if (gameState.quests[questId] !== 'active') continue;
    const questDef = QUEST_DEFS[questId];
    if (!questDef.itemLocations) continue;

    for (const loc of questDef.itemLocations) {
      if (loc.area !== areaId) continue;

      // Don't spawn if already collected (for multi-fetch, track individually)
      // Simple check: just spawn all items for active quests
      const mesh = createQuestItemMesh(loc.item);
      mesh.position.set(...loc.pos);
      mesh.userData.questItem = loc.item;
      mesh.userData.questId = questId;
      mesh.userData.interactive = true;
      scene.add(mesh);
      spawnedItems.set(`${questId}-${loc.item}-${loc.pos.join(',')}`, mesh);
    }
  }

  return Array.from(spawnedItems.values());
}

function createQuestItemMesh(itemType) {
  const group = new THREE.Group();
  let geo, mat;

  switch (itemType) {
    case 'carrot':
      geo = new THREE.ConeGeometry(0.12, 0.5, 6);
      mat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.2 });
      break;
    case 'gem':
      geo = new THREE.OctahedronGeometry(0.2);
      mat = new THREE.MeshLambertMaterial({ color: 0x00bfff, emissive: 0x00bfff, emissiveIntensity: 0.4 });
      break;
    case 'twig':
      geo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
      mat = new THREE.MeshLambertMaterial({ color: 0x8b4513, emissive: 0x8b4513, emissiveIntensity: 0.1 });
      break;
    case 'crown':
      geo = new THREE.TorusGeometry(0.15, 0.04, 6, 12);
      mat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.4 });
      break;
    default:
      geo = new THREE.SphereGeometry(0.15);
      mat = new THREE.MeshLambertMaterial({ color: 0xff69b4, emissive: 0xff69b4, emissiveIntensity: 0.3 });
  }

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  group.name = 'quest-item';

  // Add a glow ring
  const ringGeo = new THREE.RingGeometry(0.25, 0.35, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.1;
  group.add(ring);

  return group;
}

/**
 * Check escort quest completion when entering an area.
 */
export async function checkEscortArrival(areaId) {
  for (const npcId of followingNPCs) {
    const def = NPC_DEFS[npcId];
    if (!def || !def.questId) continue;
    const questDef = QUEST_DEFS[def.questId];
    if (questDef.type !== 'escort') continue;

    if (areaId === questDef.destination) {
      followingNPCs.delete(npcId);
      await completeQuest(def.questId, questDef, 'dialogueArrived');
    }
  }
}

// Inventory helpers (will be replaced by inventory.js in Phase 5)
function playerHasItem(itemId) {
  return gameState.inventory.includes(itemId);
}

function removeFromInventory(itemId) {
  const idx = gameState.inventory.indexOf(itemId);
  if (idx >= 0) gameState.inventory[idx] = null;
  saveGame();
}

/**
 * Pick up a quest item (called when player walks near it).
 */
export function pickUpItem(itemKey) {
  const mesh = spawnedItems.get(itemKey);
  if (!mesh) return false;

  const itemId = mesh.userData.questItem;

  // Find empty inventory slot
  const emptySlot = gameState.inventory.indexOf(null);
  if (emptySlot < 0) return false; // inventory full

  gameState.inventory[emptySlot] = itemId;
  scene.remove(mesh);
  spawnedItems.delete(itemKey);
  saveGame();

  return true;
}

export function getSpawnedItems() {
  return spawnedItems;
}

export function isFollowing(npcId) {
  return followingNPCs.has(npcId);
}

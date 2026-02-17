import { gameState, saveGame } from './save.js';
import { showDialogue } from './dialogue.js';
import { doNight, checkForEvening, doEvening } from './daynight.js';
import { DAY_STATES } from './constants.js';

/**
 * Handle interactions with objects inside Lisa's house.
 * Returns true if an interaction was handled, false otherwise.
 */
export async function handleHouseInteraction(objectName) {
  switch (objectName) {
    case 'bed':
      return await handleBed();
    case 'stove':
      return await handleStove();
    case 'toothbrush':
      return await handleToothbrush();
    default:
      return false;
  }
}

async function handleBed() {
  const ds = gameState.dayState;

  if (ds === DAY_STATES.MORNING || ds === DAY_STATES.DAY) {
    await showDialogue([
      { text: "It is not time to sleep yet! ☀️", speaker: "Lisa 🧚" },
    ]);
    return true;
  }

  if (ds === DAY_STATES.EVENING || ds === DAY_STATES.NIGHT) {
    if (!gameState.hasBrushedTeeth) {
      await showDialogue([
        { text: "I need to brush my teeth first! 🪥", speaker: "Lisa 🧚", audioKey: 'house-brush-first' },
      ]);
      return true;
    }

    await showDialogue([
      { text: "Time to sleep! Good night! 🌙", speaker: "Lisa 🧚", audioKey: 'house-goodnight' },
      { text: "Zzz... 💤", speaker: "", audioKey: 'house-zzz' },
    ]);

    await doNight();
    return true;
  }

  return true;
}

async function handleStove() {
  // Check if there's an active cooking quest
  const activeQuest = getCurrentCookingQuest();

  if (activeQuest) {
    await showDialogue([
      { text: "Time to cook! Yum! It is done! 🎉", speaker: "Lisa 🧚", audioKey: 'house-cook-done' },
    ]);
    // Cooking logic will be connected in quests.js Phase 4
    return true;
  }

  await showDialogue([
    { text: "My stove! I can cook here. 🍳", speaker: "Lisa 🧚", audioKey: 'house-stove-idle' },
  ]);
  return true;
}

async function handleToothbrush() {
  if (gameState.hasBrushedTeeth) {
    await showDialogue([
      { text: "My teeth are all clean! ✨", speaker: "Lisa 🧚", audioKey: 'house-brush-done' },
    ]);
    return true;
  }

  await showDialogue([
    { text: "Brush, brush, brush! So clean! ✨", speaker: "Lisa 🧚", audioKey: 'house-brush-do' },
  ]);

  gameState.hasBrushedTeeth = true;
  saveGame();
  return true;
}

function getCurrentCookingQuest() {
  // Will be implemented when quest system is built
  // For now, check if frog-crown quest is active (needs stove to polish crown)
  if (gameState.quests['frog-crown'] === 'active') {
    return 'frog-crown';
  }
  return null;
}

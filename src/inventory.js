import { gameState, saveGame } from './save.js';
import { ITEM_EMOJI } from './constants.js';

const inventoryEl = document.getElementById('inventory');
const slots = inventoryEl.querySelectorAll('.slot');

let selectedIndex = -1;

export function initInventoryUI() {
  inventoryEl.classList.remove('hidden');
  updateInventoryUI();

  // Tap slot to select/deselect
  slots.forEach((slot, i) => {
    slot.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (gameState.inventory[i] === null) return;

      if (selectedIndex === i) {
        // Deselect
        selectedIndex = -1;
      } else {
        selectedIndex = i;
      }
      updateSlotStyles();
    });
  });
}

export function updateInventoryUI() {
  slots.forEach((slot, i) => {
    const item = gameState.inventory[i];
    slot.textContent = item ? (ITEM_EMOJI[item] || '?') : '';
  });
  updateSlotStyles();
}

function updateSlotStyles() {
  slots.forEach((slot, i) => {
    slot.classList.toggle('selected', i === selectedIndex);
  });
}

export function getSelectedItem() {
  if (selectedIndex < 0) return null;
  return gameState.inventory[selectedIndex];
}

export function clearSelection() {
  selectedIndex = -1;
  updateSlotStyles();
}

/**
 * Set glow on slots that match the given item type.
 */
export function setGlowForItem(itemType) {
  slots.forEach((slot, i) => {
    slot.classList.toggle('glow', gameState.inventory[i] === itemType);
  });
}

export function clearGlow() {
  slots.forEach((slot) => {
    slot.classList.remove('glow');
  });
}

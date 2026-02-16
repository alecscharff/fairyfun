import * as THREE from 'three';
import { scene, ambientLight, sunLight } from './engine.js';
import { gameState, saveGame } from './save.js';
import { DAY_STATES } from './constants.js';
import { showDialogue } from './dialogue.js';

// Sky colors for each time of day
const SKY_COLORS = {
  morning: new THREE.Color(0xffd4a0),
  day: new THREE.Color(0x87ceeb),
  evening: new THREE.Color(0xff8c42),
  night: new THREE.Color(0x1a1a3e),
};

const AMBIENT_INTENSITY = {
  morning: 0.6,
  day: 0.7,
  evening: 0.4,
  night: 0.2,
};

const SUN_INTENSITY = {
  morning: 0.7,
  day: 0.9,
  evening: 0.5,
  night: 0.1,
};

let isTransitioning = false;

/**
 * Apply lighting/sky for the current day state immediately (no lerp).
 */
export function applyDayState() {
  const state = gameState.dayState;
  scene.background = SKY_COLORS[state].clone();
  ambientLight.intensity = AMBIENT_INTENSITY[state];
  sunLight.intensity = SUN_INTENSITY[state];
}

/**
 * Smoothly transition to a new day state over ~1 second.
 */
export async function transitionDayState(newState) {
  if (isTransitioning) return;
  isTransitioning = true;

  const oldColor = scene.background.clone();
  const newColor = SKY_COLORS[newState].clone();
  const oldAmbient = ambientLight.intensity;
  const newAmbient = AMBIENT_INTENSITY[newState];
  const oldSun = sunLight.intensity;
  const newSun = SUN_INTENSITY[newState];

  const duration = 1000;
  const start = Date.now();

  await new Promise((resolve) => {
    function step() {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = t * t * (3 - 2 * t); // smoothstep

      scene.background.copy(oldColor).lerp(newColor, ease);
      ambientLight.intensity = oldAmbient + (newAmbient - oldAmbient) * ease;
      sunLight.intensity = oldSun + (newSun - oldSun) * ease;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    step();
  });

  gameState.dayState = newState;
  saveGame();
  isTransitioning = false;
}

/**
 * Check if it's time for evening based on quests completed today.
 * Call this after completing a quest.
 */
export function checkForEvening() {
  if (gameState.dayState === DAY_STATES.DAY && gameState.questsCompletedToday >= 2) {
    return true;
  }
  return false;
}

/**
 * Trigger the morning sequence.
 */
export async function doMorning() {
  await transitionDayState(DAY_STATES.MORNING);
  await showDialogue([
    { text: "Good morning! ☀️", speaker: "Lisa 🧚" },
  ]);
  // Transition to full day after a moment
  setTimeout(() => {
    transitionDayState(DAY_STATES.DAY);
  }, 2000);
  gameState.hasBrushedTeeth = false;
  gameState.questsCompletedToday = 0;
  saveGame();
}

/**
 * Trigger the evening warning.
 */
export async function doEvening() {
  await transitionDayState(DAY_STATES.EVENING);
}

/**
 * Trigger night (after going to bed).
 */
export async function doNight() {
  await transitionDayState(DAY_STATES.NIGHT);
  // Fade to black, then morning
  const fade = document.createElement('div');
  fade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:80;transition:opacity 1s;pointer-events:none;';
  document.body.appendChild(fade);

  await new Promise((r) => {
    requestAnimationFrame(() => { fade.style.opacity = '1'; });
    setTimeout(r, 1200);
  });

  // Reset to morning
  await doMorning();

  // Fade back in
  fade.style.opacity = '0';
  setTimeout(() => fade.remove(), 1000);
}

// Initialize on load
export function initDayNight() {
  applyDayState();
}

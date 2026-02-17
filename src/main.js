import * as THREE from 'three';
import { scene, camera, renderer, updateMixers } from './engine.js';
import { INTRO_LINES } from './constants.js';
import { loadSave, gameState } from './save.js';
import { showDialogue, speak } from './dialogue.js';
import { initAreas, buildArea, checkEdgeNavigation } from './areas.js';
import { initPlayer, updatePlayer, getPlayerPosition } from './player.js';
import { initDayNight } from './daynight.js';
import { initInventoryUI } from './inventory.js';
import { updateNPCs } from './npcs.js';
import { initParticles, updateParticles } from './particles.js';
import { getPlayerGroup } from './player.js';
import { restoreEscortState } from './quests.js';

const clock = new THREE.Clock();

// ===== Title Screen =====

const titleScreen = document.getElementById('title-screen');
const introScreen = document.getElementById('intro-screen');
const introText = document.getElementById('intro-text');
const introNextBtn = document.getElementById('intro-next-btn');
const loadingScreen = document.getElementById('loading-screen');

let introIndex = 0;

function showIntroLine() {
  if (introIndex >= INTRO_LINES.length) {
    // Done with intro, start game
    introScreen.classList.add('fade-out');
    setTimeout(() => {
      introScreen.classList.add('hidden');
      startGame();
    }, 600);
    return;
  }
  introText.textContent = INTRO_LINES[introIndex];
  speak(INTRO_LINES[introIndex], `intro-0${introIndex + 1}`);
}

introNextBtn.addEventListener('pointerdown', () => {
  introIndex++;
  showIntroLine();
});

document.getElementById('play-btn').addEventListener('pointerdown', () => {
  titleScreen.classList.add('fade-out');
  setTimeout(() => {
    titleScreen.classList.add('hidden');
    introScreen.classList.remove('hidden');
    introIndex = 0;
    showIntroLine();
  }, 600);
});

// ===== Game Boot =====

async function boot() {
  loadSave();
  restoreEscortState();
  initDayNight();
  await initAreas();
  await initPlayer();

  // Hide loading screen
  loadingScreen.classList.add('fade-out');
  setTimeout(() => loadingScreen.classList.add('hidden'), 400);

  // Start render loop (but game stays behind title/intro screens)
  renderer.setAnimationLoop(gameLoop);
}

async function startGame() {
  initInventoryUI();
  initParticles(getPlayerGroup());

  // Build the starting area
  await buildArea(gameState.currentArea);

  // If new game, show morning wake-up dialogue
  if (gameState.isNewGame) {
    await showDialogue([
      { text: "Good morning! ☀️", speaker: "Lisa 🧚", audioKey: 'morning-01' },
      { text: "Time to brush my teeth! 🪥", speaker: "Lisa 🧚", audioKey: 'morning-02' },
      { text: "Then I can check the mail! 📬", speaker: "Lisa 🧚", audioKey: 'morning-03' },
    ]);
    gameState.isNewGame = false;
  }
}

function gameLoop() {
  const dt = clock.getDelta();
  updatePlayer(dt);
  checkEdgeNavigation(getPlayerPosition());
  updateNPCs(dt, getPlayerPosition());
  updateParticles(dt);
  updateMixers(dt);
  renderer.render(scene, camera);
}

// Boot on load
boot();

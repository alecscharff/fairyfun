import * as THREE from 'three';
import { scene, camera, renderer, updateMixers } from './engine.js';
import { INTRO_LINES } from './constants.js';
import { loadSave, gameState } from './save.js';
import { showDialogue } from './dialogue.js';
import { initAreas, buildArea } from './areas.js';
import { initPlayer, updatePlayer } from './player.js';
import { initDayNight } from './daynight.js';
import { initInventoryUI } from './inventory.js';
import { updateNPCs } from './npcs.js';
import { initParticles, updateParticles } from './particles.js';
import { getPlayerGroup } from './player.js';

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
  // TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      INTRO_LINES[introIndex].replace(/[^\w\s!?.,']/g, '')
    );
    utter.rate = 0.85;
    utter.pitch = 1.1;
    window.speechSynthesis.speak(utter);
  }
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
      { text: "Good morning! ☀️", speaker: "Lisa 🧚" },
      { text: "Time to brush my teeth! 🪥", speaker: "Lisa 🧚" },
      { text: "Then I can check the mail! 📬", speaker: "Lisa 🧚" },
    ]);
    gameState.isNewGame = false;
  }
}

function gameLoop() {
  const dt = clock.getDelta();
  updatePlayer(dt);
  updateNPCs(dt);
  updateParticles(dt);
  updateMixers(dt);
  renderer.render(scene, camera);
}

// Boot on load
boot();

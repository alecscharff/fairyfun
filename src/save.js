import { QUEST_ORDER } from './constants.js';

const SAVE_KEY = 'fairyfun-save';

const defaultState = {
  currentArea: 'houseInside',
  inventory: [null, null, null, null],
  quests: Object.fromEntries(QUEST_ORDER.map((q) => [q, 'notStarted'])),
  puzzlesSolved: [],
  visitedAreas: ['houseInside', 'house'],
  currentQuestIndex: 0,
  hasMailFlag: true,
  dayState: 'morning',
  questsCompletedToday: 0,
  hasBrushedTeeth: false,
  twigCount: 0,
  isNewGame: true,
  collectedItems: [], // Track which items have been picked up (itemKeys)
};

export let gameState = structuredClone(defaultState);

export function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

export function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      gameState = { ...structuredClone(defaultState), ...saved };
      gameState.isNewGame = false;
    } catch {
      gameState = structuredClone(defaultState);
    }
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  gameState = structuredClone(defaultState);
}

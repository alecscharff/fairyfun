// Area connection graph
export const AREAS = {
  house: {
    name: "Lisa's House 🏠",
    ground: 'grass',
    connections: { right: 'glade' },
    isInterior: false,
  },
  houseInside: {
    name: "Lisa's House 🏠",
    ground: 'wood',
    connections: {},
    isInterior: true,
  },
  glade: {
    name: 'Fairy Glade 🌸',
    ground: 'grass',
    connections: { left: 'house', right: 'meadow', bottom: 'creek' },
  },
  meadow: {
    name: 'Mushroom Meadow 🍄',
    ground: 'grass',
    connections: { left: 'glade', right: 'hollow', top: 'glen' },
  },
  glen: {
    name: 'Unicorn Glen 🦄',
    ground: 'grass',
    connections: { bottom: 'meadow' },
  },
  hollow: {
    name: 'Old Oak Hollow 🌳',
    ground: 'dirt',
    connections: { left: 'meadow', right: 'cave' },
  },
  cave: {
    name: 'Sparkle Cave ✨',
    ground: 'dirt',
    connections: { left: 'hollow', bottom: 'bushes' },
  },
  creek: {
    name: 'Crystal Creek 💧',
    ground: 'grass',
    connections: { top: 'glade', right: 'bushes' },
  },
  bushes: {
    name: 'Berry Bush Meadow 🫐',
    ground: 'grass',
    connections: { left: 'creek', top: 'cave' },
  },
};

// Direction opposites (for placing Lisa at correct edge)
export const OPPOSITE_DIR = {
  left: 'right',
  right: 'left',
  top: 'bottom',
  bottom: 'top',
};

// Arrow labels
export const DIR_ARROWS = {
  left: '←',
  right: '→',
  top: '↑',
  bottom: '↓',
};

// Entry positions per direction (where Lisa appears when entering from that edge)
export const ENTRY_POSITIONS = {
  left: { x: -7, z: 0 },
  right: { x: 7, z: 0 },
  top: { x: 0, z: -5 },
  bottom: { x: 0, z: 5 },
};

// Day states
export const DAY_STATES = {
  MORNING: 'morning',
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
};

// Quest IDs in order
export const QUEST_ORDER = [
  'lost-carrot',
  'horn-gem',
  'build-nest',
  'frog-crown',
  'fox-home',
  'find-mom',
];

// Item emoji map
export const ITEM_EMOJI = {
  carrot: '🥕',
  gem: '💎',
  twig: '🌿',
  crown: '👑',
  cake: '🎂',
};

// Intro story lines
export const INTRO_LINES = [
  "This is Lisa. She is a fairy! 🧚",
  "Lisa lives in a cute home in the magic forest. 🌲✨",
  "Her forest friends need help!",
  "Can you help them? 💜",
];

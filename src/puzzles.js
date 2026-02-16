import { gameState, saveGame } from './save.js';

const puzzleOverlay = document.getElementById('puzzle-overlay');

/**
 * Open a puzzle. Returns a Promise that resolves when the player completes it.
 */
export function openPuzzle(puzzleType) {
  if (gameState.puzzlesSolved.includes(puzzleType)) {
    return Promise.resolve(); // already solved
  }

  return new Promise((resolve) => {
    puzzleOverlay.innerHTML = '';
    puzzleOverlay.classList.remove('hidden');

    switch (puzzleType) {
      case 'connections':
        runConnections(puzzleOverlay, resolve);
        break;
      case 'memory':
        runMemory(puzzleOverlay, resolve);
        break;
      case 'pattern':
        runPattern(puzzleOverlay, resolve);
        break;
      case 'sorting':
        runSorting(puzzleOverlay, resolve);
        break;
      default:
        closePuzzle(resolve);
    }
  });
}

function closePuzzle(resolve) {
  puzzleOverlay.classList.add('hidden');
  puzzleOverlay.innerHTML = '';
  resolve();
}

function markSolved(puzzleType, resolve) {
  gameState.puzzlesSolved.push(puzzleType);
  saveGame();
  // Show success message briefly
  puzzleOverlay.innerHTML = `
    <div style="text-align:center;color:#fef3c7;">
      <p style="font-size:48px;margin-bottom:16px;">🎉</p>
      <p style="font-size:32px;font-family:Fredoka,sans-serif;">Good job!</p>
    </div>
  `;
  setTimeout(() => closePuzzle(resolve), 1500);
}

// ===== CONNECTIONS PUZZLE =====
// Sort 8 items into 2 groups of 4

function runConnections(container, resolve) {
  const groups = {
    'Can Fly ✈️': ['🐦 Bird', '🦋 Bug', '🐝 Bee', '🦆 Duck'],
    'Can Swim 🏊': ['🐟 Fish', '🐸 Frog', '🐢 Turtle', '🐙 Octopus'],
  };

  const allItems = [...groups['Can Fly ✈️'], ...groups['Can Swim 🏊']];
  shuffle(allItems);

  let selected = [];
  let solvedGroups = 0;

  const html = `
    <div style="max-width:480px;width:90%;text-align:center;">
      <h2 style="color:#fef3c7;font-family:Fredoka,sans-serif;font-size:28px;margin-bottom:16px;">
        Sort into two groups! 🧩
      </h2>
      <div id="puzzle-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
      </div>
      <p id="puzzle-msg" style="color:#fef3c7;font-size:20px;min-height:30px;font-family:Fredoka,sans-serif;"></p>
      <button id="puzzle-check" class="big-btn" style="margin-top:12px;">Check ✅</button>
    </div>
  `;
  container.innerHTML = html;

  const grid = container.querySelector('#puzzle-grid');
  const msg = container.querySelector('#puzzle-msg');
  const checkBtn = container.querySelector('#puzzle-check');

  function renderItems() {
    grid.innerHTML = '';
    allItems.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        font-size:22px;padding:14px 8px;border-radius:16px;border:3px solid #c084fc;
        background:${selected.includes(i) ? '#7c3aed' : '#fff'};
        color:${selected.includes(i) ? '#fff' : '#1e1b4b'};
        font-family:Fredoka,sans-serif;cursor:pointer;min-height:56px;
        transition:background 0.15s,color 0.15s;
      `;
      btn.textContent = item;
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (selected.includes(i)) {
          selected = selected.filter((s) => s !== i);
        } else if (selected.length < 4) {
          selected.push(i);
        }
        renderItems();
      });
      grid.appendChild(btn);
    });
  }

  checkBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (selected.length !== 4) {
      msg.textContent = 'Pick 4 items! ☝️';
      return;
    }

    const selectedItems = selected.map((i) => allItems[i]);
    const groupNames = Object.keys(groups);

    for (const gName of groupNames) {
      const groupItems = groups[gName];
      if (selectedItems.every((item) => groupItems.includes(item))) {
        solvedGroups++;
        msg.textContent = `Yes! ${gName}! 🌟`;
        // Remove solved items
        const remaining = allItems.filter((_, i) => !selected.includes(i));
        allItems.length = 0;
        allItems.push(...remaining);
        selected = [];

        if (solvedGroups >= 2 || allItems.length === 0) {
          setTimeout(() => markSolved('connections', resolve), 800);
        } else {
          setTimeout(renderItems, 800);
        }
        return;
      }
    }

    msg.textContent = 'Not quite! Try again! 💪';
    selected = [];
    renderItems();
  });

  renderItems();
}

// ===== MEMORY MATCH =====
// Flip cards to find matching pairs

function runMemory(container, resolve) {
  const emojis = ['🌸', '🍄', '🌈', '🦋', '⭐', '🌙'];
  const cards = [...emojis, ...emojis];
  shuffle(cards);

  let flipped = [];
  let matched = new Set();
  let canFlip = true;

  const html = `
    <div style="max-width:420px;width:90%;text-align:center;">
      <h2 style="color:#fef3c7;font-family:Fredoka,sans-serif;font-size:28px;margin-bottom:16px;">
        Find the pairs! 🃏
      </h2>
      <div id="memory-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      </div>
      <p id="memory-msg" style="color:#fef3c7;font-size:20px;min-height:30px;margin-top:12px;font-family:Fredoka,sans-serif;"></p>
    </div>
  `;
  container.innerHTML = html;

  const grid = container.querySelector('#memory-grid');
  const msg = container.querySelector('#memory-msg');

  function renderCards() {
    grid.innerHTML = '';
    cards.forEach((emoji, i) => {
      const card = document.createElement('button');
      const isFlipped = flipped.includes(i) || matched.has(i);
      card.style.cssText = `
        width:100%;aspect-ratio:1;font-size:32px;border-radius:12px;
        border:3px solid #c084fc;cursor:pointer;
        background:${matched.has(i) ? '#86efac' : isFlipped ? '#fff' : '#7c3aed'};
        color:${isFlipped ? '#000' : '#7c3aed'};
        font-family:Fredoka,sans-serif;min-height:56px;
        transition:background 0.2s;
      `;
      card.textContent = isFlipped ? emoji : '?';
      card.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (!canFlip || flipped.includes(i) || matched.has(i)) return;

        flipped.push(i);
        renderCards();

        if (flipped.length === 2) {
          canFlip = false;
          const [a, b] = flipped;
          if (cards[a] === cards[b]) {
            matched.add(a);
            matched.add(b);
            flipped = [];
            canFlip = true;
            msg.textContent = 'Match! 🌟';

            if (matched.size === cards.length) {
              setTimeout(() => markSolved('memory', resolve), 800);
            } else {
              renderCards();
            }
          } else {
            msg.textContent = 'Not a match!';
            setTimeout(() => {
              flipped = [];
              canFlip = true;
              msg.textContent = '';
              renderCards();
            }, 1000);
          }
        }
      });
      grid.appendChild(card);
    });
  }

  renderCards();
}

// ===== PATTERN PUZZLE =====
// Complete a color/shape sequence

function runPattern(container, resolve) {
  const patterns = [
    { seq: ['🔴', '🔵', '🔴', '🔵', '🔴'], answer: '🔵', options: ['🔵', '🟢', '🔴'] },
    { seq: ['⭐', '🌙', '⭐', '🌙', '⭐'], answer: '🌙', options: ['⭐', '🌙', '☀️'] },
    { seq: ['🟣', '🟣', '🟡', '🟣', '🟣'], answer: '🟡', options: ['🟣', '🟡', '🔴'] },
  ];

  let round = 0;

  function showRound() {
    const p = patterns[round];
    const html = `
      <div style="max-width:480px;width:90%;text-align:center;">
        <h2 style="color:#fef3c7;font-family:Fredoka,sans-serif;font-size:28px;margin-bottom:16px;">
          What comes next? 🔮
        </h2>
        <div style="display:flex;gap:12px;justify-content:center;align-items:center;margin-bottom:24px;">
          ${p.seq.map((s) => `<span style="font-size:36px;">${s}</span>`).join('')}
          <span style="font-size:36px;color:#fef3c7;">❓</span>
        </div>
        <div id="pattern-options" style="display:flex;gap:16px;justify-content:center;">
        </div>
        <p id="pattern-msg" style="color:#fef3c7;font-size:20px;min-height:30px;margin-top:16px;font-family:Fredoka,sans-serif;"></p>
      </div>
    `;
    container.innerHTML = html;

    const optionsDiv = container.querySelector('#pattern-options');
    const msg = container.querySelector('#pattern-msg');

    const shuffled = [...p.options];
    shuffle(shuffled);

    shuffled.forEach((opt) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        font-size:40px;padding:12px 20px;border-radius:16px;border:3px solid #c084fc;
        background:#fff;cursor:pointer;min-width:64px;min-height:64px;
        transition:background 0.15s;
      `;
      btn.textContent = opt;
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (opt === p.answer) {
          msg.textContent = 'Yes! 🌟';
          round++;
          if (round >= patterns.length) {
            setTimeout(() => markSolved('pattern', resolve), 800);
          } else {
            setTimeout(showRound, 800);
          }
        } else {
          msg.textContent = 'Try again! 💪';
          btn.style.background = '#fecaca';
          setTimeout(() => { btn.style.background = '#fff'; }, 500);
        }
      });
      optionsDiv.appendChild(btn);
    });
  }

  showRound();
}

// ===== BERRY SORTING =====
// Sort berries by color into baskets

function runSorting(container, resolve) {
  const berries = [
    { emoji: '🔴', color: 'red' },
    { emoji: '🔵', color: 'blue' },
    { emoji: '🔴', color: 'red' },
    { emoji: '🔵', color: 'blue' },
    { emoji: '🔴', color: 'red' },
    { emoji: '🔵', color: 'blue' },
    { emoji: '🔴', color: 'red' },
    { emoji: '🔵', color: 'blue' },
  ];
  shuffle(berries);

  let currentBerry = 0;
  let sorted = 0;

  function showBerry() {
    if (currentBerry >= berries.length) {
      markSolved('sorting', resolve);
      return;
    }

    const b = berries[currentBerry];
    const html = `
      <div style="max-width:420px;width:90%;text-align:center;">
        <h2 style="color:#fef3c7;font-family:Fredoka,sans-serif;font-size:28px;margin-bottom:16px;">
          Sort the berries! 🫐🍓
        </h2>
        <p style="font-size:20px;color:#fef3c7;margin-bottom:8px;font-family:Fredoka,sans-serif;">
          ${sorted} of ${berries.length} sorted
        </p>
        <div style="font-size:64px;margin:20px 0;">${b.emoji}</div>
        <p style="color:#fef3c7;font-size:20px;margin-bottom:16px;font-family:Fredoka,sans-serif;">
          Which basket? ⬇️
        </p>
        <div style="display:flex;gap:24px;justify-content:center;">
          <button id="basket-red" style="
            font-size:28px;padding:16px 28px;border-radius:16px;border:3px solid #ef4444;
            background:#fecaca;cursor:pointer;font-family:Fredoka,sans-serif;min-height:64px;
          ">🔴 Red</button>
          <button id="basket-blue" style="
            font-size:28px;padding:16px 28px;border-radius:16px;border:3px solid #3b82f6;
            background:#bfdbfe;cursor:pointer;font-family:Fredoka,sans-serif;min-height:64px;
          ">🔵 Blue</button>
        </div>
        <p id="sort-msg" style="color:#fef3c7;font-size:20px;min-height:30px;margin-top:16px;font-family:Fredoka,sans-serif;"></p>
      </div>
    `;
    container.innerHTML = html;

    const msg = container.querySelector('#sort-msg');

    container.querySelector('#basket-red').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      checkSort('red', msg);
    });
    container.querySelector('#basket-blue').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      checkSort('blue', msg);
    });
  }

  function checkSort(color, msg) {
    if (color === berries[currentBerry].color) {
      sorted++;
      currentBerry++;
      msg.textContent = 'Yes! 🌟';
      setTimeout(showBerry, 500);
    } else {
      msg.textContent = 'Not that one! Try again! 💪';
    }
  }

  showBerry();
}

// ===== UTILITIES =====

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

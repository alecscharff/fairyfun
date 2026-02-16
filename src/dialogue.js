// Speech bubble dialogue system with TTS

let currentLines = [];
let currentIndex = 0;
let onCompleteCallback = null;
let isSpeaking = false;

const dialogueEl = document.getElementById('dialogue');
const speakerEl = dialogueEl.querySelector('.speaker');
const textEl = dialogueEl.querySelector('.text');
const nextBtn = dialogueEl.querySelector('.next-btn');

nextBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  advanceLine();
});

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ''));
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  utterance.onend = () => { isSpeaking = false; };
  isSpeaking = true;
  window.speechSynthesis.speak(utterance);
}

function showLine() {
  if (currentIndex >= currentLines.length) {
    closeDialogue();
    return;
  }
  const line = currentLines[currentIndex];
  speakerEl.textContent = line.speaker || '';
  textEl.textContent = line.text;
  speak(line.text);
}

function advanceLine() {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
  currentIndex++;
  if (currentIndex >= currentLines.length) {
    closeDialogue();
  } else {
    showLine();
  }
}

function closeDialogue() {
  dialogueEl.classList.add('hidden');
  currentLines = [];
  currentIndex = 0;
  if (onCompleteCallback) {
    const cb = onCompleteCallback;
    onCompleteCallback = null;
    cb();
  }
}

/**
 * Show a sequence of dialogue lines.
 * @param {Array<{text: string, speaker?: string}>} lines
 * @returns {Promise<void>} resolves when all lines are dismissed
 */
export function showDialogue(lines) {
  return new Promise((resolve) => {
    currentLines = lines;
    currentIndex = 0;
    onCompleteCallback = resolve;
    dialogueEl.classList.remove('hidden');
    showLine();
  });
}

export function isDialogueOpen() {
  return !dialogueEl.classList.contains('hidden');
}

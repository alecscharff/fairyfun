// Speech bubble dialogue system with TTS
// Uses pre-generated OpenAI audio when available, falls back to Web Speech API.

import { AUDIO, TEXT_TO_KEY } from './audioManifest.js';

let currentLines = [];
let currentIndex = 0;
let onCompleteCallback = null;
let isSpeaking = false;
let currentAudio = null;

const dialogueEl = document.getElementById('dialogue');
const speakerEl = dialogueEl.querySelector('.speaker');
const textEl = dialogueEl.querySelector('.text');
const nextBtn = dialogueEl.querySelector('.next-btn');

nextBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  advanceLine();
});

/**
 * Try to play a pre-generated MP3 audio file.
 * Returns true if audio started, false if not available.
 */
function playAudioFile(text, audioKey) {
  // Look up by explicit key first, then by cleaned text
  const cleanedText = text.replace(/[^\w\s'!?.,]/g, '').trim().toLowerCase();
  const key = audioKey || TEXT_TO_KEY[cleanedText];
  const url = key ? AUDIO[key] : null;

  if (!url) return false;

  const audio = new Audio(url);
  currentAudio = audio;
  isSpeaking = true;

  // Guard against both error event and play().catch() both firing
  let fallbackTriggered = false;

  audio.addEventListener('ended', () => {
    isSpeaking = false;
    currentAudio = null;
  });

  audio.addEventListener('error', () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    isSpeaking = false;
    currentAudio = null;
    speakFallback(text);
  });

  audio.play().catch(() => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    speakFallback(text);
  });

  return true;
}

/**
 * Web Speech API fallback (browser built-in TTS).
 */
function speakFallback(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ''));
  utterance.rate = 0.85;
  utterance.pitch = 1.15;
  utterance.volume = 1;
  utterance.onend = () => { isSpeaking = false; };
  isSpeaking = true;
  window.speechSynthesis.speak(utterance);
}

export function speak(text, audioKey) {
  // Stop everything before starting new speech
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;

  const usedFile = playAudioFile(text, audioKey);
  if (!usedFile) {
    speakFallback(text);
  }
}

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
}

function showLine() {
  if (currentIndex >= currentLines.length) {
    closeDialogue();
    return;
  }
  const line = currentLines[currentIndex];
  speakerEl.textContent = line.speaker || '';
  textEl.textContent = line.text;
  speak(line.text, line.audioKey);
}

function advanceLine() {
  stopSpeaking();
  currentIndex++;
  if (currentIndex >= currentLines.length) {
    closeDialogue();
  } else {
    showLine();
  }
}

function closeDialogue() {
  stopSpeaking();
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
 * Lines can optionally include { audioKey: 'key-name' } to use a specific audio file.
 * @param {Array<{text: string, speaker?: string, audioKey?: string}>} lines
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

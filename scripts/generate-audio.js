/**
 * generate-audio.js
 *
 * Pre-generates all dialogue audio for FairyFun using OpenAI TTS.
 * Run once (or whenever text changes):
 *
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.js
 *
 * Outputs:
 *   public/audio/dialogue/<key>.mp3
 *   src/audioManifest.js           (auto-generated, commit this)
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'audio', 'dialogue');
const MANIFEST_PATH = join(ROOT, 'src', 'audioManifest.js');

mkdirSync(OUT_DIR, { recursive: true });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== VOICE PROFILES =====
// Using gpt-4o-mini-tts with per-character instructions for expressiveness

const VOICES = {
  // Lisa the fairy: cheerful, warm, curious young girl
  lisa: {
    voice: 'nova',
    instructions: 'Speak as a cheerful, warm, and curious young fairy girl. Your voice is bright and enthusiastic, with a gentle magical quality. You are kind and sweet, speaking clearly and at a moderate pace suitable for young children.',
  },
  // Narrator / UI: gentle storytelling narrator
  narrator: {
    voice: 'nova',
    instructions: 'Speak as a warm, gentle storytelling narrator for a children\'s fairy tale. Your voice is calm and inviting, with a sense of wonder. Speak clearly and slowly for young children.',
  },
  // Bunny: soft, sweet, a little dramatic when upset
  bunny: {
    voice: 'shimmer',
    instructions: 'Speak as a sweet, soft little bunny. Your voice is gentle and slightly high-pitched. When sad about losing something, sound a little dramatic but still cute. Very warm and friendly.',
  },
  // Unicorn: gentle, magical, slightly ethereal
  unicorn: {
    voice: 'shimmer',
    instructions: 'Speak as a gentle, magical unicorn. Your voice is soft and a little ethereal, with a sense of wonder and grace. Warm but slightly formal, like a kind and wise creature.',
  },
  // Bird: light, quick, chirpy energy
  bird: {
    voice: 'shimmer',
    instructions: 'Speak as a cheerful little bird. Your voice is light and quick with chirpy energy. Enthusiastic and sweet, slightly breathless with excitement. Very expressive.',
  },
  // Frog: a bit pompous (frog prince!) but friendly underneath
  frog: {
    voice: 'alloy',
    instructions: 'Speak as a frog who thinks he is a prince. Your voice is slightly pompous and formal, but still friendly and loveable. A little deeper than the other animals, with a hint of self-importance that is charming rather than annoying.',
  },
  // Fox Cub: small, a little scared/lost, hopeful
  fox: {
    voice: 'shimmer',
    instructions: 'Speak as a small, lost fox cub. Your voice is a little timid and sad at first, but hopeful and sweet. Slightly small and soft-voiced, but perks up with enthusiasm when happy.',
  },
  // Baby Deer: very young, soft, a little teary
  deer: {
    voice: 'shimmer',
    instructions: 'Speak as a very young baby deer who is lost and looking for mom. Your voice is soft, slightly teary, and very young-sounding. Sweet and gentle, with relief and joy when things go well.',
  },
  // Dragon (Spark): playful, enthusiastic, slightly gravelly but friendly
  dragon: {
    voice: 'echo',
    instructions: 'Speak as Spark, a small friendly dragon who is Lisa\'s best friend. Your voice is playful and enthusiastic with a tiny bit of gravel to it. Very expressive and encouraging, like a loyal and excited friend. Not scary at all - silly and loveable.',
  },
};

// ===== ALL DIALOGUE TEXT =====
// Each entry: { key, text, speaker }
// key becomes the filename: public/audio/dialogue/<key>.mp3

const LINES = [
  // ---- INTRO ----
  { key: 'intro-01', text: 'This is Lisa. She is a fairy!', speaker: 'narrator' },
  { key: 'intro-02', text: 'Lisa lives in a cute home in the magic forest.', speaker: 'narrator' },
  { key: 'intro-03', text: 'Her forest friends need help!', speaker: 'narrator' },
  { key: 'intro-04', text: 'Can you help them?', speaker: 'narrator' },

  // ---- NEW GAME / MORNING ----
  { key: 'morning-01', text: 'Good morning!', speaker: 'lisa' },
  { key: 'morning-02', text: 'Time to brush my teeth!', speaker: 'lisa' },
  { key: 'morning-03', text: 'Then I can check the mail!', speaker: 'lisa' },
  { key: 'morning-wake', text: 'Good morning!', speaker: 'lisa' },

  // ---- HOUSE INTERACTIONS ----
  { key: 'house-no-sleep', text: 'It is not time to sleep yet!', speaker: 'lisa' },
  { key: 'house-brush-first', text: 'I need to brush my teeth first!', speaker: 'lisa' },
  { key: 'house-goodnight', text: 'Time to sleep! Good night!', speaker: 'lisa' },
  { key: 'house-zzz', text: 'Zzzz...', speaker: 'lisa' },
  { key: 'house-cook-done', text: 'Time to cook! Yum! It is done!', speaker: 'lisa' },
  { key: 'house-stove-idle', text: 'My stove! I can cook here.', speaker: 'lisa' },
  { key: 'house-brush-do', text: 'Brush, brush, brush! So clean!', speaker: 'lisa' },
  { key: 'house-brush-done', text: 'My teeth are all clean!', speaker: 'lisa' },

  // ---- EVENING / NIGHT ----
  { key: 'evening-late', text: 'It is getting late!', speaker: 'lisa' },
  { key: 'evening-go-home', text: 'I need to go home and sleep!', speaker: 'lisa' },

  // ---- MAILBOX ----
  { key: 'mail-none', text: 'No new mail!', speaker: 'lisa' },
  { key: 'mail-all-done', text: 'No more mail! All done!', speaker: 'lisa' },
  { key: 'mail-lets-go', text: 'I will help! Let\'s go!', speaker: 'lisa' },

  // ---- ITEM PICKUP ----
  { key: 'pickup-carrot', text: 'Got it! A carrot!', speaker: 'lisa' },
  { key: 'pickup-gem', text: 'Got it! A shiny gem!', speaker: 'lisa' },
  { key: 'pickup-twig', text: 'Got it! A twig!', speaker: 'lisa' },
  { key: 'pickup-crown', text: 'Got it! A crown!', speaker: 'lisa' },
  { key: 'pickup-generic', text: 'Got it!', speaker: 'lisa' },
  { key: 'inventory-full', text: 'My bag is full! I need to give something away first.', speaker: 'lisa' },

  // ---- QUEST 1: LOST CARROT (BUNNY) ----
  { key: 'bunny-01', text: 'Oh no! I lost my carrot!', speaker: 'bunny' },
  { key: 'bunny-02', text: 'Can you help me find it?', speaker: 'bunny' },
  { key: 'bunny-03', text: 'I think it is by the big rocks.', speaker: 'bunny' },
  { key: 'bunny-got-01', text: 'You got my carrot! Thank you so much!', speaker: 'bunny' },
  { key: 'bunny-got-02', text: 'Go home and check the mail!', speaker: 'bunny' },
  { key: 'bunny-done', text: 'I love my carrot!', speaker: 'bunny' },
  { key: 'bunny-remind', text: 'Can you find my carrot? I think it is by the creek!', speaker: 'bunny' },
  { key: 'mail-bunny', text: 'Dear Lisa. I lost my carrot! Can you help me find it? From Bunny.', speaker: 'narrator' },

  // ---- QUEST 2: HORN GEM (UNICORN) ----
  { key: 'unicorn-01', text: 'My horn gem is gone!', speaker: 'unicorn' },
  { key: 'unicorn-02', text: 'It is in the cave. But it is so dark!', speaker: 'unicorn' },
  { key: 'unicorn-03', text: 'Can you find it for me?', speaker: 'unicorn' },
  { key: 'unicorn-got-01', text: 'My gem! You got it!', speaker: 'unicorn' },
  { key: 'unicorn-got-02', text: 'Thank you, Lisa! Go home and check the mail!', speaker: 'unicorn' },
  { key: 'unicorn-done', text: 'My horn shines so nice now!', speaker: 'unicorn' },
  { key: 'mail-unicorn', text: 'Dear Lisa. My horn gem is gone! It is in the dark cave. Can you help me? From Unicorn.', speaker: 'narrator' },

  // ---- QUEST 3: BUILD A NEST (BIRD) ----
  { key: 'bird-01', text: 'I need to make a nest!', speaker: 'bird' },
  { key: 'bird-02', text: 'Can you find me three twigs?', speaker: 'bird' },
  { key: 'bird-03', text: 'Look in the forest!', speaker: 'bird' },
  { key: 'bird-got-twig', text: 'A twig! Thank you!', speaker: 'bird' },
  { key: 'bird-all-01', text: 'You got all the twigs! Now I can make my nest!', speaker: 'bird' },
  { key: 'bird-all-02', text: 'Go home and check the mail!', speaker: 'bird' },
  { key: 'bird-done', text: 'I love my nest!', speaker: 'bird' },
  { key: 'mail-bird', text: 'Dear Lisa. I need to make a nest! Can you find me three twigs? From Bird.', speaker: 'narrator' },

  // ---- QUEST 4: FROG CROWN (FROG) ----
  { key: 'frog-01', text: 'I am a frog prince! But I lost my crown!', speaker: 'frog' },
  { key: 'frog-02', text: 'I think it is in the cave.', speaker: 'frog' },
  { key: 'frog-got-01', text: 'My crown! You got it!', speaker: 'frog' },
  { key: 'frog-got-02', text: 'Thank you, Lisa! Go home and check the mail!', speaker: 'frog' },
  { key: 'frog-done', text: 'I feel like a prince!', speaker: 'frog' },
  { key: 'mail-frog', text: 'Dear Lisa. I lost my crown! It is in the cave. Can you find it? From Frog.', speaker: 'narrator' },

  // ---- QUEST 5: FOX HOME (FOX CUB) ----
  { key: 'fox-01', text: 'I am lost!', speaker: 'fox' },
  { key: 'fox-02', text: 'Can you help me get home?', speaker: 'fox' },
  { key: 'fox-03', text: 'I live by the big glade.', speaker: 'fox' },
  { key: 'fox-follow', text: 'I will go with you! Let\'s go!', speaker: 'fox' },
  { key: 'fox-arrived-01', text: 'This is it! I am home!', speaker: 'fox' },
  { key: 'fox-arrived-02', text: 'Thank you so much, Lisa! Go home and check the mail!', speaker: 'fox' },
  { key: 'fox-done', text: 'I love it here!', speaker: 'fox' },
  { key: 'mail-fox', text: 'Dear Lisa. I am lost! Can you take me home? I live by the big glade. From Fox Cub.', speaker: 'narrator' },

  // ---- QUEST 6: FIND MOM (DEER) ----
  { key: 'deer-01', text: 'I can not find my mom!', speaker: 'deer' },
  { key: 'deer-02', text: 'She is in the glen.', speaker: 'deer' },
  { key: 'deer-03', text: 'Can you take me to her?', speaker: 'deer' },
  { key: 'deer-follow', text: 'Let\'s go find my mom!', speaker: 'deer' },
  { key: 'deer-arrived-01', text: 'Mom! I found you!', speaker: 'deer' },
  { key: 'deer-arrived-02', text: 'Thank you, Lisa! Go home and check the mail!', speaker: 'deer' },
  { key: 'deer-done', text: 'I am with my mom now!', speaker: 'deer' },
  { key: 'mail-deer', text: 'Dear Lisa. I can not find my mom! She is in the glen. Can you take me to her? From Baby Deer.', speaker: 'narrator' },

  // ---- DRAGON (SPARK) ----
  { key: 'dragon-hi', text: 'Hi Lisa! Need any help? Just ask!', speaker: 'dragon' },
  { key: 'dragon-hint-carrot', text: 'I saw a carrot by the creek!', speaker: 'dragon' },
  { key: 'dragon-hint-gem', text: 'The gem is in the cave. I can help you see in the dark!', speaker: 'dragon' },
  { key: 'dragon-hint-nest', text: 'Look for twigs in the forest!', speaker: 'dragon' },
  { key: 'dragon-hint-crown', text: 'The crown is deep in the cave!', speaker: 'dragon' },
  { key: 'dragon-hint-fox', text: 'The fox needs to go to the glade!', speaker: 'dragon' },
  { key: 'dragon-hint-deer', text: 'The deer mom is in the glen!', speaker: 'dragon' },
  { key: 'dragon-cheer', text: 'Keep looking! You can do it!', speaker: 'dragon' },

  // ---- END GAME ----
  { key: 'end-01', text: 'You did it! All quests are done!', speaker: 'lisa' },
  { key: 'end-02', text: 'Thank you for helping everyone!', speaker: 'lisa' },
  { key: 'end-03', text: 'You are the best fairy!', speaker: 'narrator' },

  // ---- PUZZLES (instructions) ----
  { key: 'puzzle-connections', text: 'Sort these into two groups!', speaker: 'narrator' },
  { key: 'puzzle-memory', text: 'Find the pairs! Flip the cards!', speaker: 'narrator' },
  { key: 'puzzle-pattern', text: 'What comes next?', speaker: 'narrator' },
  { key: 'puzzle-sorting', text: 'Sort the berries into the right baskets!', speaker: 'narrator' },
  { key: 'puzzle-correct', text: 'Good job!', speaker: 'narrator' },
];

// ===== GENERATE =====

async function generateLine(entry) {
  const outPath = join(OUT_DIR, `${entry.key}.mp3`);

  // Skip if already generated (re-run safe)
  if (existsSync(outPath)) {
    console.log(`  skip  ${entry.key}.mp3 (exists)`);
    return;
  }

  const profile = VOICES[entry.speaker] || VOICES.narrator;

  try {
    const response = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: profile.voice,
      input: entry.text,
      instructions: profile.instructions,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(outPath, buffer);
    console.log(`  done  ${entry.key}.mp3  (${Math.round(buffer.length / 1024)}kb)`);
  } catch (err) {
    console.error(`  FAIL  ${entry.key}:`, err.message);
  }
}

async function generateManifest() {
  const lines = LINES.map(
    (e) => `  '${e.key}': '${process.env.BASE_URL || '/fairyfun'}/audio/dialogue/${e.key}.mp3',`
  ).join('\n');

  const content = `// AUTO-GENERATED by scripts/generate-audio.js -- do not edit by hand
// Re-generate with: OPENAI_API_KEY=sk-... node scripts/generate-audio.js

export const AUDIO = {
${lines}
};

/** Map dialogue text (cleaned) to audio key, for auto-lookup in dialogue.js */
export const TEXT_TO_KEY = {
${LINES.map((e) => `  ${JSON.stringify(cleanText(e.text))}: '${e.key}',`).join('\n')}
};
`;

  writeFileSync(MANIFEST_PATH, content);
  console.log(`\nWrote src/audioManifest.js (${LINES.length} entries)`);
}

function cleanText(text) {
  return text.replace(/[^\w\s'!?.,]/g, '').trim().toLowerCase();
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.error('Usage: OPENAI_API_KEY=sk-... node scripts/generate-audio.js');
    process.exit(1);
  }

  console.log(`Generating ${LINES.length} audio files with OpenAI gpt-4o-mini-tts...\n`);

  // Generate in batches of 5 to avoid rate limits
  for (let i = 0; i < LINES.length; i += 5) {
    const batch = LINES.slice(i, i + 5);
    await Promise.all(batch.map(generateLine));
  }

  await generateManifest();
  console.log('\nDone! Commit public/audio/dialogue/*.mp3 and src/audioManifest.js');
}

main();

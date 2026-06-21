import type { ArtifactAudio } from "./game-types";

const R2 = "https://pub-7cade8eb643747dca43395d8b4505070.r2.dev/artifacts/alchemist/audio";

export const ALCHEMIST_AUDIO: ArtifactAudio = {
  bgm: `${R2}/bgm.mp3`,
  bgmVolume: 0.15,
  scenes: {
    "node-1-pyramids": {
      narrator: `${R2}/scene-1-narrator.mp3`,
      character: `${R2}/scene-1-character.mp3`,
      characterDelay: 3000,
    },
    "node-2-robbers": {
      narrator: `${R2}/scene-2-narrator.mp3`,
      character: `${R2}/scene-2-character.mp3`,
      characterDelay: 2500,
    },
    "node-3-truth": {
      narrator: `${R2}/scene-3-narrator.mp3`,
      character: `${R2}/scene-3-character.mp3`,
      characterDelay: 2000,
    },
    "node-4-revelation": {
      narrator: `${R2}/scene-4-narrator.mp3`,
      character: `${R2}/scene-4-character.mp3`,
      characterDelay: 3000,
    },
    "node-5-victory": {
      narrator: `${R2}/scene-5-narrator.mp3`,
    },
  },
};

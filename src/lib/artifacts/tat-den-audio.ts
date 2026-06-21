import type { ArtifactAudio } from "./game-types";

const R2 = "https://pub-7cade8eb643747dca43395d8b4505070.r2.dev/artifacts/tat-den/audio";

export const TAT_DEN_AUDIO: ArtifactAudio = {
  bgm: `${R2}/bgm.mp3`,
  bgmVolume: 0.12,
  scenes: {
    "scene-1-caring": {
      narrator: `${R2}/scene-1-narrator.mp3`,
      character: `${R2}/scene-1-character.mp3`,
      characterDelay: 3000,
    },
    "scene-2-intruders": {
      narrator: `${R2}/scene-2-narrator.mp3`,
      character: `${R2}/scene-2-character.mp3`,
      characterDelay: 2500,
    },
    "scene-3-breaking-point": {
      narrator: `${R2}/scene-3-narrator.mp3`,
      character: `${R2}/scene-3-character.mp3`,
      characterDelay: 2000,
    },
    "scene-4-fight-back": {
      narrator: `${R2}/scene-4-narrator.mp3`,
    },
    "scene-5-aftermath": {
      narrator: `${R2}/scene-5-narrator.mp3`,
      character: `${R2}/scene-5-character.mp3`,
      characterDelay: 4000,
    },
  },
};
